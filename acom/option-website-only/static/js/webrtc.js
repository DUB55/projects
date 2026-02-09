const STUN = { iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }] };
let hostWS = null;
let guestWS = null;

let host = {
  pc: null,
  dc: null,
  incomingFile: null,
  incomingChunks: [],
  statusEl: null,
  progressEl: null,
};

let guest = {
  pc: null,
  dc: null,
  incomingFile: null,
  incomingChunks: [],
  statusEl: null,
  progressEl: null,
};

function setTab(tab) {
  document.getElementById('tab-host').classList.toggle('active', tab === 'host');
  document.getElementById('tab-guest').classList.toggle('active', tab === 'guest');
  document.getElementById('host-panel').classList.toggle('hidden', tab !== 'host');
  document.getElementById('guest-panel').classList.toggle('hidden', tab !== 'guest');
}

function apiCreate() {
  return fetch('/api/create', { method: 'POST' }).then(r => r.json());
}

function log(side, msg) {
  const el = document.getElementById(side === 'host' ? 'host-log' : 'guest-log');
  const div = document.createElement('div');
  div.textContent = msg;
  el.prepend(div);
}

function createPC(side) {
  const pc = new RTCPeerConnection(STUN);
  pc.onicecandidate = (e) => {
    const ws = side === 'host' ? hostWS : guestWS;
    if (e.candidate && ws) {
      ws.send(JSON.stringify({ type: 'candidate', candidate: e.candidate }));
    }
  };
  pc.onconnectionstatechange = () => {
    const s = pc.connectionState;
    updateStatus(side, s);
    log(side, 'Connection: ' + s);
  };
  pc.oniceconnectionstatechange = () => {
    const s = pc.iceConnectionState;
    log(side, 'ICE: ' + s);
  };
  return pc;
}

function setupDataChannel(side, dc) {
  dc.binaryType = 'arraybuffer';
  dc.onopen = () => {
    updateStatus(side, 'connected');
    setSendEnabled(side, true);
    log(side, 'Data channel open');
  };
  dc.onclose = () => {
    updateStatus(side, 'closed');
    setSendEnabled(side, false);
    log(side, 'Data channel closed');
  };
  dc.onmessage = (e) => handleMessage(side, e.data);
  if (side === 'host') host.dc = dc; else guest.dc = dc;
}

function handleMessage(side, data) {
  if (typeof data === 'string') {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'file-meta') {
        const ctx = side === 'host' ? host : guest;
        ctx.incomingFile = { name: msg.name, size: msg.size, received: 0 };
        ctx.incomingChunks = [];
        log(side, `Receiving file: ${msg.name} (${msg.size} bytes)`);
        return;
      }
      if (msg.type === 'file-end') {
        const ctx = side === 'host' ? host : guest;
        const blob = new Blob(ctx.incomingChunks);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = ctx.incomingFile?.name || 'download.bin';
        a.textContent = `Download ${ctx.incomingFile?.name || 'file'}`;
        (side === 'host' ? document.getElementById('host-log') : document.getElementById('guest-log')).prepend(a);
        log(side, 'File received');
        if (ctx.progressEl) {
          ctx.progressEl.style.width = '0%';
        }
        ctx.incomingFile = null;
        ctx.incomingChunks = [];
        return;
      }
    } catch {
      log(side, 'Peer: ' + data);
      return;
    }
    log(side, 'Peer: ' + data);
  } else if (data instanceof ArrayBuffer) {
    const ctx = side === 'host' ? host : guest;
    ctx.incomingChunks.push(data);
    ctx.incomingFile && (ctx.incomingFile.received += data.byteLength);
    if (ctx.progressEl && ctx.incomingFile && ctx.incomingFile.size > 0) {
      const pct = Math.floor((ctx.incomingFile.received / ctx.incomingFile.size) * 100);
      ctx.progressEl.style.width = pct + '%';
    }
  }
}

