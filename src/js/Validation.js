// Timothy Alford
// Created: 18/12/2014 (requires jquery)
// Last Updated: 23/7/2015
// Convention validation system for client validation using HTML 5 standards, it defines an object called validation
// validation work by adding an attribute data-for="[InputId]" and data-type="[ValidationType]"
//
// each input that is to be validated must have an ID and attribute and error message eg:
// <input type="text" id="Name" />
// <error-message class="error" data-for="Name" data-type="required">Must provide a first name</error-message>
//
// Multiple error methods and messages can be used eg:
// <input type="text" id="Email" />
// <error-message class="error" data-type="required" data-for="Email">Must provide an email address</error-message>
// <error-message class="error" data-type="email" data-for="Email">Invalid email address</error-message>
//
// Validation can be manually called for all decorated inputs using the validateForm method eg:
// validation.validateForm('#MyForm');
//
// Validation can be clear for an entire form using clearValidators eg: 
// validation.clearValidators('#MyForm');
//
// add the attribute 'data-no-keyup-validation' to an input to prevent keyup validation (probably don't need this)
//
// elements can be set as inactive using setElementActive(elementId, active) where elementId is the id attribute on the element without #
// this will add the attribute data-disable-validation="true" to the element

var validation = (function () {

    // Configuration
    var keyDelay = 100;
    var errorMessageSelector = '.error-message';
    var forAttr = 'data-for';
    var typeAttr = 'data-type';
    var cleanAttr = 'data-clean';
    var inputFieldErrorClass = 'field-error';

    var access = {}, validatorTypes = [];

    // Add Validator
    access.addValidator = function (key, validateMethod) {
        validatorTypes.push({
            validatorKey: key,
            validate: validateMethod
        });
    }

    // Add Regular Expression Validator
    access.addRegularExpressionValidator = function (key, regularExpression) {

        // Support string regular expressions
        if (typeof regularExpression === 'string') {
            regularExpression = new RegExp(regularExpression, 'i');
        }

        validatorTypes.push({
            validatorKey: key,
            validate: function (inputElement) {
                var isValid = true;

                if (inputElement.val()) {
                    if (!regularExpression.test(inputElement.val())) {
                        isValid = false;
                    }
                }
                return isValid;
            }
        });
    };

    // Validate Element
    access.validateElement = function (element) {

        // Skip validation for this element
        if (element.attr('data-disable-validation') === 'true') {
            return true;
        }

        var isValid = true;
        var elementId = element.attr('id');
        var elementName = element.attr('name');

        // Find error keys for element
        var keys = [];
        var $errorMessage = $('[' + forAttr + '="' + elementId + '"]');
        $errorMessage.each(function () {
            keys.push($(this).attr(typeAttr));
        });

        for (var i = 0; i < keys.length; i++) {
            var validator = access.getValidator(keys[i]);

            if (validator !== null) {
                if (!validator.validate(element)) {
                    isValid = false;
                    access.showErrorMessage(element, keys[i], true);
                }
                else {
                    access.showErrorMessage(element, keys[i], false);
                }
            }
        }

        return isValid;
    };

    // deactivate elements for validation
    access.setElementActive = function (elementId, active) {
        if (active) {
            $('#' + elementId).removeAttr('data-disable-validation');
        }
        else {
            $('#' + elementId).attr('data-disable-validation', 'true');
        }
    }

    // Show or hide error message
    access.showErrorMessage = function (element, errorType, show) {
        var $errorMessageTag;
        var elementId = element.attr('id');
        var elementName = element.attr('name');

        $errorMessageTag = $(errorMessageSelector + '[' + forAttr + '="' + elementId + '"][' + typeAttr + '="' + errorType + '"]');

        // there was no specific error message so look for a generic one
        if ($errorMessageTag === undefined || $errorMessageTag.length === 0) {
            $errorMessageTag = $(errorMessageSelector + '[' + forAttr + '="' + elementId + '"]');
        }

        // Still haven't found a validation message so let's search by name instead of ID (this is the case for Radio buttons)
        if ($errorMessageTag === undefined || $errorMessageTag.length === 0) {
            $errorMessageTag = $(errorMessageSelector + '[' + forAttr + '="' + elementName + '"][' + typeAttr + '="' + errorType + '"]');

            // Still no luck, Look for generic error message using name attribute
            if ($errorMessageTag === undefined || $errorMessageTag.length === 0) {
                $errorMessageTag = $(errorMessageSelector + '[' + forAttr + '="' + elementName + '"]');
            }
        }

        // Couldn't find a error message for the element, so we'll spit out a console message
        if ($errorMessageTag === undefined || $errorMessageTag.length === 0) {
            console.log('Could not find an error message for element with id "' + elementId + '" and name "' + elementName + '"');
        }

        if (show) {
            element.addClass(inputFieldErrorClass);
            $errorMessageTag.show();
        }
        else {
            $errorMessageTag.hide();

            // if there are currently other error messages we shouldn't remove the field-error class
            if ($('[' + forAttr + '="' + elementId + '"]:visible').length > 0) {
                //console.log('There are visible errors');
                //console.log($('[' + forAttr + '="' + elementId + '"]:visible'));
            }
            else {
                element.removeClass(inputFieldErrorClass);
            }

        }
    };

    // Get a validator by its key
    access.getValidator = function (validatorKey) {
        for (var i = 0; i < validatorTypes.length; i++) {
            if (validatorTypes[i].validatorKey === validatorKey) {
                return validatorTypes[i];
            }
        }
        return null;
    };

    // Validate all forms marked with data-validate
    access.validateForm = function (outerSelector) {
        var validationElements = getValidateElements(outerSelector);

        var isValid = true;
        validationElements.each(function () {
            var $inputElement = $(this);
            $inputElement.attr(cleanAttr, 'false');
            if (!access.validateElement($inputElement)) {
                isValid = false;
            }
        });
        return isValid;
    };

    // Hide all the validation messages
    access.clearValidators = function (outerSelector) {
        $(outerSelector + ' .' + inputFieldErrorClass).removeClass(inputFieldErrorClass);
        $(outerSelector + ' [' + cleanAttr + ']').attr(cleanAttr, 'true');
        $(outerSelector + ' ' + errorMessageSelector).hide();
    };

    var typeTimeout = null;

    getValidateElements = function (outerSelector) {
        var ids = [];

        var $errorMessages = null;

        if (!outerSelector) {
            $errorMessages = $('[' + forAttr + ']');
            $errorMessages.each(function () {
                var id = $(this).attr(forAttr) + '';
                if ($.inArray(id, ids) === -1) {
                    ids.push(id);
                }
            });
        }
        else {
            $errorMessages = $(outerSelector + ' [' + forAttr + ']');
            $errorMessages.each(function () {
                var id = $(this).attr(forAttr) + '';
                if ($.inArray(id, ids) === -1) {
                    ids.push(id);
                }
            });
        }

        return $($.map(ids, function (i) { return document.getElementById(i) }));
    };

    // Wire validation change to all validated elements in outerSelector and call onValidate
    access.groupValidationChangeHook = function (outerSelector, onValidate) {
        var v = getValidateElements(outerSelector);
        var rrr = $(outerSelector + ' [' + forAttr + ']');
        v.each(function () {
            //console.log($(this));
        });

        v.on('keyup', function () {
            if (onValidate) {
                onValidate();
            }
        });
    }

    // Initialise
    access.init = function () {
        var validationElements = getValidateElements();
        validationElements.attr(cleanAttr, 'true');

        validationElements.on('change cut paste', function () {
            var $this = $(this);
            setTimeout(function () {
                access.validateElement($this);
                $this.attr(cleanAttr, 'false');
            }, 0);
        });

        validationElements.on('keyup',
            function () {
                var $this = $(this);
                if ($this.attr(cleanAttr) !== 'true') {
                    // Using a timeout to reduce processing for faster typing
                    clearTimeout(typeTimeout);
                    typeTimeout = setTimeout(function () {
                        // don't validation on key up if decorated with 'data-no-keyup-validation' attribute
                        if ($this.attr('data-no-keyup-validation') === undefined) {
                            access.validateElement($this);
                        }
                    }, keyDelay);
                }
            });

        $(errorMessageSelector).hide();

        // Prevent form from submitting is validation fails
        $(document).on('submit', 'form[data-validate]', function () {
            return access.validateForm();
        });
    }

    return access;
})();

