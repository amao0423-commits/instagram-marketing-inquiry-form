-- Storage バケット "documents" 作成（Public、管理者のみ Upload/Update）
--
-- コンソールで行う場合: Storage > New Bucket > 名前 "documents" > Public にチェック
-- Policy は Storage > documents > Policies で以下を設定:
--   - SELECT: 誰でも可（資料URLを直接配布するため）
--   - INSERT / UPDATE: 追加しない（サーバー側の service role のみ可能）

-- バケット作成（既存の場合はスキップ）
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- 誰でも閲覧可能（Public バケットのため）
CREATE POLICY "documents_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

-- INSERT / UPDATE 用のポリシーはあえて作成しない。
-- 管理画面からのアップロード・更新はサーバー（getServerSupabase = service role）経由で行い、
-- service role は RLS をバイパスするため、管理者のみが実質的に Upload/Update 可能になる。
