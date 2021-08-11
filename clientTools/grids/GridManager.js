/* global fetch, $, console, alert, jQuery, GridFilter, GridSearch, Spinner, PagingManager  */
'use strict';

/*
 ***** WARNING *****
 * This script is made for modern browsers supporting ES3 and some ES5.
 * IE and Legacy Edge will throw errors on load because they don't support arrow functions.
 * IE and Legacy Edge will also throw an error at runtime because they don't support the Fetch API.
 * If you want to use this in pages other than the PAT pages, you need a retrofitted IE-safe version.
*/

/** Default options for a GridManager instance. */
var GridManagerDefaultOptions = {
    attrs: {
        dataSortKey: 'id',
        searchParameters: "search-parameters",
        totalCount: 'total-count'
    },
    callbacks: {
        refreshFilterHandler: null,
        resetCustomUI: null
    },
    currentPageSize: 10,
    defaults: {
        defaultDate: null,
        filterMinDate: new Date('0001/01/01T12:00:00'),
        requestAll: {
            FilterFlag: 0,
            GridName: "",
            OrderByColumns: "",
            PageIndex: 0,
            PageSize: 10,
            SearchSettings: {
                SearchQuery: ''
            }
        }
    },
    features: {
        filtering: false,
        searching: false,
        sorting: false
    },
    filters: [],
    selectors: {
        gridElement: ".grid-rows-visible",
        spinner: '.grid-spinner',
        tableListClass: 'table.table.item-list',
        tableListHeader: 'table.table.item-list thead tr th'
    },
    tabTitle: '',
    urls: {
        getGridPartial: '/SearchPage'
    }
};

