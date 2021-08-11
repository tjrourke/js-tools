/* global $, console, jQuery, jquery-mask, numeral, HtmlTools, PaymentWizard */

/**
 * Data logic handler for the ACH tools in the PaymentWizard.
 * 
 * @param {any} options
 * @param {any} htmlTools
 */
var AchDataHandler = function (options, htmlTools) {
    //#region member variables
    var routNumLength = 9;
    var acctNumMinLength = 4;

    // Element selectors used by jQuery.
    var selectors = options.selectors;
    // Element IDs used to help with data binding in jQuery.
    var bindIds = options.dataBindingIds;
    // Default values used to initialize data.
    var defaults = options.defaults;
    // The settings used to load the wizard.
    var wiz = options.wiz;
    var wizBtnIds = wiz.controlIds.buttons;

    // Used to change title in JavaScript when ACH steps are loaded.
    var pageTitleSuffix = " - Policy Holder Portal - Berkshire United";

    //#endregion member variables

    //#region inject wizard event callbacks.
    // Handle a call to clear values in a step.
    wiz.clearValues = clearValues;

    // Step.index = 1; Select to pay full or pay other amount
    var step1 = wiz.steps[0];
    step1.enter = function () {
        enterPaymentSelectionStep(step1);
    };
    step1.leave = leavePaymentSelectionsStep;
    step1.leaveSetState = leaveBankAccountStepSetState;

    // Step.index = 2; Select existing bank info or enter bank new info.
    var step2 = wiz.steps[1];
    step2.enterSetState = function () {
        enterBankInfoSetState(step2);
    };
    step2.leave = handleBankInfoSelection;

    // Step.index = 3; Verify payment and bank info, and submit the payment.
    var step3 = wiz.steps[2];
    step3.enter = function () {
        enterVerifyStep(null, step3);
    };
    step3.enterSetState = function () {
        enterVerifyStepSetState(null, step3);
    };

    // Step.index = 4; Finish and show transaction ID
    var step4 = wiz.steps[3];
    step4.enterSetState = function () {
        enterFinishSetState(step4);
    };
    step4.leave = leaveFinishStep;

    // Inject main control callbacks.
    wiz.apis = $.extend({}, wiz.apis, {
        cancel: function () { window.location.href = options.urls.cancel; },
        delete: function () { return deleteCurrentSavedBankAccount(); },
        save: function () { return postPayment(); }
    });
    //#endregion inject wizard event callbacks.

    //#region Tweak the model used by the Binder.
    // Load JSON data from hidden element.
    model = JSON.parse($(selectors.paymentModel).val());
    model = $.extend(model, {
        accountSelectionShowEnter: false,
        accountSelectionShowReadOnly: false
    });

    model.TotalDue = htmlTools.formatCurrency(model.TotalDue, false);
    var modAchInfo = model.AchInformation;
    modAchInfo.SavedBankAccounts.forEach(function (item) {
        if (item.BankAccountType == 0) {
            item.AccountType = 'Checking';
            item.AccountTypeId = 0;
        } else {
            item.AccountType = 'Saving';
            item.AccountTypeId = 1;
        }
    });

    function initializeSelectedAccount() {
        model.AchInformation.AccountTypeId = 0;
        handleAccountSelectionChange(-1);
    }

    initializeSelectedAccount();

    // Handle user selecting a bank account or other option
    if (typeof model.accountSelectionChange !== 'function') {
        model.accountSelectionChange = function (event) {
            handleAccountSelectionChange(event.target.value);
        };
    }

    /**
     * Handles a change to the bank information selection UI, or a selection by code.
     * @param {any} newValue The new value to set the selected ID.
     */
    function handleAccountSelectionChange(newValue) {
        var achInfo = model.AchInformation;
        model.achAccountSelection = newValue;

        htmlTools.showHideElement('enterBankAccountInfo', model.achAccountSelection == 0);
        htmlTools.showHideElement('showBankAccountInfo', model.achAccountSelection > 0);

        var selectedId = model.achAccountSelection;
        if (selectedId <= 0) {
            achInfo.SelectedBankAccountInfo = $.extend({}, achInfo.DefaultBankAccount);
            achInfo.SelectedBankAccountInfoId = selectedId;
        } else {
            var savedAcct = achInfo.SavedBankAccounts.find(element => element.BankAccountInfoId == selectedId);
            achInfo.SelectedBankAccountInfo = $.extend(achInfo.DefaultBankAccount, savedAcct);
            achInfo.SelectedBankAccountInfoId = achInfo.SelectedBankAccountInfo.BankAccountInfoId;
        }

        setAchControlState();
    }

    // Handle the Next button state
    if (typeof model.disEnableNextState !== 'function') {
        model.disEnableNextState = function () {
            setAchControlState();
        };
    }

    // Handle the user selection on how to pay - full or other amount
    if (typeof model.setHowToPay !== 'function') {
        model.setHowToPay = function (event) {
            model.HowToPay = event.srcElement.value;
            if (model.HowToPay === 1) {
                updateCurrencyFormats();
            }
        }
    }

    function updateCurrencyFormats() {
        $(selectors.currencyInput).each(function () {
            htmlTools.formatCurrencyElement($(this), false);
        });
        $(selectors.currencyText).each(function () {
            htmlTools.formatCurrencyElement($(this), false);
        });
    }

    //#endregion Tweak the model used by the Binder.

    //#region implement wizard step enter and leave functions

    /**
     * Force the ACH control state on loading the bank account info page.
     * @param {any} stepInstance The wizard step data object.
     * */
    function enterBankInfoSetState(stepInstance) {
        setStepPageTitle(stepInstance);
        setAchControlState();
        if (model.AchInformation?.SelectedBankAccountInfoId < 0) {
            $(wizBtnIds.next).prop('disabled', true);
        }
    }

    /**
     * The wizard is finishing the process. Set the state of controls for the Finish step before it is shown.
     * @param {any} stepInstance The wizard step data object.
     */
    function enterFinishSetState(stepInstance) {
        setStepPageTitle(stepInstance);
        $('#confirmedDraftAmount').trigger('change');
        $('#one-time-header').hide();
        $('.wizard-progress').hide();
        $('.wizard-labels').hide();
    }

    /**
     * The wizard is changing to the Payment Selection step; set the title for the parent page.
     * @param {any} stepInstance The wizard step data object.
     */
    function enterPaymentSelectionStep(stepInstance) {
        setStepPageTitle(stepInstance);
    }

    /**
     * The wizard is changing to the Verify step; ensure the confirmed Draft Amount is updated.
     *
     * @param {Object} fromStep - The active step, which the user is moving away from. This can be null, in the case of loading the first step.
     * @param {Object} toStep - The step the user wants to get to. This can be null, as in the case when the fromStep parameter represents the final step in the wizard.
     */
    function enterVerifyStep(fromStep, toStep) {
        setStepPageTitle(toStep);
        $(bindIds.confirmedDraftAmount)
            .text(model.DraftAmount)
            .trigger('change');

        if (model.AchInformation?.SelectedBankAccountInfoId < 0) {
            $(wizBtnIds.next).prop('disabled', true);
        }
    }

    /**
     * Set the state of controls for the Verify step before it is shown.
     * 
     * @param {Object} fromStep - The active step, which the user is moving away from. This can be null, in the case of loading the first step.
     * @param {Object} toStep - The step the user wants to get to. This can be null, as in the case when the fromStep parameter represents the final step in the wizard.
     */
    function enterVerifyStepSetState(fromStep, toStep) {
        setStepPageTitle(toStep);
        $(wizBtnIds.clear).hide();
        $(wizBtnIds.finish).prop('disabled', !model.TermsAccepted);
        htmlTools.formatCurrencyElement($(bindIds.verify.draftAmount), false);
        $(selectors.termsAcceptedCheck).prop('checked', model.TermsAccepted);
    }

    /**
     * The wizard is moving away from the Bank Account selection/entry step. Ensure the right data is in the Selected Bank Account Info object.
     * 
     * @param {Object} fromStep - The active step, which the user is moving away from. This can be null, in the case of loading the first step.
     * @param {Object} toStep - The step the user wants to get to. This can be null, as in the case when the fromStep parameter represents the final step in the wizard.
     */
    function handleBankInfoSelection(fromStep, toStep) {
        var achInfo = model.AchInformation;
        if (achInfo.SelectedBankAccountInfoId == 0) {
            model.AchInformation.SelectedBankAccountInfo = $.extend({},
                options.defaults.achInfo,
                {
                    AccountType: achInfo.AccountType,
                    AccountTypeId: achInfo.AccountTypeId,
                    AchInformationId: achInfo.SelectedBankAccountInfoId,
                    BankAccountName: achInfo.BankAccountName,
                    BankAccountNumber: achInfo.BankAccountNumber,
                    BankName: achInfo.BankName,
                    InsuredId: model.InsuredId,
                    IsActive: true,
                    MaskedAccountNumber: htmlTools.maskNumber(achInfo.BankAccountNumber),
                    MaskedRoutingNumber: htmlTools.maskNumber(achInfo.RoutingNumber),
                    RoutingNumber: achInfo.RoutingNumber
                }
            );
        }

        binder.refresh();
        setAchControlState();
    }

    /**
     * The wizard is leaaving the Bank Account step; update other controls as necessary.
     */
    function leaveBankAccountStepSetState() {
        setAchControlState();
    }

    /**
     * The wizard is leaving the Finish step; handle any actions necessary.
     * 
     * @param {Object} fromStep - The active step, which the user is moving away from. This can be null, in the case of loading the first step.
     * @param {Object} toStep - The step the user wants to get to. This can be null, as in the case when the fromStep parameter represents the final step in the wizard.
     */
    function leaveFinishStep(fromStep, toStep) {
        setAchControlState();
    }

    /**
     * The wizard is leaving the Payment Selection step.
     * 
     * @param {Object} fromStep - The active step, which the user is moving away from. This can be null, in the case of loading the first step.
     * @param {Object} toStep - The step the user wants to get to. This can be null, as in the case when the fromStep parameter represents the final step in the wizard.
     */
    function leavePaymentSelectionsStep(fromStep, toStep) {
        // Update payments per policy from user input.
        var payments = model.PolicyPayments;
        $.each($('.policy-payments'), function () {
            var policyId = getPolicyIdFromPaymentElement($(this));
            var paymentObj = payments.find(item => item.PolicyId === policyId);
            if ($(bindIds.payFullAmount).is(':checked')) {
                paymentObj.PaymentAmount = paymentObj.AmountDue;
            } else {
                var amountElement = $(this).find(selectors.currencyInput);
                paymentObj.PaymentAmount = amountElement.val();
            }
        });

        model.DraftAmount = numeral($('#totalPaymentAmount').text()).value();
        var drftAmt = (model.HowToPay == 0)
            ? numeral(model.TotalDue).value()
            : numeral(model.DraftAmount).value();
        setDraftAmount(drftAmt);
        binder.refresh();
    }

    function setStepPageTitle(stepInstance) {
        if (stepInstance != null && stepInstance.pageTitle) {
            document.title = stepInstance.pageTitle + pageTitleSuffix;
        }
    }

    //#endregion implement wizard step enter and leave functions

    //#region private functions

    /**
     * Returns true if the ACH account number and the re-enter value don't match, or are too short or too long.
     */
    function accountNumbersNotValid() {
        var repeatValue = $(bindIds.ach.accountNumberRepeat).val();
        var acctNumber = $(bindIds.ach.accountNumber).val();
        return (acctNumber.length < acctNumMinLength
            || (!repeatValue || repeatValue.length < acctNumMinLength)
            || (repeatValue != acctNumber));
    }

    /**
     * Returns true if no data has been entered for a bank account.
     */
    function achInputIsEmpty() {
        var achIds = bindIds.ach;
        return $(achIds.accountNumber).val() == ''
            && $(achIds.bankName).val() == ''
            && $(achIds.bankAccountName).val() == ''
            && $(achIds.routingNumber).val() == ''
            && $(achIds.accountNumber).val() == '';
    }

    /**
     * Clears the selected bank account input and replaces it with default values.
     */
    function clearActiveBankAccount() {
        if (typeof model.AchInformationId === 'undefined' || model.AchInformationId == 0) {
            model.AchInformation.AccountType = 'Checking';
            model.AchInformation.AccountTypeId = 0;
            model.AchInformation.AchInformationId = 0;
            model.AchInformation.BankAccountName = '';
            model.AchInformation.BankAccountNumber = '';
            model.AchInformation.BankName = '';
            model.AchInformation.InsuredId = 0;
            model.AchInformation.IsActive = true;
            model.AchInformation.MaskedAccountNumber = '';
            model.AchInformation.MaskedRoutingNumber = '';
            model.AchInformation.RoutingNumber = '';

            $(bindIds.ach.accountNumberRepeat).val('');
            $(bindIds.ach.routingNumberRepeat).val('');
        }

        if (typeof model.SelectedBankAccountInfoId === 'undefined' || model.SelectedBankAccountInfoId > 0) {
            model.AchInformation.SelectedBankAccountInfo = $.extend({}, defaults.achInfo);
        }

        if (typeof model.SelectedBankAccountInfoId === 'undefined' || model.SelectedBankAccountInfoId < 0) {
            model.SelectedBankAccountInfoId = -1;
            $(achIds.savedAccountId).val(-1);
            handleAccountSelectionChange(-1);
        } else {
            setAchControlState();
        }
    }

    /**
     * Clears the user selections and input in the "pay other amount" part of the payment selection page.
     */
    function clearPaymentOptions() {
        var payments = model.PolicyPayments;
        $.each($('.policy-payments'), function () {
            var policyId = getPolicyIdFromPaymentElement($(this));
            var paymentObj = payments.find(item => item.policyId = policyId);
            var amountElement = $(this).find(selectors.currencyInput);
            paymentObj.paymentAmount = 0;
            amountElement.val(0);
        });
        var total = htmlTools.sumValues(selectors.currencyInput);
        $(bindIds.draftAmount).text(total).trigger('change');
        $(selectors.currencyInput).trigger('change');

        setAchControlState();
    }

    /**
     * Clears the values of the current step, if applicable.
     */
    function clearValues(currentStepIndex) {
        switch (currentStepIndex) {
            case 1:
                clearPaymentOptions();
                break;
            case 2:
                clearActiveBankAccount();
                break;
        }
    }

    /**
     * Deletes the currently-selected saved bank account
     */
    function deleteCurrentSavedBankAccount() {
        var achInfo = model.AchInformation;
        if (achInfo.SelectedBankAccountInfoId > 0
            && achInfo.SelectedBankAccountInfo != null) {
            return postDelete(achInfo.SelectedBankAccountInfo);
        } else {
            return null;
        }
    }

    /**
     * Returns true if bank account info input is a duplicate of existing info.
     */
    function enteredBankInfoIsDuplicate() {
        var achInfo = model.AchInformation;
        if (achInfo.SavedBankAccounts.length === 0 || achInfo.BankAccountName === '')
            return false;

        var foundDupes = achInfo.SavedBankAccounts.filter(item => item.BankAccountName === achInfo.BankAccountName && item.IsActive === true);
        return (typeof foundDupes === 'undefined') ? false : (foundDupes.length > 0);
    }

    /**
     * Gets the policy ID from the element with the payment.
     * 
     * @param {Element} paymentElement - The element with the payment ID atttribute.
     */
    function getPolicyIdFromPaymentElement(paymentElement) {
        var id = paymentElement.attr('id');
        return parseInt(id.split('-')[2], 10);
    }

    /**
     * Return true if any criteria for valid bank info input is not satisfied.
     * */
    function isBankAccountInfoEntryInvalid() {
        var rnInvalid = routingNumbersNotValid();
        var acctInvalid = accountNumbersNotValid();
        var acctDuped = enteredBankInfoIsDuplicate();
        return rnInvalid || acctInvalid || acctDuped || $(bindIds.ach.bankName).val() == '';
    }

    /**
     * Posts a request to the server.
     * 
     * @param {Object} data The data to post.
     * @param {string} url The URL to the API endpoint.
     */
    function postAction(data, url) {
        var spinner = $('#saveSpinner');
        spinner.prop("hidden", false);
        return fetch(url, {
            body: JSON.stringify(data),
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            method: 'POST'
        }).then(response => {
            console.log(`Result: ${response.status}`);
            spinner.prop("hidden", true);
            return response.json();
        }).catch(error => {
            spinner.prop("hidden", true);
            console.error('Error:', error);
        });
    }

    /**
    * Posts a request to delete the selected bank account info.
    * 
    * @param {bankAccountInfoItem} data The account info data to remove.
    */
    function postDelete(bankAccountInfoItem) {
        if (!bankAccountInfoItem) {
            bankAccountInfoItem = model.SelectedBankAccountInfo;
        }

        return postAction(bankAccountInfoItem, options.urls.delete)
            .then(result => {
                if (result) {
                    removeSavedBankAccountInfo(bankAccountInfoItem);
                } else {
                    throw new Error("Error");
                }
            });
    }

    /**
    * Posts the current payment model to the server.
    */
    function postPayment() {
        var data = $.extend({}, model);
        if (typeof data.TotalDue.value === 'function') {
            model.TotalDue = model.TotalDue.value();
        }

        if (typeof data.DraftAmount.value === 'function') {
            setDraftAmount(data.DraftAmount.value());
        }

        return postAction(model, options.urls.save)
            .then(result => {
                if (result) {
                    var textResult = result.jsonModel;
                    model = JSON.parse(textResult);
                    model.JsonModel = textResult;
                    binder.refresh();
                    return true;
                } else {
                    throw new Error("Error");
                }
            });
    }

    /**
     * Removes a deleted bank account item from the drop-down.
     * 
     * @param {Object} bankAccountInfoItem - The deleted bank account item to remove from the UI.
     */
    function removeSavedBankAccountInfo(bankAccountInfoItem) {
        var removeId = bankAccountInfoItem.BankAccountInfoId;
        var endId = -1;
        var achIds = bindIds.ach;
        var achInfo = model.AchInformation;
        achInfo.SavedBankAccounts = achInfo.SavedBankAccounts.filter(item => item.BankAccountInfoId !== removeId);
        $(achIds.savedAccountId + ' option:selected')
            .remove()
            .val(endId)
            .trigger('change');

        handleAccountSelectionChange(endId);
        return true;
    }

    /**
    * Returns true if the ACH routing number and the re-enter value don't match, or are not 9 characters in length.
    */
    function routingNumbersNotValid() {
        var rtNumber = $(bindIds.ach.routingNumber).val();
        var repeatValue = $(bindIds.ach.routingNumberRepeat).val();
        return (rtNumber.length != routNumLength
            || (!repeatValue || repeatValue.length != routNumLength)
            || (repeatValue != rtNumber));
    }

    /**
     * Updates the state of the controls in the bank information UI.
     * */
    function setAchControlState() {
        var accountId = numeral(model.AchInformation?.SelectedBankAccountInfoId).value();
        var nextBtn = $(wizBtnIds.next);
        var activeStepDiv = $('div.wizard-pages div.step-active');
        var isDisabled = false;
        if (activeStepDiv.length > 0) {
            switch (activeStepDiv.attr('id')) {
                case 'wizard-step-1':
                    var testTotal = $(bindIds.payFullAmount).is(':checked')
                        ? numeral(model.TotalDue).value()
                        :numeral(model.DraftAmount).value();

                    nextBtn.prop('disabled', testTotal <= 0);
                    break;

                case 'wizard-step-2':
                    if (accountId < 0) {
                        isDisabled = true;
                    } else if (accountId == 0) {
                        isDisabled = (achInputIsEmpty()) ? true : isBankAccountInfoEntryInvalid();
                    }

                    nextBtn.prop('disabled', isDisabled);
                    break;

                case 'wizard-step-2':
                    isDisabled = (accountId < 0) || isDisabled == isBankAccountInfoEntryInvalid() || model.TermsAccepted == false;
                    $(wizBtnIds.finish).prop('disabled', isDisabled);
            }
        }
    }

    /**
     * Updates the bank account name from the bank name, account type, and acount number.
     * */
    function setBankAccountNickName(bankName, accountTypeName, accountNumber) {
        var achInfo = model.AchInformation;

        bankName = (typeof bankName === 'undefined') ? '' : bankName;
        accountTypeName = (typeof accountTypeName === 'undefined') ? '' : accountTypeName;
        accountNumber = (typeof accountNumber === 'undefined') ? '' : accountNumber;
        var newBankAccountName = `${bankName} - ${accountTypeName} - ${htmlTools.maskNumber(accountNumber)}`;

        achInfo.BankAccountName = newBankAccountName;

        if (achInfo.BankAccountName && enteredBankInfoIsDuplicate()) {
            $(wizBtnIds.next).prop('disabled', true);
            toastr.error('The Bank Account Nickname is already in use.');
        }
    }

    /**
     * Formats the draft amount for the UI.
     * 
     * @param {any} newAmount - A string or number to format as a decimal in the element displaying the total payment to be made.
     */
    function setDraftAmount(newAmount) {
        model.DraftAmount = numeral(newAmount).value();
        var el = $(bindIds.totalPaymentAmount)
            .text(model.DraftAmount)
            .trigger('change');
        updateCurrencyFormats();

        var validationEl = el.siblings(selectors.validationClass);
        if (newAmount >= 0) {
            validationEl.text('').hide();
        } else {
            validationEl.text('Payment value must be greater than zero.').show();
        }

        setAchControlState();
    }

    //#endregion private functions

    // Initial masking and set state.
    htmlTools.maskPhoneElement(selectors.phoneText);
    setAchControlState();

    // Public interface 
    return Object.freeze({
        setAchControlState: setAchControlState,
        setBankAccountNickName: setBankAccountNickName,
        setDraftAmount: setDraftAmount
    });
};
