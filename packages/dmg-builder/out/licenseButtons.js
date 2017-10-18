"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getLicenseButtons = exports.getLicenseButtonsFile = exports.debug = undefined;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

let getLicenseButtonsFile = exports.getLicenseButtonsFile = (() => {
    var _ref = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (packager) {
        return (0, (_license || _load_license()).getLicenseAssets)((yield packager.resourceList).filter(function (it) {
            const name = it.toLowerCase();
            return name.startsWith("licenseButtons_") && (name.endsWith(".json") || name.endsWith(".yml"));
        }), packager);
    });

    return function getLicenseButtonsFile(_x) {
        return _ref.apply(this, arguments);
    };
})();

let getLicenseButtons = exports.getLicenseButtons = (() => {
    var _ref2 = (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* (licenseButtonFiles, langWithRegion, id, name) {
        let data = (0, (_licenseDefaultButtons || _load_licenseDefaultButtons()).getDefaultButtons)(langWithRegion, id, name);
        for (const item of licenseButtonFiles) {
            if (item.langWithRegion !== langWithRegion) {
                continue;
            }
            try {
                const fileData = (0, (_jsYaml || _load_jsYaml()).safeLoad)((yield (0, (_fsExtraP || _load_fsExtraP()).readFile)(item.file, "utf-8")));
                const buttonsStr = labelToHex(fileData.lang, item.lang, item.langWithRegion) + labelToHex(fileData.agree, item.lang, item.langWithRegion) + labelToHex(fileData.disagree, item.lang, item.langWithRegion) + labelToHex(fileData.print, item.lang, item.langWithRegion) + labelToHex(fileData.save, item.lang, item.langWithRegion) + labelToHex(fileData.description, item.lang, item.langWithRegion);
                data = `data 'STR#' (${id}, "${name}") {\n`;
                data += (0, (_dmgUtil || _load_dmgUtil()).serializeString)("0006" + buttonsStr);
                data += `\n};`;
                if (debug.enabled) {
                    debug(`Overwriting the ${item.langName} license buttons:\n${data}`);
                }
                return data;
            } catch (e) {
                debug(`!Error while overwriting buttons: ${e}`);
                return data;
            }
        }
        return data;
    });

    return function getLicenseButtons(_x2, _x3, _x4, _x5) {
        return _ref2.apply(this, arguments);
    };
})();

var _license;

function _load_license() {
    return _license = require("builder-util/out/license");
}

var _debug2 = _interopRequireDefault(require("debug"));

var _fsExtraP;

function _load_fsExtraP() {
    return _fsExtraP = require("fs-extra-p");
}

var _iconvLite;

function _load_iconvLite() {
    return _iconvLite = _interopRequireWildcard(require("iconv-lite"));
}

var _jsYaml;

function _load_jsYaml() {
    return _jsYaml = require("js-yaml");
}

var _dmgUtil;

function _load_dmgUtil() {
    return _dmgUtil = require("./dmgUtil");
}

var _licenseDefaultButtons;

function _load_licenseDefaultButtons() {
    return _licenseDefaultButtons = require("./licenseDefaultButtons");
}

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = exports.debug = (0, _debug2.default)("electron-builder");

function labelToHex(label, lang, langWithRegion) {
    const lbl = hexEncode(label, lang, langWithRegion).toString().toUpperCase();
    const len = numberToHex(lbl.length / 2);
    return len + lbl;
}
function numberToHex(nb) {
    return ("0" + nb.toString(16)).slice(-2);
}
function hexEncode(str, lang, langWithRegion) {
    const macCodePages = getMacCodePage(lang, langWithRegion);
    let result = "";
    for (let i = 0; i < str.length; i++) {
        try {
            let hex = getMacHexCode(str, i, macCodePages);
            if (hex === undefined) {
                hex = "3F"; //?
            }
            result += hex;
        } catch (e) {
            debug(`there was a problem while trying to convert a char (${str[i]}) to hex: ${e}`);
            result += "3F"; //?
        }
    }
    return result;
}
function getMacCodePage(lang, langWithRegion) {
    switch (lang) {
        case "ja":
            //japanese
            return ["euc-jp"]; //Apple Japanese
        case "zh":
            //chinese
            if (langWithRegion === "zh_CN") {
                return ["gb2312"]; //Apple Simplified Chinese (GB 2312)
            }
            return ["big5"]; //Apple Traditional Chinese (Big5)
        case "ko":
            //korean
            return ["euc-kr"]; //Apple Korean
        case "ar": //arabic
        case "ur":
            //urdu
            return ["macarabic"]; //Apple Arabic
        case "he":
            //hebrew
            return ["machebrew"]; //Apple Hebrew
        case "el": //greek
        case "elc":
            //greek
            return ["macgreek"]; //Apple Greek
        case "ru": //russian
        case "be": //belarussian
        case "sr": //serbian
        case "bg": //bulgarian
        case "uz":
            //uzbek
            return ["maccyrillic"]; //Apple Macintosh Cyrillic
        case "ro":
            //romanian
            return ["macromania"]; //Apple Romanian
        case "uk":
            //ukrainian
            return ["macukraine"]; //Apple Ukrainian
        case "th":
            //thai
            return ["macthai"]; //Apple Thai
        case "et": //estonian
        case "lt": //lithuanian
        case "lv": //latvian
        case "pl": //polish
        case "hu": //hungarian
        case "cs": //czech
        case "sk":
            //slovak
            return ["maccenteuro"]; //Apple Macintosh Central Europe
        case "is": //icelandic
        case "fo":
            //faroese
            return ["maciceland"]; //Apple Icelandic
        case "tr":
            //turkish
            return ["macturkish"]; //Apple Turkish
        case "hr": //croatian
        case "sl":
            //slovenian
            return ["maccroatian"]; //Apple Croatian
        default:
            return ["macroman"]; //Apple Macintosh Roman
    }
}
function getMacHexCode(str, i, macCodePages) {
    const code = str.charCodeAt(i);
    if (code < 128) {
        return code.toString(16);
    } else if (code < 256) {
        return (_iconvLite || _load_iconvLite()).encode(str[i], "macroman").toString("hex");
    } else {
        for (let i = 0; i < macCodePages.length; i++) {
            const result = (_iconvLite || _load_iconvLite()).encode(str[i], macCodePages[i]).toString("hex");
            if (result !== undefined) {
                return result;
            }
        }
    }
    return code;
}
//# sourceMappingURL=licenseButtons.js.map