"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.archive = exports.tar = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

/** @internal */
let tar = exports.tar = (() => {
    var _ref = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (compression, format, outFile, dirToArchive) {
        let isMacApp = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;

        // we don't use 7z here - develar: I spent a lot of time making pipe working - but it works on MacOS and often hangs on Linux (even if use pipe-io lib)
        // and in any case it is better to use system tools (in the light of docker - it is not problem for user because we provide complete docker image).
        const info = extToCompressionDescriptor[format];
        let tarEnv = process.env;
        if (process.env.ELECTRON_BUILDER_COMPRESSION_LEVEL != null) {
            tarEnv = Object.assign({}, tarEnv);
            tarEnv[info.env] = "-" + process.env.ELECTRON_BUILDER_COMPRESSION_LEVEL;
        } else if (compression != null && compression !== "normal") {
            tarEnv = Object.assign({}, tarEnv);
            tarEnv[info.env] = compression === "store" ? info.minLevel : info.maxLevel;
        }
        const args = [info.flag, "-cf", outFile];
        if (!isMacApp) {
            args.push("--transform", `s,^\\.,${_path.basename(outFile, "." + format)},`);
        }
        args.push(isMacApp ? _path.basename(dirToArchive) : ".");
        if (yield (0, (_builderUtil || _load_builderUtil()).isMacOsSierra)()) {
            const linuxToolsPath = yield (0, (_bundledTool || _load_bundledTool()).getLinuxToolsPath)();
            tarEnv = Object.assign({}, tarEnv, { PATH: (0, (_bundledTool || _load_bundledTool()).computeEnv)(process.env.PATH, [_path.join(linuxToolsPath, "bin")]), SZA_PATH: (_zipBin || _load_zipBin()).path7za });
        }
        yield (0, (_builderUtil || _load_builderUtil()).spawn)(process.platform === "darwin" || process.platform === "freebsd" ? "gtar" : "tar", args, {
            cwd: isMacApp ? _path.dirname(dirToArchive) : dirToArchive,
            env: tarEnv
        });
        return outFile;
    });

    return function tar(_x2, _x3, _x4, _x5) {
        return _ref.apply(this, arguments);
    };
})();

// 7z is very fast, so, use ultra compression
/** @internal */
let archive = exports.archive = (() => {
    var _ref2 = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (compression, format, outFile, dirToArchive) {
        let options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};

        const args = compute7zCompressArgs(compression, format, options);
        // remove file before - 7z doesn't overwrite file, but update
        try {
            yield (0, (_fsExtraP || _load_fsExtraP()).unlink)(outFile);
        } catch (e) {
            // ignore
        }
        args.push(outFile, options.listFile == null ? options.withoutDir ? "." : _path.basename(dirToArchive) : `@${options.listFile}`);
        if (options.excluded != null) {
            args.push.apply(args, _toConsumableArray(options.excluded));
        }
        try {
            yield (0, (_builderUtil || _load_builderUtil()).spawn)((_zipBin || _load_zipBin()).path7za, args, {
                cwd: options.withoutDir ? dirToArchive : _path.dirname(dirToArchive)
            }, { isDebugEnabled: (_builderUtil || _load_builderUtil()).debug7z.enabled });
        } catch (e) {
            if (e.code === "ENOENT" && !(yield (0, (_fs || _load_fs()).exists)(dirToArchive))) {
                throw new Error(`Cannot create archive: "${dirToArchive}" doesn't exist`);
            } else {
                throw e;
            }
        }
        return outFile;
    });

    return function archive(_x8, _x9, _x10, _x11) {
        return _ref2.apply(this, arguments);
    };
})();
//# sourceMappingURL=archive.js.map


exports.compute7zCompressArgs = compute7zCompressArgs;

var _zipBin;

function _load_zipBin() {
    return _zipBin = require("7zip-bin");
}

var _builderUtil;

function _load_builderUtil() {
    return _builderUtil = require("builder-util");
}

var _bundledTool;

function _load_bundledTool() {
    return _bundledTool = require("builder-util/out/bundledTool");
}

var _fs;

function _load_fs() {
    return _fs = require("builder-util/out/fs");
}

var _fsExtraP;

function _load_fsExtraP() {
    return _fsExtraP = require("fs-extra-p");
}

var _path = _interopRequireWildcard(require("path"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

class CompressionDescriptor {
    constructor(flag, env, minLevel) {
        let maxLevel = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "-9";

        this.flag = flag;
        this.env = env;
        this.minLevel = minLevel;
        this.maxLevel = maxLevel;
    }
}
const extToCompressionDescriptor = {
    "tar.xz": new CompressionDescriptor(`-I'${(_zipBin || _load_zipBin()).path7x}'`, "XZ_OPT", "-0", "-9e"),
    "tar.lz": new CompressionDescriptor("--lzip", "LZOP", "-0"),
    "tar.gz": new CompressionDescriptor("--gz", "GZIP", "-1"),
    "tar.bz2": new CompressionDescriptor("--bzip2", "BZIP2", "-1")
};function compute7zCompressArgs(compression, format) {
    let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    let storeOnly = compression === "store";
    const args = (0, (_builderUtil || _load_builderUtil()).debug7zArgs)("a");
    let isLevelSet = false;
    if (process.env.ELECTRON_BUILDER_COMPRESSION_LEVEL != null) {
        storeOnly = false;
        args.push(`-mx=${process.env.ELECTRON_BUILDER_COMPRESSION_LEVEL}`);
        isLevelSet = true;
    }
    if (format === "zip" && compression === "maximum") {
        // http://superuser.com/a/742034
        args.push("-mfb=258", "-mpass=15");
    }
    if (!isLevelSet && !storeOnly) {
        args.push("-mx=9");
    }
    if (options.dictSize != null) {
        args.push(`-md=${options.dictSize}m`);
    }
    // https://sevenzip.osdn.jp/chm/cmdline/switches/method.htm#7Z
    // https://stackoverflow.com/questions/27136783/7zip-produces-different-output-from-identical-input
    // tc and ta are off by default, but to be sure, we explicitly set it to off
    // disable "Stores NTFS timestamps for files: Modification time, Creation time, Last access time." to produce the same archive for the same data
    args.push("-mtc=off");
    if (format === "7z" || format.endsWith(".7z")) {
        if (options.solid === false) {
            args.push("-ms=off");
        }
        if (options.isArchiveHeaderCompressed === false) {
            args.push("-mhc=off");
        }
        // args valid only for 7z
        // -mtm=off disable "Stores last Modified timestamps for files."
        args.push("-mtm=off", "-mta=off");
    }
    if (options.method != null) {
        args.push(`-mm=${options.method}`);
    } else if (format === "zip" || storeOnly) {
        args.push(`-mm=${storeOnly ? "Copy" : "Deflate"}`);
    }
    if (format === "zip") {
        // -mcu switch:  7-Zip uses UTF-8, if there are non-ASCII symbols.
        // because default mode: 7-Zip uses UTF-8, if the local code page doesn't contain required symbols.
        // but archive should be the same regardless where produced
        args.push("-mcu");
    }
    return args;
}