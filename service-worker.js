// service-worker.js - PWAキャッシュ + FCMプッシュ通知
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const CACHE_NAME = 'chat-app-v1';
const CACHE_URLS = [
  './',
  './index.html',
  './login.html',
  './friends.html',
  './chat.html',
  './css/style.css',
  './js/firebase.js',
  './js/auth.js',
  './js/friends.js',
  './js/chat.js',
  './manifest.json'
];

// ─── インストール：リソースをキャッシュ ───
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_URLS))
  );
  self.skipWaiting();
});

// ─── アクティベート：古いキャッシュを削除 ───
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

// ─── フェッチ：キャッシュファースト戦略 ───
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached || fetch(event.request)
    )
  );
});

// ─── Firebase Messaging 初期化（firebase.js と同じ設定値を記載） ───
// ※ 実際の値は firebase.js と同じものを設定してください
firebase.initializeApp({
  apiKey: "AIzaSyC8MDzHP1ENfEoHb71XGFTOpTuhf_v-GP0",
  authDomain: "messageapp-f94dd.firebaseapp.com",
  projectId: "messageapp-f94dd",
  storageBucket: "messageapp-f94dd.firebasestorage.app",
  messagingSenderId: "1007116562967",
  appId: "1:1007116562967:web:2ab94991d7fdd0055aa252"
});

const messaging = firebase.messaging();

// ─── バックグラウンド通知の表示 ───
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: payload.data
  });
});

// ─── 通知クリック時の動作 ───
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const chatUrl = event.notification.data?.chatUrl || './friends.html';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(chatUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(chatUrl);
    })
  );
});
