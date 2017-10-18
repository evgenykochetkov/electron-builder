/// <reference types="debug" />
import { PackageBuilder } from "builder-util/out/api";
import _debug from "debug";
export declare const debug: _debug.IDebugger;
export declare function addLicenseToDmg(packager: PackageBuilder, dmgPath: string): Promise<void>;
