import {startNetworkEnvironment} from "EaasLibs/javascript-libs/network-environment-utils/start-network-environment.js";
import {showErrorIfNull} from "EaasLibs/javascript-libs/show-error-if-null.js";
import {MachineComponentBuilder} from "EaasClient/lib/componentBuilder";
import {ClientOptions, TcpGatewayConfig} from "EaasClient/lib/clientOptions";
import {sendCtrlAltDel, sendEsc} from "EaasClient/eaas-client"

module.exports = ['$state', '$sce', '$http', '$stateParams', '$translate', '$uibModal', 'Upload', 'eaasClient', '$scope', 'localConfig', 'Environments', 'REST_URLS', 'EmilNetworkEnvironments', 'chosenEnvId', 'isNetworkEnvironment', 'buildInfo', 'WizardHandler', 'helperFunctions', 'growl',
    function ($state, $sce, $http, $stateParams, $translate, $uibModal, Upload, eaasClient, $scope, localConfig, Environments, REST_URLS, EmilNetworkEnvironments, chosenEnvId, isNetworkEnvironment, buildInfo, WizardHandler, helperFunctions, growl) {

        showErrorIfNull(chosenEnvId, $state);
        async function checkIfShared() {
            //check if shared network is enabled
            if (isNetworkEnvironment && vm.env.startupEnvId) {
                $http.get(localConfig.data.eaasBackendURL + REST_URLS.detachedNetEnvs).then((response) => {
                    response.data.forEach((netEnv) => {
                        if (netEnv.networkEnvId === vm.env.envId) {
                            console.log("!! Running Network Environment Found!", netEnv);
                            console.log("redirecting to attach!");
                            window.location.href = localConfig.data.landingPage + "?sessionId=" + netEnv.session.id + "&connectEnvId=" + vm.env.startupEnvId + "#!/attach-landing-page";
                        }
                    });
                    vm.env.emilEnvironments.push({
                        envId: vm.env.startupEnvId,
                        label: "Temp Client",
                        toVisualize: true
                    })
                })
            }
        }

    
        var vm = this;
        vm.eaasClient = eaasClient;

        (isNetworkEnvironment ? EmilNetworkEnvironments : Environments).get({envId: chosenEnvId}).$promise.then((response) => init(response));

        async function init(response) {
            console.log("!!!!", response);
            vm.env = response;
            await checkIfShared();
        
            vm.env.isContainer = vm.env.envType === "container";
            vm.network = "";
            vm.buildInfo = buildInfo.data.version;
            vm.uiCommitHash = __UI_COMMIT_HASH__;

            vm.canProcessAdditionalFiles = vm.env.canProcessAdditionalFiles;
            vm.inputs = [];
            vm.run = function () {
                confirmStartFn(vm.inputs);
            };

            vm.scrollToDiv = function (divId) {
                divId = "#" + divId;
                $('html,body').animate({scrollTop: $(divId).offset().top});
            };

            vm.changeStep = function (stepId, hideSteps) {

                let changeWizardStep = function () {
                    if (typeof stepId !== "undefined") {
                        WizardHandler.wizard('containerWizard').goTo(stepId)
                    } else
                        WizardHandler.wizard('containerWizard').next()
                };

                let hideWizardSteps = function () {
                    //FIXME find a better way to retrieve an element
                    if (typeof hideSteps !== "undefined") {
                        for (let i = 0; i < hideSteps.length; i++) {
                            let step = "#" + hideSteps[i];
                            $(step).attr("style", "display: none !important");
                        }
                    }
                };


                jQuery.when(
                    changeWizardStep(),
                    hideWizardSteps(),
                    jQuery.Deferred(function (deferred) {
                        jQuery(deferred.resolve);
                    })).done(function () {
                    requestAnimationFrame(() => {
                        let step = WizardHandler.wizard('containerWizard').currentStepTitle();
                        vm.scrollToDiv(step);
                    });
                });
            };
            vm.content = [];

            vm.getCurrentStep = function () {
                return WizardHandler.wizard('containerWizard').currentStepTitle();
            };

            vm.addContent = function (contentItem) {
                if (contentItem.action || contentItem.compression_format || contentItem.url) {
                    var obj = {
                        action: contentItem.action,
                        compression_format: contentItem.compression_format,
                        url: contentItem.url,
                        name: contentItem.name
                    };
                    vm.content.push(obj);
                    vm.contentItem = {};
                }
            };
            vm.contentItem = {};
            vm.input_data = {};
            vm.input_data.size_mb = 512;


            var confirmStartFn = async function (inputs) {

                if (vm.env.isContainer && !vm.env.runtimeId)
                    var startFunction = "startContainer";
                else {
                    var startFunction = "start";
                    $("#container-running").hide();
                }
                $("#container-stopped").hide();

                
               //  params.input_data = [];
                let input = {};
                input.size_mb = vm.input_data.size_mb;
                input.destination = vm.env.input;
                input.content = inputs;
               
                /*
                if(input)
                {
                    console.log("fixme");
                    params.input_data.push(input);
                }
                */

                if (vm.env.objectId) {
                    console.log("fixme");
                    params.object = vm.env.objectId;
                }

                let clientOptions = new ClientOptions();
                if (vm.data) {
    
                    clientOptions.enableNetworking();
                    clientOptions.getNetworkConfig().enableInternet(vm.env.networking.enableInternet);
                    let tcpGatewayConfig = new TcpGatewayConfig(vm.env.networking.serverIp, vm.env.networking.serverPort);
                    tcpGatewayConfig.enableSocks(vm.env.enableSocks);
                    tcpGatewayConfig.enableLocalMode(vm.env.networking.localServerMode);
                    
                    clientOptions.getNetworkConfig().setTcpGatewayConfig(tcpGatewayConfig);
                }
                vm.proxy = "";

                vm.getOutput = function () {
                    const unloadBackup = eaasClient.deleteOnUnload;
                    eaasClient.deleteOnUnload = false;
                    vm.isContOutDownloading = true;

                    async function f() {
                        const containerOutput = await fetch(eaasClient.sessions.find((session) => eaasClient.activeView.componentId === session.componentId).getContainerResultUrl(), {
                            
                        });
                        const containerOutputBlob = await containerOutput.blob();
                        // window.open(URL.createObjectURL(containerOutputBlob), '_blank');

                        var downloadLink = document.createElement("a");
                        downloadLink.href = URL.createObjectURL(containerOutputBlob);
                        downloadLink.download = "output-data.tar.gz";
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                    };
                    f().then(function () {
                        vm.isContOutDownloading = false;
                        $scope.$apply();
                    });

                    eaasClient.deleteOnUnload = unloadBackup;
                };

                vm.sendCtrlAltDel = function () {
                    sendCtrlAltDel();
                };

                eaasClient.onEmulatorStopped = function () {
                    $("#emulator-loading-container").hide();
                    $("#emulator-container").hide();
                    $("#emulator-footer").hide();
                    $("#container-running").hide();
                    $("#container-stopped").show();
                    const currentSession = eaasClient.sessions.find((session) => eaasClient.activeView.componentId === session.componentId);
                    console.log("done " + currentSession.getContainerResultUrl());
                };

                eaasClient.onError = function (msg) {
                    $state.go('error', {errorMsg: {title: "Error ", message: msg}});
                };


                $("#emulator-loading-container").show();

                if (vm.content.length > 0)
                    vm.input_data.content = vm.content;
                else
                    vm.input_data = null;

                console.log("vm.input_data ", JSON.stringify(vm.input_data));

                vm.stop = function () {

                    jQuery.when(
                        eaasClient.stopEnvironment(),
                        jQuery.Deferred(function (deferred) {
                            jQuery(deferred.resolve);
                        })).done(function () {

                        vm.getOutput();
                    });
                    $("#emulator-downloadable-attachment-link").hide();
                };

                try {
                    if (localStorage.DEBUG_script) eval(localStorage.DEBUG_script);
                } catch (e) {
                    console.log(e);
                }
            
               let components = [];
               if(vm.env.isContainer && vm.env.runtimeId){
                   const runtimeEnv = await Environments.get({envId: vm.env.runtimeId}).$promise;
                   console.log("!!!!!!!!!!!!!!!! vm.env.runtimeId", vm.env.runtimeId);
                   console.log("params.input_data", params.input_data);

                   let component = new MachineComponentBuilder(vm.env.runtimeId, runtimeEnv.archive);
                   component.setLinuxRuntime(
                    {
                        userContainerEnvironment: vm.env.envId,
                        userContainerArchive: vm.env.archive,
                        networking: vm.env.networking,
                        input_data: params.input_data
                    });
                    component.setInteractive(true);
                    components.push(component);
               } else if (vm.env.isContainer) {
                   console.log("fixme");
                   // envs = vm.env.envId
               } else {
                    let component = new MachineComponentBuilder(vm.env.envId, vm.env.archive);
                    component.setObject(vm.env.objectId, vm.env.objectArchive);
                    if(vm.input_data)
                        component.addInputMedia(vm.input_data);
                    component.setInteractive(true);
                    components.push(component);
               }
               (isNetworkEnvironment ? startNetworkEnvironment(vm, eaasClient, vm.env, Environments, $http, $uibModal, localConfig) : eaasClient[startFunction](components, clientOptions)).then(function () {
                let sessionToInitialize = undefined;
                if(vm.componentIdToInitialize){
                   sessionToInitialize = eaasClient.getSession(vm.componentIdToInitialize);
                }

                eaasClient.connect($("#emulator-container")[0], sessionToInitialize).then(function () {
                    window.onbeforeunload = function (e) {
                        var dialogText = $translate.instant('MESSAGE_QUIT');
                        e.returnValue = dialogText;
                        return dialogText;
                    };

                    window.onunload = function () {
                        if (eaasClient)
                            eaasClient.release();
                        window.onbeforeunload = null;
                    };
                    
                    $("#emulator-loading-container").hide();
                        $("#emulator-container").show();
                        $("#emulator-downloadable-attachment-link").show();


                        var erd = elementResizeDetectorMaker();

                        erd.listenTo(document.getElementById("emulator-container"), function (element) {
                            vm.scrollToDiv("emulator-container");
                        });

                        if (eaasClient.params.pointerLock === "true") {
                            growl.info($translate.instant('EMU_POINTER_LOCK_AVAILABLE'));
                            BWFLA.requestPointerLock(eaasClient.guac.getDisplay().getElement(), 'click');
                        }

                        if (eaasClient.networkTcpInfo) {
                            var url = new URL(eaasClient.networkTcpInfo.replace(/^info/, 'http'));
                            var pathArray = url.pathname.split('/');
                            vm.hostname = url.hostname;
                            vm.port = pathArray[2];
                            vm.network = "//" + vm.hostname + ":" + vm.port;
                            $scope.$apply()
                        }

                        // Fix to close emulator on page leave
                        $scope.$on('$locationChangeStart', function (event) {
                            eaasClient.release();
                        });
                    });


                    $scope.$on('$locationChangeStart', function (event) {
                        eaasClient.release();
                    });
                });
            };

            vm.openNetworkDialog = function () {
                $uibModal.open({
                    animation: true,
                    template: require('./modals/network.html'),
                    resolve: {
                        currentEnv: function () {
                            return vm.env;
                        },
                        localConfig: function () {
                            return localConfig;
                        }
                    },
                    controller: "NetworkModalController as networkModalCtrl"
                });
            };


            // Container code
            vm.run = () => {
                confirmStartFn(vm.inputs);
            };
            vm.onInputSourceSelection = function (obj) {
                // Get chosen input source
                var inputMethod = obj.target.attributes.method.value;
                // Show div corresponding to the chosen input type, hide all other
                if (inputMethod != vm.activeInputMethod) {
                    // Disable old input method, if one was set already
                    if (typeof (vm.activeInputMethod) != 'undefined') {
                        vm.showDialogs[vm.activeInputMethod] = false;
                    }
                    // Enable new input method
                    vm.activeInputMethod = inputMethod;
                    vm.showDialogs[vm.activeInputMethod] = true;
                    vm.inputSourceButtonText = obj.target.firstChild.data;
                    vm.newInputUrl = "";
                    vm.newInputName = "";
                    vm.uploadFiles = [];
                    vm.prideFiles = {};
                    vm.prideAccession = "";
                }
                console.log(vm.showDialogs);
                console.log(inputMethod);
            };
            vm.onImportFilesChosen = function (files) {
                // The user chose files to upload
                // Initialize the uploadFiles list with meaningful values for destination and action.
                // Those are displayed in the view and can be changed by the user
                for (let i = 0; i < files.length; i++) {
                    vm.uploadFiles.push({
                        file: files[i],
                        filename: files[i].name,
                        destination: files[i].name,
                        action: files[i].action,
                        compression_format: files[i].compression_format
                    });
                }
                vm.scrollToDiv('STEP3');
            };
            vm.onFileUpload = function () {
                for (var i = 0; i < vm.uploadFiles.length; i++) {

                    if (/\s/.test(vm.uploadFiles[i].destination)) {
                        growl.error('File name should not contain space! Please, choose a custom name');
                        return;
                    }

                    // Have to remember the chosen destination and action for the file
                    Upload.upload({
                        url: localConfig.data.eaasBackendURL + "upload",
                        name: vm.uploadFiles[i].filename,
                        destination: vm.uploadFiles[i].destination,
                        action: vm.uploadFiles[i].action,
                        compression_format: vm.uploadFiles[i].compression_format,
                        data: {file: vm.uploadFiles[i].file}
                    }).then(function (resp) {
                        // Push the uploaded file to the input list
                        console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
                        if (vm.env.isContainer)
                            $scope.containerLandingCtrl.inputs.push({
                                url: resp.data.uploads[0],
                                name: resp.config.destination,
                                action: resp.config.action,
                                compression_format: resp.config.compression_format
                            });
                        else $scope.containerLandingCtrl.content.push({
                            url: resp.data.uploads[0],
                            name: resp.config.destination,
                            action: resp.config.action,
                            compression_format: resp.config.compression_format
                        });

                        $scope.containerLandingCtrl.uploadFiles = [];
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
                }
            };

            vm.onImportFromUrl = function () {
                // Strip all whitespaces and create list of URLs
                var urls = vm.importUrls.split("\n");
                // Check URLs
                // RegEx is taken from: https://gist.github.com/jpillora/7885636
                var regEx = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.​\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[​6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1​,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00​a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u​00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i;
                var urlInvalid = false;
                for (var i = 0; i < urls.length; i++) {
                    if (!regEx.test(urls[i])) {
                        growl.error('Not a valid URL: ' + urls[i], {title: 'Error '});
                        console.log('Not a valid URL: ' + urls[i]);
                        urlInvalid = true;
                    }
                }
                if (urlInvalid) {
                    console.log("One URL was invalid. Do not add any URLs to the inputs.");
                    return;
                }
                // We reach this code if all URLs are valid
                for (var i = 0; i < urls.length; i++) {
                    var tmp = urls[i].split("/");
                    var name = tmp[tmp.length - 1];
                    vm.list.push({
                        url: urls[i],
                        name: "",
                        action: 'copy'
                    });
                }
                vm.importUrls = "";
            };

            vm.onUniprot = function (uniprotMode) {
                if (uniprotMode === 'batch') vm.onUniprotBatch();
                else if (uniprotMode === 'query') vm.onUniprotQuery();
                else
                    growl.error('This uniprot type is not supported', {title: 'Error'});
            };

            vm.onUniprotBatchFileChosen = function (files) {
                console.log(files);
                vm.uniprotBatch = files[0];
            };
            vm.onUniprotBatch = function () {
                console.log("onUniprotBatch");
                console.log(vm.uniprotBatch);
                console.log($scope.containerLandingCtrl.uniprotBatch);
                var formdata = new FormData();
                formdata.append("file", vm.uniprotBatch);
                formdata.append("format", "txt");
                formdata.append("from", "ACC+ID");
                formdata.append("to", "ACC");
                console.log(formdata);
                $http.post('https://www.uniprot.org/uploadlists/',
                    formdata,
                    {
                        headers: {
                            'Content-Type': "multipart/form-data"
                        }
                    }).then(function (resp) {
                    // Push the uploaded file to the input list
                    console.log('Success ' + resp + 'uploaded. Response: ' + resp.data);
                });
            };
            vm.onUniprotQuery = function () {
                var uniprotUrlPrefix = "http://www.uniprot.org/uniprot/?query=";
                // Build the query URL from the query string and push to input list
                var queryUrl = uniprotUrlPrefix + vm.uniprotQuery;
                // Check if query contains format information. Add "'" in the end, because the string can container whitespaces
                if (!queryUrl.includes("format")) {
                    queryUrl += "&format=fasta";
                }
                // Replace spaces with %20
                queryUrl = queryUrl.replace(/\s/g, "%20");
                // Add the input query to the input list
                vm.list.push({
                    url: queryUrl,
                    name: vm.newInputName,
                    action: vm.newAction
                });
                vm.newInputUrl = '';
                vm.newInputName = '';
                vm.newAction = '';
                vm.uniprotQuery = '';
            };
            vm.onPrideListFiles = function () {
                console.log(vm.prideAccession);

                // Query for file list of project
                var pride_rest_project = "https://www.ebi.ac.uk:443/pride/ws/archive/file/list/project/"
                var rest_url = pride_rest_project + vm.prideAccession;
                $http.get(rest_url).then(function (response) {
                    console.log($scope.containerLandingCtrl.prideAccession);
                    // Build list of files from response
                    var files = response.data.list;
                    var fileList = {};
                    for (var i = 0; i < files.length; i++) {
                        var fileType = files[i].fileType;
                        // Check if this file type already exists
                        if (typeof (fileList[fileType]) == 'undefined') {
                            fileList[fileType] = {
                                'checked': false,
                                'list': []
                            };
                        }

                        fileList[fileType].list.push({
                            "fileName": files[i].fileName,
                            "downloadLink": files[i].downloadLink,
                            "fileSize": files[i].fileSize,
                            "checked": false
                        });
                    }
                    $scope.containerLandingCtrl.prideFiles = fileList;
                });
            };
            vm.onPrideAddFiles = function () {
                // Add the checked files to the input list
                for (var fileType in vm.prideFiles) {
                    for (var i = 0; i < vm.prideFiles[fileType].list.length; i++) {
                        if (vm.prideFiles[fileType].list[i].checked) {
                            vm.list.push({
                                url: vm.prideFiles[fileType].list[i].downloadLink,
                                name: vm.prideFiles[fileType].list[i].fileName,
                                action: 'copy'
                            });
                        }
                    }
                }
                vm.prideFiles = {};
                vm.prideAccession = "";
            };
            vm.onPrideMasterCheckbox = function (event) {
                // Get the file type that corresponds to this checkbox
                var fileType = event.target.attributes.data.nodeValue;
                var master_checked = vm.prideFiles[fileType].checked;
                // Set all child checkboxes to the same as the master checkbox value
                for (var i = 0; i < vm.prideFiles[fileType].list.length; i++) {
                    vm.prideFiles[fileType].list[i].checked = master_checked;
                }
            };
            vm.showDialogs = {
                "upload": false,
                "import": false,
                "pride": false,
                "uniprot": false
            };
            vm.inputs = [];
            vm.newInputUrl = "";
            vm.newInputName = "";
            vm.importUrls = "";
            vm.uniprotBatch = "";
            vm.uniprotQuery = "";
            vm.prideAccession = "";
            vm.prideFiles = {};
            vm.inputSourceButtonText = "Choose Input Source";
            vm.activeInputMethod = null;
            vm.uploadFiles = [];
        }
}];
