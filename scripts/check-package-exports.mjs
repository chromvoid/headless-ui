import {access, readFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(scriptDir, '..')

async function main() {
  const rootModule = await import('@chromvoid/headless-ui')
  const buttonModule = await import('@chromvoid/headless-ui/button')
  const interactionsModule = await import('@chromvoid/headless-ui/interactions')
  const selectionModule = await import('@chromvoid/headless-ui/core/selection')

  if (typeof rootModule.createButton !== 'function') {
    throw new Error('Root export smoke failed: createButton export is missing')
  }
  if (typeof buttonModule.createButton !== 'function') {
    throw new Error('Leaf export smoke failed: createButton export is missing')
  }
  if (typeof interactionsModule.mapListboxKeyboardIntent !== 'function') {
    throw new Error('Interactions export smoke failed')
  }
  if (typeof selectionModule.toggleSelection !== 'function') {
    throw new Error('Core nested export smoke failed')
  }

  const packageJson = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8'))
  const typeTargets = [
    packageJson.exports['.'].types,
    packageJson.exports['./*'].types.replace('*', 'button'),
    packageJson.exports['./*'].types.replace('*', 'interactions'),
    packageJson.exports['./core/*'].types.replace('*', 'selection'),
  ]

  for (const target of typeTargets) {
    const fullPath = path.join(packageRoot, target)
    await access(fullPath)
    console.log(`[exports] types: ${fullPath}`)
  }

  console.log('[exports] package export smoke passed')
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
