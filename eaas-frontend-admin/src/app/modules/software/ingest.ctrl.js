module.exports = ["$stateParams", "$state", "$http", "localConfig", "growl", "objectList", "softwareObj", "osList", "REST_URLS",
function ($stateParams, $state, $http, localConfig, growl, objectList, softwareObj, osList, REST_URLS) {
      var vm = this;

      vm.isNewSoftware = $stateParams.swId === "-1";

      if (vm.isNewSoftware) {
          vm.selectedObject = null;
          vm.objectList = objectList.data.objects;
      } else {
          vm.selectedObject = {id: $stateParams.swId, title: $stateParams.swId};
          vm.objectList = [vm.selectedObject];
      }
      vm.osList = osList;
    //   console.log(vm.osList);

      vm.softwareObj = softwareObj.data;

      vm.save = function() {
          if("softwareArchiveId" in localConfig.data)
               vm.softwareObj.archiveId = localConfig.data.softwareArchiveId;

          vm.softwareObj.objectId = vm.selectedObject.id;
          vm.softwareObj.label = vm.selectedObject.title;
          vm.softwareObj.qid = vm.selectedObject.qid;

          if(vm.softwareObj.isOperatingSystem && vm.operatingSystemId)
          {
              vm.operatingSystemId.puids.forEach(function(puid) {
                 if(!vm.softwareObj.nativeFMTs.includes(puid.puid))
                 {
                     vm.softwareObj.nativeFMTs.push(puid.puid);
                 }
              });

          }
          // console.log(JSON.stringify(vm.softwareObj));
          $http.post(localConfig.data.eaasBackendURL + REST_URLS.saveSoftwareUrl, vm.softwareObj).then(function(response) {
              if (response.data.status === "0") {
                  growl.success(response.data.message);
                  $state.go('admin.sw-overview', {}, {reload: true});

              } else {
                  growl.error(response.data.message, {title: 'Error ' + response.data.status});
              }
          });
      };
}];