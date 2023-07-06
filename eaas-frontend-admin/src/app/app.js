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
import 'angular-auth0/src';
import 'angular-chart.js';
import 'angular-ui-mask';
import 'angular-wizard';
import 'angular-jwt'
import ngResource from 'angular-resource'
import 'bootstrap-ui-datetime-picker';
import 'sortablejs';
import 'sortablejs/ng-sortable';
import 'ng-file-upload';
import { saveAs } from 'file-saver';

import '../../node_modules/jquery.json-viewer/json-viewer/jquery.json-viewer.js';
import '../../node_modules/jquery.json-viewer/json-viewer/jquery.json-viewer.css';

import * as agGrid from 'ag-grid-community';
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-balham.css";
import "ag-grid-community/dist/styles/ag-theme-balham-dark.css";
import "ag-grid-community/dist/styles/ag-theme-blue.css";
import "ag-grid-community/dist/styles/ag-theme-bootstrap.css";
import "ag-grid-community/dist/styles/ag-theme-material.css";
import "ag-grid-community/dist/styles/ag-theme-fresh.css";

import {EaasImages} from "./lib/images.js";
import {_fetch} from './lib/utils.js';

import networkingTemplate from './modules/environments/templates/edit-networking-template.html';
import uiOptionsTemplate from './modules/environments/templates/ui-options.html';
import qemuOptionsTemplate from './modules/environments/templates/emulators/qemu-options.html';
import macemuOptionsTemplate from './modules/environments/templates/emulators/macemu-options.html';
import amigaOptionsTemplate from './modules/environments/templates/emulators/amiga-options.html';
import browserOptionsTemplate from './modules/environments/templates/emulators/browser-options.html';
import drivesOverviewTemplate from './modules/environments/templates/drives/overview.html';

agGrid.initialiseAgGridWithAngular1(angular);

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

import {Client, hideCursor, showCursor, requestPointerLock} from '../../../eaas-client/eaas-client.js';
import {textAngularComponent} from 'EaasLibs/javascript-libs/text-angularjs.component.js';
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
import '../../../eaas-client/eaas-client.css';

import './app.scss';

/**
 * angular 8 modules
 */
import {downgradeComponent} from '@angular/upgrade/static';
import {AddNetworkComponent} from '../app2/components/network-environments/add/add-network-env.component.ts';
import {EditNetworkComponent} from "../app2/components/network-environments/edit/edit-network-env.component.ts";
import {StartedNetworkOverview} from "EaasLibs/network-environments/run/started-network-overview.component.ts";

import { EaasClientHelper } from './lib/eaasClientHelper.js';

