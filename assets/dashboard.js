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
          <div style="font-size:13px; color:var(--c-muted)">Score global</div>
          <div class="v-score ${scoreClass(pct)}" style="font-size:36px">${pct != null ? pct + '%' : '—'}</div>
        </div>
        <div style="text-align:right; font-size:13px; color:var(--c-muted)">
          Estado: <strong>${v.status === 'submitted' ? 'Enviada' : 'Borrador'}</strong><br />
          Código: <strong>${escapeHtml(v.code || '—')}</strong>
        </div>
      </div>
    </div>

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
    // borrar fotos
    for (const q of flat) {
      const a = (v.answers || {})[q.id];
      if (a && a.photoId) MS_STORAGE.deletePhoto(a.photoId).catch(() => {});
    }
    MS_STORAGE.deleteVisit(v.id);
    els.visitDetail.style.display = 'none';
    els.visitList.style.display = '';
    els.kpiGrid.style.display = '';
    renderDashboard();
    showToast('Visita eliminada');
  });

  // Lightbox
  els.visitDetail.querySelectorAll('.gallery img').forEach(img => {
    img.addEventListener('click', () => openLightbox(img.dataset.full));
  });
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
      for (const qid of Object.keys(obj.photos)) {
        const b64 = obj.photos[qid];
        const blob = await dataUrlToBlob(b64);
        const photoId = `${obj.id}_${qid}_imported`;
        await MS_STORAGE.savePhoto(photoId, blob);
        if (obj.answers[qid]) obj.answers[qid].photoId = photoId;
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
