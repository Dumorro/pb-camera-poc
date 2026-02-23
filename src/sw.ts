/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

const PRECACHE = 'precache-v1'
const PWA_META_CACHE = 'pwa-meta'
const MANIFEST_OVERRIDE_KEY = '/pwa-manifest-override'

const BASE_MANIFEST = {
  name: 'P&B Camera PoC',
  short_name: 'PB-Cam',
  description: 'P&B PWA camera proof-of-concept: live capture + WASM frame analysis',
  start_url: '/',
  display: 'standalone',
  orientation: 'portrait',
  theme_color: '#000000',
  background_color: '#111111',
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
}

async function serveManifest(): Promise<Response> {
  try {
    const metaCache = await caches.open(PWA_META_CACHE)
    const overrideRes = await metaCache.match(MANIFEST_OVERRIDE_KEY)
    if (!overrideRes) {
      return new Response(JSON.stringify(BASE_MANIFEST), {
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const override = (await overrideRes.json()) as {
      name?: string
      shortName?: string
      hasCustomIcon?: boolean
    }
    const manifest = {
      ...BASE_MANIFEST,
      icons: [...BASE_MANIFEST.icons],
    }
    if (override.name) {
      manifest.name = override.name
      manifest.short_name = override.shortName ?? override.name
    }
    if (override.hasCustomIcon) {
      manifest.icons = [
        { src: '/icons/custom-icon.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ]
    }
    return new Response(JSON.stringify(manifest), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify(BASE_MANIFEST), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE)
      const urls = self.__WB_MANIFEST.map((entry) => entry.url)
      await cache.addAll(urls)
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Serve dynamically composed manifest
  if (url.pathname === '/manifest.json' || url.pathname === '/manifest.webmanifest') {
    event.respondWith(serveManifest())
    return
  }

  // Serve custom icon from pwa-meta cache
  if (url.pathname === '/icons/custom-icon.png') {
    event.respondWith(
      caches
        .open(PWA_META_CACHE)
        .then((cache) => cache.match('/icons/custom-icon.png'))
        .then((res) => res ?? fetch(request)),
    )
    return
  }

  // Cache-first for OpenCV.js (one-time ~8MB download)
  if (url.pathname === '/opencv/opencv.js') {
    event.respondWith(
      caches.open('opencv-v1').then((cache) =>
        cache.match(request).then((res) => {
          if (res) return res
          return fetch(request).then((r) => {
            cache.put(request, r.clone())
            return r
          })
        }),
      ),
    )
    return
  }

  // SPA fallback for navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((res) => res ?? fetch(request)),
    )
    return
  }

  // Cache-first for all other requests
  event.respondWith(caches.match(request).then((res) => res ?? fetch(request)))
})
