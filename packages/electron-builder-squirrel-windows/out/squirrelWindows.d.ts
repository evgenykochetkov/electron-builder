import { Arch, SquirrelWindowsOptions, Target } from "electron-builder";
import { WinPackager } from "electron-builder/out/winPackager";
import { SquirrelOptions } from "./squirrelPack";
export default class SquirrelWindowsTarget extends Target {
    private readonly packager;
    readonly outDir: string;
    readonly options: SquirrelWindowsOptions;
    constructor(packager: WinPackager, outDir: string);
    build(appOutDir: string, arch: Arch): Promise<void>;
    private readonly appName;
    computeEffectiveDistOptions(): Promise<SquirrelOptions>;
}
