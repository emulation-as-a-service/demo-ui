/*
 * Import third party libraries
 */

import angular from 'angular';
import 'angular-loading-bar';
import ngSanitize from 'textangular/dist/textAngular-sanitize';
import 'textangular';
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


/*
 * Import legacy emulator libraries
 */
var elementResizeDetectorMaker = require("element-resize-detector");
window.elementResizeDetectorMaker = elementResizeDetectorMaker;

const $ = require('jquery');
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
import 'angular-wizard/dist/angular-wizard.css';
import 'textangular/dist/textAngular.css'
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';
import 'ui-select/dist/select.css';
import 'angular-growl-v2/build/angular-growl.css';
import 'angular-loading-bar/build/loading-bar.css';
import '../../../eaas-client/guacamole/guacamole.css';
import '../../../eaas-client/eaas-client.css';
import './app.css';


export default angular.module('emilUI', ['angular-loading-bar', 'ngSanitize', 'ngAnimate', 'ngCookies', 'ui.router', 'ui.bootstrap', 'ui.select', 'angular-growl',
    'dibari.angular-ellipsis', 'ui.bootstrap.contextMenu', 'pascalprecht.translate', 'smart-table', 'emilUI.modules', 'emilUI.helpers', 'mgo-angular-wizard',
    'textAngular', 'ngFileUpload', 'angular-jwt'])

    .component('containerInputList', {
        templateUrl: 'partials/containerInputList.html',
        bindings: {
            list: '=',
            heading: '@',
            listEmptyNote: '@',
            inputPlaceholder: '@',
            addButtonText: '@'
        }
    })
    .component('containerInputListModified', {
        templateUrl: 'partials/containerInputListModified.html',
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
            showDialogs: '=',
            inputData: '='
        }
    })


    .run(function($rootScope) {
        $rootScope.emulator = {state : ''};

        $rootScope.idleTimer = {};
        $rootScope.idleTimer.idleTime = 0;

        $rootScope.initIdleTimer = function(idleTimeout)
        {
            if(idleTimeout <= 0)
                return;

            $rootScope.idleTimer.idleTime = 0;
            $rootScope.idleTimer.idleTimeout = idleTimeout;
            clearInterval($rootScope.idleTimer.idleInterval);
            $rootScope.idleTimer.idleInterval = setInterval($rootScope.idleTimer.timerIncrement, 60000); // 1 minute
            console.log("TIMER started");
        };

        $rootScope.disableIdleTimer = function()
        {
            clearInterval($rootScope.idleTimer.idleInterval);
            console.log("TIMER stopped");
        };

        $(document).ready(function () {
            //Zero the idle timer on mouse movement.
            $(this).mousemove(function (e) {
                $rootScope.idleTimer.idleTime = 0;
            });

            $(this).keypress(function (e) {
                $rootScope.idleTimer.idleTime = 0;
            });
        });

        $rootScope.idleTimer.timerIncrement = function() {
            $rootScope.idleTimer.idleTime = $rootScope.idleTimer.idleTime + 1;

            if ($rootScope.idleTimer.idleTime > $rootScope.idleTimer.idleTimeout - 1) {
                if($rootScope.idleTimeoutWarnFn)
                    $rootScope.idleTimeoutWarnFn();
            }

            if ($rootScope.idleTimer.idleTime > $rootScope.idleTimer.idleTimeout) {
                if($rootScope.idleTimeoutFn)
                    $rootScope.idleTimeoutFn();
                $rootScope.disableIdleTimer();
            }
        };
    })


    .filter('trustAsHtml', function ($sce) {
        return function (text) {
            return $sce.trustAsHtml(text);
        };
    })


.controller('setKeyboardLayoutDialogController', function($scope, $cookies, $translate, kbLayouts, growl) {
    this.kbLayouts = kbLayouts.data;

    var kbLayoutPrefs = $cookies.getObject('kbLayoutPrefs');

    if (kbLayoutPrefs) {
        this.chosen_language = kbLayoutPrefs.language;
        this.chosen_layout = kbLayoutPrefs.layout;
    }

    this.saveKeyboardLayout = function() {
        if (!this.chosen_language || !this.chosen_layout) {
            growl.error($translate.instant('SET_KEYBOARD_DLG_SAVE_ERROR_EMPTY'));
            return;
        }

        $cookies.putObject('kbLayoutPrefs', {"language": this.chosen_language, "layout": this.chosen_layout}, {expires: new Date('2100')});

        growl.success($translate.instant('SET_KEYBOARD_DLG_SAVE_SUCCESS'));
        $scope.$close();
    };
})
    .config( [
        '$compileProvider',
        function( $compileProvider )
        {
            $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|web\+eaas-proxy):/);
            // Angular before v1.2 uses $compileProvider.urlSanitizationWhitelist(...)
        }
    ])
.config(function($stateProvider, $urlRouterProvider, growlProvider, $httpProvider, $translateProvider, $provide) {

    /*
     * Use ng-sanitize for textangular, see https://git.io/vFd7y
     */
    $provide.decorator('taOptions', ['taRegisterTool', '$delegate', function(taRegisterTool, taOptions) {
        taOptions.forceTextAngularSanitize = false;
        return taOptions;
    }]);

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

    // Add a global AJAX error handler
    $httpProvider.interceptors.push(function($q, $injector, $timeout) {
        return {
            responseError: function(rejection) {
                if (httpResponseErrorModal === null) {
                    httpResponseErrorModal = $injector.get('$uibModal').open({
                        animation: true,
                        backdrop: 'static',
                        templateUrl: 'partials/error.html'
                    });
                }

                return $timeout(function() {
                    var $http = $injector.get('$http');

                    var req = $http(rejection.config);
                    req.then(function() {
                        if (httpResponseErrorModal !== null) {
                            httpResponseErrorModal.close();
                            httpResponseErrorModal = null;
                        }
                    });
                    return req;
                }, 5000);
            }
        };
    });

    // For any unmatched url
    $urlRouterProvider.otherwise("/container-landing-page");

    // Now set up the states
    $stateProvider
        .state('error', {
            url: "/error",
            template: require('./modules/client/clienterror/client-error.html'),
            params: {
                errorMsg: {title: "", message: ""}
            },
            controller: 'ClientErrorController as errorCtrl'
        })
        .state('container-landing-page', {
            url: "/container-landing-page",
            template: require('./modules/client/landing-page/container-landing-page.html'),
            resolve: {
                chosenEnv: function($http, localConfig, helperFunctions, REST_URLS) {
                    return $http.get(localConfig.data.eaasBackendURL + helperFunctions.formatStr(REST_URLS.getEnvById, new URLSearchParams(window.location.search).get('id')))
                },
                localConfig: ($http) => $http.get("config.json"),
                buildInfo: ($http, localConfig, REST_URLS) => $http.get(localConfig.data.eaasBackendURL + REST_URLS.buildVersionUrl),
            },
            controller: "ContainerLandingCtrl as containerLandingCtrl"
        });

    growlProvider.globalTimeToLive(5000);
})


