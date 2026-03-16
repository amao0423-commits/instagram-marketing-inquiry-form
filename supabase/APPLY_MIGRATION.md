# マイグレーションの適用方法

## 方法1: Supabase ダッシュボードで実行（推奨）

1. [Supabase ダッシュボード](https://app.supabase.com) にログイン
2. 対象プロジェクトを選択
3. 左メニューから **「SQL Editor」** をクリック
4. **「New query」** をクリック
5. 以下のファイルの内容をすべてコピーして貼り付け：
   - `migrations/20250228000000_refactor_to_file_upload.sql`
6. **「Run」** をクリックして実行
7. エラーがなければ「Success」と表示されます

## 方法2: Supabase CLI で実行

プロジェクトが `supabase link` 済みの場合：

```bash
npx supabase db push
```

未リンクの場合は、先に以下を実行してください：

```bash
npx supabase link --project-ref <あなたのプロジェクトID>
```

プロジェクトIDは Supabase ダッシュボードの「Project Settings」→「General」で確認できます。
