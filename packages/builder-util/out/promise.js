"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.NestedError = exports.executeFinally = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

// you don't need to handle error in your task - it is passed only indicate status of promise
let executeFinally = exports.executeFinally = (() => {
    var _ref = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (promise, task) {
        let result = null;
        try {
            result = yield promise;
        } catch (originalError) {
            try {
                yield task(true);
            } catch (taskError) {
                throw new NestedError([originalError, taskError]);
            }
            throw originalError;
        }
        try {
            yield task(false);
        } catch (taskError) {
            throw taskError;
        }
        return result;
    });

    return function executeFinally(_x, _x2) {
        return _ref.apply(this, arguments);
    };
})();

exports.printErrorAndExit = printErrorAndExit;
exports.orNullIfFileNotExist = orNullIfFileNotExist;
exports.orIfFileNotExist = orIfFileNotExist;

var _chalk;

function _load_chalk() {
    return _chalk = require("chalk");
}

function printErrorAndExit(error) {
    console.error((0, (_chalk || _load_chalk()).red)((error.stack || error).toString()));
    process.exit(-1);
}class NestedError extends Error {
    constructor(errors) {
        let message = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "Compound error: ";

        let m = message;
        let i = 1;
        for (const error of errors) {
            const prefix = `Error #${i++} `;
            m += "\n\n" + prefix + "-".repeat(80) + "\n" + error.stack;
        }
        super(m);
    }
}
exports.NestedError = NestedError;
function orNullIfFileNotExist(promise) {
    return orIfFileNotExist(promise, null);
}
function orIfFileNotExist(promise, fallbackValue) {
    return promise.catch(e => {
        if (e.code === "ENOENT" || e.code === "ENOTDIR") {
            return fallbackValue;
        }
        throw e;
    });
}
//# sourceMappingURL=promise.js.map