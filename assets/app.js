// Mystery Shopper - lógica del formulario del auditor (visita.html)

const params = new URLSearchParams(location.search);
const URL_CODE = (params.get('code') || '').toUpperCase();
const RESUME_ID = params.get('resume') || null;

const RATING_CATEGORIES = [
  { key: 'producto',       label: 'Producto',              hint: 'Calidad de la comida y bebida' },
  { key: 'servicio',       label: 'Servicio y trato',      hint: 'Atención, simpatía y profesionalidad del equipo' },
  { key: 'ambiente',       label: 'Ambiente',              hint: 'Decoración, ruido, iluminación, confort' },
  { key: 'limpieza',       label: 'Limpieza e higiene',    hint: 'Mesa, cubiertos, baños, zonas comunes' },
  { key: 'calidadPrecio',  label: 'Relación calidad-precio', hint: '¿Qué te has llevado por lo que pagaste?' },
];

const DISH_CRITERIA = [
  { key: 'presentation', label: 'Presentación' },
  { key: 'taste',        label: 'Sabor' },
  { key: 'temperature',  label: 'Temperatura' },
  { key: 'quantity',     label: 'Cantidad / ración' },
];

const els = {
  visitCode: document.getElementById('visitCode'),
  stepIntro: document.getElementById('step-intro'),
  stepQuestions: document.getElementById('step-questions'),
  stepFinal: document.getElementById('step-final'),
  questionsContainer: document.getElementById('questionsContainer'),
  dishesContainer: document.getElementById('dishesContainer'),
  starsContainer: document.getElementById('starsContainer'),
  starsGlobal: document.getElementById('starsGlobal'),
  progressFill: document.getElementById('progressFill'),
  progressText: document.getElementById('progressText'),
  autosaveText: document.getElementById('autosaveText'),
  backBtn: document.getElementById('backBtn'),
  nextBtn: document.getElementById('nextBtn'),
  toast: document.getElementById('toast'),
  startQuestionsBtn: document.getElementById('startQuestionsBtn'),
  // intro fields
  auditorName: document.getElementById('auditorName'),
  auditorEmail: document.getElementById('auditorEmail'),
  localName: document.getElementById('localName'),
  localAddr: document.getElementById('localAddr'),
  visitType: document.getElementById('visitType'),
  visitDate: document.getElementById('visitDate'),
  visitTimeIn: document.getElementById('visitTimeIn'),
  headcountInClients: document.getElementById('headcountInClients'),
  headcountInStaff: document.getElementById('headcountInStaff'),
  // final fields
  visitTimeOut: document.getElementById('visitTimeOut'),
  headcountOutClients: document.getElementById('headcountOutClients'),
  headcountOutStaff: document.getElementById('headcountOutStaff'),
  visitGuests: document.getElementById('visitGuests'),
  visitTicket: document.getElementById('visitTicket'),
  ticketPhoto: document.getElementById('ticketPhoto'),
  ticketPhotoBtn: document.getElementById('ticketPhotoBtn'),
  ticketPhotoThumb: document.getElementById('ticketPhotoThumb'),
  finalNotes: document.getElementById('finalNotes'),
  finalSummary: document.getElementById('finalSummary'),
};

let visit = null;
let currentStep = 'intro'; // intro | questions | final

function showToast(msg, isErr) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  els.toast.style.background = isErr ? 'var(--c-error)' : 'var(--c-negro)';
  setTimeout(() => els.toast.classList.remove('show'), 2400);
}

function newVisit() {
  return {
    id: MS_STORAGE.generateVisitId(),
    code: URL_CODE || MS_STORAGE.generateVisitCode(),
    createdAt: Date.now(),
    status: 'draft',
    auditor: { name: '', email: '' },
    local: { name: '', addr: '' },
    visit: { type: 'mesa', date: '', timeIn: '', timeOut: '', guests: null, ticket: null },
    headcount: { inClients: null, inStaff: null, outClients: null, outStaff: null },
    dishes: [
      { name: '', presentation: null, taste: null, temperature: null, quantity: null, photoId: null },
      { name: '', presentation: null, taste: null, temperature: null, quantity: null, photoId: null },
      { name: '', presentation: null, taste: null, temperature: null, quantity: null, photoId: null },
      { name: '', presentation: null, taste: null, temperature: null, quantity: null, photoId: null },
    ],
    ticketPhotoId: null,
    ratings: { producto: null, servicio: null, ambiente: null, limpieza: null, calidadPrecio: null, global: null },
    answers: {}, // key: questionId, value: { val, note, photoId }
    finalNotes: '',
    finalSummary: '',
  };
}

