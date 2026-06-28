import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const versionPath = join(__dirname, 'src', 'lib', 'version.js')

const content = readFileSync(versionPath, 'utf-8')
const match = content.match(/'(\d+)\.(\d+)\.(\d+)'/)
if (!match) throw new Error('Versão não encontrada')

const major = parseInt(match[1])
const minor = parseInt(match[2])
const patch = parseInt(match[3]) + 1
const newVersion = `${major}.${minor}.${patch}`

const newContent = content.replace(/'[\d]+\.[\d]+\.[\d]+'/, `'${newVersion}'`)
writeFileSync(versionPath, newContent)

console.log(newVersion)
