/*
 * Import third party libraries
 */

import angular from 'angular';
import 'angular-loading-bar';
import 'textangular';
import ngSanitize from 'textangular/dist/textAngular-sanitize';
import ngAnimate from 'angular-animate';
import ngCookies from 'angular-cookies';
import 'angular-ui-router';
import 'angular-ui-bootstrap';
import 'ui-select';
import 'angular-growl-v2';
import 'angular-ellipsis';
import 'angular-bootstrap-contextmenu';
import 'angular-translate';
import 'angular-translate-loader-static-files';
import 'angular-smart-table';
import 'chart.js';
import 'angular-chart.js';
import 'angular-ui-mask';
import 'angular-wizard';
import 'angular-jwt'
import 'bootstrap-ui-datetime-picker';
import 'sortablejs';
import 'sortablejs/ng-sortable';
import 'ng-file-upload';
import '../../node_modules/jquery.json-viewer/json-viewer/jquery.json-viewer.js';
import '../../node_modules/jquery.json-viewer/json-viewer/jquery.json-viewer.css';


/*
 * Import legacy emulator libraries
 */

var $ = require('jquery');
window.$ = window.jQuery = $; // publish jQuery into window scope for emulator libs
window.Popper = require('popper.js').default;
require('bootstrap');

const appendScript = function(scriptText) {
    let script   = document.createElement("script");
    script.type  = "text/javascript";
    script.text  = scriptText;
    document.body.appendChild(script);
};

import guacamolejs from 'raw-loader!../../../eaas-client/guacamole/guacamole.js';
appendScript(guacamolejs);

import eaasclientjs from 'raw-loader!../../../eaas-client/eaas-client.js';
appendScript(eaasclientjs);

/*
 * Import application specific modules
 */

import './modules/helpers.js';
import './modules/modules.js';

/*
 * Import stylesheets
 */
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';
import 'ui-select/dist/select.css';
import 'angular-growl-v2/build/angular-growl.css';
import 'angular-loading-bar/build/loading-bar.css';
import 'textangular/dist/textAngular.css'
import 'font-awesome/css/font-awesome.css';
import 'angular-wizard/dist/angular-wizard.css';
import '../../../eaas-client/guacamole/guacamole.css';
import '../../../eaas-client/eaas-client.css';
import './app.css';

export default angular.module('emilAdminUI', ['angular-loading-bar','ngSanitize', 'ngAnimate', 'ngCookies', 'ui.router', 'ui.bootstrap',
                                   'ui.mask', 'ui.select', 'angular-growl', 'smart-table', 'ng-sortable', 'pascalprecht.translate',
                                   'textAngular', 'mgo-angular-wizard', 'ui.bootstrap.datetimepicker', 'chart.js', 'emilAdminUI.helpers',
                                   'emilAdminUI.modules', 'angular-jwt', 'ngFileUpload'])

// .constant('kbLayouts', require('./../public/kbLayouts.json'))

    .component('environmentList', {
        templateUrl: 'partials/components/environmentList.html',
        bindings: {
            list: '=',
            searchPlaceHolder: '=',
            isObjEnv: '='
        }
    })

    .component('inputList', {
        templateUrl: 'partials/components/inputList.html',
        bindings: {
            list: '=',
            heading: '@',
            listEmptyNote: '@',
            inputPlaceholder: '@',
            addButtonText: '@'
        }
    })
    .component('containerInputList', {
        templateUrl: 'partials/components/containerInputList.html',
        bindings: {
            list: '=',
            heading: '@',
            listEmptyNote: '@',
            inputPlaceholder: '@',
            addButtonText: '@'
        }
    })

    .component('containerInputListModified', {
        templateUrl: 'partials/components/containerInputListModified.html',
        bindings: {
            list: '=',
            heading: '@',
            listEmptyNote: '@',
            inputPlaceholder: '@',
            addButtonText: '@',
            newInputUrl: '=',
            newInputName: '=',
            uploadFiles: '=',
            importUrls: '=',
            uniprotBatch: '=',
            uniprotQuery: '=',
            prideAccession: '=',
            prideFiles: '=',
            inputSourceButtonText: '=',
            onInputSourceSelection: '<',
            onImportFilesChosen: '<',
            onFileUpload: '<',
            onImportFromUrl: '<',
            onUniprot: '<',
            onUniprotBatchFileChosen: '<',
            onUniprotBatch: '<',
            onUniprotQuery: '<',
            onPrideListFiles: '<',
            onPrideAddFiles: '<',
            onPrideMasterCheckbox: '<',
            showDialogs: '='
        }
    })
    
    .directive('onInputFileChange', function() {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var onChangeHandler = scope.$eval(attrs.onInputFileChange);
                element.on('change', onChangeHandler);
                element.on('$destroy', function() {
                    element.off();
                });
            }
        };
    })

