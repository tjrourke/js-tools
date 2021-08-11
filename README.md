# js-tools
Tools used in web projects restricted to jQuery-only scripts

## Purpose

These scripts were developed in response to requirements for an RFQ form. The intended users are administrators and agents. 

## Requirements

Business requirements restricted JavaScript use to jQuery and a small number of plug-ins for specific operations (masking data input in form fields, and formatting currency).

## Dependencies

The scripts interact with views rendered on the server in an MVC project.
The jQuery-mask plugin is required for masking input, such as phone numbers.
The numeral library is used to format currency and convert formated currency strrings into numbers.

## Toolsets

### Agency and Grids

The **grids** folder contains scripts providing generic functionality for data grids. The GridManager is the main object.

The **users** folder contains scripts to handle lists and tables of users, intended for administrative users to update permissions and other properties.

## Wizard

The PaymentWizard script constructs an object to manage a wizard containing one or more child views. In this implementation the child views are rendedered on the server and are expected to be hidden in the main page.

## HtmlTools.js

The HtmlTools script collects several functions, some adapted from Chris Fernandini's Vanilla JS scripts. Other functions have been imported from other applications to reduce duplication.
