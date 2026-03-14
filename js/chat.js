// js/chat.js
// ─────────────────────────────────────────────────────
// リアルタイムチャット：メッセージ送受信・既読・通知
// ─────────────────────────────────────────────────────
import { db, messaging, getFCMToken, onMessage } from './firebase.js';
import { auth } from './auth.js';

import {
    collection,
    doc,
    getDoc,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    updateDoc,
    serverTimestamp,
    setDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ─── URLパラメータから相手IDを取得 ───
const params = new URLSearchParams(location.search);
const friendId = params.get('with');

// 未ログイン or 相手ID未指定の場合はリダイレクト
const me = auth.requireAuth();
if (!friendId) window.location.replace('friends.html');

// ─── chat_id（ID昇順でソートして連結）───
const chatId = [me.userId, friendId].sort().join('_');

// ─── DOM 要素 ───
const chatMessages = document.getElementById('chatMessages');
const msgInput = document.getElementById('msgInput');
const sendBtn = document.getElementById('sendBtn');
const headerName = document.getElementById('headerName');
const headerAvatar = document.getElementById('headerAvatar');
const msgLoading = document.getElementById('msgLoading');
const toast = document.getElementById('toast');

// ─── トースト ───
function showToast(msg, duration = 2500) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

// ─── HTMLエスケープ ───
function esc(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ─── アバター文字 ───
function avatarChar(name = '') {
    return (name[0] || '?').toUpperCase();
}

// ─── 日付フォーマット（HH:MM）───
function formatTime(ts) {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

// ─── 日付セパレーター用（YYYY/MM/DD）───
function formatDate(ts) {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// ─── 相手のユーザー情報取得 ───
let friendName = '相手';
async function loadFriendInfo() {
    try {
        const snap = await getDoc(doc(db, 'users', friendId));
        if (snap.exists()) {
            friendName = snap.data().name || '相手';
            headerName.textContent = friendName;
            headerAvatar.textContent = avatarChar(friendName);
        }
    } catch (e) {
        console.warn('相手情報取得エラー:', e);
    }
}

// ─── メッセージ要素の生成 ───
function createMsgEl(msgData, msgId) {
    const isSelf = msgData.sender_id === me.userId;
    const row = document.createElement('div');
    row.className = `msg-row ${isSelf ? 'self' : 'other'}`;
    row.id = `msg-${msgId}`;

    const senderName = isSelf ? (me.name || '自分') : friendName;
    const timeStr = formatTime(msgData.created_at);
    const readMark = isSelf
        ? `<span class="msg-read">${msgData.read ? '既読' : ''}</span>`
        : '';

    row.innerHTML = `
    <div class="msg-avatar">${avatarChar(senderName)}</div>
    <div class="msg-content">
      ${!isSelf ? `<div class="msg-name">${esc(friendName)}</div>` : ''}
      <div class="msg-bubble">${esc(msgData.text)}</div>
      <div class="msg-meta">
        ${readMark}
        <span class="msg-time">${timeStr}</span>
      </div>
    </div>
  `;
    return row;
}

// ─── 日付セパレーターを生成 ───
function createDateSep(dateStr) {
    const el = document.createElement('div');
    el.className = 'date-separator';
    el.innerHTML = `<span>${dateStr}</span>`;
    return el;
}

// ─── リアルタイムメッセージ監視 ───
function listenMessages() {
    const q = query(
        collection(db, 'messages'),
        where('chat_id', '==', chatId)
    );

    let lastDate = '';

    onSnapshot(q, async (snapshot) => {
        // 初回ロード完了
        msgLoading.classList.add('hidden');

        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const data = change.doc.data();
                const msgId = change.doc.id;

                // 日付セパレーター
                const dateStr = formatDate(data.created_at);
                if (dateStr && dateStr !== lastDate) {
                    chatMessages.appendChild(createDateSep(dateStr));
                    lastDate = dateStr;
                }

                // メッセージ追加
                const el = createMsgEl(data, msgId);
                chatMessages.appendChild(el);
                chatMessages.scrollTop = chatMessages.scrollHeight;

                // 相手のメッセージを既読にする
                if (data.sender_id !== me.userId && !data.read) {
                    updateDoc(doc(db, 'messages', msgId), { read: true }).catch(console.warn);
                }
            }

            if (change.type === 'modified') {
                // 既読マークの更新
                const data = change.doc.data();
                const msgId = change.doc.id;
                const el = document.getElementById(`msg-${msgId}`);
                if (el && data.sender_id === me.userId) {
                    const readEl = el.querySelector('.msg-read');
                    if (readEl) readEl.textContent = data.read ? '既読' : '';
                }
            }
        });
    });
}

// ─── メッセージ送信 ───
async function sendMessage() {
    const text = msgInput.value.trim();
    if (!text) return;

    msgInput.value = '';
    msgInput.style.height = '';
    sendBtn.disabled = true;

    try {
        await addDoc(collection(db, 'messages'), {
            chat_id: chatId,
            sender_id: me.userId,
            text,
            created_at: serverTimestamp(),
            read: false
        });
    } catch (err) {
        console.error('送信エラー:', err);
        showToast('送信に失敗しました');
        msgInput.value = text; // 復元
    } finally {
        sendBtn.disabled = false;
        msgInput.focus();
    }
}

// ─── 送信ボタン ───
sendBtn.addEventListener('click', sendMessage);

// ─── Enterで送信（Shift+Enterは改行）───
msgInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// ─── テキストエリア自動リサイズ ───
msgInput.addEventListener('input', () => {
    msgInput.style.height = 'auto';
    msgInput.style.height = Math.min(msgInput.scrollHeight, 120) + 'px';
});

// ─── フォアグラウンド通知（アプリ表示中）───
try {
    onMessage(messaging, (payload) => {
        const { title, body } = payload.notification || {};
        showToast(`${title}: ${body}`, 4000);
    });
} catch (e) {
    console.warn('FCM フォアグラウンド通知エラー:', e);
}

// ─── 初期化 ───
(async () => {
    try {
        // 並列で読み込みを開始
        const tasks = [
            loadFriendInfo().catch(e => console.warn('相手情報取得失敗:', e)),
            new Promise((resolve) => {
                listenMessages();
                // Firestoreの初期読み込みが完了したら（あるいは空でも初回発火したら）resolve
                // ただし念のためタイムアウトを設ける
                setTimeout(resolve, 5000);
            })
        ];

        await Promise.all(tasks);
    } catch (err) {
        console.error('初期化エラー:', err);
    } finally {
        // いかなる場合でも必ずローディングを消す
        msgLoading.classList.add('hidden');
        msgInput.disabled = false;
        msgInput.focus();
    }

    // FCMトークンの保存（通知許可） - UIをブロックしない
    setTimeout(async () => {
        try {
            const token = await getFCMToken();
            if (token) {
                await setDoc(doc(db, 'users', me.userId), { fcmToken: token }, { merge: true });
            }
        } catch (e) {
            console.warn('FCMトークン更新エラー:', e);
        }
    }, 1000);
})();
