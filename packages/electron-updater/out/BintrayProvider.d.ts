import { BintrayOptions, HttpExecutor, VersionInfo } from "builder-util-runtime";
import { FileInfo, Provider } from "./main";
export declare class BintrayProvider extends Provider<VersionInfo> {
    private client;
    setRequestHeaders(value: any): void;
    constructor(configuration: BintrayOptions, httpExecutor: HttpExecutor<any>);
    getLatestVersion(): Promise<VersionInfo>;
    getUpdateFile(versionInfo: VersionInfo): Promise<FileInfo>;
}
