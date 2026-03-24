import {existsSync} from 'node:fs'
import {readdir, readFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const packageRoot = path.resolve(__dirname, '..')
const srcRoot = path.join(packageRoot, 'src')
const scriptsRoot = path.join(packageRoot, 'scripts')

const codeExtensions = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs', '.cjs'])
const toolingFiles = [
  path.join(packageRoot, 'package.json'),
  path.join(packageRoot, '.npmrc'),
  path.join(packageRoot, 'tsconfig.json'),
  path.join(packageRoot, 'tsconfig.build.json'),
  path.join(packageRoot, 'vitest.config.ts'),
  path.join(packageRoot, '.oxlintrc.json'),
  path.join(packageRoot, '.oxfmtrc.json'),
  path.join(packageRoot, '.github', 'workflows', 'ci.yml'),
]

const forbiddenPackageSpecifiers = [
  /^@project\//,
  /^@chromvoid\/(?!headless-ui(?:\/|$))/,
  /^apps\//,
  /^packages\//,
  /^root\//,
]

const forbiddenToolingPatterns = [
  {pattern: /\.\.\/\.\.\//u, reason: 'tooling file references a path above the package root'},
  {
    pattern: /path\.(?:resolve|join)\([^)]*['"]\.\.['"]\s*,\s*['"]\.\.['"]/u,
    reason: 'tooling file resolves above the package root',
  },
  {pattern: /\bnpm run [^\n\r"]* -w /u, reason: 'workspace command is not allowed'},
  {pattern: /\bworkspace:\*/u, reason: 'workspace dependency is not allowed'},
  {pattern: /\bnpx\s+prettier\b/u, reason: 'prettier CLI is not allowed'},
  {pattern: /\bprettier\s+--/u, reason: 'prettier CLI is not allowed'},
  {pattern: /\bsetup-bun\b/u, reason: 'bun dependency is not allowed'},
  {pattern: /\bbun\s+(?:build|run|test|install|x)\b/u, reason: 'bun dependency is not allowed'},
  {pattern: /\.\.\/\.\.\/\.oxlintrc\.json/u, reason: 'tooling file references a root oxlint config'},
  {pattern: /\.\.\/\.\.\/\.prettierrc/u, reason: 'tooling file references a root prettier config'},
  {pattern: /packages\/(?!headless\b)/u, reason: 'tooling file references a monorepo package path'},
  {pattern: /apps\//u, reason: 'tooling file references a monorepo app path'},
]

const importLikeRegex =
  /(?:import|export)\s+(?:[^'"`]*?\sfrom\s*)?['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|require\s*\(\s*['"]([^'"]+)['"]\s*\)/g

const isInsidePackage = (targetPath) => {
  const normalizedRoot = path.resolve(packageRoot)
  const normalizedTarget = path.resolve(targetPath)
  return normalizedTarget === normalizedRoot || normalizedTarget.startsWith(`${normalizedRoot}${path.sep}`)
}

const walkFiles = async (dirPath) => {
  if (!existsSync(dirPath)) {
    return []
  }

  const entries = await readdir(dirPath, {withFileTypes: true})
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      const nested = await walkFiles(fullPath)
      files.push(...nested)
      continue
    }

    const ext = path.extname(entry.name)
    if (codeExtensions.has(ext)) {
      files.push(fullPath)
    }
  }

  return files
}

if (!existsSync(srcRoot)) {
  console.log('headless-boundaries: no src directory, skipping')
  process.exit(0)
}

const files = await walkFiles(srcRoot)
const scriptFiles = await walkFiles(scriptsRoot)
const violations = []

for (const filePath of files) {
  const content = await readFile(filePath, 'utf8')
  importLikeRegex.lastIndex = 0

  for (;;) {
    const match = importLikeRegex.exec(content)
    if (!match) break

    const specifier = match[1] ?? match[2] ?? match[3]
    if (!specifier) continue

    if (forbiddenPackageSpecifiers.some((rx) => rx.test(specifier))) {
      violations.push({
        filePath,
        specifier,
        reason: 'forbidden internal monorepo import alias',
      })
      continue
    }

    if (specifier.startsWith('/')) {
      violations.push({
        filePath,
        specifier,
        reason: 'absolute filesystem import is not allowed',
      })
      continue
    }

    if (!specifier.startsWith('.')) continue

    const resolvedPath = path.resolve(path.dirname(filePath), specifier)
    if (!isInsidePackage(resolvedPath)) {
      violations.push({
        filePath,
        specifier,
        reason: 'relative import escapes package boundary',
      })
    }
  }
}

for (const filePath of [...toolingFiles, ...scriptFiles]) {
  if (!existsSync(filePath)) continue

  const content = await readFile(filePath, 'utf8')

  for (const {pattern, reason} of forbiddenToolingPatterns) {
    if (!pattern.test(content)) continue

    violations.push({
      filePath,
      specifier: pattern.source,
      reason,
    })
  }
}

if (violations.length > 0) {
  console.error('headless-boundaries: FAILED')
  for (const violation of violations) {
    const relativeFilePath = path.relative(packageRoot, violation.filePath)
    console.error(`- ${relativeFilePath}: '${violation.specifier}' (${violation.reason})`)
  }
  process.exit(1)
}

console.log('headless-boundaries: OK')
