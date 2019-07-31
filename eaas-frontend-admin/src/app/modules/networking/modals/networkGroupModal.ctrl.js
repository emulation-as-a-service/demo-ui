module.exports = ['$state', '$rootScope' ,'$http', '$scope', '$uibModalInstance', 'growl', 'groupId','groupName', 'groupComponents', 'environments', 'localConfig', 'REST_URLS', 'helperFunctions',
    function ($state, $rootScope, $http, $scope, $uibModalInstance, growl,  groupId, groupName, groupComponents, environments, localConfig, REST_URLS, helperFunctions) {
        console.log("groupEnvs", groupComponents);
        $scope.groupId = groupId;
        $scope.groupComponents = [];
        $scope.networkInfo = null;
        $scope.groupName = groupName;

        var modalCtrl = this;

        groupComponents.forEach(function(element){
            if(element.type === "machine")
                $scope.groupComponents.push(element);
            if(element.type === "nodetcp"){
                $scope.networkInfo = element.networkData.networkUrls;
                console.log($scope.networkInfo)
            }
        });

        $scope.getTitle = function(id)
        {
                return environments.find(element => element.envId === id).title;
        };

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
        
        $scope.attach = function(id){
            $uibModalInstance.close();
            $state.go('admin.emulator', {envId: id, isStarted: true, isDetached: true, networkInfo: $scope.networkInfo}, {reload: true});
        }
    }];