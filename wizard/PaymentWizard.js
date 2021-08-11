/* global $, console, jQuery, jquery-mask, HtmlTools */

/**
 * @name PaymentWizard
 * @description Manages loading and moving steps in a wizard for ACH payments.
 * @param {Object} htmlTools - Common HTML functions.
 * @param {Object} settings - Settings defining the number and content of steps for the wizard to manage, including injection points for callback functions.
 */
var PaymentWizard = function (htmlTools, settings) {
    var wiz = settings;
    var btnIds = wiz.controlIds.buttons;

    //#region private functions

    /**
     * Changes the active step visible in the wizard, hiding the current step and showing the step indicated by the isForward value.
     * @param {boolean} isForward - If true, the next step is shown; otherwise, the previous step is shown.
     */
    function changeStep(isForward) {
        var fromStep = getStep(wiz.currentStepIndex);
        if (isForward) {
            setStep(fromStep, getStep(wiz.nextStepIndex));
        } else {
            setStep(fromStep, getStep(wiz.currentStepIndex - 1));
        }
    }

    /**
     * Clears the values in the UI of the active step.
    */
    function clearValues() {
        if (typeof wiz.clearValues === "function") {
            wiz.clearValues(wiz.currentStepIndex);
        }
    }

    /**
     * Gets the step whose index property matches the stepNumber parameter
     * @param {Number} stepNumber
     */
    function getStep(stepNumber) {
        var step = wiz.steps.find(element => element.index === stepNumber);
        return (typeof step === 'undefined') ? null : step;
    }

    /**
     * Updates the state of wizard controls based on the values and selections in the toStep.
     * @param {Object} fromStep - The active step, which the user is moving away from. This can be null, in the case of loading the first step.
     * @param {any} toStep - The step the user wants to get to. This can be null, as in the case when the fromStep parameter represents the final step in the wizard.
     */
    function setControlsState(fromStep, toStep) {
        if (fromStep !== null) {
            $(`#wizard-step-${fromStep.index}`)
                .removeClass('step-active')
                .addClass('step-inactive');
        }

        if (toStep !== null) {
            $(`#wizard-step-${toStep.index}`)
                .removeClass('step-inactive').addClass('step-active');

            if (toStep.showControls === true) {
                $('.wizard-controls').show();

                htmlTools.showHideElement('wizard-back', toStep.showButtons.back);
                htmlTools.showHideElement('wizard-cancel', toStep.enableControls.cancel);
                htmlTools.showHideElement('wizard-clear', toStep.enableControls.clear);
                htmlTools.showHideElement('wizard-finish', toStep.enableControls.finish);
                htmlTools.showHideElement('wizard-next', toStep.enableControls.next);

                $(btnIds.back).prop('disabled', !toStep.enableControls.back);
                $(btnIds.cancel).prop('disabled', !toStep.enableControls.cancel);
                $(btnIds.clear).prop('disabled', !toStep.enableControls.clear);
                $(btnIds.finish).prop('disabled', !toStep.enableControls.finish);

                $(btnIds.next).prop('disabled', !toStep.enableControls.next);

                $(btnIds.clear).show();
            } else {
                $('.wizard-controls').hide();
            }
        }

        $('#one-time-header').show();
        $('.wizard-progress').show();
        $('.wizard-labels').show();
    }

    /**
     * Starts the process of moving from one step to another.
     * @param {Object} fromStep - The active step, which the user is moving away from. This can be null, in the case of loading the first step.
     * @param {any} toStep - The step the user wants to get to. This can be null, as in the case when the fromStep parameter represents the final step in the wizard.
     */
    function setStep(fromStep, toStep) {
        var fromStepIndex = fromStep == null ? 0 : fromStep.index;
        var toStepIndex = toStep == null ? fromStepIndex : toStep.index;

        if (fromStepIndex > 0) {
            var oldTab = $(`#wizard-step-tab-${fromStepIndex}`)
                .removeClass(wiz.classes.steps.active)
                .attr('aria-selected', false);

            if (toStepIndex > 0) {
                if (fromStepIndex > toStepIndex) {
                    // Going backward - change current to normal
                    oldTab.addClass(wiz.classes.steps.normal)
                        .html(`<span class="fa-stack fa-lg circle normal-view"><i class="fas fa-circle fa-stack-2x" aria-hidden="true"></i><strong class="fa-stack fa-stack-1x" style="font-size: 1.25em; margin:2px 0 0 0; color: black;">${fromStepIndex}</strong></span>`);
                } else if (toStepIndex > fromStepIndex) {
                    // Going forward - change current to visited
                    oldTab.addClass(wiz.classes.steps.visited)
                        .html('<span class="fa-stack fa-lg circle visited-view"><i class="fas fa-circle fa-stack-2x" aria-hidden="true"></i><i class="fa fa-check fa-stack-1x fa-inverse" aria-hidden="true"></i></span>');
                }
            } else {
                oldTab.addClass(wiz.classes.steps.visited)
                    .html('<span class="fa-stack fa-lg circle visited-view"><i class="fas fa-circle fa-stack-2x" aria-hidden="true"></i><i class="fa fa-check fa-stack-1x fa-inverse" aria-hidden="true"></i></span>');
            }

            oldTab.attr('aria-selected', true);

            // Update model from current step.
            if (fromStep !== null && typeof fromStep.leave === 'function') {
                fromStep.leave(fromStep, toStep);
            };

            // Update controls state from next step.
            if (fromStep !== null && typeof fromStep.leaveSetState === 'function') {
                fromStep.leaveSetState();
            }

            wiz.previousStepIndex = fromStepIndex;
        }

        setControlsState(fromStep, toStep);

        if (toStepIndex > 0) {
            var newTab = $(`#wizard-step-tab-${toStepIndex}`);

            // Set new tab to active
            newTab.addClass(wiz.classes.steps.active)
                .html(`<span class="fa-stack fa-lg circle"><i class="fa fa-circle fa-stack-2x"></i><strong class="fa-stack fa-stack-1x fa-inverse" style="font-size: 1.25em; margin:2px 0 0 0; color: #ffffff;">${toStepIndex}</strong></span>`);

            // Update next step elements from model.
            if (typeof toStep.enter === 'function') {
                toStep.enter(fromStep, toStep);
            }

            // Update controls state from next step.
            if (typeof toStep.enterSetState === 'function') {
                toStep.enterSetState();
            }

            wiz.currentStepIndex = toStepIndex;
            wiz.nextStepIndex = toStepIndex + 1;
        } else {
            wiz.currentStepIndex = fromStepIndex;
            wiz.nextStepIndex = fromStepIndex + 1;
        }
    }

    //#endregion private functions

    //#region event handlers for step controls

    // Move backward one step in the wizard.
    $(btnIds.back).on('click', function (e) {
        changeStep(false);
    });

    // Clears the values in the UI of the current step.
    $(btnIds.clear).on('click', function () {
        clearValues();
    });

    // Complete the wizard workflow and display a final confirmation step.
    $(btnIds.finish).on('click', function (e) {
        if (wiz.currentStepIndex === 3 && model.TermsAccepted == true) {
            if (typeof wiz.apis.save === "function") {
                return wiz.apis.save()
                    .then(success => {
                        if (success === true) {
                            changeStep(true);
                        } else {
                            return null;
                        }
                });
            }
        }

        return null;
    });

    // Move forward one step in the wizard.
    $(btnIds.next).on('click', function (e) {
        changeStep(true);
    });

    // Cancel the wizard entirely and return to a default view.
    $(btnIds.cancel).on('click', function () {
        if (typeof wiz.cancel === "function") {
            wiz.cancel();
        }
    });

    //#endregion event handlers for step controls

    // Set initial state.
    setStep(null, getStep(1));
};
