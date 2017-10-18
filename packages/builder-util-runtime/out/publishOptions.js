"use strict";
/** @private */

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.githubUrl = githubUrl;
exports.getS3LikeProviderBaseUrl = getS3LikeProviderBaseUrl;
function githubUrl(options) {
    let defaultHost = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "github.com";

    return `${options.protocol || "https"}://${options.host || defaultHost}`;
}
function getS3LikeProviderBaseUrl(configuration) {
    const provider = configuration.provider;
    if (provider === "s3") {
        return s3Url(configuration);
    }
    if (provider === "spaces") {
        return spacesUrl(configuration);
    }
    throw new Error(`Not supported provider: ${provider}`);
}
function s3Url(options) {
    let url;
    if (!(options.bucket.indexOf(".") !== -1)) {
        if (options.region === "cn-north-1") {
            url = `https://${options.bucket}.s3.${options.region}.amazonaws.com.cn`;
        } else {
            url = `https://${options.bucket}.s3.amazonaws.com`;
        }
    } else {
        if (options.region == null) {
            throw new Error(`Bucket name "${options.bucket}" includes a dot, but S3 region is missing`);
        }
        // special case, see http://docs.aws.amazon.com/AmazonS3/latest/dev/UsingBucket.html#access-bucket-intro
        url = options.region === "us-east-1" ? `https://s3.amazonaws.com/${options.bucket}` : `https://s3-${options.region}.amazonaws.com/${options.bucket}`;
    }
    if (options.path != null) {
        url += `/${options.path}`;
    }
    return url;
}
function spacesUrl(options) {
    if (options.name == null) {
        throw new Error(`name is missing`);
    }
    if (options.region == null) {
        throw new Error(`region is missing`);
    }
    let url = `https://${options.name}.${options.region}.digitaloceanspaces.com`;
    if (options.path != null) {
        url += `/${options.path}`;
    }
    return url;
}
//# sourceMappingURL=publishOptions.js.map