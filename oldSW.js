var cacheName = "v3";
var cacheFiles = [
	'./',
	'/login.html',
	//'/home.html',
	//'/manifest.json',
	//'/sw.js',
	//'/tambulator.css',
	//'/images/icons/favicon.ico',
	//'/vendor/bootstrap/css/bootstrap.min.css',
	//'/fonts/font-awesome-4.7.0/css/font-awesome.min.css',
	//'/vendor/animate/animate.css',
	//'/vendor/css-hamburgers/hamburgers.min.css',
	//'/vendor/select2/select2.min.css',
	//'/css/util.css',
	//'/css/main.css',
	//'/css/stylesheet.css',
];

self.addEventListener('install', function(event) {
  // Perform install steps
  console.log("[ServiceWorker] Installed");
  event.waitUntil(
	  caches.open(cacheName).then(function(cache) {
		  //console.log("[ServiceWorker] Caching cacheFiles");
		  return cache.addAll(cacheFiles);
	  })
  );
});

self.addEventListener('activate', function(event) {
  // Perform install steps
  console.log("[ServiceWorker] Activated");

	event.waitUntil(
		caches.keys().then(function(cacheNames) {
			return Promise.all(cacheNames.map(function(thisCacheName) {
				if (thisCacheName !== cacheName) {
					console.log("[ServiceWorker] Resolving Cached Files from ", thisCacheName);
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
self.addEventListener('fetch', event => {
  // Let the browser do its default thing
  // for non-GET requests.
  if (event.request.method != 'GET') return;

  // Prevent the default, and handle the request ourselves.
  event.respondWith(async function() {
    // Try to get the response from a cache.
    const cache = await caches.open('cacheFiles');
    const cachedResponse = await cache.match(event.request);

    if (cachedResponse) {
      // If we found a match in the cache, return it, but also
      // update the entry in the cache in the background.
      event.waitUntil(cache.add(event.request));
      return cachedResponse;
    }

    // If we didn't find a match in the cache, use the network.
    return fetch(event.request);
  }());
});

//self.addEventListener('fetch', function (event) {
//    //console.log('Handling fetch event for', event.request.url);
//
//    event.respondWith(
//        caches.match(event.request).then(function (response) {
//            if (response) {
//                //console.log('Found response in cache:', response);
//
//                return response;
//            }
//
//            console.log('No response found in cache. About to fetch from network...');
//
//            return fetch(event.request).then(function (response) {
//                console.log('Response from network is:', response);
//
//                return response;
//            }).catch(function (error) {
//                console.error('Fetching failed:', error);
//
//                return caches.match(OFFLINE_URL);
//            });
//        })
//    );
//});
