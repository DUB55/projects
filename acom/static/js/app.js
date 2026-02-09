const state = {
  tab: 'explorer',
  roots: [],
  texts: [],
  currentRoot: null,
  currentPath: '.',
  currentFile: null,
  currentText: null,
  status: null,
  sort: { field: 'name', order: 'asc' },
  sortTexts: { field: 'name', order: 'asc' },
  viewMode: 'rendered', // 'rendered' or 'source'
  selectedRoots: new Set(),
  selectedTexts: new Set()
};

function $(id) { return document.getElementById(id); }

// Expose for HTML onclick
window.bulkExtend = bulkExtend;
window.bulkDelete = bulkDelete;

async function fetchJSON(url, method = 'GET', body = null) {
  const opts = { credentials: 'same-origin', method };
  if (body) {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error('Request failed');
  return await res.json();
}

async function fetchText(url) {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw new Error('Request failed');
  return await res.text();
}

function setTab(tab) {
  state.tab = tab;
  document.querySelectorAll('nav .tab').forEach(t => t.classList.remove('active'));
  const activeBtn = document.getElementById('tab-' + tab);
  if (activeBtn) activeBtn.classList.add('active');
  const panelExplorer = $('explorer');
  const panelTexts = $('texts');
  if (panelExplorer) {
    panelExplorer.classList.add('hidden');
    panelExplorer.style.display = 'none';
  }
  if (panelTexts) {
    panelTexts.classList.add('hidden');
    panelTexts.style.display = 'none';
  }
  const target = tab === 'explorer' ? panelExplorer : panelTexts;
  if (target) {
    target.classList.remove('hidden');
    target.style.display = 'flex';
  }
  const si = $('search-input');
  const st = $('search-texts');
  if (si) si.placeholder = 'Search files...';
  if (st) st.placeholder = 'Search shared texts...';
  if (tab === 'explorer') loadRoots();
  else loadTexts();
}

async function loadStatus() {
  state.status = await fetchJSON('/api/status');
}

function formatExpiry(isoDate) {
  const diff = new Date(isoDate) - new Date();
  if (diff < 0) return 'Expired';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m left`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

function filterItems(items, query) {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(i => 
    (i.name || i.base_path).toLowerCase().includes(q) || 
    (i.tags && i.tags.some(t => t.toLowerCase().includes(q)))
  );
}

function renderRoots(roots) {
  const container = $('roots');
  container.innerHTML = '';
  const query = $('search-input').value;
  const filtered = filterItems(roots, query);
  
  if (filtered.length === 0) {
    container.innerHTML = '<p>No matching folders</p>';
    return;
  }
  const ul = document.createElement('ul');
  filtered.forEach(r => {
    const li = document.createElement('li');
    const left = document.createElement('div');
    left.className = 'name';
    const tagsHtml = (r.tags || []).map(t => `<span class="badge badge-tag">${t}</span>`).join('');
    left.innerHTML = `📁 ${r.base_path} ${tagsHtml}`;
    left.onclick = () => openRoot(r.id);
    
    const right = document.createElement('div');
    const exp = formatExpiry(r.expires_at);
    const expClass = exp.includes('m left') ? 'badge-exp soon' : 'badge-exp';
    right.innerHTML = `<span class="badge ${expClass}">${exp}</span>`;
    
    li.appendChild(left);
    li.appendChild(right);
    ul.appendChild(li);
  });
  container.appendChild(ul);
}

async function loadRoots() {
  state.roots = await fetchJSON('/api/roots');
  renderRoots(state.roots);
  $('tree').classList.add('hidden');
}

async function openRoot(rootId) {
  state.currentRoot = rootId;
  state.currentPath = '.';
  $('tree').classList.remove('hidden');
  $('file-view').classList.add('hidden');
  renderBreadcrumbs();
  loadTree();
}

function renderBreadcrumbs() {
  const container = $('current-path');
  container.innerHTML = '';
  
  const parts = state.currentPath.split('/').filter(p => p && p !== '.');
  const home = document.createElement('span');
  home.className = 'breadcrumb-link';
  home.textContent = 'root';
  home.onclick = () => navigate('.');
  container.appendChild(home);
  
  let accum = '.';
  parts.forEach(p => {
    const sep = document.createElement('span');
    sep.className = 'breadcrumb-sep';
    sep.textContent = ' / ';
    container.appendChild(sep);
    
    accum += '/' + p;
    const link = document.createElement('span');
    link.className = 'breadcrumb-link';
    link.textContent = p;
    const path = accum; // closure capture
    link.onclick = () => navigate(path);
    container.appendChild(link);
  });
  
  // Update Zip Link
  const zipLink = $('zip-current');
  zipLink.href = `/api/roots/${state.currentRoot}/zip?path=${encodeURIComponent(state.currentPath)}`;
}

async function loadTree() {
  $('entries').innerHTML = 'Loading...';
  const { field, order } = state.sort;
  const data = await fetchJSON(`/api/roots/${state.currentRoot}/tree?path=${encodeURIComponent(state.currentPath)}&sort=${field}&order=${order}`);
  renderEntries(data.entries);
}

async function navigate(path) {
  // Normalize path
  state.currentPath = path.replace(/\/+/g, '/');
  if (state.currentPath.startsWith('./')) state.currentPath = state.currentPath.substring(2);
  if (state.currentPath === '') state.currentPath = '.';
  
  $('file-view').classList.add('hidden');
  renderBreadcrumbs();
  loadTree();
}

function renderEntries(entries) {
  const list = $('entries');
  list.innerHTML = '';
  if (state.currentPath !== '.') {
    const li = document.createElement('li');
    li.innerHTML = '<div class="name">..</div>';
    li.onclick = () => {
      const parts = state.currentPath.split('/');
      parts.pop();
      const parent = parts.join('/') || '.';
      navigate(parent);
    };
    list.appendChild(li);
  }
  
  entries.forEach(e => {
    const li = document.createElement('li');
    const left = document.createElement('div');
    left.className = 'name';
    left.textContent = (e.is_dir ? '📁 ' : '📄 ') + e.name;
    left.onclick = () => {
      if (e.is_dir) navigate(e.path);
      else openFile(e.name, e.path);
    };
    const right = document.createElement('div');
    right.textContent = e.is_dir ? 'dir' : 'file';
    li.appendChild(left);
    li.appendChild(right);
    list.appendChild(li);
  });
}

async function openFile(name, relPath) {
  $('file-view').classList.remove('hidden');
  $('file-name').textContent = name;
  
  // Reset viewers
  ['image-view', 'html-view', 'markdown-view', 'code-view', 'file-content'].forEach(id => $(id).classList.add('hidden'));
  $('toggle-source').classList.add('hidden');
  state.viewMode = 'rendered';
  $('toggle-source').textContent = 'View Source';

  const baseUrl = `/api/roots/${state.currentRoot}/file?path=${encodeURIComponent(relPath)}`;
  const downloadUrl = `${baseUrl}&download=1`;
  const dl = $('download-file');
  dl.href = downloadUrl;
  dl.setAttribute('download', name);
  
  const ext = name.split('.').pop().toLowerCase();
  
  // Image
  if (['png','jpg','jpeg','gif','webp','svg'].includes(ext)) {
    const img = $('image-view');
    img.src = baseUrl;
    img.classList.remove('hidden');
    state.currentFile = null; // No text content
    $('copy-file').disabled = true;
    return;
  }
  
  // Fetch content
  try {
    const res = await fetch(baseUrl, { credentials: 'same-origin' });
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    
    // HTML
    if (ct.includes('text/html') || ext === 'html') {
      const htmlView = $('html-view');
      htmlView.src = baseUrl; // Iframe loads it
      htmlView.classList.remove('hidden');
      $('toggle-source').classList.remove('hidden');
      
      const text = await res.text();
      state.currentFile = text;
      $('file-content').textContent = text; // Prepare source view
      $('copy-file').disabled = false;
      return;
    }
    
    const isTextType = ct.startsWith('text/') || ['js','py','json','css','html','c','cpp','rs','go','java','ts','md','txt','csv','xml','yml','yaml'].includes(ext);
    if (!isTextType) {
      $('file-content').textContent = 'Binary file preview not available. Use Download.';
      $('file-content').classList.remove('hidden');
      state.currentFile = null;
      $('copy-file').disabled = true;
      return;
    }
    const text = await res.text();
    state.currentFile = text;
    $('copy-file').disabled = false;
    
    // Markdown
    if (ext === 'md') {
      const mdView = $('markdown-view');
      const mdRes = await fetch('/api/render/markdown', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({content: text})
      });
      mdView.innerHTML = await mdRes.text();
      mdView.classList.remove('hidden');
      $('file-content').textContent = text;
      $('toggle-source').classList.remove('hidden');
      return;
    }
    
    // Code / Text
    if (['js','py','json','css','html','c','cpp','rs','go','java','ts'].includes(ext) || ct.startsWith('text/')) {
      const codeView = $('code-view');
      const codeContent = $('code-content');
      codeContent.className = ''; // reset
      codeContent.textContent = text;
      $('file-content').textContent = text; // Enable source toggle for code/text
      $('toggle-source').classList.remove('hidden');
      
      // Auto highlight
      if (window.hljs) hljs.highlightElement(codeContent);
      
      codeView.classList.remove('hidden');
      return;
    }
    
    // Fallback
    $('file-content').textContent = text;
    $('file-content').classList.remove('hidden');
    
  } catch (e) {
    console.error(e);
    $('file-content').textContent = 'Error loading file.';
    $('file-content').classList.remove('hidden');
  }
}

function toggleSource() {
  state.viewMode = state.viewMode === 'rendered' ? 'source' : 'rendered';
  const isSource = state.viewMode === 'source';
  $('toggle-source').textContent = isSource ? 'View Rendered' : 'View Source';
  
  if (isSource) {
    // Hide rendered views
    $('html-view').classList.add('hidden');
    $('markdown-view').classList.add('hidden');
    $('code-view').classList.add('hidden');
    // Show source
    $('file-content').classList.remove('hidden');
  } else {
    // Show rendered views
    $('file-content').classList.add('hidden');
    const name = $('file-name').textContent;
    const ext = name.split('.').pop().toLowerCase();
    if (ext === 'md') {
      $('markdown-view').classList.remove('hidden');
    } else if (ext === 'html') {
      $('html-view').classList.remove('hidden');
    } else {
      $('code-view').classList.remove('hidden');
    }
  }
}

async function loadTexts() {
  state.texts = await fetchJSON('/api/texts');
  renderTexts(state.texts);
}

function renderTexts(texts) {
  const container = $('texts-list');
  container.innerHTML = '';
  const query = $('search-texts').value;
  let filtered = filterItems(texts, query);
  const { field, order } = state.sortTexts;
  filtered = filtered.slice().sort((a, b) => {
    const dir = order === 'desc' ? -1 : 1;
    if (field === 'name') {
      return a.name.toLowerCase() < b.name.toLowerCase() ? -1 * dir : a.name.toLowerCase() > b.name.toLowerCase() ? 1 * dir : 0;
    } else if (field === 'type') {
      const at = ((a.tags || [])[0] || '').toLowerCase();
      const bt = ((b.tags || [])[0] || '').toLowerCase();
      return at < bt ? -1 * dir : at > bt ? 1 * dir : 0;
    } else if (field === 'size') {
      const asz = a.size || 0;
      const bsz = b.size || 0;
      return (asz - bsz) * dir;
    } else if (field === 'time') {
      const at = new Date(a.created_at).getTime();
      const bt = new Date(b.created_at).getTime();
      return (at - bt) * dir;
    }
    return 0;
  });
  
  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-msg">No shared texts</div>';
    return;
  }
  filtered.forEach(t => {
    const li = document.createElement('li');
    const left = document.createElement('div');
    left.className = 'name';
    const tagsHtml = (t.tags || []).map(g => `<span class="badge badge-tag">${g}</span>`).join('');
    left.innerHTML = `${t.name} ${tagsHtml}`;
    left.onclick = () => openText(t);
    
    const right = document.createElement('div');
    const exp = formatExpiry(t.expires_at);
    const expClass = exp.includes('m left') ? 'badge-exp soon' : 'badge-exp';
    right.innerHTML = `
      <span class="badge ${expClass}">${exp}</span>
      <button class="action-btn" onclick="extendText('${t.id}', event)">+1h</button>
      <button class="action-btn" onclick="purgeText('${t.id}', event)">🗑️</button>
    `;
    
    li.appendChild(left);
    li.appendChild(right);
    container.appendChild(li);
  });
}

async function extendText(id, e) {
  e.stopPropagation();
  if (!confirm('Extend this text by 60 minutes?')) return;
  try {
    await fetchJSON(`/api/texts/${id}/extend`, { method: 'POST', body: JSON.stringify({minutes: 60}) });
    loadTexts();
  } catch (err) { alert('Failed to extend'); }
}

async function purgeText(id, e) {
  e.stopPropagation();
  if (!confirm('Delete this text?')) return;
  try {
    await fetchJSON(`/api/texts/${id}`, { method: 'DELETE' });
    loadTexts();
  } catch (err) { alert('Failed to delete'); }
}

async function openText(t) {
  $('text-view').classList.remove('hidden');
  $('text-name').textContent = t.name;
  $('text-meta').textContent = `Shared: ${new Date(t.created_at).toLocaleString()} | Expires: ${new Date(t.expires_at).toLocaleString()}`;
  const content = await fetchText(`/api/texts/${t.id}`);
  state.currentText = content;
  $('text-content').textContent = content;
}

async function copyToClipboard(text) {
  if (!text) return;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      alert('Copied!');
      return;
    }
    throw new Error('Clipboard API unavailable');
  } catch (err) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; 
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      alert('Copied!');
    } catch (e) {
      alert('Copy failed');
    }
    document.body.removeChild(textArea);
  }
}

async function init() {
  $('tab-explorer').onclick = () => { setTab('explorer'); loadRoots(); };
  $('tab-texts').onclick = () => { setTab('texts'); loadTexts(); };
  
  // Refresh buttons
  $('refresh-explorer').onclick = () => location.reload();
  $('refresh-texts').onclick = () => location.reload();

  $('back-to-roots').onclick = () => { $('tree').classList.add('hidden'); $('file-view').classList.add('hidden'); loadRoots(); };
  $('close-file').onclick = () => { $('file-view').classList.add('hidden'); };
  $('close-text').onclick = () => { $('text-view').classList.add('hidden'); };
  $('copy-file').onclick = () => copyToClipboard(state.currentFile);
  $('copy-text').onclick = () => copyToClipboard(state.currentText);
  $('toggle-source').onclick = toggleSource;
  
  $('search-input').oninput = () => renderRoots(state.roots);
  $('search-texts').oninput = () => renderTexts(state.texts);
  
  $('sort-select').onchange = (e) => {
    state.sort.field = e.target.value;
    if (state.currentRoot && !$('tree').classList.contains('hidden')) {
      loadTree();
    }
  };
  const stSel = $('sort-texts');
  if (stSel) {
    stSel.onchange = (e) => {
      state.sortTexts.field = e.target.value;
      renderTexts(state.texts);
    };
  }
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) {
      if (!$('file-view').classList.contains('hidden')) {
         $('file-view').classList.add('hidden');
      } else if (!$('tree').classList.contains('hidden')) {
         const parts = state.currentPath.split('/');
         if (parts.length > 1 && state.currentPath !== '.') {
           parts.pop();
           navigate(parts.join('/'));
         } else {
           $('back-to-roots').click();
         }
      }
    }
  });

  try {
    await loadStatus();
    loadRoots(); // Initial load
  } catch (e) {
    // not logged in
  }
}

document.addEventListener('DOMContentLoaded', init);
