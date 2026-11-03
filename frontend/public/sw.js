/*
 * Service worker of the portfolio. The public site keeps working offline with
 * the last content seen; the admin and its API always go to the network.
 */
const VERSION = 'v2'
const SHELL = `shell-${VERSION}`
const RUNTIME = `runtime-${VERSION}`
const PRECACHE = ['/', '/manifest.webmanifest', '/favicon.svg', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== SHELL && key !== RUNTIME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    // The shell key '/' only ever holds an HTML page, never JSON or a download.
    const cacheable = fallbackUrl === undefined || (response.headers.get('content-type') ?? '').startsWith('text/html')
    if (response.ok && cacheable) cache.put(fallbackUrl ?? request, response.clone())
    return response
  } catch (error) {
    const cached = await cache.match(fallbackUrl ?? request)
    if (cached) return cached
    throw error
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) (await caches.open(RUNTIME)).put(request, response.clone())
  return response
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME)
  const cached = await cache.match(request)
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone())
      // A file the server no longer has (a deleted CV or photo) must not stay readable.
      else if (response.status === 404 || response.status === 410) cache.delete(request)
      return response
    })
    .catch(() => cached)
  return cached ?? network
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Google Fonts: reuse the files once downloaded.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(request))
    return
  }
  if (url.origin !== self.location.origin) return

  // The server decodes percent-encoding (/%61pi/admin is /api/admin), URL.pathname does not:
  // compare the decoded path, and leave anything that cannot be decoded to the network.
  let path
  try {
    path = decodeURIComponent(url.pathname).replace(/\/{2,}/g, '/').toLowerCase()
  } catch {
    return
  }

  // Never cache the admin: always fresh, never readable offline.
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) return

  // Only the site is an offline page: API routes, health checks and uploads open straight from the network.
  const notAPage = path.startsWith('/api/') || path === '/healthz' || path.startsWith('/storage/')

  if (request.mode === 'navigate') {
    if (notAPage) return
    event.respondWith(networkFirst(request, SHELL, '/'))
  } else if (url.pathname.startsWith('/assets/')) {
    // Hashed file names: a file never changes once published.
    event.respondWith(cacheFirst(request))
  } else if (url.pathname === '/api/portfolio') {
    event.respondWith(networkFirst(request, RUNTIME))
  } else if (url.pathname.startsWith('/storage/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(staleWhileRevalidate(request))
  }
})
