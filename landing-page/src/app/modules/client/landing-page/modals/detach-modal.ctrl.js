module.exports = ['$state', '$http', '$scope', '$rootScope', '$uibModal', 'currentEnv' , 'eaasClient',
    function ($state, $http, $scope, $rootScope, $uibModal, curentEnv , eaasClient) {

        this.network = curentEnv.network;
        this.env = curentEnv;

        function formatStr(format) {
            var args = Array.prototype.slice.call(arguments, 1);
            return format.replace(/{(\d+)}/g, function (match, number) {
                return typeof args[number] != 'undefined' ? args[number] : match;
            });
        }

        this.showEmu = function() {
            $('#emulator-container').show();
        }

        this.detachTime;
        this.sessionName;
        this.componentName = eaasClient.componentId;
        this.detach = function () {
            if ($rootScope.emulator)
                $rootScope.emulator.detached = true;
            eaasClient.detach(this.sessionName, this.detachTime, this.componentName);
            $state.go('admin.networking', {});
        };
}];
