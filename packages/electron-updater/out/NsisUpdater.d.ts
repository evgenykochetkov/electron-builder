import { CancellationToken, GenericServerOptions, PublishConfiguration, VersionInfo } from "builder-util-runtime";
import "source-map-support/register";
import { AppUpdater } from "./AppUpdater";
import { FileInfo } from "./main";
export declare class NsisUpdater extends AppUpdater {
    private readonly downloadedUpdateHelper;
    private quitAndInstallCalled;
    private quitHandlerAdded;
    constructor(options?: PublishConfiguration | GenericServerOptions | null, app?: any);
    /*** @private */
    protected doDownloadUpdate(versionInfo: VersionInfo, fileInfo: FileInfo, cancellationToken: CancellationToken): Promise<Array<string>>;
    private verifySignature(tempUpdateFile);
    private addQuitHandler();
    quitAndInstall(isSilent?: boolean, isForceRunAfter?: boolean): void;
    private install(isSilent, isForceRunAfter);
}
