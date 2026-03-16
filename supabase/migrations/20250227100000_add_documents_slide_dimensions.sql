-- 資料のスライドサイズ（PDF生成時の幅・高さ）を資料ごとに保持する
-- 既存資料は 1200x675 のまま、新規は 2667x1500 をデフォルトとする

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS slide_width INT,
  ADD COLUMN IF NOT EXISTS slide_height INT;

-- 既存行を従来の 1200x675 に設定（互換性維持）
UPDATE public.documents
SET slide_width = 1200, slide_height = 675
WHERE slide_width IS NULL OR slide_height IS NULL;

-- 新規挿入時のデフォルトを 2667x1500 に設定
ALTER TABLE public.documents
  ALTER COLUMN slide_width SET DEFAULT 2667,
  ALTER COLUMN slide_height SET DEFAULT 1500;

COMMENT ON COLUMN public.documents.slide_width IS 'スライド幅（px）。PDF生成時の viewport と用紙サイズに使用。デフォルト 2667。';
COMMENT ON COLUMN public.documents.slide_height IS 'スライド高さ（px）。PDF生成時の viewport と用紙サイズに使用。デフォルト 1500。';
