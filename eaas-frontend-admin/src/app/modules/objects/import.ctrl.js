module.exports = ["$http", "$scope", "$state", "$stateParams", "growl", "localConfig", "$timeout", "helperFunctions", "Upload", "REST_URLS", "$uibModal", "repositoriesList",
    function($http, $scope, $state, $stateParams, growl, localConfig, $timeout, helperFunctions, Upload, REST_URLS, $uibModal, repositoriesList) {

       var vm = this;

       vm.importRequest = {
          objectIDs : [],
          archive: null
       };

       var mediaTypes = {
        "Q495265" : "ISO",
        "Q493576" : "Floppy",
        "Q82753" : "Files",
        "Q633454" : "ROM Cartridge"
        };

        $scope.getMediaTypeLabel = function(t)
        {
            console.log(mediaTypes[t]);
            return mediaTypes[t];
        }

       vm.repositories = repositoriesList.data.archives;
       vm.selectedFiles = [];

       vm.add = function(file, mediaType)
       {
           let objectFile = {
               file: file,
               mediaType: mediaType
           }
           vm.selectedFiles.push(objectFile);

           console.log(vm.selectedFiles);
       };

       vm.removeFile = function(index)
       {
           vm.selectedFiles.splice(index);
       }

       vm.openFileModal = function() {
            $uibModal.open({
                animation: true,
                template: require('./modals/add-file-dialog.html'),
                controller: ["$scope", function($scope) {
                    this.select = function() 
                    {
                        console.log(this.selectedFile);
                        console.log(this.mediumType);
                    }

                    this.add = function()
                    {
                        vm.add(this.selectedFile, this.mediumType);
                    } 
                }],
                controllerAs: "selectFileModalCtrl"
            });
        };
       

       vm.checkState = function(_taskId, _modal)
       {
            var taskInfo = $http.get(localConfig.data.eaasBackendURL +
            helperFunctions.formatStr(REST_URLS.getObjectImportTaskState, _taskId)).then(function(response){
                if(response.data.status == "0")
                {
                    if(response.data.isDone)
                    {
                        _modal.close();
                        growl.success("import finished.");
                        $state.go('admin.object-overview', {}, {reload: true});
                    }
                    else
                        $timeout(function() {vm.checkState(_taskId, _modal);}, 2500);
                }
                else
                {
                    _modal.close();
                    $state.go('error', {errorMsg: {title: "Object import failed"}});
                }
            });
       };


       vm.checkImportState = function(_taskId, _modal)
       {
            let taskInfo = $http.get(localConfig.data.eaasBackendURL + `tasks/${_taskId}`).then(function(response){
                if(response.data.status == "0")
                {
                    if(response.data.isDone)
                    {
                        _modal.close();
                        growl.success("import finished.");
                        $state.go('admin.object-overview', {}, {reload: true});
                    }
                    else
                        $timeout(function() {vm.checkImportState(_taskId, _modal);}, 2500);
                }
                else
                {
                    $state.go('error', {errorMsg: {title: "Object import failed"}});
                    _modal.close();
                }
            });
       };

       vm.import = function()
       {
           vm.importRequest.archive = vm.selectedArchive;

           console.log(vm.importRequest);

           $http.post(localConfig.data.eaasBackendURL + REST_URLS.syncObjectsUrl, vm.importRequest).then(function(response) {
              if(response.data.status == "0") {
                  var taskId = response.data.taskId;
                  var modal = $uibModal.open({
                       animation: true,
                       template: require('./modals/wait.html'),
                       controller : ["$scope", function($scope) {
                           this.info = {};

                           this.info.title = "Objekt Synchronisation";
                           this.info.msg = "Objekte werden importiert. Dieser Vorgang kann einige Minuten dauern.";
                       }],
                       controllerAs: "waitMsgCtrl"
                   });
                   vm.checkState(taskId, modal);
               }
               else
               {
                   growl.error(response.data.message, {title: 'Error ' + response.data.status});
               }
           }, function(response) {
               console.log("error");
           });
       }

        vm.importMetaData = function(modal, metaData)
        {
            $http.post(localConfig.data.eaasBackendURL + "/objects/import", {
                label: vm.objectLabel,
                files: metaData.files
            }).then(function(response) {
                vm.checkImportState(response.data.taskId, modal);
            }, function(error) {
                modal.close();

            });
            
        }

       vm.upload = function()
       {
           var uploadInfo = {
               title : "uploading ",
               msg : "please wait"
           };

           var modal = $uibModal.open({
               animation: true,
               template: require('./modals/wait.html'),
               controller: ["$scope", function($scope) {
                   this.info = uploadInfo;
               }],
               controllerAs: "waitMsgCtrl"
           });

           let objectMetaData = {
               files: [],
           };

           if (vm.selectedFiles && vm.selectedFiles.length) {
               var uploadCnt = 0;
               for (var i = 0; i < vm.selectedFiles.length; i++) {
                 uploadCnt++;

                 const sparams = new URLSearchParams({
                   'filename': vm.selectedFiles[i].file.name,
                 });

                 Upload.http({
                   url: localConfig.data.eaasBackendURL + "upload?" + sparams,
                   headers : {
                     'content-type': "application/octet-stream",
                   },
                   data: vm.selectedFiles[i].file
                   })
                     .then(function (resp) {
                         console.log("Response", resp);
                         console.log('Success ' + resp.config.data.name + 'uploaded. Response: ' + resp.data.userDataUrl);
                         uploadCnt--;
                         let deviceId =  vm.selectedFiles.find(x => x.file.name === resp.config.data.name).mediaType;
                         let fileInfo = { 
                             filename: resp.config.data.name,
                             url: resp.data.uploads[0], 
                             deviceId: deviceId, 
                            };
                         objectMetaData.files.push(fileInfo);
                         if(uploadCnt === 0) {
                            vm.importMetaData(modal, objectMetaData);
                         }
                     }, function (resp) {
                         console.log('Error status: ' + resp.status);
                         modal.close();
                         $state.go('error', {errorMsg: {title: "Load Environments Error " + resp.load.data.status, message: resp.load.data.message}});
                     }, function (evt) {
                         console.log("EVT:", evt)
                         var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                         console.log('progress: ' + progressPercentage + '% ' + evt.config.data.name);
                         uploadInfo.title = "Uploading Object(s) " + evt.config.data.name;
                         uploadInfo.msg = 'upload: ' + evt.config.data.name + ' (' + progressPercentage + '%)';
                     });
               }
           }

        }
}];
