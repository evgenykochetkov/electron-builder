/// <reference types="node" />
import { CancellationToken, PackageFileInfo, ProgressInfo, UpdateInfo, VersionInfo } from "builder-util-runtime";
import { EventEmitter } from "events";
import { OutgoingHttpHeaders } from "http";
import { AppUpdater } from "./AppUpdater";
import { LoginCallback } from "./electronHttpExecutor";
export { NET_SESSION_NAME } from "./electronHttpExecutor";
export { AppUpdater, NoOpLogger } from "./AppUpdater";
export { UpdateInfo, VersionInfo };
export { CancellationToken } from "builder-util-runtime";
export { Provider } from "./Provider";
export declare const autoUpdater: AppUpdater;
export interface FileInfo {
    readonly name: string;
    readonly url: string;
    packageInfo?: PackageFileInfo;
    readonly sha2?: string;
    readonly sha512?: string;
    readonly headers?: OutgoingHttpHeaders;
}
export declare function getDefaultChannelName(): string;
export declare function getCustomChannelName(channel: string): string;
export declare function getCurrentPlatform(): string;
export declare function isUseOldMacProvider(): boolean;
export declare function getChannelFilename(channel: string): string;
export interface UpdateCheckResult {
    readonly versionInfo: VersionInfo;
    readonly fileInfo?: FileInfo;
    readonly downloadPromise?: Promise<Array<string>> | null;
    readonly cancellationToken?: CancellationToken;
}
export declare const DOWNLOAD_PROGRESS = "download-progress";
export declare const UPDATE_DOWNLOADED = "update-downloaded";
export declare type LoginHandler = (authInfo: any, callback: LoginCallback) => void;
export declare class UpdaterSignal {
    private emitter;
    constructor(emitter: EventEmitter);
    /**
     * Emitted when an authenticating proxy is [asking for user credentials](https://github.com/electron/electron/blob/master/docs/api/client-request.md#event-login).
     */
    login(handler: LoginHandler): void;
    progress(handler: (info: ProgressInfo) => void): void;
    updateDownloaded(handler: (info: VersionInfo) => void): void;
    updateCancelled(handler: (info: VersionInfo) => void): void;
}
export interface Logger {
    info(message?: any): void;
    warn(message?: any): void;
    error(message?: any): void;
    debug?(message: string): void;
}