function loadOrCreateVisit() {
  if (RESUME_ID) {
    const v = MS_STORAGE.loadVisit(RESUME_ID);
    if (v) return migrateVisit(v);
  }
  if (URL_CODE) {
    const all = MS_STORAGE.loadAllVisits();
    const draft = all.find(v => v.code === URL_CODE && v.status === 'draft');
    if (draft) return migrateVisit(draft);
  }
  return newVisit();
}

// Asegura que visitas antiguas tengan los nuevos campos
function migrateVisit(v) {
  const base = newVisit();
  if (!v.headcount) v.headcount = base.headcount;
  if (!v.dishes || !Array.isArray(v.dishes)) v.dishes = base.dishes;
  while (v.dishes.length < 4) v.dishes.push({ name: '', presentation: null, taste: null, temperature: null, quantity: null, photoId: null });
  if (!v.ratings) v.ratings = base.ratings;
  if (typeof v.ticketPhotoId === 'undefined') v.ticketPhotoId = null;
  return v;
}

function hydrateFromVisit() {
  els.visitCode.textContent = visit.code || '—';
  els.auditorName.value = visit.auditor.name || '';
  els.auditorEmail.value = visit.auditor.email || '';
  els.localName.value = visit.local.name || '';
  els.localAddr.value = visit.local.addr || '';
  els.visitType.value = visit.visit.type || 'mesa';
  els.visitDate.value = visit.visit.date || new Date().toISOString().slice(0, 10);
  els.visitTimeIn.value = visit.visit.timeIn || '';
  els.visitTimeOut.value = visit.visit.timeOut || '';
  els.visitGuests.value = visit.visit.guests || '';
  els.visitTicket.value = visit.visit.ticket || '';
  els.headcountInClients.value = visit.headcount.inClients ?? '';
  els.headcountInStaff.value = visit.headcount.inStaff ?? '';
  els.headcountOutClients.value = visit.headcount.outClients ?? '';
  els.headcountOutStaff.value = visit.headcount.outStaff ?? '';
  els.finalNotes.value = visit.finalNotes || '';
  els.finalSummary.value = visit.finalSummary || '';
}

function captureIntro() {
  visit.auditor.name = els.auditorName.value.trim();
  visit.auditor.email = els.auditorEmail.value.trim();
  visit.local.name = els.localName.value.trim();
  visit.local.addr = els.localAddr.value.trim();
  visit.visit.type = els.visitType.value;
  visit.visit.date = els.visitDate.value;
  visit.visit.timeIn = els.visitTimeIn.value;
  visit.headcount.inClients = els.headcountInClients.value === '' ? null : parseInt(els.headcountInClients.value, 10);
  visit.headcount.inStaff = els.headcountInStaff.value === '' ? null : parseInt(els.headcountInStaff.value, 10);
}

function captureFinal() {
  visit.visit.timeOut = els.visitTimeOut.value;
  visit.headcount.outClients = els.headcountOutClients.value === '' ? null : parseInt(els.headcountOutClients.value, 10);
  visit.headcount.outStaff = els.headcountOutStaff.value === '' ? null : parseInt(els.headcountOutStaff.value, 10);
  visit.visit.guests = els.visitGuests.value ? parseInt(els.visitGuests.value, 10) : null;
  visit.visit.ticket = els.visitTicket.value ? parseFloat(els.visitTicket.value) : null;
  visit.finalNotes = els.finalNotes.value.trim();
  visit.finalSummary = els.finalSummary.value.trim();
  // los platos y ratings ya se guardan en autosave al cambiar
}

function autosave(label) {
  MS_STORAGE.saveVisit(visit);
  if (label) {
    els.autosaveText.textContent = label;
    setTimeout(() => { els.autosaveText.textContent = 'Guardado automático activo'; }, 1800);
  }
}

// ============ PREGUNTAS ============

