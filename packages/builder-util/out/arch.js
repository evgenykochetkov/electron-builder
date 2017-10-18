"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.toLinuxArchString = toLinuxArchString;
exports.getArchSuffix = getArchSuffix;
exports.archFromString = archFromString;
var Arch = exports.Arch = undefined;
(function (Arch) {
    Arch[Arch["ia32"] = 0] = "ia32";
    Arch[Arch["x64"] = 1] = "x64";
    Arch[Arch["armv7l"] = 2] = "armv7l";
})(exports.Arch = Arch = Arch || (exports.Arch = Arch = {}));
function toLinuxArchString(arch) {
    return arch === Arch.ia32 ? "i386" : arch === Arch.x64 ? "amd64" : "armv7l";
}
function getArchSuffix(arch) {
    return arch === Arch.x64 ? "" : `-${Arch[arch]}`;
}
function archFromString(name) {
    switch (name) {
        case "x64":
            return Arch.x64;
        case "ia32":
            return Arch.ia32;
        case "armv7l":
            return Arch.armv7l;
        default:
            throw new Error(`Unsupported arch ${name}`);
    }
}
//# sourceMappingURL=arch.js.map