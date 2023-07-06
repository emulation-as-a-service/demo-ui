import {WaitModal} from '../../lib/task.js';
import { _fetch, confirmDialog } from "../../lib/utils";
import {
    MachineBuilder
} from '../../lib/machineBuilder.js';

module.exports = ['$state', '$scope', 'localConfig', '$uibModal', 'Images', 'growl',
    function ($state, $scope, localConfig, $uibModal, Images, growl)
{
    var vm = this;
    vm.config = localConfig.data;
    vm.pageSize = "25";
    vm.imageList = [];

    vm.updateData = function () {
        if (vm.gridOptions && vm.gridOptions.api != null) {
            vm.gridOptions.api.setRowData(vm.imageList);
            vm.gridOptions.api.setColumnDefs(vm.initColumnDefs());
            vm.gridOptions.api.sizeColumnsToFit();
        }
    };

    vm.updateTable = async () =>
    {
        if (vm.gridOptions && vm.gridOptions.api)
            vm.gridOptions.api.setRowData(null);
        vm.imageList = await Images.list();
        vm.updateData();
    };
    vm.updateTable(0, "default");


    vm.patchDlg = function(id) {
        let modal = $uibModal.open({
            animation: true,
            template: require ('./modals/patch.html'),
            resolve: {
                patchList : ($http, localConfig) => $http.get(localConfig.data.eaasBackendURL + "/environment-repository/patches"),
            },
            controller: ["$scope", "localConfig", "patchList", function($scope, localConfig, patchList) {
                $scope.patchList = patchList.data;
                $scope.selected = {};
                let waitModal; 
                this.patch = async() =>
                {
                    let req = {
                        "archive": "default",
                        "imageType": "user",
                        "imageId": id
                    };
                    try {
                        waitModal = new WaitModal($uibModal);
                        waitModal.show("Patching disk image", "Please wait");
                        await _fetch(`${localConfig.data.eaasBackendURL}/environment-repository/patches/${$scope.selected.patch.name}`, "POST", req, localStorage.getItem('id_token'));
                    }
                    catch(e)
                    {
                        growl.error(e.name + ': ' + e.message);
                    }
                    finally {
                        waitModal.hide();
                        modal.close();
                        $state.reload();
                    }
                };
            }],
            controllerAs: "patchDlgCtrl"
        });
    };

    vm.importDlg = function () {
        let modal = $uibModal.open({
            animation: true,
            template: require ('./modals/import.html'),
            controller: ["$scope", "localConfig", function($scope, localConfig) {

                this.import = async () => 
                {
                    if(!this.mode)
                    {
                        window.alert("Please select an image type");
                        return;
                    }

                    if(this.mode === "create" && !this.hdsize)
                    {
                        window.alert("Please set disk size");
                        return;
                    } 

                    if(this.mode === "upload" && !this.hdurl)
                    {
                        window.alert("Please set image url");
                        return;
                    }

                    if(this.mode === "rom" && !this.romurl)
                    {
                        window.alert("Please set ROM url");
                        return;
                    }
                    modal.close();
                    
                    let waitModal = new WaitModal($uibModal);
                    waitModal.show("Import", "Please wait");
                    let result;
                    try {
                        if(this.mode ==='create')
                            result = await Images.createEmpty(this.hdsize, this.label);
                        else if(this.mode === "rom")
                        {
                            result = await Images.import(this.romurl, this.label, "roms");
                        }
                        else
                            result = await Images.import(this.hdurl, this.label);
                    }
                    catch(e)
                    {
                        console.log(e);
                        growl.error(e.name + ': ' + e.message);
                    }
                    finally {
                        waitModal.hide();
                        $state.reload();
                    }
                };
            }],
            controllerAs: "importDlgCtrl"
        });
    };

    $scope.onPageSizeChanged = function () {
        vm.gridOptions.api.paginationSetPageSize(Number(vm.pageSize));
    };

    function diskEntryRenderer()
    {
        return `
        <div style="padding-top: 10px; padding-bottom: 10px;" >
        <div class="overview-label">{{data.label}}<br>
            <span class="overview-content">
                <b>ID: </b> {{data.imageId}} &nbsp; 
            </span></div></div>`;
    }

    vm.initColumnDefs = function () {
        return [
            {headerName: "User Images", field: "label", cellRenderer: diskEntryRenderer, width: 600},
            {
                headerName: "", field: "Actions", cellRenderer: detailsBtnRenderer, suppressSorting: true,
                suppressMenu: true, width: 150
            }
        ];
    };

    function detailsBtnRenderer(params) {
        params.$scope.selected = $scope.selected;
        params.$scope.ctrl = vm;

        params.$scope.changeClass = function (id) {
            if (($("#dropdowm" + id).is(":visible"))) {
                return "dropbtn2";
            } else {
                return "dropbtn";
            }
        };

        let imageActions = `
             <div class="btn-group" uib-dropdown dropdown-append-to-body>
                <button id="single-button{{data.id}}" type="button"
                ng-class="changeClass(data.id)"
                uib-dropdown-toggle
                ng-disabled="disabled">
                  {{\'CHOOSE_ACTION\'| translate}} <span class="caret"></span>
                </button>
                <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                  <li role="menuitem">
                    <a class="dropdown-content"
                        ng-click="ctrl.patchDlg(data.imageId)">Generalize</a></li>
            
                  <li role="menuitem">
                    <a class="dropdown-content"
                        ng-click="ctrl._delete(data.imageId)">Delete</a></li>
                </ul>
             </div>`;
        return imageActions;
    }

    vm._delete = async function(imageId) {

        try {
            await confirmDialog($uibModal, "Delete image", `Please confirm deleting disk: ${imageId}?` );
        }
        catch(e)
        {
            console.log(e);
            return;
        }
        
        console.log("deleteing image " + imageId);
        Images.delete("default", imageId);
        $state.reload();
    };

    vm.gridOptions = {
        columnDefs: vm.initColumnDefs(),
        rowHeight: 75,
        groupUseEntireRow: true,
        rowSelection: 'multiple',
        angularCompileRows: true,
        rowMultiSelectWithClick: true,
        enableColResize: true,
        enableSorting: true,
        enableFilter: true,
        enableCellChangeFlash: true,
        suppressRowClickSelection: true,
        domLayout: 'autoHeight',
        suppressHorizontalScroll: true,
        animateRows: true,
        onGridReady: function (params) {
           vm.gridOptions.api.sizeColumnsToFit();
        },
        pagination: true,
        paginationPageSize: Number(vm.pageSize),
        paginationNumberFormatter: function (params) {
            return '[' + params.value.toLocaleString() + ']';
        },
    };

    // setup the grid after the page has finished loading
    document.addEventListener('DOMContentLoaded', function () {
        var gridDiv = document.querySelector('#myGrid');
        new agGrid.Grid(gridDiv, vm.gridOptions);
        vm.gridOptions.api.sizeColumnsToFit();
    });
}];
