-- キャンペーンテキストを廃止し、メール本文では使用しない
ALTER TABLE public.email_templates
  DROP COLUMN IF EXISTS campaign_text;
