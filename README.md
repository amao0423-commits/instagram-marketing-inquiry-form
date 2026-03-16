# 資料請求システム

Next.js (App Router) + Supabase + SendGrid で構築された資料請求システムです。

## 初期設定

### 1. 環境変数の設定

プロジェクト直下に `.env.local` があります。次の値を取得して、`your-...` の部分を実際の値に置き換えてください。

| 変数 | 取得場所 |
|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase ダッシュボード → **Project Settings** → **API** → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 同上 → Project API keys の **anon** **public** |
| `SUPABASE_SERVICE_ROLE_KEY` | 同上 → **service_role**（管理者機能・CSV エクスポート用。厳重に管理すること） |
| `SENDGRID_API_KEY` | [SendGrid](https://sendgrid.com) → Settings → API Keys で作成 |
| `SENDGRID_FROM_EMAIL` | SendGrid で認証した送信元メールアドレス |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY` | [reCAPTCHA 管理コンソール](https://www.google.com/recaptcha/admin) で v3 サイトを登録（任意。未設定なら検証はスキップ） |

- **送信を試すために必須なのは Supabase の 2 つ**（`NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY`）です。
- SendGrid を未設定にすると、リードは DB に保存されますがメール送信はスキップされます。

### 2. Supabase でテーブルを作成

Supabase ダッシュボードで **SQL Editor** を開き、次の順で SQL を実行してください。

1. **テーブルとポリシーの作成**  
   `supabase/migrations/20250218100000_init_contact_tables.sql` の内容をコピーして実行します。  
   - `leads` と `email_templates` が作成され、フォーム送信用の RLS ポリシーが付きます。  
   - 初期メールテンプレートが 1 件挿入されます（送信 API が 1 件取得するため必須）。

2. **既存マイグレーションがある場合**  
   すでに `leads` がある場合は、`supabase/migrations/20250219000000_add_leads_status_memo_updated_at.sql` と `20250220100000_add_email_templates_body_md.sql` を必要に応じて実行してください。

### 3. Storage バケット（資料URL配布用・任意）

資料のURLを直接配布する場合は、Supabase の **Storage** でバケットを作成します。

1. Supabase ダッシュボードで **Storage** → **New Bucket** をクリック
2. 名前を **documents** に設定
3. **Public bucket** にチェックを入れる
4. **Create bucket** をクリック
5. 作成した **documents** バケットを開き、**Policies** タブで:
   - **New Policy** から「誰でも読める」用に **SELECT** のみ許可するポリシーを追加（または「For full customization」で `bucket_id = 'documents'` の SELECT を許可）
   - **INSERT** と **UPDATE** 用のポリシーは追加しない（管理画面からのアップロードはサーバー側の service role で行うため、一般ユーザーには許可しない）

マイグレーションで行う場合は `supabase/migrations/20250219100000_storage_bucket_documents.sql` を適用してください（リモートで失敗する場合は上記コンソール手順で設定）。

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

## プロジェクト構成

- `lib/supabase.ts` - Supabase クライアント設定
- `lib/sendgrid.ts` - SendGrid クライアント設定
- `lib/validation.ts` - Zod によるバリデーションスキーマと型定義
- `app/` - Next.js App Router のページとコンポーネント

## 技術スタック

- **Next.js 15** - React フレームワーク (App Router)
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **Supabase** - バックエンド（PostgreSQL データベース）
- **SendGrid** - メール送信
- **React Hook Form** - フォーム管理
- **Zod** - スキーマバリデーション
- **Lucide React** - アイコン

## 次のステップ

1. 資料請求フォームの作成
2. API Route の実装（フォーム送信処理）
3. メールテンプレートの作成
4. 管理画面の構築
