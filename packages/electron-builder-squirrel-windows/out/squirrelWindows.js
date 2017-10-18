"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

var _builderUtil;

function _load_builderUtil() {
    return _builderUtil = require("builder-util");
}

var _binDownload;

function _load_binDownload() {
    return _binDownload = require("builder-util/out/binDownload");
}

var _electronBuilder;

function _load_electronBuilder() {
    return _electronBuilder = require("electron-builder");
}

var _path = _interopRequireWildcard(require("path"));

var _sanitizeFilename;

function _load_sanitizeFilename() {
    return _sanitizeFilename = _interopRequireDefault(require("sanitize-filename"));
}

var _squirrelPack;

function _load_squirrelPack() {
    return _squirrelPack = require("./squirrelPack");
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

const SW_VERSION = "1.6.0.0";
//noinspection SpellCheckingInspection
const SW_SHA2 = "ipd/ZQXyCe2+CYmNiUa9+nzVuO2PsRfF6DT8Y2mbIzkc8SVH8tJ6uS4rdhwAI1rPsYkmsPe1AcJGqv8ZDZcFww==";
class SquirrelWindowsTarget extends (_electronBuilder || _load_electronBuilder()).Target {
    constructor(packager, outDir) {
        super("squirrel");
        this.packager = packager;
        this.outDir = outDir;
        this.options = Object.assign({}, this.packager.platformSpecificBuildOptions, this.packager.config.squirrelWindows);
    }
    build(appOutDir, arch) {
        var _this = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            (0, (_builderUtil || _load_builderUtil()).log)(`Building Squirrel.Windows for arch ${(_electronBuilder || _load_electronBuilder()).Arch[arch]}`);
            if (arch === (_electronBuilder || _load_electronBuilder()).Arch.ia32) {
                (0, (_builderUtil || _load_builderUtil()).warn)("For windows consider only distributing 64-bit or use nsis target, see https://github.com/electron-userland/electron-builder/issues/359#issuecomment-214851130");
            }
            const packager = _this.packager;
            const appInfo = packager.appInfo;
            const version = appInfo.version;
            const archSuffix = (0, (_electronBuilder || _load_electronBuilder()).getArchSuffix)(arch);
            const sanitizedName = (0, (_sanitizeFilename || _load_sanitizeFilename()).default)(_this.appName);
            // tslint:disable-next-line:no-invalid-template-strings
            const setupFile = packager.expandArtifactNamePattern(_this.options, "exe", arch, "${productName} Setup ${version}.${ext}");
            const packageFile = `${sanitizedName}-${version}-full.nupkg`;
            const installerOutDir = _path.join(_this.outDir, `win${(0, (_electronBuilder || _load_electronBuilder()).getArchSuffix)(arch)}`);
            const distOptions = yield _this.computeEffectiveDistOptions();
            yield (0, (_squirrelPack || _load_squirrelPack()).buildInstaller)(distOptions, installerOutDir, { setupFile, packageFile }, packager, appOutDir, _this.outDir, arch);
            packager.dispatchArtifactCreated(_path.join(installerOutDir, setupFile), _this, arch, `${sanitizedName}-Setup-${version}${archSuffix}.exe`);
            const packagePrefix = `${_this.appName}-${(0, (_squirrelPack || _load_squirrelPack()).convertVersion)(version)}-`;
            packager.dispatchArtifactCreated(_path.join(installerOutDir, `${packagePrefix}full.nupkg`), _this, arch);
            if (distOptions.remoteReleases != null) {
                packager.dispatchArtifactCreated(_path.join(installerOutDir, `${packagePrefix}delta.nupkg`), _this, arch);
            }
            packager.dispatchArtifactCreated(_path.join(installerOutDir, "RELEASES"), _this, arch);
        })();
    }
    get appName() {
        return this.options.name || this.packager.appInfo.name;
    }
    computeEffectiveDistOptions() {
        var _this2 = this;

        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            const packager = _this2.packager;
            let iconUrl = _this2.options.iconUrl;
            if (iconUrl == null) {
                const info = yield packager.info.repositoryInfo;
                if (info != null) {
                    iconUrl = `https://github.com/${info.user}/${info.project}/blob/master/${packager.relativeBuildResourcesDirname}/icon.ico?raw=true`;
                }
                if (iconUrl == null) {
                    throw new Error("iconUrl is not specified, please see https://electron.build/configuration/configuration#WinBuildOptions-iconUrl");
                }
            }
            checkConflictingOptions(_this2.options);
            const appInfo = packager.appInfo;
            const projectUrl = yield appInfo.computePackageUrl();
            const appName = _this2.appName;
            const options = Object.assign({ name: appName, productName: _this2.options.name || appInfo.productName, appId: _this2.options.useAppIdAsId ? appInfo.id : appName, version: appInfo.version, description: appInfo.description,
                // better to explicitly set to empty string, to avoid any nugget errors
                authors: appInfo.companyName || "", iconUrl, extraMetadataSpecs: projectUrl == null ? null : `\n    <projectUrl>${projectUrl}</projectUrl>`, copyright: appInfo.copyright, packageCompressionLevel: parseInt(process.env.ELECTRON_BUILDER_COMPRESSION_LEVEL || packager.config.compression === "store" ? 0 : 9, 10), vendorPath: yield (0, (_binDownload || _load_binDownload()).getBinFromGithub)("Squirrel.Windows", SW_VERSION, SW_SHA2) }, _this2.options);
            if (options.remoteToken == null) {
                options.remoteToken = process.env.GH_TOKEN;
            }
            if (!("loadingGif" in options)) {
                const resourceList = yield packager.resourceList;
                if (resourceList.indexOf("install-spinner.gif") !== -1) {
                    options.loadingGif = _path.join(packager.buildResourcesDir, "install-spinner.gif");
                }
            }
            if (_this2.options.remoteReleases === true) {
                const info = yield packager.info.repositoryInfo;
                if (info == null) {
                    (0, (_builderUtil || _load_builderUtil()).warn)("remoteReleases set to true, but cannot get repository info");
                } else {
                    options.remoteReleases = `https://github.com/${info.user}/${info.project}`;
                    (0, (_builderUtil || _load_builderUtil()).log)(`remoteReleases is set to ${options.remoteReleases}`);
                }
            }
            return options;
        })();
    }
}
exports.default = SquirrelWindowsTarget;
function checkConflictingOptions(options) {
    for (const name of ["outputDirectory", "appDirectory", "exe", "fixUpPaths", "usePackageJson", "extraFileSpecs", "extraMetadataSpecs", "skipUpdateIcon", "setupExe"]) {
        if (name in options) {
            throw new Error(`Option ${name} is ignored, do not specify it.`);
        }
    }
    if ("noMsi" in options) {
        (0, (_builderUtil || _load_builderUtil()).warn)(`noMsi is deprecated, please specify as "msi": true if you want to create an MSI installer`);
        options.msi = !options.noMsi;
    }
    const msi = options.msi;
    if (msi != null && typeof msi !== "boolean") {
        throw new Error(`msi expected to be boolean value, but string '"${msi}"' was specified`);
    }
}
//# sourceMappingURL=squirrelWindows.js.map