/* global $, console, jQuery, jquery-mask, numeral, HtmlTools, AchDataHandler */

/**
 * Handles the events of the UI for the ACH payment wizard.
 * @param {Object} options - The wizard options.
 * @param {Object} htmlTools - The HtmlTools utility.
 * @param {Object} handler - The AchDataHandler managing payment data for the wizard.
 */
var AchEventManager = function (options, htmlTools, handler) {
    var bindIds = options.dataBindingIds;
    var achIds = bindIds.ach;
    var selectors = options.selectors;
    var deleteConfirmModal = $(selectors.deleteConfirmModal);
    var wizButtons = options.wiz.controlIds.buttons;

    $(bindIds.deleteSavedBankAccount).css('cursor', 'pointer');

    function upDateDraftAmount() {
        var total = htmlTools.sumValues(selectors.currencyInput);
        handler.setDraftAmount(total);
    }

    //#region Event handlers

    $(selectors.digitOnly).keypress(function (e) {
        if (htmlTools.keyIsDigitOnly(e.which, e.charCode)) {
            return true;
        }

        e.preventDefault();
        return false;
    });

    $(selectors.digitOrUpperCaseOnly).keypress(function (e) {
        if (htmlTools.keyIsDigitOrUpperCaseOnly(e.which, e.charCode)) {
            return true;
        }

        e.preventDefault();
        return false;
    });

    $(selectors.setAchControlState).on('change', function () {
        handler.setAchControlState();
    });

    $(selectors.updateNickNameOnChange).on('change', function () {
        handler.setBankAccountNickName(
            $(achIds.bankName).val(),
            $(`${achIds.accountType} option:selected`).prop('text'),
            $(achIds.accountNumber).val()
        );
    });

    $(selectors.currencyInput).on('change', function () {
        htmlTools.formatCurrencyElement($(this), false);

        var validationEl = $(this).parent().siblings(selectors.validationClass);
        var text = $(this).val();
        var amt = numeral(text).value();
        if (amt >= 0) {
            validationEl.text('').hide();
        } else {
            validationEl.text('Payment value must be greater than zero.').show();
        }

        upDateDraftAmount();
    });

    $(selectors.currencyText).on('change', function () {
        htmlTools.formatCurrencyElement($(this), false);
    });

    $(bindIds.payFullAmount).on('click', function () {
        $(bindIds.paymentDetails).addClass('hidden');
        upDateDraftAmount();
    });

    $(bindIds.deleteSavedBankAccount).on('click', function () {
        deleteConfirmModal.modal("show");
    });

    $(selectors.confirmDeleteAchButton).on('click', function () {
        deleteConfirmModal.modal('hide');
        options.wiz.apis.delete();
    });

    $(selectors.cancelDeleteAchButton).on('click', function () {
        deleteConfirmModal.modal('hide');
    });

    $(bindIds.payPartial).on('click', function () {
        $(bindIds.paymentDetails).removeClass('hidden');
        upDateDraftAmount();
    });

    // Disallow copy/paste on repeat input boxes.
    $(selectors.noCopyPaste).on("cut copy paste", function (e) {
        e.preventDefault();
    });

    // Require the user to check the user terms acceptance box to finish.
    $(selectors.termsAcceptedCheck).on('change', function () {
        $(wizButtons.finish).prop('disabled', !($(this).is(':checked')));
    });

    $(achIds.accountNumber).on('change', function (e) {
        var len = $(this).val().length;
        var validationEl = $(this).siblings(selectors.validationClass);
        if (len >= 4 && len <= 14) {
            validationEl.text('').hide();
        } else {
            validationEl.text('Account numbers should be between 4 and 14 characters.').show();
        }
    });

    $(achIds.accountNumberRepeat).on('change', function (e) {
        var validationEl = $(this).siblings(selectors.validationClass);
        if ($(this).val() !== $(achIds.accountNumber).val()) {
            validationEl.text('Account numbers must match.').show();
        } else {
            validationEl.text('').hide();
        }
    });

    $(achIds.routingNumber).on('change', function (e) {
        var len = $(this).val().length;
        var validationEl = $(this).siblings(selectors.validationClass);
        if (len > 1 && len < 9) {
            validationEl.text('Routing numbers must be 9 digits.').show();
        } else {
            validationEl.text('').hide();
        }
    });

    $(achIds.routingNumberRepeat).on('change', function (e) {
        var validationEl = $(this).siblings(selectors.validationClass);
        if ($(this).val() !== $(achIds.routingNumber).val()) {
            validationEl.text('Routing numbers must match.').show();
        } else {
            validationEl.text('').hide();
        }
    });

    $(achIds.accountType).on('change', function (e) {
        model.AchInformation.AccountTypeId = $(this).val();
    });

    $(selectors.currencyInput).on("keypress keyup blur", function (event) {
        $(this).val($(this).val().replace(/[^0-9\.]/g, ''));
        if (event.which != 46 && event.which != 110 && event.which != 190 && (event.which < 48 || event.which > 57)) {
            event.preventDefault();
        }
    });

    //#endregion Event handlers
};
