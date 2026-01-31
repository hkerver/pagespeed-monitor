const CACHE_NAME = 'pagespeed-analyzer-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache geopend');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('Cache installatie mislukt:', error);
            })
    );
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Oude cache verwijderd:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                if (response) {
                    return response;
                }
                
                return fetch(event.request).then((response) => {
                    // Don't cache non-successful responses
                    if (!response || response.status !== 200 || response.type === 'error') {
                        return response;
                    }
                    
                    // Clone the response
                    const responseToCache = response.clone();
                    
                    // Cache the new response
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            })
            .catch(() => {
                // Offline fallback
                if (event.request.destination === 'document') {
                    return caches.match('/index.html');
                }
            })
    );
});

// Background sync for failed analysis requests
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-analysis') {
        event.waitUntil(syncAnalysis());
    }
});

async function syncAnalysis() {
    // Retrieve pending analyses from IndexedDB
    const db = await openDB();
    const tx = db.transaction('pending-analyses', 'readonly');
    const store = tx.objectStore('pending-analyses');
    const pendingAnalyses = await store.getAll();
    
    // Process each pending analysis
    for (const analysis of pendingAnalyses) {
        try {
            // Re-attempt the analysis
            await fetch(analysis.url, analysis.options);
            
            // Remove from pending if successful
            const deleteTx = db.transaction('pending-analyses', 'readwrite');
            const deleteStore = deleteTx.objectStore('pending-analyses');
            await deleteStore.delete(analysis.id);
        } catch (error) {
            console.error('Sync mislukt voor:', analysis.url);
        }
    }
}

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('pagespeed-db', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('pending-analyses')) {
                db.createObjectStore('pending-analyses', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

// Push notification support (voor toekomstige features)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Nieuwe update beschikbaar',
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Bekijk',
                icon: '/icon-96.png'
            },
            {
                action: 'close',
                title: 'Sluiten',
                icon: '/icon-96.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('PageSpeed Analyzer', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handler for communication with main app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.addAll(event.data.urls);
            })
        );
    }
});

console.log('Service Worker geladen');
