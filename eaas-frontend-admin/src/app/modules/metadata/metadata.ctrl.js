module.exports = ['$scope' , '$state', 'oaiHarvesterList', '$http', 'localConfig', 'growl', '$uibModal', 'apiKey',
    function($scope, $state, oaiHarvesterList, $http, localConfig, growl, $uibModal, apiKey) {

    var vm = this;

    vm.oaiHarvesterList = oaiHarvesterList.data;

    vm.apikey = apiKey.data.apikey;
    vm.sync = function(harvester)
    {
        console.log("sync " + harvester);
        var modal = $uibModal.open({
             animation: true,
             backdrop: 'static',
             template: require('./modals/wait.html')
        });
        $http.post(localConfig.data.oaipmhServiceBaseUrl + "harvesters/" +  harvester).then(function(response) {
            modal.close();
            $state.go('admin.standard-envs-overview', {}, {reload: true});
        },
        function(data) {
            modal.close();
            $state.go('error', {errorMsg: data});
        });
    }

     vm.syncFromDate = function(harvester, from)
        {
            console.log("sync " + harvester);
            var modal = $uibModal.open({
                 animation: true,
                 backdrop: 'static',
                 template: require('./modals/wait.html')
            });
            var date = new Date(from).toISOString();
            $http.post(localConfig.data.oaipmhServiceBaseUrl + "harvesters/" +  harvester + "?from=" + date).then(function(response) {
                modal.close();
                $state.go('admin.standard-envs-overview', {}, {reload: true});
            },
            function(data) {
                modal.close();
                $state.go('error', {errorMsg: data});
            });
        }

    vm._delete = function(harvester)
    {
        console.log("delete " + harvester);

        if (!window.confirm(`Please confirm deleting this harvester config?`))
            return false;

        $http.delete(localConfig.data.oaipmhServiceBaseUrl + "harvesters/" +  harvester).then(function(response) {
            growl.success("deleted harvester " + harvester);
            $state.go('admin.metadata', {}, {reload: true});
        });
    }

    vm.addEndpoint = function()
    {
        $uibModal.open({
            animation: true,
            template: require('./modals/addEndpoint.html'),
            controller: ["$scope", function($scope) {
                var _this = this;
                _this.success = false;
                this.confirmed = function()
                {
                    console.log(_this.providers);
                    var data = {};
                    data.name = _this.name;
                    data.streams = [];
                    _this.providers.forEach(function(p) {
                        // we only support images and environments
                        if(p === 'images' || p === 'environments' || p == 'software' ) {
                            var stream = {};
                            stream.source = {};
                            stream.source.url = _this.host + "/" + p;
                            stream.source.secret = _this.secret;
                            stream.sink = {}
                            stream.sink.base_url = localConfig.data.eaasBackendURL + "metadata-repositories/remote-" + p;
                            data.streams.push(stream);
                       }

                    });
                    console.log(data);
                    $http.post(localConfig.data.oaipmhServiceBaseUrl +  "harvesters/", data).then(function() {
                        $state.go('admin.metadata', {}, {reload: true});
                    });
                }

                this.resolve = function()
                {
                    $http.get(_this.host)
                      .then(function(response) {
                        _this.providers = response.data;
                        if(_this.providers.length >= 2)
                            _this.success = true;
                      });
                }
            }],
            controllerAs: "addEnvironmentCtrl"
        });
    }
}];
