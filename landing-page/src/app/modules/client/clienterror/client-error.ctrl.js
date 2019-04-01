module.exports = function($state, $stateParams) {
    if ($stateParams.errorMsg.title === "" && $stateParams.errorMsg.title === "") {
        $state.go('container-landing-page');
        return;
    }

    this.errorMsg = $stateParams.errorMsg;
};