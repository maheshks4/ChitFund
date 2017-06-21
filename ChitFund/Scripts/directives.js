'use strict';


/* grid Directives */
angular.module('myApp.directives', function () {
})
.directive('optionsClass', function ($parse) {
    return {
        //require: ['select','option'],
        link: function (scope, elem, attrs) {
            if (elem[0].tagName == "SELECT") {
                //get the source for items array that populates the select.
                var optionsSourceStr = attrs.ngOptions.split(' ').pop(),

                //use $parse to get a function from options-class attribute.
                getOptionsClass = $parse(attrs.optionsClass);

                scope.$watch(optionsSourceStr, function (items) {
                    //when the options source changes loop through its items.
                    angular.forEach(items, function (item, index) {
                        //evaluate against the item to get a mapping object for classes.
                        var classes = getOptionsClass(item);

                        //get option by looking for appropriate index in value attribute.
                        //var option = elem.find('option[value=' + * + ']'); //Not work.
                        var option = elem.children()[index];

                        //loop through the key/value pairs in mapping object and conditinally apply classes.
                        //use Array.some for breaking loop after matching.
                        //classes.some(function (type, className) {});
                        //But need iterate all possible classes...
                        angular.forEach(classes, function (type, className) {
                            if ((type == "placeholder" && index == 0) ||
                                (type != "placeholder" && index > 0)) {
                                angular.element(option).addClass(className);
                            }
                        });
                    });
                });
            }
            else if (elem[0].tagName == "OPTION") {
                //Used if placeholder item is included in server data return.
                getOptionsClass = $parse(attrs.optionsClass);
                var classes = getOptionsClass();
                angular.forEach(classes, function (type, className) {
                    if ((type == "placeholder" && elem[0].parentElement.children.length == 1) ||
                        (type != "placeholder" && elem[0].parentElement.children.length > 1)) {
                        angular.element(elem).addClass(className);
                    }
                });
            }
        }
    };
})
.directive('optionsClass', function ($parse) {
    return {
        //require: ['select','option'],
        link: function (scope, elem, attrs) {
            if (elem[0].tagName == "SELECT") {
                //get the source for items array that populates the select.
                var optionsSourceStr = attrs.ngOptions.split(' ').pop(),

                //use $parse to get a function from options-class attribute.
                getOptionsClass = $parse(attrs.optionsClass);

                scope.$watch(optionsSourceStr, function (items) {
                    //when the options source changes loop through its items.
                    angular.forEach(items, function (item, index) {
                        //evaluate against the item to get a mapping object for classes.
                        var classes = getOptionsClass(item);

                        //get option by looking for appropriate index in value attribute.
                        //var option = elem.find('option[value=' + * + ']'); //Not work.
                        var option = elem.children()[index];

                        //loop through the key/value pairs in mapping object and conditinally apply classes.
                        //use Array.some for breaking loop after matching.
                        //classes.some(function (type, className) {});
                        //But need iterate all possible classes...
                        angular.forEach(classes, function (type, className) {
                            if ((type == "placeholder" && index == 0) ||
                                (type != "placeholder" && index > 0)) {
                                angular.element(option).addClass(className);
                            }
                        });
                    });
                });
            }
            else if (elem[0].tagName == "OPTION") {
                //Used if placeholder item is included in server data return.
                getOptionsClass = $parse(attrs.optionsClass);
                var classes = getOptionsClass();
                angular.forEach(classes, function (type, className) {
                    if ((type == "placeholder" && elem[0].parentElement.children.length == 1) ||
                        (type != "placeholder" && elem[0].parentElement.children.length > 1)) {
                        angular.element(elem).addClass(className);
                    }
                });
            }
        }
    };
})

.directive('autoFocus', function ($timeout) {
    return {
        restrict: 'AC',
        link: function (scope, element) {
            $timeout(function () {
                element[0].focus();
            }, 0);
        }
    };
})
//.directive('onFinishRender', function ($timeout) {
//    return {
//        restrict: 'A',
//        link: function (scope, element, attr) {
//            if (scope.$last === true) {
//                $timeout(function () {
//                    scope.$emit('ngRepeatFinished');
//                });
//            }
//        }
//    }
//    //Caller:
//    //$scope.$on('ngRepeatFinished', function (ngRepeatFinishedEvent) {
//    //    //you also get the actual event object
//    //    //do stuff, execute functions -- whatever...
//    //});
//})

