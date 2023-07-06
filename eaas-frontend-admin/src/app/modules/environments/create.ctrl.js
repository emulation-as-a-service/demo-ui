import {
    MachineBuilder
} from '../../lib/machineBuilder.js';

import {Drives} from '../../lib/drives.js';

module.exports = ["$http", "$state", "systemList", "softwareList", "localConfig", "$uibModal", "operatingSystemsMetadata", "Objects", "Images",
    function ($http,  $state, systemList, softwareList, localConfig, $uibModal, operatingSystemsMetadata, Objects, Images) {
        var vm = this;

        vm.systems = systemList.data;
        vm.softwareList = softwareList.data.descriptions; 
        vm.osPresets = operatingSystemsMetadata.data.operatingSystemInformations;

        vm.native_config = "";
        vm.uiOptions = {};
    
        vm.objectList = [];
        Objects.query({archiveId: "zero conf"}).$promise.then(function(response) {
            vm.objectList = response;
        });

        vm.imageId = "";
        vm._preSelectedSystem = undefined;
        vm.selectedOs = undefined;
        vm.imageList = [];
        vm.enableNetwork = false;

        vm.builder = new MachineBuilder(localConfig.data.eaasBackendURL, localStorage.getItem('id_token'));

        Images.list().then((result) => {
            vm.imageList = result;
        }, (e) => {
            throw new Error(e);
        });

        vm.config = {
            cpu: undefined,
            memory: undefined,
            kvm_available: false,
            kvm_enabled: false,
        };

        vm.preSelectedSystem = function(os)
        {
            vm._preSelectedSystem = os;
            vm.selectedTemplate = "";
            vm.config = {
                cpu: undefined,
                memory: undefined,
                kvm_available: false,
                kvm_enabled: false,
                template: undefined,
            };
        }

        vm.getOsPresets = function()
        {
            const result =  vm.osPresets.filter(
                (element, i) => { 
                    let templates = vm.systems.find(o => o.id === element.template);
                    if(element.id.startsWith("os:" +  vm._preSelectedSystem) && templates)
                        return true;
                    return false;
                }
            );
            if(!result)
                return [];
            return result;
        }

        vm.guessBinding = function(index)
        {
            return vm.drives.renderBinding(index, vm.imageList, vm.softwareList, vm.objectList);
        };

        vm.selectMedium = function (index) {
            vm.drives.selectMedia(index, vm.imageList, vm.softwareList, vm.objectList, $uibModal);
        };

        vm.onSelectSystem = function (item) {
            vm.selectedOs = item;
            vm.config.kvm_available = vm.selectedOs.kvm_available;
            vm.config.template = vm.selectedOs.template;
            vm.config.template_params = vm.selectedOs.templateParameters;
            
            vm.osId = vm.selectedOs.id;
            vm.template = vm.systems.find(o => o.id === vm.selectedOs.template);
            vm.uiOptions = vm.selectedOs.uiOptions ? vm.selectedOs.uiOptions : {};

            if(!vm.template) {
                console.log(item);
                console.log(vm.systems);
                throw new Error("no template found: ");
            }
            
            vm.drives = new Drives(vm.template.drive);
            vm.native_config = updateNativeConfig();
        };

        function updateNativeConfig() {
            let confStr = "";

            if (vm.config.template_params.vga)
                confStr += " -vga " + vm.config.template_params.vga;

            if (vm.config.template_params.cpu)
                confStr += " -smp " + vm.config.template_params.cpu;

            if (vm.config.template_params.net)
                confStr += " -net nic,model=" + vm.config.template_params.net;

            if (vm.config.template_params.audio)
                confStr += " -soundhw " + vm.config.template_params.audio;

            if (vm.config.template_params.memory)
                confStr += " -m " + vm.config.template_params.memory;

            if (vm.config.template_params.pointer === 'usb')
                confStr += " -usb -usbdevice tablet";

            if (vm.config.template_params.kvm_enabled)
                confStr += " -enable-kvm";

            if (confStr.startsWith(" "))
                confStr = confStr.substring(1);
            return confStr;
        }

        vm.updateQemu = function () {
            vm.native_config = updateNativeConfig();
        };

        vm.updateMacemu = function () {
            vm.native_config = "rom rom://" + vm.config.template_params.rom.imageId;
        };

        vm.updateBrowser = function() {

            let native_config = "--disable-background-mode --always-authorize-plugins --allow-outdated-plugins --proxy-server=socks5://127.0.0.1:8090";

            if(vm.config.template_params.size) {
                native_config += " --window-size=" + vm.config.template_params.size;
            }

            if(vm.config.template_params.fullscreen && vm.config.template_params.url)
            {
                native_config += " --app=" + vm.config.template_params.url;
            }
            else if(vm.config.template_params.url)
            {
                native_config += " " + vm.config.template_params.url;
            }

            vm.native_config = native_config;
            vm.enableNetwork = true;
        };

        vm.updateAmiga = function () {
            vm.native_config = "";

            if(vm.config.template_params.rom)
            {
                vm.native_config += "--kickstart_file=rom://" + vm.config.template_params.rom.imageId + " ";
            }

            if(vm.config.template_params.model)
            {
                vm.native_config += "--amiga_model=" + vm.config.template_params.model;
            }
        };

        vm.save = function () {
            try {
                vm.builder.label = vm.label;
                vm.builder.nativeConfig = vm.native_config;
                vm.builder.templateId = vm.template.id;
                vm.builder.operatingSystemId = vm.osId;
                vm.builder.uiOptions = vm.uiOptions;
                vm.builder.setDrives(vm.drives);
                vm.builder.enableNetwork = vm.networking ? vm.networking.connectEnvs : false;
                vm.builder.enableInternet = vm.networking ? vm.networking.enableInternet: false;

                if(vm.config.template_params.rom)
                {
                    vm.builder.setRom(vm.config.template_params.rom.imageId, vm.config.template_params.rom.label)
                }

                vm.builder.build()
                    .then(() => 
                    {
                        // hack: this should be solved by a ui template 
                        // https://gitlab.com/openslx/demo-ui/-/issues/86   
                        if(vm.template.id === "runtime") {
                            $state.go('admin.runtime-overview', {}, {reload: true});
                        }
                        else {
                            $state.go('admin.standard-envs-overview', {}, {reload: true});
                        }
                    })
                    .catch((e) => $state.go('error', {
                        errorMsg: e
                    }));
            } catch (e) {
                console.log(e);
                $state.go('error', {
                    errorMsg: e
                });
            }
        }
    }
];
