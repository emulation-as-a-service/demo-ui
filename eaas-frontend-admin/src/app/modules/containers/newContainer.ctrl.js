import {WaitModal, Task} from "../../lib/task.js";
import { 
    ContainerImageBuilder,
    ContainerBuilder
 } from "../../lib/containerBuilder.js";

module.exports = ['$http', '$state', 'runtimeList', 'growl', 'Upload', 'localConfig', '$uibModal', '$timeout', 'WizardHandler', 'REST_URLS', 'Environments',
    function ($http, $state, runtimeList, growl, Upload, localConfig, $uibModal, $timeout, WizardHandler, REST_URLS, Environments) {

        var container = this;
        container.runtimes = runtimeList.data.runtimes;
        
        container.waitModal = new WaitModal($uibModal);

        // initialize default values of the form
        container.imageSize = 1024;
        container.imageType = '';
        container.importMethod = '';

        container.landingPage = localConfig.data.landingPage;

        container.imageId = "";
        container.env = [];
        container.args = [];
        container.tag = "";
        container.imageInput = "/input";
        container.imageOutput = "/output";
        container.customSubdir = null;
        container.isCustomSubdir = false;

        container.linuxRuntimes = [];
        Environments.query().$promise.then(function (response) {

            response.forEach(function (element) {
                
                if (!element.linuxRuntime)
                    return;
                
                container.linuxRuntimes.push(element);
            });
        });

        //TODO: ?
        container.onSelectRuntime = function (item, model) {
            container.runtime = item.id;
        };

        container.isValid = function () {

            if (!container.imageInput || !container.imageOutput) {
                growl.error("input / ouput folder are required");
                return false;
            }

            if (container.tag === "" && container.runtime == 1) {
                growl.error("container tag is required");
                return false;
            }

            if (!container.imageUrl) {
                growl.error("image file / image URL is required");
                return false;
            }


            return true;
        };

        container.isMetaDataValid = function () {

            if (!container.title) {
                growl.error("Title is required");
                return false;
            }
           
           // if (!container.containerDescription) {
           //     growl.error("Description is required");
           //     return false;
           // }

            if(!container.selectedRuntime)
            {
                growl.error("Select a container runtime"); 
                return false; 
            }

            // if (!container.author) {
            //     growl.error("Author is required");
            //     return false;
            // }

            if (container.runtime !== "2" && container.runtime !== "1" && container.args.length === 0) {
                growl.error("process is required");
                return false;
            }

            return true;
        };

        container.saveImportedContainer = async function () {
            if (!container.isMetaDataValid() || !container.imageResult)
                return;

            let convertedEnv = [];
            let convertedArgs = [];
            let escapeEl = document.createElement('textarea');

            if (container.runtime === "2" && container.args.length === 0) {
                container.args.push("/bin/sh", "-c", '. /environment; exec "$0" "$@"', "/singularity");
            }

            let unescape = (html) => {
                escapeEl.innerHTML = html;
                return escapeEl.textContent;
            };

            for (let _e in container.env) {
                convertedEnv.push(unescape(container.env[_e]));
            }

            for (let _a in container.args) {
                convertedArgs.push(unescape(container.args[_a]));
            }

            let containerBuilder = new ContainerBuilder(container.imageType, container.imageResult.containerUrl, container.imageResult.metadata);
            containerBuilder.setTitle(container.title);
            containerBuilder.setAuthor(container.author);
            containerBuilder.setDescription(container.containerDescription);
            containerBuilder.setRuntime(container.selectedRuntime.envId);
            containerBuilder.setName((container.name) ? container.name : "tmp");
            containerBuilder.enableGui(container.gui);
            containerBuilder.setInputFolder(container.imageInput);
            containerBuilder.setOutputFolder(container.imageOutput);
            containerBuilder.configureProcess(convertedArgs, convertedEnv);
        
            try {
                container.waitModal.show("Importing container as EaaS image");
                let _result = await containerBuilder.build(localConfig.data.eaasBackendURL, localStorage.getItem('id_token'));
                let task = new Task(_result.taskId, localConfig.data.eaasBackendURL, localStorage.getItem('id_token'));
                let buildResult = await task.done;
                container.id = buildResult.userData.environmentId;
                console.log(buildResult);
                growl.success("import successful.");
                container.waitModal.hide();
                WizardHandler.wizard('containerImportWizard').next();
            }
            catch(e)
            {
                console.log(e);
                container.waitModal.hide();
                $state.go('error', {errorMsg: {title: 'Error ' + e}});
            }
        };

        container.saveHandle = function () {
            $http.post(localConfig.data.eaasBackendURL + REST_URLS.postHandleValue, {
                handle: "11270/" + container.id,
                value: localConfig.data.landingPage + "?id=" + container.id,
            }).then(function (response) {
                console.log("response  ", response);
                console.log("response.status   ", response.status);
                if (response.status === 200) {
                    container.handleValue = "http://hdl.handle.net/11270/" + container.id;
                } else {
                    growl.error('Handle is not defined!!');
                }
            });
        };

        container.onImportFilesChosen = function (file) {
            // The user chose files to upload
            // Initialize the uploadFiles list with meaningful values for destination and action.
            // Those are displayed in the view and can be changed by the user

            const sparams = new URLSearchParams({
                'filename': file.filename,
            });

            Upload.http({
                url: localConfig.data.eaasBackendURL + "upload?" + sparams,
                headers : {
                    'content-type': "application/octet-stream",
                },
                name: file.filename,
                destination: file.destination,
                action: "copy",
                data: file
            }).then(function (resp) {
                // Push the uploaded file to the input list
                console.log('Success ' + resp.config.data.name + 'uploaded. Response: ' + resp.data);
                container.imageUrl = resp.data.uploads[0];

            }, function (resp) {
                console.log('Error status: ' + resp.status);
                $state.go('error', {
                    errorMsg: {
                        title: "Load Environments Error " + resp.data.status,
                        message: resp.data.message
                    }
                });
            }, function (evt) {
                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                console.log('progress: ' + progressPercentage + '% ' + evt.config.data.name);
            });
        };

        //Next Step
        container.import = async function () {

            if (!container.isValid())
                return;

            switch (container.runtime) {
                case "0":
                    container.imageType = "rootfs";
                    break;
                case "1":
                    container.imageType = "dockerhub";
                    break;
                case "2":
                    container.imageType = "simg";
                    break;
                default:
                    $state.go('error', {errorMsg: {title: 'Error: unkown container fmt'}});
            }

            let imageBuilder = new ContainerImageBuilder(container.imageUrl, container.imageType);
            imageBuilder.setTag(container.tag);

            try {
                container.waitModal.show("Preparing container");
                let imageBuilderTask = await imageBuilder.build(localConfig.data.eaasBackendURL, localStorage.getItem('id_token'));
                let task = new Task(imageBuilderTask.taskId, localConfig.data.eaasBackendURL, localStorage.getItem('id_token'));
                let buildResult = await task.done;

                let object = JSON.parse(buildResult.object);
                container.imageResult = object;
                
                if(object.metadata)
                {
                    container.args = object.metadata.entryProcesses || [];
                    container.env = object.metadata.envVariables || [];
                }
                container.waitModal.hide();
                WizardHandler.wizard('containerImportWizard').next();
            }
            catch(e)
            {
                container.waitModal.hide();
                $state.go('error', {errorMsg: {title: 'Error ' + e}});
            }
        };
    }];
