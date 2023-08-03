
import {_fetch} from './utils.js';

export class MachineBuilder {
    constructor(api, idToken = null) {
        this.API_URL = api;
        this.idToken = idToken;

        this.drives = undefined;
        this.templateId = undefined;
        this.label = undefined;
        this.nativeConfig = undefined;
        this.uiOptions = {
            enablePrinting : false,
            useWebRTC : false,
            useXpra : false,
            enableRelativeMouse :false,
            xpraEncoding : null,
            shutdownByOs : false,
            disableGhostCursor: false
        };
        this.rom = undefined;
        this.romLabel = undefined;
        this.enableNetwork = undefined;
    }

    setDrives(drives)
    {
        this.drives = drives;
    }

    setRom(romId, romLabel)
    {
        this.rom = romId;
        this.romLabel = romLabel;
    }

    async build()
    {
        if(!this.templateId || !this.label)
            throw new Error("templateId and label are mandatory properties");
 
       let result = await _fetch(`${this.API_URL}environment-repository/environments`, "POST", 
            {
                label: this.label,
                templateId: this.templateId,
                nativeConfig: this.nativeConfig,
                driveSettings: (this.drives) ? this.drives.getUpdates() : [],
                operatingSystemId : this.operatingSystemId,
                romId: this.rom,
                romLabel: this.romLabel,
                enableNetwork: this.enableNetwork,
                enableInternet: this.enableInternet,
            
                enablePrinting : this.uiOptions.enablePrinting,
                enableRelativeMouse: this.uiOptions.enableRelativeMouse,
                useWebRTC: this.uiOptions.useWebRTC,
                useXpra: this.uiOptions.useXpra,
                xpraEncoding: this.uiOptions.xpraEncoding,
                shutdownByOs: this.uiOptions.shutdownByOs,
                disableGhostCursor: this.uiOptions.disableGhostCursor

            }, this.idToken);
        return result;
    }

}
