"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

var _bluebirdLst2;

function _load_bluebirdLst2() {
    return _bluebirdLst2 = _interopRequireDefault(require("bluebird-lst"));
}

// we cache in the global location - in the home dir, not in the node_modules/.cache (https://www.npmjs.com/package/find-cache-dir) because
// * don't need to find node_modules
// * don't pollute user project dir (important in case of 1-package.json project structure)
// * simplify/speed-up tests (don't download fpm for each test project)
let doGetBin = (() => {
    var _ref = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (name, dirName, url, checksum) {
        const cachePath = _path.join((0, (_util || _load_util()).getCacheDirectory)(), name);
        const dirPath = _path.join(cachePath, dirName);
        const dirStat = yield (0, (_fs || _load_fs()).statOrNull)(dirPath);
        //noinspection ES6MissingAwait
        if (dirStat != null && dirStat.isDirectory()) {
            debug(`Found existing ${name} ${dirPath}`);
            return dirPath;
        }
        (0, (_log || _load_log()).log)(`Downloading ${dirName}, please wait`);
        // 7z cannot be extracted from the input stream, temp file is required
        const tempUnpackDir = _path.join(cachePath, (0, (_tempFile || _load_tempFile()).getTempName)());
        const archiveName = `${tempUnpackDir}.7z`;
        debug(`Download ${name} from ${url} to ${archiveName}`);
        // 7z doesn't create out dir, so, we don't create dir in parallel to download - dir creation will create parent dirs for archive file also
        yield (0, (_fsExtraP || _load_fsExtraP()).emptyDir)(tempUnpackDir);
        const options = {
            skipDirCreation: true,
            cancellationToken: new (_builderUtilRuntime || _load_builderUtilRuntime()).CancellationToken()
        };
        if (checksum.length === 64 && !(checksum.indexOf("+") !== -1) && !(checksum.indexOf("Z") !== -1) && !(checksum.indexOf("=") !== -1)) {
            options.sha2 = checksum;
        } else {
            options.sha512 = checksum;
        }
        for (let attemptNumber = 1; attemptNumber < 4; attemptNumber++) {
            try {
                yield (_nodeHttpExecutor || _load_nodeHttpExecutor()).httpExecutor.download(url, archiveName, options);
            } catch (e) {
                if (attemptNumber >= 3) {
                    throw e;
                }
                (0, (_log || _load_log()).warn)(`Cannot download ${name}, attempt #${attemptNumber}: ${e}`);
                yield new (_bluebirdLst2 || _load_bluebirdLst2()).default(function (resolve, reject) {
                    setTimeout(function () {
                        return (_nodeHttpExecutor || _load_nodeHttpExecutor()).httpExecutor.download(url, archiveName, options).then(resolve).catch(reject);
                    }, 1000 * attemptNumber);
                });
            }
        }
        yield (0, (_util || _load_util()).spawn)((_zipBin || _load_zipBin()).path7za, (0, (_util || _load_util()).debug7zArgs)("x").concat(archiveName, `-o${tempUnpackDir}`), {
            cwd: cachePath
        });
        yield (_bluebirdLst2 || _load_bluebirdLst2()).default.all([(0, (_fsExtraP || _load_fsExtraP()).rename)(tempUnpackDir, dirPath).catch(function (e) {
            console.warn(`Cannot move downloaded ${name} into final location (another process downloaded faster?): ${e}`);
        }), (0, (_fsExtraP || _load_fsExtraP()).unlink)(archiveName)]);
        debug(`${name}} downloaded to ${dirPath}`);
        return dirPath;
    });

    return function doGetBin(_x, _x2, _x3, _x4) {
        return _ref.apply(this, arguments);
    };
})();
//# sourceMappingURL=binDownload.js.map


exports.getBinFromBintray = getBinFromBintray;
exports.getBinFromGithub = getBinFromGithub;
exports.getBin = getBin;

var _zipBin;

function _load_zipBin() {
    return _zipBin = require("7zip-bin");
}

var _builderUtilRuntime;

function _load_builderUtilRuntime() {
    return _builderUtilRuntime = require("builder-util-runtime");
}

var _debug2 = _interopRequireDefault(require("debug"));

var _fsExtraP;

function _load_fsExtraP() {
    return _fsExtraP = require("fs-extra-p");
}

var _path = _interopRequireWildcard(require("path"));

var _tempFile;

function _load_tempFile() {
    return _tempFile = require("temp-file");
}

var _fs;

function _load_fs() {
    return _fs = require("./fs");
}

var _log;

function _load_log() {
    return _log = require("./log");
}

var _nodeHttpExecutor;

function _load_nodeHttpExecutor() {
    return _nodeHttpExecutor = require("./nodeHttpExecutor");
}

var _util;

function _load_util() {
    return _util = require("./util");
}

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = (0, _debug2.default)("electron-builder:binDownload");
const versionToPromise = new Map();
function getBinFromBintray(name, version, sha2) {
    const dirName = `${name}-${version}`;
    return getBin(name, dirName, `https://dl.bintray.com/electron-userland/bin/${dirName}.7z`, sha2);
}
function getBinFromGithub(name, version, checksum) {
    const dirName = `${name}-${version}`;
    return getBin(name, dirName, `https://github.com/electron-userland/electron-builder-binaries/releases/download/${dirName}/${dirName}.7z`, checksum);
}
function getBin(name, dirName, url, checksum) {
    let promise = versionToPromise.get(dirName);
    // if rejected, we will try to download again
    if (promise != null && !promise.isRejected()) {
        return promise;
    }
    promise = doGetBin(name, dirName, url, checksum);
    versionToPromise.set(dirName, promise);
    return promise;
}