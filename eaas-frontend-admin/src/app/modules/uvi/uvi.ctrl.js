import {UviMachineComponentBuilder} from "EaasClient/lib/componentBuilder.js";

module.exports = ["$http", "$state", "localConfig", "$timeout", "Upload", "$uibModal", "EaasClientHelper",
    function($http, $state,  localConfig, $timeout, Upload, $uibModal, EaasClientHelper) {

        var vm = this;
        vm.classificationFinished = false;
        vm.classificationFailed = false;
        vm.environmentList = [];
        
        /* addional files to be uploaded */
        vm.selectedFiles = [];

        /* additional files: url / filename pairs */
        vm.auxFiles = [];

        vm.start = async function (envId) {

            let uvi = {
                url: vm.url,
                filename: vm.filename,
                writeable: vm.writeable,
                environments: vm.environmentList,
                auxFiles: vm.auxFiles
            };
            let uviMachine = new UviMachineComponentBuilder(uvi, envId);

            let components = [uviMachine];
            let clientOptions = await EaasClientHelper.clientOptions(envId);

           //  enableDownload: vm.writeable,

            $state.go("admin.emuView",  {
                components: components,
                clientOptions: clientOptions
            }, {});
        };

        vm.checkState = function(_taskId, _modal, url, filename)
        {
           $http.get(localConfig.data.eaasBackendURL + `tasks/${_taskId}`).then(function(response){
               if(response.data.status == "0")
               {
                   if(response.data.isDone)
                   {
                       _modal.close();
                       if(response.data.object) {
                           console.log(response);
                            let classificationResult = JSON.parse(response.data.object);
                            console.log(classificationResult);
                            if(!classificationResult.environmentList || classificationResult.environmentList.length === 0)
                            {
                                console.log("no environmemnt found");
                                vm.classificationFailed = true;
                            }
                            else
                            {
                                vm.selectedEnvironment = classificationResult.environmentList[0].label;
                                vm.selectedEnvironmentId = classificationResult.environmentList[0].id;
                                vm.environmentList = classificationResult.environmentList;
                            }
                            
                            vm.classificationFinished = true;
                           
                            if(classificationResult.fileFormatMap) {
                                let objectId = classificationResult.objectId;
                                if(objectId) {
                                    let ffmts = classificationResult.fileFormatMap[objectId];
                                    if(ffmts && ffmts.fileFormats && ffmts.fileFormats.length > 0)
                                    {
                                        vm.fileFormat = ffmts.fileFormats[0].puid;
                                        vm.fileFormatLabel = ffmts.fileFormats[0].name;
                                    }
                                } 
                            }
                            vm.filename = filename;
                            vm.url = url;
                       }
                   }
                   else
                       $timeout(function() {vm.checkState(_taskId, _modal, url, filename);}, 2500);
               }
               else
               {
                   console.log(response);
                   _modal.close();
               }
           });
       };

    vm.runUVI = function(modal, url, filename)
    {
        $http.post(localConfig.data.eaasBackendURL + `classification` , {
            url: url,
            filename: filename
            }).then(function(response) {
                vm.checkState(response.data.taskId, modal, url, filename);
            }, function(error) {
                console.log(error);
                modal.close();
        });
    }

    vm.add = function(file)
    {
        let objectFile = {
            file: file,
        }
        vm.selectedFiles.push(objectFile);
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
                this.add = function()
                {
                    vm.add(this.selectedFile, this.mediumType);
                } 
            }],
            controllerAs: "selectFileModalCtrl"
        });
    };

    vm.uploadJob = function(_filename, _uploadInfo)
    {
        let promise = new Promise(function(resolve, reject) {
            const sparams = new URLSearchParams({
                'filename': _filename.name,
            });

            Upload.http({
                url: localConfig.data.eaasBackendURL + "upload?" + sparams,
                data: _filename,
                headers : {
                    'content-type': "application/octet-stream",
                },
            })
                .then(function (resp) {
                    let fileInfo = {
                        filename: resp.config.data.name,
                        url: resp.data.uploads[0],
                    }
                    resolve(fileInfo);
                    console.log('Success uploaded. Response: ' + resp.data.userDataUrl);
                }, function (resp) {
                    reject(Error(resp));
                }, function (evt) {
                    if(_uploadInfo) {
                        var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                        _uploadInfo.title = "Uploading Object(s) " + evt.config.data.name;
                        _uploadInfo.msg = 'upload: ' + evt.config.data.name + ' (' + progressPercentage + '%)';
                    }       
                }
                );
        });
        return promise;
    }

    vm.upload = async function()
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
        
        try { 
            let uploadFile = await vm.uploadJob(vm.selectedFile, uploadInfo);
            
            for(let element of vm.selectedFiles) {
                let uploadJob = await vm.uploadJob(element.file, uploadInfo);
                vm.auxFiles.push(uploadJob);
            }
            vm.runUVI(modal, uploadFile.url, uploadFile.filename);
        }
        catch(error)
        {
            console.log(error);
            modal.close();
            $state.go('error', {errorMsg: {title: "Upload Error " , message: ""}});
        }
    } 
}];
