/* global $, console  */

"use strict";

var UserTools = (function ($) {

    /**
     * Creates a new instance of UserTools.
     * @param {any} customOptions Customized options from the parent UserManager object.
     */
    var Constructor = function (options) {
        var callbacks = options.callbacks,
            defaults = options.defaults,
            selectors = options.selectors,
            buttonSelectors = options.selectors.buttons,
            inputSelectors = options.selectors.formElements.inputs,
            toggleSelectors = options.selectors.formElements.toggles;

        function addElementsFromOptions(parentElement, elementsObject, selectorsObj) {
            var keys = Object.getOwnPropertyNames(selectorsObj);
            if (keys.length) {
                keys.forEach(function (key) {
                    var value = selectorsObj[key];
                    var childElement = parentElement.find(value);
                    if (childElement.length > 0
                        && ['array', 'boolean', 'date', 'number', 'string'].indexOf(trueTypeOf(value)) > -1) {
                        elementsObject[key] = childElement;
                    }
                });
            }
        }

        /** Clean up UI after an operation. */
        function cleanUp() {
            var elements = getActiveModalFields();
            disableAndHide(elements.addButton, elements.addSpinner);
            disableAndHide(elements.editButton, elements.editSpinner);
        }

        /** Cleanup the validation message. 
         * @param {any} fieldElement The element used to show a validation message, which is to be cleared.
        */
        function clearErrorField(fieldElement) {
            if (fieldElement.length) {
                fieldElement.text('');
            }
        }

        /** Cleanup all validation message. 
         * @param {any} formElement The form element containing validation message elements to be cleared.
        */
        function clearUserErrorFields(formElement) {
            var selectorsObj = selectors.errors;
            var keys = Object.getOwnPropertyNames(selectorsObj);
            if (keys.length) {
                keys.forEach(function (key) {
                    var value = selectorsObj[key];
                    clearErrorField(formElement.find(value));
                });
            }
        }

        /** Disable button and hide the spinner. 
         * @param {any} button The button element to disable.
         * @param {any} spinner The spinner/busy element to hide.
        */
        function disableAndHide(button, spinner) {
            if (button && button.length > 0) {
                button.removeAttr('disabled');
                spinner.removeClass('hidden').addClass('hidden');
            }
        }

        /**
         * Get the data from the active modal indicated by the dialog selector value.
         * @param {any} dialogSelector CSS selector to use to query for the dialog.
         * @returns {any} An object of the data found.
         */
        function getActiveModalFields(dialogSelector) {
            var activeModal = dialogSelector != null && dialogSelector.length ? $(dialogSelector) : $('.modal.show');
            var form = activeModal.find('form');
            var addButton = getButton(buttonSelectors.launchAdd);
            var editButton = getButton(buttonSelectors.launchEdit);

            var addSpinner = getChildSpinner(addButton, selectors.spinner);
            var editSpinner = getChildSpinner(editButton, selectors.spinner);

            var elementsObj = {
                activeModal: activeModal,
                addButton: addButton,
                addSpinner: addSpinner,
                editButton: editButton,
                editSpinner: editSpinner,
                form: form
            };

            addElementsFromOptions(activeModal, elementsObj, selectors.errors);
            addElementsFromOptions(activeModal, elementsObj, inputSelectors);
            addElementsFromOptions(activeModal, elementsObj, toggleSelectors);

            return elementsObj;
        }

        /**
         * Gets a button element.
         * @param {any} buttonSelector The CSS selector of the button element.
         */
        function getButton(buttonSelector) {
            var button = $(buttonSelector);
            return button.length > 0 ? button : null;
        }

        /**
         * Gets a spinner element.
         * @param {any} parentElement The parent element of the spinner.
         * @param {any} spinnerSelector The CSS selector of the spinner element.
         */
        function getChildSpinner(parentElement, spinnerSelector) {
            if (parentElement && parentElement.length > 0 && spinnerSelector) {
                return parentElement.find(spinnerSelector);
            }

            return null;
        }

        /**
         * Sets a form field's validation message.
         * @param {any} fieldElement The field element to set.
         * @param {any} message The message to set in the field.
         */
        function setErrorField(fieldElement, message) {
            if (fieldElement && fieldElement.length) {
                fieldElement.text(message);
            }
        }

        /**
         * Sets a form's fields using the provided selectors and data.
         * @param {any} data Object containing properties for selectors and values.
         * @param {any} dialogSelector The selector to use to query for the dialog.
         */
        function setFormFields(data, dialogSelector) {
            var elsObj = getActiveModalFields(dialogSelector);
            var editData = $.extend(true, {}, defaults.data, data);
            setFormFieldBySelectors(inputSelectors, editData, elsObj.form);
            setFormFieldBySelectors(toggleSelectors, editData, elsObj.form);
        }

        /**
         * Sets a form field using the provided selectors and values.
         * @param {any} selectorsObj Object containing properties for selectors.
         * @param {any} valuesObj The values object with keys matching the selector object keys.
         * @param {any} formElement The form containing the fields to set.
         */
        function setFormFieldBySelectors(selectorsObj, valuesObj, formElement) {
            var keys = Object.getOwnPropertyNames(selectorsObj);
            if (keys.length) {
                keys.forEach(function (key) {
                    var value = selectorsObj[key];
                    var el = formElement.find(value);
                    if (el.length > 0) {
                        if (el.is('input[type="checkbox"]')) {
                            el.prop('checked', (valuesObj[key] == true) ? true : false);
                        } else if (el.is('input[type="radio"]')) {
                            el.filter('input[value="' + valuesObj[key] + '"]').prop('checked', true);
                        } else if (el.is('input')) {
                            el.val(valuesObj[key]);
                        } else if (el.is('select')) {
                            el.val(valuesObj[key]);
                        } else {
                            el.text(valuesObj[key]);
                        }
                    }
                });
            }
        }

        /** Set the text in validation elements.
         * @param {any} validationList The list of validations to process.
         */
        function setUserErrorFields(validationList) {
            var errSelectors = selectors.errors;
            validationList.forEach(function (valMsg) {
                var word = valMsg.split(':')[0];
                if (word) {
                    // If the selector doesn't exist, swap the case of the first letter.
                    if (!errSelectors.hasOwnProperty(word)) {
                        word = toggleStringCase(word);
                    }

                    // If the selector exists, try it out.
                    if (errSelectors.hasOwnProperty(word)) {
                        setErrorField($(errSelectors[word]), valMsg);
                    }
                }
            });
        }

        /** Toggle the case of text in the source string.
         * @param {string} sourceString The text to toggle case
         */
        function toggleStringCase(sourceString) {
            var char = sourceString.charAt(0);
            return sourceString.replace(
                char,
                sourceString.charCodeAt(0) > 65
                    ? char.toLowerCase()
                    : char.toUpperCase());
        }

        /*!
         * More accurately check the type of a JavaScript object
         * (c) 2018 Chris Ferdinandi, MIT License, https://gomakethings.com
         * @param  {Object} obj The object
         * @return {String}     The object type
         * @notes
         * result is one of "array", "boolean", "date", "function", "null", "number", "object", "regexp", "string", "undefined"
         */
        function trueTypeOf(obj) {
            return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
        };

        /** Initialize handlers */
        $('#addUser, #editUser').click(function (e) {
            $(this).removeAttr('disabled');
            var spinner = getChildSpinner($(this), selectors.spinner);
            if (spinner.length) {
                spinner.removeClass('hidden');
            }
            $(this).closest('form').submit();
            e.preventDefault();
        });

        return {
            cleanUp: cleanUp,
            clearUserErrorFields: clearUserErrorFields,
            setFormFields: setFormFields,
            setUserErrorFields: setUserErrorFields
        };
    };

    return Constructor;
})(jQuery);
