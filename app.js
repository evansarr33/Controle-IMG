/* ===========================================================
   Contact Sheet — app.js
   Charge data/images.json, synchronise les décisions avec
   Firestore, gère la navigation clavier et les filtres.
   =========================================================== */

const STATUS = {
  CONFORME: 'conforme',
  NON_CONFORME: 'non_conforme',
  RESERVE: 'reserve',
};

const STATUS_LABEL = {
  conforme: 'Conforme',
  non_conforme: 'Non conforme',
  reserve: 'Réservée',
};

let images = [];        // [{ public_id, url, thumb_url, format, width, height }]
let reviews = {};        // { [public_id]: { status, comment, updatedAt } }
let currentIndex = 0;
let currentFilter = 'all';
let db = null;
let pendingReserveId = null;

const els = {};

document.addEventListener('DOMContentLoaded', init);

window.addEventListener('error', (e) => {
  showFatalError(`Erreur JavaScript : ${e.message}\n(fichier: ${e.filename}, ligne ${e.lineno})`);
});
window.addEventListener('unhandledrejection', (e) => {
  showFatalError(`Erreur non gérée : ${e.reason?.message || e.reason}`);
});

function showFatalError(msg) {
  const el = document.getElementById('fatalError');
  if (!el) { console.error(msg); return; }
  el.hidden = false;
  el.textContent = '⚠ ' + msg;
}

async function init() {
  try {
    cacheEls();
    bindStaticEvents();
    initFirebase();
    await loadManifest();
    if (db) {
      await loadReviews();
    }
    render();
  } catch (err) {
    console.error(err);
    showFatalError(`Échec au démarrage : ${err.message}`);
  }
}

function cacheEls() {
  els.filmstrip = document.getElementById('filmstrip');
  els.filmstripLoading = document.getElementById('filmstripLoading');
  els.viewerFrame = document.getElementById('viewerFrame');
  els.viewerEmpty = document.getElementById('viewerEmpty');
  els.viewerImage = document.getElementById('viewerImage');
  els.viewerStatusBadge = document.getElementById('viewerStatusBadge');
  els.viewerMeta = document.getElementById('viewerMeta');
  els.progressFill = document.getElementById('progressFill');
  els.progressLabel = document.getElementById('progressLabel');
  els.filters = document.getElementById('filters');
  els.reservePanel = document.getElementById('reservePanel');
  els.reserveComment = document.getElementById('reserveComment');
  els.reserveCancel = document.getElementById('reserveCancel');
  els.reserveConfirm = document.getElementById('reserveConfirm');
  els.controls = document.getElementById('controls');
  els.toast = document.getElementById('toast');

  els.viewerImage.addEventListener('error', () => {
    const img = images[currentIndex];
    if (!img) return;
    els.viewerEmpty.hidden = false;
    els.viewerEmpty.innerHTML = `<p>Image impossible à charger.</p><p class="viewer-empty-sub">Vérifie l'URL dans <code>data/images.json</code> : ${escapeHtml(img.url || 'URL manquante')}</p>`;
    showToast(`Image introuvable : ${img.public_id}`);
  });
}


/* ---------------- Firebase ---------------- */

function initFirebase() {
  if (typeof firebaseConfig === 'undefined' || !firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith('YOUR_')) {
    console.warn('Firebase non configuré — voir firebase-config.js. Les décisions ne seront pas sauvegardées.');
    return;
  }
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
}

async function loadReviews() {
  try {
    const snap = await db.collection('reviews').get();
    snap.forEach(doc => { reviews[doc.id] = doc.data(); });
  } catch (err) {
    console.error('Impossible de charger les décisions Firestore :', err);
    showToast('Erreur de connexion à Firestore — vérifie firebase-config.js et les règles de sécurité.');
  }
}

async function saveReview(publicId, status, comment) {
  const entry = { status, comment: comment || '', updatedAt: Date.now() };
  reviews[publicId] = entry;
  render();
  if (!db) {
    showToast('Non sauvegardé — Firebase non configuré (voir README).');
    return;
  }
  try {
    await db.collection('reviews').doc(publicId).set(entry);
  } catch (err) {
    console.error(err);
    showToast('Échec de la sauvegarde Firestore.');
  }
}

