"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.debug7z = exports.debug = exports.copyFile = exports.hashFile = exports.DebugLogger = exports.AsyncTaskManager = exports.archFromString = exports.getArchSuffix = exports.toLinuxArchString = exports.Arch = exports.prepareWindowsExecutableArgs = exports.execWine = exports.isCanSignDmg = exports.isMacOsSierra = exports.task = exports.warn = exports.log = exports.TmpDir = exports.safeStringifyJson = undefined;

var _builderUtilRuntime;

function _load_builderUtilRuntime() {
    return _builderUtilRuntime = require("builder-util-runtime");
}

Object.defineProperty(exports, "safeStringifyJson", {
    enumerable: true,
    get: function () {
        return (_builderUtilRuntime || _load_builderUtilRuntime()).safeStringifyJson;
    }
});

var _tempFile;

function _load_tempFile() {
    return _tempFile = require("temp-file");
}

Object.defineProperty(exports, "TmpDir", {
    enumerable: true,
    get: function () {
        return (_tempFile || _load_tempFile()).TmpDir;
    }
});

var _log;

function _load_log() {
    return _log = require("./log");
}

Object.defineProperty(exports, "log", {
    enumerable: true,
    get: function () {
        return (_log || _load_log()).log;
    }
});
Object.defineProperty(exports, "warn", {
    enumerable: true,
    get: function () {
        return (_log || _load_log()).warn;
    }
});
Object.defineProperty(exports, "task", {
    enumerable: true,
    get: function () {
        return (_log || _load_log()).task;
    }
});

var _macosVersion;

function _load_macosVersion() {
    return _macosVersion = require("./macosVersion");
}

Object.defineProperty(exports, "isMacOsSierra", {
    enumerable: true,
    get: function () {
        return (_macosVersion || _load_macosVersion()).isMacOsSierra;
    }
});
Object.defineProperty(exports, "isCanSignDmg", {
    enumerable: true,
    get: function () {
        return (_macosVersion || _load_macosVersion()).isCanSignDmg;
    }
});

var _wine;

function _load_wine() {
    return _wine = require("./wine");
}

Object.defineProperty(exports, "execWine", {
    enumerable: true,
    get: function () {
        return (_wine || _load_wine()).execWine;
    }
});
Object.defineProperty(exports, "prepareWindowsExecutableArgs", {
    enumerable: true,
    get: function () {
        return (_wine || _load_wine()).prepareWindowsExecutableArgs;
    }
});

var _arch;

function _load_arch() {
    return _arch = require("./arch");
}

Object.defineProperty(exports, "Arch", {
    enumerable: true,
    get: function () {
        return (_arch || _load_arch()).Arch;
    }
});
Object.defineProperty(exports, "toLinuxArchString", {
    enumerable: true,
    get: function () {
        return (_arch || _load_arch()).toLinuxArchString;
    }
});
Object.defineProperty(exports, "getArchSuffix", {
    enumerable: true,
    get: function () {
        return (_arch || _load_arch()).getArchSuffix;
    }
});
Object.defineProperty(exports, "archFromString", {
    enumerable: true,
    get: function () {
        return (_arch || _load_arch()).archFromString;
    }
});

var _asyncTaskManager;

function _load_asyncTaskManager() {
    return _asyncTaskManager = require("./asyncTaskManager");
}

Object.defineProperty(exports, "AsyncTaskManager", {
    enumerable: true,
    get: function () {
        return (_asyncTaskManager || _load_asyncTaskManager()).AsyncTaskManager;
    }
});

var _DebugLogger;

function _load_DebugLogger() {
    return _DebugLogger = require("./DebugLogger");
}

Object.defineProperty(exports, "DebugLogger", {
    enumerable: true,
    get: function () {
        return (_DebugLogger || _load_DebugLogger()).DebugLogger;
    }
});

var _hash;

function _load_hash() {
    return _hash = require("./hash");
}

Object.defineProperty(exports, "hashFile", {
    enumerable: true,
    get: function () {
        return (_hash || _load_hash()).hashFile;
    }
});