var GridManager = (function ($) {

    /**
     * Creates a new instance of GridManger.
     * @param {any} customOptions Customized options extending the GridManagerDefaults object.
     * @param {any} filterManager Optional instance of a filtering object extending the GridFilter object. If options.features.filtering is set to true, it will be used for filtering, or the default GridFilter object if null. If options.features.filtering is set to false, the filterManager parameter is ignored.
     * @param {any} searchManager Optional instance of a searching object extending the GridSearch object. If options.features.searching is set to true, it will be used for searching, or the default GridSearch object if null. If options.features.searching is set to false, the searchManager parameter is ignored.
     */
    var Constructor = function (customOptions, filterManager, searchManager) {
        var options = $.extend(true, {}, GridManagerDefaultOptions, customOptions);
        var attrs = options.attrs,
            currentPageSize = options.currentPageSize,
            defaults = options.defaults,
            gridNames = options.gridNames,
            selectors = options.selectors,
            totalCountAttrName = options.attrs.totalCount,
            urls = options.urls;
        // Get a reference to the grid element using the selector
        const gridElementSelector = selectors.gridElement;
        var gridElement = getGridElement();
        var pagingManager = {};
        var filterMgr = null;
        var searchMgr = null;

        /** Queries the DOM using jQuery for the element containing the grid.
         *  @returns {jQuery} jQuery object of the grid element
         * */
        function getGridElement() {
            return (gridElement == null || gridElement.length === 0) ? $(gridElementSelector) : gridElement;
        }

        /** Gets the current search parameters from the grid element's parameters data attribute.
         * @returns {object} JavaScript object containing the search, filter, and paging parameters for the data currently in the grid.
         */
        function getParameters() {
            getGridElement();
            if (gridElement.length > 0) {
                var parameterObj = {};
                var parameterString = gridElement.data(attrs.searchParameters);
                if (parameterString) {
                    if (typeof parameterString === "string") {
                        parameterObj = JSON.parse(parameterString);
                    } else {
                        parameterObj = parameterString;
                    }

                    return $.extend(true, {}, defaults.requestAll, parameterObj);
                }
            }

            return $.extend(true, {}, defaults.requestAll);
        }

        /**
         * Fetches the necessary data and loads it into the grid element.
         * <p>
         * Note: The search parameters should be stored as a stringified JSON object in a data-search-parameters attribute
         * on the table to refresh or re-query.
         * </p>
         * @param {any} optionalPageIndex Optional page index to fetch; defaults to zero.
         * @param {any} optionalPageSize Optional page size - defaults to 10 rows.
         * @param {string} searchString Optional string to use for searching; defaults to empty string.
         *
         * @returns {Promise} Promise returned from a fetch call to get the query in its partial view content.
         */
        var refreshGrid = function (optionalPageIndex, optionalPageSize, searchString = '') {
            currentPageSize = optionalPageSize;
            var spinner = new Spinner(selectors.spinner);
            var parameterObj = getParameters();
            if (gridElement.length > 0) {
                spinner.show();

                if (!searchString && options.features.searching) {
                    searchString = searchMgr.getCurrentSearchString();
                }

                parameterObj.SearchSettings.GridName = gridElementSelector;
                parameterObj.SearchSettings.SearchQuery = searchString;
                if (options.features.filtering === true
                    && typeof options.callbacks.refreshFilterHandler === "function") {
                    options.callbacks.refreshFilterHandler(parameterObj);
                }
                if (optionalPageIndex) {
                    parameterObj.PageIndex = optionalPageIndex - 1;
                    parameterObj.SearchSettings.PageIndex = parameterObj.PageIndex;
                }
                if (optionalPageSize) {
                    parameterObj.PageSize = optionalPageSize;
                    parameterObj.SearchSettings.PageSize = parameterObj.PageSize;
                }
                var searchData = $.extend(true, {}, defaults.requestAll, parameterObj);

                return fetch(urls.getGridPartial, {
                    body: JSON.stringify(searchData),
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    method: 'POST'
                }).then(response => {
                    console.log(`Result: ${response.status}`);
                    return response.text();
                }).then(result => {
                    if (result) {
                        if (result.indexOf('<title>Log in - Berkshire United</title>') > -1) {
                            window.location.assign('/Authentication/Login?redirectUrl=' + window.location.pathname);
                        }

                        $(gridElementSelector).replaceWith(result);
                        resetFromChanges(gridElementSelector);
                        spinner.hide();
                    } else {
                        spinner.hide();
                        throw new Error("Error");
                    }
                }).catch(error => {
                    console.error('Error:', error);
                    spinner.hide();
                });
            }
        };

        /**
         * Calls an optional callback provided in the options, to reset custom UI elements, if any; 
         * the callback must use the signature:
         *      resetCustomUI(gridElementSelector, parameterObj)
         */
        var resetFromChanges = function (gridElementSelector) {
            if (typeof options.callbacks.resetCustomUI === "function") {
                var parameterObjNew = getParameters();
                options.callbacks.resetCustomUI(gridElementSelector, parameterObjNew);
            }
        };

        /**
         * Stores the current search parameters object as a JSON string in the grid element's parameters data attribute.
         * @param {any} parameterObj
         */
        var setParameters = function (parameterObj) {
            getGridElement();
            if (gridElement.length > 0) {
                var parameterData = JSON.stringify(parameterObj);
                gridElement.data(attrs.searchParameters, parameterData);
            }

            return getParameters();
        };

        function updateSortSettings(sortColumn, order) {
            var parameterObj = getParameters();
            if (parameterObj.OrderByColumns) {
                var currentOrderBy = parameterObj.OrderByColumns.split(',');
                currentOrderBy.forEach(function (element) {
                    var elementParts = element.split(' ');
                    if (elementParts[0] == sortColumn
                        && elementParts.length == 2) {
                        if (!order) {
                            order = elementParts[1] == 'desc' ? 'asc' : 'desc';
                        }
                    }
                });
            }

            if (order == null || order.trim().length == 0) {
                order = 'desc';
            }

            parameterObj.OrderByColumns = sortColumn + " " + order;
            setParameters(parameterObj);
            return refreshGrid(parameterObj.PageIndex, parameterObj.PageSize);
        }

        if (options.features.sorting === true) {
            $(document).on('click', selectors.tableListHeader, function (event) {
                updateSortSettings($(this).attr(attrs.dataSortKey), '');
            });
        }

        //#region public api

        var api = {
            getGridElement,
            getParameters,
            options: function () {
                return $.extend(true, {}, options);
            },
            refreshGrid,
            setParameters,
            urls: function () {
                return $.extend(true, {}, urls);
            }
        };

        //#region optional api parts

        if (options.features != null) {
            if (options.features.filtering === true) {
                filterMgr = filterManager || new GridFilter(api, customOptions);
                api.filterGrid = function (filterObj) {
                    return filterMgr.filterGrid(filterObj);
                };
                api.updateFilters = function (filterObj) {
                    return filterMgr.updateFilters(filterObj);
                };
            }

            if (options.features.searching === true) {
                searchMgr = searchManager || new GridSearch(api, customOptions);
                api.searchGrid = function (searchString, forceSearch) {
                    return searchMgr.searchGrid(searchString, forceSearch);
                };
                api.updateSearchString = function (searchString) {
                    return searchMgr.updateSearchString(searchString);
                };
            }

            if (options.features.sorting === true) {
                api.updateSortSettings = function (sortColumn, order) {
                    return updateSortSettings(sortColumn, order);
                };
            }
        }

        //#endregion optional api parts

        //#endregion public api

        pagingManager = new PagingManager(api, gridElement.prop('id'));
        return api;
    };

    // Return the Constructor 
    return Constructor;
})(jQuery);
