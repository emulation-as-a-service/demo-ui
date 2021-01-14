import {getOsLabelById} from '../../lib/os.js'
import {WaitModal} from "../../lib/task.js"
import { _fetch, ClientError } from "../../lib/utils";


module.exports = ['$rootScope', '$http', '$state', '$scope', '$stateParams',
                    'localConfig', 'growl', '$translate', 'Environments', 
                    '$uibModal', 'softwareList', 
                    'REST_URLS', '$timeout', "osList", "EaasClientHelper",
    function ($rootScope, $http, $state, $scope, $stateParams,
              localConfig, growl, $translate, Environments, 
              $uibModal, softwareList,  
              REST_URLS, $timeout, osList, EaasClientHelper) {
        
        var vm = this;

        vm.config = localConfig.data;

        vm.landingPage = localConfig.data.landingPage;
        vm.viewArchive = 0;
        vm.waitModal = new WaitModal($uibModal);

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
                                os: getOsLabelById(osList.operatingSystems, element.operatingSystem),
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
                    } 
                }],
                controllerAs: "exportDialogCtrl"
            });
        };

        var confirmDeleteFn = function(envId)
        {
            console.log("confirmed");
            $http.post(localConfig.data.eaasBackendURL + REST_URLS.deleteEnvironmentUrl, {
                envId: envId,
                deleteMetaData: true,
                deleteImage: true,
                force: true
            }).then(function(_response) {
                if (_response.data.status === "0") {
                    // remove env locally
                    vm.envs = vm.envs.filter(function(env) {
                        return env.envId !== envId;
                    });
                    $rootScope.chk.transitionEnable = true;
                    growl.success($translate.instant('JS_DELENV_SUCCESS'));
                    $state.go('admin.standard-envs-overview', {}, {reload: true});
                }
                else {
                    $rootScope.chk.transitionEnable = true;
                    growl.error(_response.data.message, {title: 'Error ' + _response.data.status});
                    $state.go('admin.standard-envs-overview', {}, {reload: true});

                }
            });
        };


        vm.deleteContainer = function (envId) {
            $rootScope.chk.transitionEnable = false;
            if (window.confirm($translate.instant('JS_DELENV_OK'))) {
                $http.post(localConfig.data.eaasBackendURL + REST_URLS.deleteContainerUrl, {
                    envId: envId,
                    deleteMetaData: true,
                    deleteImage: true,
                    force: false
                }).then(function (response) {
                    if (response.data.status === "0") {
                        // remove env locally
                        vm.envs = vm.envs.filter(function (env) {
                            return env.envId !== envId;
                        });
                        $rootScope.chk.transitionEnable = true;
                        growl.success($translate.instant('JS_DELENV_SUCCESS'));
                        $state.go('admin.standard-envs-overview', {
                            showContainers: true,
                            showObjects: false
                        }, {reload: true});
                    }
                    else {
                        $rootScope.chk.transitionEnable = true;
                        growl.error(response.data.message, {title: 'Error ' + response.data.status});
                        $state.go('admin.standard-envs-overview', {
                            showContainers: true,
                            showObjects: false
                        }, {reload: true});
                    }
                });
            } else {
                $rootScope.chk.transitionEnable = true;
            }
        };

        vm.deleteEnvironment = function (envId, isConfirmed) {
            $rootScope.chk.transitionEnable = false;
            let confirmationResult = null;
            if (typeof isConfirmed != "undefined")
                confirmationResult = isConfirmed;
            else {
                confirmationResult = window.confirm($translate.instant('JS_DELENV_OK'));
            }

            if (confirmationResult) {
                let promise = null;

                promise = $http.post(localConfig.data.eaasBackendURL + REST_URLS.deleteEnvironmentUrl, {
                    envId: envId,
                    deleteMetaData: true,
                    deleteImage: true,
                    force: false
                });
                
                promise.then( (response) => {
                    console.log(response.data);

                    if (response.data.status === "0" || response.data.status === 0) {
                    // remove env locally
                    vm.envs = vm.envs.filter(function (env) {
                        return env.envId !== envId;
                    });
                    $rootScope.chk.transitionEnable = true;
                    growl.success($translate.instant('JS_DELENV_SUCCESS'));
                    $state.go('admin.standard-envs-overview', {}, {reload: true});
                } else if (response.data.status === "2") {

                    $uibModal.open({
                        animation: true,
                        template: require('./modals/confirm-delete.html'),
                        controller: ["$scope", function ($scope) {
                            this.envId = envId;
                            this.confirmed = confirmDeleteFn;
                        }],
                        controllerAs: "confirmDeleteDialogCtrl"
                    });
                } else {
                        $rootScope.chk.transitionEnable = true;
                        growl.error(response.data.message, {title: 'Error ' + response.data.status});
                        $state.go('admin.standard-envs-overview', {}, {reload: true});
                }
            });
            } else {
                $rootScope.chk.transitionEnable = true;
                $state.go('admin.standard-envs-overview', {showContainers: false,
                    showObjects: false}, {reload: false});
            }
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
        vm.selectedRowData = {};
        vm.deleteSelected = function () {
            var selectedRowData = vm.gridOptions.api.getSelectedRows();
            if (window.confirm($translate.instant('JS_DELENV_OK')))
                selectedRowData.forEach(selectedRowData => {
                    vm.deleteEnvironment(selectedRowData.id, true)
                });
        };
        $scope.selected = "";


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

                  <li ng-if="data.archive !='remote'" role="menuitem dropdown-content">
                    <a class="dropdown-content" ng-click="switchAction(data.id, 'hbuild', data.archive)">SWH Build</a>
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
                    <a class="dropdown-content" ng-click="switchAction(data.id, 'export', data.archive)">
                            export
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

        let asnycStartHistoricBuild = async function(data){
            vm.waitModal.show("preparing environment... please wait");
            let envId = undefined;
            try {
                let result = await _fetch(`${localConfig.data.eaasBackendURL}historic-builds/api/v1/build`,
                    "POST", data, localStorage.getItem('id_token'));
                console.log(result);

                let result2 = await _fetch(`${localConfig.data.eaasBackendURL}historic-builds/api/v1/waitqueue/${result.taskId}`,
                    "GET", null, localStorage.getItem('id_token'));
                while(result2.status != 'Done' )
                    result2 = await _fetch(`${localConfig.data.eaasBackendURL}historic-builds/api/v1/waitqueue/${result.taskId}`,
                        "GET", null, localStorage.getItem('id_token'));
                console.log(result2);

                let result3 = await _fetch(`${localConfig.data.eaasBackendURL}historic-builds/api/v1/buildresult/${result.taskId}`,
                    "GET", null, localStorage.getItem('id_token'));

                envId = result3.environmentId;
            }
            catch(e)
            {
                console.log(e);
            }
            finally {
                vm.waitModal.hide();
            }

            if(!envId)
                $state.go('error', {errorMsg: {title: "Error ", message: "failed preparing build environment"}});

            let components = [];
            let machine = EaasClientHelper.createMachine(envId);
            components.push(machine);

            let clientOptions = await EaasClientHelper.clientOptions(envId);
            $state.go("admin.emuView",  {
                components: components,
                clientOptions: clientOptions
            }, {});

        }


        vm.hbuild = function (id) {
            console.log("HBuild called, with id" + id)

            $uibModal.open({
                animation: true,
                template: require ('./modals/historic-build.html'),
                controller:['$scope' , 'growl', function ($scope, growl) {
                    this.revisionId = "3f568389763c205f8779ad75f2cf44ab9782608e";
                    this.environmentId = id;
                    this.inputLocation = "/";
                    this.recipeLocation = "/";
                    this.recipeContent = "echo This is the recipe!";
                    this.recipeName = "recipe.sh";
                    this.autoStart = true;


                    this.buildMode = "Interactive";
                    this.cronUser = "root"

                    $scope.buildModes = ["Interactive", "Automatic"]
                    $scope.cronUsers = ["root", "user"]

                    this.startBuild = function () {
                        console.log("startBuild called")

                        let data = {
                            "softwareHeritage": {
                                "revisionId": this.revisionId,
                                "extract": false,
                                "scriptLocation": "/libexec/swh-downloader/main.py"
                            },
                            "buildToolchain": {
                                "environmentID": this.environmentId,
                                "inputDirectory": this.inputLocation,
                                "outputDirectory": "/home/exampleuser/build",
                                "recipe": this.recipeContent,
                                "prerequisites": [
                                    "Req 1",
                                    "Req 2"
                                ],
                                "mail": "abc@def.com",
                                "mode": this.buildMode,
                                "autoStart" : this.autoStart,
                                "cronUser": this.cronUser,
                                "recipeName" : this.recipeName
                            }
                        }

                        let x = asnycStartHistoricBuild(data)
                    }

                }],
                controllerAs: "runHistoricBuild"})
        };

        vm.run = async function (id) {
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

            let components = [];
            let machine = EaasClientHelper.createMachine(env.envId);
            if(env.objectId)
                machine.setObject(env.objectId, env.objectArchive);
            components.push(machine);

            let clientOptions = await EaasClientHelper.clientOptions(env.envId);
            $state.go("admin.emuView",  {
                components: components, 
                clientOptions: clientOptions
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
                window.open("/landing-page" + "?id=" + id)
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