function renderQuestions() {
  const container = els.questionsContainer;
  container.innerHTML = '';
  for (const block of MS_CHECKLIST.blocks) {
    const bh = document.createElement('div');
    bh.className = 'block-header';
    bh.innerHTML = `<h3 class="block-title">${block.title}</h3><div class="block-desc">${block.desc}</div>`;
    container.appendChild(bh);

    for (const q of block.questions) {
      const card = document.createElement('div');
      card.className = 'question';
      card.dataset.qid = q.id;

      const photoBtnHtml = q.photo
        ? `<div class="q-photo-row">
             <label class="q-photo-btn" for="photo-${q.id}">Adjuntar foto</label>
             <input type="file" class="q-photo-input" id="photo-${q.id}" accept="image/*" capture="environment" />
             <img class="q-photo-thumb" id="thumb-${q.id}" style="display:none" />
           </div>` : '';

      let answersHtml = '';
      if (q.type === 'yesno') {
        answersHtml = `
          <div class="answer-row">
            <button type="button" class="ans-btn" data-val="si" data-q="${q.id}">Sí</button>
            <button type="button" class="ans-btn" data-val="no" data-q="${q.id}">No</button>
            <button type="button" class="ans-btn" data-val="na" data-q="${q.id}">N/A</button>
          </div>`;
      } else {
        answersHtml = `<div class="answer-row">`;
        for (let s = 0; s <= 5; s++) {
          answersHtml += `<button type="button" class="ans-btn" data-type="score" data-val="${s}" data-q="${q.id}">${s}</button>`;
        }
        answersHtml += `</div>`;
      }

      card.innerHTML = `
        <span class="q-id">${q.id}</span>
        <div class="q-text">${q.text}</div>
        <div class="q-why">${q.why}</div>
        ${answersHtml}
        <textarea class="q-note" data-q="${q.id}" placeholder="Notas (opcional, lo que viste, oíste, sentiste…)" rows="2"></textarea>
        ${photoBtnHtml}
      `;
      container.appendChild(card);
    }
  }

  for (const qid of Object.keys(visit.answers)) {
    const a = visit.answers[qid];
    if (a.val != null) {
      const btn = container.querySelector(`.ans-btn[data-q="${qid}"][data-val="${a.val}"]`);
      if (btn) btn.classList.add('active');
    }
    const note = container.querySelector(`.q-note[data-q="${qid}"]`);
    if (note && a.note) note.value = a.note;
    if (a.photoId) showPhotoThumb(qid, a.photoId);
  }

  container.addEventListener('click', onAnswerClick);
  container.addEventListener('input', onNoteInput);
  container.addEventListener('change', onPhotoChange);

  updateProgress();
}

async function showPhotoThumb(qid, photoId) {
  const blob = await MS_STORAGE.getPhoto(photoId);
  if (!blob) return;
  const img = document.getElementById(`thumb-${qid}`);
  const btn = document.querySelector(`label[for="photo-${qid}"]`);
  if (img) {
    img.src = URL.createObjectURL(blob);
    img.style.display = 'inline-block';
  }
  if (btn) { btn.classList.add('has-photo'); btn.textContent = 'Cambiar foto'; }
}

