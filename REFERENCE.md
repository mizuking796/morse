# Morse Translator — 技術リファレンス

## 概要
自然言語とモールス信号を双方向に変換するスマホ向けWebアプリ。
音・光・テキストの3系統で出力し、タップ・マイク・カメラライト・テキストの4系統で逆変換入力ができる。

## URL
- **公開URL**: `https://mizuking796.github.io/morse/`
- **GitHub**: `mizuking796/morse`
- **更新時はgit pushまで実施すること**

## バージョン
- **v2.2** (2026-02-13): カメラライト入力モード追加
- **v2.1** (2026-02-13): マイクWPM自動検出・手動調整、しきい値デフォルト調整
- **v2.0** (2026-02-13): ファイル分割・PWA化・同意画面・GitHub Pagesデプロイ
- **v1.4**: 和文モールス・コード一覧表・設定画面・ダークモード追加
- **v1.3**: マイク入力・波形表示
- **v1.2**: 光出力・タップ入力
- **v1.1**: 2ボタンモード・リアルタイムエンコード・速度途中変更
- **v1.0**: テキスト⇔モールス双方向変換（テキスト入出力 + 音再生）

## ファイル構成
```
morse/
├── index.html          — HTMLのみ（同意画面+アプリUI+PWAメタ+SW登録）
├── css/
│   └── style.css       — 全CSS（同意画面+アプリ+レスポンシブ）
├── js/
│   ├── morse-data.js   — データ定義（モールスマップ/略語/プリセット）204行
│   └── app.js          — アプリロジック全体（~1100行）
├── icons/
│   ├── icon.svg        — SVGファビコン（SOS + 電波モチーフ）
│   ├── icon-192.png    — PWA用192x192
│   └── icon-512.png    — PWA用512x512
├── manifest.json       — PWAマニフェスト
├── sw.js               — Service Worker（キャッシュ優先、ナビゲーションスキップ）
├── REQUIREMENTS.md     — 要件定義
└── REFERENCE.md        — 本ファイル
```

## 技術スタック
- 静的HTML/CSS/JS（フレームワーク不使用）
- Web Audio API（OscillatorNode + GainNode、正弦波）
- MediaStream API + AnalyserNode（マイク入力）
- MediaDevices.getUserMedia video（カメラライト入力）
- Canvas 2D（波形描画 + カメラ輝度解析）
- Vibration API（タップフィードバック）
- PWA（manifest.json + Service Worker）
- GitHub Pages デプロイ

## 対応モールス体系
| 体系 | 文字セット | 備考 |
|---|---|---|
| 国際モールス | A-Z, 0-9, 記号16種 | ITU-R M.1677 準拠 |
| 和文モールス | ア-ン, 濁音, 半濁音, 長音, 句読点 | カナ対応、ひらがな自動変換 |
| プロサイン | AR, SK, BT, KN, AS, SOS, HH, BK | `[XX]`括弧記法で入出力 |

## モールスタイミング（ITU準拠）
- 短点（dit）: 1単位
- 長点（dah）: 3単位
- 信号間（同一文字内）: 1単位
- 文字間: 3単位
- 単語間: 7単位
- 1単位 = 1200ms / WPM

## 主要機能
### エンコード（テキスト → モールス）
- リアルタイム変換（inputイベント、変換ボタン不要）
- `・ー`/`.-`表記切替
- 音再生（Web Audio API ビープ）
- 光再生（画面フラッシュ）
- 再生中ハイライト（モールス + 入力テキスト同期）
- **速度途中変更対応**（タイムラインは単位倍率保持、再生時にgetUnit()でms解決）
- プリセットボタン（[SOS]、CQ呼出、73など）

### デコード（モールス → テキスト）
4つの入力モード:

#### テキスト入力
- `.-`/`・ー`形式でモールスコードを直接入力
- スペース=文字区切り、`/`=単語区切り

#### タップ入力
- 長押しモード: 押下時間で短点/長点判定（ITU WPMベース）
- 2ボタンモード: ・/ーを個別ボタンで入力（拍手・太鼓対応）
- タップ専用WPMスライダー（デフォルト10 WPM）

