module.exports = ['$scope', '$window', '$state', '$http', '$stateParams', function ($scope, $window, $state, $http, $stateParams) {
    var vm = this;

    vm.abort = function () {
        console.log("aborting container...");
        $state.go('admin.standard-envs-overview', {showContainers: true, showObjects: false}, {reload: true});
    };
}];