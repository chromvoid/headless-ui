import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {build} from 'esbuild'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(scriptDir, '..')
const tmpRoot = await mkdtemp(path.join(os.tmpdir(), 'headless-bundle-contract-'))

const rootEntry = path.join(tmpRoot, 'root-entry.js')
const leafEntry = path.join(tmpRoot, 'leaf-entry.js')
const rootOut = path.join(tmpRoot, 'root-out')
const leafOut = path.join(tmpRoot, 'leaf-out')
const rootImportPath = path.join(packageRoot, 'dist', 'index.js').replaceAll(path.sep, '/')
const leafImportPath = path.join(packageRoot, 'dist', 'button', 'index.js').replaceAll(path.sep, '/')
const unrelatedMarkers = ['treegrid', 'date-picker', 'command-palette', 'window-splitter', 'tooltip']

async function bundle(entryFile, outdir) {
  await mkdir(outdir, {recursive: true})
  const outfile = path.join(outdir, path.basename(entryFile))

  await build({
    absWorkingDir: packageRoot,
    bundle: true,
    entryPoints: [entryFile],
    format: 'esm',
    minify: true,
    outfile,
    platform: 'browser',
    target: 'es2022',
    treeShaking: true,
    write: true,
  })

  return readFile(outfile, 'utf8')
}

await writeFile(
  rootEntry,
  `import {createButton} from '${rootImportPath}';\nconsole.log(createButton().contracts.getButtonProps().role)\n`,
)
await writeFile(
  leafEntry,
  `import {createButton} from '${leafImportPath}';\nconsole.log(createButton().contracts.getButtonProps().role)\n`,
)

try {
  const rootBundle = await bundle(rootEntry, rootOut)
  const leafBundle = await bundle(leafEntry, leafOut)

  for (const marker of unrelatedMarkers) {
    if (rootBundle.includes(marker)) {
      throw new Error(`Root bundle pulled unrelated marker: ${marker}`)
    }
    if (leafBundle.includes(marker)) {
      throw new Error(`Leaf bundle pulled unrelated marker: ${marker}`)
    }
  }

  if (!rootBundle.includes('button') || !leafBundle.includes('button')) {
    throw new Error('Expected button marker to stay in the bundled outputs')
  }

  console.log('[bundle] bundle contract passed')
} finally {
  await rm(tmpRoot, {recursive: true, force: true})
}
