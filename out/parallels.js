"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.VmManager = exports.getWindowsVm = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

let parseVmList = (() => {
    var _ref = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (debugLogger) {
        // do not log output if debug - it is huge, logged using debugLogger
        let rawList = yield (0, (_builderUtil || _load_builderUtil()).exec)("prlctl", ["list", "-i", "-s", "name"], undefined, false);
        debugLogger.add("parallels.list", rawList);
        rawList = rawList.substring(rawList.indexOf("ID:"));
        // let match: Array<string> | null
        const result = [];
        for (const info of rawList.split("\n\n").map(function (it) {
            return it.trim();
        }).filter(function (it) {
            return it.length > 0;
        })) {
            const vm = {};
            for (const line of info.split("\n")) {
                const meta = /^([^:("]+): (.*)$/.exec(line);
                if (meta == null) {
                    continue;
                }
                const key = meta[1].toLowerCase();
                if (key === "id" || key === "os" || key === "name" || key === "state" || key === "name") {
                    vm[key] = meta[2].trim();
                }
            }
            result.push(vm);
        }
        return result;
    });

    return function parseVmList(_x) {
        return _ref.apply(this, arguments);
    };
})();

let getWindowsVm = exports.getWindowsVm = (() => {
    var _ref2 = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (debugLogger) {
        const vmList = (yield parseVmList(debugLogger)).filter(function (it) {
            return it.os === "win-10";
        });
        if (vmList.length === 0) {
            throw new Error("Cannot find suitable Parallels Desktop virtual machine (Windows 10 is required)");
        }
        // prefer running or suspended vm
        return new ParallelsVmManager(vmList.find(function (it) {
            return it.state === "running";
        }) || vmList.find(function (it) {
            return it.state === "suspended";
        }) || vmList[0]);
    });

    return function getWindowsVm(_x2) {
        return _ref2.apply(this, arguments);
    };
})();

exports.macPathToParallelsWindows = macPathToParallelsWindows;

var _builderUtil;

function _load_builderUtil() {
    return _builderUtil = require("builder-util");
}

var _child_process;

function _load_child_process() {
    return _child_process = require("child_process");
}

var _path = _interopRequireWildcard(require("path"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

class VmManager {
    get pathSep() {
        return _path.sep;
    }
    exec(file, args, options) {
        let isLogOutIfDebug = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

        return (0, (_builderUtil || _load_builderUtil()).exec)(file, args, options, isLogOutIfDebug);
    }
    spawn(command, args, options, extraOptions) {
        return (0, (_builderUtil || _load_builderUtil()).spawn)(command, args);
    }
    toVmFile(file) {
        return file;
    }
}
exports.VmManager = VmManager;
class ParallelsVmManager extends VmManager {
    constructor(vm) {
        super();
        this.vm = vm;
        this.isExitHookAdded = false;
        this.startPromise = this.doStartVm();
    }
    get pathSep() {
        return "/";
    }
    handleExecuteError(error) {
        if (error.message.indexOf("Unable to open new session in this virtual machine") !== -1) {
            throw new Error(`Please ensure that your are logged in "${this.vm.name}" parallels virtual machine. In the future please do not stop VM, but suspend.\n\n${error.message}`);
        }
        throw error;
    }
    exec(file, args, options) {
        var _this = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            yield _this.ensureThatVmStarted();
            // it is important to use "--current-user" to execute command under logged in user - to access certs.
            return yield (0, (_builderUtil || _load_builderUtil()).exec)("prlctl", ["exec", _this.vm.id, "--current-user", file.startsWith("/") ? macPathToParallelsWindows(file) : file].concat(args), options).catch(function (error) {
                return _this.handleExecuteError(error);
            });
        })();
    }
    spawn(command, args, options, extraOptions) {
        var _this2 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            yield _this2.ensureThatVmStarted();
            return yield (0, (_builderUtil || _load_builderUtil()).spawn)("prlctl", ["exec", _this2.vm.id, command].concat(args), options, extraOptions).catch(function (error) {
                return _this2.handleExecuteError(error);
            });
        })();
    }
    doStartVm() {
        var _this3 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            const vmId = _this3.vm.id;
            const state = _this3.vm.state;
            if (state === "running") {
                return;
            }
            if (!_this3.isExitHookAdded) {
                _this3.isExitHookAdded = true;
                require("async-exit-hook")(function (callback) {
                    const stopArgs = ["suspend", vmId];
                    if (callback == null) {
                        (0, (_child_process || _load_child_process()).execFileSync)("prlctl", stopArgs);
                    } else {
                        (0, (_builderUtil || _load_builderUtil()).exec)("prlctl", stopArgs).then(callback).catch(callback);
                    }
                });
            }
            yield (0, (_builderUtil || _load_builderUtil()).exec)("prlctl", ["start", vmId]);
        })();
    }
    ensureThatVmStarted() {
        let startPromise = this.startPromise;
        if (startPromise == null) {
            startPromise = this.doStartVm();
            this.startPromise = startPromise;
        }
        return startPromise;
    }
    toVmFile(file) {
        // https://stackoverflow.com/questions/4742992/cannot-access-network-drive-in-powershell-running-as-administrator
        return macPathToParallelsWindows(file);
    }
}
function macPathToParallelsWindows(file) {
    return "\\\\Mac\\Host\\\\" + file;
}
//# sourceMappingURL=parallels.js.map