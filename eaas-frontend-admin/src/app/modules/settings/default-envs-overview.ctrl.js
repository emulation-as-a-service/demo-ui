
module.exports = ['$http', '$state', '$scope', '$stateParams',
    'localConfig', 'growl', 'Environments',
    '$uibModal', "operatingSystemsMetadata", "defaultEnvironments",

    function ($http, $state, $scope, $stateParams,
        localConfig, growl, Environments,
        $uibModal, operatingSystemsMetadata, defaultEnvironments) {

        var vm = this;

        console.log(operatingSystemsMetadata)

        vm.config = localConfig.data;
        vm.operatingSystemsMetadata = operatingSystemsMetadata.data.operatingSystemInformations;

        function updateTableData(rowData) {
            vm.rowCount = rowData.length;
            vm.gridOptions.api.setRowData(rowData);
            vm.gridOptions.api.setColumnDefs(vm.initColumnDefs());
            vm.gridOptions.api.sizeColumnsToFit();
        }

        vm.updateTable = function (index) {
            vm.gridOptions.api.setRowData(null);
            vm.view = index;
            let rowData = [];

            vm.envs = Environments.query().$promise.then(function (response) {
                vm.rowCount = 0;
                vm.envs = response;

                if (vm.operatingSystemsMetadata) {
                    vm.operatingSystemsMetadata.forEach(function (element) {
                        var env = defaultEnvironments.data[element.id];
                        var title = "-";
                        var id = "-";
                        if (env) {
                            var selectedEnv = vm.envs.find(x => x.envId === env);
                            if (selectedEnv) {
                                title = selectedEnv.title;
                                id = selectedEnv.envId;
                            }
                        }
                        rowData.push({
                            osid: element.qid,
                            os: element.label,
                            id: id,
                            title: title
                        });
                    });
                }
                updateTableData(rowData);

            });

        };

        vm.pageSize = "25";

        vm.openDefaultEnvDialog = async function (osId, osLabel) {
            $uibModal.open({
                animation: true,
                template: require('./modals/set-default-environment.html'),
                controller: ["$scope", "helperFunctions", "REST_URLS", function ($scope, helperFunctions, REST_URLS) {
                    this.defaultEnv = null;
                    this.environments = vm.envs.slice(0);
                    this.environments.unshift({
                        title: "-",
                        envId: null
                    });

                    this.osId = osId;
                    this.osLabel = osLabel;

                    this.setEnvironment = function () {
                        $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.setDefaultEnvironmentUrl, this.osId, this.defaultEnv.envId))
                            .then(function (response) {
                                if (response.data.status !== "0") {
                                    growl.error(response.data.message, {
                                        title: 'Error ' + response.data.message
                                    });
                                    $scope.$close();
                                } else {
                                    console.log("set default env for " + osId);
                                }
                            })['finally'](function () {
                                $scope.$close();
                                $state.reload();
                            });

                    };
                }],
                controllerAs: "setDefaultEnvDialogCtrl"
            });
        };

        function actionsCellRendererFunc(params) {
            params.$scope.selected = $scope.selected;
            params.$scope.ctrl = vm;

            params.$scope.changeClass = function (id) {
                if (($("#dropdowm" + id).is(":visible"))) {
                    return "dropbtn2";
                } else {
                    return "dropbtn";
                }
            };

            let defaultEnvs = `
             <div class="btn-group" uib-dropdown dropdown-append-to-body>
                <button id="single-button{{data.id}}" type="button"
                    ng-class="changeClass(data.id)"
                    uib-dropdown-toggle ng-disabled="disabled">
                    {{'CHOOSE_ACTION'| translate}} <span class="caret"></span>
                </button>
                    <ul class="dropdown-menu" id="dropdowm{{data.id}}" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                    <li role="menuitem"><a class="dropdown-content" ng-click="ctrl.openDefaultEnvDialog(data.osid, data.os)">Edit</a></li>
                    </ul>
             </div>`;

            return defaultEnvs;
        }

        vm.onPageSizeChanged = function () {
            vm.gridOptions.api.paginationSetPageSize(Number(vm.pageSize));
        };

        vm.initColumnDefs = function () {

            let columnDefs = [
                {
                    headerName: "OS QID",
                    field: "osid",
                    width: 100
                },
                {
                    headerName: "Operating system",
                    field: "os",
                    width: 300,
                    sort: "asc"
                },
                {
                    headerName: "Env ID",
                    field: "id",
                    width: 100
                },
                {
                    headerName: "Title",
                    field: "title"
                }
            ];

            columnDefs.push({
                headerName: "Actions",
                field: "actions",
                cellRenderer: actionsCellRendererFunc,
                suppressSorting: true,
                suppressMenu: true
            });

            return columnDefs;
        };

        vm.gridOptions = {
            columnDefs: vm.initColumnDefs(),
            rowHeight: 40,
            groupUseEntireRow: true,
            rowSelection: 'multiple',
            angularCompileRows: true,
            rowMultiSelectWithClick: true,
            enableColResize: true,
            enableSorting: true,
            enableFilter: true,
            enableCellChangeFlash: true,
            enableCellTextSelection: true,
            ensureDomOrder: true,
            suppressRowClickSelection: true,
            domLayout: 'autoHeight',
            suppressHorizontalScroll: true,
            onGridReady: function (params) {
                vm.updateTable(0);
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
