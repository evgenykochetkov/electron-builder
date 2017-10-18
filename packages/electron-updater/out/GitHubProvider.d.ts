/// <reference types="node" />
import { GithubOptions, HttpExecutor, UpdateInfo } from "builder-util-runtime";
import { URL } from "url";
import { AppUpdater } from "./AppUpdater";
import { FileInfo, Provider } from "./main";
export declare abstract class BaseGitHubProvider<T extends UpdateInfo> extends Provider<T> {
    protected readonly options: GithubOptions;
    protected readonly baseUrl: URL;
    constructor(options: GithubOptions, defaultHost: string, executor: HttpExecutor<any>);
    protected computeGithubBasePath(result: string): string;
}
export declare class GitHubProvider extends BaseGitHubProvider<UpdateInfo> {
    protected readonly options: GithubOptions;
    private readonly updater;
    constructor(options: GithubOptions, updater: AppUpdater, executor: HttpExecutor<any>);
    getLatestVersion(): Promise<UpdateInfo>;
    private getLatestVersionString(basePath, cancellationToken);
    private readonly basePath;
    getUpdateFile(versionInfo: UpdateInfo): Promise<FileInfo>;
    private getBaseDownloadPath(version, fileName);
}
