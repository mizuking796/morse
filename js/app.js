// ============================================================
// Morse Translator — Application Logic
// ============================================================
// Depends on globals from morse-data.js:
//   INTL_CHAR_TO_MORSE, JA_CHAR_TO_MORSE, PROSIGNS,
//   INTL_MORSE_TO_CHAR, JA_MORSE_TO_CHAR,
//   DAKUTEN_MAP, COMPOSE_MAP,
//   ABBREV_INTL, ABBREV_JA,
//   PRESETS_INTL, PRESETS_JA
// ============================================================

// ============================================================
// Consent
// ============================================================
function hasConsent() { return !!localStorage.getItem('morse_consent'); }
function setConsent() { localStorage.setItem('morse_consent', new Date().toISOString().slice(0, 10)); }

if (hasConsent()) {
  document.getElementById('consent-screen').classList.add('hidden');
}
document.getElementById('consent-check').addEventListener('change', e => {
  document.getElementById('consent-btn').disabled = !e.target.checked;
});
document.getElementById('consent-btn').addEventListener('click', () => {
  setConsent();
  document.getElementById('consent-screen').classList.add('hidden');
});
document.getElementById('show-terms-btn')?.addEventListener('click', () => {
  document.getElementById('settings-modal').classList.remove('open');
  document.getElementById('consent-screen').classList.remove('hidden');
  document.getElementById('consent-check').checked = true;
  document.getElementById('consent-btn').disabled = false;
});

// ============================================================
// State
// ============================================================
let currentLang = 'intl';
let notation = 'dot';
let currentMorse = '';
let audioCtx = null;
let toneFreq = 700;

function getMap() { return currentLang === 'ja' ? JA_CHAR_TO_MORSE : INTL_CHAR_TO_MORSE; }
function getRMap() { return currentLang === 'ja' ? JA_MORSE_TO_CHAR : INTL_MORSE_TO_CHAR; }
function getWpm() { return parseInt(document.getElementById('wpm-slider').value); }
function getUnit() { return 1200 / getWpm(); }

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// ============================================================
// Japanese Helpers
// ============================================================
function hiraToKata(s) {
  return s.replace(/[\u3041-\u3096]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));
}

function decomposeJa(s) { return [...s].map(c => DAKUTEN_MAP[c] || c).join(''); }
function composeDakuten(s) { return COMPOSE_MAP[s] || s; }

// ============================================================
// Notation
// ============================================================
function toDisplay(m) {
  return notation === 'dot' ? m.replace(/\./g, '\u30FB').replace(/-/g, '\u30FC') : m;
}
function normalize(s) {
  return s.replace(/\u30FB/g, '.').replace(/\u30FC/g, '-').replace(/\u2212/g, '-').replace(/\u3000/g, ' ');
}

// ============================================================
// Encode / Decode
// ============================================================
// Tokenize text: split into chars but keep [XX] prosign brackets as one token
function tokenize(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === '[') {
      const end = text.indexOf(']', i);
      if (end !== -1) { tokens.push(text.slice(i, end + 1)); i = end + 1; continue; }
    }
    tokens.push(text[i]);
    i++;
  }
  return tokens;
}

function encodeText(text) {
  const map = getMap();
  let processed = currentLang === 'ja' ? decomposeJa(hiraToKata(text)) : text.toUpperCase();
  const words = processed.split(/[\s\u3000]+/).filter(Boolean);
  return words.map(w => tokenize(w).map(c => map[c] || '').filter(Boolean).join(' ')).join(' / ');
}

// Returns array of { srcChar, srcIdx, morse } for input<->morse mapping
function encodeTextMapped(text) {
  const map = getMap();
  const entries = [];
  const tokens = tokenize(text);
  for (const token of tokens) {
    if (/^[\s\u3000]$/.test(token)) { entries.push({ srcChar: token, srcIdx: 0, morse: '/' }); continue; }
    let processed;
    if (currentLang === 'ja') {
      const kata = hiraToKata(token);
      const decomposed = decomposeJa(kata);
      const codes = [...decomposed].map(d => map[d]).filter(Boolean);
      processed = codes.join(' ');
    } else {
      // Check prosign [XX] first, then single char
      processed = map[token] || map[token.toUpperCase()] || '';
    }
    if (processed) entries.push({ srcChar: token, srcIdx: 0, morse: processed });
  }
  return entries;
}

function decodeMorse(morseStr) {
  const map = getRMap();
  const n = normalize(morseStr.trim());
  const words = n.split(/\s*\/\s*/).filter(w => w.trim());
  if (currentLang === 'ja') {
    return words.map(w => {
      const chars = w.trim().split(/\s+/).filter(Boolean);
      const decoded = chars.map(c => map[c] || '?');
      const result = [];
      for (const ch of decoded) {
        if ((ch === '\u309B' || ch === '\u309C') && result.length > 0) result[result.length - 1] += ch;
        else result.push(ch);
      }
      return result.map(composeDakuten).join('');
    }).join(' ');
  }
  return words.map(w => w.trim().split(/\s+/).filter(Boolean).map(c => map[c] || '?').join('')).join(' ');
}

let currentMapping = []; // encodeTextMapped result for highlight sync

