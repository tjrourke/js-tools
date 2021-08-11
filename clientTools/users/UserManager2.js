/* global $, fetch, console, UserTools  */

"use strict";

var UserManager = (function () {

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