#### マイク入力
- 音量しきい値超過でON/OFF判定（デフォルト15）
- リアルタイム波形描画（Canvas AnalyserNode）
- レベルバー + しきい値マーカー表示
- **WPM自動検出**: ON信号長をクラスタリング（最大比率ギャップ法）してdit/dah分離→unit推定
- 手動WPMスライダー切替可（3-25 WPM）
- 推定WPMリアルタイム表示（`~10 WPM`）

#### カメラライト入力
- 背面カメラ (`facingMode: 'environment'`) で映像取得
- 画面中央1/3領域の輝度解析（RGB→ITU BT.601 輝度: `R*0.299 + G*0.587 + B*0.114`）
- 明るさがしきい値を超えるとON（光あり）、下回るとOFF
- ON/OFFインジケーター（ビデオ右上の丸いドット）
- マイクと同じ自動WPM検出アルゴリズム + 手動切替
- 懐中電灯・スマホフラッシュライトのモールス信号を読み取り

### 適応型WPMアルゴリズム（マイク・カメラ共通）
```
getMicUnit() / getCamUnit():
1. ON信号の持続時間を蓄積（最新40件）
2. 昇順ソート
3. 隣接要素間の最大比率ギャップを探索
4. 比率 > 1.5 かつ分割点あり → 短いクラスタ = dit → 平均値 = 1unit
5. 明確な分離なし → 全信号同等と仮定 → 中央値 = 1unit
6. dit/dah閾値: unit * 2
7. 文字区切りタイマー: unit * 2（intra-char 1u と inter-char 3u の中間）
8. 単語区切りタイマー: unit * 5（inter-char 3u と word 7u の中間）
```

### 略語リファレンス
- 国際: Qコード(22種)、運用略語(27種)、数字略語(5種)、プロサイン(8種)、会話例(6種)
- 和文: 和文特有符号(3種)、Qコード(6種)、数字略語(2種)

### 設定
- 周波数: 400-1000Hz（デフォルト700Hz）
- 速度: 5-30 WPM（デフォルト15 WPM）
- ライトモード切替
- 利用規約再表示

## アーキテクチャ
### データ層（morse-data.js）
- `INTL_CHAR_TO_MORSE` / `JA_CHAR_TO_MORSE`: 正引きマップ
- `INTL_MORSE_TO_CHAR` / `JA_MORSE_TO_CHAR`: 逆引きマップ（自動構築）
- `PROSIGNS`: プロサイン8種（エンコードマップにも自動追加、デコードは非衝突のみ）
- `DAKUTEN_MAP` / `COMPOSE_MAP`: 濁音・半濁音分解/合成
- `ABBREV_INTL` / `ABBREV_JA`: 略語データ（グループ分け）
- `PRESETS_INTL` / `PRESETS_JA`: プリセットボタンデータ

### ロジック層（app.js）
1. 同意画面制御（localStorage `morse_consent`）
2. エンコード: `tokenize()` → `encodeText()` / `encodeTextMapped()`
3. デコード: `decodeMorse()`（濁音合成対応）
4. 再生: `buildTimeline()` → `playSound()` / `playLight()`（AbortController）
5. タップ: ITU WPMベースタイミング + 2ボタンモード
6. マイク: AnalyserNode → 音量検出 → 適応型WPM → モールス変換
7. カメラ: getUserMedia video → Canvas輝度解析 → 適応型WPM → モールス変換
8. UI: タブ切替、言語切替、プリセット、リファレンスグリッド

## 開発者
特定非営利活動法人リハビリコラボレーション

## 注意事項
- Service Workerはナビゲーションリクエストをスキップ（GitHub Pages pretty URLs対策）
- プロサインのデコードは非衝突のみ（`.-...`=`&`優先、`AR`/`SK`/`SOS`は追加）
- 和文はひらがな入力→カタカナ自動変換→濁音分解→モールス変換
- カメラライト入力はiOS Safari / Android Chromeで動作（getUserMedia video対応ブラウザ）
- マイク・カメラの自動WPM検出は最初の数信号で精度が上がる（最低3-4信号で安定）
