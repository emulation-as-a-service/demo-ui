module.exports = ['$rootScope', '$http', '$state', '$scope', '$stateParams', 'localConfig', 'growl', '$translate',
    '$uibModal', 'helperFunctions', 'nameIndexes', 'REST_URLS',
    function ($rootScope, $http, $state, $scope, $stateParams,
              localConfig, growl, $translate, $uibModal, helperFunctions, nameIndexes, REST_URLS) {
        var vm = this;

        if (typeof $stateParams.entries == "undefined" || $stateParams.entries == null) {
            growl.error("Error!\nEmulator name is not given");
            $state.go('admin.emulators', {}, {reload: true});
        } else {
            vm.title = $stateParams.emuName.toUpperCase();
        }
        vm.nameIndexes = nameIndexes.data;
        if ($stateParams.entries.length > 0)
            vm.nameIndexes.aliases.entry.find(function (aliasElement) {
                if (aliasElement.value.name === $stateParams.entries[0].value.name && aliasElement.value.alias === "latest") {
                    vm.latestVersion = aliasElement.value.version;
                    return;
                }
            });

        vm.initRowData = function () {
            let rowData = [];
            $stateParams.entries.forEach(function (entry) {
                rowData.push({
                    version: entry.value.version,
                    id: entry.value.image.id,
                    ociSourceUrl: entry.value.provenance.ociSourceUrl.replace('docker://',''),
                    versionTag: entry.value.provenance.versionTag,
                    isLatest: entry.value.version === vm.latestVersion,
                    entry: entry
                })
            });
            return rowData;
        };

        function JSONBtnRenderer(params) {
            params.$scope.selected = $scope.selected;
            params.$scope.showJsonDialog = vm.showJsonDialog;

            return `<button id="single-button" type="button" ng-click="showJsonDialog(data.entry)" class="dropbtn">
                  JSON
                </button>`;
        }

        function latestEditorBtnRenderer(params) {
            params.$scope.selected = $scope.selected;
            params.$scope.makeLatest = vm.makeLatest;

            return `<button id="single-button" ng-if="!data.isLatest" type="button" ng-click="makeLatest(data.entry.value.name, data.entry.value.version)" class="dropbtn">
                  Make Latest
                </button>
                <div ng-if="data.isLatest">The Latest!</div>`;
        }

        vm.initColumnDefs = function () {
            return [
                {headerName: "User version", field: "version"},
                {headerName: "ID", field: "id"},
                {headerName: "ociSourceUrl", field: "ociSourceUrl"},
                {headerName: "Docker tag", field: "versionTag"},
                {
                    headerName: "Latest", field: "isLatest",
                    cellStyle: function (params) {
                        if (params.value)
                            return {

                                backgroundColor: '#aaffaa', // light green
                                "text-align": "center",
                                border: "1.5px solid #FFD700 !important"
                            }
                    },
                    cellRenderer: latestEditorBtnRenderer
                },
                {
                    headerName: "", field: "edit", cellRenderer: JSONBtnRenderer, suppressSorting: true,
                    suppressMenu: true
                }
            ];
        };

        vm.showJsonDialog = function (entry) {
            $uibModal.open({
                animation: false,
                resolve: {
                    entry: function () {
                        return entry;
                    }
                },
                template: require('./modals/emulators-json.modal.html'),
                controller: "EmulatorsJsonModalController as jsonDialogCtrl"
            });
        };

        vm.makeLatest = function (emulatorName, version) {
            $http.post(localConfig.data.eaasBackendURL + REST_URLS.updateLatestEmulator,
                {
                    emulatorName: emulatorName,
                    version: version
                }).then(function (response) {
                console.log("!!!!!!");
                console.log(response);
                if (response.status === 200 || response.status === 204) {
                    growl.success('done!');
                    $state.go('admin.emulators_details', {entries: $stateParams.entries, emuName: $stateParams.emuName}, {reload: true});
                }
                else {
                    $state.go('error', {errorMsg: {title: 'Error ' + response.message + "\n\n" + response}});
                }
            });

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