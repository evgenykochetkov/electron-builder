/// <reference types="node" />
import { EventEmitter } from "events";
import { OutgoingHttpHeaders, RequestOptions } from "http";
import { Transform } from "stream";
import { CancellationToken } from "./CancellationToken";
import { ProgressInfo } from "./ProgressCallbackTransform";
export interface RequestHeaders extends OutgoingHttpHeaders {
    [key: string]: string;
}
export interface Response extends EventEmitter {
    statusCode?: number;
    statusMessage?: string;
    headers: any;
    setEncoding(encoding: string): void;
}
export interface DownloadOptions {
    readonly headers?: OutgoingHttpHeaders | null;
    readonly skipDirCreation?: boolean;
    readonly sha2?: string | null;
    readonly sha512?: string | null;
    readonly cancellationToken: CancellationToken;
    onProgress?(progress: ProgressInfo): void;
}
export declare class HttpError extends Error {
    readonly response: {
        statusMessage?: string | undefined;
        statusCode?: number | undefined;
        headers?: {
            [key: string]: Array<string>;
        } | undefined;
    };
    description: any | null;
    constructor(response: {
        statusMessage?: string | undefined;
        statusCode?: number | undefined;
        headers?: {
            [key: string]: Array<string>;
        } | undefined;
    }, description?: any | null);
}
export declare function parseJson(result: Promise<string | null>): Promise<any>;
export declare abstract class HttpExecutor<REQUEST> {
    protected readonly maxRedirects: number;
    request(options: RequestOptions, cancellationToken?: CancellationToken, data?: {
        [name: string]: any;
    } | null): Promise<string | null>;
    doApiRequest(options: RequestOptions, cancellationToken: CancellationToken, requestProcessor: (request: REQUEST, reject: (error: Error) => void) => void, redirectCount?: number): Promise<string>;
    addErrorAndTimeoutHandlers(request: any, reject: (error?: Error | null) => void): void;
    protected handleResponse(response: Response, options: RequestOptions, cancellationToken: CancellationToken, resolve: (data?: any) => void, reject: (error: Error) => void, redirectCount: number, requestProcessor: (request: REQUEST, reject: (error: Error) => void) => void): void;
    abstract doRequest(options: any, callback: (response: any) => void): any;
    protected doDownload(requestOptions: any, destination: string, redirectCount: number, options: DownloadOptions, callback: (error: Error | null) => void, onCancel: (callback: () => void) => void): void;
    protected addTimeOutHandler(request: any, callback: (error: Error) => void): void;
}
export declare function configureRequestOptionsFromUrl(url: string, options: RequestOptions): RequestOptions;
export declare class DigestTransform extends Transform {
    readonly expected: string;
    private readonly algorithm;
    private readonly encoding;
    private readonly digester;
    private _actual;
    readonly actual: string;
    isValidateOnEnd: boolean;
    constructor(expected: string, algorithm?: string, encoding?: "hex" | "base64" | "latin1");
    _transform(chunk: any, encoding: string, callback: any): void;
    _flush(callback: any): void;
    validate(): null;
}
export declare function safeGetHeader(response: any, headerKey: string): any;
export declare function configureRequestOptions(options: RequestOptions, token?: string | null, method?: "GET" | "DELETE" | "PUT"): RequestOptions;
export declare function safeStringifyJson(data: any, skippedNames?: Set<string>): string;
