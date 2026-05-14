// Mystery Shopper - capa de persistencia
// localStorage para metadata y respuestas
// IndexedDB para fotos (binarios pesados)

const LS_KEY_PREFIX = 'ms360_visit_';
const LS_KEY_VISITS_INDEX = 'ms360_visits_index';
const LS_KEY_ADMIN = 'ms360_admin';
const LS_KEY_CONFIG = 'ms360_config';
const IDB_NAME = 'ms360_photos';
const IDB_STORE = 'photos';

let _idb = null;

function openIDB() {
  if (_idb) return Promise.resolve(_idb);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => { _idb = req.result; resolve(_idb); };
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
    };
  });
}

async function savePhoto(photoId, blob) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put({ id: photoId, blob, ts: Date.now() });
    tx.oncomplete = () => resolve(photoId);
    tx.onerror = () => reject(tx.error);
  });
}

async function getPhoto(photoId) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(photoId);
    req.onsuccess = () => resolve(req.result ? req.result.blob : null);
    req.onerror = () => reject(req.error);
  });
}

async function deletePhoto(photoId) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(photoId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllPhotos() {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function saveVisit(visit) {
  localStorage.setItem(LS_KEY_PREFIX + visit.id, JSON.stringify(visit));
  const idx = loadVisitsIndex();
  if (!idx.includes(visit.id)) {
    idx.push(visit.id);
    localStorage.setItem(LS_KEY_VISITS_INDEX, JSON.stringify(idx));
  }
}

function loadVisit(visitId) {
  const raw = localStorage.getItem(LS_KEY_PREFIX + visitId);
  return raw ? JSON.parse(raw) : null;
}

function loadVisitsIndex() {
  const raw = localStorage.getItem(LS_KEY_VISITS_INDEX);
  return raw ? JSON.parse(raw) : [];
}

function loadAllVisits() {
  return loadVisitsIndex().map(id => loadVisit(id)).filter(Boolean);
}

function deleteVisit(visitId) {
  localStorage.removeItem(LS_KEY_PREFIX + visitId);
  const idx = loadVisitsIndex().filter(id => id !== visitId);
  localStorage.setItem(LS_KEY_VISITS_INDEX, JSON.stringify(idx));
}

function generateVisitId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${ts}-${rnd}`;
}

function generateVisitCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function getConfig() {
  const raw = localStorage.getItem(LS_KEY_CONFIG);
  return raw ? JSON.parse(raw) : { syncUrl: '', adminCode: 'METODO360' };
}
function saveConfig(cfg) {
  localStorage.setItem(LS_KEY_CONFIG, JSON.stringify(cfg));
}

function isAdminLogged() {
  return localStorage.getItem(LS_KEY_ADMIN) === '1';
}
function setAdminLogged(v) {
  if (v) localStorage.setItem(LS_KEY_ADMIN, '1');
  else localStorage.removeItem(LS_KEY_ADMIN);
}

async function exportVisitWithPhotos(visit) {
  const out = JSON.parse(JSON.stringify(visit));
  out.photos = {};
  for (const ansKey of Object.keys(visit.answers || {})) {
    const ans = visit.answers[ansKey];
    if (ans && ans.photoId) {
      const blob = await getPhoto(ans.photoId);
      if (blob) {
        out.photos[ansKey] = await blobToBase64(blob);
      }
    }
  }
  return out;
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function compressImage(file, maxWidth = 1280, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    reader.onerror = reject;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob); else reject(new Error('canvas.toBlob failed'));
      }, 'image/jpeg', quality);
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function syncVisitToBackend(visit) {
  const cfg = getConfig();
  if (!cfg.syncUrl) {
    throw new Error('No hay backend configurado. Descarga el JSON localmente.');
  }
  const payload = await exportVisitWithPhotos(visit);
  const res = await fetch(cfg.syncUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Error backend: ' + res.status);
  return await res.json();
}

window.MS_STORAGE = {
  savePhoto, getPhoto, deletePhoto, getAllPhotos,
  saveVisit, loadVisit, loadAllVisits, loadVisitsIndex, deleteVisit,
  generateVisitId, generateVisitCode,
  getConfig, saveConfig,
  isAdminLogged, setAdminLogged,
  exportVisitWithPhotos, compressImage, syncVisitToBackend,
  blobToBase64,
};