var _fs;

function _load_fs() {
    return _fs = require("./fs");
}

Object.defineProperty(exports, "copyFile", {
    enumerable: true,
    get: function () {
        return (_fs || _load_fs()).copyFile;
    }
});
exports.removePassword = removePassword;
exports.exec = exec;
exports.doSpawn = doSpawn;
exports.spawnAndWrite = spawnAndWrite;
exports.spawn = spawn;
exports.handleProcess = handleProcess;
exports.use = use;
exports.debug7zArgs = debug7zArgs;
exports.isEmptyOrSpaces = isEmptyOrSpaces;
exports.isTokenCharValid = isTokenCharValid;
exports.asArray = asArray;
exports.getCacheDirectory = getCacheDirectory;
exports.smarten = smarten;
exports.addValue = addValue;
exports.replaceDefault = replaceDefault;
exports.getPlatformIconFileName = getPlatformIconFileName;
exports.isPullRequest = isPullRequest;
exports.isEnvTrue = isEnvTrue;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = _interopRequireDefault(require("bluebird-lst"));
}

var _chalk;

function _load_chalk() {
    return _chalk = require("chalk");
}

var _child_process;

function _load_child_process() {
    return _child_process = require("child_process");
}

var _crypto;

function _load_crypto() {
    return _crypto = require("crypto");
}

var _debug2 = _interopRequireDefault(require("debug"));

var _os;

function _load_os() {
    return _os = require("os");
}

var _path = _interopRequireWildcard(require("path"));

require("source-map-support/register");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

