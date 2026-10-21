// Service worker de Flota Segura ERP.
//
// A proposito NO cachea nada: el usuario pidio que la app siga siendo
// "online" y muestre la informacion en tiempo real igual que la web (viajes,
// monitoreo, saldos, etc. vienen de Supabase por websocket/fetch). Un
// service worker que sirviera datos desde cache podria mostrar informacion
// vieja sin que el usuario se de cuenta -- eso es peor que no tener PWA.
//
// Su unico trabajo es existir: la mayoria de navegadores exigen un service
// worker con un manejador de "fetch" para considerar la app instalable
// ("Agregar a pantalla de inicio" / icono propio, pantalla completa).

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
