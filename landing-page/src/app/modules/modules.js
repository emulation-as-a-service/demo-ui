import angular from 'angular';

const emilUIModule = angular.module('emilUI.modules', []);

emilUIModule.controller('ClientErrorController', require('./client/clienterror/client-error.ctrl'));
emilUIModule.controller('ContainerLandingCtrl', require('./client/landing-page/container-landing-page.ctrl.js'));