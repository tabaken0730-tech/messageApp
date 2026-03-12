// js/firebase.js
// ──────────────────────────────────────────────────────────────────────────
// Firebase SDK v10（モジュラー形式）の初期化
// ※ Firebase Console > プロジェクト設定 > ウェブアプリ から取得した値に差し替えてください
// ──────────────────────────────────────────────────────────────────────────

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js';

// ▼▼▼ ここを Firebase Console の値に差し替えてください ▼▼▼
const firebaseConfig = {
    apiKey: "AIzaSyC8MDzHP1ENfEoHb71XGFTOpTuhf_v-GP0",
    authDomain: "messageapp-f94dd.firebaseapp.com",
    projectId: "messageapp-f94dd",
    storageBucket: "messageapp-f94dd.firebasestorage.app",
    messagingSenderId: "1007116562967",
    appId: "1:1007116562967:web:2ab94991d7fdd0055aa252",

};
// ▲▲▲ ここまで ▲▲▲

// FCM VAPID キー（Firebase Console > Cloud Messaging > ウェブプッシュ証明書 から取得）
export const VAPID_KEY = "YOUR_VAPID_KEY";

// Firebase 初期化
const app = initializeApp(firebaseConfig);

// Firestore DB
export const db = getFirestore(app);

// Cloud Messaging
export const messaging = getMessaging(app);

// FCMトークンを取得するヘルパー関数
export async function getFCMToken() {
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return null;

        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        return token;
    } catch (err) {
        console.warn('FCMトークンの取得に失敗しました:', err);
        return null;
    }
}

export { onMessage };
