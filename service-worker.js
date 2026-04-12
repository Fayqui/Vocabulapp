const CACHE_NAME = "vocabulapp-dev-v8";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",

  "./assets/banderola+logo.png",
  "./assets/panel-temas-fr.png",
  "./assets/panel-temas-en.png",
  "./assets/monsieur-bete.png",
  "./assets/gameplay-book.png",
  "./assets/gameplay-screen.png",
  "./assets/card-face.png",

  "./assets/btn-idioma.png",
  "./assets/btn-anadir.png",
  "./assets/btn-continuar.png",
  "./assets/btn-borrar.png",
  "./assets/btn-salir.png",
  "./assets/btn-back-floating.png",

  "./assets/logo-inicio.png",
  "./assets/fondo-inicio.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // HTML: siempre intenta red primero
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // CSS/JS/manifest: red primero, con fallback a caché
  if (
    request.url.endsWith(".css") ||
    request.url.endsWith(".js") ||
    request.url.endsWith("manifest.json")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // imágenes y resto: caché primero, luego red
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});