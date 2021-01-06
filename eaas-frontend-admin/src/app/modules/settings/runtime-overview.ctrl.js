import {
    getOsLabelById
} from '../../lib/os.js'
module.exports = ['$rootScope', '$http', '$state', '$scope', 
    'localConfig', 'growl', '$translate', 'Environments', 'EaasClientHelper',
    '$uibModal', 
    'REST_URLS', '$timeout', "osList", "EaasClientHelper", 
    function ($rootScope, $http, $state, $scope, 
        localConfig, growl, $translate, Environments, EaasClientHelper,
        $uibModal, 
        REST_URLS, $timeout, osList) {

        var vm = this;

        vm.config = localConfig.data;

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
                    console.log(element);
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
                        os: getOsLabelById(osList.operatingSystems, element.operatingSystem),
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