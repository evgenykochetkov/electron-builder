"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DebugLogger = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = _interopRequireDefault(require("bluebird-lst"));
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

class DebugLogger {
    constructor() {
        let enabled = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

        this.enabled = enabled;
        this.data = {};
    }
    add(key, value) {
        if (!this.enabled) {
            return;
        }
        const dataPath = key.split(".");
        let o = this.data;
        let lastName = null;
        for (const p of dataPath) {
            if (p === dataPath[dataPath.length - 1]) {
                lastName = p;
                break;
            } else {
                if (o[p] == null) {
                    o[p] = Object.create(null);
                } else if (typeof o[p] === "string") {
                    o[p] = [o[p]];
                }
                o = o[p];
            }
        }
        if (Array.isArray(o[lastName])) {
            o[lastName].push(value);
        } else {
            o[lastName] = value;
        }
    }
    save(file) {
        // toml and json doesn't correctly output multiline string as multiline
        if (this.enabled && Object.keys(this.data).length > 0) {
            return (0, (_fsExtraP || _load_fsExtraP()).outputFile)(file, (0, (_jsYaml || _load_jsYaml()).safeDump)(this.data));
        } else {
            return (_bluebirdLst || _load_bluebirdLst()).default.resolve();
        }
    }
}
exports.DebugLogger = DebugLogger; //# sourceMappingURL=DebugLogger.js.map