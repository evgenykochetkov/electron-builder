import { DownloadOptions, HttpExecutor } from "builder-util-runtime";
export declare const NET_SESSION_NAME = "electron-updater";
export declare type LoginCallback = (username: string, password: string) => void;
export declare class ElectronHttpExecutor extends HttpExecutor<Electron.ClientRequest> {
    private readonly proxyLoginCallback;
    constructor(proxyLoginCallback?: ((authInfo: any, callback: LoginCallback) => void) | undefined);
    download(url: string, destination: string, options: DownloadOptions): Promise<string>;
    doRequest(options: any, callback: (response: any) => void): any;
    private addProxyLoginHandler(request);
}
