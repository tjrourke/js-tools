/* global $, console  */

"use strict";

var UserTools = (function ($) {

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

        function cleanUp() {
            var elements = getActiveModalFields();
            disableAndHide(elements.addButton, elements.addSpinner);
            disableAndHide(elements.editButton, elements.editSpinner);
        }

        function clearErrorField(fieldElement) {
            if (fieldElement.length) {
                fieldElement.text('');
            }
        }

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

        function disableAndHide(button, spinner) {
            if (button && button.length > 0) {
                button.removeAttr('disabled');
                spinner.removeClass('hidden').addClass('hidden');
            }
        }

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

        function getButton(buttonSelector) {
            var button = $(buttonSelector);
            return button.length > 0 ? button : null;
        }

        function getChildSpinner(parentElement, spinnerSelector) {
            if (parentElement && parentElement.length > 0 && spinnerSelector) {
                return parentElement.find(spinnerSelector);
            }

            return null;
        }

        function setErrorField(fieldElement, message) {
            if (fieldElement && fieldElement.length) {
                fieldElement.text(message);
            }
        }

        function setFormFields(data, dialogSelector) {
            var elsObj = getActiveModalFields(dialogSelector);
            var editData = $.extend(true, {}, defaults.data, data);
            setFormFieldBySelectors(inputSelectors, editData, elsObj.form);
            setFormFieldBySelectors(toggleSelectors, editData, elsObj.form);
        }

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
