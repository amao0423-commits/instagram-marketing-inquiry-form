-- サイト設定（キー・値）。初期テンプレ本文などを管理画面から変更可能にする
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

COMMENT ON TABLE public.site_settings IS 'サイト設定。key: default_email_template_body_html で新規テンプレート作成時に使う初期本文HTMLを保存。';

-- RLS: 認証済みユーザーのみ読み書き（管理画面用。サービスロールでAPIから操作する想定）
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access to site_settings"
  ON public.site_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);
