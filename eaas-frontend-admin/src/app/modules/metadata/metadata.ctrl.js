module.exports = ['$scope' , '$state', '$stateParams', 'oaiHarvesterList', '$translate', '$http', 'localConfig', 'growl', '$interval', 'helperFunctions', '$uibModal', 'REST_URLS',
    function($scope, $state, $stateParams, oaiHarvesterList, $translate, $http, localConfig, growl, $interval, helperFunctions, $uibModal, REST_URLS) {

    var vm = this;

    vm.oaiHarvesterList = [];
    if(oaiHarvesterList.data)
    {
        oaiHarvesterList.data.forEach(function(element){
            console.log(element);
            var names = element.split('-');
            console.log(names);
            if(vm.oaiHarvesterList.indexOf(names[0]) < 0)
                vm.oaiHarvesterList.push(names[0]);
        });
    }

    vm.sync = function(harvester)
    {
        console.log("sync " + harvester);
        var modal = $uibModal.open({
             animation: true,
             backdrop: 'static',
             template: require('./modals/wait.html')
        });
        $http.post(localConfig.data.oaipmhServiceBaseUrl + "harvesters/" +  harvester + "-images").then(function(response) {
            $http.post(localConfig.data.oaipmhServiceBaseUrl + "harvesters/" +  harvester + "-environments").then(function(response) {
                modal.close();
            });
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
                    _this.name = _this.name.replace("-", "_");
                    _this.providers.forEach(function(p) {
                        // we only support images and environments
                        if(p === 'images' || p === 'environments' ) {
                            var data = {};
                            data.name = _this.name + "-" + p;
                            data.source = {};
                            data.source.url = _this.host + "/" + p;
                            data.sink = {}
                            data.sink.base_url = localConfig.data.eaasBackendURL + "metadata-repositories/remote-" + p;
                            console.log(data);

                            $http.post(localConfig.data.oaipmhServiceBaseUrl +  "harvesters/", data).then(function() {
                                $state.go('admin.metadata', {}, {reload: true});
                            });
                       }
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
