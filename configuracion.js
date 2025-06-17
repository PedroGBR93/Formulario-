const APP_CONFIG = {

    // Mensajes predefinidos para el correo electrónico por área
    mensajesPredefinidosPorArea: {
        'colchones': 'Plan semanal: 7.189',
        'accesorios': 'Plan de accesorios semanal: 18.484',
        'bases': 'Plan de bases semanales: 6.204',
        'muebles': 'Plan de muebles semanales: 1.001',
        'textil': '',
        'metalurgia': '',
        'fibra': '',
        'espuma': ''
    },

    // Mapa de correos para el envío de reportes
    emailMap: {
        colchones: 'felipe.ferreira@rosen.cl',
        accesorios: 'cristobal.mansilla@rosen.cl',
        bases: 'cristan.fincheira@rosen.cl',
        muebles: 'victor.cortes@rosen.cl',
        textil: 'susana-gutierrez@rosen.cl',
        metalurgia: 'mauricio.parada@rosen.cl',
        fibra: 'leonardo.morales@rosen.cl',
        espuma: 'contardo.zambrano@rosen.cl'
    },

    // Configuración central de visibilidad de secciones por área
    configuracionDeVisibilidad: {
        'colchones': {
            cumplimiento: true,
            colchonesProd: true,
            datosRelevante: true,
            sucesos: true,
            porcAusentismo: true,
            ausentismo: true,
            horasExtra: true,
            accesoriosPlan: false,
            basesPlan: false,
            mueblesPlan: false,
            fibraScrap: false,
            espumaScrap: false,
        },
        'accesorios': {
            cumplimiento: true,
            accesoriosPlan: true,
            sucesos: true,
            porcAusentismo: true,
            ausentismo: true,
            horasExtra: true,
            colchonesProd: false,
            datosRelevante: false,
            basesPlan: false,
            mueblesPlan: false,
            fibraScrap: false,
            espumaScrap: false,
        },
        'bases': {
            cumplimiento: true,
            basesPlan: true,
            sucesos: true,
            porcAusentismo: true,
            ausentismo: true,
            horasExtra: true,
            colchonesProd: false,
            datosRelevante: false,
            accesoriosPlan: false,
            mueblesPlan: false,
            fibraScrap: false,
            espumaScrap: false,
        },
        'muebles': {
            cumplimiento: true,
            mueblesPlan: true,
            sucesos: true,
            porcAusentismo: true,
            ausentismo: true,
            horasExtra: true,
            colchonesProd: false,
            datosRelevante: false,
            accesoriosPlan: false,
            basesPlan: false,
            fibraScrap: false,
            espumaScrap: false,
        },
        'textil': {
            sucesos: true,
            horasExtra: true,
            porcAusentismo: true,
            ausentismo: false,
            cumplimiento: false,
            colchonesProd: false,
            datosRelevante: false,
            accesoriosPlan: false,
            basesPlan: false,
            mueblesPlan: false,
            fibraScrap: false,
            espumaScrap: false,
        },
        'metalurgia': {
            sucesos: true,
            porcAusentismo: true,
            ausentismo: true,
            horasExtra: true,
            cumplimiento: false,
            colchonesProd: false,
            datosRelevante: false,
            accesoriosPlan: false,
            basesPlan: false,
            mueblesPlan: false,
            fibraScrap: false,
            espumaScrap: false,
        },
        'fibra': {
            fibraScrap: true,
            sucesos: true,
            porcAusentismo: true,
            ausentismo: true,
            horasExtra: true,
            cumplimiento: false,
            colchonesProd: false,
            datosRelevante: false,
            accesoriosPlan: false,
            basesPlan: false,
            mueblesPlan: false,
            espumaScrap: false,
        },
        'espuma': {
            espumaScrap: true,
            sucesos: true,
            porcAusentismo: true,
            ausentismo: true,
            horasExtra: true,
            cumplimiento: false,
            colchonesProd: false,
            datosRelevante: false,
            accesoriosPlan: false,
            basesPlan: false,
            mueblesPlan: false,
            fibraScrap: false,
        }
    },

    // Mapeo de textos para cambiar etiquetas en día Lunes
    textMappings: {
        "title-colchones-prod": ["Colchones Producción Del Día", "Colchones Producción De La Semana"],
        "title-accesorios-plan": ["Plan Diario y Pendientes Día Anterior", "Plan Semanal y Pendientes Semana Anterior"],
        "title-bases-plan": ["Plan Diario y Pendientes Día Anterior", "Plan Semanal y Pendientes Semana Anterior"],
        "title-muebles-plan": ["Plan Diario y Pendientes Día Anterior", "Plan Semanal y Pendientes Semana Anterior"],
        "label-cumplimiento": ["Porcentaje De Cumplimiento Día Anterior:", "Porcentaje De Cumplimiento Semana Anterior:"],
        "label-colchones-plan": ["Plan Del Día", "Plan De La Semana"],
        "label-colchones-producido": ["Producido", "Producido Semanal"],
        "label-accgen-plan": ["Plan Del Día Accesorio", "Plan De La Semana Accesorio"],
        "label-accgen-prod": ["Producido Accesorios", "Producido Semanal Accesorios"],
        "label-accplum-plan": ["Plan Del Día Plumones", "Plan De La semana Plumones"],
        "label-accplum-prod": ["Producido Plumones", "Producido Semanal Plumones"],
        "label-accalm-plan": ["Plan Del Día Almohadas", "Plan De La Semana Almohadas"],
        "label-accalm-prod": ["Producido Almohadas", "Producido Semanal Almohadas"],
        "label-bases-plan": ["Plan Del Día", "Plan De La Semana"],
        "label-bases-prod": ["Producido", "Producido Semanal"],
        "label-muebsofa-plan": ["Plan Del Día Sofás", "Plan De La Semana Sofás"],
        "label-muebsofa-prod": ["Sofás Producido", "Sofás Producido Semanal"],
        "label-muebrecl-plan": ["Plan Del Día Reclinables", "Plan De La Semana Reclinables"],
        "label-muebrecl-prod": ["Reclinables Producidos", "Reclinables Producidos Semanal"],
        "label-muebresp-plan": ["Plan Del Día Respaldos u Otros", "Plan De La Semana Respaldos u Otros"],
        "label-muebresp-prod": ["Respaldo u Otros Producido", "Respaldo u Otros Producido Semanal"],
    },

    // Mapeo de sub-áreas para el reporte de Horas Extra
    subAreaMappings: {
        colchones: ["Cerrado", "Emsamblaje", "Vulcanizado", "Otra Area"],
        accesorios: ["Area de Plumones", "Area de Almohada", "Area de Sábana","Area General"],
        bases: ["Tapizado Convencional", "Tapizado Funcional ", "Funda", "Clavado De Parrilla"],
        muebles: ["Corte", "Confección", "Pegado de Cojines", "Llenado", "Armado Estructura", "Tapizado", "Embalaje", "Celula Reclinables"],
        textil: ["Multiaguja", "Uniaguja", "Encintado","Confección Fuelle","Area General"],
        metalurgia: ["Boney", "Cosisoft", "Pocket", "Area General"],
        fibra: ["Masia 1", "Masia 2", "Masia 3", "Masia 4", "Desiladeshilachado", "Area General"],
        espuma: ["Espuma Área 1", "Espuma Área 2", "Otro Espuma"]
    },

    // Opciones para el <select> de Tipo de Incidente en Sucesos
    tipoIncidenteOptions: [
        "Falla De Maquina", "Producto Con Falla", "Producto Pendiente","Planificación", "Por Personal", "Seguridad", "Gestion De Mejora", "Otro Problema"
    ],

    // Opciones para el <select> de Área Responsable en Sucesos
    areaResponsableOptions: [
        "Bases", "Ensamblado Colchon", "Espuma", "Fibra", "Materia Prima","Mueble", "Proveedor", "Textil Accesorio", "Textil Colchon", "Mantención","Otra Area Responsable", "Sin Responsable"
    ]
};
