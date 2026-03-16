-- フォームの選択肢（REQUESTED_DOCUMENT_OPTIONS）とテンプレートを紐付ける document_type、
-- および PDF 生成元の markdown_content を email_templates に追加

-- document_type: フォームで選択された資料名（例: "COCOマーケサービス資料"）と一致させてテンプレートを取得する用。一意制約。
ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS document_type TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS email_templates_document_type_key
  ON public.email_templates (document_type)
  WHERE document_type IS NOT NULL;

COMMENT ON COLUMN public.email_templates.document_type IS 'フォームの「ご希望資料」の選択値と一致させる識別子（例: COCOマーケサービス資料）。一意。';

-- markdown_content: PDF 生成の元となる Markdown 本文
ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS markdown_content TEXT;

COMMENT ON COLUMN public.email_templates.markdown_content IS 'PDF 生成の元となる Markdown 本文';

-- 既存のテンプレートが1件のみの場合、フォームの選択肢「COCOマーケサービス資料」と紐付ける（任意）
-- 複数テンプレートがある場合は管理画面などで document_type を設定すること
UPDATE public.email_templates
SET document_type = 'COCOマーケサービス資料'
WHERE document_type IS NULL
  AND (SELECT COUNT(*) FROM public.email_templates) = 1;
