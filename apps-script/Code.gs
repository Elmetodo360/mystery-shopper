// Mystery Shopper - Backend Google Apps Script
//
// Pega este código en script.google.com → Nuevo proyecto → Code.gs
// 1. Crea una hoja de cálculo Google Sheets vacía y copia su ID en SPREADSHEET_ID
// 2. Crea una carpeta en Drive para fotos y copia su ID en PHOTOS_FOLDER_ID
// 3. Implementa → Implementar como aplicación web
//    - Ejecutar como: Yo (tu cuenta)
//    - Quién tiene acceso: Cualquier persona (no requiere inicio de sesión)
// 4. Copia la URL del Web App y pégala en la app (dashboard → Configuración → URL backend)

const SPREADSHEET_ID = '__PEGA_AQUI_EL_ID_DEL_SHEET__';
const PHOTOS_FOLDER_ID = '__PEGA_AQUI_EL_ID_DE_LA_CARPETA_DRIVE__';
const SHEET_VISITS = 'Visitas';
const SHEET_ANSWERS = 'Respuestas';

function doPost(e) {
  try {
    const visit = JSON.parse(e.postData.contents);
    if (!visit.id) throw new Error('visit.id missing');

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // Hoja Visitas
    let sV = ss.getSheetByName(SHEET_VISITS);
    if (!sV) {
      sV = ss.insertSheet(SHEET_VISITS);
      sV.appendRow([
        'id', 'code', 'status', 'createdAt', 'submittedAt',
        'auditorName', 'auditorEmail',
        'localName', 'localAddr',
        'visitType', 'visitDate', 'timeIn', 'timeOut', 'guests', 'ticket',
        'scorePct', 'finalSummary', 'finalNotes'
      ]);
    }

    // Hoja Respuestas
    let sA = ss.getSheetByName(SHEET_ANSWERS);
    if (!sA) {
      sA = ss.insertSheet(SHEET_ANSWERS);
      sA.appendRow([
        'visitId', 'visitCode', 'localName', 'visitDate',
        'questionId', 'block', 'questionText', 'type',
        'value', 'note', 'photoUrl'
      ]);
    }

    // Subir fotos a Drive
    const photoUrls = {};
    if (visit.photos) {
      const folder = DriveApp.getFolderById(PHOTOS_FOLDER_ID);
      const subfolderName = `${visit.code || visit.id}_${visit.local && visit.local.name || 'local'}`;
      let subfolder;
      const it = folder.getFoldersByName(subfolderName);
      if (it.hasNext()) subfolder = it.next();
      else subfolder = folder.createFolder(subfolderName);

      for (const qid of Object.keys(visit.photos)) {
        const b64 = visit.photos[qid];
        const match = b64.match(/^data:(image\/[a-z]+);base64,(.*)$/);
        if (!match) continue;
        const mime = match[1];
        const data = Utilities.base64Decode(match[2]);
        const ext = mime.split('/')[1] || 'jpg';
        const blob = Utilities.newBlob(data, mime, `${qid}.${ext}`);
        const file = subfolder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        photoUrls[qid] = file.getUrl();
      }
    }

    // Calcular score
    const score = computeVisitScorePct(visit);

    // Insertar fila resumen
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
      score,
      visit.finalSummary || '',
      visit.finalNotes || ''
    ]);

    // Insertar filas detalle
    const ansRows = [];
    for (const qid of Object.keys(visit.answers || {})) {
      const a = visit.answers[qid];
      ansRows.push([
        visit.id,
        visit.code || '',
        visit.local && visit.local.name || '',
        visit.visit && visit.visit.date || '',
        qid,
        '', // block (lo rellenas a mano si quieres en sheet, o lo cruzas)
        '', // questionText (idem)
        '', // type
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
    // Sin metadata del tipo aquí — usamos heurística: si es número, es score; si no, sí/no
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
    .createTextOutput(JSON.stringify({ ok: true, service: 'Mystery Shopper EM360' }))
    .setMimeType(ContentService.MimeType.JSON);
}
