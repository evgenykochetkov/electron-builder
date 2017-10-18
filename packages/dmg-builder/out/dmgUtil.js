"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.applyProperties = exports.computeBackground = exports.detach = exports.attachAndExecute = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

var _bluebirdLst2;

function _load_bluebirdLst2() {
    return _bluebirdLst2 = _interopRequireDefault(require("bluebird-lst"));
}

let attachAndExecute = exports.attachAndExecute = (() => {
    var _ref = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (dmgPath, readWrite, task) {
        //noinspection SpellCheckingInspection
        const args = ["attach", "-noverify", "-noautoopen"];
        if (readWrite) {
            args.push("-readwrite");
        }
        args.push(dmgPath);
        const attachResult = yield (0, (_builderUtil || _load_builderUtil()).exec)("hdiutil", args);
        const deviceResult = attachResult == null ? null : /^(\/dev\/\w+)/.exec(attachResult);
        const device = deviceResult == null || deviceResult.length !== 2 ? null : deviceResult[1];
        if (device == null) {
            throw new Error(`Cannot mount: ${attachResult}`);
        }
        return yield (0, (_promise || _load_promise()).executeFinally)(task(), function () {
            return detach(device);
        });
    });

    return function attachAndExecute(_x, _x2, _x3) {
        return _ref.apply(this, arguments);
    };
})();

let detach = exports.detach = (() => {
    var _ref2 = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (name) {
        try {
            yield (0, (_builderUtil || _load_builderUtil()).exec)("hdiutil", ["detach", name]);
        } catch (e) {
            yield new (_bluebirdLst2 || _load_bluebirdLst2()).default(function (resolve, reject) {
                setTimeout(function () {
                    (0, (_builderUtil || _load_builderUtil()).exec)("hdiutil", ["detach", "-force", name]).then(resolve).catch(reject);
                }, 1000);
            });
        }
    });

    return function detach(_x4) {
        return _ref2.apply(this, arguments);
    };
})();

let computeBackground = exports.computeBackground = (() => {
    var _ref3 = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (packager) {
        const resourceList = yield packager.resourceList;
        if (resourceList.indexOf("background.tiff") !== -1) {
            return _path.join(packager.buildResourcesDir, "background.tiff");
        } else if (resourceList.indexOf("background.png") !== -1) {
            return _path.join(packager.buildResourcesDir, "background.png");
        } else {
            return _path.join(getDmgTemplatePath(), "background.tiff");
        }
    });

    return function computeBackground(_x5) {
        return _ref3.apply(this, arguments);
    };
})();

let applyProperties = exports.applyProperties = (() => {
    var _ref4 = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (entries, env, asyncTaskManager, packager) {
        const dmgPropertiesFile = yield packager.getTempFile("dmgProperties.pl");
        asyncTaskManager.addTask((0, (_fsExtraP || _load_fsExtraP()).outputFile)(dmgPropertiesFile, (yield (0, (_fsExtraP || _load_fsExtraP()).readFile)(_path.join(getDmgTemplatePath(), "dmgProperties.pl"), "utf-8")).replace("$ENTRIES", entries)));
        yield asyncTaskManager.awaitTasks();
        yield (0, (_builderUtil || _load_builderUtil()).exec)("/usr/bin/perl", [dmgPropertiesFile], {
            cwd: getDmgVendorPath(),
            env
        });
    });

    return function applyProperties(_x6, _x7, _x8, _x9) {
        return _ref4.apply(this, arguments);
    };
})();
/** @internal */


exports.getDmgTemplatePath = getDmgTemplatePath;
exports.getDmgVendorPath = getDmgVendorPath;
exports.computeBackgroundColor = computeBackgroundColor;
exports.serializeString = serializeString;

var _builderUtil;

function _load_builderUtil() {
    return _builderUtil = require("builder-util");
}

var _promise;

function _load_promise() {
    return _promise = require("builder-util/out/promise");
}

var _fsExtraP;

function _load_fsExtraP() {
    return _fsExtraP = require("fs-extra-p");
}

var _path = _interopRequireWildcard(require("path"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const root = _path.join(__dirname, "..");
function getDmgTemplatePath() {
    return _path.join(root, "templates");
}
function getDmgVendorPath() {
    return _path.join(root, "vendor");
}
function computeBackgroundColor(rawValue) {
    return require("parse-color")(rawValue).hex;
}
function serializeString(data) {
    return '  $"' + data.match(/.{1,32}/g).map(it => it.match(/.{1,4}/g).join(" ")).join('"\n  $"') + '"';
}
//# sourceMappingURL=dmgUtil.js.map