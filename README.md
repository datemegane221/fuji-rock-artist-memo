# 気になるアーティストメモ

好きなイベント（フェス・ライブなど）で気になるアーティストを記録するための個人用メモアプリ。
1人のアーティストに対して、複数のイベントでの視聴記録（sighting）を紐づけて管理できる。

## データ保存先

GAS（Google Apps Script）経由のNotion連携APIにデータを保存する。ブラウザの`localStorage`は使用しない。

- `GET  ?resource=artists` / `GET  ?resource=sightings` でデータを取得
- `POST` （`resource: "artist"|"sighting"`, `action: "create"|"update"|"delete"`）で作成・更新・削除

APIのベースURLは `src/api.js` に定義。

## データ構造

- **artist**（アーティストのプロフィール）: id, name, spotifyUrl, youtubeUrl, officialUrl, genre, memo, createdAt
- **sighting**（1回分の視聴記録）: id, artistId, eventName（自由入力）, date, stage（自由入力）, rank, favoriteSong, memo
- 1つの artist は複数の sighting を持てる

## 画面構成

1. **一覧画面**: 登録済みアーティストをカード表示。タップすると詳細画面に遷移
   - イベント（sightingのeventName）での絞り込み、評価順・名前順での並び替え
   - 「+ 追加」でアーティストのプロフィールを新規登録（登録後は自動で詳細画面へ）
2. **アーティスト詳細画面**:
   - ヘッダー: 名前、ジャンル、Spotify / YouTube / 公式サイトへのリンク
   - サマリー: 観た回数、最新の評価（sightingを日付降順に並べた先頭のrank）、直近の推し曲
   - プロフィールメモ
   - 視聴履歴: sightingを日付の新しい順に一覧表示。イベント名・日付・ステージ・評価・推し曲・メモを表示
   - 「+ 記録を追加」でsightingをその場で追加・編集
   - 「編集」でプロフィール編集、「削除」でアーティストごと削除（sightingも連動して削除）

## 通信まわりの挙動

- 初回表示時、アーティスト一覧・sighting一覧をAPIから取得する間は「読み込み中...」を表示する
- 取得に失敗した場合はエラーメッセージと「再読み込み」ボタンを表示する
- 登録・更新・削除は楽観的更新を行わず、APIのレスポンスを待ってから画面を更新する
  （GASのAPIはレスポンスが1〜2秒程度かかることがあるため、送信中はボタンに「登録中...」「保存中...」等を表示し、フォームを無効化する）
- 保存や削除に失敗した場合はフォーム内にエラーメッセージを表示し、入力内容は保持したまま再試行できる

## 今回見送った機能

- YouTube oEmbedによる動画タイトルからのアーティスト名自動サジェスト（次のステップで対応予定）

## 開発

```bash
npm install
npm run dev
```

`http://localhost:5173` で起動します。

## ビルド

```bash
npm run build
npm run preview
```

## 今後の展望（メモ）

- YouTube oEmbedによるアーティスト名サジェストの再実装
- イベントごとのタイムテーブルとの連携
- スマホでの操作性向上
