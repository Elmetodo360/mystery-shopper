# Deploy — Mystery Shopper App

Pasos para que la app sea accesible públicamente. Hay dos partes: **frontend** (la web que usa el auditor) y **backend opcional** (Google Sheets para recibir los informes automáticamente).

## Parte A — Frontend en GitHub Pages (obligatorio)

Necesita acción manual de Chema (no se puede hacer desde Claude).

1. Entrar en https://github.com/elmetodo360 (o la cuenta que prefieras) → **New repository**
2. Nombre del repo: `mystery-shopper` (público)
3. Subir TODO el contenido de la carpeta `Mystery_Shopper_App/` al repo:
   - Opción A (recomendada): GitHub Desktop → arrastrar carpeta → Commit → Push
   - Opción B: desde la web "Add file → Upload files" arrastrando la carpeta entera
4. En el repo: **Settings → Pages**
   - Source: `Deploy from a branch`
   - Branch: `main` · folder `/ (root)`
   - Save
5. Esperar 1-2 minutos. URL pública: `https://elmetodo360.github.io/mystery-shopper/`

A partir de aquí, el auditor accede a:
`https://elmetodo360.github.io/mystery-shopper/visita.html?code=XXXXXX`

Y Chema accede al dashboard en:
`https://elmetodo360.github.io/mystery-shopper/dashboard.html`

Código admin por defecto: `METODO360` (cambiar desde dashboard → Configuración).

## Parte B — Backend opcional con Google Sheets (recomendado pero no bloqueante)

Sin backend la app funciona, pero el auditor descarga un JSON al finalizar y se lo manda a Chema por email/WhatsApp, y Chema lo importa en el dashboard con "Importar JSON". Si quieres que las visitas lleguen automáticamente a un Google Sheets:

1. Ir a https://script.google.com → **Nuevo proyecto**
2. Pegar el contenido de `apps-script/Code.gs` (sustituye lo que viene por defecto)
3. Crear una Google Sheet nueva → copiar su ID (de la URL: `https://docs.google.com/spreadsheets/d/<ID>/edit`) y pegarlo en `SPREADSHEET_ID` del Code.gs
4. Crear una carpeta en Google Drive para las fotos → copiar el ID (de la URL `.../folders/<ID>`) y pegarlo en `PHOTOS_FOLDER_ID`
5. En el Apps Script: **Implementar → Implementar como aplicación web**
   - Descripción: `Mystery Shopper EM360 v1`
   - Ejecutar como: **Yo (tu cuenta @elmetodo360.com)**
   - Quién tiene acceso: **Cualquier persona** (sin login, porque el envío viene desde un móvil random del auditor)
   - Implementar → Autorizar → copiar la **URL del Web App** que devuelve
6. En la app: abrir `dashboard.html` → Configuración → pegar la URL en "URL del backend"
7. Hecho. Las próximas visitas que se envíen aparecerán en la Sheet en 2 hojas:
   - `Visitas` (1 fila por visita con KPIs)
   - `Respuestas` (1 fila por pregunta-respuesta con enlace a foto en Drive)

## Parte C — Iconos PWA (opcional, para que se instale bonito en el móvil)

La app puede instalarse como PWA. Solo necesita los iconos en `assets/icon-192.png` y `assets/icon-512.png`. Cuando los tengas puedes generarlos en https://realfavicongenerator.net/ y subirlos al repo. Si no los pones, la app funciona igual pero el icono en pantalla de inicio será genérico.

## Verificación post-deploy

1. Abre la URL pública en tu móvil
2. Pulsa "Soy del equipo" → entra con `METODO360` → "Generar enlace de visita" → introduce nombre del local → copia el enlace generado
3. Abre ese enlace en una pestaña incógnito o en otro móvil → rellena la visita → finaliza
4. Vuelve al dashboard → debe aparecer la visita (si no aparece, vuelve a abrir el dashboard en el mismo dispositivo: el localStorage es local a cada navegador)

**Importante:** el dashboard ve solo las visitas que están en EL MISMO navegador donde se generó el enlace, salvo que esté configurado el backend. Por eso para producción real **se recomienda configurar la Parte B**.

## Personalización rápida

- Cambiar código admin: dashboard → Configuración
- Cambiar colores/fuentes: `assets/styles.css` (variables al principio)
- Modificar preguntas: `assets/checklist.js`
- Cambiar email de contacto: `gracias.html`
