import ng from 'angular';

const emilAdminUIHelpersModule = ng.module('emilAdminUI.helpers', []);

emilAdminUIHelpersModule.service('REST_URLS', function () {
    // object data api
    this.syncUrl = "objects/sync";
    this.getHandleList = "handles/";
    this.pushUploadUrl = "objects/pushUpload";
    this.repositoriesListUrl = "objects/archives";
    this.getObjectImportTaskState = "objects/objectImportTaskState?taskId={0}";

    this.getHandleValue = "handles/";
    this.deleteHandle = "handles/";
    this.postHandleValue = "handles/";

    // environment data api
    this.getRemoteEnvsUrl = "EmilEnvironmentData/remoteList?host={0}&type={1}";
    this.updateDescriptionUrl = "EmilEnvironmentData/updateDescription";
    this.deleteEnvironmentUrl = "EmilEnvironmentData/delete";
    this.initEmilEnvironmentsURL = "EmilEnvironmentData/init";
    this.getDatabaseContent = "EmilEnvironmentData/getDatabaseContent?type={0}&className={1}";
    this.detachSessionUrl = "sessions";
    this.getPatches = "EmilEnvironmentData/getPatches";
    this.prepareEnvironmentUrl = "EmilEnvironmentData/prepareEnvironment";
    this.importImageUrl = "EmilEnvironmentData/importImage";
    this.createEnvironmentUrl = "EmilEnvironmentData/createEnvironment";
    this.networkEnvironmentUrl = "network-environments";

    this.forkRevisionUrl = "EmilEnvironmentData/forkRevision";
    this.revertRevisionUrl = "EmilEnvironmentData/revertRevision";
    this.exportEnvironmentUrl = "EmilEnvironmentData/export";
    this.overrideObjectCharacterizationUrl = "classification/overrideObjectCharacterization";
    this.getObjectDependencies = "EmilEnvironmentData/objectDependencies?envId={0}";
    this.replicateImage = "EmilEnvironmentData/replicateImage";
    this.getNameIndexes = "EmilEnvironmentData/getNameIndexes";
    this.getGroupIds = "sessions/";
    this.setDefaultEnvironmentUrl = "EmilEnvironmentData/setDefaultEnvironment?osId={0}&envId={1}";

    this.getOriginRuntimeList = "EmilContainerData/getOriginRuntimeList";
    this.importContainerUrl = "EmilContainerData/importContainer";
    this.importEmulator = "EmilContainerData/importEmulator";
    this.updateLatestEmulator = "EmilContainerData/updateLatestEmulator";
    this.updateContainerUrl = "EmilContainerData/updateContainer";
    this.deleteContainerUrl = "EmilContainerData/delete";
    this.saveImportedContainer = "EmilContainerData/saveImportedContainer";

    this.userSessionListUrl = "EmilUserSession/list";
    this.deleteSessionUrl = "EmilUserSession/delete?sessionId={0}";

    this.buildVersionUrl = "Emil/buildInfo";
    this.getUserInfo = "Emil/userInfo";
    this.exportMetadata = "Emil/exportMetadata";

    // Software archive api
    this.getSoftwarePackageDescriptions = "EmilSoftwareData/getSoftwarePackageDescriptions";
    this.saveSoftwareUrl = "EmilSoftwareData/saveSoftwareObject";
    this.getSoftwareObjectURL = "EmilSoftwareData/getSoftwareObject?softwareId={0}";

    // sync endpoints
    this.syncImagesUrl = "environment-repository/actions/sync";
    this.syncObjectsUrl = "object-repository/actions/sync";
    this.syncSoftwareUrl = "software-repository/actions/sync";
});

emilAdminUIHelpersModule.service('helperFunctions', function () {
    this.formatStr = function(format) {
        const args = Array.prototype.slice.call(arguments, 1);
        return format.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] !== 'undefined' ? args[number] : match;
        });
    };
});
