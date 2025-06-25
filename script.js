document.addEventListener('DOMContentLoaded', () => {
    if (typeof APP_CONFIG === 'undefined') {
        console.error("¡ERROR CRÍTICO! El archivo configuracion.js no se ha cargado.");
        alert("Falta el archivo de configuración. La aplicación no puede funcionar.");
        return;
    }

    // --- ELEMENTOS DEL DOM ---
    const form = document.getElementById('reunionForm');
    const areaSelect = document.getElementById('area');
    const sucesosContainer = document.getElementById('sucesos-container');
    const ausentismoContainer = document.getElementById('ausentismo-container');
    const horasExtraContainer = document.getElementById('horas-extra-container');
    const gestionesMejoraContainer = document.getElementById('gestiones-mejora-container');
    const btnAnadirSuceso = document.getElementById('btnAnadirSuceso');
    const btnAnadirAusentismo = document.getElementById('btnAnadirAusentismo');
    const btnAnadirHoraExtra = document.getElementById('btnAnadirHoraExtra');
    const btnAnadirGestion = document.getElementById('btnAnadirGestion');
    const btnResetLocalStorage = document.getElementById('btnResetLocalStorage');
    const fechaInput = document.getElementById('fecha');
    const submitButton = document.getElementById('btnSubmitReport');
    const cumplimientoSlider = document.getElementById('cumplimiento_slider');
    const cumplimientoValorDisplay = document.getElementById('cumplimiento_valor_display');
    const cumplimientoHiddenInput = document.getElementById('cumplimiento');
    const formContainer = document.getElementById('form-container');
    const successMessageContainer = document.getElementById('success-message');

    const conditionalElements = {
        cumplimiento: document.getElementById('section-cumplimiento'),
        colchonesProd: document.getElementById('section-colchones-prod'),
        datosRelevante: document.getElementById('section-datos-relevante'),
        accesoriosPlan: document.getElementById('section-accesorios-plan'),
        basesPlan: document.getElementById('section-bases-plan'),
        mueblesPlan: document.getElementById('section-muebles-plan'),
        sucesos: document.getElementById('section-sucesos'),
        porcAusentismo: document.getElementById('field-group-porc-ausentismo'),
        ausentismo: document.getElementById('section-ausentismo'),
        horasExtra: document.getElementById('section-horas-extra'),
        gestionesMejora: document.getElementById('section-gestiones-mejora'),
        observaciones: document.getElementById('section-observaciones'),
        fibraScrap: document.getElementById('section-fibra-scrap'),
        espumaScrap: document.getElementById('section-espuma-scrap')
    };

    // --- LÓGICA DE MANEJO DE DATOS Y ESTADO ---
    const LOCAL_STORAGE_KEY = 'reunionFormData';
    let sucesoIdCounter = 0;
    let ausentismoIdCounter = 0;
    let horaExtraIdCounter = 0;
    let gestionIdCounter = 0;
    let isLoading = false;

    function guardarDatosEnLocalStorage() {
        if (isLoading) return;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            if (!cb.checked) {
                if (!data[cb.name]) { data[cb.name] = 'false'; }
            }
        });
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    }

    function cargarDatosDesdeLocalStorage() {
        isLoading = true;
        try {
            const guardado = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (!guardado) {
                const now = new Date();
                const nowParaInput = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
                fechaInput.value = nowParaInput.toISOString().slice(0, 16);
                manejarCambioDeFecha();
                return;
            }
            const data = JSON.parse(guardado);

            const dynamicRowIndexes = { sucesos: new Set(), ausentismos: new Set(), horas_extra: new Set(), gestiones_mejora: new Set() };
            for (const key in data) {
                const sucesosMatch = key.match(/^sucesos\[(\d+)\]/);
                if (sucesosMatch) dynamicRowIndexes.sucesos.add(sucesosMatch[1]);
                const ausentismosMatch = key.match(/^ausentismos\[(\d+)\]/);
                if (ausentismosMatch) dynamicRowIndexes.ausentismos.add(ausentismosMatch[1]);
                const horasExtraMatch = key.match(/^horas_extra\[(\d+)\]/);
                if (horasExtraMatch) dynamicRowIndexes.horas_extra.add(horasExtraMatch[1]);
                const gestionesMatch = key.match(/^gestiones_mejora\[(\d+)\]/);
                if (gestionesMatch) dynamicRowIndexes.gestiones_mejora.add(gestionesMatch[1]);
            }
            
            dynamicRowIndexes.sucesos.forEach(() => anadirNuevaFilaSuceso());
            dynamicRowIndexes.ausentismos.forEach(() => anadirNuevaFilaAusentismo());
            dynamicRowIndexes.horas_extra.forEach(() => anadirNuevaFilaHoraExtra());
            dynamicRowIndexes.gestiones_mejora.forEach(() => anadirNuevaFilaGestion());

            for (const key in data) {
                const element = form.elements[key];
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = data[key] === 'true';
                    } else {
                        element.value = data[key];
                    }
                    if (element.tagName === 'SELECT' || element.type === 'range') {
                        element.dispatchEvent(new Event('change', { 'bubbles': true }));
                        if(element.type === 'range') element.dispatchEvent(new Event('input', { 'bubbles': true }));
                    }
                }
            }
            
            if (fechaInput.value) manejarCambioDeFecha();

        } finally {
            isLoading = false;
        }
    }

    // --- LÓGICA DE INTERFAZ Y VISUALIZACIÓN ---
    function manejarCambioDeFecha() {
        let fechaSeleccionadaObj = fechaInput && fechaInput.value ? new Date(fechaInput.value) : new Date();
        if (isNaN(fechaSeleccionadaObj.getTime())) fechaSeleccionadaObj = new Date();
        const esLunes = fechaSeleccionadaObj.getDay() === 1;
        for (const id in APP_CONFIG.textMappings) {
            const element = document.getElementById(id);
            if (element) {
                const textoCompleto = esLunes ? APP_CONFIG.textMappings[id][1] : APP_CONFIG.textMappings[id][0];
                if (id === "label-cumplimiento" && cumplimientoValorDisplay) {
                    const nodoTexto = Array.from(element.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                    if (nodoTexto) nodoTexto.nodeValue = textoCompleto.replace(':', '') + ": ";
                } else element.textContent = textoCompleto;
            }
        }
    }
    
    function updateFormVisibility() {
        const selectedArea = areaSelect.value;
        const config = APP_CONFIG.configuracionDeVisibilidad[selectedArea] || {};
        Object.values(conditionalElements).forEach(el => el && (el.style.display = 'none'));
        submitButton.style.display = 'none';
        if (!selectedArea) return;

        submitButton.style.display = 'block';
        if (conditionalElements.observaciones) conditionalElements.observaciones.style.display = 'block';
        
        for (const sectionKey in config) {
            if (config[sectionKey] && conditionalElements[sectionKey]) {
                conditionalElements[sectionKey].style.display = 'block';
            }
        }
        
        actualizarSubAreasEnFilas();
        sucesosContainer.querySelectorAll('.dynamic-row-entry').forEach(entry => {
            const id = entry.id.split('_').pop();
            if (id) toggleMetalurgiaView(id);
        });
    }

    // --- LÓGICA PARA SUCESOS ---
    function toggleMetalurgiaView(idCounter) {
        const sucesoEntry = document.getElementById(`suceso_entry_${idCounter}`);
        if (!sucesoEntry) return;
        const area = areaSelect.value;
        const tipoIncidente = sucesoEntry.querySelector(`#tipo_incidente_${idCounter}`).value;
        const originalFields = sucesoEntry.querySelector('.original-suceso-fields');
        const metalurgiaFields = sucesoEntry.querySelector('.metalurgia-falla-container');
        if (area === 'metalurgia' && tipoIncidente === 'Falla De Maquina') {
            originalFields.classList.add('hidden');
            metalurgiaFields.classList.add('visible');
        } else {
            originalFields.classList.remove('hidden');
            metalurgiaFields.classList.remove('visible');
        }
    }

    function setupSucesoEventListeners(sucesoEntry, idCounter) {
        const tipoIncidenteSelect = sucesoEntry.querySelector(`#tipo_incidente_${idCounter}`);
        const tipoMaquinaSelect = sucesoEntry.querySelector(`#tipo_maquina_${idCounter}`);
        
        tipoIncidenteSelect.addEventListener('change', () => toggleMetalurgiaView(idCounter));
        tipoMaquinaSelect.addEventListener('change', () => window.updateCodigoMaquinaOptions(idCounter));
    }

    function crearHtmlSuceso(idCounter, displayIndex) {
        const opcionesTipoIncidente = APP_CONFIG.tipoIncidenteOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('');
        const opcionesAreaResponsable = APP_CONFIG.areaResponsableOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('');
        const tiposMaquinaOptions = Object.keys(APP_CONFIG.maquinaFallaMappings).map(opt => `<option value="${opt}">${opt.charAt(0).toUpperCase() + opt.slice(1)}</option>`).join('');
        const tiposFallaOptions = APP_CONFIG.tipoFallaMaquinaOptions.map(opt => `<option value="${opt}">${opt.charAt(0).toUpperCase() + opt.slice(1)}</option>`).join('');
        
        const metalurgiaFormHtml = `<div class="metalurgia-falla-container" id="metalurgia_fields_${idCounter}">
                <div class="form-group"><label for="tipo_maquina_${idCounter}">Tipo de Máquina</label><select id="tipo_maquina_${idCounter}" name="sucesos[${idCounter}][tipo_maquina]"><option value="">Seleccione</option>${tiposMaquinaOptions}</select></div>
                <div class="form-group"><label for="codigo_maquina_${idCounter}">Código de Máquina</label><select id="codigo_maquina_${idCounter}" name="sucesos[${idCounter}][codigo_maquina]"><option value="">Seleccione</option></select></div>
                <div class="form-group"><label for="tipo_falla_${idCounter}">Tipo de Falla</label><select id="tipo_falla_${idCounter}" name="sucesos[${idCounter}][tipo_falla]"><option value="">Seleccione</option>${tiposFallaOptions}</select></div>
                <div class="form-group"><label for="unidades_afectadas_${idCounter}">Unidades Afectadas</label><input type="number" id="unidades_afectadas_${idCounter}" name="sucesos[${idCounter}][unidades_afectadas]" min="0" placeholder="Ej: 10"></div>
                <div class="form-group"><label for="tiempo_afectado_${idCounter}">Tiempo Afectado (Min)</label><input type="number" id="tiempo_afectado_${idCounter}" name="sucesos[${idCounter}][tiempo_afectado]" min="0" placeholder="Ej: 60"></div>
                <div class="form-group" style="grid-column: 1 / -1;"><label for="gestion_tomada_metalurgia_${idCounter}">Gestión Tomada</label><textarea id="gestion_tomada_metalurgia_${idCounter}" name="sucesos[${idCounter}][gestion_tomada_metalurgia]" rows="1" placeholder="Describa la gestión"></textarea></div>
            </div>`;

        return `<div class="dynamic-row-entry" id="suceso_entry_${idCounter}">
                    <h3 class="dynamic-row-title">Suceso ${displayIndex}</h3>
                    <div class="form-group">
                        <label for="tipo_incidente_${idCounter}">Tipo de incidente:</label>
                        <select id="tipo_incidente_${idCounter}" name="sucesos[${idCounter}][tipo_incidente]"><option value="">Seleccione</option>${opcionesTipoIncidente}</select>
                    </div>
                    <div class="original-suceso-fields">
                        <div class="form-group"><label for="incidente_${idCounter}">Incidente:</label><input type="text" id="incidente_${idCounter}" name="sucesos[${idCounter}][incidente]" placeholder="Descripción del incidente"></div>
                        <div class="form-group"><label for="area_responsable_${idCounter}">Área Responsable:</label><select id="area_responsable_${idCounter}" name="sucesos[${idCounter}][area_responsable]"><option value="">Seleccione</option>${opcionesAreaResponsable}</select></div>
                        <div class="form-group"><label for="tiempo_afectacion_${idCounter}">Tiempo de afectación (Min):</label><input type="number" id="tiempo_afectacion_${idCounter}" name="sucesos[${idCounter}][tiempo_afectacion]" min="0" placeholder="Ej: 60"></div>
                        <div class="form-group"><label for="unidades_${idCounter}">Unidades (afectadas/perdidas):</label><input type="number" id="unidades_${idCounter}" name="sucesos[${idCounter}][unidades]" min="0" placeholder="Ej: 10"></div>
                        <div class="form-group"><label for="impacto_produccion_${idCounter}">Impacto en producción:</label><textarea id="impacto_produccion_${idCounter}" name="sucesos[${idCounter}][impacto_produccion]" rows="1" placeholder="Describa el impacto"></textarea></div>
                        <div class="form-group"><label for="gestion_tomada_${idCounter}">Gestión tomada:</label><textarea id="gestion_tomada_${idCounter}" name="sucesos[${idCounter}][gestion_tomada]" rows="1" placeholder="Describa la gestión"></textarea></div>
                    </div>
                    ${metalurgiaFormHtml}
                    <div class="form-group checkbox-group" style="margin-top: 15px;"><input type="checkbox" id="estado_resuelto_${idCounter}" name="sucesos[${idCounter}][estado_resuelto]" value="true"><label for="estado_resuelto_${idCounter}" class="checkbox-label">Resuelto</label></div>
                    <button type="button" class="btn-remove-row" onclick="eliminarFila('suceso_entry_${idCounter}', 'sucesos-container', 'Suceso')">Eliminar Suceso ${displayIndex}</button>
                    <hr class="dynamic-row-divider">
                </div>`;
    }

    function anadirNuevaFilaSuceso() {
        if (!sucesosContainer) return;
        const displayIndex = sucesosContainer.querySelectorAll('.dynamic-row-entry').length + 1;
        const nuevoSucesoHtml = crearHtmlSuceso(sucesoIdCounter, displayIndex);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = nuevoSucesoHtml;
        const nuevaFilaElement = tempDiv.firstElementChild;
        if (nuevaFilaElement) {
            sucesosContainer.appendChild(nuevaFilaElement);
            setupSucesoEventListeners(nuevaFilaElement, sucesoIdCounter);
            toggleMetalurgiaView(sucesoIdCounter);
            sucesoIdCounter++;
        }
    }
    
    // --- OTRAS FILAS DINÁMICAS Y UTILIDADES ---
    window.updateCodigoMaquinaOptions = function(idCounter) {
        const sucesoEntry = document.getElementById(`suceso_entry_${idCounter}`);
        if (!sucesoEntry) return;
        const tipoMaquinaSelect = sucesoEntry.querySelector(`#tipo_maquina_${idCounter}`);
        const codigoMaquinaSelect = sucesoEntry.querySelector(`#codigo_maquina_${idCounter}`);
        codigoMaquinaSelect.innerHTML = '<option value="">Seleccione</option>';
        const codigos = APP_CONFIG.maquinaFallaMappings[tipoMaquinaSelect.value] || [];
        codigos.forEach(codigo => codigoMaquinaSelect.add(new Option(codigo, codigo)));
    }
    function crearHtmlAusentismo(idCounter, displayIndex) { return `<div class="dynamic-row-entry" id="ausentismo_entry_${idCounter}"><h3 class="dynamic-row-title">Reporte Ausentismo ${displayIndex}</h3><div class="form-group"><label for="puesto_trabajo_${idCounter}">Puesto De Trabajo:</label><input type="text" id="puesto_trabajo_${idCounter}" name="ausentismos[${idCounter}][puesto_trabajo]" placeholder="Ej: Operador de máquina X"></div><div class="form-group"><label for="Motivo Ausentismo_${idCounter}">Motivo:</label><select id="motivo_ausentismo_${idCounter}" name="ausentismos[${idCounter}][motivo]"><option value="">Seleccione</option><option value="Licencia Medica">Licencia Médica</option><option value="Permiso Otorgado">Permiso Otorgado</option><option value="Ausencia Sin Justificar">Ausencia Sin Justifica</option><option value="Por Cumpleaños">Por Cumpleaños</option><option value="Información Por Ratificar">Información Por Ratificar</option><option value="Otro motivo">Otro Motivo</option></select></div><div class="form-group"><label for="cantidad_personal_${idCounter}">Cantidad De Personal:</label><input type="number" id="cantidad_personal_${idCounter}" name="ausentismos[${idCounter}][cantidad_personal]" min="1" value="1" placeholder="Ej: 1"></div><div class="form-group"><label for="gestion_ausentismo_${idCounter}">Gestión:</label><textarea id="gestion_ausentismo_${idCounter}" name="ausentismos[${idCounter}][gestion]" rows="1" placeholder="Describa la gestión realizada"></textarea></div><button type="button" class="btn-remove-row icon-button" onclick="eliminarFila('ausentismo_entry_${idCounter}', 'ausentismo-container', 'Reporte Ausentismo')"><span class="trash-icon-placeholder">&#128465;</span> Eliminar Reporte ${displayIndex}</button><hr class="dynamic-row-divider"></div>`; }
    function anadirNuevaFilaAusentismo() { if (!ausentismoContainer) return; const displayIndex = ausentismoContainer.querySelectorAll('.dynamic-row-entry').length + 1; const nuevoAusentismoHtml = crearHtmlAusentismo(ausentismoIdCounter, displayIndex); const tempDiv = document.createElement('div'); tempDiv.innerHTML = nuevoAusentismoHtml; const nuevaFilaElement = tempDiv.firstElementChild; if (nuevaFilaElement) { ausentismoContainer.appendChild(nuevaFilaElement); ausentismoIdCounter++; } }
    function crearHtmlHoraExtra(idCounter, displayIndex) { return `<div class="dynamic-row-entry" id="hora_extra_entry_${idCounter}"><h3 class="dynamic-row-title">Reporte Horas Extra ${displayIndex}</h3><div class="horas-extra-fields"><div class="form-group"><label for="numero_horas_${idCounter}">Número de horas:</label><input type="number" id="numero_horas_${idCounter}" name="horas_extra[${idCounter}][numero_horas]" min="0" placeholder="Ej: 2" oninput="calcularHorasTotales(${idCounter})"></div><div class="form-group"><label for="cantidad_personal_he_${idCounter}">Cantidad de personal:</label><input type="number" id="cantidad_personal_he_${idCounter}" name="horas_extra[${idCounter}][cantidad_personal]" min="1" placeholder="Ej: 5" oninput="calcularHorasTotales(${idCounter})"></div><div class="form-group"><label for="subarea_${idCounter}">Sub-Área:</label><select id="subarea_${idCounter}" name="horas_extra[${idCounter}][subarea]" class="subarea-select"><option value="">Seleccione</option></select></div><div class="form-group"><label for="motivo_he_${idCounter}">Motivo:</label><select id="motivo_he_${idCounter}" name="horas_extra[${idCounter}][motivo]"><option value="">Seleccione</option><option value="Produccion">Produccion</option><option value="Inventario">Inventario</option><option value="Limpieza">Limpieza</option><option value="Otros">Otros</option></select></div><div class="form-group"><label for="horas_totales_${idCounter}">Horas Totales:</label><input type="text" id="horas_totales_${idCounter}" name="horas_extra[${idCounter}][horas_totales]" disabled></div></div><button type="button" class="btn-remove-row" onclick="eliminarFila('hora_extra_entry_${idCounter}', 'horas-extra-container', 'Reporte Horas Extra')">Eliminar Reporte ${displayIndex}</button><hr class="dynamic-row-divider"></div>`; }
    function anadirNuevaFilaHoraExtra() { if (!horasExtraContainer) return; const displayIndex = horasExtraContainer.querySelectorAll('.dynamic-row-entry').length + 1; const nuevoReporteHtml = crearHtmlHoraExtra(horaExtraIdCounter, displayIndex); const tempDiv = document.createElement('div'); tempDiv.innerHTML = nuevoReporteHtml; const nuevaFilaElement = tempDiv.firstElementChild; if (nuevaFilaElement) { horasExtraContainer.appendChild(nuevaFilaElement); actualizarSubAreasEnFilas(); horaExtraIdCounter++; } }
    function crearHtmlGestion(idCounter, displayIndex) { return `<div class="dynamic-row-entry" id="gestion_entry_${idCounter}"><h3 class="dynamic-row-title">Gestión de Mejora ${displayIndex}</h3><div class="form-group"><label for="gestion_descripcion_${idCounter}">Descripción de la Gestión:</label><textarea id="gestion_descripcion_${idCounter}" name="gestiones_mejora[${idCounter}][descripcion]" rows="2" placeholder="Describa la acción o gestión de mejora..."></textarea></div><button type="button" class="btn-remove-row" onclick="eliminarFila('gestion_entry_${idCounter}', 'gestiones-mejora-container', 'Gestión de Mejora')">Eliminar Gestión ${displayIndex}</button><hr class="dynamic-row-divider"></div>`; }
    function anadirNuevaFilaGestion() { if (!gestionesMejoraContainer) return; const displayIndex = gestionesMejoraContainer.querySelectorAll('.dynamic-row-entry').length + 1; const nuevoGestionHtml = crearHtmlGestion(gestionIdCounter, displayIndex); const tempDiv = document.createElement('div'); tempDiv.innerHTML = nuevoGestionHtml; const nuevaFilaElement = tempDiv.firstElementChild; if (nuevaFilaElement) { gestionesMejoraContainer.appendChild(nuevaFilaElement); gestionIdCounter++; } }
    function actualizarSubAreasEnFilas() { const selectedArea = areaSelect.value; const subAreas = APP_CONFIG.subAreaMappings[selectedArea] || []; document.querySelectorAll('#horas-extra-container .subarea-select').forEach(select => { const valorActual = select.value; while (select.options.length > 1) { select.remove(1); } subAreas.forEach(sub => { select.add(new Option(sub, sub)); }); if (subAreas.includes(valorActual)) { select.value = valorActual; } }); }
    window.eliminarFila = function(filaId, containerId, baseTitlePrefix) { const filaParaEliminar = document.getElementById(filaId); const container = document.getElementById(containerId); if (filaParaEliminar && container) { filaParaEliminar.remove(); container.querySelectorAll('.dynamic-row-entry').forEach((row, idx) => { const newIdx = idx + 1; row.querySelector('.dynamic-row-title').textContent = `${baseTitlePrefix} ${newIdx}`; const btn = row.querySelector('.btn-remove-row'); if (btn) { const icon = btn.querySelector('.trash-icon-placeholder')?.outerHTML || ''; btn.innerHTML = `${icon}Eliminar ${baseTitlePrefix} ${newIdx}`; } }); } }
    window.calcularHorasTotales = function(id) { const h = document.getElementById(`numero_horas_${id}`); const p = document.getElementById(`cantidad_personal_he_${id}`); const t = document.getElementById(`horas_totales_${id}`); if(h&&p&&t) t.value = (parseFloat(h.value)||0) * (parseFloat(p.value)||0); }

    // --- RECOLECCIÓN Y ENVÍO DEL FORMULARIO ---
    function recolectarDatosDelFormulario() {
        const formData = new FormData(form);
        const datos = {};
        datos.esLunes = (fechaInput && fechaInput.value) ? (new Date(fechaInput.value).getDay() === 1) : (new Date().getDay() === 1);
        datos.fecha = (fechaInput && fechaInput.value) ? new Date(fechaInput.value).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : new Date().toLocaleString('es-CL');
        datos.nombreAreaHoja = areaSelect.value;
        datos.area = areaSelect.options[areaSelect.selectedIndex].text;
        datos.porcentajeCumplimiento = cumplimientoHiddenInput ? (cumplimientoHiddenInput.value + '%') : "";
        datos.emailDestinatario = APP_CONFIG.emailMap[datos.nombreAreaHoja] || '';
        datos.mensajePredefinido = APP_CONFIG.mensajesPredefinidosPorArea[datos.nombreAreaHoja] || '';
        if (conditionalElements.fibraScrap.style.display !== 'none') { datos.ingresoScrapFibra = formData.get('ingreso_scrap_fibra'); }
        if (conditionalElements.espumaScrap.style.display !== 'none') { datos.salidaScrapEspuma = formData.get('salida_scrap_espuma'); }
        if (conditionalElements.colchonesProd.style.display !== 'none') { datos.colchonesProd = { planDia: formData.get('colchones_prod[plan_dia]'), producido: formData.get('colchones_prod[producido]'), porVulcanizar: formData.get('colchones_prod[por_vulcanizar]'), porCerrar: formData.get('colchones_prod[por_cerrar]') }; }
        if (conditionalElements.datosRelevante.style.display !== 'none') { datos.datosRelevanteColchones = { personalCerrado: formData.get('datos_relevante[colchones][personal_cerrado]'), colchonesReparados: formData.get('datos_relevante[colchones][reparados]'), esperaReparacion: formData.get('datos_relevante[colchones][espera]') };}
        datos.sucesos = [];
        sucesosContainer.querySelectorAll('.dynamic-row-entry').forEach(entry => { 
            const id = entry.id.split('_').pop(); 
            const area = areaSelect.value;
            const tipoIncidente = formData.get(`sucesos[${id}][tipo_incidente]`);
            if (area === 'metalurgia' && tipoIncidente === 'Falla De Maquina') {
                const incidenteConstruido = `Problema con la maquina ${formData.get(`sucesos[${id}][tipo_maquina]`) || 'N/A'} de codigo ${formData.get(`sucesos[${id}][codigo_maquina]`) || 'N/A'} por falla ${formData.get(`sucesos[${id}][tipo_falla]`) || 'N/A'}`;
                datos.sucesos.push({
                    incidente: incidenteConstruido, tipoIncidente: 'Falla De Maquina', areaResponsable: 'Sin Responsable',
                    tiempoAfectacion: formData.get(`sucesos[${id}][tiempo_afectado]`),
                    unidades: formData.get(`sucesos[${id}][unidades_afectadas]`), impactoProduccion: '',
                    gestionTomada: formData.get(`sucesos[${id}][gestion_tomada_metalurgia]`),
                    estadoResuelto: form.querySelector(`#estado_resuelto_${id}`)?.checked ? 'Resuelto' : 'En Proceso'
                });
            } else {
                datos.sucesos.push({ 
                    incidente: formData.get(`sucesos[${id}][incidente]`), tipoIncidente: tipoIncidente, 
                    areaResponsable: formData.get(`sucesos[${id}][area_responsable]`), tiempoAfectacion: formData.get(`sucesos[${id}][tiempo_afectacion]`), 
                    unidades: formData.get(`sucesos[${id}][unidades]`), impactoProduccion: formData.get(`sucesos[${id}][impacto_produccion]`), 
                    gestionTomada: formData.get(`sucesos[${id}][gestion_tomada]`), estadoResuelto: form.querySelector(`#estado_resuelto_${id}`)?.checked ? 'Resuelto' : 'En Proceso' 
                });
            }
        });
        datos.porcentajeAusentismo = formData.get('porcentaje_ausentismo') ? formData.get('porcentaje_ausentismo') + '%' : '';
        datos.ausentismos = [];
        ausentismoContainer.querySelectorAll('.dynamic-row-entry').forEach(entry => { const id = entry.id.split('_').pop(); datos.ausentismos.push({ puestoTrabajo: formData.get(`ausentismos[${id}][puesto_trabajo]`), motivo: formData.get(`ausentismos[${id}][motivo]`), cantidadPersonal: formData.get(`ausentismos[${id}][cantidad_personal]`), gestion: formData.get(`ausentismos[${id}][gestion]`) }); });
        datos.horasExtra = [];
        if (horasExtraContainer) { horasExtraContainer.querySelectorAll('.dynamic-row-entry').forEach(entry => { const id = entry.id.split('_').pop(); datos.horasExtra.push({ numeroHoras: formData.get(`horas_extra[${id}][numero_horas]`), cantidadPersonal: formData.get(`horas_extra[${id}][cantidad_personal]`), subarea: formData.get(`horas_extra[${id}][subarea]`), motivo: formData.get(`horas_extra[${id}][motivo]`) }); }); }
        datos.gestionesMejora = [];
        if (gestionesMejoraContainer) { gestionesMejoraContainer.querySelectorAll('.dynamic-row-entry').forEach(entry => { const id = entry.id.split('_').pop(); const descripcion = formData.get(`gestiones_mejora[${id}][descripcion]`); if (descripcion) { datos.gestionesMejora.push({ descripcion: descripcion }); } }); }
        return datos;
    }

    // --- INICIALIZACIÓN Y EVENTOS PRINCIPALES ---
    if (areaSelect) { areaSelect.addEventListener('change', updateFormVisibility); }
    if (btnAnadirSuceso) { btnAnadirSuceso.addEventListener('click', anadirNuevaFilaSuceso); }
    if (btnAnadirAusentismo) { btnAnadirAusentismo.addEventListener('click', anadirNuevaFilaAusentismo); }
    if (btnAnadirHoraExtra) { btnAnadirHoraExtra.addEventListener('click', anadirNuevaFilaHoraExtra); }
    if (btnAnadirGestion) { btnAnadirGestion.addEventListener('click', anadirNuevaFilaGestion); }
    if (btnResetLocalStorage) { btnResetLocalStorage.addEventListener('click', () => { if (confirm('¿Estás seguro de que deseas borrar todos los datos guardados?')) { localStorage.removeItem(LOCAL_STORAGE_KEY); window.location.reload(); } }); }
    if (cumplimientoSlider) { cumplimientoSlider.addEventListener('input', function() { cumplimientoValorDisplay.textContent = this.value; cumplimientoHiddenInput.value = this.value; if (parseInt(this.value, 10) > 100) { this.classList.add('slider-over-100'); cumplimientoValorDisplay.classList.add('text-over-100'); } else { this.classList.remove('slider-over-100'); cumplimientoValorDisplay.classList.remove('text-over-100'); } }); }

    form.addEventListener('input', guardarDatosEnLocalStorage);
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        if (!areaSelect || !areaSelect.value) { alert("Por favor, seleccione un Área."); return; }
        const datosFormulario = recolectarDatosDelFormulario();
        if (datosFormulario) {
            submitButton.disabled = true; submitButton.textContent = 'Enviando...';
            const googleScriptURL = 'https://script.google.com/a/macros/rosen.cl/s/AKfycbw_pb4_2pnl3GA-qatdO8QnimKHf9cK-LrRCet2BwI_rUwjpT1o17U-RAP6dCgUuI1b/exec';
            fetch(googleScriptURL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(datosFormulario) })
                .then(() => {
                    formContainer.style.display = 'none'; successMessageContainer.style.display = 'block';
                    if (btnResetLocalStorage) btnResetLocalStorage.style.display = 'none';
                    localStorage.removeItem(LOCAL_STORAGE_KEY);
                })
                .catch(err => console.error('Error en fetch:', err))
                .finally(() => { submitButton.disabled = false; submitButton.textContent = 'Enviar Reporte Diario'; });
        }
    });

    cargarDatosDesdeLocalStorage();
});