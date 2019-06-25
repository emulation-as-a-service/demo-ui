module.exports = ['$scope' , '$state', '$stateParams', 'oaiHarvesterList', '$translate', '$http', 'localConfig', 'growl', '$interval', 'helperFunctions', '$uibModal', 'REST_URLS',
    function($scope, $state, $stateParams, oaiHarvesterList, $translate, $http, localConfig, growl, $interval, helperFunctions, $uibModal, REST_URLS) {

    var vm = this;

    vm.oaiHarvesterList = oaiHarvesterList.data;
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
