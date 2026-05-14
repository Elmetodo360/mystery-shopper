// Mystery Shopper - lógica del dashboard interno (dashboard.html)

const els = {
  loginSection: document.getElementById('loginSection'),
  dashboardSection: document.getElementById('dashboardSection'),
  adminCodeInput: document.getElementById('adminCodeInput'),
  adminLoginBtn: document.getElementById('adminLoginBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  newVisitBtn: document.getElementById('newVisitBtn'),
  importBtn: document.getElementById('importBtn'),
  importFile: document.getElementById('importFile'),
  configBtn: document.getElementById('configBtn'),
  kpiGrid: document.getElementById('kpiGrid'),
  visitList: document.getElementById('visitList'),
  visitDetail: document.getElementById('visitDetail'),
  modalContainer: document.getElementById('modalContainer'),
  toast: document.getElementById('toast'),
};

function showToast(msg, isErr) {
  els.toast.textContent = msg;
  els.toast.style.background = isErr ? 'var(--c-error)' : 'var(--c-primary)';
  els.toast.classList.add('show');
  setTimeout(() => els.toast.classList.remove('show'), 2400);
}

function showLogin() {
  els.loginSection.style.display = '';
  els.dashboardSection.style.display = 'none';
  els.logoutBtn.style.display = 'none';
}
function showDashboard() {
  els.loginSection.style.display = 'none';
  els.dashboardSection.style.display = '';
  els.logoutBtn.style.display = '';
  renderDashboard();
}

els.adminLoginBtn.addEventListener('click', () => {
  const input = els.adminCodeInput.value.trim();
  const cfg = MS_STORAGE.getConfig();
  if (input === cfg.adminCode) {
    MS_STORAGE.setAdminLogged(true);
    showDashboard();
  } else {
    showToast('Código incorrecto', true);
  }
});
els.adminCodeInput.addEventListener('keydown', e => { if (e.key === 'Enter') els.adminLoginBtn.click(); });
els.logoutBtn.addEventListener('click', () => { MS_STORAGE.setAdminLogged(false); showLogin(); });

if (MS_STORAGE.isAdminLogged()) showDashboard(); else showLogin();

// ====== Dashboard render ======

function renderDashboard() {
  const all = MS_STORAGE.loadAllVisits().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  renderKPIs(all);
  renderVisitList(all);
}

function renderKPIs(visits) {
  const submitted = visits.filter(v => v.status === 'submitted');
  const drafts = visits.filter(v => v.status === 'draft');
  const localCount = new Set(visits.map(v => v.local && v.local.name).filter(Boolean)).size;
  let avgScore = '—';
  if (submitted.length) {
    const scores = submitted.map(v => computeVisitScorePct(v)).filter(n => n != null);
    if (scores.length) avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(0) + '%';
  }
  els.kpiGrid.innerHTML = `
    <div class="kpi"><div class="kpi-num">${visits.length}</div><div class="kpi-label">Visitas totales</div></div>
    <div class="kpi"><div class="kpi-num">${submitted.length}</div><div class="kpi-label">Enviadas</div></div>
    <div class="kpi"><div class="kpi-num">${drafts.length}</div><div class="kpi-label">Borradores</div></div>
    <div class="kpi"><div class="kpi-num">${localCount}</div><div class="kpi-label">Locales auditados</div></div>
    <div class="kpi"><div class="kpi-num">${avgScore}</div><div class="kpi-label">Score medio</div></div>
  `;
}

function computeVisitScorePct(v) {
  // Score normalizado 0-100 sobre las preguntas respondidas
  const flat = MS_QUESTIONS.getAllQuestionsFlat();
  let totalPoints = 0;
  let earnedPoints = 0;
  for (const q of flat) {
    const a = v.answers && v.answers[q.id];
    if (!a || a.val == null || a.val === 'na') continue;
    if (q.type === 'yesno') {
      totalPoints += 5;
      earnedPoints += (a.val === 'si') ? 5 : 0;
    } else {
      totalPoints += 5;
      earnedPoints += parseInt(a.val, 10);
    }
  }
  if (totalPoints === 0) return null;
  return Math.round((earnedPoints / totalPoints) * 100);
}

function scoreClass(pct) {
  if (pct == null) return '';
  if (pct >= 75) return 'good';
  if (pct >= 50) return 'mid';
  return 'bad';
}

function renderVisitList(visits) {
  if (!visits.length) {
    els.visitList.innerHTML = `<div class="empty-state">No hay visitas todavía. Pulsa "Generar enlace de visita" para crear la primera.</div>`;
    return;
  }
  els.visitList.innerHTML = '';
  for (const v of visits) {
    const pct = computeVisitScorePct(v);
    const item = document.createElement('div');
    item.className = 'visit-item';
    item.innerHTML = `
      <div>
        <div style="font-weight:600">${escapeHtml(v.local && v.local.name || '(sin nombre)')}</div>
        <div class="v-meta">
          ${escapeHtml(v.visit && v.visit.date || '—')} · ${escapeHtml(v.auditor && v.auditor.name || '—')} · código ${escapeHtml(v.code || '—')}
          · ${v.status === 'submitted' ? 'Enviada' : 'Borrador'}
        </div>
      </div>
      <div class="v-score ${scoreClass(pct)}">${pct != null ? pct + '%' : '—'}</div>
    `;
    item.addEventListener('click', () => renderVisitDetail(v.id));
    els.visitList.appendChild(item);
  }
}

async function renderVisitDetail(visitId) {
  const v = MS_STORAGE.loadVisit(visitId);
  if (!v) { showToast('Visita no encontrada', true); return; }
  const flat = MS_QUESTIONS.getAllQuestionsFlat();
  const pct = computeVisitScorePct(v);
  const blockScores = computeBlockScores(v);

  const photosEls = [];
  for (const q of flat) {
    const a = v.answers && v.answers[q.id];
    if (a && a.photoId) {
      const blob = await MS_STORAGE.getPhoto(a.photoId);
      if (blob) photosEls.push({ qid: q.id, qtext: q.text, url: URL.createObjectURL(blob) });
    }
  }
  // Fotos de platos
  const dishPhotoUrls = [];
  if (Array.isArray(v.dishes)) {
    for (let i = 0; i < v.dishes.length; i++) {
      const d = v.dishes[i];
      if (d && d.photoId) {
        const blob = await MS_STORAGE.getPhoto(d.photoId);
        if (blob) dishPhotoUrls.push({ idx: i, url: URL.createObjectURL(blob) });
      }
    }
  }
  // Foto del ticket
  let ticketUrl = null;
  if (v.ticketPhotoId) {
    const blob = await MS_STORAGE.getPhoto(v.ticketPhotoId);
    if (blob) ticketUrl = URL.createObjectURL(blob);
  }

  // Productividad (clientes por camarero) — entrada y salida
  const hc = v.headcount || {};
  const prodIn  = (hc.inStaff && hc.inClients != null)   ? (hc.inClients / hc.inStaff).toFixed(1)   : null;
  const prodOut = (hc.outStaff && hc.outClients != null) ? (hc.outClients / hc.outStaff).toFixed(1) : null;

  let html = `
    <button class="btn btn-ghost" id="backToListBtn" style="margin-bottom:12px">Volver</button>
    <h2>${escapeHtml(v.local && v.local.name || '(sin nombre)')}</h2>
    <p class="subtitle">
      Visita ${escapeHtml(v.visit && v.visit.date || '—')} ·
      Auditor: ${escapeHtml(v.auditor && v.auditor.name || '—')} ·
      Tipo: ${escapeHtml(v.visit && v.visit.type || '—')} ·
      Comensales: ${v.visit && v.visit.guests || '—'} ·
      Ticket: ${v.visit && v.visit.ticket ? v.visit.ticket + ' €' : '—'}
    </p>

    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:13px; color:var(--c-muted)">Score global checklist</div>
          <div class="v-score ${scoreClass(pct)}" style="font-size:36px">${pct != null ? pct + '%' : '—'}</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:13px; color:var(--c-muted)">Valoración auditor</div>
          <div style="font-size:24px; color: var(--c-dorado); font-family: var(--font-display); font-weight:700;">
            ${renderStarsRO(v.ratings && v.ratings.global)}
          </div>
        </div>
        <div style="text-align:right; font-size:13px; color:var(--c-muted)">
          Estado: <strong>${v.status === 'submitted' ? 'Enviada' : 'Borrador'}</strong><br />
          Código: <strong>${escapeHtml(v.code || '—')}</strong>
        </div>
      </div>
    </div>

    <h3>Datos operativos (productividad)</h3>
    <div class="card">
      <table style="width:100%; font-size:14px; border-collapse:collapse;">
        <tr style="border-bottom:1px solid var(--c-border); color: var(--c-muted); font-size:12px; text-transform:uppercase; letter-spacing:1px;">
          <th style="text-align:left; padding:8px 4px;">Momento</th>
          <th style="text-align:right; padding:8px 4px;">Hora</th>
          <th style="text-align:right; padding:8px 4px;">Clientes</th>
          <th style="text-align:right; padding:8px 4px;">Camareros</th>
          <th style="text-align:right; padding:8px 4px;">Clientes/Cam.</th>
        </tr>
        <tr style="border-bottom:1px solid var(--c-border);">
          <td style="padding:10px 4px;"><strong>Entrada</strong></td>
          <td style="text-align:right; padding:10px 4px;">${escapeHtml(v.visit && v.visit.timeIn || '—')}</td>
          <td style="text-align:right; padding:10px 4px;">${hc.inClients != null ? hc.inClients : '—'}</td>
          <td style="text-align:right; padding:10px 4px;">${hc.inStaff != null ? hc.inStaff : '—'}</td>
          <td style="text-align:right; padding:10px 4px;"><strong>${prodIn || '—'}</strong></td>
        </tr>
        <tr>
          <td style="padding:10px 4px;"><strong>Salida</strong></td>
          <td style="text-align:right; padding:10px 4px;">${escapeHtml(v.visit && v.visit.timeOut || '—')}</td>
          <td style="text-align:right; padding:10px 4px;">${hc.outClients != null ? hc.outClients : '—'}</td>
          <td style="text-align:right; padding:10px 4px;">${hc.outStaff != null ? hc.outStaff : '—'}</td>
          <td style="text-align:right; padding:10px 4px;"><strong>${prodOut || '—'}</strong></td>
        </tr>
      </table>
    </div>

    ${renderRatingsBlockHTML(v.ratings)}

    ${renderDishesBlockHTML(v.dishes, dishPhotoUrls)}

    ${ticketUrl ? `
      <h3>Ticket de la visita</h3>
      <div class="card" style="text-align:center;">
        <img src="${ticketUrl}" style="max-width:100%; max-height:400px; border-radius:6px; border:1px solid var(--c-border); cursor:pointer;" data-full="${ticketUrl}" class="ticket-img" />
        <div style="font-size:13px; color:var(--c-muted); margin-top:8px;">Importe declarado: ${v.visit && v.visit.ticket ? v.visit.ticket.toFixed(2) + ' €' : '—'}</div>
      </div>
    ` : ''}

    <h3>Score por bloque</h3>
    <div class="card block-scores">
      ${blockScores.map(b => `
        <div class="block-row">
          <div class="b-name">${escapeHtml(b.title)}</div>
          <div class="b-bar"><div class="b-bar-fill" style="width:${b.pct != null ? b.pct : 0}%"></div></div>
          <div class="b-pct">${b.pct != null ? b.pct + '%' : '—'}</div>
        </div>
      `).join('')}
    </div>

    ${v.finalSummary ? `<h3>Resumen del auditor</h3><div class="card"><em>"${escapeHtml(v.finalSummary)}"</em></div>` : ''}
    ${v.finalNotes ? `<h3>Observaciones generales</h3><div class="card">${escapeHtml(v.finalNotes).replace(/\n/g, '<br />')}</div>` : ''}

    <h3>Detalle por pregunta</h3>
    ${MS_CHECKLIST.blocks.map(b => `
      <div class="block-header"><h3 class="block-title">${escapeHtml(b.title)}</h3></div>
      ${b.questions.map(q => {
        const a = (v.answers || {})[q.id] || {};
        let valHtml = '<span style="color:var(--c-muted)">sin responder</span>';
        if (a.val != null) {
          if (q.type === 'yesno') {
            const map = { si: '<span style="color:var(--c-success); font-weight:600">SÍ</span>', no: '<span style="color:var(--c-error); font-weight:600">NO</span>', na: '<span style="color:var(--c-na)">N/A</span>' };
            valHtml = map[a.val] || a.val;
          } else {
            valHtml = `<strong>${a.val} / 5</strong>`;
          }
        }
        return `
          <div class="question">
            <span class="q-id">${q.id}</span>
            <div class="q-text">${escapeHtml(q.text)}</div>
            <div style="margin: 8px 0">${valHtml}</div>
            ${a.note ? `<div style="background:#fafaf7; padding:8px; border-radius:6px; font-size:14px"><strong>Nota:</strong> ${escapeHtml(a.note).replace(/\n/g, '<br />')}</div>` : ''}
          </div>
        `;
      }).join('')}
    `).join('')}

    ${photosEls.length ? `
      <h3>Galería de fotos (${photosEls.length})</h3>
      <div class="gallery">
        ${photosEls.map(p => `<img src="${p.url}" alt="${escapeHtml(p.qid)}" data-full="${p.url}" />`).join('')}
      </div>
    ` : ''}

    <div style="display:flex; gap:8px; margin: 20px 0; flex-wrap:wrap;">
      <button class="btn btn-primary" id="exportPdfBtn">Imprimir / Exportar PDF</button>
      <button class="btn btn-ghost" id="exportJsonBtn">Descargar JSON completo</button>
      <button class="btn btn-danger" id="deleteVisitBtn">Eliminar visita</button>
    </div>
  `;

  els.visitList.style.display = 'none';
  els.kpiGrid.style.display = 'none';
  els.visitDetail.innerHTML = html;
  els.visitDetail.style.display = '';

  document.getElementById('backToListBtn').addEventListener('click', () => {
    els.visitDetail.style.display = 'none';
    els.visitList.style.display = '';
    els.kpiGrid.style.display = '';
    photosEls.forEach(p => URL.revokeObjectURL(p.url));
    dishPhotoUrls.forEach(d => URL.revokeObjectURL(d.url));
    if (ticketUrl) URL.revokeObjectURL(ticketUrl);
  });

  document.getElementById('exportPdfBtn').addEventListener('click', () => window.print());

  document.getElementById('exportJsonBtn').addEventListener('click', async () => {
    const full = await MS_STORAGE.exportVisitWithPhotos(v);
    const blob = new Blob([JSON.stringify(full, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `visita_${v.code}_${v.id}.json`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 800);
  });

  document.getElementById('deleteVisitBtn').addEventListener('click', () => {
    if (!confirm('¿Eliminar esta visita? No se puede deshacer.')) return;
    // borrar fotos de respuestas
    for (const q of flat) {
      const a = (v.answers || {})[q.id];
      if (a && a.photoId) MS_STORAGE.deletePhoto(a.photoId).catch(() => {});
    }
    // borrar fotos de platos
    if (Array.isArray(v.dishes)) {
      for (const d of v.dishes) {
        if (d && d.photoId) MS_STORAGE.deletePhoto(d.photoId).catch(() => {});
      }
    }
    // borrar foto del ticket
    if (v.ticketPhotoId) MS_STORAGE.deletePhoto(v.ticketPhotoId).catch(() => {});
    MS_STORAGE.deleteVisit(v.id);
    els.visitDetail.style.display = 'none';
    els.visitList.style.display = '';
    els.kpiGrid.style.display = '';
    renderDashboard();
    showToast('Visita eliminada');
  });

  // Lightbox (galería + ticket + platos)
  els.visitDetail.querySelectorAll('.gallery img, .ticket-img, .dish-photo-img').forEach(img => {
    img.addEventListener('click', () => openLightbox(img.dataset.full || img.src));
  });
}

// ============ Helpers de visualización ============

const RATING_CATEGORIES_LABELS = [
  { key: 'producto',      label: 'Producto' },
  { key: 'servicio',      label: 'Servicio y trato' },
  { key: 'ambiente',      label: 'Ambiente' },
  { key: 'limpieza',      label: 'Limpieza e higiene' },
  { key: 'calidadPrecio', label: 'Relación calidad-precio' },
];

const DISH_CRITERIA_LABELS = [
  { key: 'presentation', label: 'Presentación' },
  { key: 'taste',        label: 'Sabor' },
  { key: 'temperature',  label: 'Temperatura' },
  { key: 'quantity',     label: 'Cantidad' },
];

function renderStarsRO(val) {
  // estrellas read-only en SVG
  if (val == null) return '<span style="color: var(--c-muted); font-size:14px">sin valorar</span>';
  let html = '';
  for (let i = 1; i <= 5; i++) {
    const active = i <= val;
    html += `<svg viewBox="0 0 24 24" style="width:20px; height:20px; fill: ${active ? 'var(--c-dorado)' : '#ddd'}; vertical-align:middle;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
  }
  html += ` <span style="font-size:14px; color:var(--c-text); margin-left:4px;">${val}/5</span>`;
  return html;
}

function renderRatingsBlockHTML(ratings) {
  if (!ratings) return '';
  const rows = RATING_CATEGORIES_LABELS.map(c => `
    <div class="star-row">
      <div class="star-label">${c.label}</div>
      <div>${renderStarsRO(ratings[c.key])}</div>
    </div>
  `).join('');
  return `
    <h3>Valoración del auditor (5 ámbitos)</h3>
    <div class="card">
      ${rows}
    </div>
  `;
}

function renderDishesBlockHTML(dishes, dishPhotoUrls) {
  if (!Array.isArray(dishes)) return '';
  const filled = dishes.filter(d => d && (d.name || d.presentation != null || d.taste != null || d.temperature != null || d.quantity != null || d.photoId));
  if (filled.length === 0) return '';
  const photosByIdx = {};
  dishPhotoUrls.forEach(d => photosByIdx[d.idx] = d.url);
  const cards = dishes.map((d, idx) => {
    if (!d || (!d.name && d.presentation == null && d.taste == null && d.temperature == null && d.quantity == null && !d.photoId)) return '';
    const scores = DISH_CRITERIA_LABELS.map(c => d[c.key]).filter(v => v != null);
    const avg = scores.length ? (scores.reduce((a,b)=>a+b,0) / scores.length).toFixed(1) : null;
    const critsHtml = DISH_CRITERIA_LABELS.map(c => `
      <tr>
        <td style="padding:4px 8px 4px 0; color: var(--c-grafito); font-size:13px;">${c.label}</td>
        <td style="padding:4px 0; text-align:right;"><strong>${d[c.key] != null ? d[c.key] + ' / 5' : '—'}</strong></td>
      </tr>
    `).join('');
    return `
      <div class="dish-card">
        <div class="dish-header">
          <span class="dish-num">Plato ${idx + 1}${d.name ? ' — ' + escapeHtml(d.name) : ''}</span>
          <span class="dish-score-summary">${avg ? avg + ' / 5' : '—'}</span>
        </div>
        <div style="display:grid; grid-template-columns: ${photosByIdx[idx] ? '1fr 1fr' : '1fr'}; gap: 12px; align-items:start;">
          <table style="width:100%; border-collapse:collapse;">${critsHtml}</table>
          ${photosByIdx[idx] ? `<img class="dish-photo-img" src="${photosByIdx[idx]}" style="width:100%; max-height:160px; object-fit:cover; border-radius:6px; border:1px solid var(--c-border); cursor:pointer;" data-full="${photosByIdx[idx]}" />` : ''}
        </div>
      </div>
    `;
  }).join('');
  return `
    <h3>Valoración de platos</h3>
    ${cards}
  `;
}

function computeBlockScores(v) {
  const out = [];
  for (const b of MS_CHECKLIST.blocks) {
    let total = 0, earned = 0;
    for (const q of b.questions) {
      const a = v.answers && v.answers[q.id];
      if (!a || a.val == null || a.val === 'na') continue;
      total += 5;
      if (q.type === 'yesno') earned += (a.val === 'si') ? 5 : 0;
      else earned += parseInt(a.val, 10);
    }
    out.push({ id: b.id, title: b.title, pct: total ? Math.round((earned / total) * 100) : null });
  }
  return out;
}

function openLightbox(url) {
  const lb = document.createElement('div');
  lb.className = 'lightbox show';
  lb.innerHTML = `<button class="lb-close">×</button><img src="${url}" />`;
  lb.addEventListener('click', () => lb.remove());
  document.body.appendChild(lb);
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ====== Crear nueva visita (genera enlace) ======

els.newVisitBtn.addEventListener('click', () => {
  const localName = prompt('Nombre del local que se va a auditar:');
  if (!localName) return;
  const code = MS_STORAGE.generateVisitCode();
  // Creamos un "stub" de visita que el auditor abrirá luego
  const stub = {
    id: MS_STORAGE.generateVisitId(),
    code,
    createdAt: Date.now(),
    status: 'draft',
    auditor: { name: '', email: '' },
    local: { name: localName.trim(), addr: '' },
    visit: { type: 'mesa', date: '', timeIn: '', timeOut: '', guests: null, ticket: null },
    answers: {},
    finalNotes: '',
    finalSummary: '',
    createdByDashboard: true,
  };
  MS_STORAGE.saveVisit(stub);
  const baseUrl = window.location.href.replace(/dashboard\.html.*$/, 'visita.html');
  const link = `${baseUrl}?code=${code}`;
  const msg = `Enlace generado para "${localName}":\n\n${link}\n\nCódigo: ${code}\n\nCópialo y envíaselo al auditor.`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link).then(() => showToast('Enlace copiado al portapapeles'));
  }
  alert(msg);
  renderDashboard();
});

// ====== Importar JSON (visita enviada por auditor sin backend) ======

els.importBtn.addEventListener('click', () => els.importFile.click());
els.importFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const obj = JSON.parse(text);
    if (!obj.id || !obj.answers) throw new Error('JSON inválido');
    // Restaurar fotos desde base64 si vienen
    if (obj.photos) {
      for (const key of Object.keys(obj.photos)) {
        const b64 = obj.photos[key];
        const blob = await dataUrlToBlob(b64);
        const photoId = `${obj.id}_${key}_imported`;
        await MS_STORAGE.savePhoto(photoId, blob);
        if (key === 'ticket') {
          obj.ticketPhotoId = photoId;
        } else if (key.startsWith('dish_')) {
          const idx = parseInt(key.replace('dish_', ''), 10);
          if (Array.isArray(obj.dishes) && obj.dishes[idx]) obj.dishes[idx].photoId = photoId;
        } else if (obj.answers && obj.answers[key]) {
          obj.answers[key].photoId = photoId;
        }
      }
      delete obj.photos;
    }
    MS_STORAGE.saveVisit(obj);
    showToast('Visita importada');
    renderDashboard();
  } catch (err) {
    console.error(err);
    showToast('Error al importar: ' + err.message, true);
  } finally {
    els.importFile.value = '';
  }
});

async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return await res.blob();
}

// ====== Configuración ======

els.configBtn.addEventListener('click', () => {
  const cfg = MS_STORAGE.getConfig();
  const newSyncUrl = prompt('URL del backend (Apps Script Web App). Dejar vacío para modo offline:', cfg.syncUrl || '');
  if (newSyncUrl === null) return;
  const newAdmin = prompt('Código admin para acceder al dashboard:', cfg.adminCode || 'METODO360');
  if (newAdmin === null) return;
  MS_STORAGE.saveConfig({ syncUrl: newSyncUrl.trim(), adminCode: newAdmin.trim() || 'METODO360' });
  showToast('Configuración guardada');
});
