"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.checkFileInArchive = exports.AsarPackager = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

var _bluebirdLst2;

function _load_bluebirdLst2() {
    return _bluebirdLst2 = _interopRequireDefault(require("bluebird-lst"));
}

/** @internal */
let checkFileInArchive = exports.checkFileInArchive = (() => {
    var _ref2 = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (asarFile, relativeFile, messagePrefix) {
        function error(text) {
            return new Error(`${messagePrefix} "${relativeFile}" in the "${asarFile}" ${text}`);
        }
        let fs;
        try {
            fs = yield (0, (_asar || _load_asar()).readAsar)(asarFile);
        } catch (e) {
            throw error(`is corrupted: ${e}`);
        }
        let stat;
        try {
            stat = fs.getFile(relativeFile);
        } catch (e) {
            const fileStat = yield (0, (_fs || _load_fs()).statOrNull)(asarFile);
            if (fileStat == null) {
                throw error(`does not exist. Seems like a wrong configuration.`);
            }
            // asar throws error on access to undefined object (info.link)
            stat = null;
        }
        if (stat == null) {
            throw error(`does not exist. Seems like a wrong configuration.`);
        }
        if (stat.size === 0) {
            throw error(`is corrupted: size 0`);
        }
    });

    return function checkFileInArchive(_x3, _x4, _x5) {
        return _ref2.apply(this, arguments);
    };
})();

let detectUnpackedDirs = (() => {
    var _ref3 = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (fileSet, autoUnpackDirs, unpackedDest, rootForAppFilesWithoutAsar) {
        const dirToCreate = new Map();
        const metadata = fileSet.metadata;
        function addParents(child, root) {
            child = _path.dirname(child);
            if (autoUnpackDirs.has(child)) {
                return;
            }
            do {
                autoUnpackDirs.add(child);
                const p = _path.dirname(child);
                // create parent dir to be able to copy file later without directory existence check
                addValue(dirToCreate, p, _path.basename(child));
                if (child === root || p === root || autoUnpackDirs.has(p)) {
                    break;
                }
                child = p;
            } while (true);
            autoUnpackDirs.add(root);
        }
        for (let i = 0, n = fileSet.files.length; i < n; i++) {
            const file = fileSet.files[i];
            const index = file.lastIndexOf((_AppFileCopierHelper || _load_AppFileCopierHelper()).NODE_MODULES_PATTERN);
            if (index < 0) {
                continue;
            }
            let nextSlashIndex = file.indexOf(_path.sep, index + (_AppFileCopierHelper || _load_AppFileCopierHelper()).NODE_MODULES_PATTERN.length + 1);
            if (nextSlashIndex < 0) {
                continue;
            }
            if (file[index + (_AppFileCopierHelper || _load_AppFileCopierHelper()).NODE_MODULES_PATTERN.length] === "@") {
                nextSlashIndex = file.indexOf(_path.sep, nextSlashIndex + 1);
            }
            if (!metadata.get(file).isFile()) {
                continue;
            }
            const packageDir = file.substring(0, nextSlashIndex);
            const packageDirPathInArchive = _path.relative(rootForAppFilesWithoutAsar, (0, (_appFileCopier || _load_appFileCopier()).getDestinationPath)(packageDir, fileSet));
            // TODO: normalize path here too?
            const pathInArchive = _path.relative(rootForAppFilesWithoutAsar, (0, (_appFileCopier || _load_appFileCopier()).getDestinationPath)(file, fileSet));
            if (autoUnpackDirs.has(packageDirPathInArchive)) {
                // if package dir is unpacked, any file also unpacked
                addParents(pathInArchive, packageDirPathInArchive);
                continue;
            }
            let shouldUnpack = false;
            if (file.endsWith(".dll") || file.endsWith(".exe")) {
                shouldUnpack = true;
            } else if (!(file.indexOf(".", nextSlashIndex) !== -1) && _path.extname(file) === "") {
                shouldUnpack = yield isBinaryFile(file);
            }
            if (!shouldUnpack) {
                continue;
            }
            if ((_builderUtil || _load_builderUtil()).debug.enabled) {
                (0, (_builderUtil || _load_builderUtil()).debug)(`${pathInArchive} is not packed into asar archive - contains executable code`);
            }
            addParents(pathInArchive, packageDirPathInArchive);
        }
        if (dirToCreate.size > 0) {
            yield (0, (_fsExtraP || _load_fsExtraP()).ensureDir)(unpackedDest + _path.sep + "node_modules");
            // child directories should be not created asynchronously - parent directories should be created first
            yield (_bluebirdLst2 || _load_bluebirdLst2()).default.map(dirToCreate.keys(), (() => {
                var _ref4 = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (parentDir) {
                    const base = unpackedDest + _path.sep + parentDir;
                    yield (0, (_fsExtraP || _load_fsExtraP()).ensureDir)(base);
                    yield (_bluebirdLst2 || _load_bluebirdLst2()).default.each(dirToCreate.get(parentDir), function (it) {
                        if (dirToCreate.has(parentDir + _path.sep + it)) {
                            // already created
                            return null;
                        } else {
                            return (0, (_fsExtraP || _load_fsExtraP()).ensureDir)(base + _path.sep + it);
                        }
                    });
                });

                return function (_x10) {
                    return _ref4.apply(this, arguments);
                };
            })(), (_fs || _load_fs()).CONCURRENCY);
        }
    });

    return function detectUnpackedDirs(_x6, _x7, _x8, _x9) {
        return _ref3.apply(this, arguments);
    };
})();