function renderEncodeOutput(morseStr) {
  const el = document.getElementById('encode-output');
  if (!morseStr) {
    el.innerHTML = '<span class="placeholder">\u5909\u63db\u7d50\u679c\u304c\u3053\u3053\u306b\u8868\u793a\u3055\u308c\u307e\u3059</span>';
    document.getElementById('encode-src-display').style.display = 'none';
    return;
  }
  let html = '', idx = 0;
  const parts = morseStr.split(' ');
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p === '/') { html += '<span class="morse-char" data-idx="sep">&nbsp;/&nbsp;</span>'; }
    else { html += `<span class="morse-char" data-idx="${idx}">${toDisplay(p)}</span>`; idx++; }
    if (i < parts.length - 1 && parts[i + 1] !== '/') html += ' ';
  }
  el.innerHTML = html;

  // Build source text display with matching data-idx
  const srcEl = document.getElementById('encode-src-display');
  if (currentMapping.length > 0) {
    let srcHtml = '', ci = 0;
    for (const entry of currentMapping) {
      if (entry.morse === '/') {
        srcHtml += '<span class="src-char" data-idx="sep">&nbsp;</span>';
      } else {
        srcHtml += `<span class="src-char" data-idx="${ci}">${entry.srcChar}</span>`;
        ci++;
      }
    }
    srcEl.innerHTML = srcHtml;
    srcEl.style.display = 'block';
  }
}

// ============================================================
// Audio Timeline & Playback
// ============================================================
// Timeline stores units (multiples of base unit), resolved to ms at playback time
function buildTimeline(morseStr) {
  const tl = []; const parts = morseStr.split(' '); let ci = 0;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p === '/') { tl.push({ t: 'p', u: 4, ci: -1 }); }
    else {
      const sigs = [...p];
      for (let j = 0; j < sigs.length; j++) {
        if (sigs[j] === '.') tl.push({ t: 'on', u: 1, ci });
        else if (sigs[j] === '-') tl.push({ t: 'on', u: 3, ci });
        if (j < sigs.length - 1) tl.push({ t: 'p', u: 1, ci });
      }
      ci++;
      if (i < parts.length - 1) tl.push({ t: 'p', u: 3, ci: -1 });
    }
  }
  return tl;
}

let playAbort = null;
let torchTrack = null;

function stopPlayback() {
  if (playAbort) { playAbort.abort(); playAbort = null; }
  if (torchTrack) { torchTrack.stop(); torchTrack = null; }
  document.getElementById('flash-overlay').style.display = 'none';
  document.getElementById('stop-btn').style.display = 'none';
  document.getElementById('play-sound-btn').classList.remove('playing');
  document.getElementById('play-light-btn').classList.remove('playing');
  document.getElementById('play-dot').className = 'status-dot';
  document.getElementById('play-status').textContent = '\u5f85\u6a5f\u4e2d';
  document.querySelectorAll('.morse-char.highlight, .src-char.highlight').forEach(e => e.classList.remove('highlight'));
}

function highlight(idx) {
  document.querySelectorAll('.morse-char.highlight, .src-char.highlight').forEach(e => e.classList.remove('highlight'));
  document.querySelectorAll(`.morse-char[data-idx="${idx}"], .src-char[data-idx="${idx}"]`).forEach(e => e.classList.add('highlight'));
}

function sleepAb(ms, sig) {
  return new Promise((res, rej) => {
    if (sig?.aborted) { rej(new DOMException('','AbortError')); return; }
    const t = setTimeout(res, ms);
    sig?.addEventListener('abort', () => { clearTimeout(t); rej(new DOMException('','AbortError')); }, { once: true });
  });
}

// Play a single morse code for reference preview
function playMorseCode(code) {
  const ctx = getAudioCtx();
  const unit = 60; // fast preview
  let time = ctx.currentTime + 0.01;
  for (const s of code) {
    const dur = s === '.' ? unit : unit * 3;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = toneFreq;
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(0.4, time + 0.003);
    g.gain.setValueAtTime(0.4, time + dur / 1000 - 0.003);
    g.gain.linearRampToValueAtTime(0, time + dur / 1000);
    osc.connect(g).connect(ctx.destination);
    osc.start(time); osc.stop(time + dur / 1000);
    time += dur / 1000 + unit / 1000;
  }
}

async function playSound(morseStr) {
  stopPlayback();
  const ac = new AbortController(); playAbort = ac;
  const ctx = getAudioCtx(); const tl = buildTimeline(morseStr);
  document.getElementById('stop-btn').style.display = '';
  document.getElementById('play-sound-btn').classList.add('playing');
  document.getElementById('play-dot').className = 'status-dot playing';
  document.getElementById('play-status').textContent = '\u97f3\u3067\u518d\u751f\u4e2d...';
  try {
    for (const ev of tl) {
      if (ac.signal.aborted) break;
      const ms = ev.u * getUnit(); // resolve to ms live
      if (ev.ci >= 0) highlight(ev.ci);
      if (ev.t === 'on') {
        const osc = ctx.createOscillator(); const g = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = toneFreq;
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.005);
        g.gain.setValueAtTime(0.5, ctx.currentTime + ms / 1000 - 0.005);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + ms / 1000);
        osc.connect(g).connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + ms / 1000);
        await sleepAb(ms, ac.signal);
      } else { await sleepAb(ms, ac.signal); }
    }
  } catch (e) { if (e.name !== 'AbortError') throw e; }
  stopPlayback();
}

async function setTorch(on) {
  if (!torchTrack) return;
  try { await torchTrack.applyConstraints({ advanced: [{ torch: on }] }); } catch {}
}

async function playLight(morseStr) {
  stopPlayback();
  const ac = new AbortController(); playAbort = ac;
  const flash = document.getElementById('flash-overlay');
  const tl = buildTimeline(morseStr);
  document.getElementById('stop-btn').style.display = '';
  document.getElementById('play-light-btn').classList.add('playing');
  document.getElementById('play-dot').className = 'status-dot playing';
  document.getElementById('play-status').textContent = '\u5149\u3067\u518d\u751f\u4e2d...';

  // Try to acquire camera torch
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    const track = stream.getVideoTracks()[0];
    const caps = track.getCapabilities?.();
    if (caps?.torch) {
      torchTrack = track;
    } else {
      track.stop();
    }
  } catch {}

  try {
    for (const ev of tl) {
      if (ac.signal.aborted) break;
      const ms = ev.u * getUnit();
      if (ev.ci >= 0) highlight(ev.ci);
      if (ev.t === 'on') {
        await setTorch(true);
        flash.style.display = 'block'; flash.style.opacity = '1';
        await sleepAb(ms, ac.signal);
        await setTorch(false);
        flash.style.opacity = '0'; await sleepAb(30, ac.signal);
      } else {
        flash.style.display = 'none'; await sleepAb(ms, ac.signal);
      }
    }
  } catch (e) { if (e.name !== 'AbortError') throw e; }
  await setTorch(false);
  flash.style.display = 'none'; stopPlayback();
}

