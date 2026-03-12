# LINE風チャットアプリ

ユーザー名のみで使える 1対1 リアルタイムチャット Web アプリです。  
Firebase Firestore によるメッセージ保存、PWA 対応でスマホのホーム画面に追加して LINE アプリのように使えます。

---

## 🚀 機能

- ✅ ユーザー名だけで登録（メール・電話番号不要）
- ✅ localStorage による自動ログイン
- ✅ ユーザーID検索で友達追加
- ✅ リアルタイムメッセージ送受信（Firestore onSnapshot）
- ✅ 既読表示
- ✅ プッシュ通知（FCM）
- ✅ PWA（ホーム画面追加・フルスクリーン起動）

---

## 📁 フォルダ構成

```
line-like-chat/
├ index.html         # トップ（自動ルーティング）
├ login.html         # ユーザー登録
├ friends.html       # 友達一覧・ID検索
├ chat.html          # チャット画面
├ css/
│   └ style.css
├ js/
│   ├ firebase.js    # Firebase SDK 設定 ← ★ここを編集
│   ├ auth.js
│   ├ friends.js
│   └ chat.js
├ icons/
│   ├ icon-192.png
│   └ icon-512.png
├ manifest.json
├ service-worker.js
└ README.md
```

---

## ⚙️ セットアップ手順

### 1. Firebase プロジェクト作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」→ 任意の名前で作成
3. 左メニューから以下を有効化：
   - **Firestore Database** → 「本番環境モード」で作成
   - **Cloud Messaging** → プッシュ通知用

### 2. ウェブアプリを追加して設定値を取得

1. Firebase Console > プロジェクトの概要 > `</>`（ウェブ）をクリック
2. アプリ名を入力して登録
3. 表示された `firebaseConfig` の値をコピー

### 3. firebase.js を編集

`js/firebase.js` を開き、プレースホルダーを実際の値に差し替えます：

```js
const firebaseConfig = {
  apiKey:            "実際のapiKey",
  authDomain:        "実際のauthDomain",
  projectId:         "実際のprojectId",
  storageBucket:     "実際のstorageBucket",
  messagingSenderId: "実際のmessagingSenderId",
  appId:             "実際のappId"
};
```

### 4. FCM VAPID キーを取得（プッシュ通知用）

1. Firebase Console > プロジェクトの設定 > Cloud Messaging タブ
2. 「ウェブプッシュ証明書」→「鍵ペアを生成」
3. 生成されたキーを `firebase.js` の `VAPID_KEY` に設定

### 5. service-worker.js も同じ設定値に更新

`service-worker.js` 内の `firebase.initializeApp({...})` 部分も  
`firebase.js` と同じ設定値に差し替えてください。

### 6. Firestore セキュリティルール設定

Firebase Console > Firestore > ルール タブで以下を設定：

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow write: if true;
    }
    match /friends/{docId} {
      allow read, write: if true;
    }
    match /messages/{msgId} {
      allow read, write: if true;
    }
  }
}
```

> ⚠️ 上記は開発用の簡易ルールです。本番運用時はユーザーIDベースの認証ルールに変更してください。

---

## 🌐 GitHub Pages で公開

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/ユーザー名/リポジトリ名.git
git push -u origin main
```

GitHub リポジトリ > Settings > Pages > Branch: main を選択すると  
`https://ユーザー名.github.io/リポジトリ名` で公開されます。

---

## 💬 使い方

1. アプリを開く → ユーザー名を入力してはじめる
2. 表示されたユーザーIDを友達に教える
3. 友達のIDを検索して追加
4. 友達をタップしてチャット開始！

---

## 📱 スマホでの使い方（PWA）

- Chrome / Safari で開く
- 「ホーム画面に追加」をタップ
- アプリとしてフルスクリーンで起動できます
