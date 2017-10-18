import BluebirdPromise from "bluebird-lst";
export declare class DebugLogger {
    readonly enabled: boolean;
    readonly data: any;
    constructor(enabled?: boolean);
    add(key: string, value: any): void;
    save(file: string): Promise<void> | BluebirdPromise<void>;
}
