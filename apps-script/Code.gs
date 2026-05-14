// Mystery Shopper - Backend Google Apps Script
//
// Pega este código en script.google.com → Nuevo proyecto → Code.gs
// 1. Crea una hoja de cálculo Google Sheets vacía y copia su ID en SPREADSHEET_ID
// 2. Crea una carpeta en Drive para fotos y copia su ID en PHOTOS_FOLDER_ID
// 3. Implementa → Implementar como aplicación web
//    - Ejecutar como: Yo (tu cuenta)
//    - Quién tiene acceso: Cualquier persona (no requiere inicio de sesión)
// 4. Copia la URL del Web App y pégala en la app (dashboard → Configuración → URL backend)
//
// IMPORTANTE: si actualizas este código y la hoja "Visitas" ya existía con headers viejos,
// borra esa hoja en Google Sheets para que se cree de nuevo con los headers nuevos.

const SPREADSHEET_ID = '__PEGA_AQUI_EL_ID_DEL_SHEET__';
const PHOTOS_FOLDER_ID = '__PEGA_AQUI_EL_ID_DE_LA_CARPETA_DRIVE__';
const SHEET_VISITS = 'Visitas';
const SHEET_ANSWERS = 'Respuestas';

const VISITS_HEADERS = [
  'id', 'code', 'status', 'createdAt', 'submittedAt',
  'auditorName', 'auditorEmail',
  'localName', 'localAddr',
  'visitType', 'visitDate', 'timeIn', 'timeOut',
  'guests', 'ticket',
  // Headcount entrada
  'hcInClients', 'hcInStaff', 'prodEntrada',
  // Headcount salida
  'hcOutClients', 'hcOutStaff', 'prodSalida',
  // Score checklist
  'scoreChecklistPct',
  // Ratings auditor (1-5)
  'starProducto', 'starServicio', 'starAmbiente', 'starLimpieza', 'starCalidadPrecio', 'starGlobal',
  // Platos (4 platos: name + 4 scores + photoUrl)
  'plato1_name', 'plato1_present', 'plato1_sabor', 'plato1_temp', 'plato1_cant', 'plato1_foto',
  'plato2_name', 'plato2_present', 'plato2_sabor', 'plato2_temp', 'plato2_cant', 'plato2_foto',
  'plato3_name', 'plato3_present', 'plato3_sabor', 'plato3_temp', 'plato3_cant', 'plato3_foto',
  'plato4_name', 'plato4_present', 'plato4_sabor', 'plato4_temp', 'plato4_cant', 'plato4_foto',
  // Ticket
  'ticketFotoUrl',
  // Cierre
  'finalSummary', 'finalNotes'
];

const ANSWERS_HEADERS = [
  'visitId', 'visitCode', 'localName', 'visitDate',
  'questionId', 'block', 'questionText', 'type',
  'value', 'note', 'photoUrl'
];

