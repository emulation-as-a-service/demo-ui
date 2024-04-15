import {
    ContainerImageBuilder,
    EmulatorBuilder,
} from "../../lib/containerBuilder.js";
import {
    WaitModal,
    Task
} from "../../lib/task.js";
import {
    emulatorsList
} from "../../lib/emulators.js";

module.exports = ['$http', '$state', '$scope', '$stateParams', 'localConfig', 'growl', '$translate', '$timeout', '$uibModalStack',
    '$uibModal', 'helperFunctions', 'nameIndexes', 'REST_URLS',
    function ($http, $state, $scope, $stateParams,
        localConfig, growl, $translate, $timeout, $uibModalStack, $uibModal, helperFunctions, nameIndexes, REST_URLS) {
        var vm = this;
        vm.nameIndexes = nameIndexes.data;
        
        const updateTable = async function () {
            let emulatorList = await emulatorsList();
            let rowData = [];
            for (let i = 0; i < emulatorList.emulators.length; i++) {
                let rowElement = {};
                rowElement.entries = [];
                rowElement.name = emulatorList.emulators[i].eaasId;
                rowElement.emulatorInfo = emulatorList.emulators[i];
                console.log(rowElement.emulatorInfo);
                if (vm.nameIndexes.entries.entry) {
                    vm.nameIndexes.entries.entry.forEach(
                        (element) => {
                            if (element.key.indexOf(emulatorList.emulators[i].eaasId) !== -1) {
                                rowElement.entries.push(element);
                            }
                        }
                    );
                }
                rowData.push(rowElement);
            }
            $scope.gridOptions.api.setRowData(rowData);
        };

        updateTable();

        function editBtnRenderer(params) {
            params.$scope.selected = $scope.selected;
            return `<button id="single-button" ui-sref="admin.emulators_details({entries: data.entries, emuName: data.name})" type="button" class="dropbtn">
                  {{'EMULATORS_DETAILS'| translate}}
                </button>`;
        }

        function editBtnRenderer2(params) {
            params.$scope.selected = $scope.selected;
            params.$scope.importLatest = importLatest;
            return `<div ng-if="data.emulatorInfo.repositoryName"> <button class="dropbtn" type="button" ng-click="importLatest(data.emulatorInfo)">Install latest</button></div>
                    <div ng-if="!data.emulatorInfo.repositoryName">Not avialable</div>
            `;
        }

        const importLatest = async(emulatorInfo) =>
        {
            const url = `${emulatorInfo.repositoryUrl}${emulatorInfo.repositoryName}`;
            importEmulatorFromRegistry(url, null);
        };

        const importEmulatorFromRegistry = async (url, tag) =>
        {
            if (!tag) {
                [url, tag] = url.split(":");
            }
            const api = localConfig.data.eaasBackendURL;
            const idToken = localStorage.getItem('id_token');
            try {
                const modal = $uibModal.open({
                    backdrop: 'static',
                    animation: true,
                    templateUrl: 'partials/wait.html'
                });

                let imageBuilder = new ContainerImageBuilder(url, "dockerhub");
                imageBuilder.setTag((tag) ? tag : "latest");
                let imageBuilderResult = await imageBuilder.build(api, idToken);
                let task = new Task(imageBuilderResult.taskId, api, idToken);

                let buildResult = await task.done;
                let object = JSON.parse(buildResult.object);

                let emulatorBuilder = new EmulatorBuilder(object.containerUrl, object.metadata);
                let importResult = await emulatorBuilder.build(api, idToken);
                task = new Task(importResult.taskId, api, idToken);
                await task.done;
                $uibModalStack.dismissAll();
            } catch (e) {
                console.log(e);
                $state.go('error', {
                    errorMsg: {
                        title: e
                    }
                });
                $uibModalStack.dismissAll();
            }
        };

        vm.import = function () {
            $uibModal.open({
                animation: false,
                template: require('./modals/import-emulator.html'),
                controller: ["$scope", function ($scope) {

                    var _vm = this;
                    _vm.doImport = async function () {
                        const api = localConfig.data.eaasBackendURL;
                        const idToken = localStorage.getItem('id_token');
                        if (_vm.imageUrl) {
                            importEmulatorFromRegistry(_vm.imageUrl, _vm.tag);
                        } else {
                            try {
                                _vm.modal = $uibModal.open({
                                    backdrop: 'static',
                                    animation: true,
                                    templateUrl: 'partials/wait.html'
                                });
                                let builder = new EmulatorBuilder(_vm.qcowImageUrl);
                                let builderResult = await builder.build(api, idToken);
                                let task = new Task(builderResult.taskId, api, idToken);

                                await task.done;
                                $uibModalStack.dismissAll();
                            } catch (e) {
                                console.log(e); 
                                $state.go('error', {
                                    errorMsg: {
                                        title: 'Error ' + e
                                    }
                                });
                                $uibModalStack.dismissAll();
                            }
                        }
                    };
                }],
                controllerAs: "importEmulatorCtrl"
            });
        };

        vm.initColumnDefs = function () {
            return [{
                    headerName: "Name",
                    field: "name"
                },
                {
                    headerName: "Number of images",
                    valueGetter: function aPlusBValueGetter(params) {
                        return params.data.entries.length;
                    }
                },
                {
                    headerName: "",
                    field: "quickAction",
                    cellRenderer: editBtnRenderer2,
                    suppressSorting: true,
                    suppressMenu: true
                },
                {
                    headerName: "",
                    field: "edit",
                    cellRenderer: editBtnRenderer,
                    suppressSorting: true,
                    suppressMenu: true
                },

            ];
        };

        $scope.gridOptions = {
            columnDefs: vm.initColumnDefs(),
            rowHeight: 31,
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
                $scope.gridOptions.api.sizeColumnsToFit();
            },
            pagination: false,
            paginationNumberFormatter: function (params) {
                return '[' + params.value.toLocaleString() + ']';
            },
        };
    }
];
