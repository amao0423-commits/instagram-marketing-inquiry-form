-- Phase 1: markdown_content を slides（JSONB配列）に移行
-- 各スライド: { id: string, type: 'markdown' | 'html', content: string }

-- 1. slides カラム追加
ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS slides JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.email_templates.slides IS 'PDF用スライド配列。各要素は { id, type: "markdown"|"html", content }';

-- 2. 既存の markdown_content を slides に移行（NULL でない行のみ）
UPDATE public.email_templates
SET slides = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', 'markdown',
    'content', markdown_content
  )
)
WHERE markdown_content IS NOT NULL AND markdown_content <> '';

-- 3. markdown_content カラムを削除
ALTER TABLE public.email_templates
  DROP COLUMN IF EXISTS markdown_content;
