module.exports = ['$rootScope', '$scope', '$window', '$state', '$http', '$uibModal', '$stateParams', 'growl', 'localConfig', 'mediaCollection',
                        '$timeout', '$translate', 'chosenEnv', 'helperFunctions', 'REST_URLS',
                        function ($rootScope, $scope, $window, $state, $http, $uibModal, $stateParams, growl, localConfig, mediaCollection, $timeout, $translate, chosenEnv, helperFunctions, REST_URLS) {
    var vm = this;

    vm.config = localConfig.data;
    vm.type = $stateParams.type;
    vm.emulator = $rootScope.emulator;


    console.log("$rootScope.nativeConfig  ", $rootScope.nativeConfig);

    if(typeof $rootScope.nativeConfig !== 'undefined')
        vm.isKVM = ($rootScope.nativeConfig.includes('-enable-kvm'));
    else
        vm.isKVM = false;

    vm.mode = $rootScope.emulator.mode;

    if (chosenEnv.data)
    {
        vm.enablePrinting = chosenEnv.data.enablePrinting;
        vm.shutdownByOs = chosenEnv.data.shutdownByOs;
    }
    else
        vm.enablePrinting = false;

     vm.screenshot = async function() {
        const pic = await fetch(window.eaasClient.getScreenshotUrl());
        //    , {headers : { authorization : "Bearer " +  localStorage.id_token}});

        const picBlob = await pic.blob();
        window.open(URL.createObjectURL(picBlob));
    };


    var printSuccessFn = function(data) {
        $uibModal.open({
            animation: true,
            template: require('./modals/printed-list.html'),
            controller: ["$scope", function($scope) {
                this.printJobs = data;

                this.download = function(label)
                {
                    window.open(window.eaasClient.downloadPrint(label));
                }
            }],
            controllerAs: "openPrintDialogCtrl"
        });
        // window.open(window.eaasClient.getPrintUrl());
    };


    vm.openPrintDialog = function ()
    {
        window.eaasClient.getPrintJobs(printSuccessFn);
    };

    vm.restartEmulator = function() {
        window.eaasClient.release();
        $state.reload();
    };

    vm.sendCtrlAltDel = function() {
        window.eaasClient.sendCtrlAltDel();
    };

    vm.stopEmulator = function () {
        $uibModal.open({
            animation: true,
            template: require('./modals/confirm-stop.html'),
            controller: ['$scope', function($scope) {
                this.confirmed = function()
                {
                    window.onbeforeunload = null;
                    // window.eaasClient.release();
                    $('#emulator-stopped-container').show();

                    if($stateParams.isTestEnv)
                    {
                        $http.post(localConfig.data.eaasBackendURL + REST_URLS.deleteEnvironmentUrl, {
                            envId: $stateParams.envId,
                            deleteMetaData: true,
                            deleteImage: true
                        }).then(function(response) {
                            if (response.data.status === "0") {
                                $state.go('admin.standard-envs-overview', {}, {reload: true});
                            }
                        });
                    }
                    else if ($stateParams.isNewObjectEnv || $stateParams.returnToObjects)
                        $state.go('admin.standard-envs-overview', {showObjects: true}, {reload: true});
                    else
                        $state.go('admin.standard-envs-overview', {}, {reload: true});
                };
            }],
            controllerAs: "confirmStopDialogCtrl"
        });
    };

    if(mediaCollection != null)
        var currentMediumLabel = mediaCollection.data.medium.length > 0 ? mediaCollection.data.medium[0].items[0].label : null;

    var eaasClientReadyTimer = function() {
        if ((window.eaasClient !== undefined) && (window.eaasClient.driveId !== undefined) && (window.eaasClient.driveId !== null)) {
            vm.driveId = window.eaasClient.driveId;
                return;
        }
        $timeout(eaasClientReadyTimer, 100);
    };
    $timeout(eaasClientReadyTimer);

    vm.openChangeMediaDialog = function() {
        $uibModal.open({
            animation: true,
            template: require('./modals/change-media.html'),
            controller: ["$scope", function($scope) {
                this.chosen_medium_label = currentMediumLabel;

                if(mediaCollection != null && mediaCollection.data != null)
                  this.media = mediaCollection.data.medium;
                this.isChangeMediaSubmitting = false;

                this.objectId = $stateParams.softwareId;
                if(!this.objectId)
                    this.objectId = $stateParams.objectId;

                this.changeMedium = function(newMediumLabel) {
                    if (newMediumLabel == null) {
                        growl.warning($translate.instant('JS_MEDIA_NO_MEDIA'));
                        return;
                    }

                    this.isChangeMediaSubmitting = true;

                    var postObj = {};
                    postObj.objectId = this.objectId;

                    postObj.driveId = window.eaasClient.driveId;
                    postObj.label = newMediumLabel;

                    var changeSuccsessFunc = function(data, status) {
                        growl.success($translate.instant('JS_MEDIA_CHANGETO') + newMediumLabel);
                        currentMediumLabel = newMediumLabel;
                        $scope.$close();
                        $("html, body").removeClass("wait");
                    };

                    $("html, body").addClass("wait");
                    eaasClient.changeMedia(postObj, changeSuccsessFunc);
                };
            }],
            controllerAs: "openChangeMediaDialogCtrl"
        });
    };

    vm.checkpoint = function ()
    {
        window.onbeforeunload = null;
        jQuery.when(
        window.eaasClient.disconnect(),
        jQuery.Deferred(function (deferred) {
            jQuery(deferred.resolve);
        })).done(function () {
            window.eaasClient.checkpoint({
                type: "newEnvironment",
                envId: $stateParams.envId,
            }).then(function (newEnvId) {
                    if (!newEnvId) {
                    growl.error(status, {title: "Snapshot failed"});
                    $state.go('admin.standard-envs-overview', {}, {reload: true});
                    window.eaasClient.release();
                }
                console.log("Checkpointed environment saved as: " + newEnvId);
                growl.success(status, {title: "New snapshot created."});
                window.eaasClient.release();
                $state.go('admin.edit-env', {envId: newEnvId, objEnv: $stateParams.returnToObjects}, {reload: true});
            });
        });
    }


    vm.openSaveEnvironmentDialog = function() {
        $('#emulator-container').hide();
        var saveDialog = function()
        {
            $uibModal.open({
                animation: true,
                template: require('./modals/save-environment.html'),
                controller: ["$scope", function($scope) {
                    this.type = $stateParams.type;
                    if(!this.type)
                        alert("ERROR: invalid type");

                    this.isSavingEnvironment = false;
                    this.isRelativeMouse = false;

                    this.saveEnvironment = function() {


                        this.isSavingEnvironment = true;
                        window.onbeforeunload = null;

                        var postReq = {};
                        postReq.type = this.type;
//                        if(postReq.type === 'objectEnvironment')
//                            postReq.embeddedObject = true;
                        postReq.envId = $stateParams.envId;
                        postReq.message = this.envDescription;
                        postReq.title = this.envName;
                        postReq.softwareId = $stateParams.softwareId;
                        postReq.objectId = $stateParams.objectId;
                        postReq.userId = $stateParams.userId;
                        postReq.isRelativeMouse = this.isRelativeMouse;

                        var snapshotDoneFunc = (data, status) => {
                            console.log("error status: " + status);

                            if(status === '1') {
                                console.log("error message: " + data.message);

                                snapshotErrorFunc(data.message);
                                return;
                            }

                            growl.success(status, {title: $translate.instant('JS_ACTIONS_SUCCESS')});
                            window.eaasClient.release();
                            if ($stateParams.isNewObjectEnv || $stateParams.returnToObjects)
                                $state.go('admin.standard-envs-overview', {showObjects: true}, {reload: true});
                            else
                                $state.go('admin.standard-envs-overview', {}, {reload: true});
                            $scope.$close();
                            window.isSavingEnvironment = false;
                        };

                        var snapshotErrorFunc = error => {
                            console.log("given error: " + error);
                            growl.error(error, {title: 'Error ' + error});
                            if ($stateParams.isNewObjectEnv || $stateParams.returnToObjects)
                                $state.go('admin.standard-envs-overview', {showObjects: true}, {reload: true});
                            else
                                $state.go('admin.standard-envs-overview', {}, {reload: true});
                            $scope.$close();
                            window.isSavingEnvironment = false;
                        };

                        window.eaasClient.snapshot(postReq, snapshotDoneFunc, snapshotErrorFunc);
                        $('#emulator-container').show();
                    };
                    this.showEmu = function() {
                        $('#emulator-container').show();
                    }



                }],
                controllerAs: "openSaveEnvironmentDialogCtrl"
            });
        };

        $uibModal.open({
            animation: true,
            template: require('./modals/confirm-snapshot.html'),
            controller: ["$scope", function($scope) {
                this.confirmed = function()
                {
                    saveDialog();
                };
                this.showEmu = function() {
                    $('#emulator-container').show();
                }
            }],
            controllerAs: "confirmSnapshotDialogCtrl"
        });

    }
    /*
    var closeEmulatorOnTabLeaveTimer = null;
    var leaveWarningShownBefore = false;
    var deregisterOnPageFocused = $pageVisibility.$on('pageFocused', function() {
        $timeout.cancel(closeEmulatorOnTabLeaveTimer);
    });

    var deregisterOnPageBlurred = $pageVisibility.$on('pageBlurred', function() {
        if (!leaveWarningShownBefore) {
            $window.alert($translate.instant('JS_EMU_LEAVE_PAGE'));
            leaveWarningShownBefore = true;
        }

        closeEmulatorOnTabLeaveTimer = $timeout(function() {
            vm.stopEmulator();
        }, 3 * 60 * 1000);
    });

    $scope.$on("$destroy", function() {
        deregisterOnPageFocused();
        deregisterOnPageBlurred();
    });
    */
}];