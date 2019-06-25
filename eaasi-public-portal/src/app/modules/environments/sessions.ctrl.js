module.exports = ['$scope' , '$state', '$stateParams', 'sessionList', '$translate', '$http', 'localConfig', 'growl', '$interval', 'helperFunctions', 'REST_URLS', function($scope, $state, $stateParams, sessionList, $translate, $http, localConfig, growl, $interval, helperFunctions, REST_URLS) {
    var vm = this;
    vm.sessionList = sessionList.data.environments;
    console.log(vm.sessionList);

    vm.deleteSession = function(_envId)
    {
        if (window.confirm($translate.instant('JS_DELENV_OK'))) {
            console.log(_envId);
            $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.deleteSessionUrl, _envId))
            .then(function(response) {
                if (response.data.status === "0") {
                    growl.success($translate.instant('JS_DELENV_SUCCESS'));
                    $state.go('admin.user-session-overview', {});
                } else {
                    growl.error(response.data.message, {title: 'Error ' + response.data.status});
                    $state.go('admin.user-session-overview', {});
                }
            });
        }
    };

    var theInterval = $interval(function(){
        $state.reload();
    }.bind(this), 10000);

    $scope.$on('$destroy', function () {
        $interval.cancel(theInterval)
    });
}];