// ============================================================
// Tap Input Engine
// ============================================================
const tap = {
  buffer: '',      // current character's .- sequence
  morseStr: '',    // full morse string so far
  pressTime: 0,
  charTimer: null,
  wordTimer: null,
};

function tapUpdateDisplay() {
  const el = document.getElementById('tap-buffer');
  if (!tap.morseStr && !tap.buffer) {
    el.innerHTML = '<span class="placeholder">\u30dc\u30bf\u30f3\u3092\u62bc\u3057\u3066\u30e2\u30fc\u30eb\u30b9\u3092\u5165\u529b</span>';
  } else {
    // Show committed morse + highlight pending buffer
    const committed = tap.morseStr ? toDisplay(tap.morseStr) : '';
    const pending = tap.buffer ? toDisplay(tap.buffer) : '';
    if (pending) {
      el.innerHTML = committed + (committed ? ' ' : '') +
        '<span style="color:var(--accent);text-decoration:underline">' + pending + '</span>';
    } else {
      el.textContent = committed;
    }
  }
  // auto decode
  const full = tap.morseStr + (tap.buffer ? (tap.morseStr ? ' ' : '') + tap.buffer : '');
  if (full) {
    document.getElementById('decode-output').textContent = decodeMorse(full);
  }
}

function tapCommitChar() {
  if (!tap.buffer) return;
  tap.morseStr += (tap.morseStr ? ' ' : '') + tap.buffer;
  tap.buffer = '';
}

function tapCommitWord() {
  tapCommitChar();
  if (tap.morseStr && !tap.morseStr.endsWith('/')) {
    tap.morseStr += ' /';
  }
}

function tapDown() {
  clearTimeout(tap.charTimer);
  clearTimeout(tap.wordTimer);
  tap.pressTime = performance.now();
  document.getElementById('tap-btn').classList.add('pressed');
  // vibrate
  if (navigator.vibrate) navigator.vibrate(10);
  // play tone start
  tap._osc = null;
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine'; osc.frequency.value = toneFreq;
  g.gain.value = 0.4;
  osc.connect(g).connect(ctx.destination);
  osc.start();
  tap._osc = osc; tap._gain = g;
}

function tapUp() {
  document.getElementById('tap-btn').classList.remove('pressed');
  // stop tone
  if (tap._osc) {
    tap._gain.gain.linearRampToValueAtTime(0, getAudioCtx().currentTime + 0.01);
    tap._osc.stop(getAudioCtx().currentTime + 0.02);
    tap._osc = null;
  }
  const dur = performance.now() - tap.pressTime;
  // Standard ITU timing based on tap-specific WPM
  const tapWpm = parseInt(document.getElementById('tap-wpm').value);
  const unit = 1200 / tapWpm;
  tap.buffer += dur < unit * 2 ? '.' : '-';
  tapUpdateDisplay();
  // auto char gap
  tap.charTimer = setTimeout(() => {
    tapCommitChar();
    tapUpdateDisplay();
    // auto word gap
    tap.wordTimer = setTimeout(() => {
      tapCommitWord();
      tapUpdateDisplay();
    }, unit * 7);
  }, unit * 3);
}

// 2-button mode (split dit/dah)
function tapSplitInput(signal) {
  clearTimeout(tap.charTimer);
  clearTimeout(tap.wordTimer);
  if (navigator.vibrate) navigator.vibrate(10);
  // play short beep
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine'; osc.frequency.value = toneFreq;
  g.gain.value = 0.4;
  osc.connect(g).connect(ctx.destination);
  const unit = 1200 / parseInt(document.getElementById('tap-wpm').value);
  const dur = signal === '.' ? unit : unit * 3;
  osc.start();
  g.gain.setValueAtTime(0.4, ctx.currentTime + dur / 1000);
  g.gain.linearRampToValueAtTime(0, ctx.currentTime + dur / 1000 + 0.01);
  osc.stop(ctx.currentTime + dur / 1000 + 0.02);
  tap.buffer += signal;
  tapUpdateDisplay();
  // auto char/word gap (same ITU timing)
  tap.charTimer = setTimeout(() => {
    tapCommitChar(); tapUpdateDisplay();
    tap.wordTimer = setTimeout(() => {
      tapCommitWord(); tapUpdateDisplay();
    }, unit * 7);
  }, unit * 3);
}

// ============================================================
// Adaptive Morse Decoder (shared by mic & camera)
// ============================================================

// Max-ratio-gap clustering: find shortest-cluster mean (= 1 dit unit)
function clusterEstimate(durs) {
  if (durs.length === 0) return 120;
  if (durs.length === 1) return durs[0];
  const sorted = [...durs].sort((a, b) => a - b);
  let maxRatio = 0, splitIdx = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const ratio = sorted[i + 1] / sorted[i];
    if (ratio > maxRatio) { maxRatio = ratio; splitIdx = i + 1; }
  }
  if (maxRatio > 1.5 && splitIdx > 0) {
    const shorts = sorted.slice(0, splitIdx);
    return shorts.reduce((a, b) => a + b, 0) / shorts.length;
  }
  return sorted[Math.floor(sorted.length / 2)];
}

