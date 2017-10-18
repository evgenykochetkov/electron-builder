import { VersionInfo } from "builder-util-runtime";
import { FileInfo } from "./main";
/** @private **/
export declare class DownloadedUpdateHelper {
    private setupPath;
    private _packagePath;
    private versionInfo;
    private fileInfo;
    readonly file: string | null;
    readonly packagePath: string | null;
    getDownloadedFile(versionInfo: VersionInfo, fileInfo: FileInfo): string | null;
    setDownloadedFile(file: string, packagePath: string | null, versionInfo: VersionInfo, fileInfo: FileInfo): void;
    clear(): void;
}