// ---------------------------------------------------
// Known Validators
// ---------------------------------------------------

// Required
validation.addValidator('required', function (inputElement) {

    // For radio buttons we use name attribute rather than id as this is how they are bound together
    if (inputElement.prop('tagName') === 'INPUT' && inputElement.prop('type') === 'radio') {
        var radioVal = $('input[name=' + inputElement.prop('name') + ']:checked').val();
        return (radioVal !== undefined);
    }

    if (inputElement.prop('tagName') === 'INPUT' && inputElement.prop('type') === 'checkbox') {
        return inputElement.prop('checked');
    }

    return (inputElement.val() !== null && inputElement.val() !== '');
});

// Email
//validation.addRegularExpressionValidator('email', /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,5})$/);
//validation.addRegularExpressionValidator('email', /^([A-Za-z0-9_\-\.])+(\+([A-Za-z0-9_\-\.])+)?\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,5})$/);
validation.addRegularExpressionValidator('email', /^([A-Za-z0-9_\-\.])+(\+([A-Za-z0-9_\-\.])+)?([A-Za-z0-9_\-])+\@([A-Za-z0-9_\-])+([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,5})$/);

// Url
validation.addRegularExpressionValidator('url', '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$');

// Length Range
validation.addValidator('length-range', function (element) {
    var min = parseInt(element.attr('data-min-length'));
    var max = parseInt(element.attr('data-max-length'));

    if (element.val().length === 0) {
        return true;
    }
    if (!isNaN(min) && (element.val().length < min)) {
        return false;
    }
    if (!isNaN(max) && (element.val().length > max)) {
        return false;
    }
    return true;
});