async function startHost() {
  const created = await apiCreate();
  document.getElementById('host-code').textContent = created.code;
  hostWS = new WebSocket(`ws://${location.host}/ws/${created.code}?role=host`);
  hostWS.onmessage = async (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'answer' && host.pc) {
      await host.pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
    } else if (msg.type === 'candidate' && host.pc) {
      try { await host.pc.addIceCandidate(msg.candidate); } catch {}
    }
  };
  host.pc = createPC('host');
  const dc = host.pc.createDataChannel('acom');
  setupDataChannel('host', dc);
  const offer = await host.pc.createOffer();
  await host.pc.setLocalDescription(offer);
  hostWS.onopen = () => {
    hostWS.send(JSON.stringify({ type: 'offer', offer }));
  };
  host.statusEl = document.getElementById('host-status');
  host.progressEl = document.getElementById('host-progress-bar');
  setSendEnabled('host', false);
  updateStatus('host', 'connecting');
}

async function startGuest() {
  const code = document.getElementById('guest-pin').value.trim();
  if (!code) return;
  guestWS = new WebSocket(`ws://${location.host}/ws/${code}?role=guest`);
  guestWS.onmessage = async (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === 'offer') {
      guest.pc = createPC('guest');
      guest.pc.ondatachannel = (ev) => setupDataChannel('guest', ev.channel);
      await guest.pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
      const answer = await guest.pc.createAnswer();
      await guest.pc.setLocalDescription(answer);
      guestWS.send(JSON.stringify({ type: 'answer', answer }));
    } else if (msg.type === 'candidate' && guest.pc) {
      try { await guest.pc.addIceCandidate(msg.candidate); } catch {}
    }
  };
  guestWS.onopen = () => {};
  guest.statusEl = document.getElementById('guest-status');
  guest.progressEl = document.getElementById('guest-progress-bar');
  setSendEnabled('guest', false);
  updateStatus('guest', 'connecting');
}

function sendText(side) {
  const dc = side === 'host' ? host.dc : guest.dc;
  if (!dc || dc.readyState !== 'open') return;
  const input = document.getElementById(side === 'host' ? 'host-text' : 'guest-text');
  const text = input.value;
  if (!text) return;
  dc.send(text);
  log(side, 'You: ' + text);
  input.value = '';
}

async function sendFile(side) {
  const dc = side === 'host' ? host.dc : guest.dc;
  if (!dc || dc.readyState !== 'open') return;
  const input = document.getElementById(side === 'host' ? 'host-file' : 'guest-file');
  const file = input.files[0];
  if (!file) return;
  dc.send(JSON.stringify({ type: 'file-meta', name: file.name, size: file.size }));
  const chunkSize = 64 * 1024;
  let offset = 0;
  while (offset < file.size) {
    const slice = file.slice(offset, offset + chunkSize);
    const buf = await slice.arrayBuffer();
    dc.send(buf);
    offset += chunkSize;
  }
  dc.send(JSON.stringify({ type: 'file-end' }));
  log(side, 'File sent: ' + file.name);
  input.value = '';
}

function updateStatus(side, s) {
  const el = side === 'host' ? host.statusEl : guest.statusEl;
  if (!el) return;
  el.textContent = s;
  el.className = 'badge ' + (s === 'connected' ? 'ok' : s === 'closed' ? 'warn' : 'info');
}

function setSendEnabled(side, on) {
  const sendBtn = document.querySelector(side === 'host' ? '#host-panel .row .btn' : '#guest-panel .row .btn');
  const textBtn = document.querySelector(side === 'host' ? '#host-panel .row:nth-child(5) .btn' : '#guest-panel .row:nth-child(4) .btn');
  const fileBtn = document.querySelector(side === 'host' ? '#host-panel .row:nth-child(6) .btn' : '#guest-panel .row:nth-child(5) .btn');
  if (textBtn) textBtn.disabled = !on;
  if (fileBtn) fileBtn.disabled = !on;
}
