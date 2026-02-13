// ============================================================
// Morse Translator — Internationalization (i18n)
// ============================================================

const I18N = {
  ja: {
    // Consent screen
    'consent.org': '特定非営利活動法人リハビリコラボレーション',
    'consent.terms': '利用規約',
    'consent.intro': '本アプリ（以下「本サービス」）は、特定非営利活動法人リハビリコラボレーション（以下「当法人」）が提供するモールス信号変換ツールです。本サービスの利用にあたり、以下の事項に同意いただく必要があります。',
    'consent.article1.title': '第1条（サービス内容）',
    'consent.article1.body': '本サービスは、テキストとモールス信号の相互変換、音声・光・タップ・マイクによる入出力機能を提供します。すべての処理はお使いの端末上で完結し、外部サーバーへのデータ送信は行いません。',
    'consent.article2.title': '第2条（利用条件）',
    'consent.article2.body': '本サービスは無料でご利用いただけます。商用・非商用を問わず自由にご利用いただけますが、本サービスそのものの再配布は禁止します。',
    'consent.article3.title': '第3条（免責事項）',
    'consent.article3.body': '当法人は、本サービスの正確性、完全性、有用性について一切保証しません。本サービスの利用により生じた損害について、当法人は責任を負いません。モールス信号の送受信に関する法規制は利用者の責任において遵守してください。',
    'consent.article4.title': '第4条（プライバシー）',
    'consent.article4.body': '本サービスは個人情報を収集しません。設定値は端末のローカルストレージに保存され、外部に送信されることはありません。',
    'consent.article5.title': '第5条（変更）',
    'consent.article5.body': '当法人は、本規約を予告なく変更できるものとします。変更後の規約は本サービス上に表示した時点で効力を生じます。',
    'consent.agree': '上記の利用規約に同意します',
    'consent.start': '利用開始',

    // Tabs
    'tab.encode': '変換',
    'tab.decode': '解読',
    'tab.ref': '一覧表',

    // Encode
    'label.input': '入力テキスト',
    'label.morse': 'モールスコード',
    'placeholder.encode': '変換結果がここに表示されます',
    'label.play': '再生',
    'label.speed': '速度',
    'status.waiting': '待機中',
    'status.sound': '音で再生中...',
    'status.light': '光で再生中...',

    // Decode
    'label.mode': '入力モード',
    'mode.text': 'テキスト',
    'mode.tap': 'タップ',
    'mode.mic': 'マイク',
    'mode.cam': 'ライト',
    'button.decode': '解読',
    'label.result': '解読結果',
    'placeholder.result': '解読結果がここに表示されます',

    // Tap
    'placeholder.tap': 'ボタンを押してモールスを入力',
    'tap.hold_hint': '短く押す＝短点　長く押す＝長点',
    'tap.split_hint': '拍手・太鼓など長短を分けて入力',
    'button.tap_mode_split': '⇄ 2ボタンモード',
    'button.tap_mode_hold': '⇄ 長押しモード',
    'button.space': '区切り',
    'button.word': '単語',
    'button.undo': '戻す',
    'button.clear': '消去',

    // Mic
    'label.volume': '音量',
    'label.threshold': 'しきい値',
    'button.auto': '自動',
    'button.manual': '手動',
    'button.mic_start': '録音開始',
    'button.stop': '停止',
    'placeholder.mic': 'マイクで音を入力',
    'alert.mic_denied': 'マイクへのアクセスが許可されませんでした',

    // Camera
    'label.brightness': '明るさ',
    'button.cam_start': 'カメラ開始',
    'placeholder.cam': 'カメラで光を検出',
    'alert.cam_denied': 'カメラへのアクセスが許可されませんでした',

    // Reference
    'label.ref_title': 'モールスコード一覧',
    'label.abbrev': '略語・Qコード',
    'th.code': '符号',
    'th.meaning': '意味',
    'th.morse': 'モールス',

    // Settings
    'settings.title': '設定',
    'settings.freq': '周波数',
    'settings.speed': '速度',
    'settings.light_mode': 'ライトモード',
    'settings.show_terms': '利用規約を表示',
    'settings.close': '閉じる',
    'settings.btn_title': '設定',

    // Placeholders (morse mode specific)
    'placeholder.encode_ja': '変換したいテキストを入力...\n例: コンニチハ セカイ',
    'placeholder.encode_intl': '変換したいテキストを入力...\n例: HELLO WORLD',
    'placeholder.decode_ja': 'モールスコードを入力...\n例: ---- .-.-. -.-. ..-. -...',
    'placeholder.decode_intl': 'モールスコードを入力...\n例: .... . .-.. .-.. --- / .-- --- .-. .-.. -..',
    'info.decode_ja': '<code>.</code>(短点) <code>-</code>(長点) | スペース=文字区切り | <code>/</code>=単語区切り<br>濁音: 文字 + <code>..</code> | 半濁音: 文字 + <code>..--.</code>',
    'info.decode_intl': '<code>.</code>(短点) <code>-</code>(長点) | スペース=文字区切り | <code>/</code>=単語区切り',

    // Footer
    'footer': 'Morse Translator v2.0 — 特定非営利活動法人リハビリコラボレーション',

    // Language switch button label
    'lang.switch': 'EN',
  },
  en: {
    // Consent screen
    'consent.org': 'NPO Rehabilitation Collaboration',
    'consent.terms': 'Terms of Service',
    'consent.intro': 'This application ("the Service") is a Morse code conversion tool provided by NPO Rehabilitation Collaboration ("the Organization"). You must agree to the following terms to use the Service.',
    'consent.article1.title': 'Article 1 (Service Description)',
    'consent.article1.body': 'The Service provides mutual conversion between text and Morse code, with input/output via sound, light, tapping, and microphone. All processing is done entirely on your device, and no data is transmitted to external servers.',
    'consent.article2.title': 'Article 2 (Terms of Use)',
    'consent.article2.body': 'The Service is free to use for both commercial and non-commercial purposes. However, redistribution of the Service itself is prohibited.',
    'consent.article3.title': 'Article 3 (Disclaimer)',
    'consent.article3.body': 'The Organization makes no guarantees regarding the accuracy, completeness, or usefulness of the Service. The Organization is not liable for any damages arising from use of the Service. Compliance with laws regarding Morse code transmission is the user\'s responsibility.',
    'consent.article4.title': 'Article 4 (Privacy)',
    'consent.article4.body': 'The Service does not collect personal information. Settings are stored in your device\'s local storage and are never transmitted externally.',
    'consent.article5.title': 'Article 5 (Changes)',
    'consent.article5.body': 'The Organization may change these terms without prior notice. Revised terms take effect when displayed on the Service.',
    'consent.agree': 'I agree to the terms of service above',
    'consent.start': 'Start',

    // Tabs
    'tab.encode': 'Convert',
    'tab.decode': 'Decode',
    'tab.ref': 'Reference',

    // Encode
    'label.input': 'Input Text',
    'label.morse': 'Morse Code',
    'placeholder.encode': 'Conversion result appears here',
    'label.play': 'Play',
    'label.speed': 'Speed',
    'status.waiting': 'Ready',
    'status.sound': 'Playing sound...',
    'status.light': 'Playing light...',

    // Decode
    'label.mode': 'Input Mode',
    'mode.text': 'Text',
    'mode.tap': 'Tap',
    'mode.mic': 'Mic',
    'mode.cam': 'Light',
    'button.decode': 'Decode',
    'label.result': 'Result',
    'placeholder.result': 'Decoded result appears here',

    // Tap
    'placeholder.tap': 'Press the button to input Morse',
    'tap.hold_hint': 'Short press = dit    Long press = dah',
    'tap.split_hint': 'Input dits and dahs separately',
    'button.tap_mode_split': '⇄ 2-Button Mode',
    'button.tap_mode_hold': '⇄ Hold Mode',
    'button.space': 'Char',
    'button.word': 'Word',
    'button.undo': 'Undo',
    'button.clear': 'Clear',

    // Mic
    'label.volume': 'Volume',
    'label.threshold': 'Threshold',
    'button.auto': 'Auto',
    'button.manual': 'Manual',
    'button.mic_start': 'Start Mic',
    'button.stop': 'Stop',
    'placeholder.mic': 'Detect sound via mic',
    'alert.mic_denied': 'Microphone access was denied',

    // Camera
    'label.brightness': 'Brightness',
    'button.cam_start': 'Start Camera',
    'placeholder.cam': 'Detect light via camera',
    'alert.cam_denied': 'Camera access was denied',

    // Reference
    'label.ref_title': 'Morse Code Reference',
    'label.abbrev': 'Abbreviations & Q-Codes',
    'th.code': 'Code',
    'th.meaning': 'Meaning',
    'th.morse': 'Morse',

    // Settings
    'settings.title': 'Settings',
    'settings.freq': 'Frequency',
    'settings.speed': 'Speed',
    'settings.light_mode': 'Light Mode',
    'settings.show_terms': 'Show Terms',
    'settings.close': 'Close',
    'settings.btn_title': 'Settings',

    // Placeholders (morse mode specific)
    'placeholder.encode_ja': 'Enter text to convert...\nEx: コンニチハ セカイ',
    'placeholder.encode_intl': 'Enter text to convert...\nEx: HELLO WORLD',
    'placeholder.decode_ja': 'Enter Morse code...\nEx: ---- .-.-. -.-. ..-. -...',
    'placeholder.decode_intl': 'Enter Morse code...\nEx: .... . .-.. .-.. --- / .-- --- .-. .-.. -..',
    'info.decode_ja': '<code>.</code>(dit) <code>-</code>(dah) | space = char separator | <code>/</code> = word separator<br>Dakuten: char + <code>..</code> | Handakuten: char + <code>..--.</code>',
    'info.decode_intl': '<code>.</code>(dit) <code>-</code>(dah) | space = char separator | <code>/</code> = word separator',

    // Footer
    'footer': 'Morse Translator v2.0 — NPO Rehabilitation Collaboration',

    // Language switch button label
    'lang.switch': 'JP',
  }
};

let uiLang = localStorage.getItem('morse_ui_lang') || 'ja';

function t(key) {
  return I18N[uiLang]?.[key] ?? I18N.ja[key] ?? key;
}

function translateDOM() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const attr = el.dataset.i18nAttr;
    if (attr === 'placeholder') el.placeholder = t(key);
    else if (attr === 'title') el.title = t(key);
    else if (attr === 'html') el.innerHTML = t(key);
    else el.textContent = t(key);
  });
}

function setUILang(lang) {
  uiLang = lang;
  localStorage.setItem('morse_ui_lang', lang);
  document.documentElement.lang = lang === 'ja' ? 'ja' : 'en';
  translateDOM();
  // Update dynamic text in app.js
  if (typeof updatePlaceholders === 'function') updatePlaceholders();
  if (typeof buildPresets === 'function') buildPresets();
  if (typeof buildRefGrid === 'function') buildRefGrid();
  if (typeof buildAbbrevSection === 'function') buildAbbrevSection();
  if (typeof refreshDynamicLabels === 'function') refreshDynamicLabels();
}
