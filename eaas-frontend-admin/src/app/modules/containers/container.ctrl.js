module.exports = ['$rootScope', '$scope', '$sce', '$state','$http', '$stateParams', 'Environments', '$translate', 'Upload', 'localConfig', 'growl', '$uibModal',
    function ($rootScope, $scope, $sce, $state, $http, $stateParams, Environments, $translate, Upload, localConfig, growl, $uibModal) {
        var vm = this;

        Environments.get({envId: $stateParams.envId}).$promise.then(function(response) {
            vm.env = response;
        });

        $("#container-stopped").hide();

        window.eaasClient = new EaasClient.Client(localConfig.data.eaasBackendURL, $("#emulator-container")[0]);
        eaasClient.onError = function (message) {
            window.onbeforeunload = null;
            $state.go('error', {errorMsg: {title: "Error", message: message.error}});
        };

        window.onbeforeunload = function (e) {
            var dialogText = $translate.instant('MESSAGE_QUIT');
            e.returnValue = dialogText;
            return dialogText;
        };

        window.onunload = function () {
            window.onbeforeunload = null;
        };

        window.eaasClient.onEmulatorStopped = function () {
            $("#emulator-loading-container").hide();
            $("#container-running").hide();
            $("#container-stopped").show();
        };

        var params = {};

        vm.downloadLink = function () {
            window.open(window.eaasClient.getContainerResultUrl());
        };

        var confirmStartFn = function (inputs) {
            params.input_data = [];
            var input = {};
            input.size_mb = 512;
            input.destination = vm.env.input;
            input.content = inputs;
            params.input_data.push(input);

            $("#emulator-loading-container").show();
            eaasClient.startContainer($stateParams.envId, params).then(function () {
                $("#emulator-loading-container").hide();
                $("#container-running").show();

                eaasClient.connect().then(function () {
                    $("#emulator-container").show();

                    if (eaasClient.params.pointerLock === "true") {
                        growl.info($translate.instant('EMU_POINTER_LOCK_AVAILABLE'));
                        BWFLA.requestPointerLock(eaasClient.guac.getDisplay().getElement(), 'click');
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

        let modal = $uibModal.open({
                animation: true,
                template: require('./modals/container-run-dialog-modified.html'),
                controller:['$scope' , 'growl', function ($scope, growl) {
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
                                action: "copy"
                            });
                        }
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
                                data: {file: this.uploadFiles[i].file}
                            }).then(function (resp) {
                                // Push the uploaded file to the input list
                                console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
                                $scope.runContainerDlgCtrl.inputs.push({
                                    url: resp.data.userDataUrl,
                                    name: resp.config.destination,
                                    action: resp.config.action
                                });
                                $scope.runContainerDlgCtrl.uploadFiles = [];
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
                        console.log($scope.runContainerDlgCtrl.uniprotBatch);
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
                            console.log($scope.runContainerDlgCtrl.prideAccession);
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
                            $scope.runContainerDlgCtrl.prideFiles = fileList;
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
                }],
                controllerAs: "runContainerDlgCtrl"
            });

        modal.result.then({}, function () {
            $state.go('admin.standard-envs-overview', {
                showObjects: false,
                showContainers: true
            }, {reload: false});
        });

    }];