/* ---------------- Manifest ---------------- */

async function loadManifest() {
  const manifestUrl = new URL('data/images.json', document.baseURI).href;
  try {
    const res = await fetch('data/images.json', { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`data/images.json a répondu ${res.status} ${res.statusText} (URL testée : ${manifestUrl})`);
    }
    const text = await res.text();
    try {
      images = JSON.parse(text);
    } catch (parseErr) {
      throw new Error(`data/images.json n'est pas un JSON valide : ${parseErr.message}`);
    }
    if (!Array.isArray(images)) {
      throw new Error('data/images.json ne contient pas une liste (tableau [...]).');
    }
  } catch (err) {
    console.error(err);
    images = [];
    showFatalError(err.message);
  }
  els.filmstripLoading.hidden = images.length > 0;
  if (images.length === 0) {
    els.filmstripLoading.textContent = `Aucune image chargée depuis ${manifestUrl}`;
  }
}

/* ---------------- Rendering ---------------- */

function getFilteredIndices() {
  return images
    .map((img, i) => i)
    .filter(i => {
      const status = reviews[images[i].public_id]?.status;
      if (currentFilter === 'all') return true;
      if (currentFilter === 'untreated') return !status;
      return status === currentFilter;
    });
}

function render() {
  renderFilmstrip();
  renderViewer();
  renderProgress();
}

function renderFilmstrip() {
  els.filmstrip.querySelectorAll('.frame-item').forEach(n => n.remove());
  const frag = document.createDocumentFragment();
  images.forEach((img, i) => {
    if (currentFilter !== 'all') {
      const status = reviews[img.public_id]?.status;
      const matches = currentFilter === 'untreated' ? !status : status === currentFilter;
      if (!matches) return;
    }
    const item = document.createElement('div');
    item.className = 'frame-item' + (i === currentIndex ? ' selected' : '');
    item.tabIndex = 0;
    item.dataset.index = i;
    const status = reviews[img.public_id]?.status;
    item.innerHTML = `
      <img class="frame-thumb" src="${img.thumb_url || img.url}" alt="" loading="lazy">
      <div class="frame-info">
        <div class="frame-index">#${String(i + 1).padStart(3, '0')}</div>
        <div class="frame-name">${escapeHtml(img.public_id)}</div>
      </div>
      <div class="frame-dot ${status || ''}"></div>
    `;
    item.addEventListener('click', () => { currentIndex = i; render(); scrollToSelected(); });
    frag.appendChild(item);
  });
  els.filmstrip.appendChild(frag);
}

function scrollToSelected() {
  const sel = els.filmstrip.querySelector('.frame-item.selected');
  if (sel) sel.scrollIntoView({ block: 'nearest' });
}

function renderViewer() {
  const img = images[currentIndex];
  closeReservePanel();

  if (!img) {
    els.viewerEmpty.hidden = false;
    els.viewerImage.hidden = true;
    els.viewerStatusBadge.hidden = true;
    els.viewerMeta.textContent = '';
    els.controls.style.opacity = 0.4;
    els.controls.style.pointerEvents = 'none';
    return;
  }

  els.controls.style.opacity = 1;
  els.controls.style.pointerEvents = 'auto';
  els.viewerEmpty.hidden = true;
  els.viewerImage.hidden = false;
  els.viewerImage.src = img.url;
  els.viewerImage.alt = img.public_id;
  els.viewerEmpty.innerHTML = `<p>Aucune image chargée.</p><p class="viewer-empty-sub">Génère <code>data/images.json</code> avec le script d'import, puis recharge la page.</p>`;

  const status = reviews[img.public_id]?.status;
  if (status) {
    els.viewerStatusBadge.hidden = false;
    els.viewerStatusBadge.textContent = STATUS_LABEL[status];
    els.viewerStatusBadge.className = 'viewer-status-badge ' + status;
  } else {
    els.viewerStatusBadge.hidden = true;
  }

  const dims = img.width && img.height ? `${img.width}×${img.height}px` : '';
  const meta = [`#${currentIndex + 1} / ${images.length}`, img.format?.toUpperCase(), dims].filter(Boolean).join('  ·  ');
  els.viewerMeta.textContent = meta;

  if (status === STATUS.RESERVE && reviews[img.public_id]?.comment) {
    els.viewerMeta.textContent += `  ·  « ${reviews[img.public_id].comment} »`;
  }
}

