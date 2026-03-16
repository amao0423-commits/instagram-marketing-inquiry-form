-- 資料管理をファイルアップロード方式に変更し、メールテンプレートで複数資料選択を可能にする

-- 1. documents テーブルの変更
-- slides, slide_width, slide_height カラムを削除（スライド編集機能を廃止）
-- file_name, file_size, file_type カラムを追加（アップロードファイル情報を保存）
ALTER TABLE public.documents
  DROP COLUMN IF EXISTS slides,
  DROP COLUMN IF EXISTS slide_width,
  DROP COLUMN IF EXISTS slide_height;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS file_type TEXT;

COMMENT ON COLUMN public.documents.file_name IS 'アップロードされたファイル名';
COMMENT ON COLUMN public.documents.file_size IS 'ファイルサイズ（バイト）';
COMMENT ON COLUMN public.documents.file_type IS 'ファイルのMIMEタイプ';
COMMENT ON COLUMN public.documents.download_url IS 'Supabase Storage の公開URL';
COMMENT ON TABLE public.documents IS '資料。管理画面でファイルをアップロードし、Supabase Storage に保存。download_url にストレージの公開URLを保存する。';

-- 2. email_templates テーブルの変更
-- document_id (単一) を document_links (複数資料 + 表示名) に変更
-- is_published カラムを追加（登録確定フラグ）
ALTER TABLE public.email_templates
  DROP COLUMN IF EXISTS document_id;

ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS document_links JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.email_templates.document_links IS '紐付け資料の配列。各要素は { document_id: string, label: string }。label はメール内のボタンに表示する名前。';
COMMENT ON COLUMN public.email_templates.is_published IS '登録確定フラグ。true の場合のみフォームの「ご希望資料」選択肢に表示される。';

-- 3. email_templates から不要なカラムを削除
-- slides, body_md, markdown_content はスライド編集機能で使用していたため削除
ALTER TABLE public.email_templates
  DROP COLUMN IF EXISTS slides,
  DROP COLUMN IF EXISTS body_md,
  DROP COLUMN IF EXISTS markdown_content;

-- 4. インデックスの追加
-- is_published でフィルタリングすることが多いためインデックスを追加
CREATE INDEX IF NOT EXISTS email_templates_is_published_idx
  ON public.email_templates (is_published)
  WHERE is_published = true;
