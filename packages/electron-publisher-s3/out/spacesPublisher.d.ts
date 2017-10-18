import { ClientConfiguration, CreateMultipartUploadRequest } from "aws-sdk/clients/s3";
import { SpacesOptions } from "builder-util-runtime";
import { PublishContext } from "electron-publish";
import { BaseS3Publisher } from "./basePublisher";
export default class SpacesPublisher extends BaseS3Publisher {
    private readonly info;
    readonly providerName: string;
    constructor(context: PublishContext, info: SpacesOptions);
    static checkAndResolveOptions(options: SpacesOptions, channelFromAppVersion: string | null): Promise<void>;
    protected getBucketName(): string;
    protected createClientConfiguration(): ClientConfiguration;
    protected configureS3Options(s3Options: CreateMultipartUploadRequest): void;
}
