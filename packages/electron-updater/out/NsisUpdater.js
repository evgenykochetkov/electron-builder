"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.NsisUpdater = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

var _builderUtilRuntime;

function _load_builderUtilRuntime() {
    return _builderUtilRuntime = require("builder-util-runtime");
}

var _blockMapApi;

function _load_blockMapApi() {
    return _blockMapApi = require("builder-util-runtime/out/blockMapApi");
}

var _child_process;

function _load_child_process() {
    return _child_process = require("child_process");
}

var _fsExtraP;

function _load_fsExtraP() {
    return _fsExtraP = require("fs-extra-p");
}

var _os;

function _load_os() {
    return _os = require("os");
}

var _path = _interopRequireWildcard(require("path"));

require("source-map-support/register");

var _AppUpdater;

function _load_AppUpdater() {
    return _AppUpdater = require("./AppUpdater");
}

var _differentialPackage;

function _load_differentialPackage() {
    return _differentialPackage = require("./differentialPackage");
}

var _DownloadedUpdateHelper;

function _load_DownloadedUpdateHelper() {
    return _DownloadedUpdateHelper = require("./DownloadedUpdateHelper");
}

var _main;

function _load_main() {
    return _main = require("./main");
}

var _windowsExecutableCodeSignatureVerifier;

function _load_windowsExecutableCodeSignatureVerifier() {
    return _windowsExecutableCodeSignatureVerifier = require("./windowsExecutableCodeSignatureVerifier");
}

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

