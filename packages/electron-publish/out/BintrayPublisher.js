"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.BintrayPublisher = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

var _bluebirdLst2;

function _load_bluebirdLst2() {
    return _bluebirdLst2 = _interopRequireDefault(require("bluebird-lst"));
}

var _builderUtil;

function _load_builderUtil() {
    return _builderUtil = require("builder-util");
}

var _builderUtilRuntime;

function _load_builderUtilRuntime() {
    return _builderUtilRuntime = require("builder-util-runtime");
}

var _bintray;

function _load_bintray() {
    return _bintray = require("builder-util-runtime/out/bintray");
}

var _nodeHttpExecutor;

function _load_nodeHttpExecutor() {
    return _nodeHttpExecutor = require("builder-util/out/nodeHttpExecutor");
}

var _publisher;

function _load_publisher() {
    return _publisher = require("./publisher");
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class BintrayPublisher extends (_publisher || _load_publisher()).HttpPublisher {
    constructor(context, info, version) {
        let options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

        super(context);
        this.version = version;
        this.options = options;
        this.providerName = "Bintray";
        let token = info.token;
        if ((0, (_builderUtil || _load_builderUtil()).isEmptyOrSpaces)(token)) {
            token = process.env.BT_TOKEN;
            if ((0, (_builderUtil || _load_builderUtil()).isEmptyOrSpaces)(token)) {
                throw new Error(`Bintray token is not set, neither programmatically, nor using env "BT_TOKEN" (see https://www.electron.build/configuration/publish#bintrayoptions)`);
            }
            token = token.trim();
            if (!(0, (_builderUtil || _load_builderUtil()).isTokenCharValid)(token)) {
                throw new Error(`Bintray token (${JSON.stringify(token)}) contains invalid characters, please check env "BT_TOKEN"`);
            }
        }
        this.client = new (_bintray || _load_bintray()).BintrayClient(info, (_nodeHttpExecutor || _load_nodeHttpExecutor()).httpExecutor, this.context.cancellationToken, token);
        this._versionPromise = this.init();
    }
    init() {
        var _this = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            try {
                return yield _this.client.getVersion(_this.version);
            } catch (e) {
                if (e instanceof (_builderUtilRuntime || _load_builderUtilRuntime()).HttpError && e.response.statusCode === 404) {
                    if (_this.options.publish !== "onTagOrDraft") {
                        (0, (_builderUtil || _load_builderUtil()).log)(`Version ${_this.version} doesn't exist, creating one`);
                        return _this.client.createVersion(_this.version);
                    } else {
                        (0, (_builderUtil || _load_builderUtil()).log)(`Version ${_this.version} doesn't exist, artifacts will be not published`);
                    }
                }
                throw e;
            }
        })();
    }
    doUpload(fileName, arch, dataLength, requestProcessor) {
        var _this2 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            const version = yield _this2._versionPromise;
            if (version == null) {
                (0, (_builderUtil || _load_builderUtil()).debug)(`Version ${_this2.version} doesn't exist and is not created, artifact ${fileName} is not published`);
                return;
            }
            const options = {
                hostname: "api.bintray.com",
                path: `/content/${_this2.client.owner}/${_this2.client.repo}/${_this2.client.packageName}/${version.name}/${fileName}`,
                method: "PUT",
                headers: {
                    "Content-Length": dataLength,
                    "X-Bintray-Override": "1",
                    "X-Bintray-Publish": "1",
                    "X-Bintray-Debian-Architecture": (0, (_builderUtil || _load_builderUtil()).toLinuxArchString)(arch)
                }
            };
            if (_this2.client.distribution) {
                options.headers = options.headers || {};
                options.headers["X-Bintray-Debian-Distribution"] = _this2.client.distribution;
            }
            if (_this2.client.component) {
                options.headers = options.headers || {};
                options.headers["X-Bintray-Debian-Component"] = _this2.client.component;
            }
            for (let attemptNumber = 0;; attemptNumber++) {
                try {
                    return yield (_nodeHttpExecutor || _load_nodeHttpExecutor()).httpExecutor.doApiRequest((0, (_builderUtilRuntime || _load_builderUtilRuntime()).configureRequestOptions)(options, _this2.client.auth), _this2.context.cancellationToken, requestProcessor);
                } catch (e) {
                    if (attemptNumber < 3 && (e instanceof (_builderUtilRuntime || _load_builderUtilRuntime()).HttpError && e.response.statusCode === 502 || e.code === "EPIPE")) {
                        continue;
                    }
                    throw e;
                }
            }
        })();
    }
    //noinspection JSUnusedGlobalSymbols
    deleteRelease() {
        if (!this._versionPromise.isFulfilled()) {
            return (_bluebirdLst2 || _load_bluebirdLst2()).default.resolve();
        }
        const version = this._versionPromise.value();
        return version == null ? (_bluebirdLst2 || _load_bluebirdLst2()).default.resolve() : this.client.deleteVersion(version.name);
    }
    toString() {
        return `Bintray (user: ${this.client.user || this.client.owner}, owner: ${this.client.owner},  package: ${this.client.packageName}, repository: ${this.client.repo}, version: ${this.version})`;
    }
}
exports.BintrayPublisher = BintrayPublisher; //# sourceMappingURL=BintrayPublisher.js.map