let order = (() => {
    var _ref5 = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (filenames, orderingFile, src) {
        const orderingFiles = (yield (0, (_fsExtraP || _load_fsExtraP()).readFile)(orderingFile, "utf8")).split("\n").map(function (line) {
            if (line.indexOf(":") !== -1) {
                line = line.split(":").pop();
            }
            line = line.trim();
            if (line[0] === "/") {
                line = line.slice(1);
            }
            return line;
        });
        const ordering = [];
        for (const file of orderingFiles) {
            const pathComponents = file.split(_path.sep);
            for (const pathComponent of pathComponents) {
                ordering.push(_path.join(src, pathComponent));
            }
        }
        const sortedFiles = [];
        let missing = 0;
        const total = filenames.length;
        for (const file of ordering) {
            if (!(sortedFiles.indexOf(file) !== -1) && filenames.indexOf(file) !== -1) {
                sortedFiles.push(file);
            }
        }
        for (const file of filenames) {
            if (!(sortedFiles.indexOf(file) !== -1)) {
                sortedFiles.push(file);
                missing += 1;
            }
        }
        (0, (_builderUtil || _load_builderUtil()).log)(`Ordering file has ${(total - missing) / total * 100}% coverage.`);
        return sortedFiles;
    });

    return function order(_x11, _x12, _x13) {
        return _ref5.apply(this, arguments);
    };
})();
//# sourceMappingURL=asarUtil.js.map


exports.copyFileOrData = copyFileOrData;

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

var _asar;

function _load_asar() {
    return _asar = require("../asar");
}

var _AppFileCopierHelper;

function _load_AppFileCopierHelper() {
    return _AppFileCopierHelper = require("./AppFileCopierHelper");
}

var _appFileCopier;