.run(function($rootScope, $state) {
    $rootScope.emulator = {state : ''};

    $rootScope.chk = {};
    $rootScope.chk.transitionEnable = true;
    $rootScope.waitingForServer = true;

//        localStorage.setItem('id_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXUyJ9.eyJpc3MiOiJhdXRoMCJ9.AbIJTDMFc7yUa5MhvcP03nJPyCPzZtQcGEp-zWfOkEE');
//       localStorage.removeItem('id_token');


    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        if (!$rootScope.chk.transitionEnable) {
            event.preventDefault();
            // $scope.toState = toState;
            // $scope.open();
            //  console.log("prevent: $stateChangeStart: "+toState.name);
        }
//            else {
//                console.log("$stateChangeStart: "+toState.name);
//            }
    });
})



.config(['$stateProvider', '$urlRouterProvider', 'growlProvider', '$httpProvider', '$translateProvider', '$provide', 'jwtOptionsProvider', 'cfpLoadingBarProvider', '$locationProvider',
        function($stateProvider, $urlRouterProvider, growlProvider, $httpProvider, $translateProvider, $provide, jwtOptionsProvider, cfpLoadingBarProvider, $locationProvider) {
    /*
     * Use ng-sanitize for textangular, see https://git.io/vFd7y
     */
    $provide.decorator('taOptions', ['taRegisterTool', '$delegate', function(taRegisterTool, taOptions) {
        taOptions.forceTextAngularSanitize = false;
        return taOptions;
    }]);

    $locationProvider.hashPrefix('');

    cfpLoadingBarProvider.includeSpinner = false;
    cfpLoadingBarProvider.includeBar = true;
    cfpLoadingBarProvider.loadingBarTemplate = '<div id="loading-bar"><div class="bar"><div class="peg"></div></div></div>';

    /*
     * Internationalization
     */
    $translateProvider.useStaticFilesLoader({
      prefix: 'locales/',
      suffix: '.json'
    });

    // escape HTML in the translation
    $translateProvider.useSanitizeValueStrategy('escape');

    $translateProvider.registerAvailableLanguageKeys(['en', 'de'], {
      'en_*': 'en',
      'de_*': 'de'
    });

    // automatically choose best language for user
    $translateProvider.determinePreferredLanguage();
    // $translateProvider.preferredLanguage('en');

    var httpResponseErrorModal = null;

    // Please note we're annotating the function so that the $injector works when the file is minified
    jwtOptionsProvider.config({
      whiteListedDomains: "localhost",
      tokenGetter: [ function() {
        return localStorage.getItem('id_token');
      }]
    });


    $httpProvider.interceptors.push('jwtInterceptor');
    // Add a global AJAX error handler
    $httpProvider.interceptors.push(function($q, $injector, $timeout, $rootScope) {
        return {
            responseError: function(rejection) {
                     if ($rootScope.waitingForServer && (rejection.status === 0 || rejection.status === 404)) {
                    var $http = $injector.get('$http');

                    if (httpResponseErrorModal === null) {
                        httpResponseErrorModal = $injector.get('$uibModal').open({
                            animation: true,
                            backdrop: 'static',
                            templateUrl: 'partials/server-error-dialog.html'
                        });
                    }

                    var deferred = $q.defer();

                    $timeout(function() {
                        deferred.resolve(true);
                    }, 5000);

                    return deferred.promise.then(function() {
                        var req = $http(rejection.config);
                        req.then(function() {
                            $rootScope.waitingForServer = false;
                            if (httpResponseErrorModal !== null) {
                                httpResponseErrorModal.close();
                                httpResponseErrorModal = null;
                            }
                        });
                        return req;
                    });
                }
                else {
                     $injector.get('$state').go('error', {errorMsg: {title: "Server Error", message: rejection}});
                     return $q.reject(rejection);
                }
          }
       };
    });

    // For any unmatched url
    $urlRouterProvider.otherwise("/admin/dashboard");

    // Now set up the states
    $stateProvider
        .state('error', {
            url: "/error",
            templateUrl: "partials/error.html",
            params: {
                errorMsg: {title: "", message: ""}
            },
            controller: ['$state', '$stateParams', function($state, $stateParams) {
                if ($stateParams.errorMsg.title === "" && $stateParams.errorMsg.title === "") {
                    $state.go('admin.standard-envs-overview');
                    return;
                }

                this.errorMsg = $stateParams.errorMsg;
            }],
            controllerAs: "errorCtrl"
        })
        .state('admin', {
            abstract: true,
            url: "/admin",
            template: require('./modules/base/base.html'),
            resolve: {
                localConfig: ($http) => $http.get("config.json"),
                kbLayouts: ($http) => $http.get("kbLayouts.json"),
                buildInfo: ($http, localConfig, REST_URLS) => $http.get(localConfig.data.eaasBackendURL + REST_URLS.buildVersionUrl),

                environmentList: ($http, localConfig, helperFunctions, REST_URLS) =>
                    $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getAllEnvsUrl, "base")),

                objectEnvironmentList: ($http, localConfig, helperFunctions, REST_URLS) =>
                    $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getAllEnvsUrl, "object")),

                containerEnvironmentList: function($http, localConfig, helperFunctions, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getAllEnvsUrl, "container"))

                },
                softwareList: function($http, localConfig, REST_URLS) {
                                    return $http.get(localConfig.data.eaasBackendURL + REST_URLS.getSoftwarePackageDescriptions);
                                }

            },
            controller: "BaseController as baseCtrl"
        })

        .state('admin.dashboard', {
            url: "/dashboard",
            resolve: {
                clusters: function($http, localConfig) {
                    return $http.get(localConfig.data.dashboardClusterAPIBaseURL, {
                        headers: {
                            'X-Admin-Access-Token': localConfig.data.dashboardAccessToken,
                            'Cache-Control': 'no-cache'
                        }
                    });
                },
                allClusterDetails: function ($q, $http, localConfig, clusters) {
                    return $q.all(clusters.data.map(function (cluster) {
                        return $http.get(localConfig.data.dashboardClusterAPIBaseURL + cluster, {
                                headers: {
                                    'X-Admin-Access-Token': localConfig.data.dashboardAccessToken,
                                    'Cache-Control': 'no-cache'
                            }
                        })
                    }));
                }
            },
            views: {
                'wizard': {
                    template: require('./modules/dashboard/dashboard.html'),
                    controller: "DashboardController as dashboardCtrl"
                }
            }
        })
        .state('admin.sw-overview', {
            url: "/sw-overview",
            resolve: {
                softwareList: ($http, localConfig, REST_URLS) =>
                    $http.get(localConfig.data.eaasBackendURL + REST_URLS.getSoftwarePackageDescriptions)
            },
            views: {
                'wizard': {
                    template: require('./modules/software/overview.html'),
                    controller: "SoftwareOverviewController as swOverviewCtrl"
                }
            }
        })
        .state('admin.sw-ingest', {
            url: "/sw-ingest",
            params: {
                swId: "-1"
            },
            resolve: {
                objectList: function($stateParams, $http, localConfig, helperFunctions, REST_URLS) {
                    // Don't fetch list for edit
                    if ($stateParams.swId != "-1") {
                        return null;
                    }
                    if("softwareArchiveId" in localConfig.data)
                    {
                        return $http.get(localConfig.data.eaasBackendURL +
                            helperFunctions.formatStr(REST_URLS.getSoftwareListURL, localConfig.data.softwareArchiveId));
                    }
                    else {
                        return $http.get(localConfig.data.eaasBackendURL + REST_URLS.getObjectListURL);
                    }
                },
                osList : ($http) => $http.get("osList.json"),

                softwareObj: function($stateParams, $http, localConfig, helperFunctions, REST_URLS) {
                    // return empty object for new software
                    if ($stateParams.swId === "-1") {
                        return {
                            data: {
                                objectId: null,
                                licenseInformation: "",
                                allowedInstances: -1,
                                isOperatingSystem: false,
                                nativeFMTs: [],
                                importFMTs: [],
                                exportFMTs: [],
                            }
                        };
                    }

                    return $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getSoftwareObjectURL, $stateParams.swId));
                },
            },
            views: {
                'wizard': {
                    template: require('./modules/software/ingest.html'),
                    controller: "SoftwareIngestController as swIngestCtrl"
                }
            }
        })
        .state('admin.new-image', {
            url: "/new-image",
            resolve: {
                systemList: function($http, localConfig, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + REST_URLS.getEnvironmentTemplates);
                },
                softwareList: function($http, localConfig, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + REST_URLS.getSoftwarePackageDescriptions);
                }
            },
            views: {
                'wizard': {
                    template: require('./modules/environments/createOrImport.html'),
                    controller: "CreateOrImportEnvironmentController as newImageCtrl"
                }
            }
        })
        .state('admin.new-container', {
            url: "/new-container",
            resolve: {
                runtimeList: function($http, localConfig, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + REST_URLS.getOriginRuntimeList);
                }
            },
            views: {
                'wizard': {
                    template: require('./modules/containers/new-container-wizard.html'),
                    controller:  "NewContainerController as newContainerCtrl"
                }
            }
        })
        .state('admin.synchronize-image-archives', {
          url: "/synchronize-image-archives",
          views: {
              'wizard': {
                  template: require('./modules/sync/synchronize-image-archives.html'),
                  controller: "SyncImageArchivesController as synchronizeImageArchivesCtrl"
              }
          }
        })
        .state('admin.object-overview', {
            url: "/objects",
            resolve: {
                localConfig: ($http) => $http.get("config.json"),
                objectList: ($http, localConfig, REST_URLS) =>
                     $http.get(localConfig.data.eaasBackendURL + REST_URLS.getObjectListURL)
            },
            views: {
                'wizard': {
                    template: require("./modules/objects/overview.html"),
                    controller: "ObjectsOverviewController as objectOverviewCtrl",
                }
            }
        })
        .state('admin.new-object', {
            url: "/new-object",
            resolve: {
                repositoriesList : ($http, localConfig, REST_URLS)  =>  $http.get(localConfig.data.eaasBackendURL + REST_URLS.repositoriesListUrl)
            },
            views: {
                'wizard': {
                    template: require('./modules/objects/import.html'),
                    controller: "ObjectsImportController as uploadCtrl"
                }
            }
         })
        .state('admin.user-session-overview', {
            url: "/user-sessions",
            resolve: {
                localConfig: function($http) {
                    return $http.get("config.json");
                },
                sessionList: function($http, localConfig, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + REST_URLS.userSessionListUrl);
                }
            },
            views: {
                'wizard': {
                    template: require('./modules/environments/sessions.html'),
                    controller: "UserSessionsListController as sessionListCtrl"
                }
            }
        })
        .state('admin.standard-envs-overview', {
            url: "/standard-envs-overview",
            params: {
                showObjects: false,
                showContainers: false
            },
            resolve : {

            },
            views: {
                'wizard': {
                    template: require('./modules/environments/overview.html'),
                    controller: "EnvironmentsOverviewController as standardEnvsOverviewCtrl"
                }
            }
        })
        .state('admin.metadata', {
            url: "/metadata",
            resolve : {
                oaiHarvesterList: ($http, localConfig, helperFunctions, REST_URLS) =>
                    $http.get(localConfig.data.oaipmhServiceBaseUrl + "harvesters")
            },
            views: {
                'wizard': {
                    template: require('./modules/metadata/metadata.html'),
                    controller: "MetadataController as metadataCtrl"
                }
            }
        })
        .state('admin.edit-env', {
            url: "/edit-env",
            params: {
                envId: null,
                objEnv: false
            },
            resolve: {
                objectDependencies: ($http, localConfig, $stateParams, helperFunctions, REST_URLS) =>
                     $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getObjectDependencies, $stateParams.envId)),
                operatingSystemsMetadata : ($http, localConfig, REST_URLS) =>
                     $http.get(localConfig.data.eaasBackendURL + REST_URLS.getOperatingSystemsMetadata)
            },
            views: {
                'wizard': {
                    template: require('./modules/environments/edit.html'),
                    controller: "EditEnvironmentController as editEnvCtrl"
                }
            }
        })
        .state('admin.edit-container', {
            url: "/edit-container",
            params: {
                envId: null,
            },
            views: {
                'wizard': {
                    template: require('./modules/containers/edit-container.html'),
                    controller: "EditContainerController as editContainerCtrl"
                }
            }
        })
        .state('admin.emulator', {
            url: "/emulator",
            resolve: {
                mediaCollection: function($http, $stateParams, localConfig, helperFunctions, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL +
                        (($stateParams.softwareId != null) ?
                            helperFunctions.formatStr(REST_URLS.mediaCollectionURL, $stateParams.softwareId) :
                            helperFunctions.formatStr(REST_URLS.mediaCollectionURL, $stateParams.objectId)));
                },
                chosenEnv: function($http, $stateParams, localConfig, helperFunctions, REST_URLS) {
                    if($stateParams.type != "saveImport" && $stateParams.type != 'saveCreatedEnvironment')
                        return $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getEmilEnvironmentUrl, $stateParams.envId));
                    else
                        return {};
                }
            },
            params: {
                envId: null,
                type: 'saveRevision',
                softwareId: null,
                isUserSession: false,
                objectId: null,
                userId: null,
                returnToObjects: false
            },
            views: {
                'wizard': {
                    template: require('./modules/emulator/emulator.html'),
                    controller: "EmulatorStartController as startEmuCtrl"
                },
                'actions': {
                    template: require('./modules/emulator/actions.html'),
                    controller: "EmulatorActionsController as actionsCtrl"
                }
            }
        })

        .state('admin.container', {
            url: "/container",
            resolve: {
            },
            params: {
                envId: null,
                modifiedDialog: false,
            },
            views: {
                'wizard': {
                    template: require('./modules/containers/container.html'),
                    controller: "StartContainerController as startContainerCtrl"
                },
                'actions': {
                    template: require('./modules/containers/container-actions.html'),
                    controller: "ContainerActionsController as containerActionsCtrl"
                }
            }
        })

        .state('admin.edit-object-characterization', {
            url: "/edit-object-characterization?objectId",
            resolve: {
                objEnvironments: ($stateParams, $http, localConfig, helperFunctions, REST_URLS) =>
                    $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.objectEnvironmentsUrl, $stateParams.objectId, "false", "false")),
                metadata : ($stateParams, $http, localConfig, helperFunctions, REST_URLS) =>
                    $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.metadataUrl, $stateParams.objectId))
            },
            views: {
                'wizard': {
                    template: require('./modules/characterization/edit-object-characterization.html'),
                    controller: "EditObjectCharacterizationController as editObjectCharacterizationCtrl"
                }
            }
        })

        .state('admin.handles', {
            url: "/handles",
            resolve: {
                localConfig: ($http) => $http.get("config.json"),
                handles: ($http, localConfig, REST_URLS) => $http.get(localConfig.data.eaasBackendURL + REST_URLS.getHandleList)
            },
            views: {
                'wizard': {
                    template: require('./modules/handle/overview.html'),
                    controller: "HandleOverviewController as handleOverview",
                }
            }
        })
        .state('admin.edit-handle', {
            url: "/edit-handle?handle",
            resolve: {
                handleValue: ($stateParams, $http, localConfig, helperFunctions, REST_URLS) =>
                     $http.get(localConfig.data.eaasBackendURL + REST_URLS.getHandleValue + $stateParams.handle)
            },
            views: {
                'wizard': {
                    template: require('./modules/handle/edit.html'),
                    controller: "EditHandleController as handleOverview"
                }
            }
    });

    growlProvider.globalTimeToLive(5000);
}]);