// Estimate dit unit from both ON durations and OFF gaps
function estimateUnit(rawSignals) {
  const recent = rawSignals.slice(-40);
  const onDurs = recent.map(s => s.onDur);
  const offDurs = recent.filter(s => s.gapBefore > 0).map(s => s.gapBefore);
  const onEst = clusterEstimate(onDurs);
  const offEst = offDurs.length >= 2 ? clusterEstimate(offDurs) : null;
  if (onEst && offEst) return (onEst + offEst) / 2;
  return onEst || 120;
}

// Rebuild full morse string from raw signals
function rebuildMorse(rawSignals, unit, pendingGapMs) {
  let morse = '';
  for (let i = 0; i < rawSignals.length; i++) {
    const sig = rawSignals[i];
    if (i > 0) {
      if (sig.gapBefore > unit * 5) morse += ' / ';
      else if (sig.gapBefore > unit * 2) morse += ' ';
    }
    morse += sig.onDur < unit * 2 ? '.' : '-';
  }
  if (pendingGapMs > 0 && rawSignals.length > 0) {
    if (pendingGapMs > unit * 5) morse += ' /';
  }
  return morse;
}

// ============================================================
// Mic Input Engine
// ============================================================
const mic = {
  stream: null,
  analyser: null,
  animFrame: null,
  isOn: false,
  onStart: 0,
  rawSignals: [],    // [{onDur, gapBefore}]
  lastSignalEnd: 0,
  charTimer: null,
  wordTimer: null,
  autoWpm: true,
};

function micRebuild(pendingGapMs) {
  const el = document.getElementById('mic-buffer');
  if (mic.rawSignals.length === 0) {
    el.innerHTML = '<span class="placeholder">\u30de\u30a4\u30af\u3067\u97f3\u3092\u5165\u529b</span>';
    return 120;
  }
  const unit = mic.autoWpm ? estimateUnit(mic.rawSignals) : 1200 / parseInt(document.getElementById('mic-wpm').value);
  const morse = rebuildMorse(mic.rawSignals, unit, pendingGapMs);
  el.textContent = toDisplay(morse);
  document.getElementById('decode-output').textContent = decodeMorse(morse);
  const estWpm = Math.round(1200 / unit);
  document.getElementById('mic-wpm-val').textContent =
    mic.autoWpm ? ('~' + estWpm + ' WPM') : (document.getElementById('mic-wpm').value + ' WPM');
  return unit;
}

async function micStart() {
  try {
    mic.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    alert('\u30de\u30a4\u30af\u3078\u306e\u30a2\u30af\u30bb\u30b9\u304c\u8a31\u53ef\u3055\u308c\u307e\u305b\u3093\u3067\u3057\u305f');
    return;
  }
  const ctx = getAudioCtx();
  const src = ctx.createMediaStreamSource(mic.stream);
  mic.analyser = ctx.createAnalyser();
  mic.analyser.fftSize = 512;
  src.connect(mic.analyser);

  document.getElementById('mic-start-btn').style.display = 'none';
  document.getElementById('mic-stop-btn').style.display = '';

  mic.isOn = false;
  mic.rawSignals = [];
  mic.lastSignalEnd = 0;
  document.getElementById('mic-wpm-val').textContent = mic.autoWpm ? '--- WPM' : (document.getElementById('mic-wpm').value + ' WPM');
  micRebuild(0);

  const canvas = document.getElementById('mic-canvas');
  const cCtx = canvas.getContext('2d');
  const data = new Uint8Array(mic.analyser.fftSize);

  function draw() {
    mic.animFrame = requestAnimationFrame(draw);
    mic.analyser.getByteTimeDomainData(data);
    const w = canvas.width = canvas.clientWidth * 2;
    const h = canvas.height = canvas.clientHeight * 2;
    cCtx.clearRect(0, 0, w, h);

    // waveform
    cCtx.strokeStyle = mic.isOn ? '#38bdf8' : '#475569';
    cCtx.lineWidth = 2;
    cCtx.beginPath();
    const sliceW = w / data.length;
    for (let i = 0; i < data.length; i++) {
      const y = (data[i] / 255) * h;
      if (i === 0) cCtx.moveTo(0, y); else cCtx.lineTo(i * sliceW, y);
    }
    cCtx.stroke();

    // threshold line
    const sens = parseInt(document.getElementById('mic-sensitivity').value);
    const thLine = h / 2 - (sens / 100) * (h / 2);
    const thLine2 = h / 2 + (sens / 100) * (h / 2);
    cCtx.strokeStyle = 'rgba(251,146,60,0.4)';
    cCtx.lineWidth = 1;
    cCtx.setLineDash([4, 4]);
    cCtx.beginPath(); cCtx.moveTo(0, thLine); cCtx.lineTo(w, thLine); cCtx.stroke();
    cCtx.beginPath(); cCtx.moveTo(0, thLine2); cCtx.lineTo(w, thLine2); cCtx.stroke();
    cCtx.setLineDash([]);

    // detect
    const sens01 = sens / 100;
    let maxAmp = 0;
    for (let i = 0; i < data.length; i++) {
      const amp = Math.abs(data[i] - 128) / 128;
      if (amp > maxAmp) maxAmp = amp;
    }

    // Update level bar
    const pct = Math.round(maxAmp * 100);
    document.getElementById('mic-level-bar').style.width = pct + '%';
    document.getElementById('mic-level-bar').style.background = maxAmp > sens01 ? '#38bdf8' : 'var(--text2)';
    document.getElementById('mic-level-text').textContent = pct;

    const now = performance.now();

    if (maxAmp > sens01) {
      if (!mic.isOn) {
        mic.isOn = true;
        mic.onStart = now;
        clearTimeout(mic.charTimer);
        clearTimeout(mic.wordTimer);
      }
    } else {
      if (mic.isOn) {
        mic.isOn = false;
        const dur = now - mic.onStart;
        const gapBefore = mic.rawSignals.length === 0 ? 0 : (mic.onStart - mic.lastSignalEnd);
        mic.rawSignals.push({ onDur: dur, gapBefore });
        mic.lastSignalEnd = now;
        const unit = micRebuild(0);

        mic.charTimer = setTimeout(() => {
          micRebuild(performance.now() - mic.lastSignalEnd);
          mic.wordTimer = setTimeout(() => {
            micRebuild(performance.now() - mic.lastSignalEnd);
          }, unit * 3);
        }, unit * 2);
      }
    }
  }
  draw();
}

