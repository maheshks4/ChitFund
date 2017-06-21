'use strict';
var webApiBaseUrl = "api/";

angular.module('myApp.AppServices', ['ngResource'])
//Web API call for contact list.
.factory('contactList', function ($resource) {
    return $resource(webApiBaseUrl + 'getContactLists', {}, {
        query: { method: 'GET', isArray: false }
    });
})
//Web API call for adding contacts.
.factory('addContacts', function ($resource) {
    return $resource(webApiBaseUrl + 'addContacts', {}, {
        post: {
            method: 'POST', isArray: false,
            headers: { 'Content-Type': 'application/json' }
        }
    });
})
//Web API call for updating Contacts.
.factory('updateContacts', function ($resource) {
    return $resource(webApiBaseUrl + 'updateContacts', {}, {
        post: {
            method: 'POST', isArray: false,
            headers: { 'Content-Type': 'application/json' }
        }
    });
})
//Web API call for deleting Contacts.
.factory('deleteContacts', function ($resource) {
    return $resource(webApiBaseUrl + 'deleteContacts', {}, {
        post: {
            method: 'POST', isArray: false,
            headers: { 'Content-Type': 'application/json' }
        }
    });
})
;


angular.module('myApp.AppServices').service('localData', [function () {
    //Local data for product search types.
    this.getProductSearchTypes = function () {
        return [
          { id: "0", name: "Please select..." },
          { id: "CategoryId", name: "Category ID" },
          { id: "CategoryName", name: "Category Name" },
          { id: "ProductId", name: "Product ID" },
          { id: "ProductName", name: "Product Name" }
        ];
    }
    //Local data for Status types.
    this.getProductStautsTypes = function () {
        return [
          { StatusCode: 1, Description: "Available" },
          { StatusCode: 2, Description: "Out of Stock" },
          { StatusCode: 3, Description: "Back Ordered" },
          { StatusCode: 4, Description: "Discontinued" },
          { StatusCode: 5, Description: "Undefined" }
        ];
    }
    //For contact primary types.
    this.getPrimaryTypes = function () {
        return [
          { id: 0, name: "Please select..." },
          { id: 1, name: "Phone" },
          { id: 2, name: "Email" }
        ];
    }

    this.getPageSizeList = function () {
        return [
          { value: 5, text: "5" },
          { value: 10, text: "10" },
          { value: 25, text: "25" },
          { value: 50, text: "50" },
          { value: 100, text: "100" },
          { value: -1, text: "ALL" }
        ];
    }
}]);
