import BluebirdPromise from "bluebird-lst"
import { debug } from "builder-util"
import { CONCURRENCY } from "builder-util/out/fs"
import { orNullIfFileNotExist } from "builder-util/out/promise"
import { lstat, readFile, realpath, Stats } from "fs-extra-p"
import { Lazy } from "lazy-val"
import * as path from "path"

export interface Dependency {
  name: string
  version: string
  path: string
  extraneous: boolean
  optional: boolean

  dependencies: Map<string, Dependency> | null
  directDependencyNames: string[] | null
  optionalDependencies: { [key: string]: any } | null

  realName: string
  link?: string

  parent?: Dependency

  // only if link
  stat?: Stats
}

const knownAlwaysIgnoredDevDeps = new Set([
  "electron-builder-tslint-config", "electron-download",
  "electron-forge", "electron-packager", "electron-compilers",
  "jest", "jest-cli", "prebuild-install", "nan",
  "electron-webpack", "electron-webpack-ts", "electron-webpack-vue",
  "react-scripts",
])

if (process.env.ALLOW_ELECTRON_BUILDER_AS_PRODUCTION_DEPENDENCY !== "true") {
  knownAlwaysIgnoredDevDeps.add("electron-builder")
  knownAlwaysIgnoredDevDeps.add("builder-util")
  knownAlwaysIgnoredDevDeps.add("electron-publish")
  knownAlwaysIgnoredDevDeps.add("electron-download-tf")
}

export function createLazyProductionDeps(projectDir: string) {
  return new Lazy(() => getProductionDependencies(projectDir))
}

function uniqDeps(deps: Array<Dependency>) {
  const occured = new Map();
  return deps.filter((dep) => {
    if (occured.has(dep.path)) {
      return false;
    } else {
      occured.set(dep.path, true);
      return true;
    }
  })
}

/** @internal */
export async function getProductionDependencies(folder: string): Promise<Array<Dependency>> {
  const sorted: Array<Dependency> = []
  computeSortedPaths(await computeDependencies(folder), sorted, false)
  return uniqDeps(sorted);
}

async function computeDependencies(folder: string): Promise<Dependency> {
  const pathToDep = new Map<string, Dependency>()
  const obj = await readJson(path.join(folder, "package.json"))
  await _readInstalled(folder, obj, null, null, 0, pathToDep)
  unmarkExtraneous(obj, false, true)
  return obj
}

function readJson(file: string) {
  return readFile(file, "utf-8")
    .then(it => JSON.parse(it, (key, value) => key === "description" || key === "author" || key === "scripts" || key === "maintainers" || key === "keywords" || key === "devDependencies" ? undefined : value))
}

function computeSortedPaths(parent: Dependency, result: Array<Dependency>, isExtraneous: boolean) {
  const dependencies = parent.dependencies
  if (dependencies == null) {
    return
  }

  for (const dep of dependencies.values()) {
    if (dep.extraneous === isExtraneous) {
      result.push(dep)
      computeSortedPaths(dep, result, isExtraneous)
    }
  }
}

async function _readInstalled(dir: string, obj: Dependency, parent: any | null, name: string | null, depth: number, pathToMetadata: Map<string, Dependency>): Promise<void> {
  obj.realName = name || obj.name
  obj.directDependencyNames = obj.dependencies == null ? null : Object.keys(obj.dependencies)

  // Mark as extraneous at this point.
  // This will be un-marked in unmarkExtraneous, where we mark as not-extraneous everything that is required in some way from the root object.
  obj.extraneous = true
  obj.optional = true

  if (parent != null) {
    if (obj.link == null) {
      obj.parent = parent
    }

    // do not add root project to result
    pathToMetadata.set(dir, obj)
  }

  if (obj.dependencies == null && obj.optionalDependencies == null) {
    // package has only dev or peer dependencies
    obj.dependencies = null
    return
  }

  const dependencyNames = Object.keys(obj.dependencies || {}).concat(Object.keys(obj.optionalDependencies || {}));
  const childModules: string[] = dependencyNames.filter(it => !knownAlwaysIgnoredDevDeps.has(it))
  if (childModules.length === 0) {
    obj.dependencies = null
    return
  }

  const deps = await BluebirdPromise.map(
    childModules,
    it => readChildPackage(it, dir, obj, depth, pathToMetadata),
    CONCURRENCY
  )

  const nameToMetadata = new Map<string, Dependency>()
  for (const dep of deps) {
    if (dep != null) {
      nameToMetadata.set(dep.realName, dep)
    }
  }
  obj.dependencies = nameToMetadata
}

