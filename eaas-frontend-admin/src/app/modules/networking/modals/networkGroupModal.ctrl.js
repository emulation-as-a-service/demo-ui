module.exports = ['$state', '$rootScope' ,'$http', '$scope', '$uibModalInstance', 'growl', 'groupId','groupName', 'session', 'Environments', 'localConfig', 'REST_URLS', 'helperFunctions',
    function ($state, $rootScope, $http, $scope, $uibModalInstance, growl,  groupId, groupName, session, Environments, localConfig, REST_URLS, helperFunctions) {
        console.log("session", session);
        $scope.groupId = groupId;
        $scope.groupComponents = [];
        $scope.networkInfo = null;
        $scope.groupName = groupName;
        $scope.session = session;

        $scope.session.sessionId = groupId;

        session.components.forEach(function(element){
            if(element.type === "machine" && element.environmentId) {
                element.metadata =  Environments.get({envId: element.environmentId});
                $scope.groupComponents.push(element);
            }
            if(element.type === "nodetcp"){
                $scope.networkInfo = element.networkData.networkUrls;
                console.log($scope.networkInfo)
            }
        });

        $scope.stopEmulator = function(id){
            $("#loding-modal").attr("hidden", false);
            $("#session-accordion").hide();
            $.ajax({
                type: "DELETE",
                url: localConfig.data.eaasBackendURL + "sessions/" + groupId + "/resources",
                headers: localStorage.getItem('id_token') ? {"Authorization" : "Bearer " + localStorage.getItem('id_token')} : {},
                async: true,
                contentType: "application/json",
                data: JSON.stringify([id])
            }).then(function (data, status, xhr) {
                console.log(data, status, xhr);
                $uibModalInstance.close();
                growl.success("Emulator has stopped!");
                $state.go("admin.networking", {}, {reload: true});
            })
        };
        
        $scope.attach = function(session, componentId, environmentId){
            $uibModalInstance.close();
            $state.go('admin.emulator', {envId: environmentId, componentId: componentId, session: session}, {reload: true});
        }
    }];