// Numeric Range (supports data-min-value and data-max-value)
validation.addValidator('numeric', function (element) {
    var min = parseFloat(element.attr('data-min-value'));
    var max = parseFloat(element.attr('data-max-value'));

    // Only validate if there is a value
    if (element.val().length > 0) {
        if (/^-?\d+(\.\d+)?$/.test(element.val())) {
            var value = parseFloat(element.val());
            if (!isNaN(min) && value < min) {
                return false;
            }
            if (!isNaN(max) && value > max) {
                return false;
            }
            return true;
        }
        return false;
    }
    return true;
});

// Integer Range (supports data-min-value and data-max-value)
validation.addValidator('integer', function (element) {
    var min = parseInt(element.attr('data-min-value'));
    var max = parseInt(element.attr('data-max-value'));

    // Only validate if there is a value
    if (element.val().length > 0) {
        if (/^-?\d+(\d+)?$/.test(element.val())) {
            var value = parseInt(element.val());
            if (!isNaN(min) && value < min) {
                return false;
            }
            if (!isNaN(max) && value > max) {
                return false;
            }
            return true;
        }
        return false;
    }
    return true;
});

// Postcode
validation.addRegularExpressionValidator('postcode', /^([0-9]{4})$/);

// Short date 31/12/1900 (doesn't check valid dates)
validation.addRegularExpressionValidator('shortdate', /^(3[0-1]|2[0-9]|1[0-9]|([0]?[1-9]))\/(12|11|10|([0]?[1-9]))\/((19|20)[0-9][0-9])$/);

// Culture short dates
validation.addRegularExpressionValidator('shortdateD/MM/YYYY', /^(3[0-1]|2[0-9]|1[0-9]|([0]?[1-9]))\/(12|11|10|([0][1-9]))\/((19|20)[0-9][0-9])$/);
validation.addRegularExpressionValidator('shortdateYYYY/MM/DD', /^((19|20)[0-9][0-9])\/(12|11|10|([0][1-9]))\/(3[0-1]|2[0-9]|1[0-9]|([0][1-9]))$/);
validation.addRegularExpressionValidator('shortdateMM/DD/YYYY', /^(12|11|10|([0][1-9]))\/(3[0-1]|2[0-9]|1[0-9]|([0]?[1-9]))\/((19|20)[0-9][0-9])$/);
validation.addRegularExpressionValidator('shortdateM/D/YYYY', /^(12|11|10|([0]?[1-9]))\/(3[0-1]|2[0-9]|1[0-9]|([0]?[1-9]))\/((19|20)[0-9][0-9])$/);

// Foot/Inches height eg: 6'11", 5', 4' 1"
validation.addRegularExpressionValidator('ft-height', /^[3-7]'( )?(((1[0-1]|[0-9])\")?)$/);

// Start
$(document).ready(validation.init);