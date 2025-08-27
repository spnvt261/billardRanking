const CACHE_NAME = "nineball-cache-v1";
const urlsToCache = [
  "/",
  "/rankings.html",
  "/player_detail.html",
  "/overall.html",
  "/tournaments.html",
  "/tournament_details.html",
  "/Den/tourDen_ongoing.html",
  "/match_history.html",
  "/style.css",
  "/data.js",
  "/images/icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        urlsToCache.map((url) =>
          fetch(url).then((response) => {
            if (response.ok) {
              return cache.put(url, response);
            }
            console.warn("Skip caching:", url);
          }).catch(() => {
            console.warn("Failed to fetch:", url);
          })
        )
      );
    })
  );
});

// Fetch: ưu tiên cache trước, nếu không có thì request
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Activate: xóa cache cũ
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      )
    )
  );
});
