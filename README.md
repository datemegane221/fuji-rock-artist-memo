# フジロック アーティストメモ

フジロックで気になるアーティストを記録するための個人用メモアプリ。

## 機能

- アーティスト名、メモ、ステージ（GREEN STAGE / WHITE STAGE / RED MARQUEE / FIELD OF HEAVEN / ORANGE CAFE / GYPSY AVALON）、日程（DAY1〜3）、開始時刻を記録
- 評価（殿堂入り / また観たい / 気になる / チェック中）でランク付け
- 日程での絞り込み、評価順・時間順での並び替え
- Spotify / YouTube リンクの保存、Google検索へのショートカット
- ブラウザの `localStorage` にデータを保存（バックエンドなし）

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

- データの保存先をバックエンド（Supabase等）に移行する余地あり
- 実際のフェス発表ラインナップとの連携（自動でアーティスト候補を取り込むなど）
- スマホでの操作性向上
