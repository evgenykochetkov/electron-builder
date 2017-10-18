"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.GitHubProvider = exports.BaseGitHubProvider = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

var _builderUtilRuntime;

function _load_builderUtilRuntime() {
    return _builderUtilRuntime = require("builder-util-runtime");
}

var _jsYaml;

function _load_jsYaml() {
    return _jsYaml = require("js-yaml");
}

var _path = _interopRequireWildcard(require("path"));

var _main;

function _load_main() {
    return _main = require("./main");
}

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

class BaseGitHubProvider extends (_main || _load_main()).Provider {
    constructor(options, defaultHost, executor) {
        super(executor);
        this.options = options;
        this.baseUrl = (0, (_main || _load_main()).newBaseUrl)((0, (_builderUtilRuntime || _load_builderUtilRuntime()).githubUrl)(options, defaultHost));
    }
    computeGithubBasePath(result) {
        // https://github.com/electron-userland/electron-builder/issues/1903#issuecomment-320881211
        const host = this.options.host;
        return host != null && host !== "github.com" && host !== "api.github.com" ? `/api/v3${result}` : result;
    }
}
exports.BaseGitHubProvider = BaseGitHubProvider;
class GitHubProvider extends BaseGitHubProvider {
    constructor(options, updater, executor) {
        super(options, "github.com", executor);
        this.options = options;
        this.updater = updater;
    }
    getLatestVersion() {
        var _this = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            const basePath = _this.basePath;
            const cancellationToken = new (_builderUtilRuntime || _load_builderUtilRuntime()).CancellationToken();
            const xElement = require("xelement");
            const feedXml = yield _this.httpRequest((0, (_main || _load_main()).newUrlFromBase)(`${basePath}.atom`, _this.baseUrl), {
                Accept: "application/xml, application/atom+xml, text/xml, */*"
            }, cancellationToken);
            const feed = new xElement.Parse(feedXml);
            const latestRelease = feed.element("entry");
            if (latestRelease == null) {
                throw new Error(`No published versions on GitHub`);
            }
            let version;
            try {
                if (_this.updater.allowPrerelease) {
                    version = latestRelease.element("link").getAttr("href").match(/\/tag\/v?([^\/]+)$/)[1];
                } else {
                    version = yield _this.getLatestVersionString(basePath, cancellationToken);
                }
            } catch (e) {
                throw new Error(`Cannot parse releases feed: ${e.stack || e.message},\nXML:\n${feedXml}`);
            }
            if (version == null) {
                throw new Error(`No published versions on GitHub`);
            }
            let result;
            const channelFile = (0, (_main || _load_main()).getChannelFilename)((0, (_main || _load_main()).getDefaultChannelName)());
            const channelFileUrl = (0, (_main || _load_main()).newUrlFromBase)(_this.getBaseDownloadPath(version, channelFile), _this.baseUrl);
            const requestOptions = _this.createRequestOptions(channelFileUrl);
            let rawData;
            try {
                rawData = yield _this.executor.request(requestOptions, cancellationToken);
            } catch (e) {
                if (!_this.updater.allowPrerelease) {
                    if (e instanceof (_builderUtilRuntime || _load_builderUtilRuntime()).HttpError && e.response.statusCode === 404) {
                        throw new Error(`Cannot find ${channelFile} in the latest release artifacts (${channelFileUrl}): ${e.stack || e.message}`);
                    }
                }
                throw e;
            }
            try {
                result = (0, (_jsYaml || _load_jsYaml()).safeLoad)(rawData);
            } catch (e) {
                throw new Error(`Cannot parse update info from ${channelFile} in the latest release artifacts (${channelFileUrl}): ${e.stack || e.message}, rawData: ${rawData}`);
            }
            (_main || _load_main()).Provider.validateUpdateInfo(result);
            if ((0, (_main || _load_main()).isUseOldMacProvider)()) {
                result.releaseJsonUrl = `${(0, (_builderUtilRuntime || _load_builderUtilRuntime()).githubUrl)(_this.options)}/${requestOptions.path}`;
            }
            if (result.releaseName == null) {
                result.releaseName = latestRelease.getElementValue("title");
            }
            if (result.releaseNotes == null) {
                result.releaseNotes = latestRelease.getElementValue("content");
            }
            return result;
        })();
    }
    getLatestVersionString(basePath, cancellationToken) {
        var _this2 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            const url = (0, (_main || _load_main()).newUrlFromBase)(`${basePath}/latest`, _this2.baseUrl);
            try {
                // do not use API to avoid limit
                const rawData = yield _this2.httpRequest(url, { Accept: "application/json" }, cancellationToken);
                if (rawData == null) {
                    return null;
                }
                const releaseInfo = JSON.parse(rawData);
                return releaseInfo.tag_name.startsWith("v") ? releaseInfo.tag_name.substring(1) : releaseInfo.tag_name;
            } catch (e) {
                throw new Error(`Unable to find latest version on GitHub (${url}), please ensure a production release exists: ${e.stack || e.message}`);
            }
        })();
    }
    get basePath() {
        return this.computeGithubBasePath(`/${this.options.owner}/${this.options.repo}/releases`);
    }
    getUpdateFile(versionInfo) {
        var _this3 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            if ((0, (_main || _load_main()).isUseOldMacProvider)()) {
                return versionInfo;
            }
            // space is not supported on GitHub
            const name = versionInfo.githubArtifactName || _path.posix.basename(versionInfo.path).replace(/ /g, "-");
            const result = {
                name,
                url: (0, (_main || _load_main()).newUrlFromBase)(_this3.getBaseDownloadPath(versionInfo.version, name), _this3.baseUrl).href,
                sha512: versionInfo.sha512
            };
            const packages = versionInfo.packages;
            const packageInfo = packages == null ? null : packages[process.arch] || packages.ia32;
            if (packageInfo != null) {
                result.packageInfo = Object.assign({}, packageInfo, { file: (0, (_main || _load_main()).newUrlFromBase)(_this3.getBaseDownloadPath(versionInfo.version, packageInfo.file), _this3.baseUrl).href });
            }
            return result;
        })();
    }
    getBaseDownloadPath(version, fileName) {
        return `${this.basePath}/download/${this.options.vPrefixedTagName === false ? "" : "v"}${version}/${fileName}`;
    }
}
exports.GitHubProvider = GitHubProvider; //# sourceMappingURL=GitHubProvider.js.map