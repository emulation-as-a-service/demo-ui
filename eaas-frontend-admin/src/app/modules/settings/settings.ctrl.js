import {_fetch} from '../../lib/utils'
import {WaitModal} from '../../lib/task.js';

module.exports = ['$state', '$http', '$scope',  'localConfig', '$uibModal', 'kbLayouts', 'REST_URLS', 'userInfo',
    function ($state, $http, $scope, localConfig, $uibModal, kbLayouts, REST_URLS, userInfo) {

        var vm = this;

        if(localConfig.data.auth0Config) {
            vm.oidcClientId = localConfig.data.auth0Config.CLIENT_ID;
            vm.oidcIssuer = localConfig.data.auth0Config.issuer;
        }
            
        vm.userInfo = userInfo.data;
        if(!vm.userInfo || !vm.userInfo.role)
           vm.isAdmin = true;
        else
           vm.isAdmin = false;

        if(vm.userInfo && vm.userInfo.role === 'ADMIN')
            vm.isAdmin = true;

        async function executeSyncAction(subresource) {
            const token = localStorage.getItem('id_token');
            const result = await _fetch(localConfig.data.eaasBackendURL + subresource, "POST", null, token);
            if (result.status !== "0") {
                $state.go('error', {});
            }
        };

        vm.showSetKeyboardLayoutDialog = function () {
            $uibModal.open({
                animation: true,
                template: require('./modals/set-keyboard-layout.html'),
                resolve: {
                    kbLayouts: function () {
                        return kbLayouts; // refers to outer kbLayouts variable
                    }
                },
                controller: "SetKeyboardLayoutDialogController as setKeyboardLayoutDialogCtrl"
            });
        };

        vm.syncArchives = async function () {
            const modal = new WaitModal($uibModal);
            modal.show("Synchronizing archives", "Please wait");
            try {
                await executeSyncAction(REST_URLS.syncImagesUrl);
                await executeSyncAction(REST_URLS.syncObjectsUrl);
                await executeSyncAction(REST_URLS.syncSoftwareUrl);
                $state.go('admin.standard-envs-overview', {}, {reload: true});
            }
            catch(e) {
                console.log(e);
                $state.go('error', {});
            }
            finally {
                modal.hide();
            }
        };

        vm.migrateDb = async function () {
            try {
                let result = await _fetch(`${localConfig.data.eaasBackendURL}/environment-repository/db-migration`, "GET", 
                    null, localStorage.getItem('id_token'));
                console.log(result);
            }
            catch(e) {
                console.log(e);
                $state.go('error', {});
            }
        };

        vm.downloadLogUrl = localConfig.data.eaasBackendURL + "error-report";
    }
];
 
