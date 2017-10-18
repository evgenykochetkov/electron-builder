/// <reference types="debug" />
import { PackageBuilder } from "builder-util/out/api";
import _debug from "debug";
export declare const debug: _debug.IDebugger;
export declare function getLicenseButtonsFile(packager: PackageBuilder): Promise<Array<LicenseButtonsFile>>;
export interface LicenseButtonsFile {
    file: string;
    lang: string;
    langWithRegion: string;
    langName: string;
}
export declare function getLicenseButtons(licenseButtonFiles: Array<LicenseButtonsFile>, langWithRegion: string, id: number, name: string): Promise<string>;
