/* global $, fetch, console, UserTools  */

"use strict";

var UserManagerDefaultOptions = {
    attrs: {
        disabled: 'disabled'
    },
    callbacks: {
        cleanUp: null,
        clearUserErrorFields: null,
        getEditFormData: null,
        setEditFormData: null,
        setEditErrors: null
    },
    defaults: {
        data: {
            email: '',
            firstName: '',
            lastName: '',
            userId: 0,
            userOrgId: 0,
            admin: false,
            isActive: false
        }
    },
    messages: {
        addUserError:  'Error Adding User',
        addUserSuccess:  'Error Saving User',
        saveserError:  'User Added',
        saveUserSuccess:  'User Saved',
    },
    selectors: {
        buttons: {
            launchAdd: '#addUser',
            launchEdit: '#editUser'
        },
        errors: {
            email: '#emailError',
            firstName: '#firstNameError',
            lastName: '#lastNameError',
            permissions: '#permissionsError'
        },
        formElements: {
            inputs: {
                email: '#email',
                firstName: '#firstName',
                lastName: '#lastName',
                userId: '#insuredUserId',
                userOrgId: '#insuredId'
            },
            toggles: {
                admin: '#admin',
                isActive: '#isActive'
            }
        },
        spinner: '.uploadSpinner'
    }
};
