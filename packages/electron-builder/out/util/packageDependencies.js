"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getProductionDependencies = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

var _bluebirdLst2;

function _load_bluebirdLst2() {
    return _bluebirdLst2 = _interopRequireDefault(require("bluebird-lst"));
}

/** @internal */
let getProductionDependencies = exports.getProductionDependencies = (() => {
    var _ref = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (folder) {
        const sorted = [];
        computeSortedPaths((yield computeDependencies(folder)), sorted, false);
        return uniqDeps(sorted);
    });

    return function getProductionDependencies(_x) {
        return _ref.apply(this, arguments);
    };
})();

let computeDependencies = (() => {
    var _ref2 = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (folder) {
        const pathToDep = new Map();
        const obj = yield readJson(_path.join(folder, "package.json"));
        yield _readInstalled(folder, obj, null, null, 0, pathToDep);
        unmarkExtraneous(obj, false, true);
        return obj;
    });

    return function computeDependencies(_x2) {
        return _ref2.apply(this, arguments);
    };
})();

let _readInstalled = (() => {
    var _ref3 = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (dir, obj, parent, name, depth, pathToMetadata) {
        obj.realName = name || obj.name;
        obj.directDependencyNames = obj.dependencies == null ? null : Object.keys(obj.dependencies);
        // Mark as extraneous at this point.
        // This will be un-marked in unmarkExtraneous, where we mark as not-extraneous everything that is required in some way from the root object.
        obj.extraneous = true;
        obj.optional = true;
        if (parent != null) {
            if (obj.link == null) {
                obj.parent = parent;
            }
            // do not add root project to result
            pathToMetadata.set(dir, obj);
        }
        if (obj.dependencies == null && obj.optionalDependencies == null) {
            // package has only dev or peer dependencies
            obj.dependencies = null;
            return;
        }
        const dependencyNames = Object.keys(obj.dependencies || {}).concat(Object.keys(obj.optionalDependencies || {}));
        const childModules = dependencyNames.filter(function (it) {
            return !knownAlwaysIgnoredDevDeps.has(it);
        });
        if (childModules.length === 0) {
            obj.dependencies = null;
            return;
        }
        const deps = yield (_bluebirdLst2 || _load_bluebirdLst2()).default.map(childModules, function (it) {
            return readChildPackage(it, dir, obj, depth, pathToMetadata);
        }, (_fs || _load_fs()).CONCURRENCY);
        const nameToMetadata = new Map();
        for (const dep of deps) {
            if (dep != null) {
                nameToMetadata.set(dep.realName, dep);
            }
        }
        obj.dependencies = nameToMetadata;
    });

    return function _readInstalled(_x3, _x4, _x5, _x6, _x7, _x8) {
        return _ref3.apply(this, arguments);
    };
})();

let findPackage = (() => {
    var _ref4 = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (dir, packageName) {
        const rawDir = _path.join(dir, "node_modules", packageName);
        try {
            const stat = yield (0, (_fsExtraP || _load_fsExtraP()).lstat)(rawDir);
            return { stat, rawDir };
        } catch (e) {
            if (isRootDir(dir)) {
                throw new Error(`can't find package ${packageName}`);
            }
            return yield findPackage(_path.join(dir, '..'), packageName);
        }
    });

    return function findPackage(_x9, _x10) {
        return _ref4.apply(this, arguments);
    };
})();

let readChildPackage = (() => {
    var _ref5 = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (name, parentDir, parent, parentDepth, pathToMetadata) {
        var _ref6 = yield findPackage(parentDir, name);

        const rawDir = _ref6.rawDir,
              stat = _ref6.stat;

        let dir = rawDir;
        const isSymbolicLink = stat.isSymbolicLink();
        if (isSymbolicLink) {
            dir = yield (0, (_promise || _load_promise()).orNullIfFileNotExist)((0, (_fsExtraP || _load_fsExtraP()).realpath)(dir));
            if (dir == null) {
                (0, (_builderUtil || _load_builderUtil()).debug)(`Broken symlink ${rawDir}`);
                return null;
            }
        }
        const processed = pathToMetadata.get(dir);
        if (processed != null) {
            return processed;
        }
        const metadata = yield (0, (_promise || _load_promise()).orNullIfFileNotExist)(readJson(_path.join(dir, "package.json")));
        if (metadata == null) {
            return null;
        }
        if (isSymbolicLink) {
            metadata.link = dir;
            metadata.stat = stat;
        }
        metadata.path = rawDir;
        yield _readInstalled(dir, metadata, parent, name, parentDepth + 1, pathToMetadata);
        return metadata;
    });

    return function readChildPackage(_x11, _x12, _x13, _x14, _x15) {
        return _ref5.apply(this, arguments);
    };
})();

