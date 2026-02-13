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
  { group: { ja: 'Qコード — 交信管理', en: 'Q Codes — Station Management' }, items: [
    { code: 'QRA', meaning: { ja: '局名は〜です', en: 'My station name is...' } },
    { code: 'QRG', meaning: { ja: '周波数は〜です', en: 'Your frequency is...' } },
    { code: 'QRL', meaning: { ja: 'この周波数は使用中です', en: 'This frequency is in use' } },
    { code: 'QRM', meaning: { ja: '混信があります', en: 'Interference present' } },
    { code: 'QRN', meaning: { ja: '静電雑音があります', en: 'Static noise present' } },
    { code: 'QRO', meaning: { ja: '送信出力を上げてください', en: 'Increase transmitter power' } },
    { code: 'QRP', meaning: { ja: '送信出力を下げてください', en: 'Decrease transmitter power' } },
    { code: 'QRQ', meaning: { ja: 'もっと速く送ってください', en: 'Send faster' } },
    { code: 'QRS', meaning: { ja: 'もっとゆっくり送ってください', en: 'Send more slowly' } },
    { code: 'QRT', meaning: { ja: '送信を終了します', en: 'Stop sending' } },
    { code: 'QRU', meaning: { ja: 'お伝えすることはありません', en: 'I have nothing for you' } },
    { code: 'QRV', meaning: { ja: '準備できています', en: 'I am ready' } },
    { code: 'QRX', meaning: { ja: 'お待ちください', en: 'Stand by' } },
    { code: 'QRZ', meaning: { ja: '誰が呼んでいますか？', en: 'Who is calling me?' } },
  ]},
  { group: { ja: 'Qコード — 交信内容', en: 'Q Codes — Signal & Message' }, items: [
    { code: 'QSA', meaning: { ja: '信号の強さは〜です（1-5）', en: 'Signal strength is... (1-5)' } },
    { code: 'QSB', meaning: { ja: '信号がフェーディングしています', en: 'Signal is fading' } },
    { code: 'QSL', meaning: { ja: '受信確認しました', en: 'I acknowledge receipt' } },
    { code: 'QSO', meaning: { ja: '〜と交信できます', en: 'I can communicate with...' } },
    { code: 'QSY', meaning: { ja: '周波数を変更してください', en: 'Change frequency' } },
    { code: 'QTC', meaning: { ja: '送信すべき通報があります', en: 'I have messages for you' } },
    { code: 'QTH', meaning: { ja: '私の場所は〜です', en: 'My location is...' } },
    { code: 'QTR', meaning: { ja: '正確な時刻は〜です', en: 'The exact time is...' } },
  ]},
  { group: { ja: '運用略語 — 基本', en: 'Operating Abbreviations — Basic' }, items: [
    { code: 'CQ', meaning: { ja: '各局、応答求む', en: 'Calling any station' } },
    { code: 'DE', meaning: { ja: 'こちらは（発信者識別）', en: 'From (sender identification)' } },
    { code: 'K', meaning: { ja: 'どうぞ（送信してください）', en: 'Go ahead (over)' } },
    { code: 'R', meaning: { ja: '了解（Roger）', en: 'Roger (received)' } },
    { code: 'RST', meaning: { ja: '了解度・信号強度・音調（信号レポート）', en: 'Readability, Strength, Tone (signal report)' } },
    { code: 'DX', meaning: { ja: '遠距離交信', en: 'Long distance contact' } },
    { code: 'WX', meaning: { ja: '天気（Weather）', en: 'Weather' } },
  ]},
  { group: { ja: '運用略語 — 会話', en: 'Operating Abbreviations — Conversation' }, items: [
    { code: 'AGN', meaning: { ja: 'もう一度（Again）', en: 'Again' } },
    { code: 'CFM', meaning: { ja: '確認する（Confirm）', en: 'Confirm' } },
    { code: 'CL', meaning: { ja: '局を閉じます（Closing）', en: 'Closing station' } },
    { code: 'DR', meaning: { ja: '親愛なる（Dear）', en: 'Dear' } },
    { code: 'ES', meaning: { ja: '〜と（And）', en: 'And' } },
    { code: 'FB', meaning: { ja: '素晴らしい（Fine Business）', en: 'Fine Business (great!)' } },
    { code: 'GA', meaning: { ja: 'こんにちは / どうぞ（Go Ahead）', en: 'Good Afternoon / Go Ahead' } },
    { code: 'GE', meaning: { ja: 'こんばんは（Good Evening）', en: 'Good Evening' } },
    { code: 'GM', meaning: { ja: 'おはよう（Good Morning）', en: 'Good Morning' } },
    { code: 'GN', meaning: { ja: 'おやすみ（Good Night）', en: 'Good Night' } },
    { code: 'HI', meaning: { ja: '笑い（hi hi = ハハ）', en: 'Laughter (hi hi)' } },
    { code: 'HR', meaning: { ja: 'ここ（Here）', en: 'Here' } },
    { code: 'HW', meaning: { ja: 'いかがですか？（How?）', en: 'How?' } },
    { code: 'NR', meaning: { ja: '番号（Number）', en: 'Number' } },
    { code: 'OM', meaning: { ja: '男性局（Old Man）', en: 'Old Man (male operator)' } },
    { code: 'PSE', meaning: { ja: 'お願いします（Please）', en: 'Please' } },
    { code: 'RPT', meaning: { ja: '繰り返してください（Repeat）', en: 'Repeat' } },
    { code: 'TNX', meaning: { ja: 'ありがとう（Thanks）', en: 'Thanks' } },
    { code: 'UR', meaning: { ja: 'あなたの（Your）', en: 'Your' } },
    { code: 'YL', meaning: { ja: '女性局（Young Lady）', en: 'Young Lady (female operator)' } },
    { code: 'XYL', meaning: { ja: '妻（Ex-Young Lady）', en: 'Wife (Ex-Young Lady)' } },
  ]},
  { group: { ja: '数字略語', en: 'Numeric Codes' }, items: [
    { code: '55', meaning: { ja: '成功を祈る', en: 'Best success' } },
    { code: '72', meaning: { ja: 'QRP局同士の敬意', en: 'Best regards between QRP stations' } },
    { code: '73', meaning: { ja: '敬具（Best Regards）', en: 'Best Regards' } },
    { code: '88', meaning: { ja: '愛を込めて（Love and Kisses）', en: 'Love and Kisses' } },
    { code: '99', meaning: { ja: '立ち去れ（退去要求）', en: 'Go away' } },
  ]},
  { group: { ja: 'プロサイン（文字間スペースなし）', en: 'Prosigns (no inter-character space)' }, note: { ja: '入力: [AR] [SK] 等の括弧付きで変換可能', en: 'Input: type [AR] [SK] etc. with brackets to convert' }, items: [
    { code: '[AR]', meaning: { ja: '送信終了', en: 'End of message' }, morse: '.-.-.' },
    { code: '[SK]', meaning: { ja: '交信終了（Silent Key）', en: 'End of contact (Silent Key)' }, morse: '...-.-' },
    { code: '[BT]', meaning: { ja: '区切り（段落区切り）', en: 'Break / paragraph separator' }, morse: '-...-' },
    { code: '[KN]', meaning: { ja: '指名局のみどうぞ', en: 'Go ahead (named station only)' }, morse: '-.--.' },
    { code: '[AS]', meaning: { ja: 'お待ちください', en: 'Wait' }, morse: '.-...' },
    { code: '[SOS]', meaning: { ja: '遭難信号', en: 'Distress signal' }, morse: '...---...' },
    { code: '[HH]', meaning: { ja: '訂正（打ち間違い）', en: 'Error correction' }, morse: '........' },
    { code: '[BK]', meaning: { ja: 'ブレークイン（割り込み）', en: 'Break-in' }, morse: '-...-.-' },
  ]},
  { group: { ja: '会話例', en: 'Conversation Examples' }, items: [
    { code: 'CQ CQ CQ DE JA1XXX K', meaning: { ja: '各局各局、こちらJA1XXX、どうぞ', en: 'Calling all, this is JA1XXX, over' } },
    { code: 'JA1XXX DE JA2YYY GM', meaning: { ja: 'JA1XXX、こちらJA2YYY、おはよう', en: 'JA1XXX, this is JA2YYY, good morning' } },
    { code: 'RST 599 QTH TOKYO', meaning: { ja: '信号レポート599、場所は東京', en: 'Signal report 599, location Tokyo' } },
    { code: 'R TNX FB QSO 73', meaning: { ja: '了解、素晴らしい交信をありがとう、敬具', en: 'Roger, thanks for great QSO, best regards' } },
    { code: 'PSE QRS', meaning: { ja: 'もう少しゆっくりお願いします', en: 'Please send more slowly' } },
    { code: '[AR] [SK]', meaning: { ja: '送信終了、交信終了', en: 'End of message, end of contact' } },
  ]},
];
const ABBREV_JA = [
  { group: { ja: '和文特有の符号', en: 'Japanese-specific Codes' }, items: [
    { code: 'ホレ', meaning: { ja: '注意（これから和文を送ります）', en: 'Attention (switching to Japanese)' }, morse: '-.. .-. -..' },
    { code: 'ラタ', meaning: { ja: '和文終了', en: 'End of Japanese text' }, morse: '... -..-.' },
    { code: 'オワリ', meaning: { ja: '通信終了', en: 'End of transmission' }, morse: '-.--- .-- .-. ..' },
  ]},
  { group: { ja: 'Qコード（和文交信でも使用）', en: 'Q Codes (used in Japanese CW too)' }, items: [
    { code: 'QTH', meaning: { ja: '私の場所は〜です', en: 'My location is...' } },
    { code: 'QSL', meaning: { ja: '受信確認しました', en: 'I acknowledge receipt' } },
    { code: 'QRZ', meaning: { ja: '誰が呼んでいますか？', en: 'Who is calling me?' } },
    { code: 'QRS', meaning: { ja: 'もっとゆっくり送って', en: 'Send more slowly' } },
    { code: 'QRT', meaning: { ja: '送信を終了します', en: 'Stop sending' } },
    { code: 'QRV', meaning: { ja: '準備できています', en: 'I am ready' } },
  ]},
  { group: { ja: 'CW略語（和文交信でも使用）', en: 'CW Abbreviations (used in Japanese CW too)' }, note: { ja: '和文だと長い挨拶も、欧文略語なら短く送れます', en: 'Long Japanese greetings can be sent briefly using CW abbreviations' }, items: [
    { code: 'GM', meaning: { ja: 'おはよう（Good Morning）', en: 'Good Morning' } },
    { code: 'GA', meaning: { ja: 'こんにちは（Good Afternoon）', en: 'Good Afternoon' } },
    { code: 'GE', meaning: { ja: 'こんばんは（Good Evening）', en: 'Good Evening' } },
    { code: 'GN', meaning: { ja: 'おやすみ（Good Night）', en: 'Good Night' } },
    { code: 'TNX', meaning: { ja: 'ありがとう（Thanks）', en: 'Thanks' } },
    { code: 'FB', meaning: { ja: '素晴らしい（Fine Business）', en: 'Fine Business (great!)' } },
    { code: 'R', meaning: { ja: '了解（Roger）', en: 'Roger' } },
    { code: 'PSE', meaning: { ja: 'お願いします（Please）', en: 'Please' } },
    { code: 'OM', meaning: { ja: '男性局長さん（Old Man）', en: 'Old Man (male operator)' } },
    { code: 'YL', meaning: { ja: '女性局長さん（Young Lady）', en: 'Young Lady (female operator)' } },
  ]},
  { group: { ja: '数字略語（共通）', en: 'Numeric Codes (universal)' }, items: [
    { code: '73', meaning: { ja: '敬具（Best Regards）', en: 'Best Regards' } },
    { code: '88', meaning: { ja: '愛を込めて', en: 'Love and Kisses' } },
  ]},
];

