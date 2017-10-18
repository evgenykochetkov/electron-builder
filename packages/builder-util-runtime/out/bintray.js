"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.BintrayClient = undefined;

var _httpExecutor;

function _load_httpExecutor() {
    return _httpExecutor = require("./httpExecutor");
}

class BintrayClient {
    constructor(options, httpExecutor, cancellationToken, apiKey) {
        this.httpExecutor = httpExecutor;
        this.cancellationToken = cancellationToken;
        if (options.owner == null) {
            throw new Error("owner is not specified");
        }
        if (options.package == null) {
            throw new Error("package is not specified");
        }
        this.repo = options.repo || "generic";
        this.packageName = options.package;
        this.owner = options.owner;
        this.user = options.user || options.owner;
        this.component = options.component || null;
        this.distribution = options.distribution || "stable";
        this.auth = apiKey == null ? null : `Basic ${Buffer.from(`${this.user}:${apiKey}`).toString("base64")}`;
        this.basePath = `/packages/${this.owner}/${this.repo}/${this.packageName}`;
    }
    setRequestHeaders(value) {
        this.requestHeaders = value;
    }
    bintrayRequest(path, auth) {
        let data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
        let cancellationToken = arguments[3];
        let method = arguments[4];

        return (0, (_httpExecutor || _load_httpExecutor()).parseJson)(this.httpExecutor.request((0, (_httpExecutor || _load_httpExecutor()).configureRequestOptions)({ hostname: "api.bintray.com", path, headers: this.requestHeaders || undefined }, auth, method), cancellationToken, data));
    }
    getVersion(version) {
        return this.bintrayRequest(`${this.basePath}/versions/${version}`, this.auth, null, this.cancellationToken);
    }
    getVersionFiles(version) {
        return this.bintrayRequest(`${this.basePath}/versions/${version}/files`, this.auth, null, this.cancellationToken);
    }
    createVersion(version) {
        return this.bintrayRequest(`${this.basePath}/versions`, this.auth, {
            name: version
        }, this.cancellationToken);
    }
    deleteVersion(version) {
        return this.bintrayRequest(`${this.basePath}/versions/${version}`, this.auth, null, this.cancellationToken, "DELETE");
    }
}
exports.BintrayClient = BintrayClient; //# sourceMappingURL=bintray.js.map