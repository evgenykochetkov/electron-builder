"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.buildInstaller = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

var _bluebirdLst2;

function _load_bluebirdLst2() {
    return _bluebirdLst2 = _interopRequireDefault(require("bluebird-lst"));
}

let buildInstaller = exports.buildInstaller = (() => {
    var _ref = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (options, outputDirectory, outFileNames, packager, appOutDir, outDir, arch) {
        const appUpdate = yield packager.getTempFile("Update.exe");
        yield (_bluebirdLst2 || _load_bluebirdLst2()).default.all([(0, (_fs || _load_fs()).copyFile)(_path.join(options.vendorPath, "Update.exe"), appUpdate).then(function () {
            return packager.sign(appUpdate);
        }), (_bluebirdLst2 || _load_bluebirdLst2()).default.all([(0, (_fsExtraP || _load_fsExtraP()).remove)(`${outputDirectory.replace(/\\/g, "/")}/*-full.nupkg`), (0, (_fsExtraP || _load_fsExtraP()).remove)(_path.join(outputDirectory, "RELEASES"))]).then(function () {
            return (0, (_fsExtraP || _load_fsExtraP()).ensureDir)(outputDirectory);
        })]);
        if (options.remoteReleases) {
            yield syncReleases(outputDirectory, options);
        }
        const embeddedArchiveFile = yield packager.getTempFile("setup.zip");
        const embeddedArchive = archiver("zip", { zlib: { level: options.packageCompressionLevel == null ? 6 : options.packageCompressionLevel } });
        const embeddedArchiveOut = (0, (_fsExtraP || _load_fsExtraP()).createWriteStream)(embeddedArchiveFile);
        const embeddedArchivePromise = new (_bluebirdLst2 || _load_bluebirdLst2()).default(function (resolve, reject) {
            embeddedArchive.on("error", reject);
            embeddedArchiveOut.on("close", resolve);
        });
        embeddedArchive.pipe(embeddedArchiveOut);
        embeddedArchive.file(appUpdate, { name: "Update.exe" });
        embeddedArchive.file(options.loadingGif ? _path.resolve(packager.projectDir, options.loadingGif) : _path.join(options.vendorPath, "install-spinner.gif"), { name: "background.gif" });
        const version = convertVersion(options.version);
        const nupkgPath = _path.join(outputDirectory, outFileNames.packageFile);
        const setupPath = _path.join(outputDirectory, outFileNames.setupFile);
        yield (_bluebirdLst2 || _load_bluebirdLst2()).default.all([pack(options, appOutDir, appUpdate, nupkgPath, version, packager), (0, (_fs || _load_fs()).copyFile)(_path.join(options.vendorPath, "Setup.exe"), setupPath)]);
        embeddedArchive.file(nupkgPath, { name: outFileNames.packageFile });
        const releaseEntry = yield releasify(options, nupkgPath, outputDirectory, outFileNames.packageFile);
        embeddedArchive.append(releaseEntry, { name: "RELEASES" });
        embeddedArchive.finalize();
        yield embeddedArchivePromise;
        yield (0, (_builderUtil || _load_builderUtil()).execWine)(_path.join(options.vendorPath, "WriteZipToSetup.exe"), [setupPath, embeddedArchiveFile]);
        yield packager.signAndEditResources(setupPath, arch, outDir);
        if (options.msi && process.platform === "win32") {
            const outFile = outFileNames.setupFile.replace(".exe", ".msi");
            yield msi(options, nupkgPath, setupPath, outputDirectory, outFile);
            // rcedit can only edit .exe resources
            yield packager.sign(_path.join(outputDirectory, outFile));
        }
    });

    return function buildInstaller(_x, _x2, _x3, _x4, _x5, _x6, _x7) {
        return _ref.apply(this, arguments);
    };
})();

