# Mystery Shopper App - El Método 360

App web mobile-first para auditores externos que visitan locales de hostelería sin avisar y rellenan una checklist de 50 puntos críticos del customer journey. Chema recibe los informes en un dashboard interno.

## Stack

- HTML + CSS + JavaScript vanilla (sin frameworks)
- Persistencia: localStorage (formularios) + IndexedDB (fotos)
- Sync opcional: Google Apps Script + Google Sheets
- Hosting: GitHub Pages (gratis)

## Estructura

```
Mystery_Shopper_App/
├── index.html              Landing: introduce código visita o admin
├── visita.html             Formulario del auditor (50 puntos)
├── dashboard.html          Vista interna para Chema
├── gracias.html            Pantalla cierre tras enviar visita
├── assets/
│   ├── styles.css
│   ├── checklist.js        Los 50 puntos (datos)
│   ├── storage.js          Capa de persistencia
│   ├── app.js              Lógica del formulario
│   └── dashboard.js        Lógica del dashboard
├── apps-script/
│   └── Code.gs             Backend Google Sheets
├── manifest.webmanifest    PWA
└── DEPLOY.md               Cómo publicar en GitHub Pages
```

## Flujo de uso

1. Chema crea una "visita" en el dashboard con: nombre del local, dirección, código de visita (auto-generado), tipo de visita (mesa / take-away / delivery), fecha objetivo.
2. Chema copia el enlace `https://elmetodo360.github.io/mystery-shopper/visita.html?code=ABC123` y se lo manda al auditor por WhatsApp.
3. El auditor abre el enlace en el móvil (puede instalarlo como PWA), va al local, rellena la checklist durante o justo después de la visita. Puede pausar y reanudar (datos en localStorage).
4. Al pulsar "Enviar visita", los datos se envían al backend (Sheets vía Apps Script) o se descargan como JSON si no hay backend configurado.
5. Chema entra en `/dashboard.html` con código admin y ve: lista de visitas, scores por bloque, gráficas, galería de fotos, export PDF.

## Categorías evaluadas

11 bloques del customer journey hostelería:

1. Fachada / pre-llegada (4 puntos)
2. Recepción / host (4)
3. Ambiente / mesa (5)
4. Carta / menú (4)
5. Pedido / upselling (5)
6. Comida / bebida (8)
7. Servicio durante consumo (5)
8. Baños / limpieza (5)
9. Cobro / salida (4)
10. Personal / ánimo de venta (3)
11. Quejas / incidencias (3)

= 50 puntos exactos.

## Tipos de respuesta

- **Sí / No / N/A** — estándares duros y verificables ("¿el baño tiene jabón?")
- **Puntuación 0-5** — subjetivas y graduables ("amabilidad del camarero")

Todas las preguntas permiten:
- Nota abierta de texto
- Foto opcional (cámara del móvil, comprimida client-side)

## Notas

- Sin pagos recurrentes (memoria `evitar_pagos_recurrentes`)
- Sin emojis en entregables PDF (memoria `pdfs_sin_emojis`)
- Acción manual para Chema: crear repo GitHub `mystery-shopper`, push, activar Pages, opcional configurar Apps Script. Ver `DEPLOY.md`.
