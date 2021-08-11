function getAchDataOptions() {
    return {
        selectors: {
            cancelDeleteAchButton: '#cancelDeleteAchButton',
            confirmDeleteAchButton: '#confirmDeleteAchButton',
            currencyInput: '.currency-input',
            currencyText: '.currency',
            deleteConfirmModal: '#confirmDeleteBankAccountInfoModal',
            digitOnly: '#RoutingNumber, #RoutingNumberReenter',
            digitOrUpperCaseOnly: '#BankAcctNum, #BankAcctNumReenter',
            noCopyPaste: 'input[type="text"].repeatToConfirm',
            paymentModel: '#paymentModelJson',
            phoneText: '.phoneText',
            setAchControlState: '#draftDate, #BankAcctNum, #BankAcctNumReenter, #BankName, #AcctNickName, #RoutingNumber, #RoutingNumberReenter, #selectBankAccount',
            termsAcceptedCheck: '#VerifyPaymentAgree',
            updateNickNameOnChange: '#BankAcctNum, #BankAcctNumReenter, #AcctType, #AcctNickName, #BankName, #RoutingNumber, #RoutingNumberReenter',
            validationClass: '.field-validation-valid'
        },
        dataBindingIds: {
            confirmedDraftAmount: '#confirmedDraftAmount',
            deleteSavedBankAccount: '#deleteSavedBankAccount',
            draftDate: '#draftDate',
            payFullAmount: '#payFullAmount',
            paymentDetails: '#paymentDetails',
            payPartial: '#payPartial',
            totalAmountDue: '#totalAmountDue',
            totalPaymentAmount: '#totalPaymentAmount',
            transactionId: '#confirmedTransactionId',
            ach: {
                accountNumber: '#BankAcctNum',
                accountNumberRepeat: '#BankAcctNumReenter',
                accountType: '#AcctType',
                bankAccountName: '#AcctNickName',
                bankName: '#BankName',
                routingNumber: '#RoutingNumber',
                routingNumberRepeat: '#RoutingNumberReenter',
                savedAccountId: '#selectBankAccount',
            },
            verify: {
                draftAmount: '#verify_draftAmount'
            }
        },
        defaults: {
            achInfo: {
                AccountType: 'Checking',
                AccountTypeId: 0,
                AchInformationId: 0,
                BankAccountName: '',
                BankAccountNumber: '',
                BankName: '',
                InsuredId: 0,
                IsActive: true,
                MaskedAccountNumber: '',
                MaskedRoutingNumber: '',
                RoutingNumber: ''
            }
        },
        wiz: {
            previousStepIndex: 0,
            currentStepIndex: 1,
            nextStepIndex: 2,
            classes: {
                steps: {
                    active: 'step-tab-normal',
                    normal: 'step-tab-active',
                    visited: 'step-tab-visited'
                }
            },
            controlIds: {
                buttons: {
                    back: '#wizard-back',
                    cancel: '#wizard-cancel',
                    clear: '#wizard-clear',
                    finish: '#wizard-finish',
                    next: '#wizard-next'
                },
                header: '#one-time-header',
                stepPrefix: '#wizard-step-',
                stepTabPrefix: '#wizard-step-tab-',
            },
            steps: [
                {
                    index: 1,
                    bannerText: 'Payment Amount',
                    enableControls: {
                        back: false,
                        cancel: false,
                        clear: true,
                        next: true,
                        finish: false
                    },
                    enter: null,
                    enterSetState: null,
                    leave: null,
                    leaveSetState: null,
                    showButtons: {
                        back: false,
                        cancel: false,
                        clear: true,
                        next: true,
                        finish: false
                    },
                    showControls: true,
                    title: 'Select Payment Amount',
                    pageTitle: 'Make Payment'
                },
                {
                    index: 2,
                    bannerText: 'Bank Account Information',
                    enableControls: {
                        back: true,
                        cancel: false,
                        clear: true,
                        next: true,
                        finish: false
                    },
                    enter: null,
                    enterSetState: null,
                    leave: null,
                    leaveSetState: null,
                    showButtons: {
                        back: true,
                        cancel: false,
                        clear: true,
                        next: true,
                        finish: false
                    },
                    showControls: true,
                    title: 'Enter Bank Information',
                    pageTitle: 'ACH'
                },
                {
                    index: 3,
                    bannerText: 'Verify Payment Information',
                    enableControls: {
                        back: true,
                        cancel: false,
                        clear: false,
                        next: false,
                        finish: true
                    },
                    enter: null,
                    enterSetState: null,
                    leave: null,
                    leaveSetState: null,
                    showButtons: {
                        back: true,
                        cancel: false,
                        clear: false,
                        next: false,
                        finish: true
                    },
                    showControls: true,
                    title: 'Verify and Submit',
                    pageTitle: 'Payment Verification'
                },
                {
                    index: 4,
                    bannerText: null,
                    enableControls: {
                        back: false,
                        cancel: false,
                        clear: false,
                        next: false,
                        finish: false
                    },
                    enter: null,
                    enterSetState: null,
                    leave: null,
                    leaveSetState: null,
                    showButtons: {
                        back: false,
                        cancel: false,
                        clear: false,
                        next: false,
                        finish: false
                    },
                    showControls: false,
                    title: 'Thank You For Your Payment!',
                    pageTitle: 'Thank You'
                }],
            apis: {
                cancel: null,
                delete: null,
                save: null
            }            
        },
        urls: {
            cancel: `/PolicyHolder/${model.SubmissionId}`,
            delete: '/api/PolicyHolder/RemoveBankAccount',
            save: '/api/PolicyHolder/FinishPayment'
        }
    };
}
