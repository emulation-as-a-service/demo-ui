export function createData(envId, archive, type, objectArchive, objectId, userId, softwareId, keyboardLayout, keyboardModel, containerRuntime, nic) {
    let data = {};
    data.type = type;
    data.archive = archive;
    data.environment = envId;
    data.object = objectId;
    data.objectArchive = objectArchive;
    data.userId = userId;
    data.software = softwareId;
    data.nic = nic;
    if (containerRuntime != null) {
        data.linuxRuntimeData = {
            userContainerEnvironment: containerRuntime.userContainerEnvironment,
            userContainerArchive: containerRuntime.userContainerArchive,
            isDHCPenabled: containerRuntime.networking.isDHCPenabled
        };
        data.input_data = containerRuntime.input_data;
    }
    if (typeof keyboardLayout != "undefined") {
        data.keyboardLayout = keyboardLayout;
    }

    if (typeof keyboardModel != "undefined") {
        data.keyboardModel = keyboardModel;
    }
    return data;
};
