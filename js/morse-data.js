// ============================================================
// Morse Maps
// ============================================================
const INTL_CHAR_TO_MORSE = {
  'A':'.-','B':'-...','C':'-.-.','D':'-..','E':'.','F':'..-.','G':'--.','H':'....',
  'I':'..','J':'.---','K':'-.-','L':'.-..','M':'--','N':'-.','O':'---','P':'.--.',
  'Q':'--.-','R':'.-.','S':'...','T':'-','U':'..-','V':'...-','W':'.--','X':'-..-',
  'Y':'-.--','Z':'--..',
  '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-',
  '5':'.....','6':'-....','7':'--...','8':'---..','9':'----.',
  '.':'.-.-.-',',':'--..--','?':'..--..','!':'-.-.--','/':'-..-.',
  '(':'-.--.',')':'-.--.-','&':'.-...',':':'---...',';':'-.-.-.',
  '=':'-...-','+':'.-.-.','"':'.-..-.','\'':'.----.',
  '@':'.--.-.','_':'..--.-'
};

const JA_CHAR_TO_MORSE = {
  'ア':'--.--','イ':'.-','ウ':'..-','エ':'-.---','オ':'.-...',
  'カ':'.-..','キ':'-.-..','ク':'...-','ケ':'-.--','コ':'----',
  'サ':'-.-.-','シ':'--.-.' ,'ス':'---.-','セ':'.---.','ソ':'---.',
  'タ':'-.','チ':'..-.','ツ':'.--.','テ':'.-.--','ト':'..-..',
  'ナ':'.-.','ニ':'-.-.','ヌ':'....','ネ':'--.-','ノ':'..--',
  'ハ':'-...','ヒ':'--..-','フ':'--..','ヘ':'.','ホ':'-..',
  'マ':'-..-','ミ':'..-.-','ム':'-','メ':'-...-','モ':'-..-.',
  'ヤ':'.--','ユ':'-..--','ヨ':'--',
  'ラ':'...','リ':'--.','ル':'-.--.','レ':'---','ロ':'.-.-',
  'ワ':'-.-','ヲ':'.---','ン':'.-.-.',
  '゛':'..','゜':'..--.',
  'ー':'.--.-',
  '。':'.-.-..','、':'.-.-.-',
  '（':'-.--.-.','）':'.-..-.',
};

// Prosigns: encode & decode (sent as single unit, no inter-char gap)
const PROSIGNS = {
  '[AR]': '.-.-.',     // End of message
  '[SK]': '...-.-',    // End of contact
  '[BT]': '-...-',     // Break/pause (same as '=' but contextually different)
  '[KN]': '-.--.',     // Go ahead (named station only)
  '[AS]': '.-...',     // Wait
  '[SOS]': '...---...', // Distress
  '[HH]': '........',  // Error (8 dots)
  '[BK]': '-...-.-',   // Break-in
};

// Build reverse maps
const INTL_MORSE_TO_CHAR = {};
for (const [c, m] of Object.entries(INTL_CHAR_TO_MORSE)) INTL_MORSE_TO_CHAR[m] = c;
// Add prosigns to decode map (don't overwrite existing chars)
for (const [label, morse] of Object.entries(PROSIGNS)) {
  if (!INTL_MORSE_TO_CHAR[morse]) INTL_MORSE_TO_CHAR[morse] = label;
}
// Add prosigns to encode map
for (const [label, morse] of Object.entries(PROSIGNS)) {
  INTL_CHAR_TO_MORSE[label] = morse;
}

const JA_MORSE_TO_CHAR = {};
for (const [c, m] of Object.entries(JA_CHAR_TO_MORSE)) JA_MORSE_TO_CHAR[m] = c;

