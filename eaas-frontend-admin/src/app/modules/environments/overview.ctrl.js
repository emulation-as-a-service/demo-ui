import {getOsLabelById} from '../../lib/os.js';
import { _fetch, ClientError, confirmDialog } from "../../lib/utils";
import {NetworkBuilder} from "EaasClient/lib/networkBuilder.js";

module.exports = ['$rootScope', '$http', '$state', '$scope', '$stateParams', 
                    'localConfig', 'growl', '$translate', 'Environments', 
                    '$uibModal', 
                    'REST_URLS', '$timeout', "authService", "EaasClientHelper", "operatingSystemsMetadata",
    function ($rootScope, $http, $state, $scope, $stateParams,
              localConfig, growl, $translate, Environments, 
              $uibModal,  
              REST_URLS, $timeout, authService, EaasClientHelper, operatingSystemsMetadata) {
        
        var vm = this;

        vm.config = localConfig.data;

        vm.landingPage = localConfig.data.landingPage;
        vm.viewArchive = 0;

        vm.osList = operatingSystemsMetadata.data.operatingSystemInformations;

        function updateTableData(rowData){
            vm.rowCount = rowData.length;
            vm.gridOptions.api.setRowData(rowData);
            vm.gridOptions.api.setColumnDefs(vm.initColumnDefs());
            vm.gridOptions.api.sizeColumnsToFit();
        }

        vm.updateTable = function(index)
        {
            vm.gridOptions.api.setRowData(null);
            vm.view = index;
            let rowData = [];
           
            vm.envs = Environments.query({localOnly: false}).$promise.then(function(response) {
                vm.rowCount = 0;
                vm.envs = response;
                vm.envs.forEach(function (element) {
                    if (vm.view == 0) {
                        if(element.envType != 'base')
                            return;
                        
                        if (element.linuxRuntime) 
                            return;
                        
                        if((element.archive == 'default' && vm.viewArchive === 0) ||
                            ((element.archive == "public" || element.archive == 'emulators') && vm.viewArchive === 1) ||
                            (element.archive == "remote" && vm.viewArchive === 2))
                            rowData.push({
                                name: element.title, 
                                id: element.envId, 
                                archive: element.archive, 
                                owner: (element.owner) ? element.owner : "shared",
                                timestamp: element.timestamp,
                                description: element.description,
                                os: getOsLabelById(vm.osList, element.operatingSystem),
                            });
                            
                    }
                    else if (vm.view == 1) {
                        if(element.envType != 'object')
                            return;

                        rowData.push({
                            name: element.title,
                            id: element.envId,
                            archive: element.archive,
                            owner: (element.owner) ? element.owner : "shared",
                            objectId: element.objectId
                        });  
                    } 
                    else if (vm.view == 2) {
                        if(element.envType != 'container')
                            return;
                        if(element.serviceContainer)
                            return;
                        if((element.archive == 'default' && vm.viewArchive === 0) ||
                            ((element.archive == "public" || element.archive == 'container') && vm.viewArchive === 1) ||
                            (element.archive == "remote" && vm.viewArchive === 2))
                            rowData.push({
                                name: element.title,
                                id: element.envId,
                                owner: (element.owner) ? element.owner : "shared",
                                objectId: element.objectId
                            });
                        
                    }
                });
                updateTableData(rowData);
            });
        };

        vm.pageSize = "25";
        if($stateParams.showContainers)
             vm.view = 2;
        else if($stateParams.showObjects)
            vm.view = 1;       
        else
            vm.view = 0;

        vm.checkState = function(_taskId, _modal)
        {
            var taskInfo = $http.get(localConfig.data.eaasBackendURL + `tasks/${_taskId}`).then(function(response){
                if(response.data.status == "0")
                {
                    if(response.data.isDone)
                    {
                        _modal.close();
                        growl.success("Export finished.");
                    }
                    else
                        $timeout(function() {vm.checkState(_taskId, _modal);}, 2500);
                }
                else
                {
                    _modal.close();
                }
            });
        };

        vm.exportEnv = function(envId, archive)
        {
            console.log("export " + envId + " " + archive);
            $uibModal.open({
                animation: true,
                template: require('./modals/export.html'),
                controller: ["$scope", function($scope) {
                    this.envId = envId;
                    this.standalone = false;
                    this.deleteAfterExport = false;
                    this.doExport = function() {
                        $http.post(localConfig.data.eaasBackendURL + REST_URLS.exportEnvironmentUrl, {
                            envId: envId,
                            standalone: this.standalone,
                            deleteAfterExport: this.deleteAfterExport,
                            archive: archive,
                        }).then(function(response) {
                            var taskId = response.data.taskId;
                            var modal = $uibModal.open({
                                animation: true,
                                backdrop: 'static',
                                template: require('./modals/wait.html')
                            });
                            vm.checkState(taskId, modal);
                        }, function(error) {
                            console.log(error);
                            growl.error("Error exporting image", "tbd.");
                        }
                        );
                    }; 
                }],
                controllerAs: "exportDialogCtrl"
            });
        };

        vm.addSoftware = function(envId) {
            $uibModal.open({
                animation: true,
                template: require('./modals/select-sw.html'),
                controller: ["$scope", function($scope) {
                    this.envId = envId;
                    this.software = softwareList.data.descriptions;
                    this.returnToObjects = $stateParams.showObjects;
                }],
                controllerAs: "addSoftwareDialogCtrl"
            });
        };

        vm.addObject = function(envId) {
            $uibModal.open({
                animation: true,
                template: require('./modals/select-sw.html'),
                controller: ["$scope", function($scope) {
                    this.envId = envId;
                    this.software = softwareList.data.descriptions;
                    this.returnToObjects = $stateParams.showObjects;
                }],
                controllerAs: "addSoftwareDialogCtrl"
            });
        };
        
        vm.deleteContainer = async function (envId) {
            try {
                await confirmDialog($uibModal, "Delete container?", `Please confirm deleting container: ${envId}?` );
            }
            catch(e)
            {
                console.log(e);
                return;
            }

            const req = {
                envId: envId,
                deleteMetaData: true,
                deleteImage: false,
                force: false
            };

            let result = await _fetch(localConfig.data.eaasBackendURL + REST_URLS.deleteContainerUrl, 
                "POST", req, authService.getToken());
            
            if (result.status === "0") {
                // remove env locally
                vm.envs = vm.envs.filter(function (env) {
                    return env.envId !== envId;
                });
                
                growl.success($translate.instant('JS_DELENV_SUCCESS'));
                $state.go('admin.standard-envs-overview', {
                    showContainers: true,
                    showObjects: false
                }, {reload: true});
            }
            else {
                growl.error(response.data.message, {title: 'Error ' + response.data.status});
                $state.go('admin.standard-envs-overview', {
                    showContainers: true,
                    showObjects: false
                }, {reload: true});
            }    
        };

        vm.deleteEnvironment = async function (envId, archive) {
            try {
                await confirmDialog($uibModal, "Delete machine?", `Please confirm deleting machine: ${envId}?` );
            }
            catch(e)
            {
                console.log(e);
                return;
            }

            const req = {
                envId: envId,
                deleteMetaData: true,
                deleteImage: true,
                force: false
            };
   
            let result = await _fetch(localConfig.data.eaasBackendURL + REST_URLS.deleteEnvironmentUrl, 
                "POST", req, authService.getToken());
            if (result.status === "0" || result .status === 0) {
                // remove env locally
                growl.success($translate.instant('JS_DELENV_SUCCESS'));
            } else if (result.status === "2") {
                try {
                    await confirmDialog($uibModal, 
                            $translate.instant('CONFIRM_DELETE_H'), 
                            $translate.instant('CONFIRM_DELETE_T'));
                } catch(e) {
                    console.log(e);
                    return;
                }

                req.force = true;
                let result = await _fetch(localConfig.data.eaasBackendURL + REST_URLS.deleteEnvironmentUrl, 
                    "POST", req, authService.getToken());
                if(result.status != "0")
                {
                    growl.error(response.data.message, {title: 'Error ' + response.data.status});
                    $state.go('admin.standard-envs-overview', {}, {reload: true});   
                }
                growl.success($translate.instant('JS_DELENV_SUCCESS'));
            } else {
                growl.error(response.data.message, {title: 'Error ' + response.data.status});
                $state.go('admin.standard-envs-overview', {}, {reload: true});
            }

            vm.envs = vm.envs.filter(function (env) {
                return env.envId !== envId;
            });
            $state.go('admin.standard-envs-overview', {}, {reload: true});
        };

        vm.showObjects = $stateParams.showObjects;
        vm.showContainers = $stateParams.showContainers;

        $scope.onInputSourceSelection = function (obj) {
            // Get chosen input source
            var inputMethod = obj.target.attributes.method.value;

            if (typeof(this.activeInputMethod) != 'undefined') {
                this.showDialogs[this.activeInputMethod] = false;
            }

            console.log(inputMethod);
        };

        function actionsCellRendererFunc(params) {

            params.$scope.switchAction = switchAction;
            params.$scope.selected = $scope.selected;
            params.$scope.landingPage = vm.landingPage;
            params.$scope.view = vm.view;
            params.$scope.changeClass = function (id) {
                if (($("#dropdowm" + id).is(":visible"))) {
                    return "dropbtn2";
                } else {
                    return "dropbtn";
                }
            };

            let environmentRenderer = `
             <div class="btn-group" uib-dropdown dropdown-append-to-body>
                <button id="single-button{{data.id}}" type="button" ng-class="changeClass(data.id)" uib-dropdown-toggle ng-disabled="disabled">
                  {{'CHOOSE_ACTION'| translate}} <span class="caret"></span>
                </button>
               
                <ul class="dropdown-menu" id="dropdowm{{data.id}}" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                  <li ng-if="data.archive !='remote'" role="menuitem dropdown-content">
                        <a class="dropdown-content" ng-click="switchAction(data.id, 'run', data.archive)">{{'CHOOSE_ENV_PROPOSAL'| translate}}</a>
                  </li>
                  
                  <li role="menuitem">
                    <a class="dropdown-content" ng-click="switchAction(data.id, 'edit', data.archive)">{{'CHOOSE_ENV_EDIT'| translate}}</a>
                  </li>
                  <li role="menuitem">
                    <a ng-if="data.archive == 'default'" 
                        class="dropdown-content" ng-click="switchAction(data.id, 'deleteEnvironment', data.archive)">
                            {{'CHOOSE_ENV_DEL'| translate}}
                    </a>
                  </li>

                  <li role="menuitem">
                    <a class="dropdown-content" ng-click="switchAction(data.id, 'exportEnv', data.archive)">
                            Export
                    </a>
                  </li>
                  
                  <li role="menuitem">
                    <a ng-if="data.archive !== 'remote' && data.archive !== 'default'" 
                        target="_blank" class="dropdown-content" 
                        ng-click="switchAction(data.id, 'openLandingPage', data.archive)">
                            {{'CONTAINER_LANDING_PAGE'| translate}}
                    </a>
                  </li>
                </ul>
                
             </div>`;

            let container = `
             <div class="btn-group" uib-dropdown dropdown-append-to-body>
                <button id="single-button{{data.id}}" type="button"  ng-class="changeClass(data.id)" uib-dropdown-toggle ng-disabled="disabled">
                  {{\'CHOOSE_ACTION\'| translate}} <span class="caret"></span>
                </button>
                <ul class="dropdown-menu" id="dropdowm{{data.id}}" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                
                  <li role="menuitem"><a class="dropdown-content" ng-click="switchAction(data.id, 'run', data.archive)">{{'CHOOSE_ENV_PROPOSAL'| translate}}</a></li>
                  <li role="menuitem"><a class="dropdown-content" ng-click="switchAction(data.id, 'edit', data.archive)">{{'CHOOSE_ENV_EDIT'| translate}}</a></li>
                  <li role="menuitem"><a class="dropdown-content" ng-click="switchAction(data.id, 'deleteContainer', data.archive)">{{'CHOOSE_ENV_DEL\'| translate}}</a></li>
                  <li role="menuitem"><a ng-if="landingPage && data.archive !== 'remote' && data.archive !== 'default'" target="_blank" class="dropdown-content"
                  ng-click="switchAction(data.id, 'openLandingPage', data.archive)"">{{'CONTAINER_LANDING_PAGE'| translate}} {{ data.archive }}</a></li>
                </ul>
             </div>`;

            if (vm.view == 2)
                return container;
            else
                return environmentRenderer;
        }

        function switchAction(id, selected, archive) {
            vm[selected](id, archive);
        }

        vm.run = async function (id, archive) {
            if (vm.view == 2) {
                $state.go('admin.container', ({envId: id, modifiedDialog: true}));
                return;
            }

            var env = {};
            for (let i = 0; i < vm.envs.length; i++) {
                if (id == vm.envs[i].envId) {
                    env = vm.envs[i];
                    break;
                }
            }
            if (typeof env.envId == "undefined")
                $state.go('error', {errorMsg: {title: "Error ", message: "given envId: " + id + " is not found!"}});

            let components, clientOptions;
            let machine = EaasClientHelper.createMachine(env.envId, archive);
            machine.setInteractive(true);
            
            if(env.objectId)
                machine.setObject(env.objectId, env.objectArchive);

            if(env.networkEnabled && env.internetEnabled){
                console.log("Starting with internet enabled (from overview)!");
                let networkBuilder = new NetworkBuilder(localConfig.data.eaasBackendURL, () => authService.getToken());
                // await networkBuilder.enableDhcpService(networkBuilder.getNetworkConfig());

                networkBuilder.addComponent(machine);
                components =  await networkBuilder.getComponents();
                clientOptions = await EaasClientHelper.clientOptions(env.envId, () => authService.getToken());
                clientOptions.getNetworkConfig().enableSlirpDhcp(true);
            }
            else
            {
                console.log("Starting without internet (from overview)!");

                components = [machine];
                clientOptions = await EaasClientHelper.clientOptions(env.envId, () => authService.getToken());
            }
            
            $state.go("admin.emuView",  {
                components: components,
                clientOptions: clientOptions,
                envId: env.envId
            }, {});
        };

        vm.edit = function (id) {
            if (vm.view == 1)
                $state.go('admin.edit-env', {envId: id, objEnv: true});
           else if (vm.view == 0 || vm.view == 3)
                $state.go('admin.edit-env', {envId: id});
           else if (vm.view == 2)
                $state.go('admin.edit-container', {envId: id});
        };

        vm.openLandingPage = function (id) {
 //           if(vm.view ===4 ){
 //               window.open(vm.landingPage + "?id=" + id + "&isNetworkEnvironment=" + "true");
 //           } else
                window.open("/landing-page" + "?id=" + id);
        };

        $scope.onPageSizeChanged = function() {
            vm.gridOptions.api.paginationSetPageSize(Number(vm.pageSize));
        };

        function onRowSelected(event) {
            if (vm.gridOptions.api.getSelectedRows().length > 0 && vm.gridOptions.api.getSelectedRows()[0].archive === 'default')
                $('#overviewDeleteButton').show();
            else
                $('#overviewDeleteButton').hide();
        }

        vm.initColumnDefs = function () {
            let columnDefs = [
                {headerName: "Name", field: "name", width: 400, sort: "asc" },
                {headerName: "ID", field: "id", width: 100},
            ];
            
            columnDefs.push({headerName: "Archive", field: "archive", hide: true});
            columnDefs.push({headerName: "Owner", field: "owner", width: 100},);
        
            if(vm.view == 0)
            {
                columnDefs.push({headerName: "Operating System", field: "os"});
            }

            if (vm.view == 1) {
                columnDefs.push({headerName: "ObjectID", field: "objectId"});
            }

            columnDefs.push({
                headerName: "Actions", field: "actions", cellRenderer: actionsCellRendererFunc, 
                suppressMenu: true
            });

            return columnDefs;
        };

        vm.gridOptions = {
            columnDefs: vm.initColumnDefs(),
            rowHeight: 31,
            groupUseEntireRow:  true,
            rowSelection: 'multiple',
            angularCompileRows: true,
            rowMultiSelectWithClick: true,
            defaultColDef : {
                resizable: true,
                defilter: true,
                sortable: true,
            },
            enableCellChangeFlash: true,
            enableCellTextSelection: true,
            ensureDomOrder: true,
            onRowSelected: onRowSelected,
            suppressRowClickSelection: true,
            domLayout: 'autoHeight',
            suppressHorizontalScroll: true,
            onGridReady: function (params) {
                 vm.updateTable(0);
                 vm.gridOptions.api.redrawRows();
            },
            pagination: true,
            paginationPageSize: Number(vm.pageSize),
            paginationNumberFormatter: function(params) {
                return '[' + params.value.toLocaleString() + ']';
            },
        };

    }];