function onAnswerClick(e) {
  const btn = e.target.closest('.ans-btn');
  if (!btn) return;
  const qid = btn.dataset.q;
  const val = btn.dataset.val;
  const parent = btn.parentElement;
  parent.querySelectorAll('.ans-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  visit.answers[qid] = visit.answers[qid] || {};
  visit.answers[qid].val = val;
  autosave();
  updateProgress();
}

function onNoteInput(e) {
  const note = e.target.closest('.q-note');
  if (!note) return;
  const qid = note.dataset.q;
  visit.answers[qid] = visit.answers[qid] || {};
  visit.answers[qid].note = note.value;
  autosave();
}

async function onPhotoChange(e) {
  const input = e.target.closest('.q-photo-input');
  if (!input) return;
  const file = input.files[0];
  if (!file) return;
  const qid = input.id.replace('photo-', '');
  try {
    const blob = await MS_STORAGE.compressImage(file, 1280, 0.78);
    const photoId = `${visit.id}_${qid}_${Date.now()}`;
    const prev = visit.answers[qid] && visit.answers[qid].photoId;
    if (prev) await MS_STORAGE.deletePhoto(prev);
    await MS_STORAGE.savePhoto(photoId, blob);
    visit.answers[qid] = visit.answers[qid] || {};
    visit.answers[qid].photoId = photoId;
    autosave('Foto guardada');
    showPhotoThumb(qid, photoId);
  } catch (err) {
    showToast('No se pudo procesar la foto', true);
    console.error(err);
  }
}

function updateProgress() {
  const total = 50;
  let answered = 0;
  for (const qid of Object.keys(visit.answers)) {
    if (visit.answers[qid] && visit.answers[qid].val != null) answered++;
  }
  const pct = Math.round((answered / total) * 100);
  if (currentStep === 'intro') {
    els.progressFill.style.width = '15%';
    els.progressText.textContent = 'Paso 1 / 3 · Preparación';
  } else if (currentStep === 'questions') {
    els.progressFill.style.width = (15 + pct * 0.65) + '%';
    els.progressText.textContent = `Paso 2 / 3 · ${answered} / ${total} respondidas`;
  } else if (currentStep === 'final') {
    els.progressFill.style.width = '90%';
    els.progressText.textContent = 'Paso 3 / 3 · Cierre y valoración';
  }
}

// ============ PLATOS ============

function renderDishes() {
  const c = els.dishesContainer;
  c.innerHTML = '';
  visit.dishes.forEach((dish, idx) => {
    const card = document.createElement('div');
    card.className = 'dish-card';
    card.dataset.dishIdx = idx;

    const critsHtml = DISH_CRITERIA.map(crit => `
      <div class="crit-row" data-crit="${crit.key}">
        <div class="crit-label">${crit.label}</div>
        <div class="crit-buttons">
          ${[1,2,3,4,5].map(s => `<button type="button" class="ans-btn" data-type="score" data-dish="${idx}" data-crit="${crit.key}" data-val="${s}">${s}</button>`).join('')}
        </div>
      </div>
    `).join('');

    card.innerHTML = `
      <div class="dish-header">
        <span class="dish-num">Plato ${idx + 1}</span>
        <span class="dish-score-summary" id="dishSum-${idx}">—</span>
      </div>
      <div class="field">
        <label for="dishName-${idx}">Nombre del plato</label>
        <input type="text" id="dishName-${idx}" data-dish-name="${idx}" placeholder="Ej.: Croquetas de jamón ibérico" />
      </div>
      <div class="dish-criteria">
        ${critsHtml}
      </div>
      <div class="q-photo-row" style="margin-top:12px">
        <label class="q-photo-btn" for="dishPhoto-${idx}">Foto del plato</label>
        <input type="file" class="q-photo-input" id="dishPhoto-${idx}" data-dish-photo="${idx}" accept="image/*" capture="environment" />
        <img class="q-photo-thumb" id="dishThumb-${idx}" style="display:none" alt="" />
      </div>
    `;
    c.appendChild(card);
  });

  // Hidratar valores existentes
  visit.dishes.forEach((dish, idx) => {
    const nameInput = c.querySelector(`[data-dish-name="${idx}"]`);
    if (nameInput) nameInput.value = dish.name || '';
    for (const crit of DISH_CRITERIA) {
      if (dish[crit.key] != null) {
        const btn = c.querySelector(`.ans-btn[data-dish="${idx}"][data-crit="${crit.key}"][data-val="${dish[crit.key]}"]`);
        if (btn) btn.classList.add('active');
      }
    }
    if (dish.photoId) showDishPhotoThumb(idx, dish.photoId);
    updateDishSummary(idx);
  });

  c.addEventListener('click', onDishScoreClick);
  c.addEventListener('input', onDishNameInput);
  c.addEventListener('change', onDishPhotoChange);
}

function onDishScoreClick(e) {
  const btn = e.target.closest('.ans-btn[data-dish]');
  if (!btn) return;
  const idx = parseInt(btn.dataset.dish, 10);
  const crit = btn.dataset.crit;
  const val = parseInt(btn.dataset.val, 10);
  // Limpiar otros del mismo criterio
  const row = btn.closest('.crit-row');
  row.querySelectorAll('.ans-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  visit.dishes[idx][crit] = val;
  updateDishSummary(idx);
  autosave();
}

function onDishNameInput(e) {
  const inp = e.target.closest('[data-dish-name]');
  if (!inp) return;
  const idx = parseInt(inp.dataset.dishName, 10);
  visit.dishes[idx].name = inp.value;
  autosave();
}

async function onDishPhotoChange(e) {
  const input = e.target.closest('[data-dish-photo]');
  if (!input) return;
  const idx = parseInt(input.dataset.dishPhoto, 10);
  const file = input.files[0];
  if (!file) return;
  try {
    const blob = await MS_STORAGE.compressImage(file, 1280, 0.78);
    const photoId = `${visit.id}_dish_${idx}_${Date.now()}`;
    const prev = visit.dishes[idx].photoId;
    if (prev) await MS_STORAGE.deletePhoto(prev);
    await MS_STORAGE.savePhoto(photoId, blob);
    visit.dishes[idx].photoId = photoId;
    autosave('Foto del plato guardada');
    showDishPhotoThumb(idx, photoId);
  } catch (err) {
    showToast('No se pudo procesar la foto del plato', true);
    console.error(err);
  }
}

async function showDishPhotoThumb(idx, photoId) {
  const blob = await MS_STORAGE.getPhoto(photoId);
  if (!blob) return;
  const img = document.getElementById(`dishThumb-${idx}`);
  const btn = document.querySelector(`label[for="dishPhoto-${idx}"]`);
  if (img) {
    img.src = URL.createObjectURL(blob);
    img.style.display = 'inline-block';
  }
  if (btn) { btn.classList.add('has-photo'); btn.textContent = 'Cambiar foto'; }
}

function updateDishSummary(idx) {
  const d = visit.dishes[idx];
  const scores = DISH_CRITERIA.map(c => d[c.key]).filter(v => v != null);
  const sumEl = document.getElementById(`dishSum-${idx}`);
  if (!sumEl) return;
  if (scores.length === 0) { sumEl.textContent = '—'; return; }
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  sumEl.textContent = avg.toFixed(1) + ' / 5';
}

// ============ TICKET PHOTO ============

async function onTicketPhotoChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const blob = await MS_STORAGE.compressImage(file, 1280, 0.82);
    const photoId = `${visit.id}_ticket_${Date.now()}`;
    if (visit.ticketPhotoId) await MS_STORAGE.deletePhoto(visit.ticketPhotoId);
    await MS_STORAGE.savePhoto(photoId, blob);
    visit.ticketPhotoId = photoId;
    autosave('Foto del ticket guardada');
    showTicketPhotoThumb(photoId);
  } catch (err) {
    showToast('No se pudo procesar la foto del ticket', true);
    console.error(err);
  }
}

