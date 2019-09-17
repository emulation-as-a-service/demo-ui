module.exports = ['$state', '$scope', '$stateParams', '$uibModal', 'groupdIds', 'localConfig', 'REST_URLS', '$http', 'Environments',
    function ($state, $scope, $stateParams, $uibModal, groupdIds, localConfig, REST_URLS, $http, Environments) {
    console.log("groupdIds", groupdIds.data);

    console.log("local ", localConfig);
    var interval = setInterval(updateGroupId, 10000);

    $scope.$on('$locationChangeStart', function (event) {
        clearInterval(interval);
    });

    function updateGroupId() {
        var updatedGroupID = $http.get(localConfig.data.eaasBackendURL + "/sessions").then(function (response) {
            $scope.groupdIds = response.data;

            if ($scope.gridOptions.api != null) {
                $scope.gridOptions.api.setRowData($scope.groupdIds);
                $scope.gridOptions.api.setColumnDefs(vm.initColumnDefs());
                $scope.gridOptions.api.sizeColumnsToFit();
            }
        });
    }
    var vm = this;
    vm.pageSize = "10";
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
                headerName: "", field: "edit", cellRenderer: connectBtnRenderer, suppressSorting: true,
                suppressMenu: true
            }
        ];
    };

    function connectBtnRenderer(params) {
        params.$scope.connect = connect;

        params.$scope.selected = $scope.selected;
        return `<button ng-click="connect(data.id)" id="single-button" type="button" class="dropbtn">
                  connect
                </button>`;
    }

    function connect(id) {
        $http.get(localConfig.data.eaasBackendURL + "sessions/" + id).then((response) => {
            response.data.sessionId = id;
            //temporary, until we define which eenvironmentwe want to first
            const envIdToInitialize = response.data.components.find(e => {return e.type === "machine"}).environmentId;
            const componentId = response.data.components.find(e => {return e.type === "machine"}).componentId;
            $state.go('admin.emulator', {envId: envIdToInitialize, componentId: componentId, session: response.data}, {reload: true});
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
