/// <reference types="node" />
import { CancellationToken, HttpExecutor, UpdateInfo, VersionInfo } from "builder-util-runtime";
import { OutgoingHttpHeaders, RequestOptions } from "http";
import { URL } from "url";
import { FileInfo } from "./main";
export declare abstract class Provider<T extends VersionInfo> {
    protected readonly executor: HttpExecutor<any>;
    protected requestHeaders: OutgoingHttpHeaders | null;
    constructor(executor: HttpExecutor<any>);
    setRequestHeaders(value: OutgoingHttpHeaders | null): void;
    abstract getLatestVersion(): Promise<T>;
    abstract getUpdateFile(versionInfo: T): Promise<FileInfo>;
    static validateUpdateInfo(info: UpdateInfo): void;
    protected httpRequest(url: URL, headers: OutgoingHttpHeaders | null, cancellationToken: CancellationToken): Promise<string | null>;
    protected createRequestOptions(url: URL, headers?: OutgoingHttpHeaders | null): RequestOptions;
}