let pack = (() => {
    var _ref2 = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (options, directory, updateFile, outFile, version, packager) {
        const archive = archiver("zip", { zlib: { level: options.packageCompressionLevel == null ? 9 : options.packageCompressionLevel } });
        const archiveOut = (0, (_fsExtraP || _load_fsExtraP()).createWriteStream)(outFile);
        const archivePromise = new (_bluebirdLst2 || _load_bluebirdLst2()).default(function (resolve, reject) {
            archive.on("error", reject);
            archiveOut.on("error", reject);
            archiveOut.on("close", resolve);
        });
        archive.pipe(archiveOut);
        const author = options.authors;
        const copyright = options.copyright || `Copyright © ${new Date().getFullYear()} ${author}`;
        const nuspecContent = `<?xml version="1.0"?>
<package xmlns="http://schemas.microsoft.com/packaging/2011/08/nuspec.xsd">
  <metadata>
    <id>${options.appId}</id>
    <version>${version}</version>
    <title>${options.productName}</title>
    <authors>${author}</authors>
    <iconUrl>${options.iconUrl}</iconUrl>
    <requireLicenseAcceptance>false</requireLicenseAcceptance>
    <description>${options.description}</description>
    <copyright>${copyright}</copyright>${options.extraMetadataSpecs || ""}
  </metadata>
</package>`;
        (0, (_builderUtil || _load_builderUtil()).debug)(`Created NuSpec file:\n${nuspecContent}`);
        archive.append(nuspecContent.replace(/\n/, "\r\n"), { name: `${encodeURI(options.name).replace(/%5B/g, "[").replace(/%5D/g, "]")}.nuspec` });
        //noinspection SpellCheckingInspection
        archive.append(`<?xml version="1.0" encoding="utf-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Type="http://schemas.microsoft.com/packaging/2010/07/manifest" Target="/${options.name}.nuspec" Id="Re0" />
  <Relationship Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="/package/services/metadata/core-properties/1.psmdcp" Id="Re1" />
</Relationships>`.replace(/\n/, "\r\n"), { name: ".rels", prefix: "_rels" });
        //noinspection SpellCheckingInspection
        archive.append(`<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="nuspec" ContentType="application/octet" />
  <Default Extension="pak" ContentType="application/octet" />
  <Default Extension="asar" ContentType="application/octet" />
  <Default Extension="bin" ContentType="application/octet" />
  <Default Extension="dll" ContentType="application/octet" />
  <Default Extension="exe" ContentType="application/octet" />
  <Default Extension="dat" ContentType="application/octet" />
  <Default Extension="psmdcp" ContentType="application/vnd.openxmlformats-package.core-properties+xml" />
  <Default Extension="diff" ContentType="application/octet" />
  <Default Extension="bsdiff" ContentType="application/octet" />
  <Default Extension="shasum" ContentType="text/plain" />
  <Default Extension="mp3" ContentType="audio/mpeg" />
  <Default Extension="node" ContentType="application/octet" />
</Types>`.replace(/\n/, "\r\n"), { name: "[Content_Types].xml" });
        archive.append(`<?xml version="1.0" encoding="utf-8"?>
<coreProperties xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xmlns="http://schemas.openxmlformats.org/package/2006/metadata/core-properties">
  <dc:creator>${author}</dc:creator>
  <dc:description>${options.description}</dc:description>
  <dc:identifier>${options.appId}</dc:identifier>
  <version>${version}</version>
  <keywords/>
  <dc:title>${options.productName}</dc:title>
  <lastModifiedBy>NuGet, Version=2.8.50926.602, Culture=neutral, PublicKeyToken=null;Microsoft Windows NT 6.2.9200.0;.NET Framework 4</lastModifiedBy>
</coreProperties>`.replace(/\n/, "\r\n"), { name: "1.psmdcp", prefix: "package/services/metadata/core-properties" });
        archive.file(updateFile, { name: "Update.exe", prefix: "lib/net45" });
        yield encodedZip(archive, directory, "lib/net45", options.vendorPath, packager);
        yield archivePromise;
    });

    return function pack(_x8, _x9, _x10, _x11, _x12, _x13) {
        return _ref2.apply(this, arguments);
    };
})();

let releasify = (() => {
    var _ref3 = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (options, nupkgPath, outputDirectory, packageName) {
        const args = ["--releasify", nupkgPath, "--releaseDir", outputDirectory];
        const out = (yield (0, (_builderUtil || _load_builderUtil()).exec)(process.platform === "win32" ? _path.join(options.vendorPath, "Update.com") : "mono", (0, (_builderUtil || _load_builderUtil()).prepareWindowsExecutableArgs)(args, _path.join(options.vendorPath, "Update-Mono.exe")))).trim();
        if ((_builderUtil || _load_builderUtil()).debug.enabled) {
            (0, (_builderUtil || _load_builderUtil()).debug)(`Squirrel output: ${out}`);
        }
        const lines = out.split("\n");
        for (let i = lines.length - 1; i > -1; i--) {
            const line = lines[i];
            if (line.indexOf(packageName) !== -1) {
                return line.trim();
            }
        }
        throw new Error(`Invalid output, cannot find last release entry, output: ${out}`);
    });

    return function releasify(_x14, _x15, _x16, _x17) {
        return _ref3.apply(this, arguments);
    };
})();

