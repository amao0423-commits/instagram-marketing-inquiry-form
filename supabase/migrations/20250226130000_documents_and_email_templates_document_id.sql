-- 資料テーブル（documents）: 管理トップで作成・一覧表示し、/admin/slides でスライド編集・PDF生成
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '無題',
  slides JSONB NOT NULL DEFAULT '[]'::jsonb,
  download_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.documents IS '資料。スライドは /admin/slides で編集し、PDFは 1200x675 で生成して download_url に保存する。';
COMMENT ON COLUMN public.documents.slides IS 'スライド配列。各要素は { id, type: "markdown"|"html", content }';

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 管理APIは service_role でアクセスするためポリシー不要（RLS有効で anon/authenticated はアクセス不可）

-- email_templates に資料への紐付けを追加
ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.email_templates.document_id IS '紐付け資料。資料を選択した場合に設定し、download_url はその資料のURLをコピーして利用する。';
