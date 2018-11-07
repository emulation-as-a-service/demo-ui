module.exports = ['$rootScope', '$http', '$state', '$scope', '$stateParams', 'environmentList', 'objectEnvironmentList', 'localConfig', 'growl', '$translate',
    '$uibModal', 'softwareList', 'helperFunctions', 'containerEnvironmentList', 'REST_URLS',
    function ($rootScope, $http, $state, $scope, $stateParams, environmentList, objectEnvironmentList,
              localConfig, growl, $translate, $uibModal, softwareList, helperFunctions, containerEnvironmentList, REST_URLS) {
        var vm = this;

        vm.config = localConfig.data;
        vm.pageSize = 10;
        vm.landingPage = localConfig.data.landingPage;
        vm.view = 0;
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
                $state.go('admin.standard-envs-overview', {
                    showContainers: true,
                    showObjects: false
                }, {reload: true});
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
                            templateUrl: './modals/confirm-delete.html',
                            controller: ["$scope", function($scope) {
                                this.envId = envId;
                                this.confirmed = confirmDeleteFn;
                            }],
                            controllerAs: "confirmDeleteDialogCtrl"
                        });
                    }
                    else {
                        $rootScope.chk.transitionEnable = true;
                        growl.error(response.data.message, {title: 'Error ' + response.data.status});
                        $state.go('admin.standard-envs-overview', {}, {reload: true});
                    }
                });
            } else {
                $rootScope.chk.transitionEnable = true;
                $state.go('admin.standard-envs-overview', {showContainers: false,
                    showObjects: false}, {reload: true});
            }
        };

        vm.envs = environmentList.data.environments;
        vm.objEnvs = objectEnvironmentList.data.environments;
        vm.containerEnvs = containerEnvironmentList.data.environments;
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

            let environmentRenderer = '<select ng-model="selected" ng-change="switchAction(data.id, selected)">' +
                '  <option disabled hidden selected value="">{{\'CHOOSE_ACTION\'| translate}}</option>' +
                '  <option value="run">{{\'CHOOSE_ENV_PROPOSAL\'| translate}}</option>' +
                '  <option value="edit">{{\'CHOOSE_ENV_EDIT\'| translate}}</option>' +
                '  <option value="deleteEnvironment">{{\'CHOOSE_ENV_DEL\'| translate}}</option>' +
                '  <option value="addSoftware">{{\'CHOOSE_ENV_ADDSW\'| translate}}</option>' +
                '  <option ng-if="landingPage" value="openLandingPage">{{\'CONTAINER_LANDING_PAGE\'| translate}}</option>' +
                '</select>';

            let container = '<select ng-model="selected" ng-change="switchAction(data.id, selected)">' +
                '  <option disabled hidden selected value="">{{\'CHOOSE_ACTION\'| translate}}</option>' +
                '  <option value="run">{{\'CHOOSE_ENV_RUN\'| translate}}</option>' +
                '  <option value="edit">{{\'CHOOSE_ENV_EDIT\'| translate}}</option>' +
                '  <option value="deleteContainer">{{\'CHOOSE_ENV_DEL\'| translate}}</option>' +
                '  <option ng-if="landingPage" value="openLandingPage">{{\'CONTAINER_LANDING_PAGE\'| translate}}</option>' +
                '</select>';

            if (vm.view == 2)
                return container;
            else
                return environmentRenderer;
        }

        function switchAction(id, selected) {
            console.log(id);
            console.log(selected);
            vm[selected](id);
        }

        vm.run = function (id) {
            if (vm.view == 2) {
                $state.go('admin.container', ({envId: id, modifiedDialog: true}));
                return;
            }

            var env = {};
            var concatenatedEnvs = vm.envs.concat(vm.objEnvs);
            for (let i = 0; i < concatenatedEnvs.length; i++) {
                if (id == concatenatedEnvs[i].envId) {
                    env = concatenatedEnvs[i];
                    break;
                }
            }

            if (typeof env.envId == "undefined")
                $state.go('error', {errorMsg: {title: "Error ", message: "given envId: " + id + " is not found!"}});

            $state.go('admin.emulator', {envId: env.envId, objectId: env.objectId, archiveId: env.archiveId});
        };

        vm.edit = function (id) {
            if (vm.view == 1)
                $state.go('admin.edit-env', {envId: id, objEnv: true});
           else if (vm.view == 1)
                $state.go('admin.edit-env', {envId: id});
           else if (vm.view == 2)
                $state.go('admin.edit-container', {envId: id});
        };

        vm.openLandingPage = function (id) {
            window.open(vm.landingPage + "?id=" + id);
            $state.go('admin.standard-envs-overview', {showContainers: false,
                showObjects: false}, {reload: true});
        };


        vm.updateData = function () {
            $scope.gridOptions.api.setRowData(vm.initRowData());
            $scope.gridOptions.api.setColumnDefs(vm.initColumnDefs());
            $scope.gridOptions.api.sizeColumnsToFit();
        };

        vm.initRowData = function () {
            var rowData = [];
            if (vm.view == 0)
                vm.envs.forEach(function (element) {
                    rowData.push({name: element.title, id: element.envId, emulator: element.emulator})
                });
            else if (vm.view == 1) {
                vm.objEnvs.forEach(function (element) {
                    rowData.push({name: element.title, id: element.envId, emulator: element.emulator, objectId : element.objectId})
                })
            } else if (vm.view == 2) {
                vm.containerEnvs.forEach(function (element) {
                    rowData.push({name: element.title, id: element.envId, emulator: element.emulator, objectId : element.objectId})
                })
            }
            return rowData;
        };

        vm.initColumnDefs = function () {
            var columnDefs = [];
            columnDefs = [
                {headerName: '', width: 41, checkboxSelection: true, suppressSorting: true,
                    suppressMenu: true},
                {headerName: "Name", field: "name"},
                {headerName: "ID", field: "id"},
            ];

            if (vm.view == 0 || vm.view == 1) {
                columnDefs.push({headerName: "Emulator", field: "emulator"},);
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
            animateRows: true,
            onGridReady: function (params) {
                $scope.gridOptions.api.sizeColumnsToFit();
            },
            pagination: true,
            paginationPageSize: 10,
            paginationNumberFormatter: function(params) {
                return '[' + params.value.toLocaleString() + ']';
            },
        };

        function onRowSelected(event) {
            if ($scope.gridOptions.api.getSelectedRows().length > 0)
                $('#overviewDeleteButton').show();
            else
                $('#overviewDeleteButton').hide();
        }


    }];