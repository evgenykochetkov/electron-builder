"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.GenericProvider = undefined;

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

class GenericProvider extends (_main || _load_main()).Provider {
    constructor(configuration, executor) {
        super(executor);
        this.configuration = configuration;
        this.baseUrl = (0, (_main || _load_main()).newBaseUrl)(this.configuration.url);
        this.channel = this.configuration.channel ? (0, (_main || _load_main()).getCustomChannelName)(this.configuration.channel) : (0, (_main || _load_main()).getDefaultChannelName)();
    }
    getLatestVersion() {
        var _this = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            let result;
            const channelFile = (0, (_main || _load_main()).getChannelFilename)(_this.channel);
            const channelUrl = (0, (_main || _load_main()).newUrlFromBase)(channelFile, _this.baseUrl);
            try {
                const options = {
                    hostname: channelUrl.hostname,
                    path: `${channelUrl.pathname}${channelUrl.search}`,
                    protocol: channelUrl.protocol,
                    headers: _this.requestHeaders || undefined
                };
                if (channelUrl.port != null) {
                    options.port = channelUrl.port;
                }
                result = (0, (_jsYaml || _load_jsYaml()).safeLoad)((yield _this.executor.request(options)));
            } catch (e) {
                if (e instanceof (_builderUtilRuntime || _load_builderUtilRuntime()).HttpError && e.response.statusCode === 404) {
                    throw new Error(`Cannot find channel "${channelFile}" update info: ${e.stack || e.message}`);
                }
                throw e;
            }
            (_main || _load_main()).Provider.validateUpdateInfo(result);
            if ((0, (_main || _load_main()).isUseOldMacProvider)()) {
                result.releaseJsonUrl = channelUrl.href;
            }
            return result;
        })();
    }
    getUpdateFile(versionInfo) {
        var _this2 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            if ((0, (_main || _load_main()).isUseOldMacProvider)()) {
                return versionInfo;
            }
            const filePath = versionInfo.path;
            const result = {
                name: _path.posix.basename(filePath),
                url: (0, (_main || _load_main()).newUrlFromBase)(filePath, _this2.baseUrl).href,
                sha512: versionInfo.sha512
            };
            const packages = versionInfo.packages;
            const packageInfo = packages == null ? null : packages[process.arch] || packages.ia32;
            if (packageInfo != null) {
                result.packageInfo = Object.assign({}, packageInfo, { file: (0, (_main || _load_main()).newUrlFromBase)(packageInfo.file, _this2.baseUrl).href });
            }
            return result;
        })();
    }
}
exports.GenericProvider = GenericProvider; //# sourceMappingURL=GenericProvider.js.map