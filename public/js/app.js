const $ = id => document.getElementById(id);

// ── YouTube Player ──
let ytPlayer = null;
let audioReady = false;
let audioPlaying = false;

window.onYouTubeIframeAPIReady = function() {
  ytPlayer = new YT.Player('yt-player', {
    height: '1', width: '1',
    videoId: 'WdJg27tKQLY',
    playerVars: {
      listType: 'playlist',
      list: 'RDWdJg27tKQLY',
      autoplay: 0,
      loop: 1,
      controls: 0,
      fs: 0,
      rel: 0
    },
    events: {
      onReady: () => { audioReady = true; ytPlayer.setVolume(70); },
      onStateChange: e => {
        if (e.data === YT.PlayerState.ENDED) ytPlayer.playVideo();
      }
    }
  });
};

function toggleAudio() {
  if (!audioReady) return;
  const btn = $('audioBtn');
  if (!audioPlaying) {
    ytPlayer.playVideo();
    audioPlaying = true;
    btn.textContent = '⏸ PAUSE';
    btn.classList.add('playing');
  } else {
    ytPlayer.pauseVideo();
    audioPlaying = false;
    btn.textContent = '▶ PLAY';
    btn.classList.remove('playing');
  }
}

function setVolume(val) {
  if (ytPlayer && audioReady) ytPlayer.setVolume(parseInt(val));
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
