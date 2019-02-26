module.exports = ['$rootScope', '$http', '$state', '$scope', '$stateParams', 'localConfig', 'growl', '$translate',
    '$uibModal', 'helperFunctions', 'nameIndexes', 'REST_URLS',
    function ($rootScope, $http, $state, $scope, $stateParams,
              localConfig, growl, $translate, $uibModal, helperFunctions, nameIndexes, REST_URLS) {
        var vm = this;
        vm.nameIndexes = nameIndexes.data;
        vm.emulators = window.EMULATORS_LIST;
        vm.initRowData = function () {
            let rowData = [];
            for (let i = 0; i < window.EMULATORS_LIST.length; i++) {
                let rowElement = {};
                rowElement.entries = [];
                rowElement.name = window.EMULATORS_LIST[i];
                vm.nameIndexes.entries.entry.forEach(
                    function (element) {
                        if (element.key.indexOf(window.EMULATORS_LIST[i]) !== -1) {
                            rowElement.entries.push(element);
                        }
                    }
                );
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