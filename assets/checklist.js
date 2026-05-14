// Mystery Shopper - los 50 puntos críticos del customer journey hostelería
// Fuente: Bibliotecario El Método 360 (Perplexity Deep Research 2026-05-13)
// Triangulado con: MSPA, BARE International, IntelliShop, Intouch Insight,
// iShopFor Ipsos, GoAudits, RestaurantOwner, OSHA 1910.141, Toast POS, ServMeCo, Yelp Biz
// Tipos de respuesta: "yesno" (sí/no/na) | "score" (0-5)

const MS_CHECKLIST = {
  blocks: [
    {
      id: 'fachada',
      title: '1. Pre-llegada y fachada',
      desc: 'Lo que el cliente percibe antes de entrar.',
      questions: [
        { id: 'MS-01', text: '¿La fachada, rótulo y entrada están limpios, iluminados y sin desperfectos visibles (cristales, pintura, toldos, papeleras del entorno inmediato)?', type: 'yesno', photo: true, why: 'La primera impresión decide si un cliente que pasa por delante entra o sigue.', signal: 'Cumplimiento estándar de marca exterior' },
        { id: 'MS-02', text: '¿La carta o el menú del día está expuesto en el exterior, legible, en buen estado y con precios visibles?', type: 'yesno', photo: true, why: 'La carta exterior es el escaparate comercial y filtro de ticket medio.', signal: 'Orientación comercial y cumplimiento legal de exposición de precios' },
        { id: 'MS-03', text: 'Puntúa el atractivo general del exterior (rótulo, iluminación, terraza si existe, sensación de invitar a entrar).', type: 'score', photo: true, why: 'El atractivo exterior correlaciona con la tasa de captación de tráfico peatonal.', signal: 'Appeal visual del punto de venta' },
        { id: 'MS-04', text: '¿Hay coherencia visual entre la imagen digital del local (Google, redes, web) y lo que ves al llegar?', type: 'yesno', photo: true, why: 'Incongruencia entre lo digital y lo físico destruye expectativa y NPS.', signal: 'Alineamiento marketing-operación' },
      ],
    },
    {
      id: 'recepcion',
      title: '2. Recepción y acomodo',
      desc: 'Primer contacto humano: 30 segundos críticos.',
      questions: [
        { id: 'MS-05', text: '¿Te saludaron en los primeros 30 segundos desde que entraste, con contacto visual?', type: 'yesno', photo: false, why: 'Estándar duro de la industria; impacta directamente en percepción de hospitalidad.', signal: 'Tiempo de greeting y compromiso del staff de sala' },
        { id: 'MS-06', text: '¿La persona que te recibió preguntó si tenías reserva y cuántos seríais antes de acomodarte?', type: 'yesno', photo: false, why: 'Refleja existencia de proceso de hosting estructurado, no improvisado.', signal: 'Madurez del SOP de recepción' },
        { id: 'MS-07', text: 'Puntúa la calidez y profesionalidad de la persona que te recibió (sonrisa, tono, lenguaje).', type: 'score', photo: false, why: 'La primera interacción humana ancla la percepción de todo el servicio.', signal: 'Estándar humano de bienvenida' },
        { id: 'MS-08', text: '¿La mesa estaba limpia, montada y lista cuando te sentaste (sin migas, manchas, cubiertos sucios)?', type: 'yesno', photo: true, why: 'Una mesa mal montada al inicio anticipa fallos de control en sala.', signal: 'Cumplimiento del montaje pre-servicio' },
      ],
    },
    {
      id: 'ambiente',
      title: '3. Ambiente y mesa',
      desc: 'Lo que rodea al cliente durante la experiencia.',
      questions: [
        { id: 'MS-09', text: '¿El volumen de la música permite mantener una conversación normal sin alzar la voz?', type: 'yesno', photo: false, why: 'Música mal calibrada es la queja silenciosa que más reduce tiempo de permanencia y reseñas.', signal: 'Gestión del ambiente sonoro' },
        { id: 'MS-10', text: 'Puntúa la iluminación de tu zona (suficiente para leer la carta, no agresiva, coherente con la propuesta del local).', type: 'score', photo: true, why: 'La iluminación condiciona percepción de calidad del plato y comodidad.', signal: 'Ambientación visual' },
        { id: 'MS-11', text: '¿La temperatura del comedor era confortable (ni frío excesivo de aire acondicionado ni calor)?', type: 'yesno', photo: false, why: 'Climatización es factor crítico de permanencia y rotación.', signal: 'Gestión de confort físico' },
        { id: 'MS-12', text: '¿Notaste algún olor desagradable (cocina mal extraída, baños, basura, humedad) en la zona de mesas?', type: 'yesno', photo: false, why: 'Olores ajenos al producto son red flag inmediato para reseña negativa.', signal: 'Extracción, limpieza profunda y gestión de residuos' },
        { id: 'MS-13', text: 'Puntúa la limpieza visible del comedor en tu campo de visión (suelo, mesas vecinas, ventanas, expositores, decoración).', type: 'score', photo: true, why: 'Percepción general de higiene del salón; correlaciona +17% con satisfacción según Intouch Insight.', signal: 'Cumplimiento de limpieza durante el servicio' },
      ],
    },
    {
      id: 'carta',
      title: '4. Carta y menú',
      desc: 'Soporte comercial número uno.',
      questions: [
        { id: 'MS-14', text: '¿La carta que te entregaron estaba limpia, en buen estado y sin manchas, dobleces ni precios tachados?', type: 'yesno', photo: true, why: 'La carta es la herramienta comercial #1; su estado degrada o eleva ticket medio.', signal: 'Mantenimiento del soporte de venta' },
        { id: 'MS-15', text: '¿La carta indica claramente alérgenos según normativa (UE 1169/2011) o existe documento accesible que los detalla?', type: 'yesno', photo: true, why: 'Cumplimiento legal obligatorio en España; un fallo aquí es sanción.', signal: 'Cumplimiento normativo' },
        { id: 'MS-16', text: '¿Los precios de la carta coinciden con los precios cobrados al final en el ticket?', type: 'yesno', photo: true, why: 'Discrepancia precio carta vs ticket es motivo legal de queja y mata confianza.', signal: 'Control de PMS/TPV y actualización de cartas' },
        { id: 'MS-17', text: 'Puntúa la facilidad para entender la carta y encontrar lo que buscabas (orden, descripciones, jerarquía visual).', type: 'score', photo: true, why: 'Una carta confusa reduce ticket medio y aumenta tiempo de pedido.', signal: 'Ingeniería de menú' },
      ],
    },
    {
      id: 'pedido',
      title: '5. Pedido y upselling',
      desc: 'Donde más se gana o se pierde ticket.',
      questions: [
        { id: 'MS-18', text: '¿Tomaron tu pedido de bebida en menos de 5 minutos desde que te sentaste?', type: 'yesno', photo: false, why: 'KPI duro de servicio; cada minuto extra reduce satisfacción y rotación de mesa.', signal: 'Ritmo de servicio y dimensionamiento de plantilla' },
        { id: 'MS-19', text: '¿El camarero sugirió o recomendó activamente algún plato, especialidad, maridaje o producto del día (upselling/cross-selling)?', type: 'yesno', photo: false, why: 'El upselling es el levier directo del ticket medio; benchmark sector ~56% (Intouch).', signal: '% de aplicación de venta sugerida' },
        { id: 'MS-20', text: 'Cuando preguntaste por un plato concreto, ¿el camarero supo describirlo con detalle (ingredientes, preparación, opinión personal)?', type: 'score', photo: false, why: 'El conocimiento de carta es el predictor #1 de ticket medio y NPS de servicio.', signal: '% conocimiento de carta del personal' },
        { id: 'MS-21', text: '¿Te preguntaron por alergias, intolerancias o preferencias alimentarias antes de cerrar el pedido?', type: 'yesno', photo: false, why: 'Obligación legal y de seguridad alimentaria, además de hospitalidad.', signal: 'Aplicación del protocolo de alérgenos en sala' },
        { id: 'MS-22', text: '¿El camarero repitió la comanda completa al cerrar el pedido para confirmar?', type: 'yesno', photo: false, why: 'Cierre de comanda con confirmación reduce errores en pase y reclamaciones.', signal: 'Cumplimiento del SOP de toma de comanda' },
      ],
    },
    {
      id: 'comida',
      title: '6. Comida y bebida',
      desc: 'El producto: lo que el cliente paga.',
      questions: [
        { id: 'MS-23', text: '¿Las bebidas llegaron en los 4 minutos siguientes al pedido?', type: 'yesno', photo: false, why: 'Estándar industria F&B; condiciona percepción de eficiencia del bar.', signal: 'Tiempo bebida-mesa, eficacia del bar' },
        { id: 'MS-24', text: '¿El primer plato/entrante llegó en menos de 15 minutos desde el pedido?', type: 'yesno', photo: false, why: 'KPI duro de cocina; ventana crítica para evitar abandono percibido.', signal: 'Tiempo de ticket de cocina (entrantes)' },
        { id: 'MS-25', text: '¿Los platos calientes llegaron calientes y los fríos fríos a la temperatura adecuada?', type: 'yesno', photo: false, why: 'Comida servida a temperatura correcta eleva un 35% la percepción de calidad (Intouch).', signal: 'Control de temperatura en pase' },
        { id: 'MS-26', text: 'Puntúa la presentación visual del plato (montaje, limpieza del borde, coherencia con la foto/descripción de carta).', type: 'score', photo: true, why: 'La primera impresión visual condiciona la percepción de sabor antes del primer bocado.', signal: 'Cumplimiento de escandallo visual y estándares de pase' },
        { id: 'MS-27', text: '¿Lo servido coincide en cantidad, ingredientes y guarnición con lo descrito en la carta?', type: 'yesno', photo: true, why: 'Incongruencia carta-plato es la queja #1 en TripAdvisor/Google.', signal: 'Cumplimiento de ficha técnica' },
        { id: 'MS-28', text: 'Puntúa el sabor y calidad del producto del plato principal (frescor, punto de cocción, equilibrio).', type: 'score', photo: true, why: 'El producto es el corazón del negocio; sin esto, el resto es inútil.', signal: 'Calidad real del producto entregado' },
        { id: 'MS-29', text: '¿La bebida se sirvió en cristalería/vajilla correcta, limpia y sin defectos (sin marcas, sin restos, sin chips)?', type: 'yesno', photo: true, why: 'Cristalería y vajilla son extensión de marca y signal directo de control de calidad.', signal: 'Cumplimiento de menaje y reposición de loza dañada' },
        { id: 'MS-30', text: '¿Te ofrecieron postre, café o digestivo de forma activa antes de pedir la cuenta?', type: 'yesno', photo: false, why: 'El cierre de comida es el segundo levier de ticket medio tras los entrantes.', signal: '% de venta de postre/café (uplift)' },
      ],
    },
    {
      id: 'servicio',
      title: '7. Servicio durante el consumo',
      desc: 'Atención sostenida mientras se come.',
      questions: [
        { id: 'MS-31', text: '¿Pasaron a hacer el check-back ("¿qué tal está todo?") dentro de los primeros 2 minutos tras servir el plato principal?', type: 'yesno', photo: false, why: 'El two-bite check es el SOP que permite corregir problemas antes de que escalen a queja pública.', signal: 'Aplicación del check-back' },
        { id: 'MS-32', text: '¿Repusieron pan, agua o bebida sin tener que pedirlo (cuando estaba vacío)?', type: 'yesno', photo: false, why: 'Atención proactiva es indicador de cultura de servicio madura.', signal: 'Anticipación del personal de sala' },
        { id: 'MS-33', text: '¿Retiraron los platos vacíos en un plazo razonable (3-5 minutos) sin que tuvieras que pedirlo?', type: 'yesno', photo: false, why: 'Marcar mesas vivas y ritmar el servicio es clave en rotación.', signal: 'Ritmo de desbarase' },
        { id: 'MS-34', text: 'Puntúa el equilibrio del ritmo del servicio (sin esperas largas entre platos, sin sensación de prisa).', type: 'score', photo: false, why: 'El tempo del servicio define la experiencia tanto como la comida.', signal: 'Coordinación sala-cocina' },
        { id: 'MS-35', text: '¿Observaste trabajo en equipo visible entre el personal (se ayudan, se comunican, ningún cliente queda desatendido)?', type: 'yesno', photo: false, why: 'La falta de teamwork es lo primero que se nota en sala llena.', signal: 'Cultura operativa de equipo' },
      ],
    },
    {
      id: 'banos',
      title: '8. Baños y limpieza visible',
      desc: 'El termómetro más fiable de la operativa.',
      questions: [
        { id: 'MS-36', text: '¿El baño tenía jabón disponible y dispensador funcionando?', type: 'yesno', photo: true, why: 'Estándar OSHA-equivalente; ausencia de jabón es red flag sanitario.', signal: 'Cumplimiento básico de higiene' },
        { id: 'MS-37', text: '¿Había papel higiénico en todas las cabinas y papel/secador de manos operativo?', type: 'yesno', photo: true, why: 'Tener un repuesto mínimo por cabina es estándar de la industria.', signal: 'Reposición y mantenimiento' },
        { id: 'MS-38', text: 'Puntúa la limpieza general del baño (suelo, sanitarios, lavabo, espejos, papelera, olor).', type: 'score', photo: true, why: 'El baño es termómetro mental: si está sucio, el cliente cuestiona la cocina.', signal: 'Frecuencia y calidad de limpieza durante el turno' },
        { id: 'MS-39', text: '¿Había registro/parte visible de control de limpieza del baño (firma horaria) o señales de revisión reciente?', type: 'yesno', photo: true, why: 'Existencia de control implica gestión, no azar.', signal: 'Madurez del sistema operativo de higiene' },
        { id: 'MS-40', text: '¿Las zonas de paso visibles al cliente (pasillos, acceso a baños, terraza, zona de espera) estaban libres de obstáculos, cajas o residuos?', type: 'yesno', photo: true, why: 'Orden visible = seguridad percibida + cumplimiento PRL.', signal: 'Disciplina operativa de zonas comunes' },
      ],
    },
    {
      id: 'cobro',
      title: '9. Cobro y salida',
      desc: 'La última impresión pesa más que la primera.',
      questions: [
        { id: 'MS-41', text: '¿La cuenta llegó en menos de 5 minutos desde que la pediste?', type: 'yesno', photo: false, why: 'El muerto del cierre es donde se pierde NPS ya ganado; tiempo crítico.', signal: 'Agilidad de cierre y rotación' },
        { id: 'MS-42', text: '¿El ticket está desglosado por concepto, con precios coincidentes con la carta y sin cargos no informados (cubierto, servicio)?', type: 'yesno', photo: true, why: 'Ticket itemizado es obligación legal y previene reclamación; los cargos ocultos son letales.', signal: 'Transparencia comercial y cumplimiento legal' },
        { id: 'MS-43', text: '¿Te ofrecieron diferentes formas de pago (efectivo, tarjeta, móvil) sin fricción y el TPV funcionaba a la primera?', type: 'yesno', photo: false, why: 'Fallos en TPV en el cierre destruyen toda la experiencia previa.', signal: 'Estado de infraestructura de cobro' },
        { id: 'MS-44', text: '¿Te despidieron de forma personalizada al salir (más allá de un "adiós" automático), invitándote a volver?', type: 'yesno', photo: false, why: 'El goodbye es el último anclaje emocional y predictor de retorno.', signal: 'Cultura de hospitalidad de cierre' },
      ],
    },
    {
      id: 'animo_venta',
      title: '10. Personal y ánimo de venta',
      desc: 'La actitud comercial transversal del equipo.',
      questions: [
        { id: 'MS-45', text: '¿El uniforme/look del personal estaba limpio, completo y coherente con el concepto del local (sin manchas, delantal en su sitio, calzado adecuado)?', type: 'yesno', photo: true, why: 'El uniforme comunica estándar antes que cualquier palabra.', signal: 'Disciplina de imagen y dotación' },
        { id: 'MS-46', text: 'Puntúa el ánimo general percibido del equipo (energía, sonrisas, ganas, lenguaje corporal positivo) durante tu visita.', type: 'score', photo: false, why: 'El ánimo del equipo es el indicador más directo de salud del clima laboral, que correlaciona con servicio.', signal: 'Clima laboral operativo en sala' },
        { id: 'MS-47', text: '¿Identificaste presencia de un responsable/manager en sala (visible, supervisando, hablando con clientes o equipo)?', type: 'yesno', photo: false, why: 'La ausencia de manager en sala correlaciona directamente con caída de estándares.', signal: 'Presencia gerencial activa en turno' },
      ],
    },
    {
      id: 'incidencias',
      title: '11. Quejas e incidencias',
      desc: 'Cómo reacciona el local cuando algo falla.',
      questions: [
        { id: 'MS-48', text: 'Si surgió cualquier incidencia o queja (real o provocada por ti), ¿el personal escuchó activamente sin interrumpir y sin culpar?', type: 'yesno', photo: false, why: 'Aplicación del método LAST (Listen-Apologize-Solve-Thank) es el predictor #1 de recuperación de cliente.', signal: 'Protocolo de gestión de quejas' },
        { id: 'MS-49', text: '¿La incidencia se resolvió en el momento (cambio de plato, descuento, disculpa formal, escalado a manager) sin que tuvieras que insistir?', type: 'score', photo: false, why: 'La resolución en el momento convierte detractor en promotor; insistir mata el NPS.', signal: 'Empoderamiento del personal para resolver' },
        { id: 'MS-50', text: 'Tras toda la experiencia: ¿recomendarías este local a un amigo? (0 = en absoluto, 5 = sin duda).', type: 'score', photo: false, why: 'Proxy directo de NPS y métrica resumen del checklist.', signal: 'NPS estimado de la visita' },
      ],
    },
  ],
  sources: [
    'MSPA Americas — Certification & standards: https://www.mspa-americas.org/certification/',
    'MSPA North America — Ethics & guidelines: https://mspanorthamerica.com/ethics/',
    'BARE International — Mystery Shopping methodology: https://www.bareinternational.com/service/mystery-shopping/',
    'IntelliShop — Effective Mystery Shopping questionnaire: https://intelli-shop.com/the-making-of-an-effective-mystery-shopping-questionnaire/',
    'IntelliShop — Top KPIs: https://intelli-shop.com/blog/top-kpis-that-online-mystery-shopper-programs-measure/',
    'Intouch Insight — 12 insights restaurant mystery shopping: https://www.intouchinsight.com/blog/restaurant-mystery-shopping',
    'Intouch Insight — Sample restaurant questionnaires: https://www.intouchinsight.com/resources/mystery-shopping-questionnaire/',
    'GoAudits — Restaurant Mystery Shopper Checklist: https://goaudits.com/checklist/restaurant-mystery-shopper-checklist/907/40/',
    'iShopFor Ipsos — Checklist + example questions: https://ishopforipsos.com/en-GB/news/article/775-mystery-shopper-checklist-and-example-questions',
    'RestaurantOwner — Guest Experience Stages and Touchpoints',
    'ServMeCo — Restaurant customer journey touchpoints: https://www.servmeco.com/resources/restaurant-customer-journey-restaurant-touchpoints',
    'Yelp Business — 7 stages of restaurant customer journey: https://business.yelp.com/resources/articles/restaurant-customer-journey/',
    'Toast POS — Train servers on suggestive selling: https://pos.toasttab.com/blog/on-the-line/how-train-servers-to-use-suggestive-selling-techniques',
    'Cuboh — Customer complaints L.A.S.T. method: https://www.cuboh.com/blog/customer-complaints-active-listening',
    'OSHA — 1910.141 Sanitation: https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.141',
    'Bindy — Restroom inspection checklist: https://blog.bindy.com/washroom-inspection-checklist/',
  ],
};

function getAllQuestionsFlat() {
  const out = [];
  for (const b of MS_CHECKLIST.blocks) {
    for (const q of b.questions) {
      out.push({ ...q, blockId: b.id, blockTitle: b.title });
    }
  }
  return out;
}

function getQuestionById(qid) {
  for (const b of MS_CHECKLIST.blocks) {
    for (const q of b.questions) {
      if (q.id === qid) return { ...q, blockId: b.id, blockTitle: b.title };
    }
  }
  return null;
}

window.MS_CHECKLIST = MS_CHECKLIST;
window.MS_QUESTIONS = { getAllQuestionsFlat, getQuestionById };
