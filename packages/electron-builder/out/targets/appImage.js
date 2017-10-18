"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

var _bluebirdLst2;

function _load_bluebirdLst2() {
    return _bluebirdLst2 = _interopRequireDefault(require("bluebird-lst"));
}

var _builderUtil;

function _load_builderUtil() {
    return _builderUtil = require("builder-util");
}

var _builderUtilRuntime;

function _load_builderUtilRuntime() {
    return _builderUtilRuntime = require("builder-util-runtime");
}

var _binDownload;

function _load_binDownload() {
    return _binDownload = require("builder-util/out/binDownload");
}

var _fs;

function _load_fs() {
    return _fs = require("builder-util/out/fs");
}

var _ejs;

function _load_ejs() {
    return _ejs = _interopRequireWildcard(require("ejs"));
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

var _core;

function _load_core() {
    return _core = require("../core");
}

var _pathManager;

function _load_pathManager() {
    return _pathManager = require("../util/pathManager");
}

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const appRunTemplate = new (_lazyVal || _load_lazyVal()).Lazy((0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
    return (_ejs || _load_ejs()).compile((yield (0, (_fsExtraP || _load_fsExtraP()).readFile)(_path.join((0, (_pathManager || _load_pathManager()).getTemplatePath)("linux"), "AppRun.sh"), "utf-8")));
}));
class AppImageTarget extends (_core || _load_core()).Target {
    constructor(ignored, packager, helper, outDir) {
        super("appImage");
        this.packager = packager;
        this.helper = helper;
        this.outDir = outDir;
        this.options = Object.assign({}, this.packager.platformSpecificBuildOptions, this.packager.config[this.name]);
        // we add X-AppImage-BuildId to ensure that new desktop file will be installed
        this.desktopEntry = new (_lazyVal || _load_lazyVal()).Lazy(() => helper.computeDesktopEntry(this.options, "AppRun", {
            "X-AppImage-Version": `${packager.appInfo.buildVersion}`,
            "X-AppImage-BuildId": (_builderUtilRuntime || _load_builderUtilRuntime()).UUID.v1()
        }));
    }
    build(appOutDir, arch) {
        var _this = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            (0, (_builderUtil || _load_builderUtil()).log)(`Building AppImage for arch ${(_builderUtil || _load_builderUtil()).Arch[arch]}`);
            const packager = _this.packager;
            // https://github.com/electron-userland/electron-builder/issues/775
            // https://github.com/electron-userland/electron-builder/issues/1726
            const artifactName = _this.options.artifactName == null ? packager.computeSafeArtifactName(null, "AppImage", arch, false) : packager.expandArtifactNamePattern(_this.options, "AppImage", arch);
            const resultFile = _path.join(_this.outDir, artifactName);
            // pax doesn't like dir with leading dot (e.g. `.__appimage`)
            const stageDir = _path.join(_this.outDir, `__appimage-${(_builderUtil || _load_builderUtil()).Arch[arch]}`);
            const appInStageDir = _path.join(stageDir, "app");
            yield (0, (_fsExtraP || _load_fsExtraP()).emptyDir)(stageDir);
            yield copyDirUsingHardLinks(appOutDir, appInStageDir);
            const resourceName = `appimagekit-${_this.packager.executableName}`;
            const installIcons = yield _this.copyIcons(stageDir, resourceName);
            const finalDesktopFilename = `${_this.packager.executableName}.desktop`;
            yield (_bluebirdLst2 || _load_bluebirdLst2()).default.all([(0, (_fs || _load_fs()).unlinkIfExists)(resultFile), (0, (_fsExtraP || _load_fsExtraP()).writeFile)(_path.join(stageDir, "/AppRun"), (yield appRunTemplate.value)({
                systemIntegration: _this.options.systemIntegration || "ask",
                desktopFileName: finalDesktopFilename,
                executableName: _this.packager.executableName,
                resourceName,
                installIcons
            }), {
                mode: "0755"
            }), (0, (_fsExtraP || _load_fsExtraP()).writeFile)(_path.join(stageDir, finalDesktopFilename), (yield _this.desktopEntry.value))]);
            // must be after this.helper.icons call
            if (_this.helper.maxIconPath == null) {
                throw new Error("Icon is not provided");
            }
            //noinspection SpellCheckingInspection
            const vendorDir = yield (0, (_binDownload || _load_binDownload()).getBinFromGithub)("appimage", "9.0.1", "mcme+7/krXSYb5C+6BpSt9qgajFYpn9dI1rjxzSW3YB5R/KrGYYrpZbVflEMG6pM7k9CL52poiOpGLBDG/jW3Q==");
            if (arch === (_builderUtil || _load_builderUtil()).Arch.x64 || arch === (_builderUtil || _load_builderUtil()).Arch.ia32) {
                yield (0, (_fs || _load_fs()).copyDir)(_path.join(vendorDir, "lib", arch === (_builderUtil || _load_builderUtil()).Arch.x64 ? "x86_64-linux-gnu" : "i386-linux-gnu"), _path.join(stageDir, "usr/lib"), {
                    isUseHardLink: (_fs || _load_fs()).USE_HARD_LINKS
                });
            }
            if (_this.packager.packagerOptions.effectiveOptionComputed != null && (yield _this.packager.packagerOptions.effectiveOptionComputed({ desktop: yield _this.desktopEntry.value }))) {
                return;
            }
            const vendorToolDir = _path.join(vendorDir, process.platform === "darwin" ? "darwin" : `linux-${process.arch}`);
            // default gzip compression - 51.9, xz - 50.4 difference is negligible, start time - well, it seems, a little bit longer (but on Parallels VM on external SSD disk)
            // so, to be decided later, is it worth to use xz by default
            const args = ["--runtime-file", _path.join(vendorDir, `runtime-${arch === (_builderUtil || _load_builderUtil()).Arch.ia32 ? "i686" : arch === (_builderUtil || _load_builderUtil()).Arch.x64 ? "x86_64" : "armv7l"}`)];
            if ((_builderUtil || _load_builderUtil()).debug.enabled) {
                args.push("--verbose");
            }
            args.push(stageDir, resultFile);
            yield (0, (_builderUtil || _load_builderUtil()).exec)(_path.join(vendorToolDir, "appimagetool"), args, {
                env: Object.assign({}, process.env, { PATH: `${vendorToolDir}:${process.env.PATH}`,
                    // to avoid detection by appimagetool (see extract_arch_from_text about expected arch names)
                    ARCH: arch === (_builderUtil || _load_builderUtil()).Arch.ia32 ? "i386" : arch === (_builderUtil || _load_builderUtil()).Arch.x64 ? "x86_64" : "arm" })
            });
            if (!(_builderUtil || _load_builderUtil()).debug.enabled) {
                yield (0, (_fsExtraP || _load_fsExtraP()).remove)(stageDir);
            }
            packager.dispatchArtifactCreated(resultFile, _this, arch, packager.computeSafeArtifactName(artifactName, "AppImage", arch, false));
        })();
    }
    copyIcons(stageDir, resourceName) {
        var _this2 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            const iconDirRelativePath = "usr/share/icons/hicolor";
            const iconDir = _path.join(stageDir, iconDirRelativePath);
            yield (0, (_fsExtraP || _load_fsExtraP()).ensureDir)(iconDir);
            // https://github.com/AppImage/AppImageKit/issues/438#issuecomment-319094239
            // expects icons in the /usr/share/icons/hicolor
            const iconNames = yield (_bluebirdLst2 || _load_bluebirdLst2()).default.map(_this2.helper.icons, (() => {
                var _ref2 = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (icon) {
                    const filename = `${_this2.packager.executableName}.png`;
                    const iconSizeDir = `${icon.size}x${icon.size}/apps`;
                    const dir = _path.join(iconDir, iconSizeDir);
                    yield (0, (_fsExtraP || _load_fsExtraP()).ensureDir)(dir);
                    const finalIconFile = _path.join(dir, filename);
                    yield (0, (_fs || _load_fs()).copyOrLinkFile)(icon.file, finalIconFile, null, true);
                    if (icon.file === _this2.helper.maxIconPath) {
                        yield (0, (_fsExtraP || _load_fsExtraP()).symlink)(_path.relative(stageDir, finalIconFile), _path.join(stageDir, filename));
                    }
                    return { filename, iconSizeDir, size: icon.size };
                });

                return function (_x) {
                    return _ref2.apply(this, arguments);
                };
            })());
            let installIcons = "";
            for (const icon of iconNames) {
                installIcons += `xdg-icon-resource install --noupdate --context apps --size ${icon.size} "$APPDIR/${iconDirRelativePath}/${icon.iconSizeDir}/${icon.filename}" "${resourceName}"\n`;
            }
            return installIcons;
        })();
    }
}
exports.default = AppImageTarget; // https://unix.stackexchange.com/questions/202430/how-to-copy-a-directory-recursively-using-hardlinks-for-each-file

function copyDirUsingHardLinks(source, destination) {
    if (process.platform !== "darwin") {
        const args = ["-d", "--recursive", "--preserve=mode"];
        args.push("--link");
        args.push(source + "/", destination + "/");
        return (0, (_fsExtraP || _load_fsExtraP()).ensureDir)(_path.dirname(destination)).then(() => (0, (_builderUtil || _load_builderUtil()).exec)("cp", args));
    }
    // pax requires created dir
    const promise = (0, (_fsExtraP || _load_fsExtraP()).ensureDir)(destination);
    return promise.then(() => (0, (_builderUtil || _load_builderUtil()).exec)("pax", ["-rwl", "-p", "amp" /* Do not preserve file access times, Do not preserve file modification times, Preserve the file mode	bits */, ".", destination], {
        cwd: source
    }));
}
//# sourceMappingURL=appImage.js.map