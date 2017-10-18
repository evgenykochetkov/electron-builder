import { CancellationToken, PublishConfiguration, VersionInfo } from "builder-util-runtime";
import { AppUpdater } from "./AppUpdater";
import { FileInfo } from "./main";
export declare class MacUpdater extends AppUpdater {
    private readonly nativeUpdater;
    constructor(options?: PublishConfiguration);
    protected doDownloadUpdate(versionInfo: VersionInfo, fileInfo: FileInfo, cancellationToken: CancellationToken): Promise<Array<string>>;
    private proxyUpdateFile(nativeResponse, fileInfo, cancellationToken, errorHandler);
    private doProxyUpdateFile(nativeResponse, url, headers, sha512, cancellationToken, errorHandler);
    quitAndInstall(): void;
}
