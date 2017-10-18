"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.PrivateGitHubProvider = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

var _builderUtilRuntime;

function _load_builderUtilRuntime() {
    return _builderUtilRuntime = require("builder-util-runtime");
}

var _electron;

function _load_electron() {
    return _electron = require("electron");
}

var _jsYaml;

function _load_jsYaml() {
    return _jsYaml = require("js-yaml");
}

var _path = _interopRequireWildcard(require("path"));

var _url;

function _load_url() {
    return _url = require("url");
}

var _electronHttpExecutor;

function _load_electronHttpExecutor() {
    return _electronHttpExecutor = require("./electronHttpExecutor");
}

var _GitHubProvider;

function _load_GitHubProvider() {
    return _GitHubProvider = require("./GitHubProvider");
}

var _main;

function _load_main() {
    return _main = require("./main");
}

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

class PrivateGitHubProvider extends (_GitHubProvider || _load_GitHubProvider()).BaseGitHubProvider {
    constructor(options, token, executor) {
        super(options, "api.github.com", executor);
        this.token = token;
        this.netSession = (_electron || _load_electron()).session.fromPartition((_electronHttpExecutor || _load_electronHttpExecutor()).NET_SESSION_NAME);
        this.registerHeaderRemovalListener();
    }
    createRequestOptions(url, headers) {
        const result = super.createRequestOptions(url, headers);
        result.session = this.netSession;
        return result;
    }
    getLatestVersion() {
        var _this = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            const basePath = _this.basePath;
            const cancellationToken = new (_builderUtilRuntime || _load_builderUtilRuntime()).CancellationToken();
            const channelFile = (0, (_main || _load_main()).getChannelFilename)((0, (_main || _load_main()).getDefaultChannelName)());
            const releaseInfo = yield _this.getLatestVersionInfo(basePath, cancellationToken);
            const asset = releaseInfo.assets.find(function (it) {
                return it.name === channelFile;
            });
            if (asset == null) {
                // html_url must be always, but just to be sure
                throw new Error(`Cannot find ${channelFile} in the release ${releaseInfo.html_url || releaseInfo.name}`);
            }
            const url = new (_url || _load_url()).URL(asset.url);
            let result;
            try {
                result = (0, (_jsYaml || _load_jsYaml()).safeLoad)((yield _this.httpRequest(url, _this.configureHeaders("application/octet-stream"), cancellationToken)));
            } catch (e) {
                if (e instanceof (_builderUtilRuntime || _load_builderUtilRuntime()).HttpError && e.response.statusCode === 404) {
                    throw new Error(`Cannot find ${channelFile} in the latest release artifacts (${url}): ${e.stack || e.message}`);
                }
                throw e;
            }
            (_main || _load_main()).Provider.validateUpdateInfo(result);
            result.assets = releaseInfo.assets;
            return result;
        })();
    }
    registerHeaderRemovalListener() {
        const filter = {
            urls: ["*://*.amazonaws.com/*"]
        };
        this.netSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
            if (details.requestHeaders.Authorization != null) {
                delete details.requestHeaders.Authorization;
            }
            callback({ cancel: false, requestHeaders: details.requestHeaders });
        });
    }
    configureHeaders(accept) {
        return {
            Accept: accept,
            Authorization: `token ${this.token}`
        };
    }
    getLatestVersionInfo(basePath, cancellationToken) {
        var _this2 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            const url = (0, (_main || _load_main()).newUrlFromBase)(`${basePath}/latest`, _this2.baseUrl);
            try {
                return JSON.parse((yield _this2.httpRequest(url, _this2.configureHeaders("application/vnd.github.v3+json"), cancellationToken)));
            } catch (e) {
                throw new Error(`Unable to find latest version on GitHub (${url}), please ensure a production release exists: ${e.stack || e.message}`);
            }
        })();
    }
    get basePath() {
        return this.computeGithubBasePath(`/repos/${this.options.owner}/${this.options.repo}/releases`);
    }
    getUpdateFile(versionInfo) {
        var _this3 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            const name = versionInfo.githubArtifactName || _path.posix.basename(versionInfo.path).replace(/ /g, "-");
            // noinspection JSDeprecatedSymbols
            return {
                name,
                url: versionInfo.assets.find(function (it) {
                    return it.name === name;
                }).url,
                sha512: versionInfo.sha512,
                headers: _this3.configureHeaders("application/octet-stream"),
                session: _this3.netSession
            };
        })();
    }
}
exports.PrivateGitHubProvider = PrivateGitHubProvider; //# sourceMappingURL=PrivateGitHubProvider.js.map