function doPost(e) {
  try {
    const visit = JSON.parse(e.postData.contents);
    if (!visit.id) throw new Error('visit.id missing');

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    let sV = ss.getSheetByName(SHEET_VISITS);
    if (!sV) {
      sV = ss.insertSheet(SHEET_VISITS);
      sV.appendRow(VISITS_HEADERS);
    }

    let sA = ss.getSheetByName(SHEET_ANSWERS);
    if (!sA) {
      sA = ss.insertSheet(SHEET_ANSWERS);
      sA.appendRow(ANSWERS_HEADERS);
    }

    // Subir fotos a Drive
    const photoUrls = {}; // keyed por: 'MS-01', 'dish_0', 'ticket', ...
    if (visit.photos) {
      const folder = DriveApp.getFolderById(PHOTOS_FOLDER_ID);
      const subfolderName = `${visit.code || visit.id}_${visit.local && visit.local.name || 'local'}`;
      let subfolder;
      const it = folder.getFoldersByName(subfolderName);
      if (it.hasNext()) subfolder = it.next();
      else subfolder = folder.createFolder(subfolderName);

      for (const key of Object.keys(visit.photos)) {
        const b64 = visit.photos[key];
        const match = b64.match(/^data:(image\/[a-z]+);base64,(.*)$/);
        if (!match) continue;
        const mime = match[1];
        const data = Utilities.base64Decode(match[2]);
        const ext = mime.split('/')[1] || 'jpg';
        const blob = Utilities.newBlob(data, mime, `${key}.${ext}`);
        const file = subfolder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        photoUrls[key] = file.getUrl();
      }
    }

    const score = computeVisitScorePct(visit);
    const hc = visit.headcount || {};
    const prodIn  = (hc.inStaff  && hc.inClients  != null) ? (hc.inClients  / hc.inStaff)  : '';
    const prodOut = (hc.outStaff && hc.outClients != null) ? (hc.outClients / hc.outStaff) : '';
    const r = visit.ratings || {};
    const dishes = Array.isArray(visit.dishes) ? visit.dishes : [];
    const d = i => dishes[i] || {};

    sV.appendRow([
      visit.id,
      visit.code || '',
      visit.status || 'submitted',
      visit.createdAt ? new Date(visit.createdAt) : '',
      visit.submittedAt ? new Date(visit.submittedAt) : new Date(),
      visit.auditor && visit.auditor.name || '',
      visit.auditor && visit.auditor.email || '',
      visit.local && visit.local.name || '',
      visit.local && visit.local.addr || '',
      visit.visit && visit.visit.type || '',
      visit.visit && visit.visit.date || '',
      visit.visit && visit.visit.timeIn || '',
      visit.visit && visit.visit.timeOut || '',
      visit.visit && visit.visit.guests || '',
      visit.visit && visit.visit.ticket || '',
      hc.inClients != null ? hc.inClients : '',
      hc.inStaff != null ? hc.inStaff : '',
      prodIn,
      hc.outClients != null ? hc.outClients : '',
      hc.outStaff != null ? hc.outStaff : '',
      prodOut,
      score,
      r.producto != null ? r.producto : '',
      r.servicio != null ? r.servicio : '',
      r.ambiente != null ? r.ambiente : '',
      r.limpieza != null ? r.limpieza : '',
      r.calidadPrecio != null ? r.calidadPrecio : '',
      r.global != null ? r.global : '',
      d(0).name || '', d(0).presentation || '', d(0).taste || '', d(0).temperature || '', d(0).quantity || '', photoUrls['dish_0'] || '',
      d(1).name || '', d(1).presentation || '', d(1).taste || '', d(1).temperature || '', d(1).quantity || '', photoUrls['dish_1'] || '',
      d(2).name || '', d(2).presentation || '', d(2).taste || '', d(2).temperature || '', d(2).quantity || '', photoUrls['dish_2'] || '',
      d(3).name || '', d(3).presentation || '', d(3).taste || '', d(3).temperature || '', d(3).quantity || '', photoUrls['dish_3'] || '',
      photoUrls['ticket'] || '',
      visit.finalSummary || '',
      visit.finalNotes || ''
    ]);

    const ansRows = [];
    for (const qid of Object.keys(visit.answers || {})) {
      const a = visit.answers[qid];
      ansRows.push([
        visit.id,
        visit.code || '',
        visit.local && visit.local.name || '',
        visit.visit && visit.visit.date || '',
        qid,
        '',
        '',
        '',
        a && a.val != null ? a.val : '',
        a && a.note || '',
        photoUrls[qid] || ''
      ]);
    }
    if (ansRows.length) {
      sA.getRange(sA.getLastRow() + 1, 1, ansRows.length, ansRows[0].length).setValues(ansRows);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, score, photoCount: Object.keys(photoUrls).length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function computeVisitScorePct(v) {
  let total = 0, earned = 0;
  for (const qid of Object.keys(v.answers || {})) {
    const a = v.answers[qid];
    if (!a || a.val == null || a.val === 'na') continue;
    const num = parseInt(a.val, 10);
    if (!isNaN(num) && String(num) === String(a.val)) {
      total += 5; earned += num;
    } else {
      total += 5; earned += (a.val === 'si') ? 5 : 0;
    }
  }
  return total ? Math.round((earned / total) * 100) : 0;
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'Mystery Shopper EM360 v2' }))
    .setMimeType(ContentService.MimeType.JSON);
}
