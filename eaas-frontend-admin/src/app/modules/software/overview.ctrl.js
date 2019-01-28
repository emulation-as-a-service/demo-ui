module.exports = ['softwareList', '$scope', '$stateParams', function (softwareList, $scope, $stateParams) {
   var vm = this;
   vm.swList = softwareList.data.descriptions;

   console.log(vm.swList);

    $scope.onPageSizeChanged = function() {
        $scope.gridOptions.api.paginationSetPageSize(Number(vm.pageSize));
    };

    vm.initColumnDefs = function () {
        return [
            {headerName: "ID", field: "id"},
            {headerName: "Label", field: "label"},
            {headerName: "Operating System", field: "isOperatingSystem"},
            {headerName: "", field: "edit", cellRenderer: editBtnRenderer, suppressSorting: true,
                suppressMenu: true}
        ];
    };

    function editBtnRenderer(params) {
        params.$scope.selected = $scope.selected;
        return  `<button id="single-button" ui-sref="admin.sw-ingest({swId: data.id})" type="button" class="dropbtn">
                  {{'SW_OVERVIEW_SW_EDIT'| translate}}
                </button>`;
    }

    $scope.gridOptions = {
        columnDefs: vm.initColumnDefs(),
        rowData: vm.swList,
        rowHeight: 31,
        groupUseEntireRow:  true,
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
        paginationNumberFormatter: function(params) {
            return '[' + params.value.toLocaleString() + ']';
        },
    };


    if (softwareList.data.status !== "0") {
       $state.go('error', {errorMsg: {title: "Load Environments Error " + softwareList.data.status, message: softwareList.data.message}});
       return;
   }

   vm.softwareList = softwareList.data.descriptions;

    // setup the grid after the page has finished loading
    document.addEventListener('DOMContentLoaded', function () {
        var gridDiv = document.querySelector('#myGrid');
        new agGrid.Grid(gridDiv, gridOptions);
        gridOptions.api.sizeColumnsToFit();
    });
}];