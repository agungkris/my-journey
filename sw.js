/* My Journey — service worker (mulai v3.0)
   ------------------------------------------------------------------
   Supaya app bisa dibuka dari kondisi tertutup walau sedang offline.

   Strategi network-first: saat online selalu ambil versi terbaru dari
   GitHub Pages (jadi update app tetap langsung masuk), saat offline pakai
   salinan terakhir. Data pengguna TIDAK disimpan di sini — data tetap di
   localStorage dan Firestore seperti sebelumnya.

   Yang disalin hanya: berkas app sendiri, font Google, dan pustaka Firebase.
   Firestore, login, dan penghubung kalender tidak pernah lewat sini. */

const CACHE = "my-journey-shell-v1";
const INTI = ["./", "index.html", "apple-touch-icon.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(INTI.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(n => n.startsWith("my-journey") && n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

function bolehDisalin(url) {
  if (url.origin === self.location.origin) return !url.pathname.endsWith("/sw.js");
  if (url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com") return true;
  if (url.origin === "https://www.gstatic.com" && url.pathname.startsWith("/firebasejs/")) return true;
  return false;
}

async function cadangan(req) {
  const ada = await caches.match(req, { ignoreSearch: req.mode === "navigate" });
  if (ada) return ada;
  if (req.mode === "navigate") return (await caches.match("index.html")) || (await caches.match("./"));
  return Response.error();
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (!bolehDisalin(url)) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && (res.ok || res.type === "opaque")) {
          const salinan = res.clone();
          caches.open(CACHE).then(c => c.put(req, salinan)).catch(() => {});
        }
        return res;
      })
      .catch(() => cadangan(req))
  );
});
