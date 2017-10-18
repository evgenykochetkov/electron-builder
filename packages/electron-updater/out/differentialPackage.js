"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DifferentialDownloader = exports.DifferentialDownloaderOptions = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

var _bluebirdLst2;

function _load_bluebirdLst2() {
    return _bluebirdLst2 = _interopRequireDefault(require("bluebird-lst"));
}

let readBlockMap = (() => {
    var _ref = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (data) {
        return (0, (_jsYaml || _load_jsYaml()).safeLoad)((yield inflateRaw(data)).toString());
    });

    return function readBlockMap(_x2) {
        return _ref.apply(this, arguments);
    };
})();

var _builderUtilRuntime;

function _load_builderUtilRuntime() {
    return _builderUtilRuntime = require("builder-util-runtime");
}

var _blockMapApi;

function _load_blockMapApi() {
    return _blockMapApi = require("builder-util-runtime/out/blockMapApi");
}

var _fsExtraP;

function _load_fsExtraP() {
    return _fsExtraP = require("fs-extra-p");
}

var _jsYaml;

function _load_jsYaml() {
    return _jsYaml = require("js-yaml");
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const inflateRaw = (_bluebirdLst2 || _load_bluebirdLst2()).default.promisify(require("zlib").inflateRaw);
class DifferentialDownloaderOptions {}
exports.DifferentialDownloaderOptions = DifferentialDownloaderOptions;
class DifferentialDownloader {
    constructor(packageInfo, httpExecutor, options) {
        this.packageInfo = packageInfo;
        this.httpExecutor = httpExecutor;
        this.options = options;
        this.logger = options.logger;
        this.baseRequestOptions = (0, (_builderUtilRuntime || _load_builderUtilRuntime()).configureRequestOptionsFromUrl)(packageInfo.file, {});
    }
    createRequestOptions() {
        let method = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "get";

        return Object.assign({}, this.baseRequestOptions, { method, headers: Object.assign({}, this.options.requestHeaders, { Accept: "*/*" }) });
    }
    download() {
        var _this = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            const packageInfo = _this.packageInfo;
            const offset = packageInfo.size - packageInfo.headerSize - packageInfo.blockMapSize;
            _this.fileMetadataBuffer = yield _this.readRemoteBytes(offset, packageInfo.size - 1);
            const oldBlockMap = (0, (_jsYaml || _load_jsYaml()).safeLoad)((yield (0, (_fsExtraP || _load_fsExtraP()).readFile)(_this.options.oldBlockMapFile, "utf-8")));
            const newBlockMap = yield readBlockMap(_this.fileMetadataBuffer.slice(_this.packageInfo.headerSize));
            // we don't check other metadata like compressionMethod - generic check that it is make sense to differentially update is suitable for it
            if (oldBlockMap.hashMethod !== newBlockMap.hashMethod) {
                throw new Error(`hashMethod is different (${oldBlockMap.hashMethod} - ${newBlockMap.hashMethod}), full download is required`);
            }
            if (oldBlockMap.blockSize !== newBlockMap.blockSize) {
                throw new Error(`blockSize is different (${oldBlockMap.blockSize} - ${newBlockMap.blockSize}), full download is required`);
            }
            const operations = _this.computeOperations(oldBlockMap, newBlockMap);
            if (_this.logger.debug != null) {
                _this.logger.debug(JSON.stringify(operations, null, 2));
            }
            let downloadSize = 0;
            let copySize = 0;
            for (const operation of operations) {
                const length = operation.end - operation.start;
                if (operation.kind === OperationKind.DOWNLOAD) {
                    downloadSize += length;
                } else {
                    copySize += length;
                }
            }
            const newPackageSize = _this.packageInfo.size;
            if (downloadSize + copySize + _this.fileMetadataBuffer.length + 32 !== newPackageSize) {
                throw new Error(`Internal error, size mismatch: downloadSize: ${downloadSize}, copySize: ${copySize}, newPackageSize: ${newPackageSize}`);
            }
            _this.logger.info(`Full: ${formatBytes(newPackageSize)}, To download: ${formatBytes(downloadSize)} (${formatBytes((newPackageSize - downloadSize) / newPackageSize * 100, "%")})`);
            yield _this.downloadFile(operations);
        })();
    }
    downloadFile(operations) {
        var _this2 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            // todo we can avoid download remote and construct manually
            const signature = yield _this2.readRemoteBytes(0, (_blockMapApi || _load_blockMapApi()).SIGNATURE_HEADER_SIZE - 1);
            const oldFileFd = yield (0, (_fsExtraP || _load_fsExtraP()).open)(_this2.options.oldPackageFile, "r");
            yield new (_bluebirdLst2 || _load_bluebirdLst2()).default(function (resolve, reject) {
                const streams = [];
                const digestTransform = new (_builderUtilRuntime || _load_builderUtilRuntime()).DigestTransform(_this2.packageInfo.sha512);
                // to simply debug, do manual validation to allow file to be fully written
                digestTransform.isValidateOnEnd = false;
                streams.push(digestTransform);
                const fileOut = (0, (_fsExtraP || _load_fsExtraP()).createWriteStream)(_this2.options.packagePath);
                fileOut.on("finish", function () {
                    fileOut.close(function () {
                        try {
                            digestTransform.validate();
                        } catch (e) {
                            reject(e);
                            return;
                        }
                        resolve();
                    });
                });
                streams.push(fileOut);
                let lastStream = null;
                for (const stream of streams) {
                    stream.on("error", reject);
                    if (lastStream == null) {
                        lastStream = stream;
                    } else {
                        lastStream = lastStream.pipe(stream);
                    }
                }
                const firstStream = streams[0];
                const w = function (index) {
                    if (index >= operations.length) {
                        firstStream.end(_this2.fileMetadataBuffer);
                        return;
                    }
                    const operation = operations[index++];
                    if (operation.kind === OperationKind.COPY) {
                        const readStream = (0, (_fsExtraP || _load_fsExtraP()).createReadStream)(_this2.options.oldPackageFile, {
                            fd: oldFileFd,
                            autoClose: false,
                            start: operation.start,
                            // end is inclusive
                            end: operation.end - 1
                        });
                        readStream.on("error", reject);
                        readStream.once("end", function () {
                            return w(index);
                        });
                        readStream.pipe(firstStream, {
                            end: false
                        });
                    } else {
                        // https://github.com/electron-userland/electron-builder/issues/1523#issuecomment-327084661
                        // todo to reduce http requests we need to consolidate non sequential download operations (Multipart ranges)
                        const requestOptions = _this2.createRequestOptions("get");
                        requestOptions.headers.Range = `bytes=${operation.start}-${operation.end - 1}`;
                        const request = _this2.httpExecutor.doRequest(requestOptions, function (response) {
                            // Electron net handles redirects automatically, our NodeJS test server doesn't use redirects - so, we don't check 3xx codes.
                            if (response.statusCode >= 400) {
                                reject(new (_builderUtilRuntime || _load_builderUtilRuntime()).HttpError(response));
                            }
                            response.pipe(firstStream, {
                                end: false
                            });
                            response.once("end", function () {
                                return w(index);
                            });
                        });
                        _this2.httpExecutor.addErrorAndTimeoutHandlers(request, reject);
                        request.end();
                    }
                };
                firstStream.write(signature, function () {
                    return w(0);
                });
            }).finally(function () {
                return (0, (_fsExtraP || _load_fsExtraP()).close)(oldFileFd);
            });
        })();
    }
    computeOperations(oldBlockMap, newBlockMap) {
        // const oldEntryMap: Map<string, Entry>
        const nameToOldBlocks = buildBlockFileMap(oldBlockMap.files);
        const nameToNewBlocks = buildBlockFileMap(newBlockMap.files);
        // convert kb to bytes
        const blockSize = newBlockMap.blockSize * 1024;
        const oldEntryMap = buildEntryMap(oldBlockMap.files);
        const operations = [];
        for (const blockMapFile of newBlockMap.files) {
            const name = blockMapFile.name;
            const oldEntry = blockMapFile.size === 0 ? null : oldEntryMap.get(name);
            // block map doesn't contain empty files, but we check this case just to be sure
            if (oldEntry == null) {
                // new file
                operations.push({
                    kind: OperationKind.DOWNLOAD,
                    start: blockMapFile.offset,
                    end: blockMapFile.size - blockMapFile.offset
                });
                continue;
            }
            let lastOperation = null;
            const newFile = nameToNewBlocks.get(name);
            const oldFile = nameToOldBlocks.get(name);
            let changedBlockCount = 0;
            blockMapLoop: for (let i = 0; i < newFile.blocks.length; i++) {
                if (i >= oldFile.blocks.length) {
                    break;
                }
                const isFirstBlock = i === 0;
                const isLastBlock = i === newFile.blocks.length - 1;
                const currentBlockSize = isLastBlock ? newFile.size % blockSize : blockSize;
                if (oldFile.blocks[i] === newFile.blocks[i]) {
                    if (lastOperation == null || lastOperation.kind !== OperationKind.COPY) {
                        const start = oldEntry.offset + i * blockSize;
                        const end = start + currentBlockSize;
                        if (isFirstBlock) {
                            if (operations.length > 0) {
                                const prevOperation = operations[operations.length - 1];
                                if (prevOperation.kind === OperationKind.COPY && prevOperation.end === start) {
                                    lastOperation = prevOperation;
                                    prevOperation.end = end;
                                    continue blockMapLoop;
                                }
                            }
                        }
                        lastOperation = {
                            kind: OperationKind.COPY,
                            start,
                            end
                        };
                        operations.push(lastOperation);
                    } else {
                        lastOperation.end += currentBlockSize;
                    }
                } else {
                    changedBlockCount++;
                    const start = blockMapFile.offset + i * blockSize;
                    const end = start + currentBlockSize;
                    if (lastOperation == null || lastOperation.kind !== OperationKind.DOWNLOAD) {
                        lastOperation = {
                            kind: OperationKind.DOWNLOAD,
                            start,
                            end
                        };
                        operations.push(lastOperation);
                    } else {
                        lastOperation.end += currentBlockSize;
                    }
                }
            }
            if (changedBlockCount > 0) {
                this.logger.info(`File ${blockMapFile.name} has ${changedBlockCount} changed blocks`);
            }
        }
        return operations;
    }
    readRemoteBytes(start, endInclusive) {
        var _this3 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            const buffer = Buffer.allocUnsafe(endInclusive + 1 - start);
            const requestOptions = _this3.createRequestOptions();
            requestOptions.headers.Range = `bytes=${start}-${endInclusive}`;
            let position = 0;
            yield _this3.request(requestOptions, function (chunk) {
                chunk.copy(buffer, position);
                position += chunk.length;
            });
            return buffer;
        })();
    }
    request(requestOptions, dataHandler) {
        return new (_bluebirdLst2 || _load_bluebirdLst2()).default((resolve, reject) => {
            const request = this.httpExecutor.doRequest(requestOptions, response => {
                // Electron net handles redirects automatically, our NodeJS test server doesn't use redirects - so, we don't check 3xx codes.
                if (response.statusCode >= 400) {
                    reject(new (_builderUtilRuntime || _load_builderUtilRuntime()).HttpError(response));
                }
                if (response.statusCode !== 206) {
                    const acceptRanges = (0, (_builderUtilRuntime || _load_builderUtilRuntime()).safeGetHeader)(response, "accept-ranges");
                    if (acceptRanges == null || acceptRanges === "none") {
                        reject(new Error("Server doesn't support Accept-Ranges"));
                    }
                }
                response.on("data", dataHandler);
                response.on("end", () => {
                    resolve();
                });
            });
            this.httpExecutor.addErrorAndTimeoutHandlers(request, reject);
            request.end();
        });
    }
}
exports.DifferentialDownloader = DifferentialDownloader;
var OperationKind;
(function (OperationKind) {
    OperationKind[OperationKind["COPY"] = 0] = "COPY";
    OperationKind[OperationKind["DOWNLOAD"] = 1] = "DOWNLOAD";
})(OperationKind || (OperationKind = {}));
function buildEntryMap(list) {
    const result = new Map();
    for (const item of list) {
        result.set(item.name, item);
    }
    return result;
}
function buildBlockFileMap(list) {
    const result = new Map();
    for (const item of list) {
        result.set(item.name, item);
    }
    return result;
}

function formatBytes(value) {
    let symbol = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : " KB";

    return new Intl.NumberFormat("en").format((value / 1024).toFixed(2)) + symbol;
}
//# sourceMappingURL=differentialPackage.js.map