/* global fetch, $, console, alert, jQuery, GridManager */

/**
 * Custom tool to use a GridManager instance to manage an Agency's list of agents in a grid. Also handles quick filtering by agent or workflow state, using a filter dialog and a button bar UI.
 * Depends on a UI table with data columns defined in the table header.
 * */
var agentsGrid = (function ($) {
    var options = {
        attrs: {
            dataSortKey: 'data-sort'
        },
        defaults: {
            requestAll: {
                FilterFlag: 0,
                GridName: "Agencies",
                OrderByColumns: "",
                PageIndex: 0,
                PageSize: 10,
                SearchSettings: {
                    SearchString: null
                }
            }
        },
        features: {
            filtering: false,
            searching: true,
            sorting: true
        },
        selectors: {
            gridElement: "#agents",
            searchButton: '#search',
            searchTokenText: '#searchToken',
            spinner: '#gridSpinner',
            tableListHeader: 'table.table.agents-list thead tr th.sortable'
        },
        urls: {
            getGridPartial: '/Agents/SearchPage' /* URL to get data to refresh table. */
        }
    };

    // Create an instance of GridManager to handle common grid functions
    var gridManager = new GridManager(options, null, null);

    return {
        defaultDate: options.defaultDate,
        /**
         * If the element ID provided is in the list of grids, fetches the necessary data and loads it into the element.
         * <p>
         * Note: The search parameters should be stored as a stringified JSON object in a data-search-parameters attribute
         * on the table to refresh or re-query.
         * </p>
         * @param {any} optionalPageIndex Optional page index to fetch; defaults to zero.
         * @param {any} optionalPageSize Optional page size - defaults to 10 rows.
         *
         * @returns {Promise} Promise returned from a fetch call to get the query in its partial view content.
         */
        refreshGrid: function (optionalPageIndex, optionalPageSize) {
            return gridManager.refreshGrid(optionalPageIndex, optionalPageSize);
        },
        /**
         * Executes a search of the data and a table refresh.
         * @param {string} searchString
         *
         * @returns {Promise} Promise returned from a fetch call to get the query in its partial view content.
         */
        searchGrid: function (searchString) {
            return gridManager.searchGrid(searchString);
        },
        /**
         * Updates the search string for the provided table.
         * @param {string} searchString
         */
        updateSearchString: function (searchString) {
            return gridManager.updateSearchString(searchString);
        },
        urls: function () {
            return gridManager.urls;
        }
    };
})(jQuery);
