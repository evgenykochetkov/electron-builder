"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.checkWineVersion = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

/** @private */
let checkWineVersion = exports.checkWineVersion = (() => {
    var _ref2 = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (checkPromise) {
        function wineError(prefix) {
            return `${prefix}, please see https://electron.build/multi-platform-build#${process.platform === "linux" ? "linux" : "macos"}`;
        }
        let wineVersion;
        try {
            wineVersion = (yield checkPromise).trim();
        } catch (e) {
            if (e.code === "ENOENT") {
                throw new Error(wineError("wine is required"));
            } else {
                throw new Error(`Cannot check wine version: ${e}`);
            }
        }
        if (wineVersion.startsWith("wine-")) {
            wineVersion = wineVersion.substring("wine-".length);
        }
        const spaceIndex = wineVersion.indexOf(" ");
        if (spaceIndex > 0) {
            wineVersion = wineVersion.substring(0, spaceIndex);
        }
        const suffixIndex = wineVersion.indexOf("-");
        if (suffixIndex > 0) {
            wineVersion = wineVersion.substring(0, suffixIndex);
        }
        if (wineVersion.split(".").length === 2) {
            wineVersion += ".0";
        }
        if ((_semver || _load_semver()).lt(wineVersion, "1.8.0")) {
            throw new Error(wineError(`wine 1.8+ is required, but your version is ${wineVersion}`));
        }
    });

    return function checkWineVersion(_x2) {
        return _ref2.apply(this, arguments);
    };
})();
//# sourceMappingURL=wine.js.map


exports.execWine = execWine;
exports.prepareWindowsExecutableArgs = prepareWindowsExecutableArgs;

var _lazyVal;

function _load_lazyVal() {
    return _lazyVal = require("lazy-val");
}

var _path = _interopRequireWildcard(require("path"));

var _semver;

function _load_semver() {
    return _semver = _interopRequireWildcard(require("semver"));
}

var _binDownload;

function _load_binDownload() {
    return _binDownload = require("./binDownload");
}

var _bundledTool;

function _load_bundledTool() {
    return _bundledTool = require("./bundledTool");
}

var _macosVersion;

function _load_macosVersion() {
    return _macosVersion = require("./macosVersion");
}

var _util;

function _load_util() {
    return _util = require("./util");
}

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

const wineExecutable = new (_lazyVal || _load_lazyVal()).Lazy((0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
    const isUseSystemWine = (0, (_util || _load_util()).isEnvTrue)(process.env.USE_SYSTEM_WINE);
    if (isUseSystemWine) {
        (0, (_util || _load_util()).debug)("Using system wine is forced");
    } else if (process.platform === "darwin") {
        const osVersion = yield (0, (_macosVersion || _load_macosVersion()).getMacOsVersion)();
        let version = null;
        let checksum = null;
        if ((_semver || _load_semver()).gte(osVersion, "10.13.0")) {
            version = "2.0.2-mac-10.13";
            // noinspection SpellCheckingInspection
            checksum = "v6r9RSQBAbfvpVQNrEj48X8Cw1181rEGMRatGxSKY5p+7khzzy/0tOdfHGO8cU+GqYvH43FAKMK8p6vUfCqSSA==";
        } else if ((_semver || _load_semver()).gte(osVersion, "10.12.0")) {
            version = "2.0.1-mac-10.12";
            // noinspection SpellCheckingInspection
            checksum = "IvKwDml/Ob0vKfYVxcu92wxUzHu8lTQSjjb8OlCTQ6bdNpVkqw17OM14TPpzGMIgSxfVIrQZhZdCwpkxLyG3mg==";
        }
        if (version != null) {
            const wineDir = yield (0, (_binDownload || _load_binDownload()).getBinFromGithub)("wine", version, checksum);
            return {
                path: _path.join(wineDir, "bin/wine"),
                env: Object.assign({}, process.env, { WINEDEBUG: "-all,err+all", WINEDLLOVERRIDES: "winemenubuilder.exe=d", WINEPREFIX: _path.join(wineDir, "wine-home"), DYLD_FALLBACK_LIBRARY_PATH: (0, (_bundledTool || _load_bundledTool()).computeEnv)(process.env.DYLD_FALLBACK_LIBRARY_PATH, [_path.join(wineDir, "lib")]) })
            };
        }
    }
    yield checkWineVersion((0, (_util || _load_util()).exec)("wine", ["--version"]));
    return { path: "wine" };
}));
/** @private */
function execWine(file, args) {
    let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : (_bundledTool || _load_bundledTool()).EXEC_TIMEOUT;

    if (process.platform === "win32") {
        return (0, (_util || _load_util()).exec)(file, args, options);
    } else {
        return wineExecutable.value.then(wine => (0, (_util || _load_util()).exec)(wine.path, [file].concat(args), wine.env == null ? options : Object.assign({ env: wine.env }, options)));
    }
}
/** @private */
function prepareWindowsExecutableArgs(args, exePath) {
    if (process.platform !== "win32") {
        args.unshift(exePath);
    }
    return args;
}