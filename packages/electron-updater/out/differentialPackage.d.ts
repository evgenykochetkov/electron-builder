/// <reference types="node" />
import { HttpExecutor, PackageFileInfo } from "builder-util-runtime";
import { OutgoingHttpHeaders } from "http";
import { Logger } from "./main";
export declare class DifferentialDownloaderOptions {
    readonly oldBlockMapFile: string;
    readonly oldPackageFile: string;
    readonly logger: Logger;
    readonly packagePath: string;
    readonly requestHeaders: OutgoingHttpHeaders | null;
}
export declare class DifferentialDownloader {
    private readonly packageInfo;
    private readonly httpExecutor;
    private readonly options;
    private readonly baseRequestOptions;
    private fileMetadataBuffer;
    private readonly logger;
    constructor(packageInfo: PackageFileInfo, httpExecutor: HttpExecutor<any>, options: DifferentialDownloaderOptions);
    private createRequestOptions(method?);
    download(): Promise<void>;
    private downloadFile(operations);
    private computeOperations(oldBlockMap, newBlockMap);
    private readRemoteBytes(start, endInclusive);
    private request(requestOptions, dataHandler);
}
