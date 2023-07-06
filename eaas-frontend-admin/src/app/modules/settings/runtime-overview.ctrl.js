import {
    getOsLabelById
} from '../../lib/os.js';

import {
    MachineBuilder
} from '../../lib/machineBuilder.js';

import {Drives} from '../../lib/drives.js';

import {WaitModal, Task} from "../../lib/task.js";
import { 
    ContainerImageBuilder,
    ContainerBuilder
 } from "../../lib/containerBuilder.js";
 import { _fetch, ClientError, confirmDialog } from "../../lib/utils";

module.exports = ['$rootScope', '$http', '$state', '$scope', 
    'localConfig', 'growl', '$translate', 'Environments', 'EaasClientHelper', "Images",
    '$uibModal', 'containerList',
    'REST_URLS', '$timeout', "systemList", "operatingSystemsMetadata",
    function ($rootScope, $http, $state, $scope, 
        localConfig, growl, $translate, Environments, EaasClientHelper, Images,
        $uibModal, containerList,
        REST_URLS, $timeout, systemList, operatingSystemsMetadata) {

        var vm = this;
        vm.systems = systemList.data;
        vm.config = localConfig.data;
        vm.containerList = containerList.container;

        vm.osList = operatingSystemsMetadata.data.operatingSystemInformations;

        function updateTableData(rowData) {
            vm.rowCount = rowData.length;
            vm.gridOptions.api.setRowData(rowData);
            vm.gridOptions.api.setColumnDefs(vm.initColumnDefs());
            vm.gridOptions.api.sizeColumnsToFit();
        }

        vm.updateTable = function () {
            vm.gridOptions.api.setRowData(null);
            console.log("update");
            let rowData = [];

            vm.envs = Environments.query().$promise.then(function (response) {
                vm.rowCount = 0;
                vm.envs = response;
                vm.envs.forEach(function (element) {
                   
                    if (!element.linuxRuntime)
                        return;

                    if (element.envType != 'base')
                        return;

                    rowData.push({
                        name: element.title,
                        id: element.envId,
                        archive: element.archive,
                        owner: (element.owner) ? element.owner : "shared",
                        timestamp: element.timestamp,
                        description: element.description,
                        os: getOsLabelById(vm.osList, element.operatingSystem),
                    });
                });
                updateTableData(rowData);
            });
        }
        vm.pageSize = "25";

        vm.checkState = function (_taskId, _modal) {
            var taskInfo = $http.get(localConfig.data.eaasBackendURL + `tasks/${_taskId}`).then(function (response) {
                if (response.data.status == "0") {
                    if (response.data.isDone) {
                        _modal.close();
                        growl.success("Export finished.");
                    } else
                        $timeout(function () {
                            vm.checkState(_taskId, _modal);
                        }, 2500);
                } else {
                    _modal.close();
                }
            });
        };

        var confirmDeleteFn = function (envId) {
            console.log("confirmed");
            $http.post(localConfig.data.eaasBackendURL + REST_URLS.deleteEnvironmentUrl, {
                envId: envId,
                deleteMetaData: true,
                deleteImage: false,
                force: true
            }).then(function (_response) {
                if (_response.data.status === "0") {
                    // remove env locally
                    vm.envs = vm.envs.filter(function (env) {
                        return env.envId !== envId;
                    });
                    $rootScope.chk.transitionEnable = true;
                    growl.success($translate.instant('JS_DELENV_SUCCESS'));
                    $state.go('admin.standard-envs-overview', {}, {
                        reload: true
                    });
                } else {
                    $rootScope.chk.transitionEnable = true;
                    growl.error(_response.data.message, {
                        title: 'Error ' + _response.data.status
                    });
                    $state.go('admin.standard-envs-overview', {}, {
                        reload: true
                    });
                }
            });
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

                promise.then((response) => {
                    console.log(response.data);

                    if (response.data.status === "0" || response.data.status === 0) {
                        // remove env locally
                        vm.envs = vm.envs.filter(function (env) {
                            return env.envId !== envId;
                        });
                        $rootScope.chk.transitionEnable = true;
                        growl.success($translate.instant('JS_DELENV_SUCCESS'));
                        $state.go('admin.standard-envs-overview', {}, {
                            reload: true
                        });
                    } else if (response.data.status === "2") {

                        $uibModal.open({
                            animation: true,
                            template: require('../environments/modals/confirm-delete.html'),
                            controller: ["$scope", function ($scope) {
                                this.envId = envId;
                                this.confirmed = confirmDeleteFn;
                            }],
                            controllerAs: "confirmDeleteDialogCtrl"
                        });
                    } else {
                        $rootScope.chk.transitionEnable = true;
                        growl.error(response.data.message, {
                            title: 'Error ' + response.data.status
                        });
                        $state.go('admin.standard-envs-overview', {}, {
                            reload: true
                        });
                    }
                });
            } else {
                $rootScope.chk.transitionEnable = true;
                $state.go('admin.standard-envs-overview', {}, {reload: false});
            }
        };

        function machineEntryRenderer() {
            return `
            <div style="padding-top: 10px; padding-bottom: 10px;" >
            <div class="overview-label">{{data.name}}<br>
                <span class="overview-content">
                    <b>ID: </b> {{data.id}} &nbsp; 
                    <b>Last Change: </b> {{data.timestamp}}<p>
                    <b>Notes: </b> <span ng-bind-html="data.description"></span>
                </span></div></div>`;
        }

        function actionsCellRendererFunc(params) {
            params.$scope.switchAction = switchAction;
            params.$scope.selected = $scope.selected;
            params.$scope.changeClass = function (id) {
                if (($("#dropdowm" + id).is(":visible"))) {
                    return "dropbtn2";
                } else {
                    return "dropbtn";
                }
            };
            let environmentRenderer = `
             <div class="" uib-dropdown dropdown-append-to-body>
                <button id="single-button{{data.id}}" type="button" ng-class="changeClass(data.id)" uib-dropdown-toggle ng-disabled="disabled">
                  {{'CHOOSE_ACTION'| translate}} <span class="caret"></span>
                </button>
                <ul class="dropdown-menu" id="dropdowm{{data.id}}" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                  <li ng-if="data.archive !='remote'" role="menuitem dropdown-content">
                        <a class="dropdown-content" ng-click="switchAction(data.id, \'run\')">{{\'CHOOSE_ENV_PROPOSAL\'| translate}}</a>
                  </li>
                  <li role="menuitem"><a class="dropdown-content" ng-click="switchAction(data.id, \'edit\')">{{\'CHOOSE_ENV_EDIT\'| translate}}</a></li>
                  <li role="menuitem"><a ng-if="data.archive == 'default'"  class="dropdown-content" ng-click="switchAction(data.id, \'deleteEnvironment\')">{{\'CHOOSE_ENV_DEL\'| translate}}</a></li>
                </ul>
                
             </div>`;
            return environmentRenderer;
        }

        function switchAction(id, selected) {
            vm[selected](id);
        }

        vm.run = async function (id) {

            var env = {};
            for (let i = 0; i < vm.envs.length; i++) {
                if (id == vm.envs[i].envId) {
                    env = vm.envs[i];
                    break;
                }
            }
            if (typeof env.envId == "undefined")
                $state.go('error', {
                    errorMsg: {
                        title: "Error ",
                        message: "given envId: " + id + " is not found!"
                    }
                });

            let components = [];
            let machine = EaasClientHelper.createMachine(env.envId, "public");
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
            $state.go('admin.edit-env', {
                envId: id
            });
        };

        vm.createNewRuntime = function() 
        {
            vm.rtModal = $uibModal.open({
                animation: true,
                template: require('./modals/create-runtime.html'),
                controller: ["$scope", function($scope) {
                    this.containerList = vm.containerList;
                    this.selectedServices = {};
                    this.waitModal = new WaitModal($uibModal);

                    this.saveImportedContainer = async function (c, containerUrl, runtimeId, containerMetadata) 
                    {
                        let containerBuilder = new ContainerBuilder("dockerhub", containerUrl, containerMetadata);
                        containerBuilder.setTitle(c.title);
                        containerBuilder.setAuthor("OpenSLX");
                        containerBuilder.setDescription(c.description);
                        containerBuilder.setRuntime(runtimeId);
                        containerBuilder.setName(c.id);
                        containerBuilder.setInputFolder(c.imageInput);
                        containerBuilder.setOutputFolder(c.imageOutput);
                        containerBuilder.setEnableNetwork(true);
                        containerBuilder.setServiceContainerId(c.id);
                        containerBuilder.setArchive("public");
                        containerBuilder.setInputFolder("/input");

                        try {
                            let _result = await containerBuilder.build(localConfig.data.eaasBackendURL, localStorage.getItem('id_token'));
                            let task = new Task(_result.taskId, localConfig.data.eaasBackendURL, localStorage.getItem('id_token'));
                            await task.done;
                            growl.success("import successful.");
                            this.waitModal.hide();
                            return;
                        }   
                        catch(e)
                        {
                            console.log(e);
                            this.waitModal.hide();
                            throw e;
                        }
                    };

                    this.import = async function (c, runtimeId) {
                        let imageBuilder = new ContainerImageBuilder(c.imageUrl, "dockerhub");
                        imageBuilder.setTag((c.tag) ? container.tag : "latest");

                        this.waitModal.show("Importing service container", "Importing " + c.title);
                        let imageBuilderTask = await imageBuilder.build(localConfig.data.eaasBackendURL, localStorage.getItem('id_token'));
                        let task = new Task(imageBuilderTask.taskId, localConfig.data.eaasBackendURL, localStorage.getItem('id_token'));
                        let buildResult = await task.done;

                        try {
                            let object = JSON.parse(buildResult.object);
                            return await this.saveImportedContainer(c, object.containerUrl, runtimeId, object.metadata);
                        }
                        catch(e)
                        {
                            console.log(e);
                            this.waitModal.hide();
                            throw e;
                        }
                    };

                    this.createRuntime = async function() {

                        const runtime = "https://gitlab.com/emulation-as-a-service/linux-container-base-image/-/jobs/artifacts/master/raw/disk.img?job=build";
                        const cloudInit = "https://gitlab.com/emulation-as-a-service/eaas-container-runtime/-/jobs/artifacts/master/raw/eaas-container-runtime/eaas-container-runtime.iso?job=build";
                        
                        let date = new Date();
                        let shortDate =  date.getFullYear() + "/" + (date.getMonth() + 1) + "/" +  date.getDate();
                        console.log(shortDate);
                       
                        let template = vm.systems.find(o => o.id === "runtime");
                        if(!template) {
                            vm.rtModal.close();
                            $state.go('error', {
                                errorMsg: {
                                    title: "Error ",
                                    message: "no runtime template available"
                                }
                            });
                        }

                        let drives = new Drives(template.drive);
                        

                        this.waitModal.show("Creating runtime", "Please wait");

                        let rtImageResult = await Images.import(runtime, `Runtime Image (${shortDate})`, "runtime");
                        let rtCdromResult = await Images.import(cloudInit, `CloudInit (${shortDate})`, "runtime");

                        try{ 
                            drives.setRuntime(rtImageResult, rtCdromResult);
                        }
                        catch (e)
                        {
                            console.log(e);
                            this.waitModal.hide();
                            vm.rtModal.close();
                            $state.go('error', {errorMsg: e});
                        }

                        let builder = new MachineBuilder(localConfig.data.eaasBackendURL, localStorage.getItem('id_token'));
                        builder.label = this.label;
                        builder.nativeConfig = "-smp 1 -net nic,model=e1000 -m 512 -enable-kvm";
                        builder.templateId = template.id;
                        builder.setDrives(drives);

                        try {
                            let result = await builder.build(); 
                            this.waitModal.hide();
                            vm.rtModal.close();
                            vm.updateTable();  

                            console.log(this.selectedServices);

                            for (let c of vm.containerList) { 
                               if(this.selectedServices[c.id])
                                    await this.import(c, result.id);
                            }
                        }  
                        catch(e)  {
                            console.log(e);
                            this.waitModal.hide();
                            vm.rtModal.close();
                            $state.go('error', {errorMsg: e});
                        }
                    };
                }],
                controllerAs: "newRuntimeCtrl"
            });
        };

        $scope.onPageSizeChanged = function () {
            vm.gridOptions.api.paginationSetPageSize(Number(vm.pageSize));
        };

        function onRowSelected(event) {
            if (vm.gridOptions.api.getSelectedRows().length > 0 && vm.gridOptions.api.getSelectedRows()[0].archive === 'default')
                $('#overviewDeleteButton').show();
            else
                $('#overviewDeleteButton').hide();
        }

        vm.initColumnDefs = function () {
            var columnDefs = [];
            columnDefs = [{
                    headerName: '',
                    width: 1,
                    checkboxSelection: true,
                    suppressSorting: true,
                    suppressMenu: true,
                    hide: true
                },
                {
                    headerName: "Machines",
                    field: "name",
                    width: 650,
                    sort: "asc",
                    cellRenderer: machineEntryRenderer,
                    autoHeight: true
                },
                {
                    headerName: "ID",
                    field: "id",
                    width: 100,
                    hide: true
                },
                {
                    headerName: "timestamp",
                    field: "timestamp",
                    hide: true
                },
                {
                    headerName: "description",
                    field: "description",
                    hide: true
                },
            ];

            columnDefs.push({
                headerName: "Archive",
                field: "archive",
                hide: true
            });
            columnDefs.push({
                headerName: "Owner",
                field: "owner",
                width: 100
            }, );

            columnDefs.push({
                headerName: "Actions",
                field: "actions",
                cellRenderer: actionsCellRendererFunc,
                suppressSorting: true,
                suppressMenu: true,
                width: 150
            });

            return columnDefs;
        };

        vm.gridOptions = {
            columnDefs: vm.initColumnDefs(),
            rowHeight: 100,
            groupUseEntireRow: true,
            rowSelection: 'multiple',
            angularCompileRows: true,
            rowMultiSelectWithClick: true,
            enableColResize: true,
            enableSorting: true,
            enableFilter: true,
            enableCellChangeFlash: true,
            onRowSelected: onRowSelected,
            suppressRowClickSelection: true,
            domLayout: 'autoHeight',
            suppressHorizontalScroll: true,
            onGridReady: function (params) {
                vm.updateTable();
                vm.gridOptions.api.redrawRows();
            },
            pagination: true,
            paginationPageSize: Number(vm.pageSize),
            paginationNumberFormatter: function (params) {
                return '[' + params.value.toLocaleString() + ']';
            },
        };
    }
];
