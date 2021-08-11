/* global fetch, $, console, alert, jQuery  */
'use strict';

var GridSearchDefaultOptions = {
    selectors: {
        searchButton: '#searchSubmissions',
        searchStringText: '#searchToken'
    },
    callbacks: {
        onChangeSearchString: null,
        onExecuteSearch: null
    }
};

/** Optional add-in for GridManager to handle grid search input, handling and execution. */
var GridSearch = (function ($) {
    /**
     * Creates a new instance of GridSearch.
     * @param {object} gridMgr An instance of the GridManger.
     * @param {any} customOptions Customized options extending the GridSearchDefaultOptions object.
     */
    var Constructor = function (gridMgr, customOptions) {
        var options = $.extend(true, {}, GridSearchDefaultOptions, customOptions);
        var callbacks = options.callbacks,
            currentPageSize = options.currentPageSize,
            selectors = options.selectors;
        /** The current text to use to search. */
        var currentSearchString = null;
        var gridElement = gridMgr.getGridElement();

        // Get a reference to the grid element from the GridManager instance.
        function getGridElement() {
            gridElement = gridMgr.getGridElement();
        }

        function getSearchString() {
            currentSearchString = $(selectors.searchStringText).text();
            return currentSearchString;
        }

        /**
         * Executes a search of the data and a table refresh.
         * @param {any} searchString The search query to use for full-text search.
         * @param {Boolean} forceSearch Flag to force a search even if the searchString parameter is the same as the previous search.
         *
         * @returns {Promise} Promise returned from a fetch call to get the query in its partial view content.
         */
        function searchGrid(searchString, forceSearch) {
            if (searchString !== currentSearchString
                || (typeof forceSearch !== "undefined"
                    && forceSearch === true)) {
                getGridElement();
                if (gridElement.length > 0) {
                    updateSearchString(searchString);
                    if (typeof callbacks.onExecuteSearch === 'function') {
                        return callbacks.onExecuteSearch();
                    } else {
                        return gridMgr.refreshGrid(null, null, searchString);
                    }
                }
            }

            return null;
        }

        /**
         * Updates the search string for the provided table.
         * @param {string} searchString
         */
        function updateSearchString(searchString) {
            getGridElement();
            var params = gridMgr.getParameters(gridElement);
            if (params.SearchSettings == null) {
                params.SearchSettings = {};
            }

            if (params.SearchSettings.hasOwnProperty("SearchQuery")) {
                params.SearchSettings.SearchQuery = searchString;
            }

            if (params.SearchSettings.hasOwnProperty("SearchString")) {
                params.SearchSettings.SearchString = searchString;
            }

            currentSearchString = searchString;
            $(selectors.searchStringText).prop('value', currentSearchString);
            gridMgr.setParameters(params);
        };

        //region jQuery events

        $(selectors.searchStringText).on('change', function () {
            updateSearchString($(this).prop('value'));
        });

        $(selectors.searchStringText).keypress(function (e) {
            var textInput = $(this);
            if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
                searchGrid(textInput.prop('value'), true);
                return false;
            } else {
                return true;
            }
        });

        $(selectors.searchButton).on('click', function (event) {
            searchGrid($(selectors.searchStringText).prop('value'), true);
        });

        //endregion jQuery events

        // public api
        return {
            getCurrentSearchString: function () {
                return currentSearchString;
            },
            searchGrid: function (searchString, forceSearch) {
                return searchGrid(searchString, forceSearch);
            },
            updateSearchString: function (searchString) {
                return updateSearchString(searchString);
            }
        };
    }

    return Constructor;
})(jQuery);
