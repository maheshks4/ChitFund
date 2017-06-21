'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', ['ngRoute', 'myApp.directives', 'myApp.controllers', 'myApp.AppServices', 'ui.bootstrap', 'ngTable', 'ngExDialog', 'ajaxLoader', 'nvd3', 'gridster'])
    .config(function ($compileProvider){
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel):/);
    })
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/', {templateUrl: 'partials/home.html'});
        $routeProvider.when('/DashboardView', { templateUrl: 'partials/Dashboard.html', controller: 'dashboardCtrl' });
        $routeProvider.when('/repeatView', {templateUrl: 'partials/repeat.html', controller: 'RepeatCtrl'});
        $routeProvider.when('/showView', {templateUrl: 'partials/show.html', controller: 'ShowCtrl'});
        $routeProvider.when('/UserView', { templateUrl: 'partials/UserList.html', controller: 'contactListController' });
        $routeProvider.when('/customView', {templateUrl: 'partials/customEvent.html', controller: 'RepeatCtrl'});
        $routeProvider.otherwise({redirectTo: '/'});
  }])
//Dialog default settings.
.config(['exDialogProvider', function (exDialogProvider) {
    exDialogProvider.setDefaults({
        template: 'ngExDialog/commonDialog.html',
        width: '330px',
        //closeByXButton: true,
        //closeByClickOutside: true,
        //closeByEscKey: true,
        //appendToElement: '',
        //beforeCloseCallback: '',
        //grayBackground: true,
        //cacheTemplate: true,
        //draggable: true,
        //animation: true,
        //messageTitle: 'Information',
        //messageIcon: 'info',
        //messageCloseButtonLabel: 'OK',
        //confirmTitle: 'Confirmation',
        //confirmIcon: 'question',
        //confirmActionButtonLabel: 'Yes',
        //confirmCloseButtonLabel: 'No'
    });
}])

