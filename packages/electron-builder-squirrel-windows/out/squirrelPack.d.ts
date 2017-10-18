import { Arch } from "builder-util";
import { WinPackager } from "electron-builder/out/winPackager";
export declare function convertVersion(version: string): string;
export interface SquirrelOptions {
    vendorPath: string;
    remoteReleases?: string;
    remoteToken?: string;
    loadingGif?: string;
    productName: string;
    appId?: string;
    name: string;
    packageCompressionLevel?: number;
    version: string;
    msi?: any;
    description?: string;
    iconUrl?: string;
    authors?: string;
    extraMetadataSpecs?: string;
    copyright?: string;
}
export interface OutFileNames {
    setupFile: string;
    packageFile: string;
}
export declare function buildInstaller(options: SquirrelOptions, outputDirectory: string, outFileNames: OutFileNames, packager: WinPackager, appOutDir: string, outDir: string, arch: Arch): Promise<void>;
