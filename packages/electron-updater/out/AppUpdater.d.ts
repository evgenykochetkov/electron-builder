/// <reference types="node" />
import { CancellationToken, PublishConfiguration, AllPublishOptions, VersionInfo } from "builder-util-runtime";
import { EventEmitter } from "events";
import { OutgoingHttpHeaders } from "http";
import { Lazy } from "lazy-val";
import "source-map-support/register";
import { ElectronHttpExecutor } from "./electronHttpExecutor";
import { FileInfo, Logger, UpdateCheckResult, UpdaterSignal } from "./main";
export declare abstract class AppUpdater extends EventEmitter {
    /**
     * Whether to automatically download an update when it is found.
     */
    autoDownload: boolean;
    /**
     * *GitHub provider only.* Whether to allow update to pre-release versions. Defaults to `true` if application version contains prerelease components (e.g. `0.12.1-alpha.1`, here `alpha` is a prerelease component), otherwise `false`.
     *
     * If `true`, downgrade will be allowed (`allowDowngrade` will be set to `true`).
     */
    allowPrerelease: boolean;
    /**
     * Whether to allow version downgrade (when a user from the beta channel wants to go back to the stable channel).
     * @default false
     */
    allowDowngrade: boolean;
    /**
     *  The request headers.
     */
    requestHeaders: OutgoingHttpHeaders | null;
    protected _logger: Logger;
    /**
     * The logger. You can pass [electron-log](https://github.com/megahertz/electron-log), [winston](https://github.com/winstonjs/winston) or another logger with the following interface: `{ info(), warn(), error() }`.
     * Set it to `null` if you would like to disable a logging feature.
     */
    logger: Logger | null;
    /**
     * For type safety you can use signals, e.g. `autoUpdater.signals.updateDownloaded(() => {})` instead of `autoUpdater.on('update-available', () => {})`
     */
    readonly signals: UpdaterSignal;
    private _appUpdateConfigPath;
    /**
     * test only
     * @private
     */
    updateConfigPath: string | null;
    protected updateAvailable: boolean;
    private clientPromise;
    protected readonly stagingUserIdPromise: Lazy<string>;
    configOnDisk: Lazy<any>;
    private readonly untilAppReady;
    private checkForUpdatesPromise;
    protected readonly app: Electron.App;
    protected versionInfo: VersionInfo | null;
    private fileInfo;
    private currentVersion;
    protected readonly httpExecutor: ElectronHttpExecutor;
    constructor(options: PublishConfiguration | null | undefined, app?: any);
    getFeedURL(): string | null | undefined;
    /**
     * Configure update provider. If value is `string`, [GenericServerOptions](/configuration/publish.md#genericserveroptions) will be set with value as `url`.
     * @param options If you want to override configuration in the `app-update.yml`.
     */
    setFeedURL(options: PublishConfiguration | AllPublishOptions): void;
    /**
     * Asks the server whether there is an update.
     */
    checkForUpdates(): Promise<UpdateCheckResult>;
    checkForUpdatesAndNotify(): Promise<UpdateCheckResult> | undefined;
    private isStagingMatch(updateInfo);
    private _checkForUpdates();
    private computeFinalHeaders(headers);
    private doCheckForUpdates();
    protected onUpdateAvailable(versionInfo: VersionInfo, fileInfo: FileInfo): void;
    /**
     * Start downloading update manually. You can use this method if `autoDownload` option is set to `false`.
     * @returns {Promise<string>} Path to downloaded file.
     */
    downloadUpdate(cancellationToken?: CancellationToken): Promise<any>;
    protected dispatchError(e: Error): void;
    protected abstract doDownloadUpdate(versionInfo: VersionInfo, fileInfo: FileInfo, cancellationToken: CancellationToken): Promise<Array<string>>;
    /**
     * Restarts the app and installs the update after it has been downloaded.
     * It should only be called after `update-downloaded` has been emitted.
     *
     * **Note:** `autoUpdater.quitAndInstall()` will close all application windows first and only emit `before-quit` event on `app` after that.
     * This is different from the normal quit event sequence.
     *
     * @param isSilent *windows-only* Runs the installer in silent mode.
     * @param isForceRunAfter *windows-only* Run the app after finish even on silent install.
     */
    abstract quitAndInstall(isSilent?: boolean, isForceRunAfter?: boolean): void;
    private loadUpdateConfig();
    /*** @private */
    protected computeRequestHeaders(fileInfo: FileInfo): OutgoingHttpHeaders;
    private createClient(data);
    private getOrCreateStagingUserId();
}
/** @private */
export declare class NoOpLogger implements Logger {
    info(message?: any): void;
    warn(message?: any): void;
    error(message?: any): void;
}
