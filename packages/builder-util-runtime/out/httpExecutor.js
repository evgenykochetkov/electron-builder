"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DigestTransform = exports.HttpExecutor = exports.HttpError = undefined;
exports.parseJson = parseJson;
exports.configureRequestOptionsFromUrl = configureRequestOptionsFromUrl;
exports.safeGetHeader = safeGetHeader;
exports.configureRequestOptions = configureRequestOptions;
exports.safeStringifyJson = safeStringifyJson;

var _crypto;

function _load_crypto() {
    return _crypto = require("crypto");
}

var _debug2 = _interopRequireDefault(require("debug"));

var _fsExtraP;

function _load_fsExtraP() {
    return _fsExtraP = require("fs-extra-p");
}

var _stream;

function _load_stream() {
    return _stream = require("stream");
}

var _url;

function _load_url() {
    return _url = require("url");
}

var _CancellationToken;

function _load_CancellationToken() {
    return _CancellationToken = require("./CancellationToken");
}

var _ProgressCallbackTransform;

function _load_ProgressCallbackTransform() {
    return _ProgressCallbackTransform = require("./ProgressCallbackTransform");
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = (0, _debug2.default)("electron-builder");
class HttpError extends Error {
    constructor(response) {
        let description = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        super(response.statusCode + " " + response.statusMessage + (description == null ? "" : "\n" + JSON.stringify(description, null, "  ")) + "\nHeaders: " + JSON.stringify(response.headers, null, "  "));
        this.response = response;
        this.description = description;
        this.name = "HttpError";
    }
}
exports.HttpError = HttpError;
function parseJson(result) {
    return result.then(it => it == null || it.length === 0 ? null : JSON.parse(it));
}
class HttpExecutor {
    constructor() {
        this.maxRedirects = 10;
    }
    request(options) {
        let cancellationToken = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new (_CancellationToken || _load_CancellationToken()).CancellationToken();
        let data = arguments[2];

        configureRequestOptions(options);
        const encodedData = data == null ? undefined : Buffer.from(JSON.stringify(data));
        if (encodedData != null) {
            options.method = "post";
            options.headers["Content-Type"] = "application/json";
            options.headers["Content-Length"] = encodedData.length;
        }
        return this.doApiRequest(options, cancellationToken, it => it.end(encodedData));
    }
    doApiRequest(options, cancellationToken, requestProcessor) {
        let redirectCount = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

        if (debug.enabled) {
            debug(`Request: ${safeStringifyJson(options)}`);
        }
        return cancellationToken.createPromise((resolve, reject, onCancel) => {
            const request = this.doRequest(options, response => {
                try {
                    this.handleResponse(response, options, cancellationToken, resolve, reject, redirectCount, requestProcessor);
                } catch (e) {
                    reject(e);
                }
            });
            this.addErrorAndTimeoutHandlers(request, reject);
            requestProcessor(request, reject);
            onCancel(() => request.abort());
        });
    }
    addErrorAndTimeoutHandlers(request, reject) {
        this.addTimeOutHandler(request, reject);
        request.on("error", reject);
        request.on("aborted", () => {
            reject(new Error("Request has been aborted by the server"));
        });
    }
    handleResponse(response, options, cancellationToken, resolve, reject, redirectCount, requestProcessor) {
        if (debug.enabled) {
            debug(`Response: ${response.statusCode} ${response.statusMessage}, request options: ${safeStringifyJson(options)}`);
        }
        // we handle any other >= 400 error on request end (read detailed message in the response body)
        if (response.statusCode === 404) {
            // error is clear, we don't need to read detailed error description
            reject(new HttpError(response, `method: ${options.method} url: ${options.protocol || "https:"}//${options.hostname}${options.path}

Please double check that your authentication token is correct. Due to security reasons actual status maybe not reported, but 404.
`));
            return;
        } else if (response.statusCode === 204) {
            // on DELETE request
            resolve();
            return;
        }
        const redirectUrl = safeGetHeader(response, "location");
        if (redirectUrl != null) {
            if (redirectCount > 10) {
                reject(new Error("Too many redirects (> 10)"));
                return;
            }
            this.doApiRequest(configureRequestOptionsFromUrl(redirectUrl, Object.assign({}, options)), cancellationToken, requestProcessor, redirectCount).then(resolve).catch(reject);
            return;
        }
        let data = "";
        response.setEncoding("utf8");
        response.on("data", chunk => {
            data += chunk;
        });
        response.on("end", () => {
            try {
                if (response.statusCode != null && response.statusCode >= 400) {
                    const contentType = safeGetHeader(response, "content-type");
                    const isJson = contentType != null && (Array.isArray(contentType) ? contentType.find(it => it.indexOf("json") !== -1) != null : contentType.indexOf("json") !== -1);
                    reject(new HttpError(response, isJson ? JSON.parse(data) : data));
                } else {
                    resolve(data.length === 0 ? null : data);
                }
            } catch (e) {
                reject(e);
            }
        });
    }
    doDownload(requestOptions, destination, redirectCount, options, callback, onCancel) {
        const request = this.doRequest(requestOptions, response => {
            if (response.statusCode >= 400) {
                callback(new Error(`Cannot download "${requestOptions.protocol || "https:"}//${requestOptions.hostname}${requestOptions.path}", status ${response.statusCode}: ${response.statusMessage}`));
                return;
            }
            const redirectUrl = safeGetHeader(response, "location");
            if (redirectUrl != null) {
                if (redirectCount < this.maxRedirects) {
                    this.doDownload(configureRequestOptionsFromUrl(redirectUrl, Object.assign({}, requestOptions)), destination, redirectCount++, options, callback, onCancel);
                } else {
                    callback(new Error(`Too many redirects (> ${this.maxRedirects})`));
                }
                return;
            }
            configurePipes(options, response, destination, callback, options.cancellationToken);
        });
        this.addErrorAndTimeoutHandlers(request, callback);
        onCancel(() => request.abort());
        request.end();
    }
    addTimeOutHandler(request, callback) {
        request.on("socket", socket => {
            socket.setTimeout(60 * 1000, () => {
                callback(new Error("Request timed out"));
                request.abort();
            });
        });
    }
}
exports.HttpExecutor = HttpExecutor;
function configureRequestOptionsFromUrl(url, options) {
    const parsedUrl = (0, (_url || _load_url()).parse)(url);
    options.protocol = parsedUrl.protocol;
    options.hostname = parsedUrl.hostname;
    if (parsedUrl.port == null) {
        if (options.port != null) {
            delete options.port;
        }
    } else {
        options.port = parsedUrl.port;
    }
    options.path = parsedUrl.path;
    return configureRequestOptions(options);
}
class DigestTransform extends (_stream || _load_stream()).Transform {
    constructor(expected) {
        let algorithm = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "sha512";
        let encoding = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "base64";

        super();
        this.expected = expected;
        this.algorithm = algorithm;
        this.encoding = encoding;
        this.isValidateOnEnd = true;
        this.digester = (0, (_crypto || _load_crypto()).createHash)(algorithm);
    }
    get actual() {
        return this._actual;
    }
    _transform(chunk, encoding, callback) {
        this.digester.update(chunk);
        callback(null, chunk);
    }
    _flush(callback) {
        this._actual = this.digester.digest(this.encoding);
        if (this.isValidateOnEnd) {
            try {
                this.validate();
            } catch (e) {
                callback(e);
                return;
            }
        }
        callback(null);
    }
    validate() {
        if (this._actual == null) {
            throw new Error("Not finished yet");
        }
        if (this._actual !== this.expected) {
            throw new Error(`${this.algorithm} checksum mismatch, expected ${this.expected}, got ${this._actual}`);
        }
        return null;
    }
}
exports.DigestTransform = DigestTransform;
function checkSha2(sha2Header, sha2, callback) {
    if (sha2Header != null && sha2 != null) {
        // todo why bintray doesn't send this header always
        if (sha2Header == null) {
            callback(new Error("checksum is required, but server response doesn't contain X-Checksum-Sha2 header"));
            return false;
        } else if (sha2Header !== sha2) {
            callback(new Error(`checksum mismatch: expected ${sha2} but got ${sha2Header} (X-Checksum-Sha2 header)`));
            return false;
        }
    }
    return true;
}
function safeGetHeader(response, headerKey) {
    const value = response.headers[headerKey];
    if (value == null) {
        return null;
    } else if (Array.isArray(value)) {
        // electron API
        return value.length === 0 ? null : value[value.length - 1];
    } else {
        return value;
    }
}
function configurePipes(options, response, destination, callback, cancellationToken) {
    if (!checkSha2(safeGetHeader(response, "X-Checksum-Sha2"), options.sha2, callback)) {
        return;
    }
    const streams = [];
    if (options.onProgress != null) {
        const contentLength = safeGetHeader(response, "content-length");
        if (contentLength != null) {
            streams.push(new (_ProgressCallbackTransform || _load_ProgressCallbackTransform()).ProgressCallbackTransform(parseInt(contentLength, 10), options.cancellationToken, options.onProgress));
        }
    }
    const sha512 = options.sha512;
    if (sha512 != null) {
        streams.push(new DigestTransform(sha512, "sha512", sha512.length === 128 && !(sha512.indexOf("+") !== -1) && !(sha512.indexOf("Z") !== -1) && !(sha512.indexOf("=") !== -1) ? "hex" : "base64"));
    } else if (options.sha2 != null) {
        streams.push(new DigestTransform(options.sha2, "sha256", "hex"));
    }
    const fileOut = (0, (_fsExtraP || _load_fsExtraP()).createWriteStream)(destination);
    streams.push(fileOut);
    let lastStream = response;
    for (const stream of streams) {
        stream.on("error", error => {
            if (!cancellationToken.cancelled) {
                callback(error);
            }
        });
        lastStream = lastStream.pipe(stream);
    }
    fileOut.on("finish", () => {
        fileOut.close(callback);
    });
}
function configureRequestOptions(options, token, method) {
    if (method != null) {
        options.method = method;
    }
    let headers = options.headers;
    if (headers == null) {
        headers = {};
        options.headers = headers;
    }
    if (token != null) {
        headers.authorization = token.startsWith("Basic") ? token : `token ${token}`;
    }
    if (headers["User-Agent"] == null) {
        headers["User-Agent"] = "electron-builder";
    }
    if (method == null || method === "GET" || headers["Cache-Control"] == null) {
        headers["Cache-Control"] = "no-cache";
    }
    // do not specify for node (in any case we use https module)
    if (options.protocol == null && process.versions.electron != null) {
        options.protocol = "https:";
    }
    return options;
}
function safeStringifyJson(data, skippedNames) {
    return JSON.stringify(data, (name, value) => {
        if (name.endsWith("authorization") || name.endsWith("Password") || name.endsWith("PASSWORD") || name.endsWith("Token") || name.indexOf("password") !== -1 || name.indexOf("token") !== -1 || skippedNames != null && skippedNames.has(name)) {
            return "<stripped sensitive data>";
        }
        return value;
    }, 2);
}
//# sourceMappingURL=httpExecutor.js.map