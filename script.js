document.addEventListener('DOMContentLoaded', () => {
    if (typeof APP_CONFIG === 'undefined') {
        console.error("¡ERROR CRÍTICO! El archivo configuracion.js no se ha cargado o APP_CONFIG no está definido.");
        alert("Falta el archivo de configuración. La aplicación no puede funcionar.");
        return;
    }

    console.log("DOM completamente cargado. Iniciando script.js...");

    // --- ELEMENTOS DEL DOM ---
    const formContainer = document.getElementById('form-container');
    const successMessageContainer = document.getElementById('success-message');
    const form = document.getElementById('reunionForm');
    const btnResetLocalStorage = document.getElementById('btnResetLocalStorage');
    const fechaInput = document.getElementById('fecha');
    const areaSelect = document.getElementById('area');
    const submitButton = document.getElementById('btnSubmitReport');
    const cumplimientoSlider = document.getElementById('cumplimiento_slider');
    const cumplimientoValorDisplay = document.getElementById('cumplimiento_valor_display');
    const cumplimientoHiddenInput = document.getElementById('cumplimiento');
    const sucesosContainer = document.getElementById('sucesos-container');
    const btnAnadirSuceso = document.getElementById('btnAnadirSuceso');
    const ausentismoContainer = document.getElementById('ausentismo-container');
    const btnAnadirAusentismo = document.getElementById('btnAnadirAusentismo');
    const horasExtraContainer = document.getElementById('horas-extra-container');
    const btnAnadirHoraExtra = document.getElementById('btnAnadirHoraExtra');
    const observacionesTextarea = document.getElementById('observaciones_otros');

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
        observaciones: document.getElementById('section-observaciones'),
        fibraScrap: document.getElementById('section-fibra-scrap'),
        espumaScrap: document.getElementById('section-espuma-scrap')
    };
    
    // --- LÓGICA PARA GUARDAR Y CARGAR DATOS ---
    const LOCAL_STORAGE_KEY = 'reunionFormData';

    function guardarDatosEnLocalStorage() {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            if (!cb.checked) {
                if (!data[cb.name]) { data[cb.name] = 'false'; }
            }
        });
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    }

    // --- (FUNCIÓN CORREGIDA) ---
    function cargarDatosDesdeLocalStorage() {
        const guardado = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!guardado) {
            console.log("No hay datos guardados en localStorage.");
            return;
        }

        const data = JSON.parse(guardado);
        console.log("Cargando datos desde localStorage...");

        const structuredData = {
            static: {},
            sucesos: [],
            ausentismos: [],
            horas_extra: []
        };

        for (const key in data) {
            const sucesosMatch = key.match(/sucesos\[(\d+)\]\[(\w+)\]/);
            const ausentismosMatch = key.match(/ausentismos\[(\d+)\]\[(\w+)\]/);
            const horasExtraMatch = key.match(/horas_extra\[(\d+)\]\[(\w+)\]/);

            if (sucesosMatch) {
                const index = parseInt(sucesosMatch[1], 10);
                const prop = sucesosMatch[2];
                if (!structuredData.sucesos[index]) structuredData.sucesos[index] = {};
                structuredData.sucesos[index][prop] = data[key];
            } else if (ausentismosMatch) {
                const index = parseInt(ausentismosMatch[1], 10);
                const prop = ausentismosMatch[2];
                if (!structuredData.ausentismos[index]) structuredData.ausentismos[index] = {};
                structuredData.ausentismos[index][prop] = data[key];
            } else if (horasExtraMatch) {
                const index = parseInt(horasExtraMatch[1], 10);
                const prop = horasExtraMatch[2];
                if (!structuredData.horas_extra[index]) structuredData.horas_extra[index] = {};
                structuredData.horas_extra[index][prop] = data[key];
            } else {
                structuredData.static[key] = data[key];
            }
        }
        
        for (const key in structuredData.static) {
            const element = form.elements[key];
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = structuredData.static[key] === 'true';
                } else if (element.type === 'range') {
                    element.value = structuredData.static[key];
                    element.dispatchEvent(new Event('input'));
                } else {
                    element.value = structuredData.static[key];
                }
            }
        }
        
        // --- INICIO DE LA MODIFICACIÓN ---
        // Forzar la actualización de la fecha y hora al valor actual,
        // sobrescribiendo el valor cargado desde localStorage.
        if (fechaInput) {
            const now = new Date();
            const nowParaInput = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
            fechaInput.value = nowParaInput.toISOString().slice(0, 16);
            // Llamamos a la función para que los textos (ej. "Plan Semanal") se actualicen
            manejarCambioDeFecha(); 
        }
        // --- FIN DE LA MODIFICACIÓN ---

        // CORRECCIÓN: Se captura el contador ANTES de que la función `anadir...` lo incremente.
        structuredData.sucesos.forEach(sucesoData => {
            if (sucesoData) {
                const counter = sucesoIdCounter; 
                anadirYPopularFila(anadirNuevaFilaSuceso, counter, 'sucesos', sucesoData);
            }
        });

        structuredData.ausentismos.forEach(ausentismoData => {
            if (ausentismoData) {
                const counter = ausentismoIdCounter;
                anadirYPopularFila(anadirNuevaFilaAusentismo, counter, 'ausentismos', ausentismoData);
            }
        });

        structuredData.horas_extra.forEach(horaExtraData => { 
            if (horaExtraData) {
                const counter = horaExtraIdCounter;
                anadirYPopularFila(anadirNuevaFilaHoraExtra, counter, 'horas_extra', horaExtraData);
                calcularHorasTotales(counter);
            }
        });

        if (data['area']) areaSelect.dispatchEvent(new Event('change'));
        inicializarCalculosAutomaticos();
    }
    
    function anadirYPopularFila(funcionAnadir, contador, prefijo, datos) {
        funcionAnadir();
        for (const prop in datos) {
            const elemName = `${prefijo}[${contador}][${prop}]`;
            const elem = form.elements[elemName];
            if(elem) {
                if (elem.type === 'checkbox') {
                    elem.checked = datos[prop] === 'true';
                } else {
                    elem.value = datos[prop];
                }
            }
        }
    }

    function calcularYActualizarDiferencia(planInput, prodInput, label, output, baseName) {
        if (!planInput || !prodInput || !label || !output) return;
        const plan = parseFloat(planInput.value) || 0;
        const prod = parseFloat(prodInput.value) || 0;
        const diferencia = plan - prod;
        if (diferencia > 0) {
            label.textContent = `${baseName} Pendiente`;
            output.value = diferencia;
        } else if (diferencia < 0) {
            label.textContent = `${baseName} Avanzado`;
            output.value = Math.abs(diferencia);
        } else {
            label.textContent = `${baseName} Pendiente`;
            output.value = 0;
        }
    }

    const calculosAutomaticos = [
        { plan: 'plan_dia_accesorio_gen', prod: 'producido_accesorio_gen', label: 'label-accgen-diferencia', output: 'diferencia_accesorio_gen', baseName: 'Accesorios' },
        { plan: 'plan_dia_plumones', prod: 'producido_plumones', label: 'label-accplum-diferencia', output: 'diferencia_plumones', baseName: 'Plumones' },
        { plan: 'plan_dia_almohadas', prod: 'producido_almohadas', label: 'label-accalm-diferencia', output: 'diferencia_almohadas', baseName: 'Almohadas' },
        { plan: 'bases_plan_total', prod: 'bases_producido', label: 'label-bases-diferencia', output: 'diferencia_bases', baseName: 'Bases' },
        { plan: 'muebles_sofas_plan', prod: 'muebles_sofas_producido', label: 'label-muebsofa-diferencia', output: 'diferencia_sofas', baseName: 'Sofás' },
        { plan: 'muebles_reclinables_plan', prod: 'muebles_reclinables_producido', label: 'label-muebrecl-diferencia', output: 'diferencia_reclinables', baseName: 'Reclinables' },
        { plan: 'muebles_respaldos_plan', prod: 'muebles_respaldos_producido', label: 'label-muebresp-diferencia', output: 'diferencia_respaldos', baseName: 'Respaldos' }
    ];

    function inicializarCalculosAutomaticos() {
        calculosAutomaticos.forEach(calc => {
            const planInput = document.getElementById(calc.plan);
            const prodInput = document.getElementById(calc.prod);
            const label = document.getElementById(calc.label);
            const output = document.getElementById(calc.output);
            if (planInput && prodInput && label && output) {
                const updateFn = () => calcularYActualizarDiferencia(planInput, prodInput, label, output, calc.baseName);
                planInput.addEventListener('input', updateFn);
                prodInput.addEventListener('input', updateFn);
                updateFn(); 
            }
        });
    }

    function actualizarTextosSegunDia(dateObj) {
        if (!dateObj || typeof dateObj.getDay !== 'function') return;
        const esLunes = dateObj.getDay() === 1;
        for (const id in APP_CONFIG.textMappings) {
            const element = document.getElementById(id);
            if (element) {
                const textoCompleto = esLunes ? APP_CONFIG.textMappings[id][1] : APP_CONFIG.textMappings[id][0];
                if (id === "label-cumplimiento" && cumplimientoValorDisplay) {
                    const valorActual = cumplimientoSlider ? cumplimientoSlider.value : '0';
                    const nodoTexto = Array.from(element.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                    if (nodoTexto) { nodoTexto.nodeValue = textoCompleto + " "; }
                    else { element.innerHTML = `${textoCompleto} <span id="cumplimiento_valor_display">${valorActual}</span>%`; }
                } else { element.textContent = textoCompleto; }
            }
        }
    }

    function manejarCambioDeFecha() {
        let fechaSeleccionadaObj = fechaInput && fechaInput.value ? new Date(fechaInput.value) : new Date();
        if (isNaN(fechaSeleccionadaObj.getTime())) fechaSeleccionadaObj = new Date();
        actualizarTextosSegunDia(fechaSeleccionadaObj);
    }

    function updateFormVisibility() {
        const selectedArea = areaSelect.value;
        const config = APP_CONFIG.configuracionDeVisibilidad[selectedArea];
        for (const key in conditionalElements) {
            if (conditionalElements[key]) conditionalElements[key].style.display = 'none';
        }
        submitButton.style.display = 'none';
        if (!selectedArea || !config) return;
        submitButton.style.display = 'block';
        if (conditionalElements.observaciones) { conditionalElements.observaciones.style.display = 'block'; }
        for (const sectionKey in config) {
            if (config[sectionKey] && conditionalElements[sectionKey]) {
                conditionalElements[sectionKey].style.display = 'block';
            }
        }
        actualizarSubAreasEnFilas();
        actualizarLabelsDeSucesos(); // <--- Llamada a la nueva función de actualización
    }

    function autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        const maxHeight = 200;
        if (textarea.scrollHeight > maxHeight) {
            textarea.style.height = maxHeight + 'px';
            textarea.style.overflowY = 'auto';
        } else {
            textarea.style.overflowY = 'hidden';
        }
    }

    function setupAutoResizeForTextarea(textareaElement) {
        if (textareaElement) {
            if (textareaElement.closest('.dynamic-row-entry') && textareaElement.id !== 'observaciones_otros') {
                textareaElement.setAttribute('rows', '1');
            }
            textareaElement.addEventListener('input', function() { autoResizeTextarea(this); });
        }
    }

    function inicializarFilaDinamica(filaElement) {
        if (!filaElement) return;
        filaElement.querySelectorAll('textarea').forEach(textarea => {
            setupAutoResizeForTextarea(textarea);
            setTimeout(() => autoResizeTextarea(textarea), 0);
        });
    }

    let sucesoIdCounter = 0;
    let ausentismoIdCounter = 0;
    let horaExtraIdCounter = 0;

    window.calcularHorasTotales = function(idCounter) {
        const horasInput = document.getElementById(`numero_horas_${idCounter}`);
        const personalInput = document.getElementById(`cantidad_personal_he_${idCounter}`);
        const totalOutput = document.getElementById(`horas_totales_${idCounter}`);
        if (horasInput && personalInput && totalOutput) {
            const horas = parseFloat(horasInput.value) || 0;
            const personal = parseFloat(personalInput.value) || 0;
            totalOutput.value = horas * personal;
        }
    }

    // NUEVA FUNCIÓN AÑADIDA
    function actualizarLabelsDeSucesos() {
        if (!sucesosContainer) return;
        const area = areaSelect.value;
        let unidadesLabelText = 'Unidades (afectadas/perdidas):';
        if (area === 'espuma') {
            unidadesLabelText = 'Metros Cúbicos (m³):';
        } else if (area === 'fibra') {
            unidadesLabelText = 'Kilogramos (Kg):';
        }

        sucesosContainer.querySelectorAll('.dynamic-row-entry').forEach(entry => {
            const id = entry.id.split('_').pop();
            const labelElement = entry.querySelector(`label[for="unidades_${id}"]`);
            if (labelElement) {
                labelElement.textContent = unidadesLabelText;
            }
        });
    }

    function crearHtmlSuceso(idCounter, displayIndex) {
        const opcionesTipoIncidente = APP_CONFIG.tipoIncidenteOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('');
        const opcionesAreaResponsable = APP_CONFIG.areaResponsableOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('');

        // Determinar la etiqueta correcta para las unidades según el área seleccionada
        const areaSeleccionada = areaSelect.value;
        let unidadesLabelText = 'Unidades (afectadas/perdidas):';
        if (areaSeleccionada === 'espuma') {
            unidadesLabelText = 'Metros Cúbicos (m³):';
        } else if (areaSeleccionada === 'fibra') {
            unidadesLabelText = 'Kilogramos (Kg):';
        }

        return `<div class="dynamic-row-entry" id="suceso_entry_${idCounter}"><h3 class="dynamic-row-title">Suceso ${displayIndex}</h3><div class="form-group"><label for="incidente_${idCounter}">Incidente:</label><input type="text" id="incidente_${idCounter}" name="sucesos[${idCounter}][incidente]" placeholder="Descripción del incidente"></div><div class="form-group"><label for="tipo_incidente_${idCounter}">Tipo de incidente:</label><select id="tipo_incidente_${idCounter}" name="sucesos[${idCounter}][tipo_incidente]"><option value="">Seleccione</option>${opcionesTipoIncidente}</select></div><div class="form-group"><label for="area_responsable_${idCounter}">Área Responsable:</label><select id="area_responsable_${idCounter}" name="sucesos[${idCounter}][area_responsable]"><option value="">Seleccione</option>${opcionesAreaResponsable}</select></div><div class="form-group"><label for="tiempo_afectacion_${idCounter}">Tiempo de afectación (Min):</label><input type="number" id="tiempo_afectacion_${idCounter}" name="sucesos[${idCounter}][tiempo_afectacion]" min="0" placeholder="Ej: 60"></div><div class="form-group"><label for="unidades_${idCounter}">${unidadesLabelText}</label><input type="number" id="unidades_${idCounter}" name="sucesos[${idCounter}][unidades]" min="0" placeholder="Ej: 10"></div><div class="form-group"><label for="impacto_produccion_${idCounter}">Impacto en producción:</label><textarea id="impacto_produccion_${idCounter}" name="sucesos[${idCounter}][impacto_produccion]" rows="1" placeholder="Describa el impacto"></textarea></div><div class="form-group"><label for="gestion_tomada_${idCounter}">Gestión tomada:</label><textarea id="gestion_tomada_${idCounter}" name="sucesos[${idCounter}][gestion_tomada]" rows="1" placeholder="Describa la gestión"></textarea></div><div class="form-group checkbox-group"><input type="checkbox" id="estado_resuelto_${idCounter}" name="sucesos[${idCounter}][estado_resuelto]" value="true"><label for="estado_resuelto_${idCounter}" class="checkbox-label">Resuelto</label></div><button type="button" class="btn-remove-row" onclick="eliminarFila('suceso_entry_${idCounter}', 'sucesos-container', 'Suceso')">Eliminar Suceso ${displayIndex}</button><hr class="dynamic-row-divider"></div>`;
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
            inicializarFilaDinamica(nuevaFilaElement);
            sucesoIdCounter++;
        }
    }

    function crearHtmlAusentismo(idCounter, displayIndex) {
        return `<div class="dynamic-row-entry" id="ausentismo_entry_${idCounter}"><h3 class="dynamic-row-title">Reporte Ausentismo ${displayIndex}</h3><div class="form-group"><label for="puesto_trabajo_${idCounter}">Puesto De Trabajo:</label><input type="text" id="puesto_trabajo_${idCounter}" name="ausentismos[${idCounter}][puesto_trabajo]" placeholder="Ej: Operador de máquina X"></div><div class="form-group"><label for="Motivo Ausentismo_${idCounter}">Motivo:</label><select id="motivo_ausentismo_${idCounter}" name="ausentismos[${idCounter}][motivo]"><option value="">Seleccione</option><option value="Licencia Medica">Licencia Médica</option><option value="Permiso Otorgado">Permiso Otorgado</option><option value="Ausencia Sin Justificar">Ausencia Sin Justifica</option><option value="Por Cumpleaños">Por Cumpleaños</option><option value="Información Por Ratificar">Información Por Ratificar</option><option value="Otro motivo">Otro Motivo</option></select></div><div class="form-group"><label for="cantidad_personal_${idCounter}">Cantidad De Personal:</label><input type="number" id="cantidad_personal_${idCounter}" name="ausentismos[${idCounter}][cantidad_personal]" min="1" value="1" placeholder="Ej: 1"></div><div class="form-group"><label for="gestion_ausentismo_${idCounter}">Gestión:</label><textarea id="gestion_ausentismo_${idCounter}" name="ausentismos[${idCounter}][gestion]" rows="1" placeholder="Describa la gestión realizada"></textarea></div><button type="button" class="btn-remove-row icon-button" onclick="eliminarFila('ausentismo_entry_${idCounter}', 'ausentismo-container', 'Reporte Ausentismo')"><span class="trash-icon-placeholder">&#128465;</span> Eliminar Reporte ${displayIndex}</button><hr class="dynamic-row-divider"></div>`;
    }

    function anadirNuevaFilaAusentismo() {
        if (!ausentismoContainer) return;
        const displayIndex = ausentismoContainer.querySelectorAll('.dynamic-row-entry').length + 1;
        const nuevoAusentismoHtml = crearHtmlAusentismo(ausentismoIdCounter, displayIndex);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = nuevoAusentismoHtml;
        const nuevaFilaElement = tempDiv.firstElementChild;
        if (nuevaFilaElement) {
            ausentismoContainer.appendChild(nuevaFilaElement);
            inicializarFilaDinamica(nuevaFilaElement);
            ausentismoIdCounter++;
        }
    }

    function crearHtmlHoraExtra(idCounter, displayIndex) {
        return `<div class="dynamic-row-entry" id="hora_extra_entry_${idCounter}">
                  <h3 class="dynamic-row-title">Reporte Horas Extra ${displayIndex}</h3>
                  <div class="horas-extra-fields">
                    <div class="form-group">
                      <label for="numero_horas_${idCounter}">Número de horas:</label>
                      <input type="number" id="numero_horas_${idCounter}" name="horas_extra[${idCounter}][numero_horas]" min="0" placeholder="Ej: 2" oninput="calcularHorasTotales(${idCounter})">
                    </div>
                    <div class="form-group">
                      <label for="cantidad_personal_he_${idCounter}">Cantidad de personal:</label>
                      <input type="number" id="cantidad_personal_he_${idCounter}" name="horas_extra[${idCounter}][cantidad_personal]" min="1" placeholder="Ej: 5" oninput="calcularHorasTotales(${idCounter})">
                    </div>
                    <div class="form-group">
                        <label for="subarea_${idCounter}">Sub-Área:</label>
                        <select id="subarea_${idCounter}" name="horas_extra[${idCounter}][subarea]" class="subarea-select"><option value="">Seleccione</option></select>
                    </div>
                    <div class="form-group">
                        <label for="motivo_he_${idCounter}">Motivo:</label>
                        <select id="motivo_he_${idCounter}" name="horas_extra[${idCounter}][motivo]"><option value="">Seleccione</option><option value="Produccion">Produccion</option><option value="Inventario">Inventario</option><option value="Limpieza">Limpieza</option><option value="Otros">Otros</option></select>
                    </div>
                    <div class="form-group">
                        <label for="horas_totales_${idCounter}">Horas Totales:</label>
                        <input type="text" id="horas_totales_${idCounter}" name="horas_extra[${idCounter}][horas_totales]" disabled>
                    </div>
                  </div>
                  <button type="button" class="btn-remove-row" onclick="eliminarFila('hora_extra_entry_${idCounter}', 'horas-extra-container', 'Reporte Horas Extra')">Eliminar Reporte ${displayIndex}</button>
                  <hr class="dynamic-row-divider">
                </div>`;
    }

    function anadirNuevaFilaHoraExtra() {
        if (!horasExtraContainer) return;
        const displayIndex = horasExtraContainer.querySelectorAll('.dynamic-row-entry').length + 1;
        const nuevoReporteHtml = crearHtmlHoraExtra(horaExtraIdCounter, displayIndex);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = nuevoReporteHtml;
        const nuevaFilaElement = tempDiv.firstElementChild;
        if (nuevaFilaElement) {
            horasExtraContainer.appendChild(nuevaFilaElement);
            const selectedArea = areaSelect.value;
            const subAreas = APP_CONFIG.subAreaMappings[selectedArea] || [];
            const newSelect = nuevaFilaElement.querySelector('.subarea-select');
            if (newSelect) {
                subAreas.forEach(sub => {
                    newSelect.add(new Option(sub, sub));
                });
            }
            horaExtraIdCounter++;
        }
    }

    function actualizarSubAreasEnFilas() {
        const selectedArea = areaSelect.value;
        const subAreas = APP_CONFIG.subAreaMappings[selectedArea] || [];
        const todosLosSelects = document.querySelectorAll('#horas-extra-container .subarea-select');
        todosLosSelects.forEach(select => {
            const valorActual = select.value;
            while (select.options.length > 1) { select.remove(1); }
            subAreas.forEach(sub => { select.add(new Option(sub, sub)); });
            if (subAreas.includes(valorActual)) { select.value = valorActual; }
        });
    }

    window.eliminarFila = function(filaId, containerId, baseTitlePrefix) {
        const filaParaEliminar = document.getElementById(filaId);
        const container = document.getElementById(containerId);
        if (filaParaEliminar && container) {
            filaParaEliminar.remove();
            const remainingRows = container.querySelectorAll('.dynamic-row-entry');
            remainingRows.forEach((row, newZeroBasedIndex) => {
                const currentDisplayIndex = newZeroBasedIndex + 1;
                const titleElement = row.querySelector('.dynamic-row-title');
                const deleteButton = row.querySelector('.btn-remove-row');
                if (titleElement) titleElement.textContent = `${baseTitlePrefix} ${currentDisplayIndex}`;
                if (deleteButton) {
                    let iconHtml = deleteButton.querySelector('.trash-icon-placeholder')?.outerHTML || '';
                    deleteButton.innerHTML = `${iconHtml}Eliminar ${baseTitlePrefix} ${currentDisplayIndex}`;
                }
            });
        }
    }
    
    function recolectarDatosDelFormulario() {
        const formData = new FormData(form);
        const datos = {};
        const esLunes = (fechaInput && fechaInput.value) ? (new Date(fechaInput.value).getDay() === 1) : (new Date().getDay() === 1);
        
        datos.fecha = (fechaInput && fechaInput.value) ? new Date(fechaInput.value).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : new Date().toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
        datos.nombreAreaHoja = areaSelect ? areaSelect.value : "SinArea";
        datos.area = areaSelect ? areaSelect.options[areaSelect.selectedIndex].text : "SinArea";
        datos.porcentajeCumplimiento = cumplimientoHiddenInput ? (cumplimientoHiddenInput.value + '%') : "";
        datos.emailDestinatario = APP_CONFIG.emailMap[datos.nombreAreaHoja] || '';
        datos.mensajePredefinido = APP_CONFIG.mensajesPredefinidosPorArea[datos.nombreAreaHoja] || '';
        
        const getDiferenciaData = (planName, prodName, labelId) => {
            const plan = parseFloat(formData.get(planName)) || 0;
            const prod = parseFloat(formData.get(prodName)) || 0;
            const labelElem = document.getElementById(labelId);
            const tipo = labelElem ? (labelElem.textContent.includes('Avanzado') ? 'Avanzado' : 'Pendiente') : 'Pendiente';
            const valor = Math.abs(plan - prod);
            const valorFirmado = tipo === 'Avanzado' ? -valor : valor;
            return { tipo, valor, valorFirmado };
        };

        if (conditionalElements.accesoriosPlan.style.display !== 'none') {
            datos.accesoriosPlan = {
                general: { plan_dia: formData.get('accesorios_plan[general][plan_dia]'), producido: formData.get('accesorios_plan[general][producido]'), diferencia: getDiferenciaData('accesorios_plan[general][plan_dia]', 'accesorios_plan[general][producido]', 'label-accgen-diferencia') },
                plumones: { plan_dia: formData.get('accesorios_plan[plumones][plan_dia]'), producido: formData.get('accesorios_plan[plumones][producido]'), diferencia: getDiferenciaData('accesorios_plan[plumones][plan_dia]', 'accesorios_plan[plumones][producido]', 'label-accplum-diferencia') },
                almohadas: { plan_dia: formData.get('accesorios_plan[almohadas][plan_dia]'), producido: formData.get('accesorios_plan[almohadas][producido]'), diferencia: getDiferenciaData('accesorios_plan[almohadas][plan_dia]', 'accesorios_plan[almohadas][producido]', 'label-accalm-diferencia') }
            };
        }
        if (conditionalElements.basesPlan.style.display !== 'none') {
            datos.basesPlan = {
                planTotal: formData.get('bases_plan[plan_total]'), producido: formData.get('bases_plan[producido]'), diferencia: getDiferenciaData('bases_plan[plan_total]', 'bases_plan[producido]', 'label-bases-diferencia')
            };
        }
        if (conditionalElements.mueblesPlan.style.display !== 'none') {
            datos.mueblesPlan = {
                sofas: { plan_dia: formData.get('muebles_plan[sofas][plan_dia]'), producido: formData.get('muebles_plan[sofas][producido]'), diferencia: getDiferenciaData('muebles_plan[sofas][plan_dia]', 'muebles_plan[sofas][producido]', 'label-muebsofa-diferencia') },
                reclinables: { plan_dia: formData.get('muebles_plan[reclinables][plan_dia]'), producido: formData.get('muebles_plan[reclinables][producido]'), diferencia: getDiferenciaData('muebles_plan[reclinables][plan_dia]', 'muebles_plan[reclinables][producido]', 'label-muebrecl-diferencia') },
                respaldosOtros: { plan_dia: formData.get('muebles_plan[respaldos_otros][plan_dia]'), producido: formData.get('muebles_plan[respaldos_otros][producido]'), diferencia: getDiferenciaData('muebles_plan[respaldos_otros][plan_dia]', 'muebles_plan[respaldos_otros][producido]', 'label-muebresp-diferencia') }
            };
        }

        if (conditionalElements.fibraScrap.style.display !== 'none') { datos.ingresoScrapFibra = formData.get('ingreso_scrap_fibra'); }
        if (conditionalElements.espumaScrap.style.display !== 'none') { datos.salidaScrapEspuma = formData.get('salida_scrap_espuma'); }
        if (conditionalElements.colchonesProd.style.display !== 'none') { datos.colchonesProd = { planDia: formData.get('colchones_prod[plan_dia]'), producido: formData.get('colchones_prod[producido]'), porVulcanizar: formData.get('colchones_prod[por_vulcanizar]'), porCerrar: formData.get('colchones_prod[por_cerrar]') }; }
        if (conditionalElements.datosRelevante.style.display !== 'none') { datos.datosRelevanteColchones = { personalCerrado: formData.get('datos_relevante[colchones][personal_cerrado]'), colchonesReparados: formData.get('datos_relevante[colchones][reparados]'), esperaReparacion: formData.get('datos_relevante[colchones][espera]') };}
        
        datos.sucesos = [];
        sucesosContainer.querySelectorAll('.dynamic-row-entry').forEach(entry => { const id = entry.id.split('_').pop(); datos.sucesos.push({ incidente: formData.get(`sucesos[${id}][incidente]`), tipoIncidente: formData.get(`sucesos[${id}][tipo_incidente]`), areaResponsable: formData.get(`sucesos[${id}][area_responsable]`), tiempoAfectacion: formData.get(`sucesos[${id}][tiempo_afectacion]`), unidades: formData.get(`sucesos[${id}][unidades]`), impactoProduccion: formData.get(`sucesos[${id}][impacto_produccion]`), gestionTomada: formData.get(`sucesos[${id}][gestion_tomada]`), estadoResuelto: form.querySelector(`#estado_resuelto_${id}`)?.checked ? 'Resuelto' : 'En Proceso' }); });
        datos.porcentajeAusentismo = formData.get('porcentaje_ausentismo') ? formData.get('porcentaje_ausentismo') + '%' : '';
        datos.ausentismos = [];
        ausentismoContainer.querySelectorAll('.dynamic-row-entry').forEach(entry => { const id = entry.id.split('_').pop(); datos.ausentismos.push({ puestoTrabajo: formData.get(`ausentismos[${id}][puesto_trabajo]`), motivo: formData.get(`ausentismos[${id}][motivo]`), cantidadPersonal: formData.get(`ausentismos[${id}][cantidad_personal]`), gestion: formData.get(`ausentismos[${id}][gestion]`) }); });
        datos.horasExtra = [];
        if (horasExtraContainer) { horasExtraContainer.querySelectorAll('.dynamic-row-entry').forEach(entry => { const id = entry.id.split('_').pop(); datos.horasExtra.push({ numeroHoras: formData.get(`horas_extra[${id}][numero_horas]`), cantidadPersonal: formData.get(`horas_extra[${id}][cantidad_personal]`), subarea: formData.get(`horas_extra[${id}][subarea]`), motivo: formData.get(`horas_extra[${id}][motivo]`) }); }); }
        datos.observaciones = formData.get('observaciones_otros');
        datos.esLunes = esLunes;
        return datos;
    }
    
    // --- INICIALIZACIONES Y EVENTOS ---
    inicializarCalculosAutomaticos();
    
    if (fechaInput) {
        if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
             const now = new Date();
             const nowParaInput = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
             fechaInput.value = nowParaInput.toISOString().slice(0, 16);
        }
        manejarCambioDeFecha();
        fechaInput.addEventListener('change', manejarCambioDeFecha);
    }
    if (cumplimientoSlider) {
        cumplimientoSlider.addEventListener('input', function() {
            // Actualiza los displays de valor como antes
            cumplimientoValorDisplay.textContent = this.value;
            cumplimientoHiddenInput.value = this.value;
    
            // --- INICIO DE LA LÓGICA DE COLOR ---
            // Revisa si el valor actual es mayor a 100
            if (parseInt(this.value, 10) > 100) {
                // Si es mayor, añade las clases para el color rojo
                this.classList.add('slider-over-100');
                cumplimientoValorDisplay.classList.add('text-over-100');
            } else {
                // Si no es mayor, asegúrate de quitar las clases para que vuelva al color normal
                this.classList.remove('slider-over-100');
                cumplimientoValorDisplay.classList.remove('text-over-100');
            }
            // --- FIN DE LA LÓGICA DE COLOR ---
        });
    }
    if (areaSelect) { areaSelect.addEventListener('change', updateFormVisibility); }
    if (btnAnadirSuceso) { btnAnadirSuceso.addEventListener('click', anadirNuevaFilaSuceso); }
    if (btnAnadirAusentismo) { btnAnadirAusentismo.addEventListener('click', anadirNuevaFilaAusentismo); }
    if (btnAnadirHoraExtra) { btnAnadirHoraExtra.addEventListener('click', anadirNuevaFilaHoraExtra); }
    if (observacionesTextarea) { setupAutoResizeForTextarea(observacionesTextarea); autoResizeTextarea(observacionesTextarea); }

    if (btnResetLocalStorage) {
        btnResetLocalStorage.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que deseas borrar todos los datos guardados en el formulario? Esta acción no se puede deshacer.')) {
                localStorage.removeItem(LOCAL_STORAGE_KEY);
                window.location.reload();
            }
        });
    }

    form.addEventListener('input', guardarDatosEnLocalStorage);
    cargarDatosDesdeLocalStorage();

    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            try {
                if (!areaSelect || !areaSelect.value) {
                    alert("Por favor, seleccione un Área antes de enviar el reporte."); return;
                }
                const datosFormulario = recolectarDatosDelFormulario();
                if (datosFormulario) {
                    submitButton.disabled = true;
                    submitButton.textContent = 'Enviando...';
                    const googleScriptURL = 'https://script.google.com/macros/s/AKfycbz8KMZ4GT5K0XlelWIEsKmzL7L8tkxdWMMKwB1lfj_54a2DXrEb6nfscIT894ED6KCB/exec';
                    fetch(googleScriptURL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(datosFormulario) })
                        .then(() => {
                            formContainer.style.display = 'none';
                            successMessageContainer.style.display = 'block';
                            if (btnResetLocalStorage) {
                                btnResetLocalStorage.style.display = 'none';
                            }
                            localStorage.removeItem(LOCAL_STORAGE_KEY);
                            console.log("Datos de localStorage eliminados tras envío exitoso.");
                        })
                        .catch(fetchError => {
                            console.error('Error durante la solicitud FETCH:', fetchError);
                            alert('Hubo un error de red al enviar el reporte. Revisa la consola para más detalles.');
                        })
                        .finally(() => {
                            submitButton.disabled = false;
                            submitButton.textContent = 'Enviar Reporte Diario';
                        });
                }
            } catch (syncError) {
                console.error('ERROR SÍNCRONO ANTES DE ENVIAR:', syncError);
                alert('Ocurrió un error al preparar los datos. Por favor, revisa la consola (F12) y busca el mensaje "ERROR SÍNCRONO ANTES DE ENVIAR" para ver el detalle exacto.');
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Enviar Reporte Diario';
                }
            }
        });
    }
});
