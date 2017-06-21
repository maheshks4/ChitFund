(function (angular, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['angular'], function (angular) {
            return factory(angular);
        });
    } else {
        return factory(angular);
    }
}(angular || null, function (angular) {
    'use strict';
    var psm = angular.module('ngExDialog', []);

    //Not used. Set a provider level variable instead.
    //psm.value('dialogDefaults', ['exDialog', function (exDialog) {
    //    return exDialog.getDefaults();
    //}]);
    var dialogDefaults;
    var hasDragged = false;

    //Main configurable dialog provider.
    psm.provider('exDialog', function () {
        var style = (document.body || document.documentElement).style;
        var animationEndSupport = angular.isDefined(style.animation) || angular.isDefined(style.WebkitAnimation) || angular.isDefined(style.OAnimation) || angular.isDefined(style.MozAnimation) || angular.isDefined(style.MsAnimation);
        var animationEndEvent = 'animationend webkitAnimationEnd oanimationend mozAnimationEnd MSAnimationEnd ';
        var scope;
        var closeByEvents;
        var seqNumber = 0;
        var dialogCount = 0;
        var deferList = {};

        //Default settings. Will be overwritten by settings from app level.
        dialogDefaults = this.dialogDefaults = {
            template: 'commonDialog.html',
            width: '300px',
            closeByXButton: true,
            closeByClickOutside: true,
            closeByEscKey: true,
            appendToElement: '',
            beforeCloseCallback: '',
            grayBackground: true,
            cacheTemplate: true,
            draggable: true,
            animation: true,
            //Internal uses.
            messageTitle: 'Information',
            messageIcon: 'info',
            messageCloseButtonLabel: 'OK',
            confirmTitle: 'Confirmation',
            confirmIcon: 'question',
            confirmActionButtonLabel: 'Yes',
            confirmCloseButtonLabel: 'No'
        };

        this.setDefaults = function (newDefaults) {
            angular.extend(dialogDefaults, newDefaults);
        };

        //Main provider method.
        this.$get = ['$document', '$templateCache', '$compile', '$q', '$http', '$rootScope', '$timeout', '$window', '$controller', function ($document, $templateCache, $compile, $q, $http, $rootScope, $timeout, $window, $controller) {

            //Flag to disable dragging for input fields.
            $rootScope.noDrag = false;
            
            var elemBody = $document.find('body');

            //Process real close here.
            var ProcessClose = function (dialogObj, value) {
                var id = dialogObj.attr('id');
                var animation = dialogObj[0].animation; //Animation flag.

                dialogObj.unbind('click');

                if (dialogCount === 1) {
                    elemBody.unbind('keydown');
                }

                //Deduct dialog count.
                if (!dialogObj.hasClass(animation ? 'dialog-closing' : 'dialog-closing-no-animation')) {
                    dialogCount -= 1;
                }

                $rootScope.$broadcast('exDialog.closing', dialogObj);

                var finishClose = function () {
                    dialogObj.remove();
                    if (dialogCount === 0) {
                        elemBody.removeClass('dialog-open');
                    }
                    $rootScope.$broadcast('exDialog.closed', dialogObj);
                }

                if (animation) {
                    if (animationEndSupport) {
                        scope.$destroy();
                        //The following line is not supported by Firefox.
                        dialogObj.unbind(animationEndEvent).bind(animationEndEvent, function () {
                            //IE and Chrome hit here.
                            finishClose();                            
                        }).addClass('dialog-closing');
                        //Not use this line, use "animation" false code block instead.
                        //}).addClass(animation ? 'dialog-closing' : 'dialog-closing-no-animation');
                    } else {
                        //Firefox hit here
                        finishClose();
                    }
                }
                else {
                    //Run this block of code for dialog without animation.
                    scope.$destroy();
                    dialogObj.addClass('dialog-closing-no-animation');
                    finishClose();
                }
                
                if (deferList[id]) {
                    deferList[id].resolve({
                        id: id,
                        value: value,
                        dialogObj: dialogObj,
                        dialogCount: dialogCount
                    });
                    delete deferList[id];
                }
            };

            var closeDialog = function (dialogObj, value) {
                //Handles before-close callback. Otherwise just close the dialog.
                var beforeCloseCallback = dialogObj.data('exDialogBeforeCloseCallback');
                if (beforeCloseCallback && angular.isFunction(beforeCloseCallback)) {
                    var beforeCloseCallbackResult = beforeCloseCallback.call(dialogObj, value);
                    if (angular.isObject(beforeCloseCallbackResult)) {
                        if (beforeCloseCallbackResult.closePromise) {
                            beforeCloseCallbackResult.closePromise.then(function () {
                                ProcessClose(dialogObj, value);
                            });
                        } else {
                            beforeCloseCallbackResult.then(function () {
                                ProcessClose(dialogObj, value);
                            }, function () {
                                return;
                            });
                        }
                    } else if (beforeCloseCallbackResult !== false) {
                        ProcessClose(dialogObj, value);
                    }
                } else {
                    ProcessClose(dialogObj, value);
                }
            };

            //For Esc key to close dialog.
            var onDocumentKeydown = function (event) {
                if (event.keyCode === 27) {
                    pubMembers.close('$escape');
                }
            };

            //Parameters for common template dialog and will be scope properties used by directive code.
            var getCommonParams = function (params) {
                return {
                    title: params.title,
                    icon: params.icon,
                    message: params.message,
                    actionButtonLabel: params.actionButtonLabel,
                    closeButtonLabel: params.closeButtonLabel,
                    closeAllDialogs: params.closeAllDialogs == undefined ? undefined : params.closeAllDialogs,
                    //Options for adding CSS classes.
                    dialogAddClass: params.dialogAddClass,
                    headerAddClass: params.headerAddClass,
                    titleAddClass: params.titleAddClass,
                    bodyAddClass: params.bodyAddClass,
                    messageAddClass: params.messageAddClass,
                    footerAddClass: params.footerAddClass,
                    actionButtonAddClass: params.actionButtonAddClass,
                    closeButtonAddClass: params.closeButtonAddClass
                };
            };

            var pubMembers = {
                getDefaults: function () {
                    return dialogDefaults;
                },
                /*
                 Three wrap functions; openMessage, openConfirm, and openPrime 
                 Base funciton: open
                 @params {Object}:
                 //These for message and confirm types with built-in template only.
                 - title {String} - dialog title in header, default to "information" or configured
                 - icon {String} - values are 'info', 'warning', 'question', 'error', default to "info" or configured
                 - message {String} - body message
                 - closeButtonLabel {String} - close button label, default to "OK" for alert and "No" for confirm, or configured
                 - actionButtonLabel {String} - Action button label, default to "Yes" for confirm, or configured
                 - closeAllDialogs {Boolean} - close all dialogs including parents
                 - keepOpenForAction {Boolean} - keep previous confirmation dialog open when clicking action button, default to undefined, or configured
                 - keepOpenForClose {Boolean} - keep previous confirmation dialog open when clicking close button, default to undefined, or configured
                 - dialogAddClass {String} - undefined
		         - headerAddClass  {String} - undefined
		         - titleAddClass {String} - undefined
		         - bodyAddClass {String} - undefined
		         - messageAddClass {String} - undefined
		         - footerAddClass {String} - undefined
		         - actionButtonAddClass {String} - undefined
		         - closeButtonAddClass {String} - undefined
                 
                 //These for all types including custom template.
                 - scope {Object} - source scope
                 - template {String} - id for ng-template script, url for file, or plain string containing HTML text. Required for openPrime()
                 - controller {String} - required if the custom template needs it.
                 - width (String} - dialog width, configured
                 - closeByXButton {Boolean} - show x close button, default true, or configured
                 - closeByEscKey {Boolean} - default true, or configured
                 - closeByClickOutside {Boolean} - default true, or configured
                 - closeImmediateParent {Boolean} - undefined
                 - closeImmediateParentByAction {Boolean} - undefined
                 - beforeCloseCallback {String|Function} - user supplied function name/function called before closing dialog (if set)
                 - grayBackground {Boolean} - default true, or configured
                 - cacheTemplate {Boolean} - default true, or configured //template cache
                 - draggable {Boolean} - default true, or configured
                 - animation {Boolean} - default true, or configured
                 @return {Object} dialog for open and openMessage(), premise for openConfirm()
                */
                //Message dialog.
                openMessage: function (prm1, message, title, icon) {
                    //Set parameter options.
                    var params = {};
                    if (angular.isObject(prm1) && prm1.scope != undefined && angular.isObject(prm1.scope)) {
                        //Use paramter object.
                        params = prm1;
                    }
                    else {
                        //Use simple individual paramters.
                        params.scope = prm1;
                        params.message = message;
                        params.title = title;
                        params.icon = icon;
                    }

                    if (params.scope && angular.isObject(params.scope)) {
                        //Items need to be processed from directives in template.
                        params.scope.dialogProp = getCommonParams(params);
                        params.scope.dialogProp.type = 'message';
                    }
                    else {
                        //Passed scope is required.
                        params.template = "<span>Error: No current scope in parameters<span>";
                    }
                    return pubMembers.open(params);
                },

                //Confirm dialog.
                openConfirm: function (prm1, message, title, icon) {
                    //Set parameter options.
                    var params = {};
                    if (angular.isObject(prm1) && prm1.scope != undefined && angular.isObject(prm1.scope)) {
                        params = prm1;
                    }
                    else {
                        params.scope = prm1;
                        params.message = message;
                        params.title = title;
                        params.icon = icon;
                    }

                    //Validate existence of passed scope.
                    if (params.scope == undefined || !angular.isObject(params.scope)) {
                        params.template = "<span>Error: No current scope in parameters<span>";
                        var dialog = exDialog.open(params);
                        return dialog;
                    }
                    else {
                        params.scope = params.scope.$new();
                        //Items need to be processed from directives in template.
                        params.scope.dialogProp = getCommonParams(params);
                        params.scope.dialogProp.type = 'confirm';

                        params.scope.confirm = function (value) {
                            defer.resolve(value);
                            //Keep previous dialog open or not.
                            if (params.keepOpenForAction == undefined || !params.keepOpenForAction) {
                                var dialogObj = angular.element(document.getElementById(openResult.id));
                                ProcessClose(dialogObj, value);
                                //If use pubMembers.close(), needs to pass id.
                                //pubMembers.close(openResult.id, value);

                                if (params.closeImmediateParentByAction) {
                                    //Get hard-coded index value. 
                                    var prevSeqNum = parseInt(openResult.id.substring(6)) - 1;
                                    var prevDialogObj = angular.element(document.getElementById('exmdlg' + prevSeqNum));
                                    closeDialog(prevDialogObj, value);
                                }
                            }
                        };
                        
                        var defer = $q.defer();
                        var openResult = pubMembers.open(params);
                        openResult.closePromise.then(function (data) {
                            if (data) {
                                return defer.reject(data.value);
                            }
                            return defer.reject();
                        });
                        return defer.promise;
                    }
                },

                //Prime dialog for customizing and data.
                openPrime: function (params) {
                    if (params.scope == undefined || !angular.isObject(params.scope)) {
                        params.template = "<span>Error: No current scope in parameters<span>";
                    }
                    else if (params.template == undefined || !angular.isString(params.template)) {
                        params.template = "<span>Error: No template defined<span>";
                    }
                    return pubMembers.open(params);
                },

                //Base dialog, usually not directly called.
                open: function (prms) {
                    var dialogObj, dialogParentObj;

                    var params = angular.copy(dialogDefaults);
                    if (prms == undefined) prms = {};
                    angular.extend(params, prms);

                    //Note: Method scope.closeThisAndPreviousDialogs() uses hard-coded index value 6 to get the number part.
                    seqNumber += 1;
                    var dialogId = 'exmdlg' + seqNumber;

                    var defer = deferList[dialogId] = $q.defer();

                    //Create the child scope for the dialog.
                    scope = angular.isObject(params.scope) ? params.scope.$new() : $rootScope.$new();

                    //Main process method.
                    $q.when(loadTemplate(params.template)).then(function (template) {
                        //Cache template.
                        if (params.template.trim().substring(0, 1) != '<') {
                            $templateCache.put(params.template, template);
                        }

                        //Set X-button.
                        if (params.closeByXButton) {
                            template += '<div class="x-close"></div>';
                        }

                        //Dialog main elemnent.
                        dialogObj = angular.element('<div id="' + dialogId + '" class="dialog-main" vertical-center ></div>');

                        //dialogMainAddClass can be used to add or overwrite items in the "dialog-main" although it's not shown in the params list.
                        if (params.dialogMainAddClass) {
                            dialogObj.addClass(params.dialogMainAddClass);
                        }

                        //Set draggable.
                        var draggable = "draggable";
                        if (params.draggable == false) {
                            draggable = "";
                        }

                        //Set animation and gray-background.
                        var contentCss, grayBackgroundCss;
                        if (params.animation) {
                            contentCss = "dialog-content";
                            grayBackgroundCss = params.grayBackground ? 'dialog-backgray' : 'dialog-backclear';
                        }
                        else {
                            contentCss = "dialog-content-no-animation";
                            grayBackgroundCss = params.grayBackground ? 'dialog-backgray-no-animation' : 'dialog-backclear';
                        }
                        dialogObj[0]["animation"] = params.animation;

                        //Add gray-background layer and dialog content elements.
                        dialogObj.html('<div class="' + grayBackgroundCss + '"></div><div class="' + contentCss + '" ' + draggable + ' >' + template + '</div>');

                        //Set dialog width (set it to dialog content element).
                        if (params.width) {
                            angular.element(dialogObj[0].children[1]).css('width', params.width);
                        }

                        //Bind template controller.
                        if (params.controller && angular.isString(params.controller)) {
                            $controller(params.controller, {
                                $scope: scope,
                                $element: dialogObj
                            });
                        }

                        //Set dialog parent element.
                        if (params.appendToElement && angular.isString(params.appendToElement)) {
                            dialogParentObj = angular.element(document.querySelector(params.appendToElement));
                        } else {
                            dialogParentObj = elemBody;
                        }

                        //Set before-close callback.
                        if (params.beforeCloseCallback) {
                            var beforeCloseCallback;
                            if (angular.isFunction(params.beforeCloseCallback)) {
                                beforeCloseCallback = params.beforeCloseCallback;
                            } else if (angular.isString(params.beforeCloseCallback)) {
                                if (scope) {
                                    if (angular.isFunction(scope[params.beforeCloseCallback])) {
                                        beforeCloseCallback = scope[params.beforeCloseCallback];
                                    } else if (scope.$parent && angular.isFunction(scope.$parent[params.beforeCloseCallback])) {
                                        beforeCloseCallback = scope.$parent[params.beforeCloseCallback];
                                    } else if ($rootScope && angular.isFunction($rootScope[params.beforeCloseCallback])) {
                                        beforeCloseCallback = $rootScope[params.beforeCloseCallback];
                                    }
                                }
                            }
                            if (beforeCloseCallback) {
                                dialogObj.data('exDialogBeforeCloseCallback', beforeCloseCallback);
                            }
                        }

                        //Bind closeDialog method to the scope so that it can called outside.		                
                        scope.closeThisDialog = function (value) {                            
                            //Passing keepOpen param will cancel this close request.
                            if ((value == 'action' && (params.keepOpenForAction == undefined || !params.keepOpenForAction)) || 
                               (value == 'close' && (params.keepOpenForClose == undefined || !params.keepOpenForClose))) {
                                closeDialog(dialogObj, value);

                                //Also check and close immediate parent dialog.
                                if (params.closeImmediateParent) {
                                    //Get hard-coded index value. 
                                    var prevSeqNum = parseInt(dialogId.substring(6)) - 1;
                                    var prevDialogObj = angular.element(document.getElementById('exmdlg' + prevSeqNum));
                                    closeDialog(prevDialogObj, value);
                                }
                            }
                            else {
                                //Resolve defer.premise for close button action if not close the dialog.
                                //Only for close button on confirmation dialog.
                                if (deferList[dialogId]) {
                                    deferList[dialogId].resolve({
                                        id: dialogId,
                                        value: value,
                                        dialogObj: dialogObj,
                                        dialogCount: dialogCount
                                    });
                                    delete deferList[dialogId];
                                }                               
                            }
                        };

                        //Compile and append the dialog.
                        $timeout(function () {
                            $compile(dialogObj)(scope);
                            elemBody.addClass('dialog-open');
                            dialogParentObj.append(dialogObj);

                            //Not used.
                            if (params.name) {
                                $rootScope.$broadcast('exDialog.opened', { dialog: dialogObj, name: params.name });
                            } else {
                                $rootScope.$broadcast('exDialog.opened', dialogObj);
                            }

                            //Focus on dialog after it is opened.
                            dialogObj[0].children[1].focus();
                        });

                        //Set for using Esc key to close dialog.
                        if (params.closeByEscKey) {
                            elemBody.bind('keydown', onDocumentKeydown);
                        }

                        closeByEvents = function (event) {
                            //For click-outside.
                            if (params.closeByClickOutside) {
                                if (angular.element(event.target).hasClass('dialog-backgray') ||
                                    angular.element(event.target).hasClass('dialog-backgray-no-animation') ||
                                    angular.element(event.target).hasClass('dialog-backclear')) {
                                    pubMembers.close(dialogObj.attr('id'), 'close', params.closeImmediateParent, params.closeAllDialogs);
                                }
                            }
                            //For X-button.
                            var hasXBtn = angular.element(event.target).hasClass('x-close');
                            if (hasXBtn) {
                                pubMembers.close(dialogObj.attr('id'), 'close', params.closeImmediateParent, params.closeAllDialogs);
                            }
                        };

                        dialogObj.bind('click', closeByEvents);

                        dialogCount += 1;                        

                        //Reset hasDragged flag.
                        hasDragged = false;

                        return pubMembers;
                    });

                    //Check to load template from cache or file.
                    function loadTemplate(template) {
                        if (!template || template == undefined || !angular.isString(template)) return 'No dialog template';
                        //var test = template.trim().substring(0, 1);
                        if (template.trim().substring(0, 1) == '<') {
                            return template;
                        }
                        else {
                            if (typeof params.cacheTemplate === 'boolean' && !params.cacheTemplate) {
                                return loadTemplateUrl(template, { cache: false });
                            }
                            return $templateCache.get(template) || loadTemplateUrl(template, { cache: true });
                        }
                    }

                    function loadTemplateUrl(template, config) {
                        return $http.get(template, (config || {})).then(function (res) {
                            return res.data || '';
                        });
                    }

                    //Return dialog object with these properties and a function.
                    return {
                        id: dialogId,
                        closePromise: defer.promise,
                        close: function (value) {
                            closeDialog(dialogObj, value);
                        }
                    };
                },

                //Both close() and closeAll() Can be called outside with provider prefix.
                close: function (id, value, closeImmediateParent, closeAllDialogs) {
                    if (closeAllDialogs) {
                        pubMembers.closeAll(value);
                    }
                    else {
                        var dialogObj = angular.element(document.getElementById(id));
                        closeDialog(dialogObj, value);
                        
                        //Also check and close immediate parent dialog.
                        if (closeImmediateParent) {
                            //Get hard-coded index value. 
                            var prevSeqNum = parseInt(dialogObj[0].id.substring(6)) - 1;
                            var prevDialogObj = angular.element(document.getElementById('exmdlg' + prevSeqNum));
                            closeDialog(prevDialogObj, value);
                        }
                    }                    
                },

                closeAll: function (value) {
                    var $all = document.querySelectorAll('.dialog-main');

                    angular.forEach($all, function (dialog) {
                        closeDialog(angular.element(dialog), value);
                    });
                }, 

                hasOpenDialog: function () {
                    if (document.querySelector('.dialog-main')) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
            };
            return pubMembers;
        }];
    });

    psm.controller('commonDialogController', ['$scope', 'exDialog', function ($scope, exDialog) {
        //Call for closing all opened dialogs.
        $scope.closeAllDialogs = function () {
            exDialog.closeAll();
        };
    }]);

    psm.directive('setDialogDiv', function () {
        return {
            restrict: 'EA', //E = element, A = attribute, C = class, M = comment
            link: function (scope, elem) {
                var sourceElem = angular.element(elem);
                if (scope.dialogProp.dialogAddClass) {
                    sourceElem.addClass(scope.dialogProp.dialogAddClass);
                }
            }
        }
    });

    psm.directive('setDialogHeader', function () {
        return {
            restrict: 'EA',
            link: function (scope, elem) {
                var sourceElem = angular.element(elem);
                if (scope.dialogProp.headerAddClass) {
                    sourceElem.addClass(scope.dialogProp.headerAddClass);
                }
            }
        }
    });

    psm.directive('setDialogTitle', function () {
        return {
            restrict: 'EA',
            link: function (scope, elem, attr) {
                var sourceElem = angular.element(elem);
                if (scope.dialogProp.title == undefined || scope.dialogProp.title == "") {
                    if (scope.dialogProp.progressBar) {
                        //Progress bar is not used.
                        scope.dialogProp.title = "Please wait..";
                    }
                    else {
                        if (scope.dialogProp.type == "confirm") {
                            scope.dialogProp.title = dialogDefaults.confirmTitle;
                        }
                        else {
                            scope.dialogProp.title = dialogDefaults.messageTitle;
                        }
                        sourceElem.text();
                    }
                }
                sourceElem.text(scope.dialogProp.title);

                if (scope.dialogProp.titleAddClass) {
                    sourceElem.addClass(scope.dialogProp.titleAddClass);
                }
            }
        }
    });

    psm.directive('setDialogBody', function () {
        return {
            restrict: 'EA',
            link: function (scope, elem) {
                var sourceElem = angular.element(elem);
                if (scope.dialogProp.bodyAddClass) {
                    sourceElem.addClass(scope.dialogProp.bodyAddClass);
                }
            }
        }
    });

    psm.directive('setDialogIcon', function () {
        return {
            restrict: 'EA',
            link: function (scope, elem) {
                var sourceElem = angular.element(elem);
                if (scope.dialogProp.icon) {
                    scope.dialogProp.icon = scope.dialogProp.icon.toLowerCase();
                }
                if (scope.dialogProp.type == 'confirm' && (scope.dialogProp.icon == undefined || scope.dialogProp.icon == "")) {
                    sourceElem.addClass("dialog-icon-" + dialogDefaults.confirmIcon);
                }
                else {
                    switch (scope.dialogProp.icon) {
                        case "info":
                            sourceElem.addClass("dialog-icon-info");
                            break;
                        case "warning":
                            sourceElem.addClass("dialog-icon-warning");
                            break;
                        case "error":
                            sourceElem.addClass("dialog-icon-error");
                            break;
                        case "question":
                            sourceElem.addClass("dialog-icon-question");
                            break;
                        case "none":
                            //Nothing
                            break;
                        default:
                            sourceElem.addClass("dialog-icon-" + dialogDefaults.messageIcon);
                    }
                }
            }
        }
    });

    psm.directive('setDialogMessage', function () {
        return {
            restrict: 'EA',
            link: function (scope, elem) {
                var sourceElem = angular.element(elem);
                if (scope.dialogProp.progressBar) {
                    sourceElem.html("<img src='/ngExDialog/Images/ajax-loader.gif' alt='Loading...'/>")
                }
                else {
                    sourceElem.text(scope.dialogProp.message);
                }
                if (scope.dialogProp.messageAddClass) {
                    sourceElem.addClass(scope.dialogProp.messageAddClass);
                }
            }
        }
    });

    psm.directive('setDialogFooter', function () {
        return {
            restrict: 'EA',
            link: function (scope, elem) {
                var sourceElem = angular.element(elem);
                if (scope.dialogProp.footerAddClass) {
                    sourceElem.addClass(scope.dialogProp.footerAddClass);
                }
            }
        }
    });

    psm.directive('setActionButton', function () {
        return {
            restrict: 'EA',
            link: function (scope, elem) {
                var actionButton = angular.element(elem);
                //Bypass non-confirm type.
                if (scope.dialogProp.type == 'confirm') {
                    if (scope.dialogProp.actionButtonLabel == undefined || scope.dialogProp.actionButtonLabel == '') {
                        scope.dialogProp.actionButtonLabel = dialogDefaults.confirmActionButtonLabel;
                    }
                    actionButton.text(scope.dialogProp.actionButtonLabel);

                    if (scope.dialogProp.actionButtonAddClass) {
                        actionButton.addClass(scope.dialogProp.actionButtonAddClass);
                    }
                }
            }
        }
    });

    psm.directive('setCloseButton', function ($timeout) {
        return {
            restrict: 'EA',
            link: function (scope, elem) {
                var closeButton = angular.element(elem);

                if (scope.dialogProp.closeButtonLabel == undefined || scope.dialogProp.closeButtonLabel == '') {
                    if (scope.dialogProp.type == "confirm") {
                        scope.dialogProp.closeButtonLabel = dialogDefaults.confirmCloseButtonLabel;
                    }
                    else {
                        scope.dialogProp.closeButtonLabel = dialogDefaults.messageCloseButtonLabel;
                    }
                }
                closeButton.text(scope.dialogProp.closeButtonLabel);

                //Make OK or No button a little wider.
                if (scope.dialogProp.closeButtonLabel == "OK" || (scope.dialogProp.closeButtonLabel).toUpperCase() == "NO") {
                    closeButton.addClass("padding-sides");
                }
                if (scope.dialogProp.closeButtonAddClass) {
                    closeButton.addClass(scope.dialogProp.closeButtonAddClass);
                }
            }
        }
    });

    psm.directive('verticalCenter', function ($window) {
        return function (scope, element) {
            var wd = angular.element($window);
            scope.$watch(function () {
                return {
                    'wh': window.innerHeight,  //Same as $window.innerHeight.
                    'sy': window.scrollY,      //Top invisible height when scroll down.
                    'ch': element[0].children[1].offsetHeight, //Dialog content height.                    
                };
            }, function (newValue) {  //Don't need oldValue here.              
                if (!hasDragged) {
                    //IE doesn't support scrollY but it automatically scrolls back to the top 0 position.
                    //The scrollY needs to be added for Google Chrome, Firefox, and Microsoft Edge.
                    var paddingTopValue = (newValue.wh - newValue.ch) / 2 + (newValue.sy == undefined ? 0 : newValue.sy);
                    if (paddingTopValue < 0) {
                        paddingTopValue = 0;
                    }
                    else {
                        //Padding a little less so that dialog appear a little top from center.
                        paddingTopValue = paddingTopValue - 30;
                    }
                    element.css('padding-top', paddingTopValue + 'px');
                }
            }, true);

            wd.bind('resize', function () {
                scope.$apply();
            });
        }
    });

    //Draggable directive taken and modified from: http://docs.angularjs.org/guide/compiler
    psm.directive('draggable', function ($document, $rootScope) {
        "use strict";
        return function (scope, element) {
            var startX = 0, startY = 0;
            var x = 0, y = 0;
            
            element.css({
                position: 'relative',
                cursor: 'move' //'pointer' 
            });
            element.on('mousedown', function (event) {
                //Prevent default dragging of selected content.
                //Not used here since this disables input fields.
                //event.preventDefault();
                startX = event.screenX - x;
                startY = event.screenY - y;                                
                $document.on('mousemove', mousemove);
                $document.on('mouseup', mouseup);
            });

            function mousemove(event) {                
                
                //Flag passed from input elements: ng-focus="setDrag(true)" ng-blur="setDrag(false)".
                if (!$rootScope.noDrag) {
                    y = event.screenY - startY;
                    x = event.screenX - startX;

                    element.css({
                        top: y + 'px',
                        left: x + 'px'
                    });                    
                    //element[0].focus();

                    //Flag set for disabling vertical re-center after any dragging.
                    hasDragged = true;

                    //Disable element/text selection.
                    window.getSelection().removeAllRanges();
                }                
            }

            function mouseup() {
                $document.unbind('mousemove', mousemove);
                $document.unbind('mouseup', mouseup);
            }
        };
    });

    //Cache commonDialog template used for default simple and confirm dialogs.
    psm.run(['$templateCache', function ($templateCache) {
        $templateCache.put('ngExDialog/commonDialog.html', '<div ng-controller="commonDialogController" set-dialog-div><div class="dialog-header" set-dialog-header><div class="dialog-title" set-dialog-title></div></div><div class="dialog-message dialog-body" set-dialog-body><table style="width:100%;"><tr><td><div set-dialog-icon></div></td><td><div class="dialog-message-body" set-dialog-message></div></td></tr></table></div><div class="dialog-buttons dialog-footer" set-dialog-footer><button type="button" class="dialog-button dialog-button-secondary"  ng-click="dialogProp.closeAllDialogs?closeAllDialogs():closeThisDialog(\'close\')" ng-show="dialogProp.closeButtonLabel != undefined && dialogProp.closeButtonLabel != \'\'" set-close-button></button><button type="button" class="dialog-button dialog-button-primary" ng-click="confirm(\'action\')" ng-show="dialogProp.actionButtonLabel != undefined && dialogProp.actionButtonLabel != \'\'" set-action-button></button></div></div>');
    }]);

}));
