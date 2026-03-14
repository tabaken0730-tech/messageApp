// js/friends.js
// ─────────────────────────────────────────────────────
// 友達検索・追加・一覧表示
// ─────────────────────────────────────────────────────
import { db } from './firebase.js';
import { auth } from './auth.js';

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ─── 現在のユーザー ───
const me = auth.requireAuth();

// ─── DOM 要素 ───
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchResult = document.getElementById('searchResult');
const friendsList = document.getElementById('friendsList');
const emptyState = document.getElementById('emptyState');
const myIdBtn = document.getElementById('myIdBtn');
const myIdModal = document.getElementById('myIdModal');
const closeModal = document.getElementById('closeModal');
const modalMyId = document.getElementById('modalMyId');
const copyMyIdBtn = document.getElementById('copyMyIdBtn');
const toast = document.getElementById('toast');

// ─── トースト ───
function showToast(msg, duration = 2500) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

// ─── アバター文字（名前の頭文字）───
function avatarChar(name = '') {
    return (name[0] || '?').toUpperCase();
}

// ─── chat_id 生成（ID昇順連結）───
function makeChatId(a, b) {
    return [a, b].sort().join('_');
}

// ─── 友達カードHTMLを生成 ───
function friendCard(friendId, friendName) {
    const el = document.createElement('a');
    el.className = 'friend-item';
    el.href = `chat.html?with=${friendId}`;
    el.id = `friend-${friendId}`;
    el.innerHTML = `
    <div class="friend-avatar">${avatarChar(friendName)}</div>
    <div class="friend-info">
      <div class="friend-name">${escHtml(friendName)}</div>
      <div class="friend-id-text">ID: ${escHtml(friendId)}</div>
    </div>
    <span class="friend-arrow">›</span>
  `;
    return el;
}

// ─── HTML エスケープ ───
function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ─── ユーザー検索 ───
searchBtn.addEventListener('click', async () => {
    const targetId = searchInput.value.trim();
    if (!targetId) { showToast('ユーザーIDを入力してください'); return; }
    if (targetId === me.userId) { showToast('自分自身は追加できません'); return; }

    searchBtn.textContent = '検索中...';
    searchBtn.disabled = true;
    searchResult.classList.add('hidden');
    searchResult.innerHTML = '';

    try {
        const userSnap = await getDoc(doc(db, 'users', targetId));
        if (!userSnap.exists()) {
            showToast('ユーザーが見つかりませんでした');
            return;
        }

        const friendData = userSnap.data();
        const fname = friendData.name || '不明';

        // 既に友達かチェック
        const fQuery = query(
            collection(db, 'friends'),
            where('user_id', '==', me.userId),
            where('friend_id', '==', targetId)
        );
        const fSnap = await getDocs(fQuery);
        const isFriend = !fSnap.empty;

        // 検索結果カードを表示
        const card = document.createElement('div');
        card.className = 'search-result-card';
        card.innerHTML = `
      <div class="friend-avatar">${avatarChar(fname)}</div>
      <div class="friend-info">
        <div class="friend-name">${escHtml(fname)}</div>
        <div class="friend-id-text">ID: ${escHtml(targetId)}</div>
      </div>
      ${isFriend
                ? '<span style="font-size:.85rem;color:var(--text-secondary);">追加済み</span>'
                : `<button class="btn-secondary" id="addFriendBtn">追加</button>`
            }
    `;
        searchResult.appendChild(card);
        searchResult.classList.remove('hidden');

        if (!isFriend) {
            document.getElementById('addFriendBtn')?.addEventListener('click', async () => {
                await addFriend(targetId, fname);
            });
        }
    } catch (err) {
        console.error(err);
        showToast('エラーが発生しました');
    } finally {
        searchBtn.textContent = '検索';
        searchBtn.disabled = false;
    }
});

// Enterキーで検索
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchBtn.click();
});

// ─── 友達追加 ───
async function addFriend(friendId, friendName) {
    try {
        await addDoc(collection(db, 'friends'), {
            user_id: me.userId,
            friend_id: friendId,
            created_at: serverTimestamp()
        });
        showToast(`${friendName} さんを追加しました！`);

        // 検索結果を更新
        searchResult.classList.add('hidden');
        searchResult.innerHTML = '';
        searchInput.value = '';
    } catch (err) {
        console.error(err);
        showToast('追加に失敗しました');
    }
}

// ─── 友達一覧のリアルタイム監視 ───
function listenFriends() {
    const q = query(
        collection(db, 'friends'),
        where('user_id', '==', me.userId)
    );

    onSnapshot(q, async (snapshot) => {
        // 既存のリスト項目をクリア（emptyState は残す）
        const items = friendsList.querySelectorAll('.friend-item');
        items.forEach(el => el.remove());

        if (snapshot.empty) {
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        // 各友達のユーザー情報を取得して表示
        for (const change of snapshot.docs) {
            const { friend_id } = change.data();
            try {
                const snap = await getDoc(doc(db, 'users', friend_id));
                const name = snap.exists() ? snap.data().name : '不明なユーザー';
                const card = friendCard(friend_id, name);
                friendsList.appendChild(card);
            } catch {
                console.warn('友達情報取得エラー:', friend_id);
            }
        }
    });
}

// ─── マイID モーダル ───
myIdBtn.addEventListener('click', () => {
    modalMyId.textContent = me.userId;
    myIdModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
    myIdModal.classList.add('hidden');
});

myIdModal.addEventListener('click', (e) => {
    if (e.target === myIdModal) myIdModal.classList.add('hidden');
});

copyMyIdBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(me.userId)
        .then(() => showToast('IDをコピーしました！'))
        .catch(() => showToast('コピーに失敗しました'));
});

// ─── 初期化 ───
listenFriends();
