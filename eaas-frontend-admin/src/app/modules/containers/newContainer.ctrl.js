module.exports = ['$http', '$scope', '$state', '$stateParams', 'runtimeList', 'growl', 'Upload', 'localConfig', '$uibModal', '$timeout', 'WizardHandler', 'helperFunctions', 'REST_URLS',
    function ($http, $scope, $state, $stateParams, runtimeList, growl, Upload, localConfig, $uibModal, $timeout, WizardHandler, helperFunctions, REST_URLS) {

        var container = this;
        container.runtimes = runtimeList.data.runtimes;
        console.log(container.runtimes);

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

        //TODO: ?
        container.onSelectRuntime = function (item, model) {
            container.runtime = item.id;
        };

        container.isValid = function () {

            if (!container.imageInput || !container.imageOutput) {
                growl.error("input / ouput folder are required");
                return false;
            }

            if (container.runtime !== "2" && container.runtime !== "1" && container.args.length === 0) {
                growl.error("process is required");
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
            if (!container.containerDescription) {
                growl.error("Description is required");
                return false;
            }
            // if (!container.author) {
            //     growl.error("Author is required");
            //     return false;
            // }


            return true;
        };

        container.checkState = function (_taskId, stayAtPage) {
            var taskInfo = $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getContainerTaskState, _taskId)).then(function (response) {
                if (response.data.status == "0") {
                    if (response.data.isDone) {

                        container.id = response.data.userData.environmentId;
                        container.modal.close();
                        growl.success("import successful.");
                        if (typeof stayAtPage == "undefined" || !stayAtPage)
                            $state.go('admin.standard-envs-overview', {}, {reload: true});
                    }
                    else
                        $timeout(function () {
                            container.checkState(_taskId, stayAtPage);
                        }, 2500);
                }
                else {
                    container.modal.close();
                    $state.go('error', {errorMsg: {title: 'Error ' + response.data.message}});
                }
            });
        };

        container.saveImportedContainer = function () {

            if (!container.isMetaDataValid())
                return;

            $http.post(localConfig.data.eaasBackendURL + REST_URLS.saveImportedContainer, {
                id: container.id,
                title: container.title,
                description: container.containerDescription,
                author: container.author
            }).then(function (response) {
                if (response.data.status == "0") {
                    growl.success("import successful.");
                    WizardHandler.wizard('containerImportWizard').next();
                    // $state.go('wf-s.standard-envs-overview', {}, {reload: true});
                }
                else {
                    $state.go('error', {errorMsg: {title: 'Error ' + response.data.message}});
                }
            });
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
            Upload.upload({
                url: localConfig.data.eaasBackendURL + "EmilContainerData/uploadUserInput",
                name: file.filename,
                destination: file.destination,
                action: "copy",
                data: {file: file}
            }).then(function (resp) {
                // Push the uploaded file to the input list
                console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
                container.imageUrl = resp.data.userDataUrl;

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
                console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
            });
        };

        //Next Step
        container.import = function () {

            if (!container.isValid())
                return;

            var convertedEnv = [];
            var convertedArgs = [];
            var escapeEl = document.createElement('textarea');

            if (container.runtime === "2" && container.args.length === 0) {
                container.args.push("/bin/sh", "-c", '. /environment; exec "$0" "$@"', "/singularity");
            }

            var unescape = function (html) {
                escapeEl.innerHTML = html;
                return escapeEl.textContent;
            };

            for (var _e in container.env) {
                convertedEnv.push(unescape(container.env[_e]));
            }

            for (var _a in container.args) {
                convertedArgs.push(unescape(container.args[_a]));
            }

            switch (container.runtime) {
                case "0":
                    container.imageType = "rootfs";
                    break;
                case "1":
                    container.imageType = "dockerhub";
                    break;
                case "2":
                    container.imageType = "simg";
            }

            console.log("container.importType", container.imageType);


            $http.post(localConfig.data.eaasBackendURL + REST_URLS.importContainerUrl,
                {
                    urlString: container.imageUrl,
                    runtimeID: container.runtime,
                    name: (container.name) ? container.name : "tmp",
                    tag: container.tag,
                    processArgs: container.args,
                    processEnvs: container.env,
                    inputFolder: container.imageInput,
                    outputFolder: container.imageOutput,
                    imageType: container.imageType,
                    title: container.title,
                    description: container.containerDescription,
                    author: container.author,
                    guiRequired: container.gui,
                    customSubdir: container.customSubdir
                }).then(function (response) {

                if (response.data.status === "0") {

                    var taskId = response.data.taskId;
                    container.modal = $uibModal.open({
                        backdrop: 'static',
                        animation: true,
                        templateUrl: 'partials/wait.html'
                    });
                    container.checkState(taskId, true);
                    WizardHandler.wizard('containerImportWizard').next();
                }
                else {
                    $state.go('error', {errorMsg: {title: 'Error ' + response.data.message + "\n\n" + container.description}});
                }
            });
        };
    }];
