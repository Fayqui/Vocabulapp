const CACHE_NAME = "vocabulapp-dev-v11";

const CORE_ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.json",

  "/assets/icon-192.png",
  "/assets/icon-512.png",

  "/assets/biblioteca.jpg",
  "/assets/fondo-inicio.png",
  "/assets/logo-inicio.png",
  "/assets/banderola+logo.png",

  "/assets/btn-fr.png",
  "/assets/btn-en.png",
  "/assets/btn-idioma.png",
  "/assets/btn-anadir.png",
  "/assets/btn-continuar.png",
  "/assets/btn-borrar.png",
  "/assets/btn-salir.png",
  "/assets/btn-back-floating.png",
  "/assets/btn-cont-screen.png",

  "/assets/panel-temas-fr.png",
  "/assets/panel-temas-en.png",
  "/assets/panel-configuracion.png",

  "/assets/monsieur-bete.png",
  "/assets/gameplay-book.png",
  "/assets/gameplay-screen.png",
  "/assets/card-face.png",

  "/assets/intro-fr.png",
  "/assets/intro-en.png",

  "/assets/phase1-fr.png",
  "/assets/phase1-en.png",
  "/assets/phase2-fr.png",
  "/assets/phase2-en.png",
  "/assets/phase3-fr.png",
  "/assets/phase3-en.png",
  "/assets/phasefinal-fr.png",
  "/assets/phasefinal-en.png",
  "/assets/victory-fr.png",
  "/assets/victory-en.png",

  "/assets/cursor-vocabulapp.png",
  "/assets/cursor-vocabulapp-hover.png",

  "/assets/icons/icon-audio-on.png",
  "/assets/icons/icon-audio-off.png",

  "/assets/menu.mp3",
  "/assets/gameplay.mp3",
  "/assets/blip.wav",
  "/assets/flip-card.wav",
  "/assets/coin.wav"
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