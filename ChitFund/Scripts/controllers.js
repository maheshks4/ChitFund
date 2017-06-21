'use strict';

/* Controllers */
var myApp = angular.module('myApp');

myApp.controller('SwitchCtrl',
function ($scope) {
    $scope.choice = "skew";
    $scope.options = { "skew": "Skew", "scale": "Scale", "cube": 'Cube', "rotate": 'Rotate', "slide": 'Slide' };

})

.controller('RepeatCtrl', function ($scope) {
    $scope.cnt = 1;
    $scope.artists = ['ABBA', 'Pink Floyd', 'Bee Gees', 'Fleetwood Mac', 'The Cars', 'Blondie',
        'The Go Go\'s', 'Rush', 'Electric Light Orchestra'];
    $scope.addItem = function () {
        $scope.artists.push("New Artist " + $scope.cnt++);
    };

})

.controller('ShowCtrl', function ($scope) {
    $scope.right = false;
});



angular.module('myApp.controllers', ['ui.bootstrap', function () {
}])
.controller('bodyController', ['$scope', 'exDialog', '$location', function ($scope, exDialog, $location) {
    //Object variable can be accessed by all child scopes.
    $scope.body = {};

    //Dirty warning and auto closing Angular dialog within the application.
    $scope.$on('$locationChangeStart', function (event, newUrl, oldUrl) {
        if (newUrl != oldUrl) {
            //Dirty warning when clicking broswer navigation button or entering router matching URL.
            if ($scope.body.dirty) {
                //Use browser built-in dialog here. Any HTML template-based Angular dialog is processed after router action that has already reloaded target page. 
                if (window.confirm("Do you really want to discard data changes\nand leave the page?")) {
                    //Close any Angular dialog if opened.
                    if (exDialog.hasOpenDialog()) {
                        exDialog.closeAll();
                    }
                    //Reset flag.
                    $scope.body.dirty = false;
                }
                else {
                    //Cancel leaving action and stay on the page.
                    event.preventDefault();
                }
            }
            else {
                //Auto close dialog if any is opened.
                if (exDialog.hasOpenDialog()) {
                    exDialog.closeAll();
                }
            }
        }
    });

    //Dirty warning when redirecting to any external site either by clicking button or entering site URL.
    window.onbeforeunload = function (event) {
        if ($scope.body.dirty) {
            return "The page will be rediracted to another site but there is unsaved data on this page.";
        }
    };
}])


