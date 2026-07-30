# 気になるアーティストメモ

イベント（フェス・ライブなど）で気になるアーティストを記録する、家族2人（ゆうき／みさき）共有の個人アプリ。React + Vite製、GitHub Pagesで公開。

- 公開URL: https://datemegane221.github.io/fuji-rock-artist-memo/
- リポジトリ: datemegane221/fuji-rock-artist-memo（`main`ブランチに直接コミットしている。PRは経由していない）
- `README.md`に機能の詳細説明あり。実装前に一読推奨。

## 技術構成

- React + Vite（`src/`配下、コンポーネントはファイル分割: `App.jsx`がルーティング/状態管理の起点）
- スタイルはCSSファイルなし、全てインラインstyleオブジェクト
- データ保存先: **GAS（Google Apps Script）経由のNotion連携API**。`localStorage`は使っていない（`src/api.js`にAPIクライアント）
- GASのコード自体はこのリポジトリの外（Notion側のApps Scriptプロジェクト）にあり、ここからは編集できない。ユーザーに直接コードを渡して貼り替えてもらう運用

## データモデル

- **artist**: id, name, spotifyUrl, youtubeUrl, officialUrl, genre, memo, thumbnailUrl, createdAt
- **sighting**: id, artistId, eventName, date, stage, rank, favoriteSong, memo, registeredBy（1 artist : N sightings）

## GAS API連携でハマったポイント（再発しやすいので注意）

1. **GASはコードを保存しただけでは`/exec`のURLに反映されない。** `doGet`/`doPost`を含めどんな変更でも、「デプロイを管理」→ 対象デプロイを編集 →「新バージョン」でデプロイし直す必要がある。POSTだけ404になる、変更が反映されない等の症状は大体これ。
2. **NotionのSelect型プロパティは値を常に文字列で返す。** `rank`はアプリ内では数値（`RANK_OPTIONS`の`value`）として比較しているため、`src/api.js`の`fetchSightings`で`Number(...)`に変換している。新しくNotionのSelect/Statusプロパティをフィールドに追加するときは、同様の型変換が必要にならないか確認すること。
3. Notionの`select`と`status`は別物で書き込みJSON形式が違う（`{select:{name}}` vs `{status:{name}}`）。型を誤ると`Rank is expected to be select`のような400エラーになる。
4. GASのPOSTは`Content-Type: text/plain`で送っている（`application/json`だとCORSのpreflightが飛び、GAS側がOPTIONSを処理できず失敗する）。

## デプロイ

- `main`にpushすると`.github/workflows/deploy.yml`が自動でビルド・GitHub Pagesへデプロイ
- Viteの`base: "./"`設定により相対パスでビルドされる

## 開発サンドボックスでの制約

- このClaude Code実行環境からは `script.google.com` や `*.github.io` へのネットワークアクセスがプロキシでブロックされている。実際のGAS/Notion API・公開後のPagesサイトを直接fetchでは確認できない
- 動作確認はPlaywright + `page.route()`でGAS APIをモックして行っている（`src/api.js`のBASE_URLへのリクエストをインターセプト）。実データでの最終確認はユーザー側での手動テストに頼る
- 実装後は必ず `npm run build` を実行してビルドが通ることを確認してからコミットする

## 機能の現状（実装済み）

- アーティスト一覧（カード、サムネイル表示、イベント/登録者フィルタ、評価順・名前順ソート）
- アーティスト詳細（プロフィール編集、削除、視聴履歴の追加・編集・削除）
- 登録者（ゆうき/みさき）の選択・切り替え（設定アイコン）、sightingへの紐づけ
- YouTubeチャンネルのサムネイル検索・確定・表示（`resource=youtube_thumbnail`）

## 未実装・見送り中

- YouTube oEmbedによる動画タイトルからのアーティスト名自動サジェスト
- イベントごとのタイムテーブルとの連携
