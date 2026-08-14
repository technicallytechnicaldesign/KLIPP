"use strict";
/* KLIPP service worker. Cache-first for the app shell so the studio still
   opens with no signal; everything else (never, in this app: no network
   calls happen at all) just falls through to the network. Relative paths
   only, since Pages serves this from /KLIPP/.

   BUMP CACHE_NAME ON EVERY DEPLOY THAT TOUCHES index.html, EVEN IF THIS
   FILE ITSELF DOESN'T CHANGE. The browser only re-checks a service worker
   for updates when the worker's own script bytes change; an already
   installed PWA with an unchanged sw.js silently keeps serving whatever
   index.html it cached, forever, even after new commits land on the
   server. The v2 release (2026-08-08/09) shipped real feature changes
   without bumping this and would never have reached an already-installed
   phone. Confirmed 2026-08-09: unregistering + clearing caches was
   required before the v2 code path executed at all in a fresh tab. */
var CACHE_NAME = "klipp-shell-v10";
var SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(SHELL_FILES); })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(names.map(function(name){
        if (name !== CACHE_NAME) return caches.delete(name);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

/* the grown up corner's update row talks to the worker through here.
   "version" answers with the CACHE_NAME of the worker that is ACTUALLY
   serving this page, so the version on screen is read off the running
   worker rather than a constant in index.html that can drift away from
   it. "skip-waiting" is belt and braces: install already calls
   skipWaiting, but a worker that somehow ended up parked in "waiting"
   can still be pushed through from the app. */
self.addEventListener("message", function(event){
  var data = event.data || {};
  if (data.type === "version" && event.ports && event.ports[0]){
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  if (data.type === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", function(event){
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(function(cached){
      if (cached) return cached;
      return fetch(event.request).then(function(response){
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        return response;
      }).catch(function(){ return cached; });
    })
  );
});
