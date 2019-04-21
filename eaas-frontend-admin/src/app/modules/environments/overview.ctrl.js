module.exports = ['$rootScope', '$http', '$state', '$scope', '$stateParams', 'environmentList', 'localConfig', 'growl', '$translate',
    '$uibModal', 'softwareList', 'helperFunctions', 'userInfo', 'REST_URLS',
    function ($rootScope, $http, $state, $scope, $stateParams, environmentList,
              localConfig, growl, $translate, $uibModal, softwareList, helperFunctions, userInfo, REST_URLS) {
        var vm = this;

        vm.config = localConfig.data;
        vm.pageSize = 10;
        vm.landingPage = localConfig.data.landingPage;
        vm.view = 0;
        vm.viewArchive = 0;
        if($stateParams.showContainers)
            vm.view = 2;
        else if($stateParams.showObjects)
            vm.view = 1;


        if (environmentList.data.status !== "0") {
            $state.go('error', {errorMsg: {title: "Load Environments Error " + environmentList.data.status, message: environmentList.data.message}});
            return;
        }

        vm.exportEnvironment = function(envId) {

            $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.exportEnvironmentUrl, envId))
                .then(function(response) {
                    if (response.data.status === "0") {
                        growl.success("export successful");
                    } else {
                        growl.error(response.data.message, {title: 'Error ' + response.data.status});
                    }
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

        vm.deleteEnvironment = function(envId) {
            $rootScope.chk.transitionEnable = false;

            if (window.confirm($translate.instant('JS_DELENV_OK'))) {
                $http.post(localConfig.data.eaasBackendURL + REST_URLS.deleteEnvironmentUrl, {
                    envId: envId,
                    deleteMetaData: true,
                    deleteImage: true,
                    force: false
                }).then(function(response) {
                    if (response.data.status === "0") {
                        // remove env locally
                        vm.envs = vm.envs.filter(function(env) {
                            return env.envId !== envId;
                        });
                        $rootScope.chk.transitionEnable = true;
                        growl.success($translate.instant('JS_DELENV_SUCCESS'));
                        $state.go('admin.standard-envs-overview', {}, {reload: true});
                    }
                    else if (response.data.status === "2") {

                        $uibModal.open({
                            animation: true,
                            template: require ('./modals/confirm-delete.html'),
                            controller: ["$scope", function($scope) {
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

        vm.envs = environmentList.data.environments;
        vm.showObjects = $stateParams.showObjects;
        vm.showContainers = $stateParams.showContainers;


        $scope.onInputSourceSelection = function (obj) {
            // Get chosen input source
            var inputMethod = obj.target.attributes.method.value;

            if (typeof(this.activeInputMethod) != 'undefined') {
                this.showDialogs[this.activeInputMethod] = false;
            }

            console.log(this.showDialogs);
            console.log(inputMethod);
        };
        vm.selectedRowData = {};
        vm.deleteSelected = function () {
            console.log("selectedRowData ", vm.selectedRowData.length);
            var selectedRowData = $scope.gridOptions.api.getSelectedRows();
            selectedRowData.forEach( selectedRowData => {
                vm.deleteEnvironment(selectedRowData.id)
            });
        };
        $scope.selected = "";


        function actionsCellRendererFunc(params) {
            params.$scope.switchAction = switchAction;
            params.$scope.selected = $scope.selected;
            params.$scope.landingPage = vm.landingPage;
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
                        <a class="dropdown-content" ng-click="switchAction(data.id, \'run\')" data-id="m-run">{{\'CHOOSE_ENV_PROPOSAL\'| translate}}</a>
                  </li>

                  <li role="menuitem"><a class="dropdown-content" ng-click="switchAction(data.id, \'edit\')" data-id="m-edit">{{\'CHOOSE_ENV_EDIT\'| translate}}</a></li>
                  <li ng-if="data.archive == 'default'" role="menuitem"><a class="dropdown-content" ng-click="switchAction(data.id, \'deleteEnvironment\')">{{\'CHOOSE_ENV_DEL\'| translate}}</a></li>
                  <li ng-if="data.archive != 'remote'" role="menuitem"><a class="dropdown-content" ng-click="switchAction(data.id, \'addSoftware\')">{{\'CHOOSE_ENV_ADDSW\'| translate}}</a></li>
                </ul>

             </div>`;

            let container = `
             <div class="btn-group" uib-dropdown dropdown-append-to-body>
                <button id="single-button{{data.id}}" type="button"  ng-class="changeClass(data.id)" uib-dropdown-toggle ng-disabled="disabled">
                  {{\'CHOOSE_ACTION\'| translate}} <span class="caret"></span>
                </button>
                <ul class="dropdown-menu" id="dropdowm{{data.id}}" uib-dropdown-menu role="menu" aria-labelledby="single-button">

                  <li role="menuitem"><a class="dropdown-content" ng-click="switchAction(data.id, \'run\')">{{\'CHOOSE_ENV_PROPOSAL\'| translate}}</a></li>
                  <li role="menuitem"><a class="dropdown-content" ng-click="switchAction(data.id, \'edit\')">{{\'CHOOSE_ENV_EDIT\'| translate}}</a></li>
                  <li role="menuitem"><a class="dropdown-content" ng-click="switchAction(data.id, \'deleteContainer\')">{{\'CHOOSE_ENV_DEL\'| translate}}</a></li>
                  <li class="divider"></li>
                  <li role="menuitem"><a ng-if="landingPage" target="_blank" class="dropdown-content"
                  ng-click="switchAction(data.id, \'openLandingPage\')"">{{'CONTAINER_LANDING_PAGE'| translate}}</a></li>
                </ul>
             </div>`;

            if (vm.view == 2)
                return container;
            else
                return environmentRenderer;
        }


        function switchAction(id, selected) {
            vm[selected](id);
        }

        vm.run = function (id) {
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
            $rootScope.nativeConfig = env.nativeConfig;
            window.isCollapsed = true;
            $state.go('admin.emulator', {envId: env.envId, objectId: env.objectId, objectArchive: env.objectArchive}, {reload: true});
        };

        vm.edit = function (id) {
            if (vm.view == 1)
                $state.go('admin.edit-env', {envId: id, objEnv: true});
           else if (vm.view == 0)
                $state.go('admin.edit-env', {envId: id});
           else if (vm.view == 2)
                $state.go('admin.edit-container', {envId: id});
        };

        vm.openLandingPage = function (id) {
            window.open(vm.landingPage + "?id=" + id);
        };


        vm.updateData = function () {

            console.log("view: " + vm.viewArchive);
            if ($scope.gridOptions.api != null) {
                $scope.gridOptions.api.setRowData(vm.initRowData());
                $scope.gridOptions.api.setColumnDefs(vm.initColumnDefs());
                $scope.gridOptions.api.sizeColumnsToFit();
            }
        };


        vm.initRowData = function () {
            var rowData = [];
            if (vm.view == 0)
                vm.envs.forEach(function (element) {
                    if(element.envType != 'base')
                        return;
                    if((element.archive == 'default' && vm.viewArchive === 0) ||
                        ((element.archive == "public" || element.archive == 'emulators') && vm.viewArchive === 1) ||
                        (element.archive == "remote" && vm.viewArchive === 2))
                            rowData.push({name: element.title, id: element.envId, archive: element.archive, owner: (element.owner) ? element.owner : "shared"});
                });
            else if (vm.view == 1) {
                vm.envs.forEach(function (element) {
                    if(element.envType != 'object')
                        return;
                    rowData.push({name: element.title, id: element.envId, owner: (element.owner) ? element.owner : "shared", objectId : element.objectId})
                })
            } else if (vm.view == 2) {
                vm.envs.forEach(function (element) {
                    if(element.envType != 'container')
                        return;
                    rowData.push({name: element.title, id: element.envId, owner: (element.owner) ? element.owner : "shared", objectId : element.objectId})
                })
            }
            return rowData;
        };

        vm.initColumnDefs = function () {
            var columnDefs = [];
            columnDefs = [
                {headerName: '', width: 41, checkboxSelection: true, suppressSorting: true,
                    suppressMenu: true},
                {headerName: "Name", field: "name", width: 400},
                {headerName: "ID", field: "id", width: 100},
                {headerName: "Archive", field: "archive", hide: true}
            ];

            if (vm.view == 0 || vm.view == 1) {
                columnDefs.push({headerName: "Owner", field: "owner", width: 100},);
                if (vm.view == 1) {
                    columnDefs.push({headerName: "ObjectID", field: "objectId"});
                }
            }

            columnDefs.push({
                headerName: "Actions", field: "actions", cellRenderer: actionsCellRendererFunc, suppressSorting: true,
                suppressMenu: true
            });

            return columnDefs;
        };
        vm.initRowData();
        vm.initColumnDefs();

        $scope.onPageSizeChanged = function() {
            $scope.gridOptions.api.paginationSetPageSize(Number(vm.pageSize));
        };

        $scope.gridOptions = {
            columnDefs: vm.initColumnDefs(),
            rowData: vm.initRowData(),
            rowHeight: 31,
            groupUseEntireRow:  true,
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
            animateRows: true,
            onGridReady: function (params) {
                $scope.gridOptions.api.sizeColumnsToFit();
                $scope.gridOptions.api.redrawRows();
            },
            pagination: true,
            paginationPageSize: 20,
            paginationNumberFormatter: function(params) {
                return '[' + params.value.toLocaleString() + ']';
            },
        };

        function onRowSelected(event) {
         //   if ($scope.gridOptions.api.getSelectedRows().length > 0)
         //       $('#overviewDeleteButton').show();
         //   else
         //       $('#overviewDeleteButton').hide();
        }
        // setup the grid after the page has finished loading
        document.addEventListener('DOMContentLoaded', function () {
            var gridDiv = document.querySelector('#myGrid');
            new agGrid.Grid(gridDiv, gridOptions);
            gridOptions.api.sizeColumnsToFit();
        });
    }];