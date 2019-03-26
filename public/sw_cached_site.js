const cacheName = 'v5';

let currentCache = {
    offline: 'offline-cache' + cacheName
};

offlineUrl = 'offline.html';

// Call Install Event
self.addEventListener('install', (e) => {

    e.waitUntil(
        caches.open(currentCache.offline)
        .then(cache => {
            return cache.addAll([
                offlineUrl
            ]);
        })
    );

    console.log("Service Worker: Installed");
});

// Call Install Event
self.addEventListener('activate', (e) => {
    console.log("Service Worker: Activated");

    // Remove unwanted caches
    e.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if(cache !== cacheName && cache !== currentCache.offline) {
                        console.log('Service Worker: Clearing Old Cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (e) => {
    console.log("Service Worker: Fetching");

    if (e.request.mode === 'navigate' || (e.request.method === 'GET' && e.request.headers.get('accept').includes('text/html'))) {
        e.respondWith(
            fetch(e.request.url).catch(error => {
                // Return the offline page
                return caches.match(offlineUrl);
            })
        );
    } else {
        e.respondWith(
            fetch(e.request)
            .then(res => {
                // Make a copy/clone of response
                const resClone = res.clone();
                // Open cache
                caches
                    .open(cacheName)
                    .then(cache => {
                        cache.put(e.request, resClone);
                    });
                return res;
            }).catch(err => caches.match(e.request).then(res => res))
        );
    }
});
