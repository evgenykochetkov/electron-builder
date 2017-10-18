"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ELECTRON_COMPILE_SHIM_FILENAME = exports.computeFileSets = exports.NODE_MODULES_PATTERN = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

var _bluebirdLst2;

function _load_bluebirdLst2() {
    return _bluebirdLst2 = _interopRequireDefault(require("bluebird-lst"));
}

let computeFileSets = exports.computeFileSets = (() => {
    var _ref = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (matchers, transformer, packager, isElectronCompile) {
        const fileSets = [];
        for (const matcher of matchers) {
            const fileWalker = new (_AppFileWalker || _load_AppFileWalker()).AppFileWalker(matcher, packager);
            const fromStat = yield (0, (_fs || _load_fs()).statOrNull)(fileWalker.matcher.from);
            if (fromStat == null) {
                (0, (_builderUtil || _load_builderUtil()).debug)(`Directory ${fileWalker.matcher.from} doesn't exists, skip file copying`);
                continue;
            }
            const files = yield (0, (_fs || _load_fs()).walk)(fileWalker.matcher.from, fileWalker.filter, fileWalker);
            const metadata = fileWalker.metadata;
            const transformedFiles = yield (_bluebirdLst2 || _load_bluebirdLst2()).default.map(files, function (it) {
                const fileStat = metadata.get(it);
                return fileStat != null && fileStat.isFile() ? transformer(it) : null;
            }, (_fs || _load_fs()).CONCURRENCY);
            fileSets.push({ src: fileWalker.matcher.from, files, metadata: fileWalker.metadata, transformedFiles, destination: fileWalker.matcher.to });
        }
        const mainFileSet = fileSets[0];
        if (isElectronCompile) {
            // cache should be first in the asar
            fileSets.unshift((yield compileUsingElectronCompile(mainFileSet, packager)));
        }
        return fileSets;
    });

    return function computeFileSets(_x, _x2, _x3, _x4) {
        return _ref.apply(this, arguments);
    };
})();

let compileUsingElectronCompile = (() => {
    var _ref2 = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (mainFileSet, packager) {
        (0, (_builderUtil || _load_builderUtil()).log)("Compiling using electron-compile");
        const electronCompileCache = yield packager.tempDirManager.getTempDir({ prefix: "electron-compile-cache" });
        const cacheDir = _path.join(electronCompileCache, ".cache");
        // clear and create cache dir
        yield (0, (_fsExtraP || _load_fsExtraP()).ensureDir)(cacheDir);
        const compilerHost = yield (0, (_fileTransformer || _load_fileTransformer()).createElectronCompilerHost)(mainFileSet.src, cacheDir);
        const nextSlashIndex = mainFileSet.src.length + 1;
        // pre-compute electron-compile to cache dir - we need to process only subdirectories, not direct files of app dir
        yield (_bluebirdLst2 || _load_bluebirdLst2()).default.map(mainFileSet.files, function (file) {
            if (file.indexOf(NODE_MODULES_PATTERN) !== -1 || file.indexOf(BOWER_COMPONENTS_PATTERN) !== -1 || !(file.indexOf(_path.sep, nextSlashIndex) !== -1) // ignore not root files
            || !mainFileSet.metadata.get(file).isFile()) {
                return null;
            }
            return compilerHost.compile(file).then(function (it) {
                return null;
            });
        }, (_fs || _load_fs()).CONCURRENCY);
        yield compilerHost.saveConfiguration();
        const metadata = new Map();
        const cacheFiles = yield (0, (_fs || _load_fs()).walk)(cacheDir, function (file, stat) {
            return !file.startsWith(".");
        }, {
            consume: function (file, fileStat) {
                if (fileStat.isFile()) {
                    metadata.set(file, fileStat);
                }
                return null;
            }
        });
        // add shim
        const shimPath = `${mainFileSet.src}/${ELECTRON_COMPILE_SHIM_FILENAME}`;
        cacheFiles.push(shimPath);
        metadata.set(shimPath, { isFile: function () {
                return true;
            }, isDirectory: function () {
                return false;
            } });
        const transformedFiles = new Array(cacheFiles.length);
        transformedFiles[cacheFiles.length - 1] = `
'use strict';
require('electron-compile').init(__dirname, require('path').resolve(__dirname, '${packager.metadata.main || "index"}'), true);
`;
        // cache files should be first (better IO)
        return { src: electronCompileCache, files: cacheFiles, transformedFiles, metadata, destination: mainFileSet.destination };
    });

    return function compileUsingElectronCompile(_x5, _x6) {
        return _ref2.apply(this, arguments);
    };
})();
// sometimes, destination may not contain path separator in the end (path to folder), but the src does. So let's ensure paths have path separators in the end


exports.ensureEndSlash = ensureEndSlash;
exports.relativeUpwardsPathToNodeModulesPath = relativeUpwardsPathToNodeModulesPath;

var _builderUtil;

function _load_builderUtil() {
    return _builderUtil = require("builder-util");
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

var _fileTransformer;

function _load_fileTransformer() {
    return _fileTransformer = require("../fileTransformer");
}

var _AppFileWalker;

function _load_AppFileWalker() {
    return _AppFileWalker = require("./AppFileWalker");
}

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @internal */
const NODE_MODULES_PATTERN = exports.NODE_MODULES_PATTERN = `${_path.sep}node_modules${_path.sep}`;

const BOWER_COMPONENTS_PATTERN = `${_path.sep}bower_components${_path.sep}`;
/** @internal */
const ELECTRON_COMPILE_SHIM_FILENAME = exports.ELECTRON_COMPILE_SHIM_FILENAME = "__shim.js";
function ensureEndSlash(s) {
    return s === "" || s.endsWith(_path.sep) ? s : s + _path.sep;
}
function relativeUpwardsPathToNodeModulesPath(p) {
    if (!p.startsWith('..')) return p;
    const base = _path.sep === '/' ? p.replace(/\.\.\//g, '') : p.replace(/\.\.\\/g, '');
    return _path.join(base.startsWith('node_modules') ? '' : 'node_modules', base);
}
//# sourceMappingURL=AppFileCopierHelper.js.map