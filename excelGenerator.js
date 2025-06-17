const ExcelReportGenerator = {
    formElement: null,
    fechaInputElement: null,
    areaSelectElement: null,
    cumplimientoHiddenInputElement: null,
    sucesosContainerElement: null,
    ausentismoContainerElement: null,
    textMappingsData: {},
    conditionalElementsData: {},

    init: function(config) {
        console.log("ExcelReportGenerator: Inicializando...");
        this.formElement = config.form;
        this.fechaInputElement = config.fechaInput;
        this.areaSelectElement = config.areaSelect;
        this.cumplimientoHiddenInputElement = config.cumplimientoHiddenInput;
        this.sucesosContainerElement = config.sucesosContainer;
        this.ausentismoContainerElement = config.ausentismoContainer;
        this.textMappingsData = config.textMappings;
        this.conditionalElementsData = config.conditionalElements;

        if (!this.formElement) {
            console.error("ExcelReportGenerator: Elemento de formulario no proporcionado en la configuración.");
            return;
        }
        if (typeof XLSX === 'undefined') {
            console.error("ExcelReportGenerator: La librería XLSX (SheetJS) no está cargada.");
            return;
        }
    },

    getFormText: function(id, esLunes) {
        const mapping = this.textMappingsData[id];
        if (mapping) {
            return (esLunes ? mapping[1] : mapping[0]).replace(":", "");
        }
        const element = document.getElementById(id);
        if (element) {
            return (element.innerText || element.textContent).replace(":", "").trim();
        }
        return id;
    },

    // --- (MODIFICADO) FUNCIÓN DE RECOLECCIÓN DE DATOS DEL GENERADOR DE EXCEL ---
    recolectarDatosDelFormulario: function() {
        if (!this.formElement) return null;

        const formData = new FormData(this.formElement);
        const datos = {};
        const esLunes = (this.fechaInputElement && this.fechaInputElement.value) ?
            (new Date(this.fechaInputElement.value).getDay() === 1) :
            (new Date().getDay() === 1);

        datos.fecha = (this.fechaInputElement && this.fechaInputElement.value) ?
            new Date(this.fechaInputElement.value).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) :
            new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });

        datos.nombreAreaHoja = this.areaSelectElement ? this.areaSelectElement.value : "SinArea";
        datos.area = this.areaSelectElement ? this.areaSelectElement.options[this.areaSelectElement.selectedIndex].text : "SinArea";

        datos.porcentajeCumplimiento = this.cumplimientoHiddenInputElement ? (this.cumplimientoHiddenInputElement.value + '%') : "";

        // (NUEVO) Recolectar datos de scrap para el Excel
        if (this.conditionalElementsData.fibraScrap && this.conditionalElementsData.fibraScrap.style.display !== 'none') {
            datos.ingresoScrapFibra = formData.get('ingreso_scrap_fibra');
        }
        if (this.conditionalElementsData.espumaScrap && this.conditionalElementsData.espumaScrap.style.display !== 'none') {
            datos.salidaScrapEspuma = formData.get('salida_scrap_espuma');
        }

        if (this.conditionalElementsData.colchonesProd && this.conditionalElementsData.colchonesProd.style.display !== 'none') {
            datos.colchonesProd = { planDia: formData.get('colchones_prod[plan_dia]'), producido: formData.get('colchones_prod[producido]'), porVulcanizar: formData.get('colchones_prod[por_vulcanizar]'), porCerrar: formData.get('colchones_prod[por_cerrar]') };
        }
        if (this.conditionalElementsData.datosRelevante && this.conditionalElementsData.datosRelevante.style.display !== 'none') {
            datos.datosRelevanteColchones = { personalCerrado: formData.get('datos_relevante[colchones][personal_cerrado]'), colchonesReparados: formData.get('datos_relevante[colchones][reparados]'), esperaReparacion: formData.get('datos_relevante[colchones][espera]') };
        }
        if (this.conditionalElementsData.accesoriosPlan && this.conditionalElementsData.accesoriosPlan.style.display !== 'none') {
            datos.accesoriosPlan = { general: { plan_dia: formData.get('accesorios_plan[general][plan_dia]'), producido: formData.get('accesorios_plan[general][producido]'), pendiente: formData.get('accesorios_plan[general][pendiente]') }, plumones: { plan_dia: formData.get('accesorios_plan[plumones][plan_dia]'), producido: formData.get('accesorios_plan[plumones][producido]'), pendiente: formData.get('accesorios_plan[plumones][pendiente]') }, almohadas: { plan_dia: formData.get('accesorios_plan[almohadas][plan_dia]'), producido: formData.get('accesorios_plan[almohadas][producido]'), pendiente: formData.get('accesorios_plan[almohadas][pendiente]') } };
        }
        if (this.conditionalElementsData.basesPlan && this.conditionalElementsData.basesPlan.style.display !== 'none') {
            datos.basesPlan = { planTotal: formData.get('bases_plan[plan_total]'), producido: formData.get('bases_plan[producido]'), pendientes: formData.get('bases_plan[pendientes]') };
        }
        if (this.conditionalElementsData.mueblesPlan && this.conditionalElementsData.mueblesPlan.style.display !== 'none') {
            datos.mueblesPlan = { sofas: { plan_dia: formData.get('muebles_plan[sofas][plan_dia]'), producido: formData.get('muebles_plan[sofas][producido]'), pendiente: formData.get('muebles_plan[sofas][pendiente]') }, reclinables: { plan_dia: formData.get('muebles_plan[reclinables][plan_dia]'), producido: formData.get('muebles_plan[reclinables][producido]'), pendiente: formData.get('muebles_plan[reclinables][pendiente]') }, respaldosOtros: { plan_dia: formData.get('muebles_plan[respaldos_otros][plan_dia]'), producido: formData.get('muebles_plan[respaldos_otros][producido]'), pendiente: formData.get('muebles_plan[respaldos_otros][pendiente]') } };
        }

        datos.sucesos = [];
        if (this.sucesosContainerElement) {
            this.sucesosContainerElement.querySelectorAll('.dynamic-row-entry').forEach((entry) => {
                const idSuffix = entry.id.split('_').pop();
                datos.sucesos.push({ incidente: formData.get(`sucesos[${idSuffix}][incidente]`), tipoIncidente: formData.get(`sucesos[${idSuffix}][tipo_incidente]`), areaResponsable: formData.get(`sucesos[${idSuffix}][area_responsable]`), tiempoAfectacion: formData.get(`sucesos[${idSuffix}][tiempo_afectacion]`), unidades: formData.get(`sucesos[${idSuffix}][unidades]`), impactoProduccion: formData.get(`sucesos[${idSuffix}][impacto_produccion]`), gestionTomada: formData.get(`sucesos[${idSuffix}][gestion_tomada]`), estadoResuelto: this.formElement.querySelector(`#estado_resuelto_${idSuffix}`)?.checked ? 'Resuelto' : 'En Proceso' });
            });
        }

        datos.porcentajeAusentismo = formData.get('porcentaje_ausentismo') ? formData.get('porcentaje_ausentismo') + '%' : '';

        datos.ausentismos = [];
        if (this.ausentismoContainerElement) {
            this.ausentismoContainerElement.querySelectorAll('.dynamic-row-entry').forEach((entry) => {
                const idSuffix = entry.id.split('_').pop();
                datos.ausentismos.push({ puestoTrabajo: formData.get(`ausentismos[${idSuffix}][puesto_trabajo]`), motivo: formData.get(`ausentismos[${idSuffix}][motivo]`), cantidadPersonal: formData.get(`ausentismos[${idSuffix}][cantidad_personal]`), gestion: formData.get(`ausentismos[${idSuffix}][gestion]`) });
            });
        }

        datos.horasExtra = [];
        const horasExtraContainerElement = document.getElementById('horas-extra-container');
        if (horasExtraContainerElement) {
            horasExtraContainerElement.querySelectorAll('.dynamic-row-entry').forEach((entry) => {
                const idSuffix = entry.id.split('_').pop();
                datos.horasExtra.push({
                    numeroHoras: formData.get(`horas_extra[${idSuffix}][numero_horas]`),
                    cantidadPersonal: formData.get(`horas_extra[${idSuffix}][cantidad_personal]`),
                    subarea: formData.get(`horas_extra[${idSuffix}][subarea]`),
                    motivo: formData.get(`horas_extra[${idSuffix}][motivo]`)
                });
            });
        }

        datos.observaciones = formData.get('observaciones_otros');
        datos.esLunes = esLunes;
        return datos;
    },

    // --- (MODIFICADO) FUNCIÓN PARA PREPARAR DATOS DE EXCEL ---
    prepararDatosParaExcel: function(datos) {
        const sheetData = [];
        const esLunes = datos.esLunes;
        const nombreAreaSeleccionada = datos.nombreAreaHoja;
        const areasSinCumplimiento = ['textil', 'metalurgia', 'fibra', 'espuma'];
        const cabeceras = ["Fecha"];

        if (nombreAreaSeleccionada === "fibra") {
            cabeceras.push("Ingreso Diario De Scrap En Metro");
        }
        if (nombreAreaSeleccionada === "espuma") {
            cabeceras.push("Salida Diaria De Scrap En Metro");
        }

        if (!areasSinCumplimiento.includes(nombreAreaSeleccionada)) {
            cabeceras.push(this.getFormText("label-cumplimiento", esLunes));
        }

        if (nombreAreaSeleccionada === "colchones" && datos.colchonesProd) {
            cabeceras.push(this.getFormText("label-colchones-plan", esLunes), this.getFormText("label-colchones-producido", esLunes), "Por Vulcanizar", "Por Cerrar");
            if (datos.datosRelevanteColchones) { cabeceras.push("Personal en Cerrado", "Colchones Reparados", "Espera Reparación"); }
        } else if (nombreAreaSeleccionada === "accesorios" && datos.accesoriosPlan) {
            cabeceras.push(this.getFormText("label-accgen-plan", esLunes), this.getFormText("label-accgen-prod", esLunes), "Pendiente Accesorios", this.getFormText("label-accplum-plan", esLunes), this.getFormText("label-accplum-prod", esLunes), "Plumones Pendiente", this.getFormText("label-accalm-plan", esLunes), this.getFormText("label-accalm-prod", esLunes), "Almohadas Pendientes");
        } else if (nombreAreaSeleccionada === "bases" && datos.basesPlan) {
            cabeceras.push(this.getFormText("label-bases-plan", esLunes), this.getFormText("label-bases-prod", esLunes), "Bases Pendientes");
        } else if (nombreAreaSeleccionada === "muebles" && datos.mueblesPlan) {
            cabeceras.push(this.getFormText("label-muebsofa-plan", esLunes), this.getFormText("label-muebsofa-prod", esLunes), "Sofás pendientes", this.getFormText("label-muebrecl-plan", esLunes), this.getFormText("label-muebrecl-prod", esLunes), "Reclinable Pendientes", this.getFormText("label-muebresp-plan", esLunes), this.getFormText("label-muebresp-prod", esLunes), "Respaldos y otros pendientes");
        }

        cabeceras.push(
            "Incidente (Suceso)", "Tipo Incidente", "Área Resp.", "Tiempo Afect.", "Unidades", "Impacto Prod.", "Gestión Tomada", "Estado",
            "Porcentaje de ausentismo",
            "Puesto Trabajo (Aus.)", "Motivo (Aus.)", "Cant. Personal (Aus.)", "Gestión (Aus.)",
            "Número Horas (HE)", "Cant. Personal (HE)", "Sub-Área (HE)", "Motivo (HE)", "Horas Totales (HE)",
            "Observaciones u Otros"
        );
        sheetData.push(cabeceras);

        const numSucesos = datos.sucesos?.length || 0;
        const numAusentismos = datos.ausentismos?.length || 0;
        const numHorasExtra = datos.horasExtra?.length || 0;
        const maxFilasDinamicas = Math.max(numSucesos, numAusentismos, numHorasExtra, 1);

        for (let i = 0; i < maxFilasDinamicas; i++) {
            const fila = [];
            const esPrimeraFilaDeDatos = (i === 0);
            const emptyDynamicCell = esPrimeraFilaDeDatos ? '' : '--';

            fila.push(esPrimeraFilaDeDatos ? (datos.fecha || '') : "||");

            if (nombreAreaSeleccionada === "fibra") {
                fila.push(esPrimeraFilaDeDatos ? (datos.ingresoScrapFibra || '') : "||");
            }
            if (nombreAreaSeleccionada === "espuma") {
                fila.push(esPrimeraFilaDeDatos ? (datos.salidaScrapEspuma || '') : "||");
            }

            if (!areasSinCumplimiento.includes(nombreAreaSeleccionada)) {
                fila.push(esPrimeraFilaDeDatos ? (datos.porcentajeCumplimiento || '') : "||");
            }

            if (nombreAreaSeleccionada === "colchones" && datos.colchonesProd) {
                fila.push(esPrimeraFilaDeDatos ? (datos.colchonesProd.planDia || '') : "||", esPrimeraFilaDeDatos ? (datos.colchonesProd.producido || '') : "||", esPrimeraFilaDeDatos ? (datos.colchonesProd.porVulcanizar || '') : "||", esPrimeraFilaDeDatos ? (datos.colchonesProd.porCerrar || '') : "||");
                if (datos.datosRelevanteColchones) { fila.push(esPrimeraFilaDeDatos ? (datos.datosRelevanteColchones.personalCerrado || '') : "||", esPrimeraFilaDeDatos ? (datos.datosRelevanteColchones.colchonesReparados || '') : "||", esPrimeraFilaDeDatos ? (datos.datosRelevanteColchones.esperaReparacion || '') : "||"); }
            } else if (nombreAreaSeleccionada === "accesorios" && datos.accesoriosPlan) {
                fila.push(esPrimeraFilaDeDatos ? (datos.accesoriosPlan.general?.plan_dia || '') : "||", esPrimeraFilaDeDatos ? (datos.accesoriosPlan.general?.producido || '') : "||", esPrimeraFilaDeDatos ? (datos.accesoriosPlan.general?.pendiente || '') : "||", esPrimeraFilaDeDatos ? (datos.accesoriosPlan.plumones?.plan_dia || '') : "||", esPrimeraFilaDeDatos ? (datos.accesoriosPlan.plumones?.producido || '') : "||", esPrimeraFilaDeDatos ? (datos.accesoriosPlan.plumones?.pendiente || '') : "||", esPrimeraFilaDeDatos ? (datos.accesoriosPlan.almohadas?.plan_dia || '') : "||", esPrimeraFilaDeDatos ? (datos.accesoriosPlan.almohadas?.producido || '') : "||", esPrimeraFilaDeDatos ? (datos.accesoriosPlan.almohadas?.pendiente || '') : "||");
            } else if (nombreAreaSeleccionada === "bases" && datos.basesPlan) {
                fila.push(esPrimeraFilaDeDatos ? (datos.basesPlan.planTotal || '') : "||", esPrimeraFilaDeDatos ? (datos.basesPlan.producido || '') : "||", esPrimeraFilaDeDatos ? (datos.basesPlan.pendientes || '') : "||");
            } else if (nombreAreaSeleccionada === "muebles" && datos.mueblesPlan) {
                fila.push(esPrimeraFilaDeDatos ? (datos.mueblesPlan.sofas?.plan_dia || '') : "||", esPrimeraFilaDeDatos ? (datos.mueblesPlan.sofas?.producido || '') : "||", esPrimeraFilaDeDatos ? (datos.mueblesPlan.sofas?.pendiente || '') : "||", esPrimeraFilaDeDatos ? (datos.mueblesPlan.reclinables?.plan_dia || '') : "||", esPrimeraFilaDeDatos ? (datos.mueblesPlan.reclinables?.producido || '') : "||", esPrimeraFilaDeDatos ? (datos.mueblesPlan.reclinables?.pendiente || '') : "||", esPrimeraFilaDeDatos ? (datos.mueblesPlan.respaldosOtros?.plan_dia || '') : "||", esPrimeraFilaDeDatos ? (datos.mueblesPlan.respaldosOtros?.producido || '') : "||", esPrimeraFilaDeDatos ? (datos.mueblesPlan.respaldosOtros?.pendiente || '') : "||");
            }

            const suceso = datos.sucesos?. [i];
            fila.push(suceso ? suceso.incidente || '' : emptyDynamicCell, suceso ? suceso.tipoIncidente || '' : emptyDynamicCell, suceso ? suceso.areaResponsable || '' : emptyDynamicCell, suceso ? suceso.tiempoAfectacion || '' : emptyDynamicCell, suceso ? suceso.unidades || '' : emptyDynamicCell, suceso ? suceso.impactoProduccion || '' : emptyDynamicCell, suceso ? suceso.gestionTomada || '' : emptyDynamicCell, suceso ? suceso.estadoResuelto || '' : emptyDynamicCell);

            fila.push(esPrimeraFilaDeDatos ? (datos.porcentajeAusentismo || '') : "||");

            const ausentismo = datos.ausentismos?. [i];
            fila.push(ausentismo ? ausentismo.puestoTrabajo || '' : emptyDynamicCell, ausentismo ? ausentismo.motivo || '' : emptyDynamicCell, ausentismo ? ausentismo.cantidadPersonal || '' : emptyDynamicCell, ausentismo ? ausentismo.gestion || '' : emptyDynamicCell);

            const horaExtra = datos.horasExtra?. [i];
            const totalHoras = (parseFloat(horaExtra?.numeroHoras) || 0) * (parseFloat(horaExtra?.cantidadPersonal) || 0);
            fila.push(horaExtra ? horaExtra.numeroHoras || '' : emptyDynamicCell, horaExtra ? horaExtra.cantidadPersonal || '' : emptyDynamicCell, horaExtra ? horaExtra.subarea || '' : emptyDynamicCell, horaExtra ? horaExtra.motivo || '' : emptyDynamicCell, horaExtra ? totalHoras : emptyDynamicCell);

            fila.push(esPrimeraFilaDeDatos ? (datos.observaciones || '') : "||");
            sheetData.push(fila);
        }
        return sheetData;
    },

    generarYDescargarExcel: function() {
        try {
            const datosFormulario = this.recolectarDatosDelFormulario();
            if (!datosFormulario) {
                alert("No se pudieron recolectar los datos para el Excel.");
                return;
            }
            const datosParaHoja = this.prepararDatosParaExcel(datosFormulario);
            if (!datosParaHoja || datosParaHoja.length <= 1) {
                alert("No hay suficientes datos para generar el archivo Excel.");
                return;
            }

            const nombreHoja = datosFormulario.area.replace(/[\/\s]/g, '_') || "Reporte";
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(datosParaHoja);

            const anchos = datosParaHoja[0].map((_, colIndex) => {
                return { wch: datosParaHoja.reduce((w, r) => Math.max(w, (r[colIndex] || '').toString().length), 10) };
            });
            ws['!cols'] = anchos;

            XLSX.utils.book_append_sheet(wb, ws, nombreHoja.substring(0, 31));

            const fechaParaNombre = datosFormulario.fecha.replace(/\//g, '-');
            const nombreArchivo = `ReporteDiario_${nombreHoja}_${fechaParaNombre}.xlsx`;

            XLSX.writeFile(wb, nombreArchivo);

        } catch (e) {
            console.error("ExcelReportGenerator - Error al generar el Excel:", e);
            alert("Error al generar el archivo Excel. Revise la consola del navegador para más detalles.");
        }
    }
};