.directive('setNameObject', function ($timeout) {
    return {
        restrict: 'A',
        //priority: 0,        
        link: function (scope, iElement, iAttrs, ctrls) {
            var name = iElement[0].name;
            var baseName = name.split("_")[0];
            var scopeForm = scope[iElement[0].form.name];

            scope.$watch(scopeForm, function () {
                $timeout(function () {
                    if (scopeForm[name] != undefined) {
                        //Shallow copy to reference existing object (deep copy doesn't work here).
                        scopeForm[baseName + '_' + scope.$index] = scopeForm[name];
                        //Change $name property.
                        scopeForm[baseName + '_' + scope.$index].$name = baseName + '_' + scope.$index;
                    }
                });
            });
        }
    };
})

.directive('ngValidator', function () {
    //SW: substantial modifications from original code downloaded from https://github.com/turinggroup/angular-validator.
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            // DOM form element
            var DOMForm = angular.element(element)[0];

            // Scope form model - All validation states are contained here
            var form_name = DOMForm.attributes['name'].value;
            var scopeForm = scope[form_name];

            // Set the default submitted state to false
            scopeForm.submitted = false;

            // Watch form length to add watches for new form elements
            scope.$watch(function () { return DOMForm.length; }, function () {
                setupWatches(DOMForm);
            });

            // Intercept and handle submit events of the form
            element.on('submit', function (event) {
                event.preventDefault();
                scope.$apply(function () {
                    scopeForm.submitted = true;
                });

                // If the form is valid then call the function that is declared in the angular-validator-submit attribute on the form element
                if (scopeForm.$valid) {
                    scope.$apply(function () {
                        scope.$eval(DOMForm.attributes["ng-validator-submit"].value);
                    });
                }
            });

            //SW: this function is never used.
            scopeForm.reset = function () {
                // Clear all the form values
                for (var i = 0; i < DOMForm.length; i++) {
                    if (DOMForm[i].name) {
                        scopeForm[DOMForm[i].name].$setViewValue("");
                        scopeForm[DOMForm[i].name].$render();
                    }
                }
                scopeForm.submitted = false;
                scopeForm.$setPristine();
            };

            // Iterate through the form fields and setup watches on each one
            function setupWatches(formElement) {
                for (var i = 0; i < formElement.length; i++) {
                    // This ensures we are only watching form fields
                    if (i in formElement)
                        setupWatch(formElement[i]);
                }
            }

            // Setup $watch on a single formfield
            function setupWatch(elementToWatch) {
                if (elementToWatch.isWatchedByValidator) {
                    return;
                }
                elementToWatch.isWatchedByValidator = true;

                // If element is set to validate on blur then update the element on blur
                if ("validate-on" in elementToWatch.attributes && elementToWatch.attributes["validate-on"].value === "blur") {
                    angular.element(elementToWatch).on('blur', function (event) {
                        updateValidationMessage(elementToWatch);
                        updateValidationClass(elementToWatch);
                    });
                }

                //SW: added for clearing validation message on focus.
                if ("clear-on" in elementToWatch.attributes && elementToWatch.attributes["clear-on"].value === "focus") {
                    angular.element(elementToWatch).on('focus', function (event) {
                        //Make sure the element is a form field and not a button for example
                        //Only form elements should have names. 
                        if (!(elementToWatch.name in scopeForm)) {
                            return;
                        }
                        //Remove validation messages 
                        var validationMessageElement = isValidationMessagePresent(elementToWatch);
                        if (validationMessageElement) {
                            validationMessageElement.remove();
                        }
                        //Remove parent "has-error" class.
                        angular.element(elementToWatch.parentNode).removeClass('has-error');
                    });
                }

                scope.$watch(function () {
                    return elementToWatch.value + elementToWatch.required + scopeForm.submitted + checkElementValidity(elementToWatch) + getDirtyValue(scopeForm[elementToWatch.name]) + getValidValue(scopeForm[elementToWatch.name]);
                }, function () {
                    if (scopeForm.submitted) {
                        updateValidationMessage(elementToWatch);
                        updateValidationClass(elementToWatch);
                    }
                    else {
                        // Determine if the element in question is to be updated on dirty.
                        var isDirtyElement = "validate-on" in elementToWatch.attributes && elementToWatch.attributes["validate-on"].value === "dirty";

                        if (isDirtyElement) {
                            updateValidationMessage(elementToWatch);
                            updateValidationClass(elementToWatch);
                        }
                            // This will get called in the case of resetting the form. This only gets called for elements that update on blur and submit.
                        else if (scopeForm[elementToWatch.name] && scopeForm[elementToWatch.name].$pristine) {
                            updateValidationMessage(elementToWatch);
                            updateValidationClass(elementToWatch);
                        }
                    }
                });
            }
            // Returns the $dirty value of the element if it exists
            function getDirtyValue(element) {
                if (element) {
                    if ("$dirty" in element)
                        return element.$dirty;
                }
            }
            function getValidValue(element) {
                if (element) {
                    if ("$valid" in element)
                        return element.$valid;
                }
            }

            function checkElementValidity(element) {
                // If element has a custom validation function
                if ("validator" in element.attributes) {
                    // Call the custom validator function
                    var isElementValid = scope.$eval(element.attributes.validator.value);
                    scopeForm[element.name].$setValidity("ngValidator", isElementValid);
                    return isElementValid;
                }
            }

            // Adds and removes an error message as a sibling element of the form field.
            function updateValidationMessage(element) {
                // Make sure the element is a form field and not a button for example
                // Only form elements should have names. 
                if (!(element.name in scopeForm)) {
                    return;
                }

                var scopeElementModel = scopeForm[element.name];

                // Remove all validation messages 
                var validationMessageElement = isValidationMessagePresent(element);
                if (validationMessageElement) {
                    validationMessageElement.remove();
                }

                //SW: re-write all code until end of the function.
                var msgText = "";
                var isCustom = false;

                //Add and activate validation messages if the form field is $visited, $dirty, or the form has been submitted.
                if (scopeElementModel.$visited || scopeElementModel.$dirty || (scope[element.form.name] && scope[element.form.name].submitted)) {
                    if (scopeElementModel.$error.required &&
                         (scopeElementModel.$viewValue == "" || scopeElementModel.$viewValue == undefined)) {
                        if ("required-message" in element.attributes)
                            msgText = element.attributes['required-message'].value;
                        else
                            msgText = "'Field is required'";
                    }
                    else if (scopeElementModel.$error.maxlength) {
                        if ("max-length-message" in element.attributes)
                            msgText = element.attributes['max-length-message'].value;
                        else
                            msgText = "'Field is too long'";
                    }
                    else if ("number" in element.attributes) {
                        //Numeric field custom validation.
                        if (!isFinite(scopeElementModel.$viewValue)) {
                            //Set validity token.
                            scopeElementModel.$setValidity("number", false);

                            if (element.attributes['invalid-number-message'].value)
                                msgText = element.attributes['invalid-number-message'].value;
                            else
                                msgText = "Invalid number'";
                        }
                        else {
                            //Reset validity token.
                            if (scopeElementModel.$error.number)
                                scopeElementModel.$setValidity("number", true);
                        }
                        if ("max-number" in element.attributes &&
                                Number(scopeElementModel.$viewValue) > Number(element.attributes["max-number"].value)) {
                            scopeElementModel.$setValidity("max", false);

                            if ("max-number-message" in element.attributes)
                                msgText = element.attributes["max-number-message"].value;
                            else
                                msgText = "'Too large number'";
                        }
                        else {
                            if (scopeElementModel.$error.max)
                                scopeElementModel.$setValidity("max", true);
                        }
                        if ("min-number" in element.attributes &&
                                Number(scopeElementModel.$viewValue) < Number(element.attributes["min-number"].value)) {
                            scopeElementModel.$setValidity("min", false);

                            if ("min-number-message" in element.attributes)
                                msgText = element.attributes["min-number-message"].value;
                            else
                                msgText = "'Too small number'";
                        }
                        else {
                            if (scopeElementModel.$error.min)
                                scopeElementModel.$setValidity("min", true);
                        }
                    }
                    else if ("date" in element.attributes &&
                            (scopeElementModel.$viewValue != "" && scopeElementModel.$viewValue != undefined)) {
                        //Date field custom validation.
                        //Test:
                        //var te = Date.parse(scopeElementModel.$viewValue);
                        //var tn = isValidDate(scopeElementModel.$viewValue);
                        if (isNaN(Date.parse(scopeElementModel.$viewValue)) || !isValidDate(scopeElementModel.$viewValue)) {
                            //Set validity token.
                            scopeElementModel.$setValidity("date", false);

                            if (element.attributes['invalid-date-message'].value)
                                msgText = element.attributes['invalid-date-message'].value;
                            else
                                msgText = "'Invalid date'";
                        }
                        else {
                            //Reset validity token.
                            if (scopeElementModel.$error.date)
                                scopeElementModel.$setValidity("date", true);
                        }
                        if ("max-date" in element.attributes &&
                                Date.parse(scopeElementModel.$viewValue) > Date.parse(element.attributes["max-date"].value.replace(/'/g, ""))) {
                            scopeElementModel.$setValidity("maxDate", false);

                            if ("max-date-message" in element.attributes)
                                msgText = element.attributes["max-date-message"].value;
                            else
                                msgText = "'Date exceeds maximum value'";
                        }
                        else {
                            if (scopeElementModel.$error.maxDate)
                                scopeElementModel.$setValidity("maxDate", true);
                        }
                        if ("min-date" in element.attributes &&
                                Date.parse(scopeElementModel.$viewValue) < Date.parse(element.attributes["min-date"].value.replace(/'/g, ""))) {
                            scopeElementModel.$setValidity("minDate", false);

                            if ("min-date-message" in element.attributes)
                                msgText = element.attributes["min-date-message"].value;
                            else
                                msgText = "'Date below minimum value'";
                        }
                        else {
                            if (scopeElementModel.$error.minDate)
                                scopeElementModel.$setValidity("minDate", true);
                        }
                    }

                    else if (!scopeElementModel.$valid) {
                        if ("invalid-message" in element.attributes)
                            msgText = element.attributes['invalid-message'].value;
                        else
                            msgTextg = "'Field is invalild'";
                    }

                    if (msgText != "") {
                        var msgAfterElem;
                        if ("message-after" in element.attributes)
                            msgAfterElem = document.getElementById(element.attributes["message-after"].value);
                        else msgAfterElem = element;

                        angular.element(msgAfterElem).after(generateErrorMessage(msgText, element));
                    }
                    else {
                        //Do something when having passed validation.

                        //Reset $visited flag to false.
                        scopeElementModel.$visited = false;
                    }
                }
            }

            //Function to check if the date is valid in the calenda. 
            Date.prototype.valid = function () {
                return isFinite(this);
            }
            function isValidDate(value) {
                var d = new Date(value);
                if (typeof value === 'string' || value instanceof String) {
                    return d.valid() && value.split('/')[0] == (d.getMonth() + 1);
                }
                else {
                    return d.valid();
                }
            }

            function generateErrorMessage(messageText, element) {
                //return "<label class='control-label has-error validationMessage'>" + scope.$eval(messageText) + "</label>";
                //SW: re-wrote.
                var displayClass = "";
                if ("message-display-class" in element.attributes) {
                    displayClass = element.attributes["message-display-class"].value;
                }
                return "<span class='help-block has-error validationMessage " + displayClass + "' >" + scope.$eval(messageText) + "</span>";
            }

            // Returns the validation message element or False
            function isValidationMessagePresent(element) {
                var elementSiblings = angular.element(element).parent().children();
                for (var i = 0; i < elementSiblings.length; i++) {
                    if (angular.element(elementSiblings[i]).hasClass("validationMessage")) {
                        return angular.element(elementSiblings[i]);
                    }
                }
                return false;
            }

            // Adds and removes .has-error class to the form element's parent
            function updateValidationClass(element) {
                // Make sure the element is a form field and not a button for example
                // Only form fields should have names. 
                if (!(element.name in scopeForm)) {
                    return;
                }
                var formField = scopeForm[element.name];
                angular.element(element.parentNode).removeClass('has-error');

                // Only add/remove validation classes if the field is $dirty or the form has been submitted
                if (formField.$visited || formField.$dirty || (scope[element.form.name] && scope[element.form.name].submitted)) {
                    if (formField.$invalid) {
                        angular.element(element.parentNode).addClass('has-error');
                    }
                }
            }
        }
    };
})
;
