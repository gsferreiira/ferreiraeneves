import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const app = express()
const PORT = process.env.PORT || 3000
const isProd = process.env.NODE_ENV === 'production'
const __dirname = dirname(fileURLToPath(import.meta.url))
const distPath = join(__dirname, 'dist')

// HTTPS redirect — Hostinger termina o TLS e repassa via X-Forwarded-Proto
if (isProd) {
  app.set('trust proxy', 1)
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`)
    }
    next()
  })
}

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://maps.google.com https://www.google.com",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  )
  if (isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  next()
})

// Sitemap dinâmico
app.get('/sitemap.xml', async (req, res) => {
  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
    )
    const origin = `${req.protocol}://${req.headers.host}`

    const [{ data: imoveis }, { data: artigos }] = await Promise.all([
      supabase.from('imoveis').select('id, created_at').eq('status', 'disponivel'),
      supabase.from('artigos').select('slug, created_at').eq('publicado', true),
    ])

    const staticUrls = ['/', '/imoveis', '/blog', '/favoritos'].map(path => `
  <url>
    <loc>${origin}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === '/' ? '1.0' : '0.8'}</priority>
  </url>`)

    const imovelUrls = (imoveis ?? []).map(i => `
  <url>
    <loc>${origin}/imoveis/${i.id}</loc>
    <lastmod>${i.created_at.slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>`)

    const artigoUrls = (artigos ?? []).map(a => `
  <url>
    <loc>${origin}/blog/${a.slug}</loc>
    <lastmod>${a.created_at.slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`)

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...imovelUrls, ...artigoUrls].join('')}
</urlset>`

    res.setHeader('Content-Type', 'application/xml')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.send(xml)
  } catch {
    res.status(500).send('Erro ao gerar sitemap')
  }
})

// Assets com hash no nome → cache de 1 ano
app.use(
  express.static(distPath, {
    maxAge: '1y',
    immutable: true,
    setHeaders: (res, filePath) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      }
    },
  }),
)

// SPA fallback — qualquer rota desconhecida devolve o index.html
app.get('*', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  res.sendFile(join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Ferreira & Neves — porta ${PORT}`)
})
