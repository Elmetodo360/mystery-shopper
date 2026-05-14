// Mystery Shopper - lógica del formulario del auditor (visita.html)

const params = new URLSearchParams(location.search);
const URL_CODE = (params.get('code') || '').toUpperCase();
const RESUME_ID = params.get('resume') || null;

const els = {
  visitCode: document.getElementById('visitCode'),
  stepIntro: document.getElementById('step-intro'),
  stepQuestions: document.getElementById('step-questions'),
  stepFinal: document.getElementById('step-final'),
  questionsContainer: document.getElementById('questionsContainer'),
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
  visitTimeOut: document.getElementById('visitTimeOut'),
  visitGuests: document.getElementById('visitGuests'),
  visitTicket: document.getElementById('visitTicket'),
  finalNotes: document.getElementById('finalNotes'),
  finalSummary: document.getElementById('finalSummary'),
};

let visit = null;
let currentStep = 'intro'; // intro | questions | final

function showToast(msg, isErr) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  if (isErr) els.toast.style.background = 'var(--c-error)';
  else els.toast.style.background = 'var(--c-primary)';
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
    answers: {}, // key: questionId, value: { val, note, photoId }
    finalNotes: '',
    finalSummary: '',
  };
}

function loadOrCreateVisit() {
  // Si viene ?resume=xxx, intentar cargar esa
  if (RESUME_ID) {
    const v = MS_STORAGE.loadVisit(RESUME_ID);
    if (v) return v;
  }
  // Si viene ?code=xxx, buscar visita draft con ese code
  if (URL_CODE) {
    const all = MS_STORAGE.loadAllVisits();
    const draft = all.find(v => v.code === URL_CODE && v.status === 'draft');
    if (draft) return draft;
  }
  return newVisit();
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
  visit.visit.timeOut = els.visitTimeOut.value;
  visit.visit.guests = els.visitGuests.value ? parseInt(els.visitGuests.value, 10) : null;
  visit.visit.ticket = els.visitTicket.value ? parseFloat(els.visitTicket.value) : null;
}

function captureFinal() {
  visit.finalNotes = els.finalNotes.value.trim();
  visit.finalSummary = els.finalSummary.value.trim();
  visit.visit.timeOut = els.visitTimeOut.value || visit.visit.timeOut;
}

function autosave(label) {
  MS_STORAGE.saveVisit(visit);
  if (label) {
    els.autosaveText.textContent = label;
    setTimeout(() => { els.autosaveText.textContent = 'Guardado automático activo'; }, 1800);
  }
}

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

  // Aplicar estado guardado
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

  // Listeners
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
  // Limpiar otros del mismo q
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
    // Borrar foto previa si existía
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
  els.progressFill.style.width = pct + '%';
  els.progressText.textContent = `${answered} / ${total} respondidas`;
}

// Navegación
function goStep(step) {
  currentStep = step;
  els.stepIntro.style.display = step === 'intro' ? '' : 'none';
  els.stepQuestions.style.display = step === 'questions' ? '' : 'none';
  els.stepFinal.style.display = step === 'final' ? '' : 'none';

  els.backBtn.style.display = step === 'intro' ? 'none' : '';
  if (step === 'intro') els.nextBtn.textContent = 'Empezar';
  else if (step === 'questions') els.nextBtn.textContent = 'Continuar al cierre';
  else if (step === 'final') els.nextBtn.textContent = 'Finalizar y enviar';

  window.scrollTo({ top: 0, behavior: 'instant' });
}

els.startQuestionsBtn.addEventListener('click', () => onNextClick());

els.nextBtn.addEventListener('click', onNextClick);
els.backBtn.addEventListener('click', () => {
  if (currentStep === 'questions') goStep('intro');
  else if (currentStep === 'final') goStep('questions');
});

async function onNextClick() {
  if (currentStep === 'intro') {
    captureIntro();
    if (!visit.auditor.name || !visit.local.name || !visit.visit.date) {
      showToast('Rellena los campos con * obligatorios', true);
      return;
    }
    autosave();
    goStep('questions');
  } else if (currentStep === 'questions') {
    autosave();
    goStep('final');
  } else if (currentStep === 'final') {
    captureFinal();
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
        // Fallback: descargar JSON con fotos embebidas
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

// Init
function init() {
  visit = loadOrCreateVisit();
  if (!visit.visit.date) visit.visit.date = new Date().toISOString().slice(0, 10);
  if (!visit.visit.timeIn) {
    const now = new Date();
    visit.visit.timeIn = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
  hydrateFromVisit();
  renderQuestions();
  if (visit.status === 'submitted') {
    showToast('Esta visita ya fue enviada (modo lectura)');
  }
  // Si la visita ya tiene respuestas, saltar directo a preguntas
  if (Object.keys(visit.answers).length > 0) {
    // pero solo si todos los campos básicos están
    if (visit.auditor.name && visit.local.name) goStep('questions');
  }
}

init();
