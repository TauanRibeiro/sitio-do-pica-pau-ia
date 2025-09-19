// Legacy, intentionally inert service worker.
// This file exists only to avoid 404s; we do not register any SW in the app.
// If a previous registration loads this, it will immediately unregister and clear caches.

self.addEventListener('install', (event) => {
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil((async () => {
		try {
			// Unregister this SW if somehow registered
			await self.registration.unregister();
		} catch {}
		// Clear any caches left by prior versions
		try {
			const keys = await caches.keys();
			await Promise.all(keys.map((k) => caches.delete(k)));
		} catch {}
		try { await self.clients.claim(); } catch {}
	})());
});

