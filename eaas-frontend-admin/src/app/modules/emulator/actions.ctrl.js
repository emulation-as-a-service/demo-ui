module.exports = ['$rootScope', '$scope', '$window', '$state', '$http', '$uibModal', '$stateParams', 'growl', 'localConfig', 'Objects',
                        '$timeout', '$translate', 'chosenEnv', 'helperFunctions', 'REST_URLS',
                        function ($rootScope, $scope, $window, $state, $http, $uibModal, $stateParams, growl, localConfig, Objects,
                        $timeout, $translate, chosenEnv, helperFunctions, REST_URLS) {
    var vm = this;
    vm.config = localConfig.data;
    vm.type = $stateParams.type;
    vm.emulator = $rootScope.emulator;
    $scope.chosenEnv = chosenEnv;


    vm.currentMediumLabel = null;

    var objectArchive = $stateParams.objectArchive ? $stateParams.objectArchive : "default";
    var objectId = $stateParams.softwareId ? $stateParams.softwareId : $stateParams.objectId;
    console.log(objectId);
    console.log(objectArchive);
    if(objectId) {
        Objects.get({archiveId: objectArchive, objectId: objectId}).$promise.then(function(response) {
            vm.mediaCollection = response.mediaItems;
                if(vm.mediaCollection)
                    vm.currentMediumLabel = vm.mediaCollection.file.length > 0 ? vm.mediaCollection.file[0].localAlias : null;
        });
    }

    if(typeof $rootScope.nativeConfig !== 'undefined')
        vm.isKVM = ($rootScope.nativeConfig.includes('-enable-kvm'));
    else
        vm.isKVM = false;

    if (chosenEnv.data)
    {
        vm.enablePrinting = chosenEnv.data.enablePrinting;
        vm.shutdownByOs = chosenEnv.data.shutdownByOs;
    }
    else
        vm.enablePrinting = false;

     vm.screenshot = async function() {
        let _header = localStorage.getItem('id_token') ? {"Authorization" : "Bearer " + localStorage.getItem('id_token')} : {};
        const pic = await fetch(window.eaasClient.getScreenshotUrl(), {
            headers: _header,
        });

        const picBlob = await pic.blob();
        window.open(URL.createObjectURL(picBlob));
    };


    var printSuccessFn = function(data) {
        $uibModal.open({
            animation: true,
            template: require('./modals/printed-list.html'),
            controller: ["$scope", function($scope) {
                this.printJobs = data;

                this.download = async function(label)
                {
                      let _header = localStorage.getItem('id_token') ? {"Authorization" : "Bearer " + localStorage.getItem('id_token')} : {};
                      const pdf = await fetch(window.eaasClient.downloadPrint(label),{
                         headers: _header,
                     });
                    const pdfBlob = await pdf.blob();
                    window.open(URL.createObjectURL(pdfBlob));
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

    vm.sendEsc = function() {
        window.eaasClient.sendEsc();
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
                    window.eaasClient.release();
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

    var eaasClientReadyTimer = function() {
        if ((window.eaasClient !== undefined) && (window.eaasClient.driveId !== undefined) && (window.eaasClient.driveId !== null)) {
            vm.driveId = window.eaasClient.driveId;
                return;
        }
        $timeout(eaasClientReadyTimer, 100);
    };
    $timeout(eaasClientReadyTimer);

    $scope.initTitles =function() {
        // check if titles were introduced already
        if (typeof window.$rootScope.idsData[0].title === "undefined") {
            $rootScope.idsData.forEach(function (idData) {
                idData.title = $rootScope.environments.find(element => element.envId === idData.env.data.environment).title;
            })
        }
    };

    vm.openChangeMediaDialog = function() {
        $uibModal.open({
            animation: true,
            template: require('./modals/change-media.html'),
            controller: ["$scope", function($scope) {
                this.chosen_medium_label = vm.currentMediumLabel;

                if(vm.mediaCollection != null)
                {
                  this.media = vm.mediaCollection.file;

                  this.mediumTypes = [];
                  for(var i = 0; i < this.media.length; i++)
                  {
                    if(!this.mediumTypes.includes(this.media[i].type))
                    {
                        this.mediumTypes.push(this.media[i].type);
                    }
                  }
                  console.log(this.mediumTypes);
                }

                this.entriesByMedia = function(m)
                {
                    var result = [];
                    for(var i = 0; i < this.media.length; i++)
                    {
                        if(this.media[i].type === m)
                             result.push(this.media[i]);
                    }
                    return result;
                }

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
                        vm.currentMediumLabel = newMediumLabel;
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
    };

    vm.switchEmulators = function (component)
    {
        $stateParams.envId = component.env.data.environment;
        var eaasClient = window.eaasClient;
        let loadingElement = $("#emulator-loading-connections");
        $("#emulator-container").hide();

        var attr = loadingElement.attr('width');
        loadingElement.attr("hidden", false);


        jQuery.when(
        window.eaasClient.disconnect(),
        jQuery.Deferred(function (deferred) {
            jQuery(deferred.resolve);
        })).done(function () {


            eaasClient.componentId = component.id;

            eaasClient.connect().then(function () {

                jQuery.when(
                    loadingElement.animate({width: "100%"}, 700),
                    jQuery.Deferred(function (deferred) {
                        jQuery(deferred.resolve);
                    })).done(function () {
                    loadingElement.attr("hidden", true);
                });


                $("#emulator-container").show();
                $rootScope.emulator.mode = eaasClient.mode;
                $scope.$apply();
                if (eaasClient.networkTcpInfo || eaasClient.tcpGatewayConfig) (async () => {
                    var url = new URL(eaasClient.networkTcpInfo.replace(/^info/, 'http'));
                    var pathArray = url.pathname.split('/');
                    document.querySelector("#emulator-info-container").append(
                        Object.assign(document.createElement("a"),
                            {textContent: `connect to: ${url.hostname} protocol ${pathArray[1]} port ${pathArray[2]}`,
                                href: `http://${url.hostname}:${pathArray[2]}`,
                                target: "_blank", rel: "noopener"}),
                        ' // ',
                        Object.assign(document.createElement("a"),
                            {textContent: "start eaas-proxy", href: await eaasClient.getProxyURL(),
                                target: "_blank",}),
                    );
                })();

                if (eaasClient.params.pointerLock === "true") {
                    growl.info($translate.instant('EMU_POINTER_LOCK_AVAILABLE'));
                    BWFLA.requestPointerLock(eaasClient.guac.getDisplay().getElement(), 'click');
                }

                // Fix to close emulator on page leave
                $scope.$on('$locationChangeStart', function (event) {
                    window.$rootScope.idsData = [];
                    eaasClient.release();

                });

            });

        });
    };

    vm.openNetworkDialog = function() {
        $uibModal.open({
            animation: true,
            template: require('../../../../../landing-page/src/app/modules/client/landing-page/modals/network.html'),
            resolve: {
                currentEnv: function () {
                    return chosenEnv.data;
                },
                localConfig: function () {
                    return localConfig;
                }
            },
            controller: "NetworkModalController as networkModalCtrl"
        });
    };

    vm.openDetachDialog = function() {
        $('#emulator-container').hide();
        $uibModal.open({
            animation: true,
            template: require('../../../../../landing-page/src/app/modules/client/landing-page/modals/detach.html'),
            resolve: {
                currentEnv: function () {
                    return chosenEnv.data;
                },
                localConfig: function () {
                    return localConfig;
                }
            },
            controller: "DetachModalController as detachModalCtrl"
        });
    };

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