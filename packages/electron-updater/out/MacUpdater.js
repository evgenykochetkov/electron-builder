"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.MacUpdater = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = _interopRequireDefault(require("bluebird-lst"));
}

var _builderUtilRuntime;

function _load_builderUtilRuntime() {
    return _builderUtilRuntime = require("builder-util-runtime");
}

var _http;

function _load_http() {
    return _http = require("http");
}

var _AppUpdater;

function _load_AppUpdater() {
    return _AppUpdater = require("./AppUpdater");
}

var _main;

function _load_main() {
    return _main = require("./main");
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class MacUpdater extends (_AppUpdater || _load_AppUpdater()).AppUpdater {
    constructor(options) {
        super(options);
        this.nativeUpdater = require("electron").autoUpdater;
        this.nativeUpdater.on("error", it => {
            this._logger.warn(it);
            this.emit("error", it);
        });
        this.nativeUpdater.on("update-downloaded", () => {
            this._logger.info(`New version ${this.versionInfo.version} has been downloaded`);
            this.emit((_main || _load_main()).UPDATE_DOWNLOADED, this.versionInfo);
        });
    }
    doDownloadUpdate(versionInfo, fileInfo, cancellationToken) {
        const server = (0, (_http || _load_http()).createServer)();
        server.on("close", () => {
            this._logger.info(`Proxy server for native Squirrel.Mac is closed (was started to download ${fileInfo.url})`);
        });
        function getServerUrl() {
            const address = server.address();
            return `http://${address.address}:${address.port}`;
        }
        return new (_bluebirdLst || _load_bluebirdLst()).default((resolve, reject) => {
            server.on("request", (request, response) => {
                const requestUrl = request.url;
                this._logger.info(`${requestUrl} requested`);
                if (requestUrl === "/") {
                    const data = Buffer.from(`{ "url": "${getServerUrl()}/app.zip" }`);
                    response.writeHead(200, { "Content-Type": "application/json", "Content-Length": data.length });
                    response.end(data);
                } else if (requestUrl.startsWith("/app.zip")) {
                    let errorOccurred = false;
                    response.on("finish", () => {
                        try {
                            setImmediate(() => server.close());
                        } finally {
                            if (!errorOccurred) {
                                this.nativeUpdater.removeListener("error", reject);
                                resolve([]);
                            }
                        }
                    });
                    this.proxyUpdateFile(response, fileInfo, cancellationToken, error => {
                        errorOccurred = true;
                        try {
                            response.writeHead(500);
                            response.end();
                        } finally {
                            this.nativeUpdater.removeListener("error", reject);
                            reject(new Error(`Cannot download "${fileInfo.url}": ${error}`));
                        }
                    });
                } else {
                    this._logger.warn(`${requestUrl} requested, but not supported`);
                    response.writeHead(404);
                    response.end();
                }
            });
            server.listen(0, "127.0.0.1", 16, () => {
                this.nativeUpdater.setFeedURL(`${getServerUrl()}`, { "Cache-Control": "no-cache" });
                this.nativeUpdater.once("error", reject);
                this.nativeUpdater.checkForUpdates();
            });
        });
    }
    proxyUpdateFile(nativeResponse, fileInfo, cancellationToken, errorHandler) {
        this.doProxyUpdateFile(nativeResponse, fileInfo.url, this.computeRequestHeaders(fileInfo), fileInfo.sha512 || null, cancellationToken, errorHandler);
    }
    doProxyUpdateFile(nativeResponse, url, headers, sha512, cancellationToken, errorHandler) {
        const downloadRequest = this.httpExecutor.doRequest((0, (_builderUtilRuntime || _load_builderUtilRuntime()).configureRequestOptionsFromUrl)(url, { headers }), downloadResponse => {
            if (downloadResponse.statusCode >= 400) {
                try {
                    nativeResponse.writeHead(404);
                    nativeResponse.end();
                } finally {
                    errorHandler(new Error(`Cannot download "${url}", status ${downloadResponse.statusCode}: ${downloadResponse.statusMessage}`));
                }
                return;
            }
            // in tests Electron NET Api is not used, so, we have to handle redirect.
            const redirectUrl = (0, (_builderUtilRuntime || _load_builderUtilRuntime()).safeGetHeader)(downloadResponse, "location");
            if (redirectUrl != null) {
                this.doProxyUpdateFile(nativeResponse, redirectUrl, headers, sha512, cancellationToken, errorHandler);
                return;
            }
            const nativeHeaders = { "Content-Type": "application/zip" };
            const streams = [];
            const downloadListenerCount = this.listenerCount((_main || _load_main()).DOWNLOAD_PROGRESS);
            this._logger.info(`${(_main || _load_main()).DOWNLOAD_PROGRESS} listener count: ${downloadListenerCount}`);
            if (downloadListenerCount > 0) {
                const contentLength = (0, (_builderUtilRuntime || _load_builderUtilRuntime()).safeGetHeader)(downloadResponse, "content-length");
                this._logger.info(`contentLength: ${contentLength}`);
                if (contentLength != null) {
                    nativeHeaders["Content-Length"] = contentLength;
                    streams.push(new (_builderUtilRuntime || _load_builderUtilRuntime()).ProgressCallbackTransform(parseInt(contentLength, 10), cancellationToken, it => this.emit((_main || _load_main()).DOWNLOAD_PROGRESS, it)));
                }
            }
            nativeResponse.writeHead(200, nativeHeaders);
            // for mac only sha512 is produced (sha256 is published for windows only to preserve backward compatibility)
            if (sha512 != null) {
                // "hex" to easy migrate to new base64 encoded hash (we already produces latest-mac.yml with hex encoded hash)
                streams.push(new (_builderUtilRuntime || _load_builderUtilRuntime()).DigestTransform(sha512, "sha512", sha512.length === 128 && !(sha512.indexOf("+") !== -1) && !(sha512.indexOf("Z") !== -1) && !(sha512.indexOf("=") !== -1) ? "hex" : "base64"));
            }
            streams.push(nativeResponse);
            let lastStream = downloadResponse;
            for (const stream of streams) {
                stream.on("error", errorHandler);
                lastStream = lastStream.pipe(stream);
            }
        });
        downloadRequest.on("error", errorHandler);
        downloadRequest.end();
    }
    quitAndInstall() {
        this.nativeUpdater.quitAndInstall();
    }
}
exports.MacUpdater = MacUpdater; //# sourceMappingURL=MacUpdater.js.map