module.exports = ['$state', '$scope', '$stateParams', 'Objects', 'localConfig', 'archives',
    function ($state, $scope, $stateParams, Objects, localConfig, archives)
{

    var vm = this;
    vm.config = localConfig.data;
    vm.activeView = 0;
    vm.archives = archives.data.archives;
    vm.pageSize = "10";

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
        $scope.gridOptions.api.paginationSetPageSize(Number(vm.pageSize));
    };

    vm.initColumnDefs = function () {
        return [
            {headerName: "ID", field: "id"},
            {
                headerName: "title", field: "title", sort: "asc"
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
        params.$scope.ctrl = vm;

        params.$scope.changeClass = function (id) {
            if (($("#dropdowm" + id).is(":visible"))) {
                return "dropbtn2";
            } else {
                return "dropbtn";
            }
        };

        let objectActions = `
             <div class="btn-group" uib-dropdown dropdown-append-to-body>
                <button id="single-button{{data.id}}" type="button"
                ng-class="changeClass(data.id)"
                uib-dropdown-toggle
                ng-disabled="disabled">
                  {{\'CHOOSE_ACTION\'| translate}} <span class="caret"></span>
                </button>
                <ul class="dropdown-menu" id="dropdowm{{data.id}}" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                  <li role="menuitem">
                    <a class="dropdown-content"
                         ui-sref="admin.edit-object-characterization({objectId: data.id, objectArchive: data.archiveId, userDescription: data.description})">{{'OBJECTS_DETAILS'| translate}}</a>
                  </li>
                  <li role="menuitem">
                    <a class="dropdown-content"
                        ng-click="ctrl._delete(data.archiveId, data.id)">Delete</a></li>
                </ul>
             </div>`;

        return objectActions;
    }

    vm._delete = function(archiveId, id) {

        if (!window.confirm(`Please confirm deleting this object?`))
            return false;

        Objects.remove({archiveId: archiveId,
                       objectId: id}).$promise.then(function() {
            $state.go('admin.object-overview', {}, {reload: true});
        });
    }

    function descriptiponRenderer(params) {
        params.$scope.selected = $scope.selected;
        return `<abbr title="{{data.description}}">{{data.description}}</abbr>`;
    }

    vm.getArchiveHeader = function(item)
    {
        if(item === 'zero conf')
            return 'Local Object Archive';
        else if(item.startsWith("user_archive"))
            return item.substring('user_archive'.length);
        else
            return item;
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
