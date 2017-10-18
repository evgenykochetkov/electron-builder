"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.BintrayProvider = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

var _builderUtilRuntime;

function _load_builderUtilRuntime() {
    return _builderUtilRuntime = require("builder-util-runtime");
}

var _bintray;

function _load_bintray() {
    return _bintray = require("builder-util-runtime/out/bintray");
}

var _main;

function _load_main() {
    return _main = require("./main");
}

class BintrayProvider extends (_main || _load_main()).Provider {
    setRequestHeaders(value) {
        super.setRequestHeaders(value);
        this.client.setRequestHeaders(value);
    }
    constructor(configuration, httpExecutor) {
        super(httpExecutor);
        this.client = new (_bintray || _load_bintray()).BintrayClient(configuration, httpExecutor, new (_builderUtilRuntime || _load_builderUtilRuntime()).CancellationToken());
    }
    getLatestVersion() {
        var _this = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            try {
                const data = yield _this.client.getVersion("_latest");
                return {
                    version: data.name
                };
            } catch (e) {
                if ("response" in e && e.response.statusCode === 404) {
                    throw new Error(`No latest version, please ensure that user, package and repository correctly configured. Or at least one version is published. ${e.stack || e.message}`);
                }
                throw e;
            }
        })();
    }
    getUpdateFile(versionInfo) {
        var _this2 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            try {
                const files = yield _this2.client.getVersionFiles(versionInfo.version);
                const suffix = `${versionInfo.version}.exe`;
                const file = files.find(function (it) {
                    return it.name.endsWith(suffix) && it.name.indexOf("Setup") !== -1;
                }) || files.find(function (it) {
                    return it.name.endsWith(suffix);
                }) || files.find(function (it) {
                    return it.name.endsWith(".exe");
                });
                if (file == null) {
                    //noinspection ExceptionCaughtLocallyJS
                    throw new Error(`Cannot find suitable file for version ${versionInfo.version} in: ${JSON.stringify(files, null, 2)}`);
                }
                return {
                    name: file.name,
                    url: `https://dl.bintray.com/${_this2.client.owner}/${_this2.client.repo}/${file.name}`,
                    sha2: file.sha256
                };
            } catch (e) {
                if (e instanceof (_builderUtilRuntime || _load_builderUtilRuntime()).HttpError && e.response.statusCode === 404) {
                    throw new Error(`No latest version, please ensure that user, package and repository correctly configured. Or at least one version is published. ${e.stack || e.message}`);
                }
                throw e;
            }
        })();
    }
}
exports.BintrayProvider = BintrayProvider; //# sourceMappingURL=BintrayProvider.js.map