.controller('contactListController', ['$scope', '$timeout', '$location', 'ngTableParams', 'exDialog', 'contactList', 'localData', 'addContacts', 'updateContacts', 'deleteContacts', function ($scope, $timeout, $location, ngTableParams, exDialog, contactList, localData, addContacts, updateContacts, deleteContacts) {
    $scope.formLoaded = false;
    $scope.model = {};
    $scope.model.contactList = [];
    $scope.model.contactList_0 = [];
    $scope.tableParams = undefined;
    //Get primary types from localData.
    $scope.model.primaryTypes = localData.getPrimaryTypes();

    //As a constant.
    $scope.maxAddNumber = 5;
    //Add-new item count (exclude those undefined). If > 0, the editRowCount must be 0.
    $scope.addRowCount = 0;
    //Selected edit item count. If > 0, the addRowCount must be 0.
    $scope.editRowCount = 0;

    $scope.isEditDirty = false;
    $scope.isAddDirty = false;
    $scope.rowDisables = [];
    $scope.checkboxes = {
        'topChecked': false,
        'topDisabled': false,
        items: []
    };
    var bypassWatch = false;
    //Set index number beyond which are for newly added.
    var maxEditableIndex = 0;
    var seqNumber = 0;
    var loadingCount = 0;

    //contactList count contains disabledRow count when removing added rows.
    //displayCount should be original loading count plus active addRowCount.
    $scope.model.displayCount = function () {
        return loadingCount + $scope.addRowCount;
    };

    //$scope.model.errorMessage = "Invalid input";    
    $scope.validateAtBlur = function (invalid) {
        $scope.inputInvalid = invalid;
    };

    var loadContactList = function () {
        $scope.tableParams = new ngTableParams({
            page: 1,
            count: 0
        }, {
            getData: getDataForGrid
        });
    };

    var getDataForGrid = function ($defer, params) {
        $scope.errorMessage = undefined;

        //Get data from database.
        contactList.query({}, function (data) {
            $timeout(function () {
                //console.log(data);
                //console.log(data.Contact);
                $scope.model.contactList = data.Contacts;

                //Set last index number before adding new.
                maxEditableIndex = $scope.model.contactList.length - 1;

                //Populate checkboxes.items array.
                for (var i = 0; i < $scope.model.contactList.length; i++) {
                    $scope.checkboxes.items[i] = false;
                    $scope.rowDisables[i] = false;
                }

                //Make deep clone of data list for record-based cancel/undo.
                $scope.model.contactList_0 = angular.copy(data.Contacts);

                //Set original load data row count.
                loadingCount = $scope.model.contactList.length;

                //Reset add and edit counts, and scope dirty flags for refreshing data.
                $scope.addRowCount = 0;
                $scope.editRowCount = 0;
                $scope.isAddDirty = false;
                $scope.isEditDirty = false;

                //Resolve data list to callback parameter.
                $defer.resolve($scope.model.contactList);

                //Show table.
                $scope.showContactList = true;
            }, 500);
        }, function (error) {
            //alert("Error getting contact list data.");
            exDialog.openMessage($scope, "Error getting Contact list data.", "Error", "error");
        });
    };

    //Initial call to load data to table.
    loadContactList();

    //Page label.
    $scope.contactTitle = {
        0: "No contact item",
        1: "Contact List (total 1 contact)",
        other: "Contact List (total {} contacts)"
    };

    //For checkboxes.
    var hasUnChecked = function () {
        //Loop to get flag if any item box unchecked.
        var rtn = false;
        for (var i = 0; i <= maxEditableIndex; i++) {
            if (!$scope.checkboxes.items[i]) {
                rtn = true;
                break;
            }
        }
        return rtn;
    };

    $scope.topCheckboxChange = function () {
        //Click the top checkbox.
        if ($scope.checkboxes.topChecked) {
            //Only available for edit status.
            for (var i = 0; i <= maxEditableIndex ; i++) {
                if (!$scope.checkboxes.items[i]) {
                    $scope.checkboxes.items[i] = true;
                }
            }
            $scope.editRowCount = $scope.checkboxes.items.length;
        }
        else {
            //Uncheck top box.
            if ($scope.addRowCount > 0 && $scope.editRowCount == 0) {
                cancelAllAddRows("topCheckbox");
            }
            else if ($scope.addRowCount == 0 && $scope.editRowCount > 0) {
                cancelAllEditRows("topCheckbox");
            }
        }
    };

    $scope.listCheckboxChange = function (listIndex) {
        //Click a single checkbox for row.
        if ($scope.checkboxes.items[listIndex]) {
            //Increase editRowCount when checking the checkbox.
            $scope.editRowCount += 1;
        }
        else {
            //Cancel row operation when unchecking the checkbox.
            if (listIndex > maxEditableIndex) {
                //Add status.
                if (dataChanged($scope.model.contactList[listIndex],
                                $scope.model.contactList_0[listIndex])) {
                    exDialog.openConfirm({
                        scope: $scope,
                        title: "Cancel Confirmation",
                        message: "Are you sure to discard changes and remove this new row?"
                    }).then(function (value) {
                        cancelAddRow(listIndex);
                    }, function (forCancel) {
                        undoCancelRow(listIndex);
                    });
                }
                else {
                    //Remove added row silently.
                    cancelAddRow(listIndex);
                }
            }
            else {
                //Edit status.
                if (dataChanged($scope.model.contactList[listIndex],
                                $scope.model.contactList_0[listIndex])) {
                    //Popup for cancel.
                    exDialog.openConfirm({
                        scope: $scope,
                        title: "Cancel Confirmation",
                        message: "Are you sure to discard changes and cancel editing for this row?"
                    }).then(function (value) {
                        cancelEditRow(listIndex, true);
                    }, function (forCancel) {
                        undoCancelRow(listIndex);
                    });
                }
                else {
                    //Resume display row silently.
                    cancelEditRow(listIndex);
                }
            }
        }
        //Sync top checkbox.
        if ($scope.addRowCount > 0 && $scope.editRowCount == 0)
            //Alway true in Add status.
            $scope.checkboxes.topChecked = true;
        else if ($scope.addRowCount == 0 && $scope.editRowCount > 0)
            $scope.checkboxes.topChecked = !hasUnChecked();
    };

    var cancelAddRow = function (listIndex) {
        //Handles array element position shift issue. 
        if (listIndex == $scope.checkboxes.items.length - 1) {
            //It's the last row.
            //Remove rows including all already undefined rows after the last active (defined) row.
            for (var i = listIndex; i > maxEditableIndex; i--) {
                //Do contactList_0 first to avoid additional step in watching cycle.
                $scope.model.contactList_0.splice(i, 1);
                $scope.model.contactList.splice(i, 1);
                $scope.checkboxes.items.splice(i, 1);

                //There is only one add-row.
                if (i == maxEditableIndex + 1) {
                    //Reset addRowCount.
                    $scope.addRowCount = 0;

                    //Reset seqNumber.
                    seqNumber = 0;
                }
                else {
                    //Reduce $scope.addRowCount.
                    $scope.addRowCount -= 1;

                    //Exit loop if next previous row is not undefined.
                    if ($scope.model.contactList[i - 1] != undefined) {
                        break;
                    }
                }
            }
        }
        else {
            //It's not the last row, then set the row to undefined.
            $scope.model.contactList_0[listIndex] = undefined;
            $scope.model.contactList[listIndex] = undefined;
            $scope.checkboxes.items[listIndex] = undefined;

            //Reduce $scope.addRowCount
            $scope.addRowCount -= 1;
        }
    };

    var cancelAllAddRows = function (callFrom) {
        if ($scope.isAddDirty) {
            exDialog.openConfirm({
                scope: $scope,
                title: "Cancel Confirmation",
                message: "Are you sure to discard changes and cancel adding for all rows?"
            }).then(function (value) {
                if (callFrom == "topCheckbox")
                    cancelAllAddRowsRun();
                else if (callFrom == "cancelButton") {
                    //Reset form.
                    $scope.contactForm.$setPristine();
                    $scope.body.dirty = false;
                }

                //Reload table by setting dummy count as a trigger.                     
                $scope.tableParams.count($scope.tableParams.count() + 1);

            }, function (forCancel) {
                //Set back checked.
                if (callFrom == "topCheckbox")
                    $scope.checkboxes.topChecked = true;
            });
        }
        else {
            if (callFrom == "topCheckbox")
                cancelAllAddRowsRun();
            else if (callFrom == "cancelButton")
                //Reload table.
                $scope.tableParams.count($scope.tableParams.count() + 1);
        }
    }
    var cancelAllAddRowsRun = function () {
        for (var i = $scope.checkboxes.items.length - 1; i > maxEditableIndex; i--) {
            $scope.model.contactList_0.splice(i, 1);
            $scope.model.contactList.splice(i, 1);
            $scope.checkboxes.items.splice(i, 1);
        }
        //Reset addRowCount.
        $scope.addRowCount = 0;

        //Reset seqNumber.
        seqNumber = 0;

        //Reset form.
        $scope.contactForm.$setPristine();
        $scope.body.dirty = false;
    };

    var cancelEditRow = function (listIndex, copyBack) {
        if (copyBack) {
            //Copy back data item.
            $scope.model.contactList[listIndex] = angular.copy($scope.model.contactList_0[listIndex]);
        }
        //Reduce editRowCount.
        $scope.editRowCount -= 1;
    };

    var cancelAllEditRows = function (callFrom) {
        if ($scope.isEditDirty) {
            //Build string part for differences in message text. 
            var temp = "";
            if (callFrom == "topCheckbox") {
                temp = "all rows";
            }
            else if (callFrom == "cancelButton") {
                if ($scope.editRowCount == 1)
                    temp = "the selected row";
                else
                    temp = "selected rows";
            }

            exDialog.openConfirm({
                scope: $scope,
                title: "Cancel Confirmation",
                message: "Are you sure to discard changes and cancel editing for " + temp + "?"
            }).then(function (value) {
                for (var i = 0; i <= maxEditableIndex ; i++) {
                    if ($scope.checkboxes.items[i]) {
                        $scope.checkboxes.items[i] = false;

                        //Copy back data item.
                        $scope.model.contactList[i] = angular.copy($scope.model.contactList_0[i]);
                    }
                }
                //Reset editRowCount.
                $scope.editRowCount = 0;

                //Set top checkbox to false anyway (cancel from button is a must).
                $scope.checkboxes.topChecked = false;

                //Reset form.
                $scope.contactForm.$setPristine();
                $scope.body.dirty = false;

            }, function (forCancel) {
                if (callFrom == "topCheckbox") {
                    //Set checkbox back to true.
                    $scope.checkboxes.topChecked = true;
                }
            });
        }
        else {
            //Pristine (just in edit status but not touched/visited).
            for (var i = 0; i <= maxEditableIndex ; i++) {
                if ($scope.checkboxes.items[i]) {
                    $scope.checkboxes.items[i] = false;

                    //Reset editRowCount.
                    $scope.editRowCount = 0;
                }
            }
            //Set top checkbox to false anyway (cancel from button is a must).
            $scope.checkboxes.topChecked = false;
        }
    }

    var undoCancelRow = function (listIndex) {
        //Cancel edit or add - reset checked back and sync topChecked.                    
        $scope.checkboxes.items[listIndex] = true;
        //Syn top check box.
        $scope.checkboxes.topChecked = !hasUnChecked();
    };

    $scope.setVisited = function (baseElementName, listIndex) {
        //For add-new field, add $visited flag for any first focusing so that 
        //validation will occur if leaving empty. >> $pristine doesn't work for this scenario.
        if (listIndex > maxEditableIndex) {
            $scope.contactForm[baseElementName + '_' + listIndex]['$visited'] = true;
        }
    };

    $scope.addNewContact = function () {
        //Add new row to table.
        //Set max added-row number limit.
        if ($scope.addRowCount + 1 == $scope.maxAddNumber) {
            exDialog.openMessage({
                scope: $scope,
                title: "Warning",
                icon: "warning",
                message: "The maximum number (" + $scope.maxAddNumber + ") of added rows for one submission is approached."
            });
        }
        bypassWatch = true;

        //Add empty row to the bottom of table.
        var newContact = {
            ContactID: 0,
            ContactName: '',
            Phone: '',
            Email: '',
            PrimaryType: 0
        };
        $scope.model.contactList.push(newContact);

        //Add new item to base array.
        $scope.model.contactList_0.push(angular.copy(newContact));

        //Add to checkboxes.items.        
        seqNumber += 1;
        $scope.checkboxes.items[maxEditableIndex + seqNumber] = true;

        //Update addRowCount.
        $scope.addRowCount += 1;
    };

    $scope.deleteContacts = function () {
        var idsForDelete = [];
        angular.forEach($scope.checkboxes.items, function (item, index) {
            if (item == true) {
                idsForDelete.push($scope.model.contactList[index].ContactID);
            }
        });
        if (idsForDelete.length > 0) {
            var temp = "s";
            var temp2 = "s have"
            if (idsForDelete.length == 1) {
                temp = "";
                temp2 = " has";
            }
            exDialog.openConfirm({
                scope: $scope,
                title: "Delete Confirmation",
                message: "Are you sure to delete selected contact" + temp + "?"
            }).then(function (value) {
                deleteContacts.post(idsForDelete, function (data) {
                    exDialog.openMessage({
                        scope: $scope,
                        message: "The " + temp2 + " successfully been deleted."
                    });
                    //Refresh table.
                    //Dummy setting just for triggering data re-load.
                    //The pageSize variable is used on-the-fly for pager while the count() is for keep state. 
                    $scope.tableParams.count($scope.tableParams.count() + 1);

                }, function (forCancel) {
                    exDialog.openMessage($scope, "Error deleting contact data.", "Error", "error");
                });
            });
        }
    };

    $scope.SaveChanges = function () {
        //Prepare message text.
        var title, message, temp, temp2;
        temp = "s";
        temp2 = "s have";
        if ($scope.addRowCount == 1 || $scope.editRowCount == 1) {
            temp = "";
            temp2 = " has"
        }

        if ($scope.isEditDirty) {
            title = "Update Confirmation";
            message = "Are you sure to update selected contact" + temp + "?";
        }
        else if ($scope.isAddDirty) {
            title = "Add Confirmation";
            message = "Are you sure to add the contact" + temp + "?";
        }
        exDialog.openConfirm({
            scope: $scope,
            title: title,
            message: message//,
            //keepOpenForAction: true
        }).then(function (value) {
            if ($scope.isEditDirty) {
                //Update data list.
                updateContacts.post($scope.model.contactList, function (data) {
                    //Reset form.
                    $scope.contactForm.$setPristine();
                    $scope.body.dirty = false;

                    exDialog.openMessage($scope, "Selected contact" + temp2 + " successfully been updated.");
                    //Refresh table.
                    //Dummy setting just for triggering data re-load.
                    //The pageSize variable is used on-the-fly for pager while the count() is for keep state. 
                    $scope.tableParams.count($scope.tableParams.count() + 1);

                }, function (error) {
                    exDialog.openMessage($scope, "Error updating contact data.", "Error", "error");
                });
            }
            else if ($scope.isAddDirty) {
                //Add new item.
                var activeAddItems = [];
                for (var i = maxEditableIndex + 1; i < $scope.model.contactList.length; i++) {
                    if ($scope.model.contactList[i] != undefined) {
                        activeAddItems.push($scope.model.contactList[i]);
                    }
                }

                addContacts.post(activeAddItems, function (data) {
                    //Reset form.
                    $scope.contactForm.$setPristine();
                    $scope.body.dirty = false;

                    //data.ContactIdList contains newly added ContactID values.
                    exDialog.openMessage($scope, "The new contact" + temp2 + " successfully been added.");

                    //Refresh table.
                    //Dummy setting just for triggering data re-load.
                    //The pageSize variable is used on-the-fly for pager while the count() is for keep state. 
                    $scope.tableParams.count($scope.tableParams.count() + 1);

                }, function (error) {
                    exDialog.openMessage($scope, "Error adding contact data:" + error.data.ExceptionMessage, "Error", "error");
                });
            }
        });
    };

    //Click Cancel Changes button.
    $scope.CanelChanges = function () {
        //The same action results as unchecking top checkbox.
        if ($scope.isEditDirty || (!$scope.isEditDirty && $scope.editRowCount > 0)) {
            cancelAllEditRows("cancelButton");
        }
        else if ($scope.isAddDirty || (!$scope.isAddDirty && $scope.addRowCount > 0)) {
            cancelAllAddRows("cancelButton");
        }
    };

    //Do something when Add status is on/off.
    $scope.$watch("addRowCount", function (newValue, oldValue) {
        if (oldValue == 0 && newValue > 0) {
            //Disable all editable checkboxes.
            disableEditRows(true);
            $scope.checkboxes.topChecked = true;
        }
        else if (oldValue > 0 && newValue == 0) {
            //Reset isAddDirty flag and enable checkboxes.
            $scope.isAddDirty = false;
            disableEditRows(false);
            $scope.checkboxes.topChecked = false;

            //Set dirty flag for close page warning.
            $scope.body.dirty = $scope.isAddDirty;
        }
    });

    //$scope.contactForm.$dirty cannot be use for data change only.
    //Other changes such as click checkbox will make it dirty.
    $scope.$watch("model.contactList", function (newValue, oldValue) {
        if (bypassWatch) {
            bypassWatch = false;
        }
        else {
            //Not for the first loading.
            if (oldValue.length != undefined) {
                //Use custom object comparison due to existance of "$$hashKey".                
                if ($scope.model.contactList.length - 1 > maxEditableIndex) {
                    //Compare the new add row only.
                    if (dataChanged($scope.model.contactList[maxEditableIndex + 1],
                                    $scope.model.contactList_0[maxEditableIndex + 1])) {
                        $scope.isAddDirty = true;
                    }
                    else {
                        $scope.isAddDirty = false;
                    }
                    //Set dirty flag for close page warning.
                    $scope.body.dirty = $scope.isAddDirty;
                }
                else {
                    //For editable rows.
                    if (dataChanged($scope.model.contactList, $scope.model.contactList_0)) {
                        $scope.isEditDirty = true;
                    }
                    else {
                        $scope.isEditDirty = false;
                    }
                    //Set dirty flag for close page warning.
                    $scope.body.dirty = $scope.isEditDirty;
                }
            }
        }
    }, true);

    //Check data list changed using deep cloned set.
    var dataChanged = function (data_1, data_2) {
        var isChanged = false;
        if (angular.isArray(data_1)) {
            for (var idx = 0; idx < data_1.length; idx++) {
                for (var propName in data_1[idx]) {
                    if (propName != "$$hashKey") {
                        if (data_1[idx][propName] != data_2[idx][propName]) {
                            isChanged = true;
                            break;
                        }
                    }
                }
                if (isChanged) break;
            }
        }
        else {
            for (var propName in data_1) {
                if (propName != "$$hashKey") {
                    if (data_1[propName] != data_2[propName]) {
                        isChanged = true;
                        break;
                    }
                }
            }
        }
        return isChanged;
    };

    var disableEditRows = function (flag) {
        for (var i = 0; i <= maxEditableIndex; i++) {
            $scope.rowDisables[i] = flag;
        }
    };

    //Dirty sign (control border color) for Primary Type dropdown.
    $scope.ddlPrimaryTypeDirty = [];
    $scope.primaryTypeChanged = function (index, selected) {
        if (selected != $scope.model.contactList_0[index].PrimaryType)
            $scope.ddlPrimaryTypeDirty[index] = true;
        else
            $scope.ddlPrimaryTypeDirty[index] = false;
    };
}])

.controller('aboutController', ['$scope', function ($scope) {
    $scope.message = 'This is an example.';
}])
;
//Global function.
function getFormattedDate(date) {
    if (date == "") return "";
    try {
        var year = date.getFullYear();
        var month = (1 + date.getMonth()).toString();
        month = month.length > 1 ? month : '0' + month;
        var day = date.getDate().toString();
        day = day.length > 1 ? day : '0' + day;
        return month + '/' + day + '/' + year;
    }
    catch (err) {
        return "error";
    }
}
function isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}

