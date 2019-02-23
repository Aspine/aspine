var cacheName = "v1";
var cacheFiles = [
];

self.addEventListener('install', function(event) {
  // Perform install steps
  //console.log("[ServiceWorker] Installed");

  event.waitUntil(
	  caches.open(cacheName).then(function(cache) {
		  //console.log("[ServiceWorker] Caching cacheFiles");
		  return cache.addAll(cacheFiles);
	  })
  );
});

self.addEventListener('activate', function(event) {
  // Perform install steps
  //console.log("[ServiceWorker] Activated");

	event.waitUntil(
		caches.keys().then(function(cacheNames) {
			return Promise.all(cacheNames.map(function(thisCacheName) {
				if (thisCacheName !== cacheName) {
					//console.log("[ServiceWorker] Resolving Cached Files from ", thisCacheName);
					return caches.delete(thisCacheName);
				}
			}))
		})
	);
});

self.addEventListener('fetch', function(event) {
  // Perform install steps
  //console.log("[ServiceWorker] Fetching", event.request.url);
});
