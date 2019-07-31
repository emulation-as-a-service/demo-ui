export async function stopClient($uibModal, onlyDisconnect, eaasClient) {
    // if environment was detached
    if (onlyDisconnect) {
        window.onbeforeunload = null;
        eaasClient.disconnect();
    } else {
        const modal = $uibModal.open({
            backdrop: 'static',
            animation: false,
            backdropClass: "white-backdrop",
            template: require('../modals/wait.html')
        });
        await eaasClient.release();
        window.onbeforeunload = null;
        modal.close();
    }
}