exports.createLazyProductionDeps = createLazyProductionDeps;

var _builderUtil;

function _load_builderUtil() {
    return _builderUtil = require("builder-util");
}

var _fs;

function _load_fs() {
    return _fs = require("builder-util/out/fs");
}

var _promise;

function _load_promise() {
    return _promise = require("builder-util/out/promise");
}

var _fsExtraP;

function _load_fsExtraP() {
    return _fsExtraP = require("fs-extra-p");
}

var _lazyVal;

function _load_lazyVal() {
    return _lazyVal = require("lazy-val");
}

var _path = _interopRequireWildcard(require("path"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const knownAlwaysIgnoredDevDeps = new Set(["electron-builder-tslint-config", "electron-download", "electron-forge", "electron-packager", "electron-compilers", "jest", "jest-cli", "prebuild-install", "nan", "electron-webpack", "electron-webpack-ts", "electron-webpack-vue", "react-scripts"]);
if (process.env.ALLOW_ELECTRON_BUILDER_AS_PRODUCTION_DEPENDENCY !== "true") {
    knownAlwaysIgnoredDevDeps.add("electron-builder");
    knownAlwaysIgnoredDevDeps.add("builder-util");
    knownAlwaysIgnoredDevDeps.add("electron-publish");
    knownAlwaysIgnoredDevDeps.add("electron-download-tf");
}
function createLazyProductionDeps(projectDir) {
    return new (_lazyVal || _load_lazyVal()).Lazy(() => getProductionDependencies(projectDir));
}
function uniqDeps(deps) {
    const occured = new Map();
    return deps.filter(dep => {
        if (occured.has(dep.path)) {
            return false;
        } else {
            occured.set(dep.path, true);
            return true;
        }
    });
}
function readJson(file) {
    return (0, (_fsExtraP || _load_fsExtraP()).readFile)(file, "utf-8").then(it => JSON.parse(it, (key, value) => key === "description" || key === "author" || key === "scripts" || key === "maintainers" || key === "keywords" || key === "devDependencies" ? undefined : value));
}
function computeSortedPaths(parent, result, isExtraneous) {
    const dependencies = parent.dependencies;
    if (dependencies == null) {
        return;
    }
    for (const dep of dependencies.values()) {
        if (dep.extraneous === isExtraneous) {
            result.push(dep);
            computeSortedPaths(dep, result, isExtraneous);
        }
    }
}

function isRootDir(dir) {
    const parsed = _path.parse(dir);
    return parsed.root === dir;
}

function unmark(deps, obj, dev, unsetOptional) {
    for (const name of deps) {
        const dep = findDep(obj, name);
        if (dep != null) {
            if (unsetOptional) {
                dep.optional = false;
            }
            if (dep.extraneous) {
                unmarkExtraneous(dep, dev, false);
            }
        }
    }
}
function unmarkExtraneous(obj, isDev, isRoot) {
    // Mark all non-required deps as extraneous.
    // start from the root object and mark as non-extraneous all modules
    // that haven't been previously flagged as extraneous then propagate to all their dependencies
    obj.extraneous = false;
    if (obj.directDependencyNames != null) {
        unmark(obj.directDependencyNames, obj, isDev, true);
    }
    if (isDev && obj.devDependencies != null && (isRoot || obj.link)) {
        unmark(Object.keys(obj.devDependencies), obj, isDev, true);
    }
    if (obj.peerDependencies != null) {
        unmark(Object.keys(obj.peerDependencies), obj, isDev, true);
    }
    if (obj.optionalDependencies != null) {
        unmark(Object.keys(obj.optionalDependencies), obj, isDev, false);
    }
}
// find the one that will actually be loaded by require() so we can make sure it's valid
function findDep(obj, name) {
    if (knownAlwaysIgnoredDevDeps.has(name)) {
        return null;
    }
    let r = obj;
    let found = null;
    while (r != null && found == null) {
        // if r is a valid choice, then use that.
        // kinda weird if a pkg depends on itself, but after the first iteration of this loop, it indicates a dep cycle.
        found = r.dependencies == null ? null : r.dependencies.get(name);
        if (found == null && r.realName === name) {
            found = r;
        }
        r = r.link == null ? r.parent : null;
    }
    return found;
}
//# sourceMappingURL=packageDependencies.js.map