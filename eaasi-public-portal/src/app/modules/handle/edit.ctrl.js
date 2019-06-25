module.exports = ['$state', '$scope', '$stateParams', '$http', 'handleValue', 'localConfig', 'helperFunctions', 'REST_URLS' , function($state, $scope, $stateParams, $http, handleValue, localConfig, helperFunctions, REST_URLS) {
     $("#newHandleValue").hide();
     $("#editHandleValue").hide();
     var vm = this;
     vm.handleValue = handleValue.data.values[0];
     vm.handle = $stateParams.handle;

     vm.deleteHandle = function () {
         jQuery.when(
             $http.delete(localConfig.data.eaasBackendURL + REST_URLS.deleteHandle + $stateParams.handle)).done(
             function () {
                 $state.go('admin.handles', {reload: true});
             })
     };

     vm.showHandleValue = function () {
         $("#newHandleValue").show();
         $("#editHandleValue").show();
         $("#showHandleValue").hide();
     };

     vm.editHandle = function () {
         jQuery.when(
             $http.post(localConfig.data.eaasBackendURL + REST_URLS.postHandleValue + $stateParams.handle, {
                 handle: $stateParams.handle,
                 value: document.getElementById("newHandleValue").value
             }),
             vm.handleValue = $stateParams.handle
         ).done(function () {
             $state.go('admin.edit-handle', $stateParams, {reload: true})
         });
     };
 }];