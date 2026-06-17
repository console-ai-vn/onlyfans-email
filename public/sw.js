// ONYX Service Worker — hand-written, no Workbox
// Strategy: network-first for API, cache-first for static assets, SWR for images
const CACHE_STATIC = "onyx-static-v1"
const CACHE_IMAGES = "onyx-images-v1"
const CACHE_MAX_ITEMS = 200
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

const STATIC_PATTERNS = [/\.(js|css|woff2?|svg|ico)$/]
const IMAGE_PATTERNS = [/\.(png|jpg|jpeg|gif|webp|avif)$/, /imagedelivery\.net/]
const API_PATH = "/api/"

// ============ Install ============
self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k !== CACHE_STATIC && k !== CACHE_IMAGES)
          .map((k) => caches.delete(k))
      )
    })
  )
  self.clients.claim()
})

// ============ Helpers ============
function isStaticAsset(url) {
  return STATIC_PATTERNS.some((p) => p.test(url.pathname))
}

function isImage(url) {
  return IMAGE_PATTERNS.some((p) => p.test(url.href))
}

function isApiRequest(url) {
  return url.pathname.startsWith(API_PATH)
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const clone = response.clone()
      const cache = await caches.open(cacheName)
      cache.put(request, clone)
    }
    return response
  } catch {
    return cached || new Response("Offline", { status: 503 })
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    return response
  } catch {
    return new Response(
      `<html><body style="background:#0a1020;color:#f1f5f9;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui,sans-serif;margin:0"><div style="text-align:center"><h1 style="font-size:1.5rem">You're offline</h1><p style="color:#94a3b8">ONYX requires internet</p></div></body></html>`,
      {
        status: 503,
        headers: { "Content-Type": "text/html" },
      }
    )
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => cached)
  return cached || fetchPromise
}

// ============ Fetch ============
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle GET requests from our origin
  if (request.method !== "GET") return
  if (url.origin !== self.location.origin && !url.href.includes("imagedelivery.net"))
    return

  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request))
  } else if (isImage(url)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_IMAGES))
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, CACHE_STATIC))
  }
  // HTML navigations: network-first (default browser behavior, let React Router handle)
})

// ============ Cache pruning ============
self.addEventListener("message", (event) => {
  if (event.data === "prune-caches") {
    caches.open(CACHE_IMAGES).then((cache) => {
      cache.keys().then((keys) => {
        if (keys.length > CACHE_MAX_ITEMS) {
          keys.slice(0, keys.length - CACHE_MAX_ITEMS).forEach((k) => cache.delete(k))
        }
      })
    })
  }
})