function micStop() {
  if (mic.stream) { mic.stream.getTracks().forEach(t => t.stop()); mic.stream = null; }
  if (mic.animFrame) { cancelAnimationFrame(mic.animFrame); mic.animFrame = null; }
  clearTimeout(mic.charTimer);
  clearTimeout(mic.wordTimer);
  if (mic.isOn) {
    const now = performance.now();
    const dur = now - mic.onStart;
    const gapBefore = mic.rawSignals.length === 0 ? 0 : (mic.onStart - mic.lastSignalEnd);
    mic.rawSignals.push({ onDur: dur, gapBefore });
    mic.lastSignalEnd = now;
    mic.isOn = false;
  }
  if (mic.rawSignals.length > 0) micRebuild(0);
  document.getElementById('mic-start-btn').style.display = '';
  document.getElementById('mic-stop-btn').style.display = 'none';
}

// ============================================================
// Camera Light Input Engine
// ============================================================
const cam = {
  stream: null,
  animFrame: null,
  isOn: false,
  onStart: 0,
  rawSignals: [],
  lastSignalEnd: 0,
  charTimer: null,
  wordTimer: null,
  autoWpm: true,
};

function camRebuild(pendingGapMs) {
  const el = document.getElementById('cam-buffer');
  if (cam.rawSignals.length === 0) {
    el.innerHTML = '<span class="placeholder">\u30ab\u30e1\u30e9\u3067\u5149\u3092\u691c\u51fa</span>';
    return 120;
  }
  const unit = cam.autoWpm ? estimateUnit(cam.rawSignals) : 1200 / parseInt(document.getElementById('cam-wpm').value);
  const morse = rebuildMorse(cam.rawSignals, unit, pendingGapMs);
  el.textContent = toDisplay(morse);
  document.getElementById('decode-output').textContent = decodeMorse(morse);
  const estWpm = Math.round(1200 / unit);
  document.getElementById('cam-wpm-val').textContent =
    cam.autoWpm ? ('~' + estWpm + ' WPM') : (document.getElementById('cam-wpm').value + ' WPM');
  return unit;
}

async function camStart() {
  try {
    cam.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 320 }, height: { ideal: 240 } }
    });
  } catch (e) {
    alert('\u30ab\u30e1\u30e9\u3078\u306e\u30a2\u30af\u30bb\u30b9\u304c\u8a31\u53ef\u3055\u308c\u307e\u305b\u3093\u3067\u3057\u305f');
    return;
  }
  const video = document.getElementById('cam-video');
  video.srcObject = cam.stream;

  document.getElementById('cam-start-btn').style.display = 'none';
  document.getElementById('cam-stop-btn').style.display = '';

  cam.isOn = false;
  cam.rawSignals = [];
  cam.lastSignalEnd = 0;
  document.getElementById('cam-wpm-val').textContent = cam.autoWpm ? '--- WPM' : (document.getElementById('cam-wpm').value + ' WPM');
  camRebuild(0);

  const canvas = document.getElementById('cam-canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  function detect() {
    cam.animFrame = requestAnimationFrame(detect);
    if (video.readyState < video.HAVE_CURRENT_DATA) return;

    // Sample center region of video
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Calculate average brightness of center 1/3 region
    const cx = Math.floor(canvas.width / 3);
    const cy = Math.floor(canvas.height / 3);
    const cw = Math.floor(canvas.width / 3);
    const ch = Math.floor(canvas.height / 3);
    const imgData = ctx.getImageData(cx, cy, cw, ch);
    const d = imgData.data;
    let total = 0;
    for (let i = 0; i < d.length; i += 4) {
      total += (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114); // luminance
    }
    const brightness = total / (d.length / 4) / 255; // 0-1

    // Update level bar
    const pct = Math.round(brightness * 100);
    document.getElementById('cam-level-bar').style.width = pct + '%';
    const sens = parseInt(document.getElementById('cam-sensitivity').value) / 100;
    document.getElementById('cam-level-bar').style.background = brightness > sens ? '#38bdf8' : 'var(--text2)';
    document.getElementById('cam-level-text').textContent = pct;

    // ON/OFF indicator
    document.getElementById('cam-indicator').style.background = brightness > sens ? '#38bdf8' : 'var(--text2)';

    // Detect morse signals
    const now = performance.now();
    if (brightness > sens) {
      if (!cam.isOn) {
        cam.isOn = true;
        cam.onStart = now;
        clearTimeout(cam.charTimer);
        clearTimeout(cam.wordTimer);
      }
    } else {
      if (cam.isOn) {
        cam.isOn = false;
        const dur = now - cam.onStart;
        const gapBefore = cam.rawSignals.length === 0 ? 0 : (cam.onStart - cam.lastSignalEnd);
        cam.rawSignals.push({ onDur: dur, gapBefore });
        cam.lastSignalEnd = now;
        const unit = camRebuild(0);

        cam.charTimer = setTimeout(() => {
          camRebuild(performance.now() - cam.lastSignalEnd);
          cam.wordTimer = setTimeout(() => {
            camRebuild(performance.now() - cam.lastSignalEnd);
          }, unit * 3);
        }, unit * 2);
      }
    }
  }
  detect();
}

