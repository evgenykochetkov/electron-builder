import { ClientConfiguration, CreateMultipartUploadRequest } from "aws-sdk/clients/s3";
import { Arch } from "builder-util";
import { BaseS3Options } from "builder-util-runtime";
import { PublishContext, Publisher } from "electron-publish";
export declare abstract class BaseS3Publisher extends Publisher {
    private options;
    constructor(context: PublishContext, options: BaseS3Options);
    protected abstract getBucketName(): string;
    protected configureS3Options(s3Options: CreateMultipartUploadRequest): void;
    protected createClientConfiguration(): ClientConfiguration;
    upload(file: string, arch: Arch, safeArtifactName?: string): Promise<any>;
    toString(): string;
}