async function showTicketPhotoThumb(photoId) {
  const blob = await MS_STORAGE.getPhoto(photoId);
  if (!blob) return;
  els.ticketPhotoThumb.src = URL.createObjectURL(blob);
  els.ticketPhotoThumb.style.display = 'inline-block';
  els.ticketPhotoBtn.classList.remove('required-empty');
  els.ticketPhotoBtn.classList.add('has-photo');
  els.ticketPhotoBtn.textContent = 'Cambiar foto del ticket';
}

// ============ VALORACIÓN ESTRELLAS ============

function renderStars() {
  const c = els.starsContainer;
  c.innerHTML = '';
  for (const cat of RATING_CATEGORIES) {
    const row = document.createElement('div');
    row.className = 'star-row';
    row.innerHTML = `
      <div class="star-label">
        ${cat.label}
        <small>${cat.hint}</small>
      </div>
      <div class="stars" data-key="${cat.key}">
        ${[1,2,3,4,5].map(s => `
          <button type="button" class="star" data-val="${s}" aria-label="${s} estrella${s>1?'s':''}">
            <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </button>
        `).join('')}
      </div>
    `;
    c.appendChild(row);
  }

  // Hidratar
  for (const cat of RATING_CATEGORIES) {
    paintStars(cat.key, visit.ratings[cat.key]);
  }
  paintStars('global', visit.ratings.global);

  // Listeners (delegado, una sola vez)
  c.addEventListener('click', onStarClick);
  els.starsGlobal.addEventListener('click', onStarClick);
}

function onStarClick(e) {
  const star = e.target.closest('.star');
  if (!star) return;
  const container = star.closest('.stars');
  if (!container) return;
  const key = container.dataset.key;
  const val = parseInt(star.dataset.val, 10);
  visit.ratings[key] = val;
  paintStars(key, val);
  autosave();
}