function renderProgress() {
  const total = images.length;
  const done = images.filter(img => reviews[img.public_id]?.status).length;
  els.progressFill.style.width = total ? `${(done / total) * 100}%` : '0%';
  els.progressLabel.textContent = `${done} / ${total} traitées`;
}

/* ---------------- Decisions ---------------- */

function handleDecision(action) {
  const img = images[currentIndex];
  if (!img) return;

  if (action === STATUS.RESERVE) {
    openReservePanel();
    return;
  }

  saveReview(img.public_id, action, '');
  advanceToNext();
}

function openReservePanel() {
  const img = images[currentIndex];
  pendingReserveId = img.public_id;
  els.reservePanel.hidden = false;
  els.reserveComment.value = reviews[img.public_id]?.comment || '';
  els.reserveComment.focus();
}

function closeReservePanel() {
  els.reservePanel.hidden = true;
  pendingReserveId = null;
}

function confirmReserve() {
  if (!pendingReserveId) return;
  const comment = els.reserveComment.value.trim();
  saveReview(pendingReserveId, STATUS.RESERVE, comment);
  closeReservePanel();
  advanceToNext();
}

function advanceToNext() {
  const visible = getFilteredIndices();
  const pos = visible.indexOf(currentIndex);
  if (pos !== -1 && pos + 1 < visible.length) {
    currentIndex = visible[pos + 1];
  } else if (currentIndex + 1 < images.length) {
    currentIndex += 1;
  }
  render();
  scrollToSelected();
}

function moveSelection(delta) {
  const visible = getFilteredIndices();
  if (visible.length === 0) return;
  const pos = visible.indexOf(currentIndex);
  let nextPos = pos === -1 ? 0 : pos + delta;
  nextPos = Math.max(0, Math.min(visible.length - 1, nextPos));
  currentIndex = visible[nextPos];
  render();
  scrollToSelected();
}

/* ---------------- Events ---------------- */

function bindStaticEvents() {
  els.controls.querySelectorAll('.keycap').forEach(btn => {
    btn.addEventListener('click', () => handleDecision(btn.dataset.action));
  });

  els.reserveCancel.addEventListener('click', closeReservePanel);
  els.reserveConfirm.addEventListener('click', confirmReserve);

  els.filters.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      currentFilter = chip.dataset.filter;
      els.filters.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c === chip));
      const visible = getFilteredIndices();
      if (visible.length && !visible.includes(currentIndex)) currentIndex = visible[0];
      render();
    });
  });

  document.addEventListener('keydown', onKeydown);
}

function onKeydown(e) {
  const reserveOpen = !els.reservePanel.hidden;

  if (reserveOpen) {
    if (e.key === 'Escape') { closeReservePanel(); }
    else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || document.activeElement !== els.reserveComment)) { confirmReserve(); }
    return;
  }

  if (document.activeElement && ['TEXTAREA', 'INPUT'].includes(document.activeElement.tagName)) return;

  switch (e.key) {
    case '1': handleDecision(STATUS.NON_CONFORME); break;
    case '2': handleDecision(STATUS.CONFORME); break;
    case '3': handleDecision(STATUS.RESERVE); break;
    case 'ArrowDown': e.preventDefault(); moveSelection(1); break;
    case 'ArrowUp': e.preventDefault(); moveSelection(-1); break;
  }
}

/* ---------------- Toast ---------------- */

let toastTimer = null;
function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { els.toast.hidden = true; }, 3500);
}


function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
