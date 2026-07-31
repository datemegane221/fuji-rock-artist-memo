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
- **sighting**: id, artistId, eventName, date, stage, rank, favoriteSong, memo, registeredBy, costumeMemo, costumePhotoUrl（読み取り専用、Notionの「衣装写真」Files & mediaプロパティ）（1 artist : N sightings）

## GAS API連携でハマったポイント（再発しやすいので注意）

1. **GASはコードを保存しただけでは`/exec`のURLに反映されない。** `doGet`/`doPost`を含めどんな変更でも、「デプロイを管理」→ 対象デプロイを編集 →「新バージョン」でデプロイし直す必要がある。POSTだけ404になる、変更が反映されない等の症状は大体これ。
2. **「新しいデプロイ」を作ると別URLになる。** 上記1の対応で「デプロイを管理」→「新しいデプロイ」を選んでしまうと、既存の`/exec`とは**別のデプロイID・別のURL**が発行される。この場合、`src/api.js`のBASE_URLを新しいURLに書き換えない限り、アプリは古いコードのままのデプロイを見続けてしまう（コードは直したのに反映されないように見える、実行ログの処理時間が異常に短い＝実は新しいコードが一度も実行されていない、が症状のサイン）。**必ず既存デプロイの編集（鉛筆アイコン）→「新バージョン」を使うこと。** URLがズレてしまった場合は、GASエディタの「デプロイを管理」に出ている現在のウェブアプリURLを`src/api.js`のBASE_URLに合わせる。
3. **NotionのSelect型プロパティは値を常に文字列で返す。** `rank`はアプリ内では数値（`RANK_OPTIONS`の`value`）として比較しているため、`src/api.js`の`fetchSightings`で`Number(...)`に変換している。新しくNotionのSelect/Statusプロパティをフィールドに追加するときは、同様の型変換が必要にならないか確認すること。
4. Notionの`select`と`status`は別物で書き込みJSON形式が違う（`{select:{name}}` vs `{status:{name}}`）。型を誤ると`Rank is expected to be select`のような400エラーになる。
5. GASのPOSTは`Content-Type: text/plain`で送っている（`application/json`だとCORSのpreflightが飛び、GAS側がOPTIONSを処理できず失敗する）。
6. Notionへのファイルアップロード（衣装写真）は単純なPATCHでは完結せず、①`/file_uploads`で枠を作成 → ②multipart/form-dataでバイナリを送信（`notionFetch_`は使えない、`Content-Type`を指定せず`UrlFetchApp.fetch`に`payload: { file: blob }`で渡す）→ ③ページのFiles & mediaプロパティに`file_upload`参照で紐づけ、の3ステップが必要（`uploadCostumePhoto_`参照）。

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
- 登録者（ゆうき/みさき）の選択・切り替え（設定アイコン）、sightingへの紐づけ、絞り込みが一覧・詳細両方に伝播
- YouTubeチャンネルのサムネイル検索・確定・表示（`resource=youtube_thumbnail`）
- 衣装メモ・衣装写真（撮影 or 写真選択→Canvas APIでリサイズ・圧縮→Base64でアップロード、`resource=costume_photo`）。画像アップロード失敗時もテキストは保存される設計
- 衣装写真だけの削除（`resource=costume_photo, action=delete`）。sighting本体は残したまま写真のみ削除できる（`deleteCostumePhoto_`参照）
- アーティスト新規登録フォームでフェス公式アーティストページのURLを貼ると自動入力（`resource=supported_festivals`で対応フェス一覧取得、`resource=festival_artist_url`でURL解析。出演日程の文字列配列はパースせず、登録直後のsighting追加フォームに選択候補として表示するだけ）

## 未実装・見送り中

- YouTube oEmbedによる動画タイトルからのアーティスト名自動サジェスト
- イベントごとのタイムテーブルとの連携
