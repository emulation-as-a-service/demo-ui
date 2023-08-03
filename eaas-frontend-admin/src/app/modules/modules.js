import angular from 'angular';

const emilUIModule = angular.module('emilAdminUI.modules', []);

// base
emilUIModule.controller('BaseController', require('./base/base.ctrl.js'));

// characterization
emilUIModule.controller('EditObjectCharacterizationController', require('./characterization/editObjectCharacterization.ctrl.js'));

// dashboard
emilUIModule.controller('DashboardController', require('./dashboard/dashboard.ctrl.js'));

// software
emilUIModule.controller('SoftwareOverviewController', require('./software/overview.ctrl.js'));

// sync
emilUIModule.controller('SyncImageArchivesController', require('./sync/syncImageArchives.ctrl.js'));

// environments
emilUIModule.controller('CreateOrImportEnvironmentController', require('./environments/create.ctrl.js'));
emilUIModule.controller('EditEnvironmentController', require('./environments/edit.ctrl.js'));
emilUIModule.controller('EnvironmentsOverviewController', require('./environments/overview.ctrl.js'));
emilUIModule.controller('UserSessionsListController', require('./environments/sessions.ctrl.js'));

// emulator
emilUIModule.controller('EmulatorStartController', require('./emulator/start.ctrl.js'));
emilUIModule.controller('EmulatorActionsController', require('./emulator/actions.ctrl.js'));
emilUIModule.controller('EmulatorConnectedEnvsController', require('./emulator/modals/connected-envs.ctrl.js'));
emilUIModule.controller('ImagesOverviewController', require('./images/overview.ctrl.js'));
// handle
emilUIModule.controller('HandleOverviewController', require('./handle/overview.ctrl.js'));
emilUIModule.controller('EditHandleController', require('./handle/edit.ctrl.js'));

// oai pmh
emilUIModule.controller('MetadataController', require('./metadata/metadata.ctrl.js'));

// objects
emilUIModule.controller('ObjectsOverviewController', require('./objects/overview.ctrl.js'));

emilUIModule.controller('UVIController', require('./uvi/uvi.ctrl.js'));

// container
emilUIModule.controller('StartContainerController', require('./containers/container.ctrl.js'));
emilUIModule.controller('ContainerActionsController', require('./containers/actions.ctrl.js'));
emilUIModule.controller('EditContainerController', require('./containers/editContainer.ctrl.js'));
emilUIModule.controller('NewContainerController', require('./containers/newContainer.ctrl'));
emilUIModule.controller('ContainerInputDialog', require('./containers/modals/container-run-dialog.ctrl'));


emilUIModule.controller('ObjectsImportController', require('./objects/import.ctrl.js'));
emilUIModule.controller('EmulatorsController', require('./emulators/overview.ctrl.js'));
emilUIModule.controller('EmulatorsDetailsController', require('./emulators/details.ctrl.js'));
emilUIModule.controller('EmulatorsDetailsController', require('./emulators/details.ctrl.js'));
emilUIModule.controller('EmulatorsJsonModalController', require('./emulators/modals/emulators-json.modal'));
emilUIModule.controller('NetworkModalController', require('./emulator/modals/network-modal.ctrl.js'));
emilUIModule.controller('DetachModalController', require('./emulator/modals/detach-modal.ctrl.js'));
emilUIModule.controller('NetworkingCtrl', require('./networking/networking.ctrl.js'));

emilUIModule.controller('SettingsCtrl', require('./settings/settings.ctrl.js'));
emilUIModule.controller('RuntimeOverviewCtrl', require('./settings/runtime-overview.ctrl.js'));
emilUIModule.controller('DefaultEnvsOverviewCtrl', require('./settings/default-envs-overview.ctrl.js'));
emilUIModule.controller('NetworkGroupManagerCtrl', require('./networking/modals/connectEnvToNetwork.ctrl.js'));
emilUIModule.controller('UpdateController', require('./settings/update.ctrl.js'));
