export class Drives
{
    constructor(drives) {
        this.drives = drives;
        this.driveUpdates = [];
        this._dirty = false;
    }

    getList()
    {
        return this.drives;
    }

    getBindingId (binding) {
        if(binding.startsWith("binding://"))
            return binding.substring("binding://".length);
        else
            return binding;
    }

    removeOldUpdate(index)
    {
        for( var i = 0; i < this.driveUpdates.length; i++){ 
            if ( this.driveUpdates[i].index === index) {
                this.driveUpdates.splice(i, 1); 
                i--;
            }
        }
    }

    setRuntime(disk, cdrom)
    {
        let diskUpdate = false;
        let cdromUpdate = false;
        for(let index = 0; index < this.drives.length; index++)
        {
            let drive = this.drives[index];
            if(drive.type === "disk" && drive.boot)
            {
                let update = new DriveUpdate(drive, index);
                update.setImage(disk, "default");
                this.addDriveUpdate(update);
                diskUpdate = true;
            }

            if(drive.type === "cdrom")
            {
                let update = new DriveUpdate(drive, index);
                update.setImage(cdrom, "default");
                this.addDriveUpdate(update);      
                cdromUpdate = true;
            }
           
            if(diskUpdate && cdromUpdate)
                return;
        }

        throw new Error("could not find suitable drives to initialize runtime drives");
    }

    addDriveUpdate(update)
    {
        if(!update)
            throw new Error("empty update");
        
        this.removeOldUpdate(update.index);
        this.driveUpdates.push(update);
    }

    getUpdates() {
        let result = [];
        for( var i = 0; i < this.driveUpdates.length; i++){ 
            result.push(this.driveUpdates[i].toJson());
        }
        console.log(result);
        return result;
    }

    renderBinding (index, imageList, softwareList, objectList)
    {
        if(!objectList)
            objectList = [];

        if(!softwareList)
            softwareList = [];
            
        let drive = this.drives[index];
        if(!drive.data && !drive._id)
            return "empty drive";

        let id = drive._id;
        if(!id)
            id = drive.data;

        id = this.getBindingId(id);

        let found = imageList.find((element) => {
            if(element.imageId === id){
                return element;
            }
        });

        if(found && found.label) { 
            return "<br><b>Disk image: </b>" + found.label;
        }
    
        found = softwareList.find((element) => {
            if(id.startsWith(element.id))
            {
                return element;
            }
        });

        if(found) {
            if(found.isOperatingSystem) {
                return "<br><b>Operating system:</b> " + found.label;
            }  
            else {
                return "<br><b>Software: </b>" + found.label;
            }
        }

        found = objectList.find((element) => {
            if(id.startsWith(element.id))
            {
                return element;
            }
        });

        if(found)
            return "<br><b>User object: </b>" + found.title;

        return "<br><b>Media ID: </b>" + id;
    }

    selectMedia(index, imageList, softwareList, objectList, $uibModal)
    {
        var _this = this;
        return $uibModal.open({
            animation: true,
            template: require('./modals/chooseDriveMedia.html'),
            backdrop: false,
            controller: ["$scope", function ($scope) {
                this.driveLabel = _this.renderBinding(index, imageList, softwareList, objectList);
                this.drive = _this.drives[index];
                this.virtio = (this.drive.iface === 'virtio');
                this.imageList = imageList;
                this.softwareList = softwareList;
                this.objectList = objectList;

                this.save = () => {
                    _this._dirty = true;
                    if(this.virtio && this.drive.type === "disk")
                        this.drive.iface = "virtio";
                    else
                        this.drive.iface = "ide";

                    if (this.diskType === 'image') {
                        let update = new DriveUpdate(this.drive, index);
                        update.setImage(this.selectedImage.imageId, "default");
                        _this.addDriveUpdate(update);                            
                    } else if (this.diskType === 'os') {
                        let update = new DriveUpdate(this.drive, index);
                        update.setObject(this.selectedOs.id, this.selectedOs.archiveId);
                        _this.addDriveUpdate(update);
                    } else if (this.diskType == 'software') {
                        let update = new DriveUpdate(this.drive, index);
                        update.setObject(this.selectedSoftware.id, this.selectedSoftware.archiveId);
                        _this.addDriveUpdate(update);      
                    } else if (this.diskType == 'object') {
                        let update = new DriveUpdate(this.drive, index);
                        update.setObject(this.selectedObject.id, this.selectedObject.archiveId);
                        _this.addDriveUpdate(update);
                    }
                    else if (this.diskType == 'object') {
                        let update = new DriveUpdate(this.drive, index);
                        update.setObject(this.selectedObject.id, this.selectedObject.archiveId);
                        _this.addDriveUpdate(update);
                    }
                    else if (this.diskType == 'empty') {
                        let update = new DriveUpdate(this.drive, index);
                        update.setEmpty();
                        _this.addDriveUpdate(update);
                    }
                };
            }],
            controllerAs: "editDriveCtrl"
        });// .result.then(//() => $scope.$apply());
    } 
}

export class DriveUpdate {
    constructor(drive, index) {
        this.drive = drive;
        this.index = index;

        this.imageId = undefined;
        this.imageArchive = undefined;
                                
        this.objectId = undefined;
        this.objectArchive = undefined;
    }

    setObject(objectId, objectArchive)
    {
        this.drive._id = objectId;
        this.drive.data = undefined;

        this.objectId = objectId;
        this.objectArchive = objectArchive;

        this.imageId = undefined;
        this.imageArchive = undefined;
    }

    setImage(imageId, imageArchive) {

        this.drive._id = imageId;
        this.drive.data = undefined;

        this.imageId = imageId;
        this.imageArchive = imageArchive;

        this.objectId = undefined;
        this.objectArchive = undefined;
    }

    setEmpty()
    {
        this.drive._id = undefined;
        this.drive.data = undefined;

        this.objectId = undefined;
        this.objectArchive = undefined;

        this.imageId = undefined;
        this.imageArchive = undefined;        
    }
    
    toJson() {
        return {
            objectId: this.objectId,
            objectArchive: this.objectArchive,
            driveIndex: this.index,
            imageId : this.imageId,
            imageArchive : this.imageArchive,
            drive: this.drive
        };
    }
}