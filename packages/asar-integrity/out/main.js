"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.computeData = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

var _bluebirdLst2;

function _load_bluebirdLst2() {
    return _bluebirdLst2 = _interopRequireDefault(require("bluebird-lst"));
}

let computeData = exports.computeData = (() => {
    var _ref = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (resourcesPath, options) {
        // sort to produce constant result
        const names = (yield (0, (_fsExtraP || _load_fsExtraP()).readdir)(resourcesPath)).filter(function (it) {
            return it.endsWith(".asar");
        }).sort();
        const checksums = yield (_bluebirdLst2 || _load_bluebirdLst2()).default.map(names, function (it) {
            return hashFile(_path.join(resourcesPath, it));
        });
        const result = {};
        for (let i = 0; i < names.length; i++) {
            result[names[i]] = checksums[i];
        }
        return Object.assign({ checksums: result }, options);
    });

    return function computeData(_x, _x2) {
        return _ref.apply(this, arguments);
    };
})();

var _crypto;

function _load_crypto() {
    return _crypto = require("crypto");
}

var _fs;

function _load_fs() {
    return _fs = require("fs");
}

var _fsExtraP;

function _load_fsExtraP() {
    return _fsExtraP = require("fs-extra-p");
}

var _path = _interopRequireWildcard(require("path"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function hashFile(file) {
    let algorithm = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "sha512";
    let encoding = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "base64";

    return new (_bluebirdLst2 || _load_bluebirdLst2()).default((resolve, reject) => {
        const hash = (0, (_crypto || _load_crypto()).createHash)(algorithm);
        hash.on("error", reject).setEncoding(encoding);
        (0, (_fs || _load_fs()).createReadStream)(file).on("error", reject).on("end", () => {
            hash.end();
            resolve(hash.read());
        }).pipe(hash, { end: false });
    });
}
//# sourceMappingURL=main.js.map