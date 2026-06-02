// Gera deploy.zip contendo o conteúdo de dist/ pronto para upload
// no File Manager da Hostinger (extrair em public_html/).
import { createWriteStream, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { ZipArchive } from 'archiver'

const ROOT = resolve(import.meta.dirname, '..')
const DIST = resolve(ROOT, 'dist')
const OUT = resolve(ROOT, 'deploy.zip')

if (!existsSync(DIST)) {
  console.error('❌ dist/ não existe. Rode `npm run build` antes.')
  process.exit(1)
}

const output = createWriteStream(OUT)
const archive = new ZipArchive({ zlib: { level: 9 } })

output.on('close', () => {
  const mb = (archive.pointer() / 1024 / 1024).toFixed(2)
  console.log(`✅ deploy.zip criado (${mb} MB)`)
  console.log(`   Caminho: ${OUT}`)
  console.log('   No File Manager da Hostinger:')
  console.log('   1. Entre em public_html/')
  console.log('   2. Faça upload do deploy.zip')
  console.log('   3. Clique direito → Extract')
  console.log('   4. Apague o deploy.zip')
})

archive.on('error', err => { throw err })
archive.pipe(output)
archive.directory(DIST, false)
archive.finalize()
