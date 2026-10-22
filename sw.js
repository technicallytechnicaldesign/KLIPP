"use strict";
                                                                          
                                                                        
                                                                         
                                              

                                                                        
                                                                          
                                                                    
                                                                        
                                                                    
                                                                      
                                                                         
                                                                   
                                                                      
var CACHE_NAME = "klipp-shell-v15";
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
