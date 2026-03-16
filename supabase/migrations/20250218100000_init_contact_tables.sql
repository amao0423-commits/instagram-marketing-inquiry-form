-- フォーム送信用：leads と email_templates の初期作成
-- 既存プロジェクトでテーブルがある場合はスキップされます

-- leads テーブル（お問い合わせ・資料請求のリード）
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  company_name TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  industry TEXT,
  position TEXT,
  purpose TEXT,
  concerns TEXT[],
  instagram_id TEXT,
  status TEXT NOT NULL DEFAULT '未対応',
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- email_templates テーブル（資料送信用メールテンプレート）
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_md TEXT,
  download_url TEXT NOT NULL,
  campaign_text TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS を有効化
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- フォーム送信（anon）: leads への INSERT を許可
DROP POLICY IF EXISTS "leads_anon_insert" ON public.leads;
CREATE POLICY "leads_anon_insert"
  ON public.leads FOR INSERT
  TO anon
  WITH CHECK (true);

-- フォーム送信（anon）: 最新テンプレート取得のため email_templates の SELECT を許可
DROP POLICY IF EXISTS "email_templates_anon_select" ON public.email_templates;
CREATE POLICY "email_templates_anon_select"
  ON public.email_templates FOR SELECT
  TO anon
  USING (true);

-- 初期メールテンプレートが1件もない場合のみ挿入（送信APIが1件取得するため必須）
INSERT INTO public.email_templates (subject, body_html, download_url, campaign_text)
SELECT
  '【資料】ご請求いただいた資料のダウンロード',
  '<p>{{name}} 様</p><p>お問い合わせありがとうございます。</p><p>資料のダウンロードは以下のURLからお願いいたします。</p><p><a href="{{downloadUrl}}">資料をダウンロード</a></p><p>{{campaignText}}</p>',
  'https://example.com/document.pdf',
  ''
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates LIMIT 1);