export default angular.module('emilAdminUI', ['angular-loading-bar','ngSanitize', 'ngAnimate', 'ngCookies', 'ngResource', 'ui.router', 'ui.bootstrap',
                                   'ui.mask', 'ui.select', 'angular-growl', 'smart-table', 'ng-sortable', 'pascalprecht.translate',
                                   'textAngular', 'mgo-angular-wizard', 'ui.bootstrap.datetimepicker', 'chart.js', 'emilAdminUI.helpers',
                                   'emilAdminUI.modules', 'angular-jwt', 'ngFileUpload', 'agGrid', 'auth0.auth0'])

    .constant('localConfig', (() => {
        const params = new URLSearchParams(location.hash.slice(1));
        
        const token_type = params.get("token_type");
        // TODO: Check `state`!
        const state = params.get("state");
        // TODO: Save `session_state`, handle (unattended) renewal of token
        const session_state = params.get("session_state");
        const expires_in = Number(params.get("expires_in"));
        const id_token = params.get("id_token");
        const access_token = params.get("access_token");

        if (token_type === "bearer" || token_type === "Bearer") {
            // TODO: Get `exp` from JWT instead of using `expires_in`?
            const expires_at = Date.now() + expires_in * 1000;
            Object.assign(localStorage, {id_token, expires_at});
            Object.assign(localStorage, {access_token, expires_at});
            console.log({id_token, expires_at});
            console.log({access_token, expires_at});
        }

        const xhr = new XMLHttpRequest();
        xhr.open("GET", localStorage.eaasConfigURL || "config.json", false);
        xhr.send();
        var ret = {};
        ret.data = JSON.parse(xhr.responseText);
        return ret;
    })())

    .directive(
        'addNetworkEnvironment',
        downgradeComponent({component: AddNetworkComponent})
    )
    .directive(
        'startedNetworkEnvironmentOverview',
        downgradeComponent({component: StartedNetworkOverview})
    )
    .directive(
        'editNetworkEnvironment',
        downgradeComponent({component: EditNetworkComponent})
    )
    .component('descriptionText', textAngularComponent)
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
    .component('networkingTemplate', {
        template: networkingTemplate,
        bindings: {
            networking: '=',
            isContainer: '<'
        }
    })

    .component('uiOptionsTemplate', {
        template: uiOptionsTemplate,
        bindings: {
            uiOptions: '=',
        }
    })

    .component('qemuOptions', {
        template: qemuOptionsTemplate,
        bindings: {
            args: '=',
            onUpdate: '&'
        }
    })

    .component('macemuOptions', {
        template: macemuOptionsTemplate,
        controller: ["Images", function(Images) {
            var vm = this;
            vm.romList = [];
            
            Images.roms().then((result) => {
                vm.romList = result;
                console.log(vm.romList);
            }, (e) => {
                throw new Error(e);
            });
        }],
        bindings: {
            args: '=',
            onUpdate: '&',
        }
    })

    .component('amigaOptions', {
        template: amigaOptionsTemplate,
        controller: ["Images", function(Images) {
            var vm = this;
            vm.romList = [];
            
            Images.roms().then((result) => {
                vm.romList = result;
                console.log(vm.romList);
            }, (e) => {
                throw new Error(e);
            });
        }],
        bindings: {
            args: '=',
            onUpdate: '&',
        }
    })

    .component('browserOptions', {
        template: browserOptionsTemplate,
        controller: function() {
            let vm = this;
            vm.$onInit = function() {
                vm.onUpdate();
            };
        },
        bindings: {
            args: '=',
            onUpdate: '&',
        }
    })

    .component('drivesOverview', {
        template: drivesOverviewTemplate,
        bindings: {
            drives: "<",
            select: '&',
            render: '&',
            context: '<',
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

.run(function($rootScope, $state, $http, authService, localConfig) {

    $rootScope.emulator = {
        state : '',
        mode : null,
        detached : false
    };

    $rootScope.chk = {};
    $rootScope.chk.transitionEnable = true;
    $rootScope.waitingForServer = true;

    if(localConfig.data.id_token)
    {
        console.log(localConfig.data.id_token);
        localStorage.setItem('id_token', localConfig.data.id_token);
    }


    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        if (!$rootScope.chk.transitionEnable) {
            event.preventDefault();
            $scope.toState = toState;
        //    $scope.open();
            console.log("prevent: $stateChangeStart: "+toState.name);
        }
            else {
                console.log("$stateChangeStart: "+toState.name);
            }
    });

    /*
     const auth0config = localConfig.data.auth0Config || {};
     if(auth0config.AUTH_CONFIGURED) {
            console.log("authService", auth0config);
            await authService.handleAuthentication();
      }
    */
})

.service('authService', function($state, angularAuth0, $timeout, localConfig) {
      const auth0config = localConfig.data.auth0Config || {};
      this.login = function (data) {
          data.redirectUri = String( new URL(auth0config.REDIRECT_URL, location));
          angularAuth0.authorize(data);
      };

      const nodeCb = (func) => new Promise((resolve, reject) =>
        func((err, data) => err == null ? resolve(data) : reject(err)));

      this.tryGetRenewedToken = async function () {
        const redirectUri = String(new URL("auth-callback.html", new URL(auth0config.REDIRECT_URL, location)));
        // https://auth0.github.io/auth0.js/global.html#renewAuth
        return nodeCb(cb => angularAuth0.renewAuth({
            redirectUri,
        }, cb));
      };

     this.logout = function () {
           // Remove tokens and expiry time from localStorage
           localStorage.removeItem('access_token');
           localStorage.removeItem('id_token');
           localStorage.removeItem('expires_at');
           document.cookie.split(";").forEach(function(c) { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
           document.location = `/auth/realms/master/protocol/openid-connect/logout?${new URLSearchParams({redirect_uri: new URL("/admin", location)})}`;
     }

     // TODO: Should rather be async but probably not supported by jwtOptionsProvider/tokenGetter
     this.getToken = function () {
        return localStorage.getItem('id_token');
     };

     this.isAuthenticated = function() {
           // Check whether the current time is past the
           // access token's expiry time
           let expiresAt = JSON.parse(localStorage.getItem('expires_at'));
           return new Date().getTime() < expiresAt;
     }

     this.updateToken = function ({id_token, access_token, expires_at, expires_in}) {
        expires_in = Number(expires_in);
        if (expires_at == null) {
            expires_at = Date.now() + expires_in * 1000;
        }
        expires_at = Number(expires_at);
        Object.assign(localStorage, {id_token, expires_at});
        Object.assign(localStorage, {access_token, expires_at});
        console.debug("Will try to renew OAuth token in", expires_at - Date.now() - 60 * 1000);
        setTimeout(async () => {
            console.debug("Trying to renew OAuth token");
            const newToken = await this.tryGetRenewedToken();
            console.debug("New OAuth token", newToken);
            if (newToken == null) throw new Error("Could not renew OAuth token");
            this.updateToken({
                id_token: newToken.idToken,
                access_token: newToken.accessToken,
                expires_in: newToken.expiresIn,
            });
        }, expires_at - Date.now() - 60 * 1000);
     };

     if (localStorage.getItem("expires_in") != null) this.updateToken(localStorage);
})

.factory('Objects', function($http, $resource, localConfig) {
   return $resource(localConfig.data.eaasBackendURL + 'objects/:archiveId/:objectId', {archiveId : "default"});
})

.factory('Environments', function($http, $resource, localConfig) {
   return $resource(localConfig.data.eaasBackendURL + '/environment-repository/environments/:envId');
})
.factory('EmilNetworkEnvironments', function($http, $resource, localConfig) {
    return $resource(localConfig.data.eaasBackendURL + 'network-environments/:envId');
})
.factory('Images', function(localConfig, authService) {
    return new EaasImages(localConfig.data.eaasBackendURL, () => authService.getToken());
})
.factory("EaasClientHelper", function(localConfig) {
    return new EaasClientHelper(localConfig.data.eaasBackendURL, () => authService.getToken());
})

.config(['$stateProvider',
        '$urlRouterProvider',
        'growlProvider',
        '$httpProvider',
        '$translateProvider',
        '$provide',
        'jwtOptionsProvider',
        'cfpLoadingBarProvider',
        '$locationProvider',
        'angularAuth0Provider',
        'localConfig',
function($stateProvider,
        $urlRouterProvider,
        growlProvider,
        $httpProvider,
        $translateProvider,
        $provide,
        jwtOptionsProvider,
        cfpLoadingBarProvider,
        $locationProvider,
        angularAuth0Provider,
        localConfig
) {
    const auth0config = localConfig.data.auth0Config || {};
    angular.lowercase = angular.$$lowercase;
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

    $translateProvider.fallbackLanguage('en');

    // automatically choose best language for user
    $translateProvider.determinePreferredLanguage();
    $translateProvider.preferredLanguage('en');

    var httpResponseErrorModal = null;

    angularAuth0Provider.init({
        clientID: auth0config.CLIENT_ID || "invalid",
        domain: auth0config.DOMAIN || "invalid.invalid",
        responseType: 'token id_token',
        _sendTelemetry: false,
        overrides: {
            // The following values can usually be found in </.well-known/openid-configuration>:
            __jwks_uri: auth0config.jwks_uri,
            // HACK: Canonicalize URL to get rid of default ports
            __token_issuer: String(new URL(auth0config.issuer || "https://invalid.invalid")),
        },
    });

    // Please note we're annotating the function so that the $injector works when the file is minified
    jwtOptionsProvider.config({
      whiteListedDomains: [new URL(localConfig.data.eaasBackendURL, location).hostname],
      urlParam: "access_token",
      tokenGetter: [ 'options', function(options) {
        if (options && options.url.substr(options.url.length - 5) == '.html') {
            return null;
        }
        if (options && options.url.substr(options.url.length - 5) == '.json') {
            return null;
        }
        // TODO: Should be `authService.getToken()` but creates a dependency problem
        return localStorage.getItem('id_token');
      }]
    });

    $httpProvider.interceptors.push('jwtInterceptor');

    // Add a global AJAX error handler
    $httpProvider.interceptors.push(function($q, $injector, $timeout, $rootScope) {
        return {
            responseError: function(rejection) {

                if (rejection && (rejection.status === 401 || rejection.status === 403)) {
                     $injector.get('$state').go('login');
                     return $q.reject(rejection);
                } 
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
            controller: ['$state', '$stateParams', 'localConfig', '$rootScope', 
                function($state, $stateParams, localConfig, $rootScope) {
                if ($stateParams.errorMsg.title === "" && $stateParams.errorMsg.title === "") {
                    $state.go('admin.standard-envs-overview');
                    return;
                }
                $rootScope.loaded = true;
                this.downloadLogUrl = localConfig.data.eaasBackendURL + "error-report";
                this.errorMsg = $stateParams.errorMsg;
            }],
            controllerAs: "errorCtrl"
        })
        .state('unauthorized', {
            url: "/unauthorized",
            templateUrl: "partials/not-authorized.html",
            controller: [ 
                function() {
            }],
            controllerAs: "nonAuthorizedCtrl"
        })
        .state('login', {
            url: "/login",
            templateUrl: "partials/login.html",
            controller: function(authService, $rootScope) {
                var vm = this;
                vm.authService = authService;
                $rootScope.loaded = true;
                vm.authService.login({
                    connection: 'Username-Password-Authentication',
                    scope: 'openid profile email'
                });
            },
            controllerAs: "loginCtrl"
        })
        .state('admin', {
            abstract: true,
            url: "/admin",
            template: require('./modules/base/base.html'),
            resolve: {
                init: ($http, localConfig) => $http.get(localConfig.data.eaasBackendURL + "/admin/init"),
                buildInfo: ($http, localConfig, REST_URLS) => $http.get(localConfig.data.eaasBackendURL + REST_URLS.buildVersionUrl),
                kbLayouts: ($http) => $http.get("kbLayouts.json"),
                softwareList: function($http, localConfig, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + REST_URLS.getSoftwarePackageDescriptions)
                },
                userInfo: ($http, localConfig, REST_URLS) => $http.get(localConfig.data.eaasBackendURL + REST_URLS.getUserInfo),
                operatingSystemsMetadata : ($http, localConfig) =>
                        $http.get(`${localConfig.data.eaasBackendURL}/environment-repository/os-metadata`),

            },
            controller: "BaseController as baseCtrl"
        })
        .state('admin.dashboard', {
            url: "/dashboard",
            resolve: {
                clusters: ($http, localConfig) => $http.get(localConfig.data.dashboardClusterAPIBaseURL),
                descriptions: function ($q, $http, localConfig, clusters) {
                    return $q.all(clusters.data.map(function (cluster) {
                        return $http.get(localConfig.data.dashboardClusterAPIBaseURL + cluster + '/description')
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

            },
            views: {
                'wizard': {
                    template: require('./modules/software/overview.html'),
                    controller: "SoftwareOverviewController as swOverviewCtrl"
                }
            }
        })
        .state('admin.create-machine', {
            url: "/create",
            resolve: {
                systemList: function($http, localConfig) {
                    return $http.get(localConfig.data.eaasBackendURL + "environment-repository/templates");
                },
                patches: function($http, localConfig, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + REST_URLS.getPatches);
                }
            },
            views: {
                'wizard': {
                    template: require('./modules/environments/create.html'),
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
                archives: ($http, localConfig, REST_URLS)  =>  $http.get(localConfig.data.eaasBackendURL + REST_URLS.repositoriesListUrl),
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
            url: "/environments",
            params: {
                showObjects: false,
                showContainers: false,
                showNetworkEnvs: false
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
                oaiHarvesterList: ($http, localConfig) =>
                    $http.get(localConfig.data.oaipmhServiceBaseUrl + "harvesters"),
                apiKey: ($http, localConfig) => $http.get(localConfig.data.eaasBackendURL + "admin/apikey")
            },
            views: {
                'wizard': {
                    template: require('./modules/metadata/metadata.html'),
                    controller: "MetadataController as metadataCtrl"
                }
            }
        })
        .state('admin.edit-env', {
            url: "/environment?envId",
            params: {
                envId: null,
                objEnv: false
            },
            resolve: {
                objectDependencies: ($http, localConfig, $stateParams, helperFunctions, REST_URLS) =>
                     $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getObjectDependencies, $stateParams.envId)),
                nameIndexes : ($http, localConfig, REST_URLS) =>
                     $http.get(localConfig.data.eaasBackendURL + REST_URLS.getNameIndexes)
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
            resolve: {
                emilEnvironments : (Environments) => Environments.query().$promise
            },
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
        .state('admin.emuView', {
            url: "/emulator",
            resolve: {
                chosenEnv: function($stateParams, Environments, EmilNetworkEnvironments) {
                    if($stateParams.isNetworkEnvironment){
                        return EmilNetworkEnvironments.get({envId: $stateParams.envId}).$promise;
                    }   
                    else
                        return null;
                },
                eaasClient: (localConfig, authService, $cookies) => new Client(localConfig.data.eaasBackendURL, 
                    () => authService.getToken(), 
                    { kbLayoutPrefs: $cookies.getObject('kbLayoutPrefs')})
            },
           
            params: {
                components: [],
                type: 'saveRevision',
                clientOptions: null
                 /*
                envId: null,
                isNetworkEnvironment: null,                
                type: 'saveRevision',
                softwareId: null,
                isUserSession: false,
                objectId: null,
                objectArchive: null,
                userId: null,
                returnToObjects: false,
                isStarted: false,
                networkInfo: null,
                containerRuntime: null,
                uvi: null,
                enableDownload: false,
                realEnvId: null,
                componentId: null,
                session: null,
                groupId : null
                */
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
                chosenEnv: function($stateParams, Environments) {
                    return Environments.get({envId: $stateParams.envId}).$promise;
                },
                eaasClient: (localConfig, authService, $cookies) => new Client(localConfig.data.eaasBackendURL, () => authService.getToken(), $cookies.getObject('kbLayoutPrefs'))
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
        .state('admin.uvi', {
            url: "/uvi",
            resolve: {

            },
            views: {
                'wizard': {
                    template: require('./modules/uvi/uvi.html'),
                    controller: "UVIController as uviCtrl"
                }
            }
        })
        .state('admin.edit-object-characterization', {
            url: "/edit-object-characterization?objectId&objectArchive",
            params: {userDescription: null, swId: "-1", isPublic: null},
            resolve: {
                softwareObj: function($stateParams, $http, localConfig, helperFunctions, REST_URLS) {
                    // return empty object for new software
                    if ($stateParams.swId === "-1") {
                        return {
                            data: {
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
                    template: require('./modules/characterization/edit-object-characterization.html'),
                    controller: "EditObjectCharacterizationController as editObjectCharacterizationCtrl"
                }
            }
        })

        .state('admin.handles', {
            url: "/handles",
            resolve: {
                handles: ($http, localConfig, REST_URLS) => $http.get(localConfig.data.eaasBackendURL + REST_URLS.getHandleList)
            },
            views: {
                'wizard': {
                    template: require('./modules/handle/overview.html'),
                    controller: "HandleOverviewController as handleOverview",
                }
            }
        })
            .state('admin.networking', {
            url: "/networking",
            resolve: {
                localConfig: ($http) => $http.get(localStorage.eaasConfigURL || "config.json"),
            },
            views: {
                'wizard': {
                    template: require('./modules/networking/overview.html'),
                    controller: "NetworkingCtrl as netCtrl",
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
        })
        .state('admin.settings', {
            url: "/settings",
            params: {},
            resolve: {
                kbLayouts: ($http) => $http.get("kbLayouts.json"),
            },
            views: {
                'wizard': {
                    template: require('./modules/settings/settings.html'),
                    controller: "SettingsCtrl as settingsCtrl"
                }
            }
        })
        .state('admin.runtime-overview', {
            url: "/runtimes",
            params: {},
            resolve: {
                systemList: ($http, localConfig)  => {
                    return $http.get(localConfig.data.eaasBackendURL + "environment-repository/templates");
                },
                containerList : () => {return _fetch("serviceContainerList.json", "GET", null);}
            },
            views: {
                'wizard': {
                    template: require('./modules/settings/runtime-overview.html'),
                    controller: "RuntimeOverviewCtrl as runtimeOverviewCtrl"
                }
            }
        })

        .state('admin.default-envs-overview', {
            url: "/defaults",
            params: {},
            resolve: {
                defaultEnvironments: ($http, localConfig ) => $http.get(`${localConfig.data.eaasBackendURL}/environment-repository/default-environments`)
            },
            views: {
                'wizard': {
                    template: require('./modules/settings/default-envs-overview.html'),
                    controller: "DefaultEnvsOverviewCtrl as defaultEnvsOverviewCtrl"
                }
            }
        })
        .state('admin.emulators', {
            url: "/emulators",
            params: {},
            resolve: {
                nameIndexes: ($http, localConfig, REST_URLS) =>
                    $http.get(localConfig.data.eaasBackendURL + REST_URLS.getNameIndexes)
            },
            views: {
                'wizard': {
                    template: require('./modules/emulators/overview.html'),
                    controller: "EmulatorsController as emusCtrl"
                }
            }
        })
        .state('admin.create-network-environment', {
            url: "/create-network-environment",
            resolve: {
                environments: (Environments) => {
                    return Environments.query().$promise;
                },
                containerList : () => {return _fetch("serviceContainerList.json", "GET", null);}
            },
            views: {
                'wizard': {
                    template: '<add-Network-Environment' +
                        ' [environments] = environments' +
                        ' [container-List] = containerList>' +
                        '</add-Network-Environment>',
                    controller: ["$scope", "$state", '$stateParams', '$translate', 'environments', 'growl', 'containerList',
                        function ($scope, $state, $stateParams, $translate, environments, growl, containerList) {
                        $scope.environments = environments.filter(env => env.networkEnabled === true);
                        $scope.containerList = containerList;

                        if ($scope.environments.length === 0) {
                            growl.error($translate.instant('NO_ENVIRONMENTS_WITH_NETWORK'));
                            $state.go("admin.standard-envs-overview", {}, {reload: true});
                        }
                    }]
                }
            }
        })
        .state('admin.edit-network-environment', {
            url: "/edit-network-environment",
            params: {selectedNetworkEnvironment: null},
            resolve: {
                environments: (Environments) => {
                    return Environments.query().$promise;
                },
                containerList : () => {return _fetch("serviceContainerList.json", "GET", null);}
            },
            views: {
                'wizard': {
                    template: '<edit-Network-Environment ' +
                        '[environments] = environments '+
                        '[selected-Network-Environment] = selectedNetworkEnvironment ' +
                        '[container-List] = containerList >' +
                        '</edit-Network-Environment>',
                    controller: ["$scope", "$state", '$stateParams', '$translate', 'environments', 'growl', 'containerList',
                        function ($scope, $state, $stateParams, $translate, environments, growl, containerList) {
                        
                            console.log(containerList);

                        $scope.environments = environments.filter(env => env.networkEnabled === true);
                        if ($scope.environments.length === 0) {
                            growl.error($translate.instant('NO_ENVIRONMENTS_WITH_NETWORK'));
                            $state.go("admin.standard-envs-overview", {}, {reload: true});
                        }
                        if(!$stateParams.selectedNetworkEnvironment)
                        {
                            growl.error("no environment selected");
                            $state.go("admin.standard-envs-overview", {}, {reload: true});
                        }
                        $scope.selectedNetworkEnvironment = $stateParams.selectedNetworkEnvironment;
                        if(!$scope.selectedNetworkEnvironment.emilEnvironments)
                            $scope.selectedNetworkEnvironment.emilEnvironments = [];
                        $scope.containerList = containerList;
                    }]
                }
            }
        })
        .state('admin.emulators_details', {
            url: "/emulators",
            params: {entries: null, emuName: null},
            resolve: {
                nameIndexes: ($http, localConfig, REST_URLS) =>
                    $http.get(localConfig.data.eaasBackendURL + REST_URLS.getNameIndexes)
            },
            views: {
                'wizard': {
                    template: require('./modules/emulators/details.html'),
                    controller: "EmulatorsDetailsController as emusDetCtrl"
                }
            }
        })
        .state('admin.images', {
            url: "/images",
            params: {},
            resolve: {
               
            },
            views: {
                'wizard': {
                    template: require('./modules/images/overview.html'),
                    controller: "ImagesOverviewController as imagesCtrl"
                }
            }
        })

        .state('admin.update', {
            url: "/update",
            params: {},
            resolve: {
                current: ($http, localConfig) =>
                    $http.get(localConfig.data.eaasBackendURL + "operator/api/v1/deployment/current"),
            },
            views: {
                'wizard': {
                    template: require('./modules/settings/update.html'),
                    controller: "UpdateController as updateCtrl"
                }
            }
        })
    ;
    growlProvider.globalTimeToLive(5000);
}]);
