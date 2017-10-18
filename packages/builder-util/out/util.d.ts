/// <reference types="debug" />
/// <reference types="node" />
import BluebirdPromise from "bluebird-lst";
import { ChildProcess, SpawnOptions } from "child_process";
import _debug from "debug";
import "source-map-support/register";
export { safeStringifyJson } from "builder-util-runtime";
export { TmpDir } from "temp-file";
export { log, warn, task } from "./log";
export { isMacOsSierra, isCanSignDmg } from "./macosVersion";
export { execWine, prepareWindowsExecutableArgs } from "./wine";
export { Arch, toLinuxArchString, getArchSuffix, ArchType, archFromString } from "./arch";
export { AsyncTaskManager } from "./asyncTaskManager";
export { DebugLogger } from "./DebugLogger";
export { hashFile } from "./hash";
export { copyFile } from "./fs";
export declare const debug: _debug.IDebugger;
export declare const debug7z: _debug.IDebugger;
export interface BaseExecOptions {
    cwd?: string;
    env?: any;
    stdio?: any;
}
export interface ExecOptions extends BaseExecOptions {
    customFds?: any;
    encoding?: string;
    timeout?: number;
    maxBuffer?: number;
    killSignal?: string;
}
export declare function removePassword(input: string): string;
export declare function exec(file: string, args?: Array<string> | null, options?: ExecOptions, isLogOutIfDebug?: boolean): Promise<string>;
export interface ExtraSpawnOptions {
    isDebugEnabled?: boolean;
    isPipeInput?: boolean;
}
export declare function doSpawn(command: string, args: Array<string>, options?: SpawnOptions, extraOptions?: ExtraSpawnOptions): ChildProcess;
export declare function spawnAndWrite(command: string, args: Array<string>, data: string, options?: SpawnOptions, isDebugEnabled?: boolean): BluebirdPromise<any>;
export declare function spawn(command: string, args?: Array<string> | null, options?: SpawnOptions, extraOptions?: ExtraSpawnOptions): Promise<any>;
export declare function handleProcess(event: string, childProcess: ChildProcess, command: string, resolve: ((value?: any) => void) | null, reject: (reason?: any) => void): void;
export declare function use<T, R>(value: T | null, task: (it: T) => R): R | null;
export declare function debug7zArgs(command: "a" | "x"): Array<string>;
export declare function isEmptyOrSpaces(s: string | null | undefined): s is "" | null | undefined;
export declare function isTokenCharValid(token: string): boolean;
export declare function asArray<T>(v: null | undefined | T | Array<T>): Array<T>;
export declare function getCacheDirectory(): string;
export declare function smarten(s: string): string;
export declare function addValue<K, T>(map: Map<K, Array<T>>, key: K, value: T): void;
export declare function replaceDefault(inList: Array<string> | null | undefined, defaultList: Array<string>): Array<string>;
export declare function getPlatformIconFileName(value: string | null | undefined, isMac: boolean): string | null | undefined;
export declare function isPullRequest(): boolean | "" | undefined;
export declare function isEnvTrue(value: string | null | undefined): boolean;
