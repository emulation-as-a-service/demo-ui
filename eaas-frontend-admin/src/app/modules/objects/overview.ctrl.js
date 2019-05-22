module.exports = ['$state', '$scope', '$stateParams', 'Objects', 'localConfig', 'archives',
    function ($state, $scope, $stateParams, Objects, localConfig, archives)
{

    var vm = this;
    vm.config = localConfig.data;
    vm.activeView = 0;
    vm.archives = archives.data.archives;

    vm.updateTable = function(index, archive)
    {
        if ($scope.gridOptions && $scope.gridOptions.api)
            $scope.gridOptions.api.setRowData(null);
        vm.objectList = Objects.query({archiveId: archive}).$promise.then(function(response) {
            vm.objectList = response;
            vm.updateData();
        });
        vm.activeView = index;
    };
    vm.updateTable(0, vm.archives[0]);

    vm.updateData = function () {
        console.log("view: " + vm.viewArchive);
        if ($scope.gridOptions.api != null) {
            $scope.gridOptions.api.setRowData(vm.objectList);
            $scope.gridOptions.api.setColumnDefs(vm.initColumnDefs());
            $scope.gridOptions.api.sizeColumnsToFit();
        }
    };

    $scope.onPageSizeChanged = function () {
        console.log("page size changed: " + vm.pageSize);
        $scope.gridOptions.api.paginationSetPageSize(Number(vm.pageSize));
    };

    vm.initColumnDefs = function () {
        return [
            {headerName: "ID", field: "id"},
            {
                headerName: "title", field: "title"
            },
            {
                headerName: "description", field: "description", cellRenderer: descriptiponRenderer, suppressSorting: true,
                suppressMenu: true
            },
            {
                headerName: "", field: "edit", cellRenderer: editBtnRenderer, suppressSorting: true,
                suppressMenu: true
            }
        ];
    };

    function editBtnRenderer(params) {
        params.$scope.selected = $scope.selected;
        return `<button id="single-button" ui-sref="admin.edit-object-characterization({objectId: data.id, objectArchive: data.archiveId, userDescription: data.description})" type="button" class="dropbtn">
                  {{'OBJECTS_DETAILS'| translate}}
                </button>`;
    }
    function descriptiponRenderer(params) {
        params.$scope.selected = $scope.selected;
        return `<abbr title="{{data.description}}">{{data.description}}</abbr>`;
    }

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