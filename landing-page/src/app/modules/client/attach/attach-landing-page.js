import {showErrorIfNull} from "EaasLibs/javascript-libs/show-error-if-null.js";
import { MachineComponentBuilder } from "EaasClient/lib/componentBuilder";

module.exports = ['$state', 'eaasClient', '$scope', 'localConfig', 'sessionId', 'connectEnv',
    function ($state, eaasClient, $scope, localConfig, sessionId, connectEnv) {

        showErrorIfNull(sessionId, $state);
        var vm = this;
        vm.eaasClient = eaasClient;

        async function attachNewEnvironment(session) {
            const component = new MachineComponentBuilder(connectEnv.envId, connectEnv.archive);
            component.setInteractive(true);
            
            try {
                await eaasClient.attachNewEnv(session, $("#emulator-container")[0], component);
                vm.started = true;
                $scope.$apply();
            }
            catch(e)
            {
                console.log("we need to retry here");
                // redirect to an appropriate page
            }
        }

        if (connectEnv)
            attachNewEnvironment(sessionId);
        else
            eaasClient.attach(sessionId, $("#emulator-container")[0])
}];
