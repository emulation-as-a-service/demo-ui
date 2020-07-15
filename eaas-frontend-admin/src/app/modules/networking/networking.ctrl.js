module.exports = ['$state', '$scope', '$uibModal', 'localConfig', 'REST_URLS', '$http', 'Environments', "$translate", "growl", "EmilNetworkEnvironments", 
    function ($state, $scope, $uibModal, localConfig, REST_URLS, $http, Environments, $translate, growl, EmilNetworkEnvironments) {
   
    var vm = this;
    vm.landingPage = localConfig.data.landingPage;
    vm.pageSize = "25";
    vm.config = localConfig.data;

    $scope.onPageSizeChanged = function () {
       vm.gridOptions.api.paginationSetPageSize(Number(vm.pageSize));
    };

    vm.initColumnDefs = function () {
        let rowdef =  [
            {headerName: "ID", field: "id", width: 150},            
        ];

        if(vm.view === "0") {
            rowdef.push({headerName: "Machines", field: "name", 
                sort: "asc", 
                cellRenderer: machineEntryRenderer, 
                autoHeight: true, flex: 1});
        }
        else {
            rowdef.push({headerName: "Name", field: "name", flex: 1});
        }
        rowdef.push({
            headerName: "", field: "actions", cellRenderer: connectBtnRenderer, suppressSorting: true,
            suppressMenu: true, width: 150
        });
        return rowdef;
    };

    function machineEntryRenderer()
    {
        return `
        <div style="padding-top: 10px; padding-bottom: 10px;" >
        <div class="overview-label">{{data.name}}<br>
            <span class="overview-content">
                <b>ID: </b> {{data.id}} &nbsp; 
                <b>Last Change: </b> {{data.timestamp}}<p>
                <b>Notes: </b> <span ng-bind-html="data.description"></span>
            </span></div></div>`;
    }

    function connectBtnRenderer(params) {
        params.$scope.connect = connect;
        params.$scope.deleteSession = deleteSession;
        params.$scope.openLandingPage = openLandingPage;
        params.$scope.connectEnv = connectEnv;
        params.$scope.run = run;
        params.$scope.deleteNetwork = deleteNetwork;
        params.$scope.edit = edit;
        params.$scope.landingPage = vm.landingPage;
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
                <button id="single-button{{data.id}}" type="button" 
                    ng-class="changeClass(data.id)" 
                    uib-dropdown-toggle ng-disabled="disabled">
                    {{'CHOOSE_ACTION'| translate}} <span class="caret"></span>
                </button>
                
                <ul class="dropdown-menu" 
                    id="dropdowm{{data.id}}" 
                    uib-dropdown-menu role="menu" 
                    aria-labelledby="single-button">

                    <li ng-if="data.archive !='remote'" role="menuitem dropdown-content">
                        <a class="dropdown-content" ng-click="run(data.id)">
                            run
                        </a>
                    </li>
                    <li role="menuitem">
                        <a class="dropdown-content" ng-click="edit(data.id)">
                            details 
                        </a>
                    </li>
                    <li role="menuitem">
                        <a ng-if="data.archive == 'default'" class="dropdown-content" ng-click="deleteNetwork(data.id)">
                            {{'CHOOSE_ENV_DEL'| translate}}
                        </a>
                    </li>
                </ul>
                </div>`;

        let activeNetworksRenderer = `<div class="btn-group" uib-dropdown dropdown-append-to-body>
                    
                    <button id="single-button{{data.id}}" type="button" ng-class="changeClass(data.id)" uib-dropdown-toggle ng-disabled="disabled">
                      {{'CHOOSE_ACTION'| translate}} <span class="caret"></span>
                    </button>
                    
                    <ul class="dropdown-menu" id="dropdowm{{data.id}}" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                        <li role="menuitem">
                              <a ng-click="connect(data.id)"  class="dropdown-content">Connect</a>           
                        </li>
                        <li role="menuitem">
                              <a ng-click="deleteSession(data.id)"  class="dropdown-content">Delete</a>           
                        </li>
                        <!-- <li role="menuitem" ng-if="landingPage">
                              <a ng-click="openLandingPage(data.id)"  class="dropdown-content">Landing Page</a>           
                        </li> -->
                        <li role="menuitem" ng-if="landingPage">
                              <a ng-click="connectEnv(data.id)"  class="dropdown-content">Connect Environment</a>           
                        </li>
                    </ul>
                </div>`;
        if (vm.view === 1)
            return activeNetworksRenderer;
        else
            return environmentRenderer;
    }

    function deleteNetwork(envId, isConfirmed) {
        let confirmationResult = null;
        if (typeof isConfirmed != "undefined")
            confirmationResult = isConfirmed;
        else {
            confirmationResult = window.confirm($translate.instant('JS_DELENV_OK'));
        }

        if (!confirmationResult) 
            return;
        
        let promise = null;
        promise = EmilNetworkEnvironments.delete({envId: envId}).$promise;        
        promise.then( (response) => {
            console.log(response.data);

            if (response.data.status === "0" || response.data.status === 0) {
                // remove env locally
                vm.envs = vm.envs.filter(function (env) {
                    return env.envId !== envId;
                });
                growl.success($translate.instant('JS_DELENV_SUCCESS'));
                $state.go('admin.networking', {}, {reload: true});
            } else {
                growl.error(response.data.message, {title: 'Error ' + response.data.status});
                $state.go('admin.networking', {}, {reload: true});
            }
        });
    }

    function run (id) {
        var env = {};
        for (let i = 0; i < vm.envs.length; i++) {
            if (id == vm.envs[i].envId) {
                env = vm.envs[i];
                break;
            }
        }
        if (typeof env.envId == "undefined")
            $state.go('error', {errorMsg: {title: "Error ", message: "given envId: " + id + " is not found!"}});
        $state.go('admin.emulator', {envId: env.envId, isNetworkEnvironment: true}, {reload: true});
    }

    function edit(id) {
        const env = vm.envs.find((env) => {
            if (env.envId === id) {
                return env;
            }
        });
        $state.go('admin.edit-network-environment', {selectedNetworkEnvironment: env});
    }

    function connect(id) {
        $http.get(localConfig.data.eaasBackendURL + "sessions/" + id).then((response) => {
            response.data.sessionId = id;
            //temporary, until we define which environment we want to visualize first
            const envIdToInitialize = response.data.components.find(e => {return e.type === "machine"}).environmentId;
            const componentId = response.data.components.find(e => {return e.type === "machine"}).componentId;
            $state.go('admin.emulator', {envId: envIdToInitialize, componentId: componentId, session: response.data}, {reload: true});
        })
    }

    function openLandingPage(id) {
        window.open(vm.landingPage + "?sessionId=" + id + "#!/attach-landing-page")
    }
    
    function connectEnv(id) {
        Environments.query().$promise.then((emilEnvs) =>{

            if (emilEnvs.filter(env => env.networkEnabled === true).length === 0) {
                growl.error($translate.instant('NO_ENVIRONMENTS_WITH_NETWORK'));
                $state.go("admin.networking", {}, {reload: true});
            } else
                $uibModal.open({
                    animation: true,
                    template: require('./modals/connectEnvToNetwork.html'),
                    resolve: {
                        localConfig: function () {
                            return localConfig;
                        },
                        environments : () => emilEnvs,
                        sessionId: () => id,
                    },
                    controller: "NetworkGroupManagerCtrl as $ctrl"
                });
        })
    }

    function deleteSession(id) {
        $http.delete(localConfig.data.eaasBackendURL + "sessions/" + id).then((response) => {
            console.log(response);
            $state.go('admin.networking', {}, {reload: true});
        })
    }

    function updateTableData(rowData){
        vm.rowCount = rowData.length;
        vm.gridOptions.api.setRowData(rowData);
        vm.gridOptions.api.setColumnDefs(vm.initColumnDefs());
        vm.gridOptions.api.sizeColumnsToFit();
    }

    vm.updateTable = function(index)
    {
        vm.gridOptions.api.setRowData(null);
        vm.view = index;
        if (vm.view === 0) {
            let rowData = [];
            EmilNetworkEnvironments.query().$promise.then(function (response) {
                vm.viewArchive = 1;
                vm.envs = response;
                vm.envs.forEach((element) => {
                    rowData.push({
                        name: element.title,
                        id: element.envId,
                    })
                });
                updateTableData(rowData);
            });
        }
        else {
            $http.get(localConfig.data.eaasBackendURL + REST_URLS.getGroupIds).then(function (response) {
                vm.groupdIds = response.data;
                updateTableData(response.data);
            });
        }
    };

    vm.gridOptions = {
        columnDefs: vm.initColumnDefs(),
        rowData: null,
        rowHeight: 75,
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
            vm.updateTable(0);
            vm.gridOptions.api.redrawRows();
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
        new agGrid.Grid(gridDiv, vm.gridOptions);
        vm.gridOptions.api.sizeColumnsToFit();
    });

}];
