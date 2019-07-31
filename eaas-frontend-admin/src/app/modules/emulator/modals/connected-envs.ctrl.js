module.exports = ["$scope", "$uibModalInstance", "$uibModalStack", "sessionIds", "environments",
     function ($scope, $uibModalInstance, $uibModalStack, sessionIds, environments) {
         $scope.availableGroupIds = sessionIds.data;
         $scope.envs = [];

         var vm = this;
         vm.environments = environments;

         environments.forEach(function (env) {
             // console.log(env);

             if (env.networkEnabled)
                  $scope.envs.push(env);
         });

         $scope.selected = [];
         $scope.attachComponentId = null;

         $scope.ok = function () {
             $scope.isModuleVisible = false;

              var data = {
                  selected: $scope.selected
               }
              let containerEnvs = $scope.selected.filter(env => (env.envType === "container"));
                if (containerEnvs.length > 0) {
                 getNetworkingDataForContainers(containerEnvs).then(function () {
                      $uibModalInstance.close(data);
                      $uibModalStack.dismissAll();
                 })
                }
               $uibModalInstance.close(data);
               $uibModalStack.dismissAll();
         };

         async function getNetworkingDataForContainers(containerEnvs) {
             for (let i = 0; i < containerEnvs.length; i++) {
                 await Environments.get({envId: containerEnvs[i].envId}).$promise.then(function (response) {
                     containerEnvs[i].networking = response.networking;
                     containerEnvs[i].runtimeId = response.runtimeId;
                     containerEnvs[i].input_data = [];
                     let input = {};
                     input.size_mb = 512;
                     input.destination = containerEnvs[i].input;
                     //TODO implement input data for connected containers
                     input.content = [];
                     containerEnvs[i].input_data.push(input);
                 })
             }

         }

         $scope.connectToExistentComponent = function () {
            //  console.log("$scope.attachComponentId", $scope.attachComponentId);
            var data = {
                selected: $scope.selected,
                attachComponentId: $scope.attachComponentId.id
            };
            $uibModalInstance.close(data);
            $uibModalStack.dismissAll();

//             jQuery.when(
//                 ,
//                 jQuery.Deferred(function (deferred) {
//                     jQuery(deferred.resolve);
//                 })).done(function () {
//                 // vm.runEmulator($scope.selected, $scope.attachComponentId.id);
//             });
         };

         $scope.cancel = function () {
             $uibModalInstance.dismiss('cancel');
             $uibModalStack.dismissAll();
         };

         $scope.OnClickSelect = function (item) {
            //  console.log("got item! " + item.envId);
             $scope.selected.push(item)
         };

         $scope.OnRemoveSelect = function (item) {
             var index = $scope.selected.indexOf(item);
             $scope.selected.splice(index, 1);
         };
         $scope.OnClickSelectAttachID = function (item) {
             $scope.attachComponentId = item;
         };

         $scope.OnRemoveSelectAttachID = function (item) {
             delete $scope.attachComponentId
         }
 }];