function camStop() {
  if (cam.stream) { cam.stream.getTracks().forEach(t => t.stop()); cam.stream = null; }
  if (cam.animFrame) { cancelAnimationFrame(cam.animFrame); cam.animFrame = null; }
  clearTimeout(cam.charTimer);
  clearTimeout(cam.wordTimer);
  if (cam.isOn) {
    const now = performance.now();
    const dur = now - cam.onStart;
    const gapBefore = cam.rawSignals.length === 0 ? 0 : (cam.onStart - cam.lastSignalEnd);
    cam.rawSignals.push({ onDur: dur, gapBefore });
    cam.lastSignalEnd = now;
    cam.isOn = false;
  }
  if (cam.rawSignals.length > 0) camRebuild(0);
  document.getElementById('cam-video').srcObject = null;
  document.getElementById('cam-start-btn').style.display = '';
  document.getElementById('cam-stop-btn').style.display = 'none';
}

// ============================================================
// Reference Grid & Abbreviation Table
// ============================================================
function buildRefGrid() {
  const grid = document.getElementById('ref-grid');
  const map = getMap();
  grid.innerHTML = '';

  // Determine display order
  let entries;
  if (currentLang === 'ja') {
    const order = '\u30a2\u30a4\u30a6\u30a8\u30aa\u30ab\u30ad\u30af\u30b1\u30b3\u30b5\u30b7\u30b9\u30bb\u30bd\u30bf\u30c1\u30c4\u30c6\u30c8\u30ca\u30cb\u30cc\u30cd\u30ce\u30cf\u30d2\u30d5\u30d8\u30db\u30de\u30df\u30e0\u30e1\u30e2\u30e4\u30e6\u30e8\u30e9\u30ea\u30eb\u30ec\u30ed\u30ef\u30f2\u30f3\u309b\u309c\u30fc\u3002\u3001';
    entries = [...order].map(c => [c, map[c]]).filter(([, m]) => m);
  } else {
    entries = Object.entries(map);
  }

  for (const [ch, morse] of entries) {
    const card = document.createElement('div');
    card.className = 'ref-card';
    card.innerHTML = `<span class="ref-char">${ch}</span><span class="ref-morse">${toDisplay(morse)}</span>`;
    card.addEventListener('click', () => playMorseCode(morse));
    grid.appendChild(card);
  }
}

function buildAbbrevSection() {
  const el = document.getElementById('abbrev-section');
  const data = currentLang === 'ja' ? ABBREV_JA : ABBREV_INTL;
  let html = '<label style="display:block;margin-bottom:8px;">\u7565\u8a9e\u30fbQ\u30b3\u30fc\u30c9</label>';
  for (const group of data) {
    const note = group.note ? `<div style="font-size:0.6875rem;color:var(--accent);margin:4px 0;">${group.note}</div>` : '';
    html += `<details class="abbrev-group"><summary>${group.group}</summary>${note}<table class="abbrev-table"><thead><tr><th>\u7b26\u53f7</th><th>\u610f\u5473</th><th style="text-align:right;">\u30e2\u30fc\u30eb\u30b9</th></tr></thead><tbody>`;
    for (const item of group.items) {
      // Generate morse if not explicitly provided
      const morse = item.morse || encodeText(item.code);
      const morseDisp = morse ? toDisplay(morse) : '';
      const morseAttr = morse ? ` data-morse="${morse}"` : '';
      html += `<tr${morseAttr}><td>${item.code}</td><td>${item.meaning}</td><td style="font-family:var(--mono);font-size:0.6875rem;text-align:right;color:var(--text2);letter-spacing:0.05em;">${morseDisp}</td></tr>`;
    }
    html += '</tbody></table></details>';
  }
  el.innerHTML = html;
  // Tap row to play morse and load into encoder
  el.querySelectorAll('tr[data-morse]').forEach(row => {
    row.addEventListener('click', () => {
      playMorseCode(row.dataset.morse);
    });
  });
}

// ============================================================
// UI Helpers
// ============================================================
function updatePlaceholders() {
  const enc = document.getElementById('encode-input');
  const dec = document.getElementById('decode-morse-input');
  const info = document.getElementById('decode-info');
  if (currentLang === 'ja') {
    enc.placeholder = '\u5909\u63db\u3057\u305f\u3044\u30c6\u30ad\u30b9\u30c8\u3092\u5165\u529b...\n\u4f8b: \u30b3\u30f3\u30cb\u30c1\u30cf \u30bb\u30ab\u30a4';
    dec.placeholder = '\u30e2\u30fc\u30eb\u30b9\u30b3\u30fc\u30c9\u3092\u5165\u529b...\n\u4f8b: ---- .-.-. -.-. ..-. -...';
    info.innerHTML = '<code>.</code>(\u77ed\u70b9) <code>-</code>(\u9577\u70b9) | \u30b9\u30da\u30fc\u30b9=\u6587\u5b57\u533a\u5207\u308a | <code>/</code>=\u5358\u8a9e\u533a\u5207\u308a<br>\u6fc1\u97f3: \u6587\u5b57 + <code>..</code> | \u534a\u6fc1\u97f3: \u6587\u5b57 + <code>..--.</code>';
  } else {
    enc.placeholder = '\u5909\u63db\u3057\u305f\u3044\u30c6\u30ad\u30b9\u30c8\u3092\u5165\u529b...\n\u4f8b: HELLO WORLD';
    dec.placeholder = '\u30e2\u30fc\u30eb\u30b9\u30b3\u30fc\u30c9\u3092\u5165\u529b...\n\u4f8b: .... . .-.. .-.. --- / .-- --- .-. .-.. -..';
    info.innerHTML = '<code>.</code>(\u77ed\u70b9) <code>-</code>(\u9577\u70b9) | \u30b9\u30da\u30fc\u30b9=\u6587\u5b57\u533a\u5207\u308a | <code>/</code>=\u5358\u8a9e\u533a\u5207\u308a';
  }
}

