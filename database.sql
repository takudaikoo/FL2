-- ================================================
-- First Leaf Plan Estimator - Database Schema
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- Table: plans
-- ================================================
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('funeral', 'cremation')),
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- Table: items
-- ================================================
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  type TEXT NOT NULL CHECK (type IN ('included', 'checkbox', 'dropdown', 'tier_dependent', 'free_input')),
  base_price INTEGER,
  allowed_plans TEXT[] NOT NULL,
  tier_prices JSONB,
  options JSONB,
  details JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- Table: attendee_options
-- ================================================
CREATE TABLE IF NOT EXISTS attendee_options (
  tier TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- Row Level Security (RLS) Policies
-- ================================================

-- Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendee_options ENABLE ROW LEVEL SECURITY;

-- Read access for everyone (public viewing)
CREATE POLICY "Enable read access for all users" ON plans
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON items
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON attendee_options
  FOR SELECT USING (true);

-- Write access for authenticated users only
CREATE POLICY "Enable all for authenticated users only" ON plans
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users only" ON items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users only" ON attendee_options
  FOR ALL USING (auth.role() = 'authenticated');

-- ================================================
-- Initial Data - Plans
-- ================================================
INSERT INTO plans (id, name, price, category, description) VALUES
('a', '(a) 2日葬', 800000, 'funeral', '通夜・告別式を行う一般的な葬儀形式'),
('b', '(b) 1日葬', 500000, 'funeral', '通夜を行わず、告別式のみを1日で行う形式'),
('c', '(c) お別れ火葬式', 250000, 'cremation', '火葬前にお別れの時間を設ける形式'),
('d', '(d) 直葬のみ', 150000, 'cremation', '火葬のみを執り行う最もシンプルな形式')
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- Initial Data - Attendee Options
-- ================================================
INSERT INTO attendee_options (tier, label, description) VALUES
('A', '～10名', '家族のみ'),
('B', '11名～30名', '親族中心'),
('C', '31名～100名', '一般葬'),
('D', '自由入力 (100名～)', '大規模')
ON CONFLICT (tier) DO NOTHING;

-- ================================================
-- Initial Data - Items
-- ================================================

-- Included Items (1-4)
INSERT INTO items (id, name, description, type, allowed_plans) VALUES
(1, '火葬料金', '火葬にかかる基本的な料金です。', 'included', ARRAY['a','b','c','d']),
(2, '搬送料金', '最長20ｋｍ（出発地点～安置場所）（安置場所～火葬場）を含みます。', 'included', ARRAY['a','b','c','d']),
(3, '安置施設', '弊社にてお預かり安置室利用料が含まれます。', 'included', ARRAY['a','b','c','d']),
(4, 'ドライアイス', 'お預かり安置もしくはご自宅にてドライアイス処置を含みます。', 'included', ARRAY['a','b','c','d'])
ON CONFLICT (id) DO NOTHING;

-- Checkbox Items (5-7, 11-20)
INSERT INTO items (id, name, description, type, base_price, allowed_plans) VALUES
(5, '枕飾り', '白木机・香炉・リン・線香・ろうそくの一式です。', 'checkbox', 5000, ARRAY['a','b','c']),
(6, '役所・火葬場手続き代行', '役所に提出する死亡届、死亡診断書の代行を行います。', 'checkbox', 30000, ARRAY['a','b','c','d']),
(7, '納棺', '納棺士による清拭・着せ替え・メイクを行います。', 'checkbox', 30000, ARRAY['a','b']),
(11, '遺影写真', 'カラー額　四つ切サイズと手札サイズをご用意します。', 'checkbox', 5000, ARRAY['a','b','c','d']),
(12, '白木位牌', '一般的な白木のお位牌となります。', 'checkbox', 100000, ARRAY['a','b']),
(13, '線香・ろうそく・焼香セット', '一般的なお参りセットとなります。', 'checkbox', 5000, ARRAY['a','b']),
(14, '受付セット', '受付に必要な文具や芳名帳などのセット一式です。', 'checkbox', 30000, ARRAY['a','b']),
(15, '会葬礼状', 'オリジナル会葬礼状３０枚セットです。', 'checkbox', 20000, ARRAY['a','b']),
(16, 'お別れ用お盆花', 'お棺の中にお入れする生花(祭壇無しの場合は用意)です。', 'checkbox', 10000, ARRAY['c']),
(17, 'お別れ用花束', '火葬場にお持ちする花束です。', 'checkbox', 20000, ARRAY['a','b']),
(18, '後飾り祭壇', 'ご自宅で骨壺をお飾りする仮祭壇です。', 'checkbox', 100000, ARRAY['a','b']),
(19, '案内看板', '式場入口や祭壇横などに飾る看板です。', 'checkbox', 10000, ARRAY['a']),
(20, '司会進行・運営スタッフ', 'お葬式の司会・運営のサポートをいたします。', 'checkbox', 50000, ARRAY['a','b','c'])
ON CONFLICT (id) DO NOTHING;

-- Dropdown Items (8-10)
INSERT INTO items (id, name, description, type, allowed_plans, options) VALUES
(8, 'お棺・仏衣一式・布団', '故人様をお納めするお棺と旅支度一式です。', 'dropdown', ARRAY['a','b','c','d'],
  '[
    {"id": "purple", "name": "紫グレード", "price": 40000, "allowedPlans": ["b","c","d"]},
    {"id": "green", "name": "緑グレード", "price": 70000, "allowedPlans": ["a","b"]},
    {"id": "tsubaki", "name": "椿グレード", "price": 120000, "allowedPlans": ["a","b"]}
  ]'::jsonb),
(9, '生花祭壇', '式場を彩る生花祭壇です。', 'dropdown', ARRAY['a','b','c','d'],
  '[
    {"id": "purple", "name": "紫グレード", "price": 80000, "allowedPlans": ["b","c","d"]},
    {"id": "green", "name": "緑グレード", "price": 150000, "allowedPlans": ["a","b"]},
    {"id": "tsubaki", "name": "椿グレード", "price": 250000, "allowedPlans": ["a","b"]}
  ]'::jsonb),
(10, '骨壷・骨箱', 'ご遺骨を収める壺と箱です。', 'dropdown', ARRAY['a','b','c','d'],
  '[
    {"id": "purple", "name": "紫グレード", "price": 20000, "allowedPlans": ["b","c","d"]},
    {"id": "green", "name": "緑グレード", "price": 50000, "allowedPlans": ["a","b"]},
    {"id": "tsubaki", "name": "椿グレード", "price": 80000, "allowedPlans": ["a","b"]}
  ]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Tier Dependent Items (21-26)
INSERT INTO items (id, name, description, type, allowed_plans, tier_prices) VALUES
(21, '控室料金', 'ご親族様の控室利用料です。', 'tier_dependent', ARRAY['a','b','c'],
  '{"A": 50000, "B": 80000, "C": 150000, "D": 300000}'::jsonb),
(22, '斎場料金', '式場の利用料金です。', 'tier_dependent', ARRAY['a','b','c'],
  '{"A": 200000, "B": 500000, "C": 800000, "D": 1200000}'::jsonb),
(23, '会葬御礼品', '参列者へのお礼の品です。', 'tier_dependent', ARRAY['a','b'],
  '{"A": 200000, "B": 500000, "C": 800000, "D": 1200000}'::jsonb),
(24, '香典返し', '香典を頂いた方へのお返しです。', 'tier_dependent', ARRAY['a','b'],
  '{"A": 200000, "B": 500000, "C": 800000, "D": 1200000}'::jsonb),
(25, '供花', '祭壇にお供えするお花です。', 'tier_dependent', ARRAY['a','b'],
  '{"A": 50000, "B": 80000, "C": 150000, "D": 300000}'::jsonb),
(26, '料理', '通夜振る舞いや精進落としの料理です。', 'tier_dependent', ARRAY['a','b'],
  '{"A": 200000, "B": 500000, "C": 800000, "D": 1200000}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- Functions for updated_at trigger
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ================================================
-- Triggers for updated_at
-- ================================================
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


