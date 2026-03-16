-- PDF用Markdown本文を保存するカラム追加
ALTER TABLE email_templates
ADD COLUMN IF NOT EXISTS body_md TEXT;
