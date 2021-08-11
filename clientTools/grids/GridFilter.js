/* global fetch, $, console, alert, jQuery  */
'use strict';

/** Default options for GridFilter */
var GridFilterDefaultOptions = {
    features: {
        quickFilter: false
    },
    filters: [],
    selectors: {
        filterApplyButton: '#applyFilterBtn',
        filterClearButton: '#clearFilterBtn',
        modal: '#ModalFilterForm',
        quickFilter: '.quick-filter-button'
    }
};

/** Optional add-in for GridManager to handle grid filter input and handling. */
var GridFilter = (function ($) {
    /**
     * Creates a new instance of GridManager.
     * @param {object} gridMgr An instance of the GridManager.
     * @param {any} customOptions Customized options extending the GridFilterDefaultOptions object.
     */
    var Constructor = function (gridMgr, customOptions) {
        var options = $.extend(true, {}, GridFilterDefaultOptions, customOptions);
        var currentPageSize = options.currentPageSize;
        var gridElement = gridMgr.getGridElement();

        /**
        * Executes a filter and gets a new page of rows from the server.
        * @param {object} filterObj The object with the parameters to use to filter the table.
        */
        function filterGrid(filterObj) {
            gridMgr.getGridElement();
            if (gridElement.length > 0) {
                updateFilters(filterObj);
                return gridMgr.refreshGrid(1, currentPageSize);
            }

            return null;
        }

        /**
        * Updates the grid filter and gets a new page of rows from the server.
        * @param {object} filterObj The object with updated parameters to use to filter the table.
        */
        function setFilterProps(filterObj) {
            var parameterObj = gridMgr.getParameters();
            parameterObj.SearchSettings = $.extend({}, parameterObj.SearchSettings, filterObj);
            return parameterObj;
        }

        /**
         * Updates the filter in the grid parameters.
         * @param {any} filterObj
         */
        function updateFilters(filterObj) {
            var parameterObj = setFilterProps(filterObj)
            return gridMgr.setParameters(parameterObj);
        }

        return {
            filterGrid: function (filterObj) {
                return filterGrid(filterObj);
            },
            updateFilters: function (filterObj) {
                return updateFilters(filterObj);
            }
        };

    }

    return Constructor;
})(jQuery);
