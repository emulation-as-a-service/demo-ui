module.exports = ["$uibModal","$scope", "$state", "localConfig", "kbLayouts", "buildInfo", "userInfo", "authService",
function($uibModal, $scope, $state, localConfig, kbLayouts, buildInfo, userInfo, authService) {
    var vm = this;

    $scope.isCollapsed = $state.current.name === "admin.emulator";

    vm.authEnabled = auth0config.AUTH_CONFIGURED;
    
    vm.open = function() {
        $uibModal.open({
            animation: false,
            template: require('./modals/help.html')
        });
    };

    vm.config = localConfig.data;
    vm.buildInfo = buildInfo.data.version;
    vm.uiCommitHash = __UI_COMMIT_HASH__;
    vm.userInfo = userInfo.data;

    vm.showSettingsDialog = function() {
        $uibModal.open({
            animation: false,
            template: require('./modals/settings.html'),
            resolve: {
                localConfig: function () {
                    return localConfig;
                },
                kbLayouts: function () {
                    return kbLayouts;
                }
            },
            controller: "SettingsDialogController as settingsDialogCtrl"
        });
    };

    vm.logout = function()
    {
        authService.logout();
    };

    vm.showAdvancedDialog = function() {
        $uibModal.open({
            animation: false,
            template: require('./modals/advancedDialog.html'),
            resolve: {
                localConfig: function () {
                    return localConfig;
                },
                kbLayouts: function () {
                    return kbLayouts;
                }
            },
            controller: "AdvancedDialogController as advancedDialogCtrl"
        });
    };
}];
