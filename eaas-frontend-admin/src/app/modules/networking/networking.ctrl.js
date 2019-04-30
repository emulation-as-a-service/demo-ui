module.exports = ['$state', '$scope', '$stateParams', '$uibModal', 'groupdIds', 'localConfig', 'REST_URLS', '$http',
    function ($state, $scope, $stateParams, $uibModal, groupdIds, localConfig, REST_URLS, $http) {
    console.log("groupdIds", groupdIds.data);

    console.log("local ", localConfig);
    var interval = setInterval(updateGroupId, 10000);

    $scope.$on('$locationChangeStart', function (event) {
        clearInterval(interval);
    });

    function updateGroupId() {
        var updatedGroupID = $http.get(localConfig.data.eaasBackendURL + REST_URLS.getGroupIds).then(function (response) {
            $scope.groupdIds = response.data;
            console.log($scope.groupdIds);

            if ($scope.gridOptions.api != null) {
                $scope.gridOptions.api.setRowData($scope.groupdIds);
                $scope.gridOptions.api.setColumnDefs(vm.initColumnDefs());
                $scope.gridOptions.api.sizeColumnsToFit();
            }
        });
    }
    var vm = this;
    vm.config = localConfig.data;
    $scope.groupdIds = groupdIds.data;

    if (groupdIds.status !== 200) {
        $state.go('error', {
            errorMsg: {
                title: "Load Environments Error " + groupdIds.status,
                message: groupdIds.message
            }
        });
        return;
    }

    $scope.onPageSizeChanged = function () {
        $scope.gridOptions.api.paginationSetPageSize(Number(vm.pageSize));
    };

    vm.initColumnDefs = function () {
        return [
            {headerName: "ID", field: "id"},
            {headerName: "Name", field: "name"},
            {
                headerName: "", field: "edit", cellRenderer: editBtnRenderer, suppressSorting: true,
                suppressMenu: true
            }
        ];
    };

    function editBtnRenderer(params) {
        params.$scope.openNetworkGroupModal = openNetworkGroupModal;

        params.$scope.selected = $scope.selected;
        return `<button ng-click="openNetworkGroupModal(data.id)" id="single-button" type="button" class="dropbtn">
                  details
                </button>`;
    }

    function openNetworkGroupModal(id) {
        $http.get(localConfig.data.eaasBackendURL + "networks/" + id).then(function (response) {
            $uibModal.open({
                animation: true,
                template: require('./modals/networkGroupModal.html'),
                resolve: {
                    groupId: function () {
                        return id;
                    },
                    groupName: function() {
                        return $scope.groupdIds.find(element => element.id === id).name;
                    },
                    localConfig: function () {
                        return localConfig;
                    },
                    groupComponents: function () {
                        return response.data;
                    }
                },
                controller: "NetworkGroupManagerCtrl as networkModalCtrl"
            });


        })
    }


    $scope.gridOptions = {
        columnDefs: vm.initColumnDefs(),
        rowData: $scope.groupdIds,
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
        pagination: true,
        paginationPageSize: 20,
        paginationNumberFormatter: function (params) {
            return '[' + params.value.toLocaleString() + ']';
        },
    };

    // setup the grid after the page has finished loading
    document.addEventListener('DOMContentLoaded', function () {
        var gridDiv = document.querySelector('#myGrid');
        new agGrid.Grid(gridDiv, gridOptions);
        gridOptions.api.sizeColumnsToFit();
    });

}];