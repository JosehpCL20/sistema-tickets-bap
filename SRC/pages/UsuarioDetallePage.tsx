// =============================================
// PÁGINA: DETALLE DE USUARIO
// Sistema de Gestión de Tickets - Banco de Alimentos Perú
// =============================================
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuthStore } from '../store/authStore';
import { useTicketStore } from '../store/ticketStore';

// COLORES
const COLORES = {
  verde: '#80c398',
  amarillo: '#fbe066',
  rojo: '#ea4c5b',
  azul: '#6ab088',
  naranja: '#f5a623',
  morado: '#a855f7',
  cyan: '#06b6d4'
};

const CATEGORIAS = ['Hardware', 'Software', 'Redes', 'Accesos', 'Impresoras', 'Correo', 'Reportes', 'Otros'];

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

const SUBCATEGORIAS_POR_CATEGORIA: Record<string, string[]> = {
  'Hardware': ['Computadora no enciende', 'Pantalla azul / errores de sistema', 'Computadora muy lenta', 'Teclado o mouse no funciona', 'Monitor no da imagen', 'Ruido extraño en la PC', 'Sobrecalentamiento', 'Disco duro lleno', 'Memoria RAM insuficiente', 'Otro problema de hardware'],
  'Software': ['No puedo abrir SAP', 'Error al ingresar a SAP', 'SAP muy lento', 'No puedo descargar reportes de SAP', 'Error en módulo de SAP', 'Excel no funciona correctamente', 'Word/PowerPoint con errores', 'Necesito instalar un programa', 'Actualización de software', 'Licencia de software vencida', 'Programa se cierra inesperadamente', 'Otro problema de software'],
  'Redes': ['No tengo internet', 'Internet muy lento', 'WiFi no conecta', 'Conexión intermitente', 'No puedo acceder a la red interna', 'VPN no funciona', 'Cable de red dañado', 'No puedo acceder a carpetas compartidas', 'Problemas con el router', 'Otro problema de red'],
  'Accesos': ['Olvidé mi contraseña', 'Mi cuenta está bloqueada', 'No tengo acceso a SAP', 'Necesito permisos adicionales', 'Error de autenticación', 'Token de seguridad no funciona', 'Acceso denegado a sistema', 'Necesito crear usuario nuevo', 'Cambiar correo electrónico', 'Otro problema de acceso'],
  'Impresoras': ['Impresora no imprime', 'Impresión muy lenta', 'Impresión borrosa o con rayas', 'Atasco de papel', 'No se detecta la impresora', 'Error de driver de impresora', 'Impresora sin tóner/tinta', 'Escáner no funciona', 'Configurar impresora en red', 'Otro problema de impresora'],
  'Correo': ['No puedo enviar correos', 'No recibo correos', 'Outlook no funciona', 'Buzón lleno', 'Error al adjuntar archivos', 'Correo va a spam', 'No puedo acceder al webmail', 'Configurar correo en celular', 'Contraseña de correo olvidada', 'Otro problema de correo'],
  'Reportes': ['No puedo descargar reportes', 'Reporte sale en blanco', 'Error al generar reporte', 'Reporte con datos incorrectos', 'Reporte muy lento', 'No encuentro un reporte', 'Necesito un reporte personalizado', 'Exportar a Excel/PDF no funciona', 'Filtros de reporte no funcionan', 'Otro problema con reportes'],
  'Otros': ['Capacitación en sistema', 'Solicitud de equipo nuevo', 'Mantenimiento preventivo', 'Consulta general', 'Sugerencia de mejora', 'Otro (especificar en descripción)']
};

const COLORES_CATEGORIAS_TABLA: Record<string, string> = {
  'Hardware': '#80c398', 'Software': '#fbe066', 'Redes': '#ea4c5b', 'Accesos': '#6ab088',
  'Impresoras': '#f5a623', 'Correo': '#3b82f6', 'Reportes': '#a855f7', 'Otros': '#6b7280'
};

