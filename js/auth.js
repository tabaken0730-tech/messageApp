// js/auth.js
// ─────────────────────────────────────────────────────
// ユーザー認証・自動ログイン（localStorage ベース）
// Firebase Firestore にユーザー情報を保存
// ─────────────────────────────────────────────────────
import {
    db,
    getFCMToken
} from './firebase.js';

import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ─── ランダムユーザーID生成（英数字8文字）───
function generateUserId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

// ─── トースト表示ヘルパー ───
function showToast(msg, duration = 2500) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

// ─── Firestore にユーザーを保存 ───
async function saveUserToFirestore(userId, name) {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
        name,
        created_at: serverTimestamp(),
        fcmToken: null
    }, { merge: true });
}

// ─── FCMトークンをFirestoreに保存 ───
async function saveFCMToken(userId) {
    try {
        const token = await getFCMToken();
        if (!token) return;
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, { fcmToken: token }, { merge: true });
    } catch (e) {
        console.warn('FCMトークン保存エラー:', e);
    }
}

// ─── auth モジュール ───
export const auth = {
    /** login.html の初期化 */
    init() {
        // すでにログイン済みなら friends.html へ
        const existingId = localStorage.getItem('chatUserId');
        if (existingId) {
            window.location.replace('friends.html');
            return;
        }

        const form = document.getElementById('loginForm');
        const input = document.getElementById('usernameInput');
        const btn = document.getElementById('startBtn');
        const loginSec = document.getElementById('loginSection');
        const doneSec = document.getElementById('doneSection');
        const displayId = document.getElementById('displayId');
        const copyBtn = document.getElementById('copyBtn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = input.value.trim();
            if (!name) { showToast('ユーザー名を入力してください'); return; }

            btn.disabled = true;
            btn.textContent = '登録中...';

            try {
                const userId = generateUserId();

                // Firestore に保存
                await saveUserToFirestore(userId, name);

                // localStorage に保存
                localStorage.setItem('chatUserId', userId);
                localStorage.setItem('chatUserName', name);

                // FCMトークン取得（非同期でバックグラウンド実行）
                saveFCMToken(userId);

                // 完了画面を表示
                displayId.textContent = userId;
                loginSec.classList.add('hidden');
                doneSec.classList.remove('hidden');

                showToast(`ようこそ、${name} さん！`);
            } catch (err) {
                console.error(err);
                showToast('エラーが発生しました。Firebase の設定を確認してください。');
                btn.disabled = false;
                btn.textContent = 'はじめる';
            }
        });

        // IDコピーボタン
        copyBtn?.addEventListener('click', () => {
            const id = displayId?.textContent;
            if (!id) return;
            navigator.clipboard.writeText(id)
                .then(() => showToast('IDをコピーしました！'))
                .catch(() => showToast('コピーに失敗しました'));
        });
    },

    /** 全ページ共通：未ログイン時に login.html へリダイレクト */
    requireAuth() {
        const userId = localStorage.getItem('chatUserId');
        if (!userId) {
            window.location.replace('login.html');
            return null;
        }
        return {
            userId,
            name: localStorage.getItem('chatUserName') || 'ユーザー'
        };
    }
};