let msi = (() => {
    var _ref4 = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (options, nupkgPath, setupPath, outputDirectory, outFile) {
        const args = ["--createMsi", nupkgPath, "--bootstrapperExe", setupPath];
        yield (0, (_builderUtil || _load_builderUtil()).exec)(process.platform === "win32" ? _path.join(options.vendorPath, "Update.com") : "mono", (0, (_builderUtil || _load_builderUtil()).prepareWindowsExecutableArgs)(args, _path.join(options.vendorPath, "Update-Mono.exe")));
        //noinspection SpellCheckingInspection
        yield (0, (_builderUtil || _load_builderUtil()).exec)(_path.join(options.vendorPath, "candle.exe"), ["-nologo", "-ext", "WixNetFxExtension", "-out", "Setup.wixobj", "Setup.wxs"], {
            cwd: outputDirectory
        });
        //noinspection SpellCheckingInspection
        yield (0, (_builderUtil || _load_builderUtil()).exec)(_path.join(options.vendorPath, "light.exe"), ["-ext", "WixNetFxExtension", "-sval", "-out", outFile, "Setup.wixobj"], {
            cwd: outputDirectory
        });
        //noinspection SpellCheckingInspection
        yield (_bluebirdLst2 || _load_bluebirdLst2()).default.all([(0, (_fsExtraP || _load_fsExtraP()).unlink)(_path.join(outputDirectory, "Setup.wxs")), (0, (_fsExtraP || _load_fsExtraP()).unlink)(_path.join(outputDirectory, "Setup.wixobj")), (0, (_fsExtraP || _load_fsExtraP()).unlink)(_path.join(outputDirectory, outFile.replace(".msi", ".wixpdb"))).catch(function (e) {
            return (0, (_builderUtil || _load_builderUtil()).debug)(e.toString());
        })]);
    });

    return function msi(_x18, _x19, _x20, _x21, _x22) {
        return _ref4.apply(this, arguments);
    };
})();

let encodedZip = (() => {
    var _ref5 = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (archive, dir, prefix, vendorPath, packager) {
        yield (0, (_fs || _load_fs()).walk)(dir, null, {
            isIncludeDir: true,
            consume: (() => {
                var _ref6 = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (file, stats) {
                    if (stats.isDirectory()) {
                        return;
                    }
                    // GBK file name encoding (or Non-English file name) caused a problem
                    const relativeSafeFilePath = encodeURI(file.substring(dir.length + 1).replace(/\\/g, "/")).replace(/%5B/g, "[").replace(/%5D/g, "]");
                    archive._append(file, {
                        name: relativeSafeFilePath,
                        prefix,
                        stats
                    });
                    // createExecutableStubForExe
                    // https://github.com/Squirrel/Squirrel.Windows/pull/1051 Only generate execution stubs for the top-level executables
                    if (file.endsWith(".exe") && !(file.indexOf("squirrel.exe") !== -1) && !(relativeSafeFilePath.indexOf("/") !== -1)) {
                        const tempFile = yield packager.getTempFile("stub.exe");
                        yield (0, (_fs || _load_fs()).copyFile)(_path.join(vendorPath, "StubExecutable.exe"), tempFile);
                        yield (0, (_builderUtil || _load_builderUtil()).execWine)(_path.join(vendorPath, "WriteZipToSetup.exe"), ["--copy-stub-resources", file, tempFile]);
                        yield packager.sign(tempFile);
                        archive._append(tempFile, {
                            name: relativeSafeFilePath.substring(0, relativeSafeFilePath.length - 4) + "_ExecutionStub.exe",
                            prefix,
                            stats: yield (0, (_fsExtraP || _load_fsExtraP()).stat)(tempFile)
                        });
                    }
                });

                return function consume(_x28, _x29) {
                    return _ref6.apply(this, arguments);
                };
            })()
        });
        archive.finalize();
    });

    return function encodedZip(_x23, _x24, _x25, _x26, _x27) {
        return _ref5.apply(this, arguments);
    };
})();
//# sourceMappingURL=squirrelPack.js.map


exports.convertVersion = convertVersion;

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

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const archiver = require("archiver");
function convertVersion(version) {
    const parts = version.split("-");
    const mainVersion = parts.shift();
    if (parts.length > 0) {
        return [mainVersion, parts.join("-").replace(/\./g, "")].join("-");
    } else {
        return mainVersion;
    }
}
function syncReleases(outputDirectory, options) {
    (0, (_builderUtil || _load_builderUtil()).log)("Sync releases to build delta package");
    const args = (0, (_builderUtil || _load_builderUtil()).prepareWindowsExecutableArgs)(["-u", options.remoteReleases, "-r", outputDirectory], _path.join(options.vendorPath, "SyncReleases.exe"));
    if (options.remoteToken) {
        args.push("-t", options.remoteToken);
    }
    return (0, (_builderUtil || _load_builderUtil()).spawn)(process.platform === "win32" ? _path.join(options.vendorPath, "SyncReleases.exe") : "mono", args);
}