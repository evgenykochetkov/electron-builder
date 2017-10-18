"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.verifySignature = verifySignature;

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = _interopRequireDefault(require("bluebird-lst"));
}

var _builderUtilRuntime;

function _load_builderUtilRuntime() {
    return _builderUtilRuntime = require("builder-util-runtime");
}

var _child_process;

function _load_child_process() {
    return _child_process = require("child_process");
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// $certificateInfo = (Get-AuthenticodeSignature 'xxx\yyy.exe'
// | where {$_.Status.Equals([System.Management.Automation.SignatureStatus]::Valid) -and $_.SignerCertificate.Subject.Contains("CN=siemens.com")})
// | Out-String ; if ($certificateInfo) { exit 0 } else { exit 1 }
function verifySignature(publisherNames, tempUpdateFile, logger) {
    return new (_bluebirdLst || _load_bluebirdLst()).default((resolve, reject) => {
        (0, (_child_process || _load_child_process()).execFile)("powershell.exe", [`Get-AuthenticodeSignature '${tempUpdateFile}' | ConvertTo-Json -Compress`], {
            timeout: 60 * 1000
        }, (error, stdout, stderr) => {
            if (error != null || stderr) {
                try {
                    (0, (_child_process || _load_child_process()).execFileSync)("powershell.exe", ["ConvertTo-Json test"], { timeout: 10 * 1000 });
                } catch (testError) {
                    logger.warn(`Cannot execute ConvertTo-Json: ${testError.message}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
                    resolve(null);
                    return;
                }
                if (error != null) {
                    reject(error);
                    return;
                }
                if (stderr) {
                    reject(new Error(`Cannot execute Get-AuthenticodeSignature: ${stderr}`));
                    return;
                }
            }
            const data = JSON.parse(stdout);
            delete data.PrivateKey;
            delete data.IsOSBinary;
            delete data.SignatureType;
            const signerCertificate = data.SignerCertificate;
            if (signerCertificate != null) {
                delete signerCertificate.Archived;
                delete signerCertificate.Extensions;
                delete signerCertificate.Handle;
                delete signerCertificate.HasPrivateKey;
                // duplicates data.SignerCertificate (contains RawData)
                delete signerCertificate.SubjectName;
            }
            delete data.Path;
            if (data.Status === 0) {
                const name = (0, (_builderUtilRuntime || _load_builderUtilRuntime()).parseDn)(data.SignerCertificate.Subject).get("CN");
                if (publisherNames.indexOf(name) !== -1) {
                    resolve(null);
                    return;
                }
            }
            const result = JSON.stringify(data, (name, value) => name === "RawData" ? undefined : value, 2);
            logger.info(`Sign verification failed, installer signed with incorrect certificate: ${result}`);
            resolve(result);
        });
    });
}
//# sourceMappingURL=windowsExecutableCodeSignatureVerifier.js.map