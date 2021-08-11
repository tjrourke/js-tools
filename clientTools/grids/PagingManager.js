/* global $, jQuery, GridManager */
'use strict';
/**
 * PagingManager - reusable pagination tool instantiated by a GridManager instance.
 * */
var PagingManager = (function ($) {
    /**
     * Creates and returns a new instance of a PagingManager API.
     * @param {any} gridMangerInstance A GridManager instance that will own the PagingManager.
     */
    var Constructor = function (gridMangerInstance) {
        var gridManager = gridMangerInstance;
        var gridElement = gridManager.getGridElement();
        var gridElementId = '#' + gridElement.prop('id');
        var pagesizeSelector = gridElementId + ' select.pagination-pagesize';
        var pageLinkSelector = gridElementId + ' a.page-link';

        $(document).on('change', pagesizeSelector, function () {
            var pageSize = $(this).find("option:selected").val();
            gridManager.refreshGrid(1, pageSize);
        });

        $(document).on('click', pageLinkSelector, function () {
            var pageIndex = $(this).data('pageIndex');
            if (pageIndex != null) {
                changePage(pageIndex);
            }
        });

        function changePage(pageIndex) {
            var pageSize = $(pagesizeSelector + ' option:selected').val();
            gridManager.refreshGrid(pageIndex, pageSize);
        }
    };

    // Return the Constructor
    return Constructor;
})(jQuery);
