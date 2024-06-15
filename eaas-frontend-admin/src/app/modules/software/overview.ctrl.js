module.exports = ['softwareList', '$scope', '$http', '$state', "localConfig", "$uibModal",
    function (softwareList, $scope, $http, $state, localConfig, $uibModal) {
   var vm = this;
   vm.swList = softwareList.data.descriptions;

   vm.pageSize = "25";

    $scope.onPageSizeChanged = function() {
        vm.gridOptions.api.paginationSetPageSize(Number(vm.pageSize));
    };

    vm.initColumnDefs = function () {
        return [
            {headerName: "ID", field: "id"},
            {headerName: "Name", field: "label", sort: "asc"},
            {headerName: "Operating System", field: "isOperatingSystem"},
            {headerName: "", field: "edit", cellRenderer: actionsCellRendererFunc, suppressSorting: true,
                suppressMenu: true}
        ];
    };

    function actionsCellRendererFunc(params) {
        params.$scope.switchAction = switchAction;
        params.$scope.selected = $scope.selected;
        params.$scope.changeClass = function (id) {
            if (($("#dropdowm" + id).is(":visible"))) {
                return "dropbtn2";
            } else {
                return "dropbtn";
            }
        };
        let environmentRenderer = `
         <div class="" uib-dropdown dropdown-append-to-body>
            <button id="single-button{{data.id}}" type="button" ng-class="changeClass(data.id)" uib-dropdown-toggle ng-disabled="disabled">
              {{'CHOOSE_ACTION'| translate}} <span class="caret"></span>
            </button>
            <ul class="dropdown-menu" id="dropdowm{{data.id}}" uib-dropdown-menu role="menu" aria-labelledby="single-button">
              
             <li role="menuitem dropdown-content">
                    <a class="dropdown-content" 
                        ui-sref="admin.edit-object-characterization({swId: data.id, objectId: data.id, objectArchive: data.archiveId, isPublic: data.isPublic})">
                        {{'SW_OVERVIEW_SW_EDIT'| translate}}
                    </a>
              </li>
              <li role="menuitem">
                <a class="dropdown-content" 
                    ng-click="switchAction(data.id, \'delete\')">Delete</a>
                </li>
            </ul>
            
         </div>`;
        return environmentRenderer;
    }

    function switchAction(id, selected) {
        vm[selected](id);
    }

    vm.delete = function(id)
    {
        $uibModal.open({
            animation: true,
            template: require('./modals/confirm-delete.html'),
            controller: ["$scope", function ($scope) {
                this.confirmed = () => {
                    $http.delete(localConfig.data.eaasBackendURL + "/software-repository/packages/" + id).then((response) => {
                        $state.go('admin.sw-overview', {}, {reload: true});
                    });
                };
            }],
            controllerAs: "confirmDeleteDialogCtrl"
        });  
    };

    vm.updateTable = function(index)
    {
        vm.gridOptions.api.setRowData(null);
        var rowData = [];
        if (vm.view === 2) // remote objects
        {
            vm.swList.forEach(element => {
                if(element.archive === "Remote Objects")
                {
                    rowData.push({id: element.id, label: element.label, isOperatingSystem : element.isOperatingSystem});
                }
            });
        }
        else if(vm.view === 1) {
             vm.swList.forEach(element => {
                if(element.archive !== "Remote Objects" && element.isPublic)
                {
                    rowData.push({id: element.id, label: element.label, isOperatingSystem : element.isOperatingSystem, isPublic: element.isPublic});
                }
            });
        }
        else {
            vm.swList.forEach(element => {
                if(element.archive !== "Remote Objects" &&! element.isPublic)
                {
                    rowData.push({id: element.id, label: element.label, isOperatingSystem : element.isOperatingSystem, isPublic: element.isPublic});
                }
            });
        }
        vm.rowCount = rowData.length;
        vm.gridOptions.api.setRowData(rowData);
        vm.gridOptions.api.setColumnDefs(vm.initColumnDefs());
        vm.gridOptions.api.sizeColumnsToFit();
    }

    vm.gridOptions = {
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
        enableCellTextSelection: true,
        ensureDomOrder: true,
        suppressRowClickSelection: true,
        domLayout: 'autoHeight',
        suppressHorizontalScroll: true,
        animateRows: true,
        onGridReady: function (params) {
            vm.gridOptions.api.sizeColumnsToFit();
            vm.updateTable(0);
        },
        pagination: true,
        paginationPageSize: Number(vm.pageSize),
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
        new agGrid.Grid(gridDiv, vm.gridOptions);
        vm.gridOptions.api.sizeColumnsToFit();
    });
}];
