"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.GitHubPublisher = undefined;

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

var _nodeHttpExecutor;

function _load_nodeHttpExecutor() {
    return _nodeHttpExecutor = require("builder-util/out/nodeHttpExecutor");
}

var _mime;

function _load_mime() {
    return _mime = _interopRequireDefault(require("mime"));
}

var _url;

function _load_url() {
    return _url = require("url");
}

var _publisher;

function _load_publisher() {
    return _publisher = require("./publisher");
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class GitHubPublisher extends (_publisher || _load_publisher()).HttpPublisher {
    constructor(context, info, version) {
        let options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

        super(context, true);
        this.info = info;
        this.version = version;
        this.options = options;
        this.providerName = "GitHub";
        let token = info.token;
        if ((0, (_builderUtil || _load_builderUtil()).isEmptyOrSpaces)(token)) {
            token = process.env.GH_TOKEN;
            if ((0, (_builderUtil || _load_builderUtil()).isEmptyOrSpaces)(token)) {
                throw new Error(`GitHub Personal Access Token is not set, neither programmatically, nor using env "GH_TOKEN"`);
            }
            token = token.trim();
            if (!(0, (_builderUtil || _load_builderUtil()).isTokenCharValid)(token)) {
                throw new Error(`GitHub Personal Access Token (${JSON.stringify(token)}) contains invalid characters, please check env "GH_TOKEN"`);
            }
        }
        this.token = token;
        if (version.startsWith("v")) {
            throw new Error(`Version must not starts with "v": ${version}`);
        }
        this.tag = info.vPrefixedTagName === false ? version : `v${version}`;
        if ((0, (_builderUtil || _load_builderUtil()).isEnvTrue)(process.env.EP_DRAFT)) {
            this.releaseType = "draft";
        } else if ((0, (_builderUtil || _load_builderUtil()).isEnvTrue)(process.env.EP_PRELEASE)) {
            this.releaseType = "prerelease";
        } else if (info.releaseType != null) {
            this.releaseType = info.releaseType;
        } else if (options.prerelease) {
            this.releaseType = "prerelease";
        } else {
            this.releaseType = options.draft === false ? "release" : "draft";
        }
    }
    /** @private */
    get releasePromise() {
        if (this._releasePromise == null) {
            this._releasePromise = this.token === "__test__" ? (_bluebirdLst2 || _load_bluebirdLst2()).default.resolve(null) : this.getOrCreateRelease();
        }
        return this._releasePromise;
    }
    getOrCreateRelease() {
        var _this = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            // we don't use "Get a release by tag name" because "tag name" means existing git tag, but we draft release and don't create git tag
            const releases = yield _this.githubRequest(`/repos/${_this.info.owner}/${_this.info.repo}/releases`, _this.token);
            for (const release of releases) {
                if (!(release.tag_name === _this.tag || release.tag_name === _this.version)) {
                    continue;
                }
                if (release.draft) {
                    return release;
                }
                // https://github.com/electron-userland/electron-builder/issues/1197
                // https://electron-builder.slack.com/archives/general/p1485961449000202
                // https://github.com/electron-userland/electron-builder/issues/2072
                if (_this.releaseType === "draft") {
                    (0, (_builderUtil || _load_builderUtil()).warn)(`Release with tag ${_this.tag} already exists`);
                    return null;
                }
                // https://github.com/electron-userland/electron-builder/issues/1133
                // https://github.com/electron-userland/electron-builder/issues/2074
                // if release created < 2 hours — allow to upload
                const publishedAt = release.published_at == null ? null : Date.parse(release.published_at);
                if (publishedAt != null && Date.now() - publishedAt > 2 * 3600 * 1000) {
                    // https://github.com/electron-userland/electron-builder/issues/1183#issuecomment-275867187
                    (0, (_builderUtil || _load_builderUtil()).warn)(`Release with tag ${_this.tag} published at ${new Date(publishedAt).toString()}, more than 2 hours ago`);
                    return null;
                }
                return release;
            }
            // https://github.com/electron-userland/electron-builder/issues/1835
            if (_this.options.publish === "always" || (0, (_publisher || _load_publisher()).getCiTag)() != null) {
                (0, (_builderUtil || _load_builderUtil()).log)(`Release with tag ${_this.tag} doesn't exist, creating one`);
                return _this.createRelease();
            }
            return null;
        })();
    }
    doUpload(fileName, arch, dataLength, requestProcessor) {
        var _this2 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            const release = yield _this2.releasePromise;
            if (release == null) {
                (0, (_builderUtil || _load_builderUtil()).debug)(`Release with tag ${_this2.tag} doesn't exist and is not created, artifact ${fileName} is not published`);
                return;
            }
            const parsedUrl = (0, (_url || _load_url()).parse)(release.upload_url.substring(0, release.upload_url.indexOf("{")) + "?name=" + fileName);
            let attemptNumber = 0;
            uploadAttempt: for (let i = 0; i < 3; i++) {
                try {
                    return yield (_nodeHttpExecutor || _load_nodeHttpExecutor()).httpExecutor.doApiRequest((0, (_builderUtilRuntime || _load_builderUtilRuntime()).configureRequestOptions)({
                        hostname: parsedUrl.hostname,
                        path: parsedUrl.path,
                        method: "POST",
                        headers: {
                            Accept: "application/vnd.github.v3+json",
                            "Content-Type": (_mime || _load_mime()).default.getType(fileName) || "application/octet-stream",
                            "Content-Length": dataLength
                        }
                    }, _this2.token), _this2.context.cancellationToken, requestProcessor);
                } catch (e) {
                    if (e instanceof (_builderUtilRuntime || _load_builderUtilRuntime()).HttpError) {
                        if (e.response.statusCode === 422 && e.description != null && e.description.errors != null && e.description.errors[0].code === "already_exists") {
                            // delete old artifact and re-upload
                            (0, (_builderUtil || _load_builderUtil()).debug)(`Artifact ${fileName} already exists on GitHub, overwrite one`);
                            const assets = yield _this2.githubRequest(`/repos/${_this2.info.owner}/${_this2.info.repo}/releases/${release.id}/assets`, _this2.token, null);
                            for (const asset of assets) {
                                if (asset.name === fileName) {
                                    yield _this2.githubRequest(`/repos/${_this2.info.owner}/${_this2.info.repo}/releases/assets/${asset.id}`, _this2.token, null, "DELETE");
                                    continue uploadAttempt;
                                }
                            }
                            (0, (_builderUtil || _load_builderUtil()).debug)(`Artifact ${fileName} not found on GitHub, trying to upload again`);
                            continue;
                        } else if (attemptNumber++ < 3 && e.response.statusCode === 502) {
                            continue;
                        }
                    } else if (attemptNumber++ < 3 && e.code === "EPIPE") {
                        continue;
                    }
                    throw e;
                }
            }
        })();
    }
    createRelease() {
        return this.githubRequest(`/repos/${this.info.owner}/${this.info.repo}/releases`, this.token, {
            tag_name: this.tag,
            name: this.version,
            draft: this.releaseType === "draft",
            prerelease: this.releaseType === "prerelease"
        });
    }
    // test only
    //noinspection JSUnusedGlobalSymbols
    getRelease() {
        var _this3 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            return _this3.githubRequest(`/repos/${_this3.info.owner}/${_this3.info.repo}/releases/${(yield _this3._releasePromise).id}`, _this3.token);
        })();
    }
    //noinspection JSUnusedGlobalSymbols
    deleteRelease() {
        var _this4 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            const release = yield _this4._releasePromise;
            if (release == null) {
                return;
            }
            for (let i = 0; i < 3; i++) {
                try {
                    return yield _this4.githubRequest(`/repos/${_this4.info.owner}/${_this4.info.repo}/releases/${release.id}`, _this4.token, null, "DELETE");
                } catch (e) {
                    if (e instanceof (_builderUtilRuntime || _load_builderUtilRuntime()).HttpError) {
                        if (e.response.statusCode === 404) {
                            (0, (_builderUtil || _load_builderUtil()).warn)(`Cannot delete release ${release.id} — doesn't exist`);
                            return;
                        } else if (e.response.statusCode === 405 || e.response.statusCode === 502) {
                            continue;
                        }
                    }
                    throw e;
                }
            }
            (0, (_builderUtil || _load_builderUtil()).warn)(`Cannot delete release ${release.id}`);
        })();
    }
    githubRequest(path, token) {
        let data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
        let method = arguments[3];

        // host can contains port, but node http doesn't support host as url does
        const baseUrl = (0, (_url || _load_url()).parse)(`https://${this.info.host || "api.github.com"}`);
        return (0, (_builderUtilRuntime || _load_builderUtilRuntime()).parseJson)((_nodeHttpExecutor || _load_nodeHttpExecutor()).httpExecutor.request((0, (_builderUtilRuntime || _load_builderUtilRuntime()).configureRequestOptions)({
            hostname: baseUrl.hostname,
            port: baseUrl.port,
            path: this.info.host != null && this.info.host !== "github.com" ? `/api/v3${path.startsWith("/") ? path : `/${path}`}` : path,
            headers: { Accept: "application/vnd.github.v3+json" }
        }, token, method), this.context.cancellationToken, data));
    }
    toString() {
        return `Github (owner: ${this.info.owner}, project: ${this.info.repo}, version: ${this.version})`;
    }
}
exports.GitHubPublisher = GitHubPublisher; //# sourceMappingURL=gitHubPublisher.js.map