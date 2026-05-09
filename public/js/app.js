const $ = id => document.getElementById(id);

// ── Audio Stream Player ──
// Free lofi radio streams — tries each one until one works
const STREAMS = [
  'https://streams.ilovemusic.de/iloveradio17.mp3',   // lofi hip hop
  'https://streaming.radio.co/s3f40c7742/listen',      // chill
  'https://stream.zeno.fm/yn65m4vvp8zuv',              // lofi hip hop radio
];
let streamIndex = 0;
let audioPlaying = false;
const audio = $('audioStream');

audio.volume = 0.7;

audio.addEventListener('error', () => {
  console.log('Stream failed, trying next...');
  streamIndex = (streamIndex + 1) % STREAMS.length;
  if (audioPlaying) loadAndPlay();
});

audio.addEventListener('stalled', () => {
  if (audioPlaying) { audio.load(); audio.play(); }
});

function loadAndPlay() {
  audio.src = STREAMS[streamIndex];
  audio.load();
  audio.play().catch(() => {
    streamIndex = (streamIndex + 1) % STREAMS.length;
    if (streamIndex < STREAMS.length) loadAndPlay();
  });
}

function toggleAudio() {
  const btn = $('audioBtn');
  if (!audioPlaying) {
    loadAndPlay();
    audioPlaying = true;
    btn.textContent = '⏸ PAUSE';
    btn.classList.add('playing');
    setWaveform(true);
    setVinyl(true);
  } else {
    audio.pause();
    audio.src = '';
    audioPlaying = false;
    btn.textContent = '▶ PLAY';
    btn.classList.remove('playing');
    setWaveform(false);
    setVinyl(false);
  }
}

function setVolume(val) {
  audio.volume = parseInt(val) / 100;
}

let trackHistory = [];
let startTime = Date.now();
let es = null;
let currentRaw = '';

// uptime counter
setInterval(() => {
  const s = Math.floor((Date.now() - startTime) / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  $('uptime').textContent = `${h}:${m}:${sec}`;
}, 1000);

function setWaveform(on) {
  $('waveform').classList.toggle('active', on);
}

function setVinyl(on) {
  $('vinyl').classList.toggle('playing', on);
  $('arm').classList.toggle('on', on);
}

function updateTrackUI(data) {
  $('trackName').textContent = data.trackName || '—';
  $('artistName').textContent = data.artist || '—';
  $('bpmVal').textContent = data.bpm || '—';
  $('durVal').textContent = data.duration || '—';
  $('sceneText').textContent = data.nowPlaying || '—';

  const tags = data.tags || [];
  $('tagsRow').innerHTML = tags.map(t => `<span class="tag">${t}</span>`).join('');

  const djEl = $('djText');
  djEl.innerHTML = '';
  typewriter(djEl, data.djLine || '', 28);

  setWaveform(true);
  setVinyl(true);
}

function typewriter(el, text, delay) {
  let i = 0;
  el.textContent = '';
  const cursor = document.createElement('span');
  cursor.className = 'dj-cursor';
  el.appendChild(cursor);
  const iv = setInterval(() => {
    if (i < text.length) {
      el.insertBefore(document.createTextNode(text[i]), cursor);
      i++;
    } else {
      clearInterval(iv);
      cursor.remove();
    }
  }, delay);
}

function addToHistory(data, vibe) {
  trackHistory.unshift({ ...data, vibe });
  if (trackHistory.length > 10) trackHistory.pop();
  const list = $('historyList');
  list.innerHTML = trackHistory.map(h => `
    <div class="history-item">
      <div class="h-track">${h.trackName}</div>
      <div class="h-artist">${h.artist}</div>
      <div class="h-vibe">${h.vibe}</div>
    </div>
  `).join('');
}

function connect() {
  if (es) es.close();
  currentRaw = '';

  es = new EventSource('/api/stream');

  es.addEventListener('track_start', e => {
    const d = JSON.parse(e.data);
    $('vibeVal').textContent = d.vibe;
    $('trackNumVal').textContent = d.trackCount;
    $('footerTrack').textContent = `TRACK #${d.trackCount}`;
    $('trackName').classList.add('fade-out');
    setTimeout(() => $('trackName').classList.remove('fade-out'), 400);
    currentRaw = '';
  });

  es.addEventListener('chunk', e => {
    const d = JSON.parse(e.data);
    currentRaw += d.delta;
  });

  es.addEventListener('track_ready', e => {
    const data = JSON.parse(e.data);
    updateTrackUI(data);
    addToHistory(data, $('vibeVal').textContent);
  });

  es.addEventListener('error', e => {
    try {
      const d = JSON.parse(e.data);
      $('djText').textContent = 'Signal lost: ' + d.message;
    } catch {}
    setWaveform(false);
    setVinyl(false);
  });

  es.onerror = () => {
    // auto-reconnect after 5s
    es.close();
    setTimeout(connect, 5000);
  };
}

connect();
