"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _bluebirdLst;

function _load_bluebirdLst() {
    return _bluebirdLst = require("bluebird-lst");
}

var _s;

function _load_s() {
    return _s = _interopRequireDefault(require("aws-sdk/clients/s3"));
}

var _basePublisher;

function _load_basePublisher() {
    return _basePublisher = require("./basePublisher");
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class S3Publisher extends (_basePublisher || _load_basePublisher()).BaseS3Publisher {
    constructor(context, info) {
        super(context, info);
        this.info = info;
        this.providerName = "S3";
    }
    static checkAndResolveOptions(options, channelFromAppVersion) {
        return (0, (_bluebirdLst || _load_bluebirdLst()).coroutine)(function* () {
            const bucket = options.bucket;
            if (bucket == null) {
                throw new Error(`Please specify "bucket" for "s3" publish provider`);
            }
            if (bucket.indexOf(".") !== -1 && options.region == null) {
                // on dotted bucket names, we need to use a path-based endpoint URL. Path-based endpoint URLs need to include the region.
                const s3 = new (_s || _load_s()).default({ signatureVersion: "v4" });
                options.region = (yield s3.getBucketLocation({ Bucket: bucket }).promise()).LocationConstraint;
            }
            if (options.channel == null && channelFromAppVersion != null) {
                options.channel = channelFromAppVersion;
            }
        })();
    }
    getBucketName() {
        return this.info.bucket;
    }
    configureS3Options(s3Options) {
        super.configureS3Options(s3Options);
        if (this.info.storageClass != null) {
            s3Options.StorageClass = this.info.storageClass;
        }
    }
}
exports.default = S3Publisher; //# sourceMappingURL=s3Publisher.js.map