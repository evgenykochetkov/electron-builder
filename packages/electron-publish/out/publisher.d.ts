/// <reference types="node" />
import { Arch } from "builder-util";
import { CancellationToken } from "builder-util-runtime";
import { Stats } from "fs-extra-p";
import { ClientRequest } from "http";
import { MultiProgress } from "./multiProgress";
import { ProgressBar } from "./progress";
export declare type PublishPolicy = "onTag" | "onTagOrDraft" | "always" | "never";
export { ProgressCallback } from "./progress";
export interface PublishOptions {
    publish?: PublishPolicy | null;
}
export interface PublishContext {
    readonly cancellationToken: CancellationToken;
    readonly progress: MultiProgress | null;
}
export declare abstract class Publisher {
    protected readonly context: PublishContext;
    constructor(context: PublishContext);
    readonly abstract providerName: string;
    abstract upload(file: string, arch: Arch, safeArtifactName?: string | null): Promise<any>;
    protected createProgressBar(fileName: string, fileStat: Stats): ProgressBar | null;
    protected createReadStreamAndProgressBar(file: string, fileStat: Stats, progressBar: ProgressBar | null, reject: (error: Error) => void): NodeJS.ReadableStream;
    abstract toString(): string;
}
export declare abstract class HttpPublisher extends Publisher {
    protected readonly context: PublishContext;
    private readonly useSafeArtifactName;
    constructor(context: PublishContext, useSafeArtifactName?: boolean);
    upload(file: string, arch: Arch, safeArtifactName?: string): Promise<any>;
    uploadData(data: Buffer, arch: Arch, fileName: string): Promise<any>;
    protected abstract doUpload(fileName: string, arch: Arch, dataLength: number, requestProcessor: (request: ClientRequest, reject: (error: Error) => void) => void, file?: string): Promise<any>;
}
export declare function getCiTag(): string | null;
