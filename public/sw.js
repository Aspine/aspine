const cacheVersion = 'v1';

self.addEventListener('install', event => {
    console.debug('Service worker installed');
    event.waitUntil(
        caches.open(cacheVersion).then(cache => {
            return cache.addAll([
                '/login.html',
                '/home.html',
                '/sw.js',
                '/schedule.json',
                '/manifest.json',
                '/vendor/tabulator/tabulator.min.js',
                '/vendor/jquery/jquery.min.js',
                '/vendor/pdf.js/pdf.min.js',
                '/vendor/plotly.js/plotly.js',
                '/vendor/animate/animate.min.css',
                '/vendor/bootstrap/bootstrap.min.css',
                '/vendor/hamburgers/hamburgers.min.css',
                '/vendor/tilt/tilt.jquery.min.js',
                '/js/home.js',
                '/js/extraFunctions.js',
                '/js/buttonFunctions.js',
                '/js/calculate_grade.js',
                '/js/clock.js',
                '/fonts/poppins/Poppins-Regular.ttf',
                '/fonts/poppins/Poppins-Medium.ttf',
                '/fonts/poppins/Poppins-Bold.ttf',
                '/fonts/fontawesome/webfonts/fa-solid-900.woff2',
                '/fonts/fontawesome/css/all.min.css',
                '/css/tabulator.css',
                '/css/home.css',
                '/css/login.css',
                '/images/logo-circle.png',
                '/images/district-logo.png',
                '/favicon.ico'
            ])
        })
    );
});
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            cacheNames.map(cacheName => {
                if (cacheName !== cacheVersion) {
                    caches.delete(cacheName).then()
                }
            })
        }))
});
// https://developers.google.com/web/ilt/pwa/caching-files-with-service-worker
self.addEventListener('fetch', event => {
    // If get request, i.e. a static resource get from cache, fallback on network
    if (event.method === 'GET') {
        event.respondWith(
            caches.match(event.request).then(async response => {
                return response || await fetch(event.request)
            })
        );
    }
});