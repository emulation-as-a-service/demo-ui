import ng from 'angular';

const emilUIHelpersModule = ng.module('emilUI.helpers', []);

emilUIHelpersModule.service('REST_URLS', function () {
    // environments data connector
    this.getEnvById = "EmilEnvironmentData/getEnvById?id={0}";
    this.detachSessionUrl = "sessions";
    this.buildVersionUrl = "Emil/buildInfo";
});

emilUIHelpersModule.service('helperFunctions', function () {
    this.formatStr = function(format) {
        const args = Array.prototype.slice.call(arguments, 1);
        return format.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] !== 'undefined' ? args[number] : match;
        });
    };
    this.getAllowedEnvironmentTypes = function () {
        return [{name: "emilContainerEnvironment", isContainer: true},
            {name: "emilEnvironment", isContainer: false},
            {name: "emilObjectEnvironment", isContainer: false}];
    };
});