// ============================================================
// Preset Data
// ============================================================
const PRESETS_INTL = [
  { label: '[SOS]', text: '[SOS]' },
  { label: 'SOS', text: 'SOS' },
  { label: { ja: 'CQ呼出', en: 'CQ Call' }, text: 'CQ CQ CQ DE JA1XXX K' },
  { label: '73', text: '73' },
  { label: 'HELLO', text: 'HELLO' },
  { label: 'TNX FB', text: 'TNX FB' },
  { label: '[AR] [SK]', text: '[AR] [SK]' },
];
const PRESETS_JA = [
  { label: { ja: 'ホレ（注意）', en: 'ホレ (Attn)' }, text: 'ホレ' },
  { label: { ja: 'ラタ（終了）', en: 'ラタ (End)' }, text: 'ラタ' },
  { label: 'SOS', text: 'エスオーエス' },
  { label: { ja: 'GM（おはよう）', en: 'GM (Morning)' }, text: 'GM' },
  { label: { ja: 'GA（こんにちは）', en: 'GA (Afternoon)' }, text: 'GA' },
  { label: { ja: 'GE（こんばんは）', en: 'GE (Evening)' }, text: 'GE' },
  { label: { ja: 'TNX（ありがとう）', en: 'TNX (Thanks)' }, text: 'TNX' },
  { label: '73', text: '73' },
];
