"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Provider = undefined;

var _main;

function _load_main() {
    return _main = require("./main");
}

class Provider {
    constructor(executor) {
        this.executor = executor;
    }
    setRequestHeaders(value) {
        this.requestHeaders = value;
    }
    static validateUpdateInfo(info) {
        if ((0, (_main || _load_main()).isUseOldMacProvider)()) {
            if (info.url == null) {
                throw new Error("Update info doesn't contain url");
            }
            return;
        }
        // noinspection JSDeprecatedSymbols
        if (info.sha2 == null && info.sha512 == null) {
            throw new Error(`Update info doesn't contain sha2 or sha512 checksum: ${JSON.stringify(info, null, 2)}`);
        }
        if (info.path == null) {
            throw new Error(`Update info doesn't contain file path: ${JSON.stringify(info, null, 2)}`);
        }
    }
    httpRequest(url, headers, cancellationToken) {
        return this.executor.request(this.createRequestOptions(url, headers), cancellationToken);
    }
    createRequestOptions(url, headers) {
        const result = {};
        if (this.requestHeaders == null) {
            if (headers != null) {
                result.headers = headers;
            }
        } else {
            result.headers = headers == null ? this.requestHeaders : Object.assign({}, this.requestHeaders, headers);
        }
        result.protocol = url.protocol;
        result.hostname = url.hostname;
        if (url.port) {
            result.port = url.port;
        }
        result.path = url.pathname + url.search;
        return result;
    }
}
exports.Provider = Provider; //# sourceMappingURL=Provider.js.map