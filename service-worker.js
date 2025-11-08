/* ===================================
   Service Worker for PWA Functionality
   Enables offline support and caching
   =================================== */

const CACHE_NAME = 'weather-app-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

/* ===================================
   Install Event - Cache Resources
   =================================== */
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching files');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Service Worker: Installed');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Cache failed', error);
            })
    );
});

/* ===================================
   Activate Event - Clean Old Caches
   =================================== */
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache');
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activated');
            return self.clients.claim();
        })
    );
});

/* ===================================
   Fetch Event - Serve Cached Content
   Network First Strategy for API calls
   Cache First Strategy for static assets
   =================================== */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Network-first strategy for API calls
    if (url.hostname.includes('api.openweathermap.org')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone the response before caching
                    const responseClone = response.clone();

                    // Cache the fresh API response
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });

                    return response;
                })
                .catch(() => {
                    // If network fails, try to return cached version
                    return caches.match(request);
                })
        );
        return;
    }

    // Cache-first strategy for static assets
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    console.log('Service Worker: Returning from cache', request.url);
                    return cachedResponse;
                }

                // If not in cache, fetch from network
                return fetch(request)
                    .then((response) => {
                        // Don't cache if response is not valid
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }

                        // Clone the response
                        const responseClone = response.clone();

                        // Cache the new resource
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });

                        return response;
                    });
            })
            .catch(() => {
                // Return a custom offline page if available
                if (request.destination === 'document') {
                    return caches.match('/index.html');
                }
            })
    );
});

/* ===================================
   Background Sync (Optional)
   For future implementation
   =================================== */
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-weather') {
        event.waitUntil(
            // Sync weather data in background
            console.log('Service Worker: Background sync triggered')
        );
    }
});

/* ===================================
   Push Notifications (Optional)
   For future weather alerts
   =================================== */
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Weather update available',
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification('Weather App', options)
    );
});

/* ===================================
   Notification Click Handler
   =================================== */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow('/')
    );
});