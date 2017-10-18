import { GenericServerOptions, HttpExecutor, UpdateInfo } from "builder-util-runtime";
import { FileInfo, Provider } from "./main";
export declare class GenericProvider extends Provider<UpdateInfo> {
    private readonly configuration;
    private readonly baseUrl;
    private readonly channel;
    constructor(configuration: GenericServerOptions, executor: HttpExecutor<any>);
    getLatestVersion(): Promise<UpdateInfo>;
    getUpdateFile(versionInfo: UpdateInfo): Promise<FileInfo>;
}
