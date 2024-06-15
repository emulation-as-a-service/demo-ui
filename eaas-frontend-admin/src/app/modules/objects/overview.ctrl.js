module.exports = ['$state', '$scope', '$stateParams', 'Objects', 'localConfig', 'archives',
    function ($state, $scope, $stateParams, Objects, localConfig, archives)
{

    var vm = this;
    vm.config = localConfig.data;
    vm.activeView = 0;
    vm.archives = archives.data.archives;
    vm.pageSize = "25";

    vm.updateTable = function(index, archive)
    {
        if (vm.gridOptions && vm.gridOptions.api)
            vm.gridOptions.api.setRowData(null);
        vm.objectList = Objects.query({archiveId: archive}).$promise.then(function(response) {
            vm.objectList = response;

            let rowData = [];

            vm.objectList.forEach(function (element) {
                rowData.push({
                    id: element.id,
                    title: element.title,
                    objectArchive: element.archiveId
                });
            });

            vm.updateData(rowData);
        });
        vm.activeView = index;
    };
    vm.updateTable(0, vm.archives[0]);

    vm.updateData = function (rowData) {
        console.log("view: " + vm.viewArchive);
        if (vm.gridOptions.api != null) {
            vm.gridOptions.api.setRowData(rowData);
            vm.gridOptions.api.setColumnDefs(vm.initColumnDefs());
            vm.gridOptions.api.sizeColumnsToFit();
        }
    };

    vm.onPageSizeChanged = function () {
        vm.gridOptions.api.paginationSetPageSize(Number(vm.pageSize));
    };

    vm.initColumnDefs = function () {
        return [
            {
                headerName: "Object", field: "title", sort: "asc", cellRenderer: userObjectRenderer, 
                    width: 700, sortable: true, filter: true, resizable: true
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
                         ui-sref="admin.edit-object-characterization({objectId: data.id, objectArchive: data.objectArchive, userDescription: data.description})">{{'OBJECTS_DETAILS'| translate}}</a>
                  </li>
                  <li role="menuitem">
                    <a class="dropdown-content"
                        ng-click="ctrl._delete(data.objectArchive, data.id)">Delete</a></li>
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

    function userObjectRenderer(params) {
        return `
        <div style="padding-top: 10px; padding-bottom: 10px;" >
            <div class="overview-label">{{data.title}}<br>
            <span class="overview-content">
                <b>ID:</b> {{data.id}} 
            </span></div></div>`;
    }

    vm.getArchiveHeader = function(item)
    {
        if(item === 'zero conf')
            return 'Local Object Archive';
        else if(item.startsWith("user-"))
            return item.substring('user-'.length);
        else
            return item;
    }

    vm.gridOptions = {
        columnDefs: vm.initColumnDefs(),
        rowHeight: 75,
        groupUseEntireRow: true,
        rowSelection: 'multiple',
        angularCompileRows: true,
        rowMultiSelectWithClick: true,
        enableCellChangeFlash: true,
        enableCellTextSelection: true,
        ensureDomOrder: true,
        suppressRowClickSelection: true,
        domLayout: 'autoHeight',
        suppressHorizontalScroll: true,
        animateRows: true,
        onGridReady: function (params) {
            vm.gridOptions.api.sizeColumnsToFit();      
        },
        pagination: true,
        paginationPageSize: Number(vm.pageSize),
        paginationNumberFormatter: function (params) {
            return '[' + params.value.toLocaleString() + ']';
        },
    };

    // setup the grid after the page has finished loading
    document.addEventListener('DOMContentLoaded', function () {
        var gridDiv = document.querySelector('#myGrid');
        new agGrid.Grid(gridDiv, gridOptions);
        vm.gridOptions.api.sizeColumnsToFit();
    });
}];
