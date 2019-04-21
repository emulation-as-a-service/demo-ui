module.exports = ['$state', '$sce', '$http', '$stateParams', '$translate', '$uibModal', 'Upload', '$scope', 'localConfig', 'buildInfo', 'chosenEnv', 'WizardHandler', 'helperFunctions', 'growl',
    function ($state, $sce, $http, $stateParams, $translate, $uibModal, Upload, $scope, localConfig, buildInfo, chosenEnv, WizardHandler, helperFunctions, growl) {


    var vm = this;
    vm.env = null;
    vm.network = "";
    vm.buildInfo = buildInfo.data.version;
    vm.uiCommitHash = __UI_COMMIT_HASH__;

    let allowedEnvironmentTypes = helperFunctions.getAllowedEnvironmentTypes();

    // check new style db
    if (chosenEnv.data.hasOwnProperty("envId")) {
       vm.env  = chosenEnv.data;
       console.log("chosen vm env" , vm.env );
    }

    for (let i = 0; i < allowedEnvironmentTypes.length; i++) {
        console.log("chosenEnv" , chosenEnv);
        if( vm.env != null)
            break;
        // check old style db
        if (chosenEnv.data.hasOwnProperty(allowedEnvironmentTypes[i].name)) {
            vm.env  = chosenEnv.data[allowedEnvironmentTypes[i].name];
            vm.env.isContainer  = allowedEnvironmentTypes[i].isContainer;
            break;
        }
    }

    if (vm.env == null){
        $state.go('error', {errorMsg: {title: "Error " , message: "ID is not found. Please follow the pattern: {SERVER_URL}?id={containerId}"}});
    }

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



    var confirmStartFn = function(inputs)
    {

        if (vm.env.isContainer)
            var startFunction = "startContainer";
        else {
            var startFunction = "startEnvironment";
            $("#container-running").hide();
        }
        $("#container-stopped").hide();

        let params = {};
        params.input_data = [];
        let input = {};
        input.size_mb = vm.input_data.size_mb;
        input.destination = vm.env.input;
        input.content = inputs;
        params.input_data.push(input);

        if (chosenEnv.data) {

            if (vm.env.localServerMode)
                params.hasTcpGateway = false;
            else
                params.hasTcpGateway = vm.env.serverMode;

            params.hasInternet = vm.env.enableInternet;
            if (params.hasTcpGateway || vm.env.localServerMode) {
                params.tcpGatewayConfig = {
                    socks: vm.env.enableSocks,
                    gwPrivateIp: vm.env.gwPrivateIp,
                    gwPrivateMask: vm.env.gwPrivateMask,
                    serverPort: vm.env.serverPort,
                    serverIp: vm.env.serverIp
                };
            }
        }
        vm.proxy = "";


        vm.downloadLink = function()
        {
            const unloadBackup = eaasClient.deleteOnUnload;
            eaasClient.deleteOnUnload = false;
            location = window.eaasClient.getContainerResultUrl();
            eaasClient.deleteOnUnload = backup;

            $("#container-download-btn").hide();
        };

        vm.sendCtrlAltDel = function() {
            window.eaasClient.sendCtrlAltDel();
        };

        window.eaasClient = new EaasClient.Client(localConfig.data.eaasBackendURL, $("#emulator-container")[0]);

        window.eaasClient.onEmulatorStopped = function() {
            $("#emulator-loading-container").hide();
            $("#container-running").hide();
            $("#container-stopped").show();
            console.log("done " + eaasClient.getContainerResultUrl());
        };

        window.eaasClient.onError = function(msg) {
            $state.go('error', {errorMsg: {title: "Error " , message: msg}});
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

                vm.downloadLink();
            });
            $("#emulator-downloadable-attachment-link").hide();
        };

        try {
            if (localStorage.DEBUG_script) eval(localStorage.DEBUG_script);
        } catch (e) {}

        eaasClient[startFunction](vm.env.envId, params, vm.input_data).then(function () {

            eaasClient.connect().then(function() {
                $("#emulator-loading-container").hide();
                $("#emulator-container").show();
                $("#emulator-downloadable-attachment-link").show();


                var erd = elementResizeDetectorMaker();

                erd.listenTo(document.getElementById("emulator-container"), function(element) {
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
                $scope.$on('$locationChangeStart', function(event) {
                    eaasClient.release();
                });
            });


            $scope.$on('$locationChangeStart', function(event) {
                eaasClient.release();
            });
        });
    };

        vm.openNetworkDialog = function() {
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
        this.run = function () {
            confirmStartFn(this.inputs);
        };
        this.onInputSourceSelection = function (obj) {
            // Get chosen input source
            var inputMethod = obj.target.attributes.method.value;
            // Show div corresponding to the chosen input type, hide all other
            if (inputMethod != this.activeInputMethod) {
                // Disable old input method, if one was set already
                if (typeof(this.activeInputMethod) != 'undefined') {
                    this.showDialogs[this.activeInputMethod] = false;
                }
                // Enable new input method
                this.activeInputMethod = inputMethod;
                this.showDialogs[this.activeInputMethod] = true;
                this.inputSourceButtonText = obj.target.firstChild.data;
                this.newInputUrl = "";
                this.newInputName = "";
                this.uploadFiles = [];
                this.prideFiles = {};
                this.prideAccession = "";
            }
            console.log(this.showDialogs);
            console.log(inputMethod);
        };
        this.onImportFilesChosen = function (files) {
            // The user chose files to upload
            // Initialize the uploadFiles list with meaningful values for destination and action.
            // Those are displayed in the view and can be changed by the user
            for (let i = 0; i < files.length; i++) {
                this.uploadFiles.push({
                    file: files[i],
                    filename: files[i].name,
                    destination: files[i].name,
                    action: files[i].action,
                    compression_format: files[i].compression_format
                });
            }
            vm.scrollToDiv('STEP3');
        };
        this.onFileUpload = function () {
            for (var i = 0; i < this.uploadFiles.length; i++) {

                if (/\s/.test(this.uploadFiles[i].destination)) {
                    growl.error('File name should not contain space! Please, choose a custom name');
                    return;
                }

                // Have to remember the chosen destination and action for the file
                Upload.upload({
                    url: localConfig.data.eaasBackendURL + "EmilContainerData/uploadUserInput",
                    name: this.uploadFiles[i].filename,
                    destination: this.uploadFiles[i].destination,
                    action: this.uploadFiles[i].action,
                    compression_format: this.uploadFiles[i].compression_format,
                    data: {file: this.uploadFiles[i].file}
                }).then(function (resp) {
                    // Push the uploaded file to the input list
                    console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
                    if (vm.env.isContainer)
                        $scope.containerLandingCtrl.inputs.push({
                            url: resp.data.userDataUrl,
                            name: resp.config.destination,
                            action: resp.config.action,
                            compression_format: resp.config.compression_format
                        });
                    else $scope.containerLandingCtrl.content.push({
                        url: resp.data.userDataUrl,
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

        this.onImportFromUrl = function () {
            // Strip all whitespaces and create list of URLs
            var urls = this.importUrls.split("\n");
            // Check URLs
            // RegEx is taken from: https://gist.github.com/jpillora/7885636
            var regEx =  /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.​\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[​6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1​,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00​a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u​00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i;
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
                this.list.push({
                    url: urls[i],
                    name: "",
                    action: 'copy'
                });
            }
            this.importUrls = "";
        };

        this.onUniprot = function (uniprotMode) {
            if (uniprotMode === 'batch') this.onUniprotBatch();
            else if (uniprotMode === 'query') this.onUniprotQuery();
            else
                growl.error('This uniprot type is not supported', {title: 'Error'});
        };

        this.onUniprotBatchFileChosen = function (files) {
            console.log(files);
            this.uniprotBatch = files[0];
        };
        this.onUniprotBatch = function () {
            console.log("onUniprotBatch");
            console.log(this.uniprotBatch);
            console.log($scope.containerLandingCtrl.uniprotBatch);
            var formdata = new FormData();
            formdata.append("file", this.uniprotBatch);
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
        this.onUniprotQuery = function () {
            var uniprotUrlPrefix = "http://www.uniprot.org/uniprot/?query=";
            // Build the query URL from the query string and push to input list
            var queryUrl = uniprotUrlPrefix + this.uniprotQuery;
            // Check if query contains format information. Add "'" in the end, because the string can container whitespaces
            if (!queryUrl.includes("format")) {
                queryUrl += "&format=fasta";
            }
            // Replace spaces with %20
            queryUrl = queryUrl.replace(/\s/g, "%20");
            // Add the input query to the input list
            this.list.push({
                url: queryUrl,
                name: this.newInputName,
                action: this.newAction
            });
            this.newInputUrl = '';
            this.newInputName = '';
            this.newAction = '';
            this.uniprotQuery = '';
        };
        this.onPrideListFiles = function () {
            console.log(this.prideAccession);

            // Query for file list of project
            var pride_rest_project = "https://www.ebi.ac.uk:443/pride/ws/archive/file/list/project/"
            var rest_url = pride_rest_project + this.prideAccession;
            $http.get(rest_url).then(function (response) {
                console.log($scope.containerLandingCtrl.prideAccession);
                // Build list of files from response
                var files = response.data.list;
                var fileList = {};
                for (var i = 0; i < files.length; i++) {
                    var fileType = files[i].fileType;
                    // Check if this file type already exists
                    if (typeof(fileList[fileType]) == 'undefined') {
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
        this.onPrideAddFiles = function () {
            // Add the checked files to the input list
            for (var fileType in this.prideFiles) {
                for (var i = 0; i < this.prideFiles[fileType].list.length; i++) {
                    if (this.prideFiles[fileType].list[i].checked) {
                        this.list.push({
                            url: this.prideFiles[fileType].list[i].downloadLink,
                            name: this.prideFiles[fileType].list[i].fileName,
                            action: 'copy'
                        });
                    }
                }
            }
            this.prideFiles = {};
            this.prideAccession = "";
        };
        this.onPrideMasterCheckbox = function (event) {
            // Get the file type that corresponds to this checkbox
            var fileType = event.target.attributes.data.nodeValue;
            var master_checked = this.prideFiles[fileType].checked;
            // Set all child checkboxes to the same as the master checkbox value
            for (var i = 0; i < this.prideFiles[fileType].list.length; i++) {
                this.prideFiles[fileType].list[i].checked = master_checked;
            }
        };
        this.showDialogs = {
            "upload": false,
            "import": false,
            "pride": false,
            "uniprot": false
        };
        this.inputs = [];
        this.newInputUrl = "";
        this.newInputName = "";
        this.importUrls = "";
        this.uniprotBatch = "";
        this.uniprotQuery = "";
        this.prideAccession = "";
        this.prideFiles = {};
        this.inputSourceButtonText = "Choose Input Source";
        this.activeInputMethod = null;
        this.uploadFiles = [];

}];