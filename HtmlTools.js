/* global $, bootstrap, console, jQuery, jquery-mask, numeral */

/**
 * Exposes common HTML operations not specific to any data.
 *
 */
var HtmlTools = (function () {
    var currencyFormat = '$ 0,0.00';
    var currencyNoSignFormat = '0,0.00';
    var dataHashAttr = 'data-hash-show';
    var hashTypeTab = 'tab';
    var phoneMask = '(000) 000-0000';
    var unmaskedDataAttr = 'data-unmasked';

    /** Returns the current query string as a JSON object of key-value pairs, or null if there's no query string. */
    function queryStringToObject() {
        if (window.location.search) {
            var queryObject = {};
            var query = window.location.search.replace('?', '');
            if (query.length) {
                var terms = query.split('&');

                terms.forEach(function (item) {
                    var kvPair = item.split('=');
                    queryObject[kvPair[0]] = decodeURIComponent(kvPair[1]);
                });

                return queryObject;
            }
        }

        return null;
    }

    /**
     * Set the page query to include a tab's data-hash-show value.
     * If an existing term is present for another tab, it will be replaced.
     * @param {Element} element The Element with tab role and attributes to make the query change.
     */
    function addQueryForTab(element) {
        if (element.attr('role') && element.attr('role') === hashTypeTab) {
            if (element.attr(dataHashAttr)) {
                var querySet = queryStringToObject();
                if (querySet == null) {
                    querySet = {};
                }

                querySet[hashTypeTab] = element.attr(dataHashAttr);
                putQueryStringFromObject(querySet);
            }
        }
    }

    /**
     * Replaces the query string in the current window's URL.
     * @param {any} querySet An object containing key-value pairs to load into a query string.
     */
    function putQueryStringFromObject(querySet) {
        var query = [];
        for (var key in querySet) {
            if (querySet.hasOwnProperty(key)) {
                query.push(encodeURIComponent(key) + '=' + encodeURIComponent(querySet[key]));
            }
        }

        if (query.length) {
            var url = window.location.href.split('?')[0] + '?' + query.join('&');
            history.pushState({}, 'Show tab', url);
        }
    }

    /**
     * Formats a raw value into a decimal for currency and returns a string.
     * @param {any} rawValue - The value to convert to a number and format.
     * @param {boolean} showDollarSign - If true, will prefix a dollar sign to the result. Otherwise the result string will not contain a currency symbol.
     */
    function formatCurrency(rawValue, showDollarSign = false) {
        var formatType = showDollarSign ? currencyFormat : currencyNoSignFormat;
        return numeral(rawValue).format(formatType);
    }

    /**
     * Formats the value/text of the provided element and inserts the result.
     * @param {Element} element - The element with the value or text property to format.
     * @param {boolean} showDollarSign - If true, will prefix a dollar sign to the result. Otherwise the result string will not contain a currency symbol.
     *
     */
    function formatCurrencyElement(element, showDollarSign) {
        if (element.is('input')) {
            formatInputCurrency(element, showDollarSign);
        } else {
            formatTextCurrency(element, showDollarSign);
        }
    }

    /**
    * Formats the value of an input element and inserts the result.
    * @param {Element} element - The input element with the value to format.
    * @param {boolean} showDollarSign - If true, will prefix a dollar sign to the result. Otherwise the result string will not contain a currency symbol.
     *
     */
    function formatInputCurrency(inputElement, showDollarSign) {
        var rawValue = inputElement.val();
        inputElement
            .attr(unmaskedDataAttr, rawValue)
            .val(formatCurrency(rawValue, showDollarSign));
    }

    /**
    * Formats the text of a p, span, or other text element and inserts the result.
    * @param {Element} element - The element with the text to format.
    * @param {boolean} showDollarSign - If true, will prefix a dollar sign to the result. Otherwise the result string will not contain a currency symbol.
    */
    function formatTextCurrency(textContainerElement, showDollarSign) {
        var rawValue = textContainerElement.text();
        textContainerElement
            .attr(unmaskedDataAttr, rawValue)
            .text(formatCurrency(rawValue, showDollarSign));
    }

    function getFormAsJson(formElementSelector) {
        if (!formElementSelector) return null;

        var formElement = document.querySelector(formElementSelector);
        if (formElement == null) return null;

        var formData = new FormData(formElement);
        return JSON.parse(JSON.stringify(Object.fromEntries(formData.entries())));
    }

    /**
     * Gets the unformatted value of an element, from a data attribute added in the currency format process.
     * @param {any} element - The element with the unformatted value.
     */
    function getUnformattedCurrency(element) {
        return numeral(element.attr(unmaskedDataAttr));
    }

    /**
     * Returns true if the input value can be resolved to a date, false otherwise.
     * @param {any} value
     */
    function isDate(value) {
        switch (typeof value) {
            case 'number':
                return true;
            case 'string':
                return !isNaN(Date.parse(value));
            case 'object':
                if (value instanceof Date) {
                    return !isNaN(value.getTime());
                }
            default:
                return false;
        }
    }

    /**
     * Returns true if the specified key code represents a digit, false otherwise.
     * @param {any} keyCode - The key code to test.
     * @param {any} charCode - The character code to test.
     */
    function keyIsDigitOnly(keyCode, charCode) {
        return matchesRegExp("^[0-9 ]+$", keyCode, charCode);
    }

    /**
     * Returns true if the specified key code represents a digit or an upper case character, false otherwise.
     * @param {any} keyCode - The key code to test.
     * @param {any} charCode - The character code to test.
     */
    function keyIsDigitOrUpperCaseOnly(keyCode, charCode) {
        return matchesRegExp("^[0-9A-Z]+$", keyCode, charCode);
    }

    function matchesRegExp(regExString, keyCode, charCode) {
        var regex = new RegExp(regExString);
        var str = String.fromCharCode(!charCode ? keyCode : charCode);
        if (regex.test(str)) {
            return true;
        }

        return false;
    }

    /**
     * Returns a string masking the input value, showing an 'x' followed by the last four characters of the value.
     * @param {any} value - The input value.
     */
    function maskNumber(value) {
        var valueString = (typeof value !== 'string') ? new String(value) : value;
        return (valueString.length) ? 'x' + valueString.substring(valueString.length - 4) : '';
    }

    /**
     * Initializes or resets the phone mask on elements matching the input selector.
     * @param {any} selector - A jQuery selector.
     */
    function maskPhoneElement(selector) {
        $(selector).mask(phoneMask, { reverse: false });
    }

    /**
     * Sets the display of an element with the given ID according to the showBool value.
     * @param {string} elementId - A string containing the ID value of an element (without the '#').
     * @param {boolean} showBool - If true, the element will be shown; otherwise the element will be hidden.
     */
    function showHideElement(elementId, showBool) {
        if (showBool === true) {
            $(`#${elementId}`).show();
        } else {
            $(`#${elementId}`).hide();
        }
    }

    function showTabForQueryTerm() {
        var querySet = queryStringToObject();
        if (querySet != null && querySet.hasOwnProperty(hashTypeTab)) {
            var hashedTabs = $(`[data-toggle="tab"][role="tab"][data-hash-show="${querySet[hashTypeTab]}"]`).not('.active');
            if (hashedTabs.length > 0) {
                hashedTabs.tab('show');
            }
        }
    }

    /**
     * Adds up the values of the elements in a selector results and returns the sum
     * @param {string} selector - The selector to find the elements.
     */
    function sumValues(selector) {
        var total = 0;
        $.each($(selector), function () {
            total += numeral($(this).val()).value();
        });
        return total;
    }

    // Public interface 
    return Object.freeze({
        addQueryForTab: addQueryForTab,
        formatCurrency: formatCurrency,
        formatCurrencyElement: formatCurrencyElement,
        getFormAsJson: getFormAsJson,
        getUnformattedCurrency: getUnformattedCurrency,
        isDate: isDate,
        keyIsDigitOnly: keyIsDigitOnly,
        keyIsDigitOrUpperCaseOnly: keyIsDigitOrUpperCaseOnly,
        maskNumber: maskNumber,
        maskPhoneElement: maskPhoneElement,
        showHideElement: showHideElement,
        showTabForQueryTerm: showTabForQueryTerm,
        sumValues: sumValues
    });
});

$(function () {
    var htmlTools = HtmlTools();

    // If any tabs are in the page, and the location hash has one of the tabs specified, show it.
    htmlTools.showTabForQueryTerm();

    $(window).on('popstate', function () {
        htmlTools.showTabForQueryTerm()
    });

    /**
     * Updates the window location with a tab is selected, or shown. Set the location hash to the tab's data-hash-show value.
     */
    $('a[data-toggle=tab][role=tab]').on('shown.bs.tab', function (e) {
        // Add hash to URL for the tab currently shown.
        htmlTools.addQueryForTab($(this));
    });
});
