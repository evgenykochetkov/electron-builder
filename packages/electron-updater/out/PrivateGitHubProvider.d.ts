/// <reference types="node" />
import { GithubOptions, HttpExecutor, UpdateInfo } from "builder-util-runtime";
import { OutgoingHttpHeaders, RequestOptions } from "http";
import { URL } from "url";
import { BaseGitHubProvider } from "./GitHubProvider";
import { FileInfo } from "./main";
export interface PrivateGitHubUpdateInfo extends UpdateInfo {
    assets: Array<Asset>;
}
export declare class PrivateGitHubProvider extends BaseGitHubProvider<PrivateGitHubUpdateInfo> {
    private readonly token;
    private readonly netSession;
    constructor(options: GithubOptions, token: string, executor: HttpExecutor<any>);
    protected createRequestOptions(url: URL, headers?: OutgoingHttpHeaders | null): RequestOptions;
    getLatestVersion(): Promise<PrivateGitHubUpdateInfo>;
    private registerHeaderRemovalListener();
    private configureHeaders(accept);
    private getLatestVersionInfo(basePath, cancellationToken);
    private readonly basePath;
    getUpdateFile(versionInfo: PrivateGitHubUpdateInfo): Promise<FileInfo>;
}
export interface Asset {
    name: string;
    url: string;
}
