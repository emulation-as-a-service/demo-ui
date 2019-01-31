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
        });
    }

    vm.addEndpoint = function()
    {
        $uibModal.open({
            animation: true,
            template: require('./modals/addEndpoint.html'),
            controller: ["$scope", function($scope) {
                this.confirmed = function(p)
                {
                    var data = {};
                    data.name = this.name;
                    data.source = {};
                    data.source.url = this.host + "/" + p;
                    data.sink = {}
                    data.sink.base_url = localConfig.data.eaasBackendURL + "metadata-repositories/remote";
                    console.log(data);

                    $http.post(localConfig.data.oaipmhServiceBaseUrl +  "harvesters/", data).then(function() {
                        $state.go('admin.metadata', {}, {reload: true});
                    });
                }

                var _this = this;
                this.resolve = function()
                {
                    $http.get(_this.host)
                      .then(function(response) {
                        _this.providers = response.data;
                        console.log(_this.providers);
                      });
                }
            }],
            controllerAs: "addEnvironmentCtrl"
        });
    }
}];