function resetAll() {
  stopPlayback();
  currentMorse = '';
  currentMapping = [];
  document.getElementById('encode-input').value = '';
  document.getElementById('encode-output').innerHTML = '<span class="placeholder">\u5909\u63db\u7d50\u679c\u304c\u3053\u3053\u306b\u8868\u793a\u3055\u308c\u307e\u3059</span>';
  document.getElementById('encode-src-display').style.display = 'none';
  document.getElementById('decode-morse-input').value = '';
  document.getElementById('decode-output').innerHTML = '<span class="placeholder">\u30c7\u30b3\u30fc\u30c9\u7d50\u679c\u304c\u3053\u3053\u306b\u8868\u793a\u3055\u308c\u307e\u3059</span>';
  // tap
  tap.buffer = ''; tap.morseStr = ''; clearTimeout(tap.charTimer); clearTimeout(tap.wordTimer);
  tapUpdateDisplay();
  // mic
  micStop();
  mic.rawSignals = []; mic.lastSignalEnd = 0;
  micRebuild(0);
  // cam
  camStop();
  cam.rawSignals = []; cam.lastSignalEnd = 0;
  camRebuild(0);
}

function buildPresets() {
  const el = document.getElementById('presets');
  const list = currentLang === 'ja' ? PRESETS_JA : PRESETS_INTL;
  el.innerHTML = list.map(p =>
    `<button class="preset-btn" data-text="${p.text}">${p.label}</button>`
  ).join('');
  el.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('encode-input').value = btn.dataset.text;
      doEncode();
    });
  });
}

function doEncode() {
  const text = document.getElementById('encode-input').value;
  if (!text.trim()) {
    currentMorse = '';
    currentMapping = [];
    renderEncodeOutput('');
    return;
  }
  currentMapping = encodeTextMapped(text);
  currentMorse = encodeText(text);
  renderEncodeOutput(currentMorse);
}

// ============================================================
// Event Handlers
// ============================================================

// --- Encode (real-time) ---
document.getElementById('encode-input').addEventListener('input', doEncode);

// --- Language ---
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentLang = btn.dataset.lang;
    resetAll();
    updatePlaceholders();
    buildPresets();
    buildRefGrid(); buildAbbrevSection();
  });
});

// --- Tabs ---
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    stopPlayback();
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
  });
});

// --- Notation ---
document.querySelectorAll('.toggle-btn[data-notation]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.toggle-btn[data-notation]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    notation = btn.dataset.notation;
    if (currentMorse) renderEncodeOutput(currentMorse);
    buildRefGrid(); buildAbbrevSection();
  });
});

// --- Decode modes ---
document.querySelectorAll('.mode-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.decode-mode').forEach(m => m.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('decode-' + btn.dataset.mode).classList.add('active');
  });
});

// --- WPM slider ---
document.getElementById('wpm-slider').addEventListener('input', function() {
  document.getElementById('wpm-value').textContent = this.value + ' WPM';
  document.getElementById('settings-wpm').value = this.value;
  document.getElementById('settings-wpm-value').textContent = this.value + ' WPM';
});

// --- Play ---
document.getElementById('play-sound-btn').addEventListener('click', () => { if (currentMorse) playSound(currentMorse); });
document.getElementById('play-light-btn').addEventListener('click', () => { if (currentMorse) playLight(currentMorse); });
document.getElementById('stop-btn').addEventListener('click', stopPlayback);
document.getElementById('flash-overlay').addEventListener('click', stopPlayback);

// --- Decode text ---
document.getElementById('decode-btn').addEventListener('click', () => {
  const v = document.getElementById('decode-morse-input').value.trim();
  if (!v) return;
  document.getElementById('decode-output').textContent = decodeMorse(v);
});
document.getElementById('decode-morse-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); document.getElementById('decode-btn').click(); }
});

// --- Tap ---
document.getElementById('tap-wpm').addEventListener('input', e => {
  document.getElementById('tap-wpm-val').textContent = e.target.value + ' WPM';
});
const tapBtn = document.getElementById('tap-btn');
tapBtn.addEventListener('mousedown', e => { e.preventDefault(); tapDown(); });
tapBtn.addEventListener('mouseup', tapUp);
tapBtn.addEventListener('mouseleave', () => { if (tap.pressTime && document.getElementById('tap-btn').classList.contains('pressed')) tapUp(); });
tapBtn.addEventListener('touchstart', e => { e.preventDefault(); tapDown(); }, { passive: false });
tapBtn.addEventListener('touchend', e => { e.preventDefault(); tapUp(); }, { passive: false });

// --- 2-button mode (split dit/dah) ---
document.getElementById('tap-dit-btn').addEventListener('click', () => tapSplitInput('.'));
document.getElementById('tap-dah-btn').addEventListener('click', () => tapSplitInput('-'));

// --- Mode toggle ---
document.getElementById('tap-mode-toggle').addEventListener('click', () => {
  const hold = document.getElementById('tap-mode-hold');
  const split = document.getElementById('tap-mode-split');
  const btn = document.getElementById('tap-mode-toggle');
  if (hold.style.display !== 'none') {
    hold.style.display = 'none'; split.style.display = 'flex';
    btn.textContent = '\u21c4 \u9577\u62bc\u3057\u30e2\u30fc\u30c9';
  } else {
    hold.style.display = 'flex'; split.style.display = 'none';
    btn.textContent = '\u21c4 2\u30dc\u30bf\u30f3\u30e2\u30fc\u30c9';
  }
});

