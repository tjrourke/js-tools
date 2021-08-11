/* global $, fetch, console, UserTools  */

"use strict";

/** Manages a list or grid of Users */
var UserManager = (function () {

    /**
     * Creates a new instance of UserManager.
     * @param {any} customOptions Customized options extending theUserManagerDefaultOptions object.
     */
    var Constructor = function (customOptions) {

        var options = $.extend(true, {}, UserManagerDefaultOptions, customOptions);
        var tools = new UserTools(options);

        function save(oFormElement) {
            var status = 200;
            var url = oFormElement.action;
            var msg = '';
            var actionIsAdding = oFormElement.id == 'createUserForm' ? true : false;
            tools.clearUserErrorFields($(oFormElement));
            const formData = new FormData(oFormElement);
            try {
                fetch(url, {
                    method: 'POST',
                    credentials: 'same-origin',
                    body: formData
                }).then(response => {
                    status = response.status;
                    return response.text();
                }).then(result => {
                    if (status !== 200 && status !== 201) {
                        tools.setUserErrorFields(result.split(","));
                        msg = actionIsAdding ? 'Error Adding User' : 'Error Saving User';
                        toastr.error(msg);
                        tools.cleanUp();
                        return false;
                    }
                    else {
                        msg = actionIsAdding ? 'User Added' : 'User Saved';
                        toastr.success(msg);
                        tools.cleanUp();
                        location.reload();
                    }
                });
            } catch (error) {
                toastr.error(error);
                tools.cleanUp();
            }
        }

        /** Loads data to edit a user's properties in the dialog with the matching selector. */
        function setEditModal(data, dialogSelector) {
            tools.setFormFields(data, dialogSelector);
        }

        return {
            save,
            settings: options,
            setEditModal
        };
    };

    return Constructor;
})();
