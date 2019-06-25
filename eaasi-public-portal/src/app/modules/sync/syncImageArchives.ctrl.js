module.exports = ['$http', '$timeout',  '$state', '$stateParams', 'environmentList', 'objectEnvironmentList', 'localConfig', 'growl', '$translate', 'WizardHandler',
                   '$uibModal', 'helperFunctions' , 'REST_URLS',
                   function ($http, $timeout, $state, $stateParams, environmentList, objectEnvironmentList, localConfig, growl, $translate, WizardHandler, $uibModal, helperFunctions, REST_URLS) {
       var vm = this;
       vm.isObjectEnvironment = false;

       var setEnvList = function (localEnvironmentList, remoteEnvironmentList) {
           var envMap = {};

           localEnvironmentList.forEach(function (env) {

               env.isAvailableRemote = false; // init with false, may be switched, if found in remote
               env.upload = false;
               envMap[env.envId] = env;
           });

           remoteEnvironmentList.forEach(function (env) {
               if (envMap[env.envId]) {
                   envMap[env.envId].isAvailableRemote = true;
                   envMap[env.envId].upload = true;
               }
           });

           vm.envList = Object.keys(envMap).map(function(key) {
               return envMap[key];
           });
       };

       vm.fetchArchivesFromRemote = function (URI, type, remoteEnvironmentList) {
           if (!URI) {
               growl.error('Please enter a valid URI');
               return;
           }
           vm.uri = encodeURIComponent(URI);
           remoteEnvironmentList = $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getRemoteEnvsUrl, encodeURIComponent(URI), type)).then(function(response) {
               if(response.data.status == "0")
               {
                   if(type == "base")
                       setEnvList(environmentList.data.environments, response.data.environments);
                   else if(type == "object"){

                       setEnvList(objectEnvironmentList.data.environments, response.data.environments);
                       vm.isObjectEnvironment = true;
                       vm.objectImportType = "byRef";
                   }
                   WizardHandler.wizard().next();
               }
               else
               {
                   growl.error(response.data.message, {title: 'Error ' + response.data.status});
               }
           });
       };

       vm.isSyncing = false;
       vm.syncArchives = function (envs) {
           vm.isSyncing = true;
           growl.info($translate.instant('SYNC_START_INFO'));

           var uploads = new Array();
           for (var i = 0; i < envs.length; i++)
           {
               var e = envs[i];

               if(e.isAvailableRemote)
                   continue;
               if(!e.upload)
                   continue;

               uploads.push(e.envId);

           }


           vm.checkState = function(_taskId, _modal)
           {
              var taskInfo = $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getTaskState, _taskId)).then(function(response){
                   if(response.data.status == "0")
                   {
                       if(response.data.isDone)
                       {
                           _modal.close();
                           vm.isSyncing = false;
                           growl.success("upload finished.");
                       }
                       else
                           $timeout(function() {vm.checkState(_taskId, _modal);}, 2500);
                   }
                   else
                   {
                       _modal.close();
                       vm.isSyncing = false;
                   }
               });
           };

           var exportEmbedded = false;
           if(vm.objectImportType == "embedded")
               exportEmbedded = true;
           growl.info("starting sync ");
           $http({
               method: 'POST',
               url: localConfig.data.eaasBackendURL + "EmilEnvironmentData/exportToRemoteArchive",
               data: {
                   envId: uploads,
                   wsHost: vm.uri,
                   exportObjectEmbedded: exportEmbedded,
                   objectArchiveHost: vm.remoteObjectArchiveURI
               }}).then(function(response) {
               if(response.data.status == "0") {
                   var taskId = response.data.taskId;
                   modal = $uibModal.open({
                       animation: true,
                       template: require('./modals/wait.html')
                   });
                   vm.checkState(taskId, modal);
               }
           }, function(response) {
               console.log("error");
           });
       };
   }];