const debug = exports.debug = (0, _debug2.default)("electron-builder");
const debug7z = exports.debug7z = (0, _debug2.default)("electron-builder:7z");
function removePassword(input) {
    return input.replace(/(-String |-P |pass:| \/p |-pass )([^ ]+)/g, (match, p1, p2) => {
        if (p1.trim() === "/p" && p2.startsWith("\\\\Mac\\Host\\\\")) {
            // appx /p
            return `${p1}${p2}`;
        }
        return `${p1}${(0, (_crypto || _load_crypto()).createHash)("sha256").update(p2).digest("hex")} (sha256 hash)`;
    });
}
function getProcessEnv(env) {
    if (process.platform === "win32") {
        return env;
    }
    const finalEnv = Object.assign({}, env || process.env);
    // without LC_CTYPE dpkg can returns encoded unicode symbols
    // set LC_CTYPE to avoid crash https://github.com/electron-userland/electron-builder/issues/503 Even "en_DE.UTF-8" leads to error.
    finalEnv.LANG = "en_US.UTF-8";
    finalEnv.LC_CTYPE = "en_US.UTF-8";
    finalEnv.LC_ALL = "en_US.UTF-8";
    return finalEnv;
}
function exec(file, args, options) {
    let isLogOutIfDebug = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

    if (debug.enabled) {
        debug(`Executing ${file} ${args == null ? "" : removePassword(args.join(" "))}`);
        if (options != null && options.env != null) {
            const diffEnv = Object.assign({}, options.env);
            for (const name of Object.keys(process.env)) {
                if (process.env[name] === options.env[name]) {
                    delete diffEnv[name];
                }
            }
            debug(`env: ${(0, (_builderUtilRuntime || _load_builderUtilRuntime()).safeStringifyJson)(diffEnv)}`);
        }
        if (options != null && options.cwd != null) {
            debug(`cwd: ${options.cwd}`);
        }
    }
    return new (_bluebirdLst || _load_bluebirdLst()).default((resolve, reject) => {
        (0, (_child_process || _load_child_process()).execFile)(file, args, Object.assign({}, options, { maxBuffer: 10 * 1024 * 1024, env: getProcessEnv(options == null ? null : options.env) }), (error, stdout, stderr) => {
            if (error == null) {
                if (isLogOutIfDebug && debug.enabled) {
                    if (stderr.length !== 0) {
                        debug(file.endsWith("wine") ? removeWineSpam(stderr.toString()) : stderr);
                    }
                    if (stdout.length !== 0) {
                        debug(stdout);
                    }
                }
                resolve(stdout.toString());
            } else {
                let message = (0, (_chalk || _load_chalk()).red)(removePassword(`Exit code: ${error.code}. ${error.message}`));
                if (stdout.length !== 0) {
                    if (file.endsWith("wine")) {
                        stdout = removeWineSpam(stdout.toString());
                    }
                    message += `\n${(0, (_chalk || _load_chalk()).yellow)(stdout.toString())}`;
                }
                if (stderr.length !== 0) {
                    if (file.endsWith("wine")) {
                        stderr = removeWineSpam(stderr.toString());
                    }
                    message += `\n${(0, (_chalk || _load_chalk()).red)(stderr.toString())}`;
                }
                reject(new Error(message));
            }
        });
    });
}
function removeWineSpam(out) {
    return out.toString().split("\n").filter(it => !(it.indexOf("wine: cannot find L\"C:\\\\windows\\\\system32\\\\winemenubuilder.exe\"") !== -1) && !(it.indexOf("err:wineboot:ProcessRunKeys Error running cmd L\"C:\\\\windows\\\\system32\\\\winemenubuilder.exe") !== -1)).join("\n");
}
function doSpawn(command, args, options, extraOptions) {
    if (options == null) {
        options = {};
    }
    options.env = getProcessEnv(options.env);
    const isDebugEnabled = extraOptions == null || extraOptions.isDebugEnabled == null ? debug.enabled : extraOptions.isDebugEnabled;
    if (options.stdio == null) {
        // do not ignore stdout/stderr if not debug, because in this case we will read into buffer and print on error
        options.stdio = [extraOptions != null && extraOptions.isPipeInput ? "pipe" : "ignore", isDebugEnabled ? "inherit" : "pipe", isDebugEnabled ? "inherit" : "pipe"];
    }
    // use general debug.enabled to log spawn, because it doesn't produce a lot of output (the only line), but important in any case
    if (debug.enabled) {
        const argsString = args.join(" ");
        debug(`Spawning ${command} ${command === "docker" ? argsString : removePassword(argsString)}`);
        if (options != null && options.cwd != null) {
            debug(`cwd: ${options.cwd}`);
        }
    }
    try {
        return (0, (_child_process || _load_child_process()).spawn)(command, args, options);
    } catch (e) {
        throw new Error(`Cannot spawn ${command}: ${e.stack || e}`);
    }
}
function spawnAndWrite(command, args, data, options) {
    let isDebugEnabled = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;

    const childProcess = doSpawn(command, args, options, { isPipeInput: true, isDebugEnabled });
    const timeout = setTimeout(() => childProcess.kill(), 4 * 60 * 1000);
    return new (_bluebirdLst || _load_bluebirdLst()).default((resolve, reject) => {
        handleProcess("close", childProcess, command, () => {
            try {
                clearTimeout(timeout);
            } finally {
                resolve();
            }
        }, error => {
            try {
                clearTimeout(timeout);
            } finally {
                reject(error.stack || error.toString());
            }
        });
        childProcess.stdin.end(data);
    });
}
function spawn(command, args, options, extraOptions) {
    return new (_bluebirdLst || _load_bluebirdLst()).default((resolve, reject) => {
        handleProcess("close", doSpawn(command, args || [], options, extraOptions), command, resolve, reject);
    });
}
function handleProcess(event, childProcess, command, resolve, reject) {
    childProcess.on("error", reject);
    let out = "";
    if (!debug.enabled && childProcess.stdout != null) {
        childProcess.stdout.on("data", data => {
            out += data;
        });
    }
    let errorOut = "";
    if (childProcess.stderr != null) {
        childProcess.stderr.on("data", data => {
            errorOut += data;
        });
    }
    childProcess.once(event, code => {
        if (code === 0 && debug.enabled) {
            debug(`${_path.basename(command)} (${childProcess.pid}) exited with exit code 0`);
        }
        if (code === 0) {
            if (resolve != null) {
                resolve();
            }
        } else {
            function formatOut(text, title) {
                return text.length === 0 ? "" : `\n${title}:\n${text}`;
            }
            reject(new Error(`${command} exited with code ${code}${formatOut(out, "Output")}${formatOut(errorOut, "Error output")}`));
        }
    });
}
function use(value, task) {
    return value == null ? null : task(value);
}
function debug7zArgs(command) {
    const args = [command, "-bd"];
    if (debug7z.enabled) {
        args.push("-bb");
    }
    return args;
}
function isEmptyOrSpaces(s) {
    return s == null || s.trim().length === 0;
}
function isTokenCharValid(token) {
    return (/^[\w\/=+-]+$/.test(token)
    );
}
function asArray(v) {
    if (v == null) {
        return [];
    } else if (Array.isArray(v)) {
        return v;
    } else {
        return [v];
    }
}
function getCacheDirectory() {
    const env = process.env.ELECTRON_BUILDER_CACHE;
    if (!isEmptyOrSpaces(env)) {
        return env;
    }
    if (process.platform === "darwin") {
        return _path.join((0, (_os || _load_os()).homedir)(), "Library", "Caches", "electron-builder");
    }
    const localappdata = process.env.LOCALAPPDATA;
    if (process.platform === "win32" && localappdata != null) {
        // https://github.com/electron-userland/electron-builder/issues/1164
        if (localappdata.toLowerCase().indexOf("\\windows\\system32\\") !== -1 || (process.env.USERNAME || "").toLowerCase() === "system") {
            return _path.join((0, (_os || _load_os()).tmpdir)(), "electron-builder-cache");
        }
        return _path.join(localappdata, "electron-builder", "cache");
    }
    return _path.join((0, (_os || _load_os()).homedir)(), ".cache", "electron-builder");
}
// fpm bug - rpm build --description is not escaped, well... decided to replace quite to smart quote
// http://leancrew.com/all-this/2010/11/smart-quotes-in-javascript/
function smarten(s) {
    // opening singles
    s = s.replace(/(^|[-\u2014\s(\["])'/g, "$1\u2018");
    // closing singles & apostrophes
    s = s.replace(/'/g, "\u2019");
    // opening doubles
    s = s.replace(/(^|[-\u2014/\[(\u2018\s])"/g, "$1\u201c");
    // closing doubles
    s = s.replace(/"/g, "\u201d");
    return s;
}
function addValue(map, key, value) {
    const list = map.get(key);
    if (list == null) {
        map.set(key, [value]);
    } else if (!(list.indexOf(value) !== -1)) {
        list.push(value);
    }
}
function replaceDefault(inList, defaultList) {
    if (inList == null) {
        return defaultList;
    }
    const index = inList.indexOf("default");
    if (index >= 0) {
        const list = inList.slice(0, index);
        list.push.apply(list, _toConsumableArray(defaultList));
        if (index !== inList.length - 1) {
            list.push.apply(list, _toConsumableArray(inList.slice(index + 1)));
        }
        inList = list;
    }
    return inList;
}
function getPlatformIconFileName(value, isMac) {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    if (!(value.indexOf(".") !== -1)) {
        return `${value}.${isMac ? "icns" : "ico"}`;
    }
    return value.replace(isMac ? ".ico" : ".icns", isMac ? ".icns" : ".ico");
}
function isPullRequest() {
    // TRAVIS_PULL_REQUEST is set to the pull request number if the current job is a pull request build, or false if it’s not.
    function isSet(value) {
        // value can be or null, or empty string
        return value && value !== "false";
    }
    return isSet(process.env.TRAVIS_PULL_REQUEST) || isSet(process.env.CI_PULL_REQUEST) || isSet(process.env.CI_PULL_REQUESTS) || isSet(process.env.BITRISE_PULL_REQUEST) || isSet(process.env.APPVEYOR_PULL_REQUEST_NUMBER);
}
function isEnvTrue(value) {
    if (value != null) {
        value = value.trim();
    }
    return value === "true" || value === "" || value === "1";
}
//# sourceMappingURL=util.js.map