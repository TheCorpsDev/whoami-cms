import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

// In development the Laravel API sits behind the Nginx container.
const apiTarget = process.env.VITE_API_PROXY ?? 'http://localhost:8080'

/**
 * Name and meta tags of the site. Set the VITE_SITE_* variables (see
 * .env.example) in the environment or in a .env file before building; the
 * defaults below belong to the demo profile.
 */
function siteSettings(env: Record<string, string>) {
  return {
    name: env.VITE_SITE_NAME || 'Alex Rossi',
    tagline: env.VITE_SITE_TAGLINE || 'Backend Developer',
    description: env.VITE_SITE_DESCRIPTION || 'Personal portfolio: projects, experience and contacts.',
    shortName: env.VITE_SITE_SHORT_NAME || 'Alex R.',
    initials: env.VITE_SITE_INITIALS || 'AR',
    themeColor: '#0E1018',
  }
}

type Site = ReturnType<typeof siteSettings>

const manifest = (site: Site) => JSON.stringify({
  name: `${site.name} — ${site.tagline}`,
  short_name: site.shortName,
  description: site.description,
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: site.themeColor,
  theme_color: site.themeColor,
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2)

/** Fills the %SITE_*% tokens of index.html and serves/emits the web manifest. */
function sitePlugin(site: Site): Plugin {
  const tokens: Record<string, string> = {
    SITE_NAME: site.name,
    SITE_TITLE: `${site.name} — ${site.tagline}`,
    SITE_DESCRIPTION: site.description,
    SITE_SHORT_NAME: site.shortName,
    SITE_THEME_COLOR: site.themeColor,
  }
  const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

  return {
    name: 'site-settings',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replace(/%(SITE_[A-Z_]+)%/g, (token, key: string) => (key in tokens ? escape(tokens[key]) : token)),
    },
    configureServer(server) {
      server.middlewares.use('/manifest.webmanifest', (_req, res) => {
        res.setHeader('Content-Type', 'application/manifest+json')
        res.end(manifest(site))
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: manifest(site) })
    },
  }
}

export default defineConfig(({ mode }) => {
  const site = siteSettings({ ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env } as Record<string, string>)

  return {
    plugins: [react(), sitePlugin(site)],
    define: { __SITE__: JSON.stringify(site) },
    server: {
      proxy: {
        '/api': { target: apiTarget, changeOrigin: false },
        '/storage': { target: apiTarget, changeOrigin: false },
      },
    },
  }
})