function _load_appFileCopier() {
    return _appFileCopier = require("./appFileCopier");
}

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const isBinaryFile = (_bluebirdLst2 || _load_bluebirdLst2()).default.promisify(require("isbinaryfile"));
const pickle = require("chromium-pickle-js");
function addValue(map, key, value) {
    let list = map.get(key);
    if (list == null) {
        list = [value];
        map.set(key, list);
    } else {
        list.push(value);
    }
}
function copyFileOrData(fileCopier, data, source, destination, stats) {
    if (data == null) {
        return fileCopier.copy(source, destination, stats);
    } else {
        return (0, (_fsExtraP || _load_fsExtraP()).writeFile)(destination, data);
    }
}
/** @internal */
class AsarPackager {
    constructor(src, destination, options, unpackPattern) {
        this.src = src;
        this.destination = destination;
        this.options = options;
        this.unpackPattern = unpackPattern;
        this.fs = new (_asar || _load_asar()).AsarFilesystem(this.src);
        this.outFile = _path.join(destination, "app.asar");
    }
    // sort files to minimize file change (i.e. asar file is not changed dramatically on small change)
    pack(fileSets, packager) {
        var _this = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            if (_this.options.ordering != null) {
                // ordering doesn't support transformed files, but ordering is not used functionality - wait user report to fix it
                yield order(fileSets[0].files, _this.options.ordering, fileSets[0].src);
            }
            yield (0, (_fsExtraP || _load_fsExtraP()).ensureDir)(_path.dirname(_this.outFile));
            for (const fileSet of fileSets) {
                yield _this.createPackageFromFiles(fileSet, packager.info);
            }
            yield _this.writeAsarFile(fileSets);
        })();
    }
    createPackageFromFiles(fileSet, packager) {
        var _this2 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            const metadata = fileSet.metadata;
            // search auto unpacked dir
            const unpackedDirs = new Set();
            const unpackedDest = `${_this2.outFile}.unpacked`;
            const rootForAppFilesWithoutAsar = _path.join(_this2.destination, "app");
            if (_this2.options.smartUnpack !== false) {
                yield detectUnpackedDirs(fileSet, unpackedDirs, unpackedDest, rootForAppFilesWithoutAsar);
            }
            const dirToCreateForUnpackedFiles = new Set(unpackedDirs);
            const isDirNodeUnpacked = (() => {
                var _ref = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (filePathInArchive, dirNode) {
                    if (dirNode.unpacked) {
                        return;
                    }
                    if (unpackedDirs.has(filePathInArchive)) {
                        dirNode.unpacked = true;
                    } else {
                        for (const dir of unpackedDirs) {
                            if (filePathInArchive.length > dir.length + 2 && filePathInArchive[dir.length] === _path.sep && filePathInArchive.startsWith(dir)) {
                                dirNode.unpacked = true;
                                unpackedDirs.add(filePathInArchive);
                                // not all dirs marked as unpacked after first iteration - because node module dir can be marked as unpacked after processing node module dir content
                                // e.g. node-notifier/example/advanced.js processed, but only on process vendor/terminal-notifier.app module will be marked as unpacked
                                yield (0, (_fsExtraP || _load_fsExtraP()).ensureDir)(_path.join(unpackedDest, filePathInArchive));
                                break;
                            }
                        }
                    }
                });

                return function isDirNodeUnpacked(_x, _x2) {
                    return _ref.apply(this, arguments);
                };
            })();
            const transformedFiles = fileSet.transformedFiles;
            const taskManager = new (_builderUtil || _load_builderUtil()).AsyncTaskManager(packager.cancellationToken);
            const fileCopier = new (_fs || _load_fs()).FileCopier();
            let currentDirNode = null;
            let currentDirPath = null;
            for (let i = 0, n = fileSet.files.length; i < n; i++) {
                const file = fileSet.files[i];
                const stat = metadata.get(file);
                const destPath = (0, (_appFileCopier || _load_appFileCopier()).getDestinationPath)(file, fileSet);
                const pathInArchive = (0, (_AppFileCopierHelper || _load_AppFileCopierHelper()).relativeUpwardsPathToNodeModulesPath)(_path.relative(rootForAppFilesWithoutAsar, destPath));
                if (stat != null && stat.isFile()) {
                    let fileParent = _path.dirname(pathInArchive);
                    if (fileParent === ".") {
                        fileParent = "";
                    }
                    if (currentDirPath !== fileParent) {
                        currentDirPath = fileParent;
                        currentDirNode = _this2.fs.getOrCreateNode(fileParent);
                        // do not check for root
                        if (fileParent !== "") {
                            yield isDirNodeUnpacked(fileParent, currentDirNode);
                        }
                    }
                    const dirNode = currentDirNode;
                    const newData = transformedFiles == null ? null : transformedFiles[i];
                    const isUnpacked = dirNode.unpacked || _this2.unpackPattern != null && _this2.unpackPattern(file, stat);
                    _this2.fs.addFileNode(file, dirNode, newData == null ? stat.size : Buffer.byteLength(newData), isUnpacked, stat);
                    if (isUnpacked) {
                        if (newData != null) {
                            transformedFiles[i] = null;
                        }
                        if (!dirNode.unpacked && !dirToCreateForUnpackedFiles.has(fileParent)) {
                            dirToCreateForUnpackedFiles.add(fileParent);
                            yield (0, (_fsExtraP || _load_fsExtraP()).ensureDir)(_path.join(unpackedDest, fileParent));
                        }
                        const unpackedFile = _path.join(unpackedDest, pathInArchive);
                        taskManager.addTask(copyFileOrData(fileCopier, newData, file, unpackedFile, stat));
                        if (taskManager.tasks.length > (_fs || _load_fs()).MAX_FILE_REQUESTS) {
                            yield taskManager.awaitTasks();
                        }
                    } else if (newData == null) {
                        transformedFiles[i] = true;
                    }
                } else if (stat == null || stat.isDirectory()) {
                    let unpacked = false;
                    if (unpackedDirs.has(pathInArchive)) {
                        unpacked = true;
                    } else {
                        for (const dir of unpackedDirs) {
                            if (pathInArchive.length > dir.length + 2 && pathInArchive[dir.length] === _path.sep && pathInArchive.startsWith(dir)) {
                                unpacked = true;
                                unpackedDirs.add(pathInArchive);
                                // not all dirs marked as unpacked after first iteration - because node module dir can be marked as unpacked after processing node module dir content
                                // e.g. node-notifier/example/advanced.js processed, but only on process vendor/terminal-notifier.app module will be marked as unpacked
                                yield (0, (_fsExtraP || _load_fsExtraP()).ensureDir)(_path.join(unpackedDest, pathInArchive));
                                break;
                            }
                        }
                    }
                    _this2.fs.insertDirectory(pathInArchive, unpacked);
                } else if (stat.isSymbolicLink()) {
                    _this2.fs.getOrCreateNode(pathInArchive).link = stat.relativeLink;
                }
            }
            if (taskManager.tasks.length > 0) {
                yield taskManager.awaitTasks();
            }
        })();
    }
    writeAsarFile(fileSets) {
        return new (_bluebirdLst2 || _load_bluebirdLst2()).default((resolve, reject) => {
            const headerPickle = pickle.createEmpty();
            headerPickle.writeString(JSON.stringify(this.fs.header));
            const headerBuf = headerPickle.toBuffer();
            const sizePickle = pickle.createEmpty();
            sizePickle.writeUInt32(headerBuf.length);
            const sizeBuf = sizePickle.toBuffer();
            const writeStream = (0, (_fsExtraP || _load_fsExtraP()).createWriteStream)(this.outFile);
            writeStream.on("error", reject);
            writeStream.on("close", resolve);
            writeStream.write(sizeBuf);
            let fileSetIndex = 0;
            let files = fileSets[0].files;
            let metadata = fileSets[0].metadata;
            let transformedFiles = fileSets[0].transformedFiles;
            const w = index => {
                let data;
                while (true) {
                    if (index >= files.length) {
                        if (++fileSetIndex >= fileSets.length) {
                            writeStream.end();
                            return;
                        } else {
                            files = fileSets[fileSetIndex].files;
                            metadata = fileSets[fileSetIndex].metadata;
                            transformedFiles = fileSets[fileSetIndex].transformedFiles;
                            index = 0;
                        }
                    }
                    if ((data = transformedFiles[index++]) != null) {
                        break;
                    }
                }
                const file = files[index - 1];
                if (data !== true) {
                    writeStream.write(data, () => w(index));
                    return;
                }
                // https://github.com/yarnpkg/yarn/pull/3539
                const stat = metadata.get(file);
                if (stat != null && stat.size < 4 * 1024 * 1024) {
                    (0, (_fsExtraP || _load_fsExtraP()).readFile)(file).then(it => {
                        writeStream.write(it, () => w(index));
                    }).catch(reject);
                } else {
                    const readStream = (0, (_fsExtraP || _load_fsExtraP()).createReadStream)(file);
                    readStream.on("error", reject);
                    readStream.once("end", () => w(index));
                    readStream.pipe(writeStream, {
                        end: false
                    });
                }
            };
            writeStream.write(headerBuf, () => w(0));
        });
    }
}exports.AsarPackager = AsarPackager;