class NsisUpdater extends (_AppUpdater || _load_AppUpdater()).AppUpdater {
    constructor(options, app) {
        super(options, app);
        this.downloadedUpdateHelper = new (_DownloadedUpdateHelper || _load_DownloadedUpdateHelper()).DownloadedUpdateHelper();
        this.quitAndInstallCalled = false;
        this.quitHandlerAdded = false;
    }
    /*** @private */
    doDownloadUpdate(versionInfo, fileInfo, cancellationToken) {
        var _this = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            const downloadOptions = {
                skipDirCreation: true,
                headers: _this.computeRequestHeaders(fileInfo),
                cancellationToken,
                sha512: fileInfo == null ? null : fileInfo.sha512
            };
            let packagePath = _this.downloadedUpdateHelper.packagePath;
            let installerPath = _this.downloadedUpdateHelper.getDownloadedFile(versionInfo, fileInfo);
            if (installerPath != null) {
                return packagePath == null ? [installerPath] : [installerPath, packagePath];
            }
            if (_this.listenerCount((_main || _load_main()).DOWNLOAD_PROGRESS) > 0) {
                downloadOptions.onProgress = function (it) {
                    return _this.emit((_main || _load_main()).DOWNLOAD_PROGRESS, it);
                };
            }
            // use TEST_APP_TMP_DIR if defined and developer machine (must be not windows due to security reasons - we must not use env var in the production)
            const tempDir = yield (0, (_fsExtraP || _load_fsExtraP()).mkdtemp)(`${_path.join((process.platform === "darwin" ? process.env.TEST_APP_TMP_DIR : null) || (0, (_os || _load_os()).tmpdir)(), "up")}-`);
            installerPath = _path.join(tempDir, fileInfo.name);
            const removeTempDirIfAny = function () {
                _this.downloadedUpdateHelper.clear();
                return (0, (_fsExtraP || _load_fsExtraP()).remove)(tempDir).catch(function () {
                    // ignored
                });
            };
            let signatureVerificationStatus;
            try {
                yield _this.httpExecutor.download(fileInfo.url, installerPath, downloadOptions);
                signatureVerificationStatus = yield _this.verifySignature(installerPath);
                const packageInfo = fileInfo.packageInfo;
                if (packageInfo != null) {
                    packagePath = _path.join(tempDir, `${fileInfo.name}-package${_path.extname(packageInfo.file) || ".7z"}`);
                    let isDownloadFull = packageInfo.blockMapSize == null || packageInfo.headerSize == null;
                    if (!isDownloadFull) {
                        try {
                            yield new (_differentialPackage || _load_differentialPackage()).DifferentialDownloader(packageInfo, _this.httpExecutor, {
                                oldBlockMapFile: _path.join(process.resourcesPath, "..", (_blockMapApi || _load_blockMapApi()).BLOCK_MAP_FILE_NAME),
                                oldPackageFile: _path.join(process.resourcesPath, "..", "package.7z"),
                                logger: _this._logger,
                                packagePath,
                                requestHeaders: _this.requestHeaders
                            }).download();
                        } catch (e) {
                            _this._logger.error(`Cannot download differentially, fallback to full download: ${e.stack || e}`);
                            // during test (developer machine mac or linux) we must throw error
                            isDownloadFull = process.platform === "win32";
                        }
                    }
                    if (isDownloadFull) {
                        yield _this.httpExecutor.download(packageInfo.file, packagePath, {
                            skipDirCreation: true,
                            headers: _this.computeRequestHeaders(fileInfo),
                            cancellationToken,
                            sha512: packageInfo.sha512
                        });
                    }
                }
            } catch (e) {
                yield removeTempDirIfAny();
                if (e instanceof (_builderUtilRuntime || _load_builderUtilRuntime()).CancellationError) {
                    _this.emit("update-cancelled", _this.versionInfo);
                    _this._logger.info("Cancelled");
                }
                throw e;
            }
            if (signatureVerificationStatus != null) {
                yield removeTempDirIfAny();
                // noinspection ThrowInsideFinallyBlockJS
                throw new Error(`New version ${_this.versionInfo.version} is not signed by the application owner: ${signatureVerificationStatus}`);
            }
            _this._logger.info(`New version ${_this.versionInfo.version} has been downloaded to ${installerPath}`);
            _this.downloadedUpdateHelper.setDownloadedFile(installerPath, packagePath, versionInfo, fileInfo);
            _this.addQuitHandler();
            _this.emit((_main || _load_main()).UPDATE_DOWNLOADED, _this.versionInfo);
            return packagePath == null ? [installerPath] : [installerPath, packagePath];
        })();
    }
    // $certificateInfo = (Get-AuthenticodeSignature 'xxx\yyy.exe'
    // | where {$_.Status.Equals([System.Management.Automation.SignatureStatus]::Valid) -and $_.SignerCertificate.Subject.Contains("CN=siemens.com")})
    // | Out-String ; if ($certificateInfo) { exit 0 } else { exit 1 }
    verifySignature(tempUpdateFile) {
        var _this2 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            let publisherName;
            try {
                publisherName = (yield _this2.configOnDisk.value).publisherName;
                if (publisherName == null) {
                    return null;
                }
            } catch (e) {
                if (e.code === "ENOENT") {
                    // no app-update.yml
                    return null;
                }
                throw e;
            }
            return yield (0, (_windowsExecutableCodeSignatureVerifier || _load_windowsExecutableCodeSignatureVerifier()).verifySignature)(Array.isArray(publisherName) ? publisherName : [publisherName], tempUpdateFile, _this2._logger);
        })();
    }
    addQuitHandler() {
        if (this.quitHandlerAdded) {
            return;
        }
        this.quitHandlerAdded = true;
        this.app.on("quit", () => {
            this._logger.info("Auto install update on quit");
            this.install(true, false);
        });
    }
    quitAndInstall() {
        let isSilent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
        let isForceRunAfter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        if (this.install(isSilent, isForceRunAfter)) {
            this.app.quit();
        }
    }
    install(isSilent, isForceRunAfter) {
        if (this.quitAndInstallCalled) {
            return false;
        }
        const installerPath = this.downloadedUpdateHelper.file;
        if (!this.updateAvailable || installerPath == null) {
            this.dispatchError(new Error("No update available, can't quit and install"));
            return false;
        }
        // prevent calling several times
        this.quitAndInstallCalled = true;
        const args = ["--updated"];
        if (isSilent) {
            args.push("/S");
        }
        if (isForceRunAfter) {
            args.push("--force-run");
        }
        const packagePath = this.downloadedUpdateHelper.packagePath;
        if (packagePath != null) {
            // only = form is supported
            args.push(`--package-file=${packagePath}`);
        }
        const spawnOptions = {
            detached: true,
            stdio: "ignore"
        };
        try {
            (0, (_child_process || _load_child_process()).spawn)(installerPath, args, spawnOptions).unref();
        } catch (e) {
            // yes, such errors dispatched not as error event
            // https://github.com/electron-userland/electron-builder/issues/1129
            if (e.code === "UNKNOWN" || e.code === "EACCES") {
                this._logger.info("Access denied or UNKNOWN error code on spawn, will be executed again using elevate");
                try {
                    (0, (_child_process || _load_child_process()).spawn)(_path.join(process.resourcesPath, "elevate.exe"), [installerPath].concat(args), spawnOptions).unref();
                } catch (e) {
                    this.dispatchError(e);
                }
            } else {
                this.dispatchError(e);
            }
        }
        return true;
    }
}
exports.NsisUpdater = NsisUpdater; //# sourceMappingURL=NsisUpdater.js.map