function paintStars(key, val) {
  const container = (key === 'global')
    ? els.starsGlobal
    : els.starsContainer.querySelector(`.stars[data-key="${key}"]`);
  if (!container) return;
  container.querySelectorAll('.star').forEach(s => {
    const v = parseInt(s.dataset.val, 10);
    s.classList.toggle('active', val != null && v <= val);
  });
}

// ============ NAVEGACIÓN ============

function goStep(step) {
  currentStep = step;
  els.stepIntro.style.display = step === 'intro' ? '' : 'none';
  els.stepQuestions.style.display = step === 'questions' ? '' : 'none';
  els.stepFinal.style.display = step === 'final' ? '' : 'none';

  els.backBtn.style.display = step === 'intro' ? 'none' : '';
  if (step === 'intro') els.nextBtn.textContent = 'Empezar las 50 preguntas';
  else if (step === 'questions') els.nextBtn.textContent = 'Continuar al cierre';
  else if (step === 'final') els.nextBtn.textContent = 'Finalizar y enviar';

  updateProgress();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

els.startQuestionsBtn.addEventListener('click', () => onNextClick());
els.nextBtn.addEventListener('click', onNextClick);
els.backBtn.addEventListener('click', () => {
  if (currentStep === 'questions') goStep('intro');
  else if (currentStep === 'final') goStep('questions');
});

els.ticketPhoto.addEventListener('change', onTicketPhotoChange);
els.visitTimeOut.addEventListener('change', () => { visit.visit.timeOut = els.visitTimeOut.value; autosave(); });

async function onNextClick() {
  if (currentStep === 'intro') {
    captureIntro();
    if (!visit.auditor.name || !visit.local.name || !visit.visit.date || !visit.visit.timeIn) {
      showToast('Rellena los campos obligatorios (*)', true);
      return;
    }
    autosave();
    goStep('questions');
  } else if (currentStep === 'questions') {
    autosave();
    goStep('final');
  } else if (currentStep === 'final') {
    captureFinal();
    // Validaciones obligatorias del cierre
    if (!visit.visit.timeOut) { showToast('Falta la hora de salida', true); return; }
    if (!visit.visit.guests) { showToast('Falta el nº de comensales en tu mesa', true); return; }
    if (visit.visit.ticket == null) { showToast('Falta el importe del ticket', true); return; }
    if (!visit.ticketPhotoId) { showToast('Falta la foto del ticket', true); return; }
    if (visit.ratings.global == null) { showToast('Falta la valoración global (estrellas)', true); return; }

    visit.status = 'submitted';
    visit.submittedAt = Date.now();
    MS_STORAGE.saveVisit(visit);
    try {
      const cfg = MS_STORAGE.getConfig();
      if (cfg.syncUrl) {
        showToast('Enviando informe…');
        await MS_STORAGE.syncVisitToBackend(visit);
        showToast('Informe enviado al servidor');
      } else {
        await downloadVisitJson();
        showToast('Descargado. Envíalo al equipo.');
      }
    } catch (err) {
      console.error(err);
      showToast('Sin conexión. Descargando JSON local…', true);
      await downloadVisitJson();
    }
    setTimeout(() => { window.location.href = 'gracias.html'; }, 1200);
  }
}

async function downloadVisitJson() {
  const full = await MS_STORAGE.exportVisitWithPhotos(visit);
  const blob = new Blob([JSON.stringify(full, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `visita_${visit.code}_${visit.id}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}

// ============ INIT ============

function init() {
  visit = loadOrCreateVisit();
  if (!visit.visit.date) visit.visit.date = new Date().toISOString().slice(0, 10);
  if (!visit.visit.timeIn) {
    const now = new Date();
    visit.visit.timeIn = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
  hydrateFromVisit();
  renderQuestions();
  renderDishes();
  renderStars();
  if (visit.ticketPhotoId) showTicketPhotoThumb(visit.ticketPhotoId);
  if (visit.status === 'submitted') {
    showToast('Esta visita ya fue enviada (modo lectura)');
  }
  if (Object.keys(visit.answers).length > 0) {
    if (visit.auditor.name && visit.local.name) goStep('questions');
  } else {
    updateProgress();
  }
}

init();
