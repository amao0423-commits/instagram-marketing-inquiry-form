-- leadsテーブルにステータス管理フィールド追加
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT '未対応',
ADD COLUMN IF NOT EXISTS memo TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 既存行の updated_at を created_at で埋める
UPDATE leads SET updated_at = created_at WHERE updated_at IS NULL;

-- 更新日時の自動更新トリガー用関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 既存トリガーがあれば削除してから作成
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;

CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
