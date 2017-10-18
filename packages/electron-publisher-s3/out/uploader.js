"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Uploader = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

var _bluebirdLst2;

function _load_bluebirdLst2() {
    return _bluebirdLst2 = _interopRequireDefault(require("bluebird-lst"));
}

var _awsSdk;

function _load_awsSdk() {
    return _awsSdk = require("aws-sdk");
}

var _builderUtil;

function _load_builderUtil() {
    return _builderUtil = require("builder-util");
}

var _events;

function _load_events() {
    return _events = require("events");
}

var _fsExtraP;

function _load_fsExtraP() {
    return _fsExtraP = require("fs-extra-p");
}

var _os;

function _load_os() {
    return _os = require("os");
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const MAX_PUT_OBJECT_SIZE = 5 * 1024 * 1024 * 1024;
const MAX_MULTIPART_COUNT = 10000;
const MIN_MULTIPART_SIZE = 5 * 1024 * 1024;
const commonUploadSize = 15 * 1024 * 1024;
(_awsSdk || _load_awsSdk()).config.setPromisesDependency(require("bluebird-lst"));
class Uploader extends (_events || _load_events()).EventEmitter {
    constructor(s3, s3Options, localFile, localFileStat) {
        super();
        this.s3 = s3;
        this.s3Options = s3Options;
        this.localFile = localFile;
        /** @readonly */
        this.loaded = 0;
        this.cancelled = false;
        this.s3RetryCount = 3;
        this.s3RetryDelay = 1000;
        this.multipartUploadThreshold = 20 * 1024 * 1024;
        this.multipartUploadSize = commonUploadSize;
        this.multipartDownloadThreshold = 20 * 1024 * 1024;
        this.multipartDownloadSize = commonUploadSize;
        if (this.multipartUploadThreshold < MIN_MULTIPART_SIZE) {
            throw new Error("Minimum multipartUploadThreshold is 5MB.");
        }
        if (this.multipartUploadThreshold > MAX_PUT_OBJECT_SIZE) {
            throw new Error("Maximum multipartUploadThreshold is 5GB.");
        }
        if (this.multipartUploadSize < MIN_MULTIPART_SIZE) {
            throw new Error("Minimum multipartUploadSize is 5MB.");
        }
        if (this.multipartUploadSize > MAX_PUT_OBJECT_SIZE) {
            throw new Error("Maximum multipartUploadSize is 5GB.");
        }
        this.contentLength = localFileStat.size;
    }
    upload() {
        var _this = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            if (_this.contentLength < _this.multipartUploadThreshold) {
                const md5 = yield (0, (_builderUtil || _load_builderUtil()).hashFile)(_this.localFile, "md5");
                yield _this.runOrRetry(_this.putObject.bind(_this, md5));
                return;
            }
            let multipartUploadSize = _this.multipartUploadSize;
            if (Math.ceil(_this.contentLength / multipartUploadSize) > MAX_MULTIPART_COUNT) {
                multipartUploadSize = smallestPartSizeFromFileSize(_this.contentLength);
            }
            if (multipartUploadSize > MAX_PUT_OBJECT_SIZE) {
                throw new Error(`File size exceeds maximum object size: ${_this.localFile}`);
            }
            const data = yield _this.runOrRetry(function () {
                return _this.s3.createMultipartUpload(_this.s3Options).promise();
            });
            yield _this.multipartUpload(data.UploadId, multipartUploadSize);
        })();
    }
    abort() {
        this.cancelled = true;
    }
    putObject(md5) {
        this.loaded = 0;
        return new (_bluebirdLst2 || _load_bluebirdLst2()).default((resolve, reject) => {
            this.s3.putObject(Object.assign({ Body: (0, (_fsExtraP || _load_fsExtraP()).createReadStream)(this.localFile), ContentMD5: md5 }, this.s3Options)).on("httpUploadProgress", progress => {
                this.loaded = progress.loaded;
                this.emit("progress");
            }).send((error, data) => {
                if (error == null) {
                    resolve(data);
                } else {
                    reject(error);
                }
            });
        });
    }
    multipartUpload(uploadId, multipartUploadSize) {
        var _this2 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            let cursor = 0;
            let nextPartNumber = 1;
            const partsA = [];
            const parts = [];
            while (cursor < _this2.contentLength) {
                const start = cursor;
                let end = cursor + multipartUploadSize;
                if (end > _this2.contentLength) {
                    end = _this2.contentLength;
                }
                cursor = end;
                const part = {
                    PartNumber: nextPartNumber++
                };
                partsA.push(part);
                parts.push({ start, end, part, md5: "" });
            }
            yield (_bluebirdLst2 || _load_bluebirdLst2()).default.map(parts, (() => {
                var _ref = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (it) {
                    // hashFile - both start and end are inclusive
                    it.md5 = yield (0, (_builderUtil || _load_builderUtil()).hashFile)(_this2.localFile, "md5", "base64", { start: it.start, end: it.end - 1 });
                });

                return function (_x) {
                    return _ref.apply(this, arguments);
                };
            })(), { concurrency: (0, (_os || _load_os()).cpus)().length });
            yield (_bluebirdLst2 || _load_bluebirdLst2()).default.map(parts, function (it) {
                return _this2.makeUploadPart(it, uploadId);
            }, { concurrency: 4 });
            return yield _this2.runOrRetry(function () {
                return _this2.s3.completeMultipartUpload({
                    Bucket: _this2.s3Options.Bucket,
                    Key: _this2.s3Options.Key,
                    UploadId: uploadId,
                    MultipartUpload: {
                        Parts: partsA
                    }
                }).promise();
            });
        })();
    }
    makeUploadPart(part, uploadId) {
        const contentLength = part.end - part.start;
        return this.runOrRetry(() => {
            let partLoaded = 0;
            return new (_bluebirdLst2 || _load_bluebirdLst2()).default((resolve, reject) => {
                this.s3.uploadPart({
                    ContentLength: contentLength,
                    PartNumber: part.part.PartNumber,
                    UploadId: uploadId,
                    Body: (0, (_fsExtraP || _load_fsExtraP()).createReadStream)(this.localFile, { start: part.start, end: part.end - 1 }),
                    Bucket: this.s3Options.Bucket,
                    Key: this.s3Options.Key,
                    ContentMD5: part.md5
                }).on("httpUploadProgress", progress => {
                    partLoaded = progress.loaded;
                    this.loaded += progress.loaded;
                    this.emit("progress");
                }).send((error, data) => {
                    if (error == null) {
                        part.part.ETag = data.ETag;
                        resolve(data);
                    } else {
                        this.loaded -= partLoaded;
                        reject(error);
                    }
                });
            });
        });
    }
    runOrRetry(task) {
        var _this3 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            return new (_bluebirdLst2 || _load_bluebirdLst2()).default(function (resolve, reject) {
                let attemptNumber = 0;
                const tryRun = function () {
                    if (_this3.cancelled) {
                        return;
                    }
                    task().then(resolve).catch(function (error) {
                        if (++attemptNumber >= _this3.s3RetryCount) {
                            reject(error);
                        } else if (_this3.cancelled) {
                            reject(new Error("cancelled"));
                        } else {
                            setTimeout(tryRun, _this3.s3RetryDelay);
                        }
                    });
                };
                tryRun();
            });
        })();
    }
}
exports.Uploader = Uploader;
function smallestPartSizeFromFileSize(fileSize) {
    const partSize = Math.ceil(fileSize / MAX_MULTIPART_COUNT);
    return partSize < MIN_MULTIPART_SIZE ? MIN_MULTIPART_SIZE : partSize;
}
//# sourceMappingURL=uploader.js.map