document.getElementById('tap-space-btn').addEventListener('click', () => {
  clearTimeout(tap.charTimer); clearTimeout(tap.wordTimer);
  tapCommitChar(); tapUpdateDisplay();
});
document.getElementById('tap-word-btn').addEventListener('click', () => {
  clearTimeout(tap.charTimer); clearTimeout(tap.wordTimer);
  tapCommitWord(); tapUpdateDisplay();
});
document.getElementById('tap-undo-btn').addEventListener('click', () => {
  clearTimeout(tap.charTimer); clearTimeout(tap.wordTimer);
  if (tap.buffer) { tap.buffer = tap.buffer.slice(0, -1); }
  else if (tap.morseStr) {
    // Remove last token
    const parts = tap.morseStr.trimEnd().split(' ');
    parts.pop();
    tap.morseStr = parts.join(' ');
    if (tap.morseStr && !tap.morseStr.endsWith('/') && !tap.morseStr.match(/[.\-]$/)) {
      tap.morseStr = tap.morseStr.trimEnd();
    }
  }
  tapUpdateDisplay();
});
document.getElementById('tap-clear-btn').addEventListener('click', () => {
  clearTimeout(tap.charTimer); clearTimeout(tap.wordTimer);
  tap.buffer = ''; tap.morseStr = '';
  tapUpdateDisplay();
  document.getElementById('decode-output').innerHTML = '<span class="placeholder">\u30c7\u30b3\u30fc\u30c9\u7d50\u679c\u304c\u3053\u3053\u306b\u8868\u793a\u3055\u308c\u307e\u3059</span>';
});

// --- Mic ---
document.getElementById('mic-start-btn').addEventListener('click', micStart);
document.getElementById('mic-stop-btn').addEventListener('click', micStop);
document.getElementById('mic-sensitivity').addEventListener('input', function() {
  document.getElementById('mic-sens-value').textContent = this.value;
  document.getElementById('mic-threshold-mark').style.left = this.value + '%';
});
document.getElementById('mic-clear-btn').addEventListener('click', () => {
  mic.rawSignals = []; mic.lastSignalEnd = 0;
  micRebuild(0);
  document.getElementById('mic-wpm-val').textContent = mic.autoWpm ? '--- WPM' : (document.getElementById('mic-wpm').value + ' WPM');
  document.getElementById('decode-output').innerHTML = '<span class="placeholder">\u30c7\u30b3\u30fc\u30c9\u7d50\u679c\u304c\u3053\u3053\u306b\u8868\u793a\u3055\u308c\u307e\u3059</span>';
});
document.getElementById('mic-wpm-mode').addEventListener('click', function() {
  mic.autoWpm = !mic.autoWpm;
  this.textContent = mic.autoWpm ? '\u81ea\u52d5' : '\u624b\u52d5';
  this.style.background = mic.autoWpm ? 'var(--accent)' : 'var(--surface2)';
  this.style.color = mic.autoWpm ? '#0f172a' : 'var(--text)';
  document.getElementById('mic-wpm').style.display = mic.autoWpm ? 'none' : '';
  document.getElementById('mic-wpm-val').textContent = mic.autoWpm ? '--- WPM' : (document.getElementById('mic-wpm').value + ' WPM');
});
document.getElementById('mic-wpm').addEventListener('input', function() {
  document.getElementById('mic-wpm-val').textContent = this.value + ' WPM';
});

// --- Camera Light ---
document.getElementById('cam-start-btn').addEventListener('click', camStart);
document.getElementById('cam-stop-btn').addEventListener('click', camStop);
document.getElementById('cam-sensitivity').addEventListener('input', function() {
  document.getElementById('cam-sens-value').textContent = this.value;
  document.getElementById('cam-threshold-mark').style.left = this.value + '%';
});
document.getElementById('cam-clear-btn').addEventListener('click', () => {
  cam.rawSignals = []; cam.lastSignalEnd = 0;
  camRebuild(0);
  document.getElementById('cam-wpm-val').textContent = cam.autoWpm ? '--- WPM' : (document.getElementById('cam-wpm').value + ' WPM');
  document.getElementById('decode-output').innerHTML = '<span class="placeholder">\u30c7\u30b3\u30fc\u30c9\u7d50\u679c\u304c\u3053\u3053\u306b\u8868\u793a\u3055\u308c\u307e\u3059</span>';
});
document.getElementById('cam-wpm-mode').addEventListener('click', function() {
  cam.autoWpm = !cam.autoWpm;
  this.textContent = cam.autoWpm ? '\u81ea\u52d5' : '\u624b\u52d5';
  this.style.background = cam.autoWpm ? 'var(--accent)' : 'var(--surface2)';
  this.style.color = cam.autoWpm ? '#0f172a' : 'var(--text)';
  document.getElementById('cam-wpm').style.display = cam.autoWpm ? 'none' : '';
  document.getElementById('cam-wpm-val').textContent = cam.autoWpm ? '--- WPM' : (document.getElementById('cam-wpm').value + ' WPM');
});
document.getElementById('cam-wpm').addEventListener('input', function() {
  document.getElementById('cam-wpm-val').textContent = this.value + ' WPM';
});

// --- Settings ---
document.getElementById('settings-btn').addEventListener('click', () => {
  document.getElementById('settings-modal').classList.add('open');
});
document.getElementById('settings-close').addEventListener('click', () => {
  document.getElementById('settings-modal').classList.remove('open');
});
document.getElementById('settings-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) document.getElementById('settings-modal').classList.remove('open');
});

document.getElementById('freq-slider').addEventListener('input', function() {
  toneFreq = parseInt(this.value);
  document.getElementById('freq-value').textContent = this.value + ' Hz';
});

document.getElementById('settings-wpm').addEventListener('input', function() {
  document.getElementById('settings-wpm-value').textContent = this.value + ' WPM';
  document.getElementById('wpm-slider').value = this.value;
  document.getElementById('wpm-value').textContent = this.value + ' WPM';
});

document.getElementById('theme-switch').addEventListener('click', function() {
  this.classList.toggle('on');
  document.body.classList.toggle('light');
});

// ============================================================
// Init
// ============================================================
updatePlaceholders();
buildPresets();
buildRefGrid();
buildAbbrevSection();
