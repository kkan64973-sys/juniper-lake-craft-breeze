# Redirect Checker

短縮URLやリダイレクト経路をホップごとに追跡し、到達先ページのスクリーンショットまで確認するツールです。

- HTTP / meta refresh の転送を追跡
- パスワード欄・クロスドメインフォーム・punycode などの注意点を抽出
- 内部向けホスト / 予約IP は拒否（SSRF 対策）
- 到達確認後にモバイル幅でスクリーンショット

Val Town 上で Kernel + Playwright を直接つなぐとタイムアウトして Cloudflare の HTML 502 になることがあるため、スクショはサーバー側のブラウザ（またはフォールバック API）で撮ります。

## 構成

```
src/
  components/checker-app.tsx   UI
  lib/redirect/                追跡・HTML解析・SSRF・撮影
  routes/api/trace.ts          POST /api/trace
  routes/api/shot.ts           POST /api/shot  (PNG)
val-town/http-val.ts           Val Town に貼る HTTP val（1ファイル）
```

## API

`POST /api/trace` `{ "url": "https://example.com" }` → JSON（hops / warnings / page）

`POST /api/shot` `{ "url": "https://example.com" }` → `image/png`  
ヘッダ `X-Page-Url` にブラウザ上の最終URL。失敗時は JSON `{ "error": "..." }`（HTML の 502 は返さない）

## Val Town

[`val-town/http-val.ts`](val-town/http-val.ts) を HTTP val に貼り付けてください。

必要な環境変数:

- `KERNEL_API_KEY`（スクショ用）
- `TMPDIR=/tmp`

撮影は Kernel 上で Playwright を実行し、Val 側では `playwright-core` を読み込みません。
