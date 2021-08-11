/* global $, console, jQuery */
'use strict';

var Spinner = (function ($) {
    var Constructor = function (elementSelector) {
        var spinnerElement = $(elementSelector);
        var selector = elementSelector;
        var cssHide = 'hidden';

        function getElement() {
            if (!spinnerElement || spinnerElement.length === 0) {
                spinnerElement = $(selector);
            }

            return spinnerElement;
        }

        function hide() {
            getElement().removeClass(cssHide).addClass(cssHide);
        }

        function show() {
            getElement();
            if (spinnerElement.attr(cssHide)) {
                spinnerElement.removeAttr(cssHide);
            }

            spinnerElement.removeClass(cssHide);
        }

        return {
            element: spinnerElement,
            selector: selector,
            hide: hide,
            show: show
        };
    };

    return Constructor

})(jQuery);