const MESES = ['todos', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
const MESES_NOMBRES = ['Todos los meses', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const ANIOS = [2024, 2025, 2026, 2027];

// ✅ FUNCIÓN EXPORTAR A EXCEL - CORREGIDA PARA IDs NUMÉRICOS
const exportarAExcel = (
  tickets: any[],
  usuarios: any[],
  filtroMes: string,
  filtroAnio: number,
  usuarioDetalle: any
) => {
  const wb = XLSX.utils.book_new();
  
  const obtenerNombreMes = (mes: string) => {
    if (mes === 'todos') return 'Todos';
    const index = parseInt(mes);
    if (isNaN(index) || index < 0 || index > 11) return mes;
    const mesesNombres = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return mesesNombres[index];
  };
  
  const obtenerNombreAnio = (anio: number) => anio === -1 ? 'Todos' : anio.toString();
  
  // Filtrar tickets
  const ticketsFiltrados = tickets.filter((t: any) => {
    // ✅ Comparar como strings o numbers según corresponda
    if (String(t.solicitanteId) !== String(usuarioDetalle?.id)) return false;
    const fecha = new Date(t.fechaCreacion);
    const cumpleAnio = filtroAnio === -1 || fecha.getFullYear() === filtroAnio;
    const cumpleMes = filtroMes === 'todos' || fecha.getMonth() === parseInt(filtroMes);
    return cumpleAnio && cumpleMes;
  });
  
  // Extraer subcategoría
  const obtenerSubcategoria = (t: any) => {
    if (t.subcategoria && t.subcategoria.trim() !== '') return t.subcategoria.trim();
    if (t.titulo) {
      const partes = t.titulo.split(' - ');
      if (partes.length > 1) {
        const posibleSubcat = partes[partes.length - 1].trim();
        const encontrada = TODAS_LAS_SUBCATEGORIAS.find(s =>
          s.toLowerCase() === posibleSubcat.toLowerCase()
        );
        if (encontrada) return encontrada;
      }
    }
    return 'Sin subcategoría';
  };
  
  // HOJA 1: RESUMEN POR CATEGORÍAS
  const datosHoja1: any[][] = [];
  
  datosHoja1.push(['REPORTE DE TICKETS - BANCO DE ALIMENTOS PERÚ']);
  datosHoja1.push(['Usuario:', usuarioDetalle?.nombre || 'N/A', '', 'Mes:', obtenerNombreMes(filtroMes)]);
  datosHoja1.push(['Área:', usuarioDetalle?.area || 'N/A', '', 'Año:', obtenerNombreAnio(filtroAnio)]);
  datosHoja1.push(['Total Tickets:', ticketsFiltrados.length]);
  datosHoja1.push([]);
  datosHoja1.push([]);
  
  const statsPorCategoria: Record<string, { total: number; subs: Record<string, number> }> = {};
  
  CATEGORIAS.forEach(cat => {
    statsPorCategoria[cat] = { total: 0, subs: {} };
    SUBCATEGORIAS_POR_CATEGORIA[cat].forEach(sub => {
      statsPorCategoria[cat].subs[sub] = 0;
    });
  });
  
  ticketsFiltrados.forEach((t: any) => {
    const cat = t.categoria;
    const sub = obtenerSubcategoria(t);
    
    if (cat && statsPorCategoria[cat]) {
      statsPorCategoria[cat].total++;
      if (sub && statsPorCategoria[cat].subs[sub] !== undefined) {
        statsPorCategoria[cat].subs[sub]++;
      }
    }
  });
  
  CATEGORIAS.forEach((cat, catIndex) => {
    const stats = statsPorCategoria[cat];
    const subproblemas = SUBCATEGORIAS_POR_CATEGORIA[cat];
    
    datosHoja1.push([`Categoría ${catIndex + 1}: ${cat}`]);
    
    const headers: string[] = [];
    subproblemas.forEach(sub => headers.push(sub));
    headers.push('Total');
    datosHoja1.push(headers);
    
    const filaDatos: (number | string)[] = [];
    subproblemas.forEach(sub => {
      const count = stats?.subs[sub] || 0;
      filaDatos.push(count);
    });
    filaDatos.push(stats?.total || 0);
    datosHoja1.push(filaDatos);
    
    datosHoja1.push([]);
  });
  
  const ws1 = XLSX.utils.aoa_to_sheet(datosHoja1);
  ws1['!cols'] = Array(20).fill({ wch: 25 });
  XLSX.utils.book_append_sheet(wb, ws1, 'Resumen por Categorías');
  
  // HOJA 2: DETALLE DE TICKETS
  const datosHoja2: any[][] = [];
  
  datosHoja2.push(['DETALLE DE TICKETS']);
  datosHoja2.push(['ID', 'Título', 'Categoría', 'Subcategoría', 'Estado', 'Prioridad', 'Solicitante', 'Área', 'Fecha Creación']);
  
  ticketsFiltrados.forEach((t: any) => {
    const solicitante = usuarios.find((u: any) => String(u.id) === String(t.solicitanteId));
    const subcategoriaReal = obtenerSubcategoria(t);
    
    datosHoja2.push([
      // ✅ ID como string (padding si es number)
      typeof t.id === 'number' ? String(t.id).padStart(4, '0') : t.id?.slice?.(0, 8) || t.id,
      t.titulo,
      t.categoria,
      subcategoriaReal,
      t.estado,
      t.prioridad,
      solicitante ? `${solicitante.nombre} ${solicitante.apellidos}` : 'N/A',
      solicitante?.area || 'N/A',
      new Date(t.fechaCreacion).toLocaleDateString('es-PE')
    ]);
  });
  
  const ws2 = XLSX.utils.aoa_to_sheet(datosHoja2);
  ws2['!cols'] = [
    { wch: 10 }, { wch: 50 }, { wch: 15 }, { wch: 35 },
    { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 25 }, { wch: 15 }
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Detalle de Tickets');
  
  // Descargar
  const nombreMes = obtenerNombreMes(filtroMes);
  const nombreAnio = obtenerNombreAnio(filtroAnio);
  const nombreUsuario = usuarioDetalle?.nombre?.replace(/\s+/g, '_') || 'usuario';
  const nombreArchivo = `Tickets_${nombreUsuario}_${nombreMes}_${nombreAnio}.xlsx`;
  
  XLSX.writeFile(wb, nombreArchivo);
};

// =============================================
// COMPONENTE PRINCIPAL - EXPORT DEFAULT
// =============================================
export default function UsuarioDetallePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { usuarios } = useAuthStore();
  const { tickets } = useTicketStore();
  
  const [filtroMes, setFiltroMes] = useState<string>('todos');
  const [filtroAnio, setFiltroAnio] = useState<number>(-1);

  // ENCONTRAR USUARIO
  const usuario = useMemo(() => {
    return usuarios?.find((u: any) => String(u.id) === String(userId));
  }, [usuarios, userId]);

  // FILTRAR TICKETS
  const ticketsFiltrados = useMemo(() => {
    if (!tickets || !userId) return [];
    return tickets.filter((t: any) => {
      if (String(t.solicitanteId) !== String(userId)) return false;
      const fecha = new Date(t.fechaCreacion || t.fecha_creacion);
      const cumpleAnio = filtroAnio === -1 || fecha.getFullYear() === filtroAnio;
      const cumpleMes = filtroMes === 'todos' || fecha.getMonth() === parseInt(filtroMes);
      return cumpleAnio && cumpleMes;
    });
  }, [tickets, userId, filtroMes, filtroAnio]);

  // CONTAR SUBCATEGORÍAS
  const statsPorCategoria = useMemo(() => {
    const stats: Record<string, { total: number; subs: Record<string, number> }> = {};
    
    CATEGORIAS.forEach(cat => {
      stats[cat] = { total: 0, subs: {} };
      SUBCATEGORIAS_POR_CATEGORIA[cat].forEach(sub => {
        stats[cat].subs[sub] = 0;
      });
    });
    
    ticketsFiltrados.forEach((t: any) => {
      const cat = t.categoria;
      let sub = t.subcategoria;
      
      if (!sub && t.titulo) {
        const partes = t.titulo.split(' - ');
        if (partes.length > 1) {
          const posibleSubcat = partes[partes.length - 1].trim();
          const encontrada = TODAS_LAS_SUBCATEGORIAS.find(s =>
            s.toLowerCase() === posibleSubcat.toLowerCase()
          );
          sub = encontrada || posibleSubcat;
        }
      }
      
      if (cat && stats[cat]) {
        stats[cat].total++;
        if (sub && stats[cat].subs[sub] !== undefined) {
          stats[cat].subs[sub]++;
        }
      }
    });
    
    return stats;
  }, [ticketsFiltrados]);

  const handleExportar = () => {
    if (!usuario) return;
    exportarAExcel(tickets, usuarios || [], filtroMes, filtroAnio, usuario);
  };

  if (!usuario) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-medium mb-2">Usuario no encontrado</p>
          <p className="text-sm text-yellow-600 mb-4">userId: {userId}</p>
          <button onClick={() => navigate('/dashboard')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg">
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-5 rounded-xl shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{usuario.nombre}</h1>
            <p className="text-gray-500">{usuario.area}</p>
          </div>
        </div>
        <button onClick={handleExportar} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium" style={{ backgroundColor: COLORES.verde }}>
          <Download className="w-5 h-5" />
          Exportar a Excel
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <label className="text-sm font-medium">Mes:</label>
          <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} className="border rounded px-3 py-2 text-sm">
            {MESES_NOMBRES.map((nombre, index) => (
              <option key={index} value={MESES[index]}>{nombre}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <label className="text-sm font-medium">Año:</label>
          <select value={filtroAnio} onChange={(e) => setFiltroAnio(parseInt(e.target.value))} className="border rounded px-3 py-2 text-sm">
            <option value={-1}>Todos los años</option>
            {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
          <span className="font-semibold text-green-700">Total: {ticketsFiltrados.length} tickets</span>
        </div>
      </div>

      {/* TABLAS POR CATEGORÍA */}
      <div className="space-y-5">
        {CATEGORIAS.map(cat => {
          const stats = statsPorCategoria[cat];
          const color = COLORES_CATEGORIAS_TABLA[cat];
          const subs = SUBCATEGORIAS_POR_CATEGORIA[cat];
          
          return (
            <div key={cat} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 font-bold text-lg border-b-2" style={{ backgroundColor: color + '25', color: color, borderColor: color }}>
                {cat} • Total: {stats?.total || 0}
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                  {subs.map(sub => {
                    const count = stats?.subs[sub] || 0;
                    return (
                      <div key={sub} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-sm text-gray-700 truncate mr-2" title={sub}>{sub}</span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold text-white flex-shrink-0 min-w-[28px] text-center" style={{ backgroundColor: count > 0 ? color : '#9ca3af' }}>
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {ticketsFiltrados.length === 0 && (
        <div className="bg-gray-100 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-lg">No hay tickets para este usuario en el período seleccionado</p>
        </div>
      )}
    </div>
  );
}