const cacheName = 'v4';


// Call Install Event
self.addEventListener('install', (e) => {

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
                    if(cache !== cacheName) {
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
});
