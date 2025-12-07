import { Plan, Item, AttendeeOption } from './types';

export const PLANS: Plan[] = [
  { id: 'a', name: '(a) 2日葬', price: 800000, category: 'funeral', description: '通夜・告別式を行う一般的な葬儀形式' },
  { id: 'b', name: '(b) 1日葬', price: 500000, category: 'funeral', description: '通夜を行わず、告別式のみを1日で行う形式' },
  { id: 'c', name: '(c) お別れ火葬式', price: 250000, category: 'cremation', description: '火葬前にお別れの時間を設ける形式' },
  { id: 'd', name: '(d) 直葬のみ', price: 150000, category: 'cremation', description: '火葬のみを執り行う最もシンプルな形式' },
];

export const ATTENDEE_OPTIONS: AttendeeOption[] = [
  { tier: 'A', label: '～10名', description: '家族のみ' },
  { tier: 'B', label: '11名～30名', description: '親族中心' },
  { tier: 'C', label: '31名～100名', description: '一般葬' },
  { tier: 'D', label: '自由入力 (100名～)', description: '大規模' },
];

// Helper for 'all plans'
const ALL_PLANS: ('a' | 'b' | 'c' | 'd')[] = ['a', 'b', 'c', 'd'];

export const ITEMS: Item[] = [
  // --- INCLUDED (1-4) ---
  {
    id: 1,
    name: '火葬料金',
    description: '火葬にかかる基本的な料金です。',
    type: 'included',
    allowedPlans: ALL_PLANS,
  },
  {
    id: 2,
    name: '搬送料金',
    description: '最長20ｋｍ（出発地点～安置場所）（安置場所～火葬場）を含みます。',
    type: 'included',
    allowedPlans: ALL_PLANS,
  },
  {
    id: 3,
    name: '安置施設',
    description: '弊社にてお預かり安置室利用料が含まれます。',
    type: 'included',
    allowedPlans: ALL_PLANS,
  },
  {
    id: 4,
    name: 'ドライアイス',
    description: 'お預かり安置もしくはご自宅にてドライアイス処置を含みます。',
    type: 'included',
    allowedPlans: ALL_PLANS,
  },

  // --- CHECKBOX OPTIONS (5-7, 11-20) ---
  {
    id: 5,
    name: '枕飾り',
    description: '白木机・香炉・リン・線香・ろうそくの一式です。',
    type: 'checkbox',
    basePrice: 5000,
    allowedPlans: ['a', 'b', 'c'],
  },
  {
    id: 6,
    name: '役所・火葬場手続き代行',
    description: '役所に提出する死亡届、死亡診断書の代行を行います。',
    type: 'checkbox',
    basePrice: 30000,
    allowedPlans: ALL_PLANS,
  },
  {
    id: 7,
    name: '納棺',
    description: '納棺士による清拭・着せ替え・メイクを行います。',
    type: 'checkbox',
    basePrice: 30000,
    allowedPlans: ['a', 'b'],
  },
  {
    id: 11,
    name: '遺影写真',
    description: 'カラー額　四つ切サイズと手札サイズをご用意します。',
    type: 'checkbox',
    basePrice: 5000,
    allowedPlans: ALL_PLANS,
  },
  {
    id: 12,
    name: '白木位牌',
    description: '一般的な白木のお位牌となります。',
    type: 'checkbox',
    basePrice: 100000,
    allowedPlans: ['a', 'b'],
  },
  {
    id: 13,
    name: '線香・ろうそく・焼香セット',
    description: '一般的なお参りセットとなります。',
    type: 'checkbox',
    basePrice: 5000,
    allowedPlans: ['a', 'b'],
  },
  {
    id: 14,
    name: '受付セット',
    description: '受付に必要な文具や芳名帳などのセット一式です。',
    type: 'checkbox',
    basePrice: 30000,
    allowedPlans: ['a', 'b'],
  },
  {
    id: 15,
    name: '会葬礼状',
    description: 'オリジナル会葬礼状３０枚セットです。',
    type: 'checkbox',
    basePrice: 20000,
    allowedPlans: ['a', 'b'],
  },
  {
    id: 16,
    name: 'お別れ用お盆花',
    description: 'お棺の中にお入れする生花(祭壇無しの場合は用意)です。',
    type: 'checkbox',
    basePrice: 10000,
    allowedPlans: ['c'],
  },
  {
    id: 17,
    name: 'お別れ用花束',
    description: '火葬場にお持ちする花束です。',
    type: 'checkbox',
    basePrice: 20000,
    allowedPlans: ['a', 'b'],
  },
  {
    id: 18,
    name: '後飾り祭壇',
    description: 'ご自宅で骨壺をお飾りする仮祭壇です。',
    type: 'checkbox',
    basePrice: 100000,
    allowedPlans: ['a', 'b'],
  },
  {
    id: 19,
    name: '案内看板',
    description: '式場入口や祭壇横などに飾る看板です。',
    type: 'checkbox',
    basePrice: 10000,
    allowedPlans: ['a'],
  },
  {
    id: 20,
    name: '司会進行・運営スタッフ',
    description: 'お葬式の司会・運営のサポートをいたします。',
    type: 'checkbox',
    basePrice: 50000,
    allowedPlans: ['a', 'b', 'c'],
  },

  // --- DROPDOWNS (8-10) ---
  {
    id: 8,
    name: 'お棺・仏衣一式・布団',
    description: '故人様をお納めするお棺と旅支度一式です。',
    type: 'dropdown',
    allowedPlans: ALL_PLANS,
    options: [
      { id: 'purple', name: '紫グレード', price: 40000, allowedPlans: ['b', 'c', 'd'] },
      { id: 'green', name: '緑グレード', price: 70000, allowedPlans: ['a', 'b'] },
      { id: 'tsubaki', name: '椿グレード', price: 120000, allowedPlans: ['a', 'b'] },
    ],
  },
  {
    id: 9,
    name: '生花祭壇',
    description: '式場を彩る生花祭壇です。',
    type: 'dropdown',
    allowedPlans: ALL_PLANS,
    options: [
      { id: 'purple', name: '紫グレード', price: 80000, allowedPlans: ['b', 'c', 'd'] },
      { id: 'green', name: '緑グレード', price: 150000, allowedPlans: ['a', 'b'] },
      { id: 'tsubaki', name: '椿グレード', price: 250000, allowedPlans: ['a', 'b'] },
    ],
  },
  {
    id: 10,
    name: '骨壷・骨箱',
    description: 'ご遺骨を収める壺と箱です。',
    type: 'dropdown',
    allowedPlans: ALL_PLANS,
    options: [
      { id: 'purple', name: '紫グレード', price: 20000, allowedPlans: ['b', 'c', 'd'] },
      { id: 'green', name: '緑グレード', price: 50000, allowedPlans: ['a', 'b'] },
      { id: 'tsubaki', name: '椿グレード', price: 80000, allowedPlans: ['a', 'b'] },
    ],
  },

  // --- TIER DEPENDENT (21-26) ---
  {
    id: 21,
    name: '控室料金',
    description: 'ご親族様の控室利用料です。',
    type: 'tier_dependent',
    allowedPlans: ['a', 'b', 'c'],
    tierPrices: { A: 50000, B: 80000, C: 150000, D: 300000 },
  },
  {
    id: 22,
    name: '斎場料金',
    description: '式場の利用料金です。',
    type: 'tier_dependent',
    allowedPlans: ['a', 'b', 'c'],
    tierPrices: { A: 200000, B: 500000, C: 800000, D: 1200000 },
  },
  {
    id: 23,
    name: '会葬御礼品',
    description: '参列者へのお礼の品です。',
    type: 'tier_dependent',
    allowedPlans: ['a', 'b'],
    tierPrices: { A: 200000, B: 500000, C: 800000, D: 1200000 },
  },
  {
    id: 24,
    name: '香典返し',
    description: '香典を頂いた方へのお返しです。',
    type: 'tier_dependent',
    allowedPlans: ['a', 'b'],
    tierPrices: { A: 200000, B: 500000, C: 800000, D: 1200000 },
  },
  {
    id: 25,
    name: '供花',
    description: '祭壇にお供えするお花です。',
    type: 'tier_dependent',
    allowedPlans: ['a', 'b'],
    tierPrices: { A: 50000, B: 80000, C: 150000, D: 300000 },
  },
  {
    id: 26,
    name: '料理',
    description: '通夜振る舞いや精進落としの料理です。',
    type: 'tier_dependent',
    allowedPlans: ['a', 'b'],
    tierPrices: { A: 200000, B: 500000, C: 800000, D: 1200000 },
  },
];