function isRootDir (dir: string) {
  const parsed = path.parse(dir)
  return parsed.root === dir
}

async function findPackage(dir: string, packageName: string): Promise<{ rawDir: string, stat: Stats }> {
  const rawDir = path.join(dir, "node_modules", packageName)

  try {
    const stat = await lstat(rawDir)
    return { stat, rawDir }
  } catch (e) {
    if (isRootDir(dir)) {
      throw new Error(`can't find package ${packageName}`);
    }

    return await findPackage(path.join(dir, '..'), packageName);
  }
}

async function readChildPackage(name: string, parentDir: string, parent: any, parentDepth: number, pathToMetadata: Map<string, Dependency>): Promise<Dependency | null> {
  const { rawDir, stat } = await findPackage(parentDir, name);
  let dir: string | null = rawDir

  const isSymbolicLink = stat.isSymbolicLink()
  if (isSymbolicLink) {
    dir = await orNullIfFileNotExist(realpath(dir))
    if (dir == null) {
      debug(`Broken symlink ${rawDir}`)
      return null
    }
  }

  const processed = pathToMetadata.get(dir)
  if (processed != null) {
    return processed
  }

  const metadata: Dependency = await orNullIfFileNotExist(readJson(path.join(dir, "package.json")))
  if (metadata == null) {
    return null
  }

  if (isSymbolicLink) {
    metadata.link = dir
    metadata.stat = stat
  }
  metadata.path = rawDir
  await _readInstalled(dir, metadata, parent, name, parentDepth + 1, pathToMetadata)
  return metadata
}

function unmark(deps: Iterable<string>, obj: Dependency, dev: boolean, unsetOptional: boolean) {
  for (const name of deps) {
    const dep = findDep(obj, name)
    if (dep != null) {
      if (unsetOptional) {
        dep.optional = false
      }
      if (dep.extraneous) {
        unmarkExtraneous(dep, dev, false)
      }
    }
  }
}

function unmarkExtraneous(obj: any, isDev: boolean, isRoot: boolean) {
  // Mark all non-required deps as extraneous.
  // start from the root object and mark as non-extraneous all modules
  // that haven't been previously flagged as extraneous then propagate to all their dependencies

  obj.extraneous = false

  if (obj.directDependencyNames != null) {
    unmark(obj.directDependencyNames, obj, isDev, true)
  }

  if (isDev && obj.devDependencies != null && (isRoot || obj.link)) {
    unmark(Object.keys(obj.devDependencies), obj, isDev, true)
  }

  if (obj.peerDependencies != null) {
    unmark(Object.keys(obj.peerDependencies), obj, isDev, true)
  }

  if (obj.optionalDependencies != null) {
    unmark(Object.keys(obj.optionalDependencies), obj, isDev, false)
  }
}

// find the one that will actually be loaded by require() so we can make sure it's valid
function findDep(obj: Dependency, name: string) {
  if (knownAlwaysIgnoredDevDeps.has(name)) {
    return null
  }

  let r: Dependency | null | undefined = obj
  let found = null
  while (r != null && found == null) {
    // if r is a valid choice, then use that.
    // kinda weird if a pkg depends on itself, but after the first iteration of this loop, it indicates a dep cycle.
    found = r.dependencies == null ? null : r.dependencies.get(name)
    if (found == null && r.realName === name) {
      found = r
    }
    r = r.link == null ? r.parent : null
  }
  return found
}
