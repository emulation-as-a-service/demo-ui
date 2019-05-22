module.exports = ['$rootScope', '$http', '$state', '$scope', '$stateParams', 'localConfig', 'growl', '$translate', '$timeout',  '$uibModalStack',
    '$uibModal', 'helperFunctions', 'nameIndexes', 'REST_URLS',
    function ($rootScope, $http, $state, $scope, $stateParams,
              localConfig, growl, $translate, $timeout, $uibModalStack, $uibModal, helperFunctions, nameIndexes, REST_URLS)
{
        var vm = this;
        vm.nameIndexes = nameIndexes.data;
        vm.emulators = window.EMULATORS_LIST;
        vm.initRowData = function () {
            let rowData = [];
            for (let i = 0; i < window.EMULATORS_LIST.length; i++) {
                let rowElement = {};
                rowElement.entries = [];
                rowElement.name = window.EMULATORS_LIST[i];
                if(vm.nameIndexes.entries.entry) {
                    vm.nameIndexes.entries.entry.forEach(
                        function (element) {
                            if (element.key.indexOf(window.EMULATORS_LIST[i]) !== -1) {
                                rowElement.entries.push(element);
                            }
                        }
                    );
                }
                rowData.push(rowElement);

            }
            return rowData;
        };

        function editBtnRenderer(params) {
            params.$scope.selected = $scope.selected;
            return `<button id="single-button" ui-sref="admin.emulators_details({entries: data.entries, emuName: data.name})" type="button" class="dropbtn">
                  {{'EMULATORS_DETAILS'| translate}}
                </button>`;
        }

        vm.import = function()
        {
            $uibModal.open({
                animation: false,
                template: require('./modals/import-emulator.html'),
                controller: ["$scope", function($scope) {

                     var _vm = this;
                     _vm.doImport = function () {

                                $http.post(localConfig.data.eaasBackendURL + REST_URLS.importEmulator,
                                 {
                                     urlString: _vm.imageUrl,
                                     runtimeID: _vm.runtime,
                                     tag: _vm.tag,
                                     alias: _vm.alias,
                                     isEmulator: true,
                                     imageType: "dockerhub",
                                 }).then(function (response) {

                                 if (response.data.status === "0") {
                                     var taskId = response.data.taskId;
                                     _vm.modal = $uibModal.open({
                                         backdrop: 'static',
                                         animation: true,
                                         templateUrl: 'partials/wait.html'
                                     });
                                     _vm.checkState(taskId, true);
                                     $uibModalStack.dismissAll();
                                 }
                                 else {
                                     $state.go('error', {errorMsg: {title: 'Error ' + response.data.message + "\n\n" + _vm.description}});
                                     $uibModalStack.dismissAll();
                                 }
                             });
                         };

                         _vm.checkState = function (_taskId, stayAtPage) {
                             var taskInfo = $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getContainerTaskState, _taskId)).then(function (response) {
                                 if (response.data.status == "0") {
                                     if (response.data.isDone) {
                                         _vm.id = response.data.userData.environmentId;
                                         _vm.modal.close();
                                         growl.success("Import successful.");
                                         $state.go('admin.emulators', {}, {reload: true});
                                     }
                                     else
                                         $timeout(function () {
                                             _vm.checkState(_taskId, stayAtPage);
                                         }, 2500);
                                 }
                                 else {
                                     _vm.modal.close();
                                     $state.go('error', {errorMsg: {title: 'Error ' + response.data.message}});
                                 }
                             });
                         };

                }],
                controllerAs: "importEmulatorCtrl"
            });
        }

        vm.initColumnDefs = function () {
            return [
                {headerName: "Name", field: "name"},
                {headerName: "Number of images", valueGetter: function aPlusBValueGetter(params) {
                        return params.data.entries.length;
                    }},
                {
                    headerName: "", field: "edit", cellRenderer: editBtnRenderer, suppressSorting: true,
                    suppressMenu: true
                }
            ];
        };

        $scope.gridOptions = {
            columnDefs: vm.initColumnDefs(),
            rowData: vm.initRowData(),
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
    }];