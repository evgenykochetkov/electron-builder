/// <reference types="node" />
import { ExecOptions, DebugLogger, ExtraSpawnOptions } from "builder-util";
import { SpawnOptions } from "child_process";
export declare function getWindowsVm(debugLogger: DebugLogger): Promise<VmManager>;
export declare class VmManager {
    readonly pathSep: string;
    exec(file: string, args: Array<string>, options?: ExecOptions, isLogOutIfDebug?: boolean): Promise<string>;
    spawn(command: string, args: Array<string>, options?: SpawnOptions, extraOptions?: ExtraSpawnOptions): Promise<any>;
    toVmFile(file: string): string;
}
export declare function macPathToParallelsWindows(file: string): string;
export interface ParallelsVm {
    id: string;
    name: string;
    os: "win-10" | "ubuntu" | "elementary";
    state: "running" | "suspended" | "stopped";
}
