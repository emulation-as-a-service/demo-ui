module.exports = ['$scope' , '$state', '$stateParams', 'oaiHarvesterList', '$translate', '$http', 'localConfig', 'growl', '$interval', 'helperFunctions', 'REST_URLS',
    function($scope, $state, $stateParams, oaiHarvesterList, $translate, $http, localConfig, growl, $interval, helperFunctions, REST_URLS) {

    var vm = this;
    vm.oaiHarvesterList = oaiHarvesterList.data;

    vm.sync = function(harvester)
    {
        console.log("sync " + harvester);
        $http.post(localConfig.data.oaipmhServiceBaseUrl + "harvesters/" +  harvester).then(function(response) {
           $http.post(localConfig.data.initEmilEnvironmentsURL).then(function response) {
               console.log(response.data);
           });
        });
    }
}];
