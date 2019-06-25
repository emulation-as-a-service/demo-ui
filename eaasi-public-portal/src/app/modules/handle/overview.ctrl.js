module.exports = ["$state", "$stateParams", "$http", "handles", "localConfig", "helperFunctions","growl", "REST_URLS",
    function ($state, $stateParams, $http, handles, localConfig, helperFunctions, growl, REST_URLS) {

        var vm = this;
        vm.handles = handles.data.handles;
        vm.addHandle = function () {

            let checkValue = function (regEx, value, message) {
                if (!regEx.test(value)) {
                    growl.error(message + " : " + value, {title: 'Error '});
                    return false;
                } else return true;
            };

            const regexName = /^[0-9A-Za-z\s\-]+$/;
            if (!checkValue(regexName, document.getElementById("addHandle").value,  "Not valid Handle Name"))
                return;
            console.log("vm.handles[0]   " + vm.handles[0]);

            if (vm.handles.includes("11270/" + document.getElementById("addHandle").value)){
                growl.error("This handle name already exist");
                return;
            }

            jQuery.when(
                $http.post(localConfig.data.eaasBackendURL + REST_URLS.postHandleValue, {
                    handle: "11270/" + document.getElementById("addHandle").value,
                    value: document.getElementById("addHandleValue").value
                })
            ).then(function (response) {
                console.log("response  ", response);
                console.log("response.status   ", response.status);
                if (response.status === 200) {
                    $state.reload();
                } else {
                    growl.error('Handle is not defined!!');
                }

            });

        };

    }];