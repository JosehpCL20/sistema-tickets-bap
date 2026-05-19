// =============================================
// PÁGINA: DASHBOARD GENERAL (Super Admin)
// Sistema de Gestión de Tickets - Banco de Alimentos Perú
// =============================================
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTicketStore } from '../store/ticketStore';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import {
  RefreshCw, Ticket, Building2, Tag, Users,
  ClipboardList, CheckCircle, FileX, TrendingUp, FileCheck, Clock, Layers,
  Download, Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Áreas de la organización
const AREAS = [
  'Logística y Calidad',
  'Sistemas y Procesos',
  'Gestión Social',
  'Administración',
  'Estrategias y Alianzas',
  'Fundraising',
  'Proyectos'
];

// Categorías de tickets
const CATEGORIAS = [
  'Hardware', 'Software', 'Redes', 'Accesos',
  'Impresoras', 'Correo', 'Reportes', 'Otros'
];

// Meses del año
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Años disponibles
const ANIOS = [2024, 2025, 2026, 2027];

// Colores de la paleta corporativa
const COLORES = {
  verde: '#80c398',
  amarillo: '#fbe066',
  rojo: '#ea4c5b',
  azul: '#6ab088',
  naranja: '#f5a623',
  morado: '#a855f7',
  cyan: '#06b6d4'
};

// Colores para subcategorías (66 colores únicos)
const COLORES_SUBCATEGORIAS: Record<string, string> = {
  'Computadora no enciende': '#80c398',
  'Pantalla azul / errores de sistema': '#fbe066',
  'Computadora muy lenta': '#ea4c5b',
  'Teclado o mouse no funciona': '#6ab088',
  'Monitor no da imagen': '#f5a623',
  'Ruido extraño en la PC': '#3b82f6',
  'Sobrecalentamiento': '#a855f7',
  'Disco duro lleno': '#06b6d4',
  'Memoria RAM insuficiente': '#ec4899',
  'Otro problema de hardware': '#6366f1',
  'No puedo abrir SAP': '#80c398',
  'Error al ingresar a SAP': '#fbe066',
  'SAP muy lento': '#ea4c5b',
  'No puedo descargar reportes de SAP': '#6ab088',
  'Error en módulo de SAP': '#f5a623',
  'Excel no funciona correctamente': '#3b82f6',
  'Word/PowerPoint con errores': '#a855f7',
  'Necesito instalar un programa': '#06b6d4',
  'Actualización de software': '#ec4899',
  'Licencia de software vencida': '#6366f1',
  'Programa se cierra inesperadamente': '#80c398',
  'Otro problema de software': '#fbe066',
  'No tengo internet': '#ea4c5b',
  'Internet muy lento': '#6ab088',
  'WiFi no conecta': '#f5a623',
  'Conexión intermitente': '#3b82f6',
  'No puedo acceder a la red interna': '#a855f7',
  'VPN no funciona': '#06b6d4',
  'Cable de red dañado': '#ec4899',
  'No puedo acceder a carpetas compartidas': '#6366f1',
  'Problemas con el router': '#80c398',
  'Otro problema de red': '#fbe066',
  'Olvidé mi contraseña': '#ea4c5b',
  'Mi cuenta está bloqueada': '#6ab088',
  'No tengo acceso a SAP': '#f5a623',
  'Necesito permisos adicionales': '#3b82f6',
  'Error de autenticación': '#a855f7',
  'Token de seguridad no funciona': '#06b6d4',
  'Acceso denegado a sistema': '#ec4899',
  'Necesito crear usuario nuevo': '#6366f1',
  'Cambiar correo electrónico': '#80c398',
  'Otro problema de acceso': '#fbe066',
  'Impresora no imprime': '#ea4c5b',
  'Impresión muy lenta': '#6ab088',
  'Impresión borrosa o con rayas': '#f5a623',
  'Atasco de papel': '#3b82f6',
  'No se detecta la impresora': '#a855f7',
  'Error de driver de impresora': '#06b6d4',
  'Impresora sin tóner/tinta': '#ec4899',
  'Escáner no funciona': '#6366f1',
  'Configurar impresora en red': '#80c398',
  'Otro problema de impresora': '#fbe066',
  'No puedo enviar correos': '#ea4c5b',
  'No recibo correos': '#6ab088',
  'Outlook no funciona': '#f5a623',
  'Buzón lleno': '#3b82f6',
  'Error al adjuntar archivos': '#a855f7',
  'Correo va a spam': '#06b6d4',
  'No puedo acceder al webmail': '#ec4899',
  'Configurar correo en celular': '#6366f1',
  'Contraseña de correo olvidada': '#80c398',
  'Otro problema de correo': '#fbe066',
  'No puedo descargar reportes': '#ea4c5b',
  'Reporte sale en blanco': '#6ab088',
  'Error al generar reporte': '#f5a623',
  'Reporte con datos incorrectos': '#3b82f6',
  'Reporte muy lento': '#a855f7',
  'No encuentro un reporte': '#06b6d4',
  'Necesito un reporte personalizado': '#ec4899',
  'Exportar a Excel/PDF no funciona': '#6366f1',
  'Filtros de reporte no funcionan': '#80c398',
  'Otro problema con reportes': '#fbe066',
  'Capacitación en sistema': '#ea4c5b',
  'Solicitud de equipo nuevo': '#6ab088',
  'Mantenimiento preventivo': '#f5a623',
  'Consulta general': '#3b82f6',
  'Sugerencia de mejora': '#a855f7',
  'Otro (especificar en descripción)': '#06b6d4'
};

const getColorForSubcategoria = (subcat: string) => {
  return COLORES_SUBCATEGORIAS[subcat] || COLORES.verde;
};

// Colores para categorías en tablas
const COLORES_CATEGORIAS_TABLA: Record<string, string> = {
  'Hardware': '#80c398',
  'Software': '#fbe066',
  'Redes': '#ea4c5b',
  'Accesos': '#6ab088',
  'Impresoras': '#f5a623',
  'Correo': '#3b82f6',
  'Reportes': '#a855f7',
  'Otros': '#6b7280'
};

// ✅ FUNCIÓN PARA GENERAR 66 COLORES TOTALMENTE DISTINTOS
const generarColoresAdicionales = (cantidad: number): string[] => {
  const colores: string[] = [];
  for (let i = 0; i < cantidad; i++) {
    const hue = Math.floor((i * 137.508) % 360);
    const saturation = 65 + (i % 20);
    const lightness = 55 + (i % 15);
    colores.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  return colores;
};

// TODAS las subcategorías
const TODAS_LAS_SUBCATEGORIAS = [
  'Computadora no enciende', 'Pantalla azul / errores de sistema', 'Computadora muy lenta',
  'Teclado o mouse no funciona', 'Monitor no da imagen', 'Ruido extraño en la PC',
  'Sobrecalentamiento', 'Disco duro lleno', 'Memoria RAM insuficiente',
  'Otro problema de hardware',
  'No puedo abrir SAP', 'Error al ingresar a SAP', 'SAP muy lento',
  'No puedo descargar reportes de SAP', 'Error en módulo de SAP',
  'Excel no funciona correctamente', 'Word/PowerPoint con errores',
  'Necesito instalar un programa', 'Actualización de software',
  'Licencia de software vencida', 'Programa se cierra inesperadamente',
  'Otro problema de software',
  'No tengo internet', 'Internet muy lento', 'WiFi no conecta',
  'Conexión intermitente', 'No puedo acceder a la red interna', 'VPN no funciona',
  'Cable de red dañado', 'No puedo acceder a carpetas compartidas',
  'Problemas con el router', 'Otro problema de red',
  'Olvidé mi contraseña', 'Mi cuenta está bloqueada', 'No tengo acceso a SAP',
  'Necesito permisos adicionales', 'Error de autenticación',
  'Token de seguridad no funciona', 'Acceso denegado a sistema',
  'Necesito crear usuario nuevo', 'Cambiar correo electrónico',
  'Otro problema de acceso',
  'Impresora no imprime', 'Impresión muy lenta', 'Impresión borrosa o con rayas',
  'Atasco de papel', 'No se detecta la impresora', 'Error de driver de impresora',
  'Impresora sin tóner/tinta', 'Escáner no funciona', 'Configurar impresora en red',
  'Otro problema de impresora',
  'No puedo enviar correos', 'No recibo correos', 'Outlook no funciona',
  'Buzón lleno', 'Error al adjuntar archivos', 'Correo va a spam',
  'No puedo acceder al webmail', 'Configurar correo en celular',
  'Contraseña de correo olvidada', 'Otro problema de correo',
  'No puedo descargar reportes', 'Reporte sale en blanco', 'Error al generar reporte',
  'Reporte con datos incorrectos', 'Reporte muy lento', 'No encuentro un reporte',
  'Necesito un reporte personalizado', 'Exportar a Excel/PDF no funciona',
  'Filtros de reporte no funcionan', 'Otro problema con reportes',
  'Capacitación en sistema', 'Solicitud de equipo nuevo', 'Mantenimiento preventivo',
  'Consulta general', 'Sugerencia de mejora', 'Otro (especificar en descripción)'
];

// Colores para estados en gráficos apilados
const COLORES_ESTADOS: Record<string, string> = {
  nuevo: '#fbe066',
  asignado: '#3b82f6',
  planificado: '#a855f7',
  resuelto: '#22c55e',
  cerrado: '#6b7280'
};

// =============================================
// FUNCIÓN PARA EXPORTAR A EXCEL (10 HOJAS - UNA POR GRÁFICO)
// =============================================
const exportarAExcel = (tickets: any[], usuarios: any[], filtroMes: string, filtroAnio: number) => {
  const wb = XLSX.utils.book_new();
  
  const obtenerNombreMes = (mes: string) => {
    if (mes === 'todos') return 'Todos';
    const index = parseInt(mes);
    if (isNaN(index) || index < 0 || index > 11) return mes;
    return MESES[index];
  };
  
  const obtenerNombreAnio = (anio: number) => {
    return anio === -1 ? 'Todos' : anio.toString();
  };
  
  const nombreMes = obtenerNombreMes(filtroMes);
  const nombreAnio = obtenerNombreAnio(filtroAnio);
  
  const ticketsFiltrados = tickets.filter((t: any) => {
    const fecha = new Date(t.fechaCreacion);
    const cumpleAnio = filtroAnio === -1 || fecha.getFullYear() === filtroAnio;
    const cumpleMes = filtroMes === 'todos' || fecha.getMonth() === parseInt(filtroMes);
    return cumpleAnio && cumpleMes;
  });
  
  // =============================================
  // HOJA 1: TICKETS POR ESTADO
  // =============================================
  const datosEstado: any[][] = [];
  datosEstado.push(['TICKETS POR ESTADO']);
  datosEstado.push(['Mes:', nombreMes, 'Año:', nombreAnio]);
  datosEstado.push([]);
  const estadosList = ['nuevo', 'asignado', 'planificado', 'resuelto', 'cerrado'];
  const conteoEstado: Record<string, number> = {};
  estadosList.forEach(e => { conteoEstado[e] = 0; });
  ticketsFiltrados.forEach((t: any) => {
    if (conteoEstado[t.estado] !== undefined) {
      conteoEstado[t.estado]++;
    }
  });
  datosEstado.push(['Estado', 'Cantidad']);
  estadosList.forEach(e => {
    datosEstado.push([e.charAt(0).toUpperCase() + e.slice(1), conteoEstado[e]]);
  });
  const wsEstado = XLSX.utils.aoa_to_sheet(datosEstado);
  wsEstado['!cols'] = [{ wch: 20 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsEstado, 'Tickets por Estado');
  
  // =============================================
  // HOJA 2: TICKETS POR ÁREA
  // =============================================
  const datosArea: any[][] = [];
  datosArea.push(['TICKETS POR ÁREA']);
  datosArea.push(['Mes:', nombreMes, 'Año:', nombreAnio]);
  datosArea.push([]);
  const conteoArea: Record<string, number> = {};
  AREAS.forEach(area => { conteoArea[area] = 0; });
  ticketsFiltrados.forEach((t: any) => {
    const solicitante = usuarios.find((u: any) => u.id === t.solicitanteId);
    if (solicitante && conteoArea[solicitante.area] !== undefined) {
      conteoArea[solicitante.area]++;
    }
  });
  datosArea.push(['Área', 'Cantidad']);
  AREAS.forEach(area => {
    if (conteoArea[area] > 0) {
      datosArea.push([area, conteoArea[area]]);
    }
  });
  const wsArea = XLSX.utils.aoa_to_sheet(datosArea);
  wsArea['!cols'] = [{ wch: 35 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsArea, 'Tickets por Área');
  
  // =============================================
  // HOJA 3: TICKETS POR CATEGORÍA
  // =============================================
  const datosCategoria: any[][] = [];
  datosCategoria.push(['TICKETS POR CATEGORÍA']);
  datosCategoria.push(['Mes:', nombreMes, 'Año:', nombreAnio]);
  datosCategoria.push([]);
  const conteoCategoria: Record<string, number> = {};
  CATEGORIAS.forEach(cat => { conteoCategoria[cat] = 0; });
  ticketsFiltrados.forEach((t: any) => {
    if (conteoCategoria[t.categoria] !== undefined) {
      conteoCategoria[t.categoria]++;
    }
  });
  datosCategoria.push(['Categoría', 'Cantidad']);
  CATEGORIAS.forEach(cat => {
    if (conteoCategoria[cat] > 0) {
      datosCategoria.push([cat, conteoCategoria[cat]]);
    }
  });
  const wsCategoria = XLSX.utils.aoa_to_sheet(datosCategoria);
  wsCategoria['!cols'] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsCategoria, 'Tickets por Categoría');
  
  // =============================================
  // HOJA 4: TICKETS POR SUBCATEGORÍA
  // =============================================
  const datosSubcategoria: any[][] = [];
  datosSubcategoria.push(['TICKETS POR SUBCATEGORÍA']);
  datosSubcategoria.push(['Mes:', nombreMes, 'Año:', nombreAnio]);
  datosSubcategoria.push([]);
  const conteoSubcategoria: Record<string, number> = {};
  TODAS_LAS_SUBCATEGORIAS.forEach(sub => { conteoSubcategoria[sub] = 0; });
  ticketsFiltrados.forEach((t: any) => {
    let subcat = t.subcategoria;
    if (!subcat && t.titulo) {
      const partes = t.titulo.split(' - ');
      if (partes.length > 1) {
        const posibleSubcat = partes[partes.length - 1].trim();
        const encontrada = TODAS_LAS_SUBCATEGORIAS.find(s => s.toLowerCase() === posibleSubcat.toLowerCase());
        subcat = encontrada || posibleSubcat;
      }
    }
    if (subcat && conteoSubcategoria[subcat] !== undefined) {
      conteoSubcategoria[subcat]++;
    }
  });
  datosSubcategoria.push(['Subcategoría', 'Cantidad']);
  TODAS_LAS_SUBCATEGORIAS.forEach(sub => {
    if (conteoSubcategoria[sub] > 0) {
      datosSubcategoria.push([sub, conteoSubcategoria[sub]]);
    }
  });
  const wsSubcategoria = XLSX.utils.aoa_to_sheet(datosSubcategoria);
  wsSubcategoria['!cols'] = [{ wch: 50 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsSubcategoria, 'Tickets por Subcategoría');
  
  // =============================================
  // HOJA 5: TOP 15 USUARIOS
  // =============================================
  const datosTopUsuarios: any[][] = [];
  datosTopUsuarios.push(['TOP 15 USUARIOS POR TOTAL DE TICKETS']);
  datosTopUsuarios.push(['Mes:', nombreMes, 'Año:', nombreAnio]);
  datosTopUsuarios.push([]);
  const conteoUsuarios: Record<string, any> = {};
  ticketsFiltrados.forEach((t: any) => {
    const solicitante = usuarios.find((u: any) => u.id === t.solicitanteId);
    if (solicitante) {
      const nombreCompleto = `${solicitante.nombre} ${solicitante.apellidos}`;
      if (!conteoUsuarios[nombreCompleto]) {
        conteoUsuarios[nombreCompleto] = { name: nombreCompleto, total: 0, area: solicitante.area };
      }
      conteoUsuarios[nombreCompleto].total++;
    }
  });
  const usuariosOrdenados = Object.values(conteoUsuarios)
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 15);
  datosTopUsuarios.push(['Usuario', 'Área', 'Total Tickets']);
  usuariosOrdenados.forEach((u: any) => {
    datosTopUsuarios.push([u.name, u.area, u.total]);
  });
  const wsTopUsuarios = XLSX.utils.aoa_to_sheet(datosTopUsuarios);
  wsTopUsuarios['!cols'] = [{ wch: 40 }, { wch: 30 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsTopUsuarios, 'Top 15 Usuarios');
  
  // =============================================
  // HOJA 6: ENCUESTAS POR ÁREA
  // =============================================
  const datosEncuestas: any[][] = [];
  datosEncuestas.push(['ENCUESTAS POR ÁREA']);
  datosEncuestas.push(['Mes:', nombreMes, 'Año:', nombreAnio]);
  datosEncuestas.push([]);
  const conteoEncuestas: Record<string, number> = {};
  AREAS.forEach(area => { conteoEncuestas[area] = 0; });
  ticketsFiltrados.forEach((t: any) => {
    if (['resuelto', 'cerrado'].includes(t.estado)) {
      const solicitante = usuarios.find((u: any) => u.id === t.solicitanteId);
      if (solicitante && conteoEncuestas[solicitante.area] !== undefined) {
        conteoEncuestas[solicitante.area]++;
      }
    }
  });
  datosEncuestas.push(['Área', 'Encuestas Enviadas']);
  AREAS.forEach(area => {
    if (conteoEncuestas[area] > 0) {
      datosEncuestas.push([area, conteoEncuestas[area]]);
    }
  });
  const wsEncuestas = XLSX.utils.aoa_to_sheet(datosEncuestas);
  wsEncuestas['!cols'] = [{ wch: 35 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsEncuestas, 'Encuestas por Área');
  
  // =============================================
  // HOJA 7: TASA DE COMPLETITUD
  // =============================================
  const datosTasa: any[][] = [];
  datosTasa.push(['TASA DE COMPLETITUD DE ENCUESTAS']);
  datosTasa.push(['Mes:', nombreMes, 'Año:', nombreAnio]);
  datosTasa.push([]);
  const enviadas = ticketsFiltrados.filter((t: any) => ['resuelto', 'cerrado'].includes(t.estado)).length;
  const completadas = ticketsFiltrados.filter((t: any) => t.encuestaCompletada === true).length;
  const pendientes = enviadas - completadas;
  datosTasa.push(['Tipo', 'Cantidad']);
  datosTasa.push(['Completadas', completadas]);
  datosTasa.push(['Pendientes', pendientes]);
  datosTasa.push(['Total Enviadas', enviadas]);
  const wsTasa = XLSX.utils.aoa_to_sheet(datosTasa);
  wsTasa['!cols'] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsTasa, 'Tasa de Completitud');
  
  // =============================================
  // HOJA 8: ESTADO DE TICKETS POR ÁREAS (BARRAS APILADAS)
  // =============================================
  const datosEstadoPorArea: any[][] = [];
  datosEstadoPorArea.push(['ESTADO DE TICKETS POR ÁREAS']);
  datosEstadoPorArea.push(['Mes:', nombreMes, 'Año:', nombreAnio]);
  datosEstadoPorArea.push([]);
  
  const estados = ['nuevo', 'asignado', 'planificado', 'resuelto', 'cerrado'];
  const datosEstadoArea: Record<string, Record<string, number>> = {};
  
  AREAS.forEach(area => {
    datosEstadoArea[area] = {};
    estados.forEach(e => { datosEstadoArea[area][e] = 0; });
  });
  
  ticketsFiltrados.forEach((t: any) => {
    const solicitante = usuarios.find((u: any) => u.id === t.solicitanteId);
    if (solicitante && datosEstadoArea[solicitante.area] && datosEstadoArea[solicitante.area][t.estado] !== undefined) {
      datosEstadoArea[solicitante.area][t.estado]++;
    }
  });
  
  const headerEstadoArea = ['Área', ...estados.map(e => e.charAt(0).toUpperCase() + e.slice(1)), 'Total'];
  datosEstadoPorArea.push(headerEstadoArea);
  
  AREAS.forEach(area => {
    const fila: (string | number)[] = [area];
    let totalArea = 0;
    estados.forEach(e => {
      const count = datosEstadoArea[area][e] || 0;
      fila.push(count);
      totalArea += count;
    });
    fila.push(totalArea);
    datosEstadoPorArea.push(fila);
  });
  
  const wsEstadoPorArea = XLSX.utils.aoa_to_sheet(datosEstadoPorArea);
  wsEstadoPorArea['!cols'] = [{ wch: 30 }, ...estados.map(() => ({ wch: 12 })), { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsEstadoPorArea, 'Estado por Áreas');
  
  // =============================================
  // HOJA 9: RESUMEN ÁREAS × CATEGORÍA
  // =============================================
  const datosResumenAreas: any[][] = [];
  datosResumenAreas.push(['RESUMEN: ÁREAS × CATEGORÍA']);
  datosResumenAreas.push(['Mes:', nombreMes, 'Año:', nombreAnio]);
  datosResumenAreas.push([]);
  const headerResumenAreas = ['Área', ...CATEGORIAS, 'Total'];
  datosResumenAreas.push(headerResumenAreas);
  AREAS.forEach(area => {
    const fila: (string | number)[] = [area];
    let totalArea = 0;
    CATEGORIAS.forEach(cat => {
      const count = ticketsFiltrados.filter((t: any) => {
        const solicitante = usuarios.find((u: any) => u.id === t.solicitanteId);
        return solicitante?.area === area && t.categoria === cat;
      }).length;
      fila.push(count);
      totalArea += count;
    });
    fila.push(totalArea);
    datosResumenAreas.push(fila);
  });
  const wsResumenAreas = XLSX.utils.aoa_to_sheet(datosResumenAreas);
  wsResumenAreas['!cols'] = [{ wch: 30 }, ...CATEGORIAS.map(() => ({ wch: 12 })), { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsResumenAreas, 'Resumen Áreas × Categoría');
  
  // =============================================
  // HOJA 10: RESUMEN USUARIOS × CATEGORÍA
  // =============================================
  const datosResumenUsuarios: any[][] = [];
  datosResumenUsuarios.push(['RESUMEN: USUARIOS × CATEGORÍA']);
  datosResumenUsuarios.push(['Mes:', nombreMes, 'Año:', nombreAnio]);
  datosResumenUsuarios.push([]);
  const headerResumenUsuarios = ['Área', 'Usuario', ...CATEGORIAS, 'Total'];
  datosResumenUsuarios.push(headerResumenUsuarios);
  const usuariosConTickets: Record<string, any> = {};
  usuarios.forEach((u: any) => {
    const nombreCompleto = `${u.nombre} ${u.apellidos}`;
    usuariosConTickets[nombreCompleto] = {
      id: u.id,
      nombre: nombreCompleto,
      area: u.area,
      categorias: {} as Record<string, number>,
      total: 0
    };
    CATEGORIAS.forEach(cat => {
      usuariosConTickets[nombreCompleto].categorias[cat] = 0;
    });
  });
  ticketsFiltrados.forEach((t: any) => {
    const solicitante = usuarios.find((u: any) => u.id === t.solicitanteId);
    if (solicitante && usuariosConTickets[solicitante.nombre + ' ' + solicitante.apellidos]) {
      const usuarioData = usuariosConTickets[solicitante.nombre + ' ' + solicitante.apellidos];
      if (t.categoria && usuarioData.categorias[t.categoria] !== undefined) {
        usuarioData.categorias[t.categoria]++;
      }
      usuarioData.total++;
    }
  });
  Object.values(usuariosConTickets)
    .sort((a: any, b: any) => b.total - a.total)
    .forEach((usuario: any) => {
      const fila: (string | number)[] = [usuario.area, usuario.nombre];
      CATEGORIAS.forEach(cat => {
        fila.push(usuario.categorias[cat] || 0);
      });
      fila.push(usuario.total);
      datosResumenUsuarios.push(fila);
    });
  const wsResumenUsuarios = XLSX.utils.aoa_to_sheet(datosResumenUsuarios);
  wsResumenUsuarios['!cols'] = [{ wch: 30 }, { wch: 40 }, ...CATEGORIAS.map(() => ({ wch: 12 })), { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsResumenUsuarios, 'Resumen Usuarios × Categoría');
  
  // =============================================
  // DESCARGAR ARCHIVO
  // =============================================
  const nombreArchivo = `Reporte_Dashboard_${nombreMes}_${nombreAnio}.xlsx`;
  XLSX.writeFile(wb, nombreArchivo);
};

export default function DashboardGeneralPage() {
  const navigate = useNavigate();
  const { usuarioActual, usuarios } = useAuthStore();
  const ticketStore = useTicketStore();
  
  // =============================================
  // FILTROS GLOBALES
  // =============================================
  const [filtroMesGlobal, setFiltroMesGlobal] = useState<string>('todos');
  const [filtroAnioGlobal, setFiltroAnioGlobal] = useState<number>(-1);
  
  // Filtros individuales de cada gráfico
  const [filtroEstadoGrafico1, setFiltroEstadoGrafico1] = useState('todos');
  const [filtroAreaGrafico2, setFiltroAreaGrafico2] = useState('todas');
  const [filtroAreaGrafico3, setFiltroAreaGrafico3] = useState('todas');
  const [filtroAreaGrafico4, setFiltroAreaGrafico4] = useState('todas');
  const [filtroAreaGrafico6, setFiltroAreaGrafico6] = useState('todas');
  const [filtroAreaGrafico8, setFiltroAreaGrafico8] = useState('todas'); // ✅ NUEVO FILTRO GRÁFICO 8
  
  const [cargando, setCargando] = useState(true);
  
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        if (usuarioActual?.rol === 'superadmin') {
          await ticketStore.cargarTickets();
          await useAuthStore.getState().cargarUsuarios();
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, [usuarioActual]);
  
  // =============================================
  // FILTRO GLOBAL APLICADO A TODOS LOS TICKETS
  // =============================================
  const ticketsFiltradosGlobal = useMemo(() => {
    return ticketStore.tickets.filter((t: any) => {
      const fecha = new Date(t.fechaCreacion);
      const cumpleAnio = filtroAnioGlobal === -1 || fecha.getFullYear() === filtroAnioGlobal;
      const cumpleMes = filtroMesGlobal === 'todos' || fecha.getMonth() === parseInt(filtroMesGlobal);
      return cumpleAnio && cumpleMes;
    });
  }, [ticketStore.tickets, filtroMesGlobal, filtroAnioGlobal]);
  
  // =============================================
  // GRÁFICO 1: Tickets por Estado
  // =============================================
  const ticketsGrafico1 = useMemo(() => {
    let filtrados = [...ticketsFiltradosGlobal];
    if (filtroEstadoGrafico1 !== 'todos') {
      filtrados = filtrados.filter((t: any) => t.estado === filtroEstadoGrafico1);
    }
    return filtrados;
  }, [ticketsFiltradosGlobal, filtroEstadoGrafico1]);
  
  const datosPorEstado = useMemo(() => {
    const conteo: Record<string, number> = {};
    const estadosList = ['nuevo', 'asignado', 'planificado', 'resuelto', 'cerrado'];
    const coloresEstados: Record<string, string> = {
      'nuevo': '#fbe066',
      'asignado': '#3b82f6',
      'planificado': '#a855f7',
      'resuelto': '#22c55e',
      'cerrado': '#6b7280'
    };
    estadosList.forEach(e => { conteo[e] = 0; });
    ticketsGrafico1.forEach((t: any) => {
      if (conteo[t.estado] !== undefined) {
        conteo[t.estado]++;
      }
    });
    return estadosList.map(e => ({
      name: e.charAt(0).toUpperCase() + e.slice(1),
      value: conteo[e],
      color: coloresEstados[e]
    }));
  }, [ticketsGrafico1]);
  
  // =============================================
  // GRÁFICO 2: Tickets por Área
  // =============================================
  const ticketsGrafico2 = useMemo(() => {
    let filtrados = [...ticketsFiltradosGlobal];
    if (filtroAreaGrafico2 !== 'todas') {
      filtrados = filtrados.filter((t: any) => {
        const solicitante = usuarios.find((u: any) => u.id === t.solicitanteId);
        return solicitante?.area === filtroAreaGrafico2;
      });
    }
    return filtrados;
  }, [ticketsFiltradosGlobal, filtroAreaGrafico2, usuarios]);
  
  const datosPorArea = useMemo(() => {
    const conteo: Record<string, number> = {};
    AREAS.forEach(area => { conteo[area] = 0; });
    ticketsGrafico2.forEach((t: any) => {
      const solicitante = usuarios.find((u: any) => u.id === t.solicitanteId);
      if (solicitante && conteo[solicitante.area] !== undefined) {
        conteo[solicitante.area]++;
      }
    });
    return AREAS.map((area, index) => ({
      name: area.length > 15 ? area.substring(0, 15) + '...' : area,
      fullName: area,
      value: conteo[area],
      color: Object.values(COLORES)[index % Object.values(COLORES).length]
    })).filter(d => d.value > 0);
  }, [ticketsGrafico2]);
  
  // =============================================
  // GRÁFICO 3: Tickets por Categoría
  // =============================================
  const ticketsGrafico3 = useMemo(() => {
    let filtrados = [...ticketsFiltradosGlobal];
    if (filtroAreaGrafico3 !== 'todas') {
      filtrados = filtrados.filter((t: any) => {
        const solicitante = usuarios.find((u: any) => u.id === t.solicitanteId);
        return solicitante?.area === filtroAreaGrafico3;
      });
    }
    return filtrados;
  }, [ticketsFiltradosGlobal, filtroAreaGrafico3, usuarios]);
  
  const datosPorCategoria = useMemo(() => {
    const conteo: Record<string, number> = {};
    CATEGORIAS.forEach(cat => { conteo[cat] = 0; });
    ticketsGrafico3.forEach((t: any) => {
      if (conteo[t.categoria] !== undefined) {
        conteo[t.categoria]++;
      }
    });
    return CATEGORIAS.map((cat, index) => ({
      name: cat,
      value: conteo[cat],
      color: Object.values(COLORES)[index % Object.values(COLORES).length]
    })).filter(d => d.value > 0);
  }, [ticketsGrafico3]);
  
  // =============================================
  // GRÁFICO 4: Tickets por Subcategoría
  // =============================================
  const ticketsGraficoSubcategorias = useMemo(() => {
    let filtrados = [...ticketsFiltradosGlobal];
    if (filtroAreaGrafico4 !== 'todas') {
      filtrados = filtrados.filter((t: any) => {
        const solicitante = usuarios.find((u: any) => u.id === t.solicitanteId);
        return solicitante?.area === filtroAreaGrafico4;
      });
    }
    return filtrados;
  }, [ticketsFiltradosGlobal, filtroAreaGrafico4, usuarios]);
  
  const datosPorSubcategoria = useMemo(() => {
    const conteo: Record<string, number> = {};
    TODAS_LAS_SUBCATEGORIAS.forEach(subcat => { conteo[subcat] = 0; });
    ticketsGraficoSubcategorias.forEach((t: any) => {
      let subcat = t.subcategoria;
      if (!subcat && t.titulo) {
        const partes = t.titulo.split(' - ');
        if (partes.length > 1) {
          const posibleSubcat = partes[partes.length - 1].trim();
          const encontrada = TODAS_LAS_SUBCATEGORIAS.find(s =>
            s.toLowerCase() === posibleSubcat.toLowerCase()
          );
          subcat = encontrada || posibleSubcat;
        }
      }
      if (subcat && conteo[subcat] !== undefined) {
        conteo[subcat]++;
      } else if (subcat) {
        if (!conteo[subcat]) conteo[subcat] = 0;
        conteo[subcat]++;
      }
    });
    const subcategoriasConDatos = Object.keys(conteo).filter(subcat => conteo[subcat] > 0);
    const coloresUnicos = generarColoresAdicionales(subcategoriasConDatos.length);
    return subcategoriasConDatos
      .map((subcat, index) => ({
        name: subcat,
        value: conteo[subcat],
        color: coloresUnicos[index]
      }))
      .sort((a, b) => b.value - a.value);
  }, [ticketsGraficoSubcategorias]);
  
  // =============================================
  // GRÁFICO 5: Top 15 Usuarios
  // =============================================
  const datosPorUsuarioTotal = useMemo(() => {
    const conteo: Record<string, any> = {};
    ticketsFiltradosGlobal.forEach((t: any) => {
      const solicitante = usuarios.find((u: any) => u.id === t.solicitanteId);
      if (solicitante) {
        const nombreCompleto = `${solicitante.nombre} ${solicitante.apellidos}`;
        if (!conteo[nombreCompleto]) {
          conteo[nombreCompleto] = { name: nombreCompleto, total: 0 };
        }
        conteo[nombreCompleto].total++;
      }
    });
    const usuariosOrdenados = Object.values(conteo)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 15);
    const coloresUsuarios = generarColoresAdicionales(usuariosOrdenados.length);
    return usuariosOrdenados.map((d: any, i: number) => ({
      ...d,
      color: coloresUsuarios[i]
    }));
  }, [ticketsFiltradosGlobal, usuarios]);
  
  // =============================================
  // GRÁFICO 6: Encuestas por Área
  // =============================================
  const datosEncuestasPorArea = useMemo(() => {
    const datos: Record<string, any> = {};
    AREAS.forEach(area => {
      datos[area] = { name: area.length > 15 ? area.substring(0, 15) + '...' : area, fullName: area, enviadas: 0 };
    });
    ticketsFiltradosGlobal.forEach((t: any) => {
      if (['resuelto', 'cerrado'].includes(t.estado)) {
        const solicitante = usuarios.find((u: any) => u.id === t.solicitanteId);
        if (solicitante && datos[solicitante.area]) {
          datos[solicitante.area].enviadas++;
        }
      }
    });
    const areasConDatos = AREAS.filter(area => datos[area].enviadas > 0);
    const coloresAreas = generarColoresAdicionales(areasConDatos.length);
    areasConDatos.forEach((area, index) => {
      datos[area].color = coloresAreas[index];
    });
    if (filtroAreaGrafico6 !== 'todas') {
      return AREAS.filter(area => area === filtroAreaGrafico6).map(area => datos[area]).filter(d => d && d.enviadas > 0);
    }
    return AREAS.map(area => datos[area]).filter(d => d && d.enviadas > 0);
  }, [ticketsFiltradosGlobal, usuarios, filtroAreaGrafico6]);
  
  // =============================================
  // GRÁFICO 7: Tasa de Plenitud
  // =============================================
  const datosTasaEncuestas = useMemo(() => {
    const enviadas = ticketsFiltradosGlobal.filter((t: any) => ['resuelto', 'cerrado'].includes(t.estado)).length;
    const completadas = ticketsFiltradosGlobal.filter((t: any) => t.encuestaCompletada === true).length;
    const pendientes = enviadas - completadas;
    return [
      { name: 'Completadas', value: completadas, color: COLORES.verde },
      { name: 'Pendientes', value: pendientes, color: COLORES.rojo }
    ];
  }, [ticketsFiltradosGlobal]);
  
  // =============================================
  // ✅ GRÁFICO 8: Estado de Tickets por Áreas (Barras Apiladas)
  // =============================================
  const ticketsGrafico8 = useMemo(() => {
    let filtrados = [...ticketsFiltradosGlobal];
    if (filtroAreaGrafico8 !== 'todas') {
      filtrados = filtrados.filter((t: any) => {
        const solicitante = usuarios.find((u: any) => u.id === t.solicitanteId);
        return solicitante?.area === filtroAreaGrafico8;
      });
    }
    return filtrados;
  }, [ticketsFiltradosGlobal, filtroAreaGrafico8, usuarios]);
  
  const datosEstadoPorArea = useMemo(() => {
    const datos: Record<string, Record<string, number>> = {};
    const estados = ['nuevo', 'asignado', 'planificado', 'resuelto', 'cerrado'];
    
    AREAS.forEach(area => {
      datos[area] = {};
      estados.forEach(e => { datos[area][e] = 0; });
    });
    
    ticketsGrafico8.forEach((t: any) => {
      const solicitante = usuarios.find((u: any) => u.id === t.solicitanteId);
      if (solicitante && datos[solicitante.area] && datos[solicitante.area][t.estado] !== undefined) {
        datos[solicitante.area][t.estado]++;
      }
    });
    
    return AREAS.map(area => ({
      name: area.length > 15 ? area.substring(0, 15) + '...' : area,
      fullName: area,
      nuevo: datos[area].nuevo,
      asignado: datos[area].asignado,
      planificado: datos[area].planificado,
      resuelto: datos[area].resuelto,
      cerrado: datos[area].cerrado,
      total: Object.values(datos[area]).reduce((a: number, b: number) => a + b, 0)
    })).filter(d => d.total > 0);
  }, [ticketsGrafico8, usuarios]);
  
  // =============================================
  // TABLA: Resumen por Usuarios (TODOS LOS USUARIOS)
  // =============================================
  const datosResumenPorUsuario = useMemo(() => {
    const usuariosConTickets: Record<string, any> = {};
    usuarios.forEach((u: any) => {
      const nombreCompleto = `${u.nombre} ${u.apellidos}`;
      usuariosConTickets[nombreCompleto] = {
        id: u.id,
        nombre: nombreCompleto,
        area: u.area,
        rol: u.rol,
        categorias: {} as Record<string, number>,
        total: 0
      };
      CATEGORIAS.forEach(cat => {
        usuariosConTickets[nombreCompleto].categorias[cat] = 0;
      });
    });
    ticketsFiltradosGlobal.forEach((t: any) => {
      const solicitante = usuarios.find((u: any) => u.id === t.solicitanteId);
      if (solicitante && usuariosConTickets[solicitante.nombre + ' ' + solicitante.apellidos]) {
        const usuarioData = usuariosConTickets[solicitante.nombre + ' ' + solicitante.apellidos];
        if (t.categoria && usuarioData.categorias[t.categoria] !== undefined) {
          usuarioData.categorias[t.categoria]++;
        }
        usuarioData.total++;
      }
    });
    return Object.values(usuariosConTickets)
      .sort((a: any, b: any) => b.total - a.total);
  }, [ticketsFiltradosGlobal, usuarios]);
  
  const recargarDatos = async () => {
    setCargando(true);
    await ticketStore.cargarTickets();
    await useAuthStore.getState().cargarUsuarios();
    setCargando(false);
  };
  
  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: COLORES.verde }} />
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* HEADER CON FILTROS GLOBALES Y EXPORTAR */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard General</h1>
            <p className="text-gray-500 mt-1">Vista administrativa - Banco de Alimentos Perú</p>
          </div>
          <button onClick={recargarDatos} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
        
        {/* FILTROS GLOBALES + EXPORTAR */}
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-4 border border-emerald-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-gray-700">Filtros Globales:</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filtroMesGlobal}
                onChange={(e) => setFiltroMesGlobal(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="todos">Todos los meses</option>
                {MESES.map((mes, index) => (
                  <option key={index} value={index}>{mes}</option>
                ))}
              </select>
              
              <select
                value={filtroAnioGlobal}
                onChange={(e) => setFiltroAnioGlobal(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value={-1}>Todos los años</option>
                {ANIOS.map(anio => (
                  <option key={anio} value={anio}>{anio}</option>
                ))}
              </select>
              
              <button
                onClick={() => exportarAExcel(ticketStore.tickets, usuarios, filtroMesGlobal, filtroAnioGlobal)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:shadow-lg transition-all"
                style={{ backgroundColor: COLORES.verde }}
              >
                <Download className="w-4 h-4" />
                Exportar a Excel
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* TARJETAS DE RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#fbe066' }}>
              <Clock className="w-6 h-6 text-gray-800" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Nuevos</p>
              <p className="text-2xl font-bold text-gray-800">{datosPorEstado.find(e => e.name === 'Nuevo')?.value || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b82f6' }}>
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Asignados</p>
              <p className="text-2xl font-bold text-gray-800">{datosPorEstado.find(e => e.name === 'Asignado')?.value || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#22c55e' }}>
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Resueltos</p>
              <p className="text-2xl font-bold text-gray-800">{datosPorEstado.find(e => e.name === 'Resuelto')?.value || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#6b7280' }}>
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Cerrados</p>
              <p className="text-2xl font-bold text-gray-800">{datosPorEstado.find(e => e.name === 'Cerrado')?.value || 0}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* GRÁFICO 1: Tickets por Estado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Ticket className="w-5 h-5" style={{ color: COLORES.verde }} />
            Tickets por Estado
          </h3>
          <select value={filtroEstadoGrafico1} onChange={(e) => setFiltroEstadoGrafico1(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
            <option value="todos">Todos los estados</option>
            {['nuevo', 'asignado', 'planificado', 'resuelto', 'cerrado'].map(e => (
              <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosPorEstado}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {datosPorEstado.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* GRÁFICO 2: Tickets por Área */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Building2 className="w-5 h-5" style={{ color: COLORES.verde }} />
            Tickets por Área
          </h3>
          <select value={filtroAreaGrafico2} onChange={(e) => setFiltroAreaGrafico2(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
            <option value="todas">Todas las áreas</option>
            {AREAS.map(area => (<option key={area} value={area}>{area}</option>))}
          </select>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosPorArea} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {datosPorArea.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* GRÁFICO 3: Tickets por Categoría */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Tag className="w-5 h-5" style={{ color: COLORES.verde }} />
            Tickets por Categoría
          </h3>
          <select value={filtroAreaGrafico3} onChange={(e) => setFiltroAreaGrafico3(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
            <option value="todas">Todas las áreas</option>
            {AREAS.map(area => (<option key={area} value={area}>{area}</option>))}
          </select>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosPorCategoria}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {datosPorCategoria.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* GRÁFICO 4: Tickets por Subcategoría */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Layers className="w-5 h-5" style={{ color: COLORES.verde }} />
            Tickets por Subcategoría
          </h3>
          <select
            value={filtroAreaGrafico4}
            onChange={(e) => setFiltroAreaGrafico4(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="todas">Todas las áreas</option>
            {AREAS.map(area => (<option key={area} value={area}>{area}</option>))}
          </select>
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={datosPorSubcategoria}
              layout="vertical"
              margin={{ left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 9 }}
                width={50}
                interval={0}
              />
              <Tooltip />
              <Bar dataKey="value" name="Tickets" radius={[0, 4, 4, 0]}>
                {datosPorSubcategoria.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* GRÁFICO 5: Top 15 Usuarios */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: COLORES.verde }} />
            Top 15 Usuarios por Total de Tickets
          </h3>
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosPorUsuarioTotal} layout="vertical" margin={{ left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={80} />
              <Tooltip />
              <Bar dataKey="total" name="Total Tickets" radius={[0, 4, 4, 0]}>
                {datosPorUsuarioTotal.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* GRÁFICO 6: Encuestas por Área */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <FileCheck className="w-5 h-5" style={{ color: COLORES.verde }} />
            Encuestas por Área
          </h3>
          <select value={filtroAreaGrafico6} onChange={(e) => setFiltroAreaGrafico6(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
            <option value="todas">Todas las áreas</option>
            {AREAS.map(area => (<option key={area} value={area}>{area}</option>))}
          </select>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={datosEncuestasPorArea} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="enviadas" nameKey="name" label={(entry: any) => `${entry.name}: ${entry.enviadas}`}>
                {datosEncuestasPorArea.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* GRÁFICO 7: Tasa de Completitud */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5" style={{ color: COLORES.verde }} />
          Tasa de Completitud
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={datosTasaEncuestas} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" nameKey="name" label={(entry: any) => `${entry.name}: ${entry.value}`}>
                  {datosTasaEncuestas.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col justify-center space-y-4">
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#ecfdf5' }}>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8" style={{ color: COLORES.verde }} />
                <div>
                  <p className="text-sm text-gray-600">Completadas</p>
                  <p className="text-2xl font-bold" style={{ color: COLORES.verde }}>{datosTasaEncuestas[0]?.value || 0}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#fef2f2' }}>
              <div className="flex items-center gap-3">
                <FileX className="w-8 h-8" style={{ color: COLORES.rojo }} />
                <div>
                  <p className="text-sm text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold" style={{ color: COLORES.rojo }}>{datosTasaEncuestas[1]?.value || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* ✅ GRÁFICO 8: Estado de Tickets por Áreas (Barras Apiladas) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Layers className="w-5 h-5" style={{ color: COLORES.verde }} />
            Estado de Tickets por Áreas
          </h3>
          <select
            value={filtroAreaGrafico8}
            onChange={(e) => setFiltroAreaGrafico8(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="todas">Todas las áreas</option>
            {AREAS.map(area => (<option key={area} value={area}>{area}</option>))}
          </select>
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={datosEstadoPorArea}
              layout="vertical"
              margin={{ left: 20, right: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 10 }}
                width={120}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload) return null;
                  const area = payload[0]?.payload?.fullName || label;
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-sm">
                      <p className="font-bold text-gray-800 mb-2">{area}</p>
                      {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }}>
                          {entry.name}: <strong>{entry.value}</strong>
                        </p>
                      ))}
                      <p className="mt-2 pt-2 border-t text-gray-600">
                        Total: <strong>{payload.reduce((sum: number, e: any) => sum + e.value, 0)}</strong>
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="nuevo" name="Nuevo" stackId="a" fill={COLORES_ESTADOS.nuevo} radius={[0, 4, 4, 0]} />
              <Bar dataKey="asignado" name="Asignado" stackId="a" fill={COLORES_ESTADOS.asignado} />
              <Bar dataKey="planificado" name="Planificado" stackId="a" fill={COLORES_ESTADOS.planificado} />
              <Bar dataKey="resuelto" name="Resuelto" stackId="a" fill={COLORES_ESTADOS.resuelto} />
              <Bar dataKey="cerrado" name="Cerrado" stackId="a" fill={COLORES_ESTADOS.cerrado} radius={[4, 0, 0, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Leyenda */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t">
          {Object.entries(COLORES_ESTADOS).map(([estado, color]) => (
            <div key={estado} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-600 capitalize">{estado}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* TABLA RESUMEN: ÁREAS × CATEGORÍA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">Resumen: TODAS las Áreas × Categoría</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200" style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Área</th>
                {CATEGORIAS.map(cat => (
                  <th key={cat} className="text-center px-3 py-3 font-medium text-gray-600">{cat}</th>
                ))}
                <th className="text-center px-4 py-3 font-medium text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {AREAS.map((area) => {
                const totalArea = CATEGORIAS.reduce((sum, cat) =>
                  sum + ticketsFiltradosGlobal.filter((t: any) => {
                    const solicitante = usuarios.find((u: any) => u.id === t.solicitanteId);
                    return solicitante?.area === area && t.categoria === cat;
                  }).length, 0);
                
                return (
                  <tr key={area} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{area}</td>
                    {CATEGORIAS.map((cat) => {
                      const count = ticketsFiltradosGlobal.filter((t: any) => {
                        const solicitante = usuarios.find((u: any) => u.id === t.solicitanteId);
                        return solicitante?.area === area && t.categoria === cat;
                      }).length;
                      
                      return (
                        <td key={cat} className="px-3 py-3 text-center">
                          {count > 0 ? (
                            <span className="px-2 py-1 rounded text-xs font-medium text-white" style={{ backgroundColor: COLORES_CATEGORIAS_TABLA[cat] }}>
                              {count}
                            </span>
                          ) : <span className="text-gray-400">0</span>}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center font-semibold" style={{ color: COLORES.verde }}>{totalArea}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* TABLA: RESUMEN POR USUARIOS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: COLORES.verde }} />
            Resumen: TODOS los Usuarios × Categorías
          </h3>
          <p className="text-sm text-gray-500 mt-1">Detalle individual de tickets por usuario (incluye usuarios sin tickets)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-gray-200" style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 sticky left-0 bg-gray-50">Área</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 sticky left-[120px] bg-gray-50">Usuario</th>
                <th className="text-center px-3 py-3 font-medium text-gray-600">Rol</th>
                {CATEGORIAS.map(cat => (
                  <th key={cat} className="text-center px-2 py-3 font-medium text-gray-600 min-w-[80px]">{cat}</th>
                ))}
                <th className="text-center px-4 py-3 font-medium text-gray-600 min-w-[80px]">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {datosResumenPorUsuario.map((usuario: any) => (
                <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white">{usuario.area}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 sticky left-[120px] bg-white">
                    <div
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={() => {
                        navigate(`/dashboard/usuario/${usuario.id}`);
                      }}
                      title={usuario.total > 0 ? "Ver detalle de tickets por subcategorías" : "Usuario sin tickets registrados"}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold transition-transform group-hover:scale-110"
                        style={{ backgroundColor: COLORES.verde }}>
                        {usuario.nombre.charAt(0)}
                      </div>
                      <span className="font-semibold underline decoration-red-300 underline-offset-2 transition-all"
                        style={{ color: COLORES.rojo }}>
                        {usuario.nombre}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      usuario.rol === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                      usuario.rol === 'administrador' ? 'bg-blue-100 text-blue-700' :
                      usuario.rol === 'supervisor' ? 'bg-orange-100 text-orange-700' :
                      usuario.rol === 'tecnico' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}
                    </span>
                  </td>
                  {CATEGORIAS.map((cat) => {
                    const count = usuario.categorias[cat] || 0;
                    return (
                      <td key={cat} className="px-2 py-3 text-center">
                        {count > 0 ? (
                          <span
                            className="px-2 py-1 rounded-md text-xs font-semibold text-white shadow-sm"
                            style={{ backgroundColor: COLORES_CATEGORIAS_TABLA[cat] }}
                            title={`${count} ticket(s) de ${cat}`}
                          >
                            {count}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: usuario.total > 0 ? COLORES.verde : '#9ca3af' }}>
                      {usuario.total}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {datosResumenPorUsuario.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No hay usuarios registrados en el sistema</p>
          </div>
        )}
      </div>
    </div>
  );
}