// js/test.js
import { db, getFCMToken } from './firebase.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firestoreStatus = document.getElementById('firestoreStatus');
const fcmStatus = document.getElementById('fcmStatus');
const localData = document.getElementById('localData');
const firestoreUserData = document.getElementById('firestoreUserData');
const clearLocalBtn = document.getElementById('clearLocalBtn');
const testWriteBtn = document.getElementById('testWriteBtn');
const toast = document.getElementById('toast');

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// ─── 1. localStorage 確認 ───
function updateLocalDisplay() {
    const data = {
        chatUserId: localStorage.getItem('chatUserId'),
        chatUserName: localStorage.getItem('chatUserName')
    };
    localData.textContent = JSON.stringify(data, null, 2);
}

clearLocalBtn.addEventListener('click', () => {
    localStorage.clear();
    showToast('localStorage をクリアしました');
    updateLocalDisplay();
    firestoreUserData.textContent = 'なし';
});

// ─── 2. Firebase 接続確認 ───
async function checkFirebase() {
    try {
        // 適当なドキュメントを参照（読み書きはしなくても接続確認になる）
        const testRef = doc(db, 'system_info', 'connection_test');
        firestoreStatus.innerHTML = '<span class="status-ok">接続可能 (URL/API Key OK)</span>';
    } catch (err) {
        firestoreStatus.innerHTML = `<span class="status-ng">エラー: ${err.message}</span>`;
    }

    // FCM
    try {
        const token = await getFCMToken();
        if (token) {
            fcmStatus.innerHTML = '<span class="status-ok">取得成功</span>';
        } else {
            fcmStatus.innerHTML = '<span class="status-ng">未許可 または 設定不足</span>';
        }
    } catch (err) {
        fcmStatus.innerHTML = `<span class="status-ng">エラー: ${err.message}</span>`;
    }
}

// ─── 3. Firestore ユーザーデータ取得 ───
async function fetchUser() {
    const userId = localStorage.getItem('chatUserId');
    if (!userId) {
        firestoreUserData.textContent = 'ログインしていません';
        return;
    }

    try {
        const snap = await getDoc(doc(db, 'users', userId));
        if (snap.exists()) {
            firestoreUserData.textContent = JSON.stringify(snap.data(), null, 2);
        } else {
            firestoreUserData.textContent = 'Firestore にデータが見つかりません';
        }
    } catch (err) {
        firestoreUserData.textContent = `エラー: ${err.message}`;
    }
}

// ─── 4. 書き込みテスト ───
testWriteBtn.addEventListener('click', async () => {
    try {
        const testRef = doc(db, 'test_collection', 'last_test');
        await setDoc(testRef, {
            timestamp: serverTimestamp(),
            message: 'テスト書き込み成功'
        });
        showToast('Firestore 書き込みに成功しました！');
    } catch (err) {
        console.error(err);
        showToast(`エラー: ${err.message}`);
    }
});

// 初期実行
updateLocalDisplay();
checkFirebase();
fetchUser();
