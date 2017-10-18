/// <reference types="node" />
import { Arch } from "builder-util";
import { BintrayOptions } from "builder-util-runtime";
import { ClientRequest } from "http";
import { HttpPublisher, PublishContext, PublishOptions } from "./publisher";
export declare class BintrayPublisher extends HttpPublisher {
    private readonly version;
    private readonly options;
    private _versionPromise;
    private readonly client;
    readonly providerName: string;
    constructor(context: PublishContext, info: BintrayOptions, version: string, options?: PublishOptions);
    private init();
    protected doUpload(fileName: string, arch: Arch, dataLength: number, requestProcessor: (request: ClientRequest, reject: (error: Error) => void) => void): Promise<string | undefined>;
    deleteRelease(): Promise<any>;
    toString(): string;
}