// ============================================================
// Japanese Dakuten / Compose Maps
// ============================================================
const DAKUTEN_MAP = {
  'ガ':'カ゛','ギ':'キ゛','グ':'ク゛','ゲ':'ケ゛','ゴ':'コ゛',
  'ザ':'サ゛','ジ':'シ゛','ズ':'ス゛','ゼ':'セ゛','ゾ':'ソ゛',
  'ダ':'タ゛','ヂ':'チ゛','ヅ':'ツ゛','デ':'テ゛','ド':'ト゛',
  'バ':'ハ゛','ビ':'ヒ゛','ブ':'フ゛','ベ':'ヘ゛','ボ':'ホ゛','ヴ':'ウ゛',
  'パ':'ハ゜','ピ':'ヒ゜','プ':'フ゜','ペ':'ヘ゜','ポ':'ホ゜',
};
const COMPOSE_MAP = {};
for (const [k, v] of Object.entries(DAKUTEN_MAP)) COMPOSE_MAP[v] = k;

// ============================================================
// Abbreviation Data
// ============================================================
const ABBREV_INTL = [
  { group: 'Qコード — 交信管理', items: [
    { code: 'QRA', meaning: '局名は〜です' },
    { code: 'QRG', meaning: '周波数は〜です' },
    { code: 'QRL', meaning: 'この周波数は使用中です' },
    { code: 'QRM', meaning: '混信があります' },
    { code: 'QRN', meaning: '静電雑音があります' },
    { code: 'QRO', meaning: '送信出力を上げてください' },
    { code: 'QRP', meaning: '送信出力を下げてください' },
    { code: 'QRQ', meaning: 'もっと速く送ってください' },
    { code: 'QRS', meaning: 'もっとゆっくり送ってください' },
    { code: 'QRT', meaning: '送信を終了します' },
    { code: 'QRU', meaning: 'お伝えすることはありません' },
    { code: 'QRV', meaning: '準備できています' },
    { code: 'QRX', meaning: 'お待ちください' },
    { code: 'QRZ', meaning: '誰が呼んでいますか？' },
  ]},
  { group: 'Qコード — 交信内容', items: [
    { code: 'QSA', meaning: '信号の強さは〜です（1-5）' },
    { code: 'QSB', meaning: '信号がフェーディングしています' },
    { code: 'QSL', meaning: '受信確認しました' },
    { code: 'QSO', meaning: '〜と交信できます' },
    { code: 'QSY', meaning: '周波数を変更してください' },
    { code: 'QTC', meaning: '送信すべき通報があります' },
    { code: 'QTH', meaning: '私の場所は〜です' },
    { code: 'QTR', meaning: '正確な時刻は〜です' },
  ]},
  { group: '運用略語 — 基本', items: [
    { code: 'CQ', meaning: '各局、応答求む' },
    { code: 'DE', meaning: 'こちらは（発信者識別）' },
    { code: 'K', meaning: 'どうぞ（送信してください）' },
    { code: 'R', meaning: '了解（Roger）' },
    { code: 'RST', meaning: '了解度・信号強度・音調（信号レポート）' },
    { code: 'DX', meaning: '遠距離交信' },
    { code: 'WX', meaning: '天気（Weather）' },
  ]},
  { group: '運用略語 — 会話', items: [
    { code: 'AGN', meaning: 'もう一度（Again）' },
    { code: 'CFM', meaning: '確認する（Confirm）' },
    { code: 'CL', meaning: '局を閉じます（Closing）' },
    { code: 'DR', meaning: '親愛なる（Dear）' },
    { code: 'ES', meaning: '〜と（And）' },
    { code: 'FB', meaning: '素晴らしい（Fine Business）' },
    { code: 'GA', meaning: 'こんにちは / どうぞ（Go Ahead）' },
    { code: 'GE', meaning: 'こんばんは（Good Evening）' },
    { code: 'GM', meaning: 'おはよう（Good Morning）' },
    { code: 'GN', meaning: 'おやすみ（Good Night）' },
    { code: 'HI', meaning: '笑い（hi hi = ハハ）' },
    { code: 'HR', meaning: 'ここ（Here）' },
    { code: 'HW', meaning: 'いかがですか？（How?）' },
    { code: 'NR', meaning: '番号（Number）' },
    { code: 'OM', meaning: '男性局（Old Man）' },
    { code: 'PSE', meaning: 'お願いします（Please）' },
    { code: 'RPT', meaning: '繰り返してください（Repeat）' },
    { code: 'TNX', meaning: 'ありがとう（Thanks）' },
    { code: 'UR', meaning: 'あなたの（Your）' },
    { code: 'YL', meaning: '女性局（Young Lady）' },
    { code: 'XYL', meaning: '妻（Ex-Young Lady）' },
  ]},
  { group: '数字略語', items: [
    { code: '55', meaning: '成功を祈る' },
    { code: '72', meaning: 'QRP局同士の敬意' },
    { code: '73', meaning: '敬具（Best Regards）' },
    { code: '88', meaning: '愛を込めて（Love and Kisses）' },
    { code: '99', meaning: '立ち去れ（退去要求）' },
  ]},
  { group: 'プロサイン（文字間スペースなし）', note: '入力: [AR] [SK] 等の括弧付きで変換可能', items: [
    { code: '[AR]', meaning: '送信終了', morse: '.-.-.' },
    { code: '[SK]', meaning: '交信終了（Silent Key）', morse: '...-.-' },
    { code: '[BT]', meaning: '区切り（段落区切り）', morse: '-...-' },
    { code: '[KN]', meaning: '指名局のみどうぞ', morse: '-.--.' },
    { code: '[AS]', meaning: 'お待ちください', morse: '.-...' },
    { code: '[SOS]', meaning: '遭難信号', morse: '...---...' },
    { code: '[HH]', meaning: '訂正（打ち間違い）', morse: '........' },
    { code: '[BK]', meaning: 'ブレークイン（割り込み）', morse: '-...-.-' },
  ]},
  { group: '会話例', items: [
    { code: 'CQ CQ CQ DE JA1XXX K', meaning: '各局各局、こちらJA1XXX、どうぞ' },
    { code: 'JA1XXX DE JA2YYY GM', meaning: 'JA1XXX、こちらJA2YYY、おはよう' },
    { code: 'RST 599 QTH TOKYO', meaning: '信号レポート599、場所は東京' },
    { code: 'R TNX FB QSO 73', meaning: '了解、素晴らしい交信をありがとう、敬具' },
    { code: 'PSE QRS', meaning: 'もう少しゆっくりお願いします' },
    { code: '[AR] [SK]', meaning: '送信終了、交信終了' },
  ]},
];
const ABBREV_JA = [
  { group: '和文特有の符号', items: [
    { code: 'ホレ', meaning: '注意（これから和文を送ります）', morse: '-.. .-. -..' },
    { code: 'ラタ', meaning: '和文終了', morse: '... -..-.' },
    { code: 'オワリ', meaning: '通信終了', morse: '-.--- .-- .-. ..' },
  ]},
  { group: 'Qコード（和文交信でも使用）', items: [
    { code: 'QTH', meaning: '私の場所は〜です' },
    { code: 'QSL', meaning: '受信確認しました' },
    { code: 'QRZ', meaning: '誰が呼んでいますか？' },
    { code: 'QRS', meaning: 'もっとゆっくり送って' },
    { code: 'QRT', meaning: '送信を終了します' },
    { code: 'QRV', meaning: '準備できています' },
  ]},
  { group: '数字略語（共通）', items: [
    { code: '73', meaning: '敬具（Best Regards）' },
    { code: '88', meaning: '愛を込めて' },
  ]},
];

// ============================================================
// Preset Data
// ============================================================
const PRESETS_INTL = [
  { label: '[SOS]', text: '[SOS]' },
  { label: 'SOS', text: 'SOS' },
  { label: 'CQ呼出', text: 'CQ CQ CQ DE JA1XXX K' },
  { label: '73', text: '73' },
  { label: 'HELLO', text: 'HELLO' },
  { label: 'TNX FB', text: 'TNX FB' },
  { label: '[AR] [SK]', text: '[AR] [SK]' },
];
const PRESETS_JA = [
  { label: 'ホレ（注意）', text: 'ホレ' },
  { label: 'ラタ（終了）', text: 'ラタ' },
  { label: 'SOS', text: 'エスオーエス' },
  { label: 'アリガトウ', text: 'アリガトウ' },
  { label: 'コンニチハ', text: 'コンニチハ' },
  { label: 'サヨウナラ', text: 'サヨウナラ' },
  { label: 'タスケテ', text: 'タスケテ' },
  { label: 'ハイ／イイエ', text: 'ハイ イイエ' },
];
