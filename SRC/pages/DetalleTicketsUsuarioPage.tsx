// =============================================
// PÁGINA: DETALLE DE TICKETS POR USUARIO
// Historial completo de tickets de un colaborador
// Sistema de Gestión de Tickets - BAP
// =============================================

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import * as XLSX from 'xlsx';
import {
  ArrowLeft, Search, Download, Eye, FileText,
  Filter, AlertCircle, RefreshCw, ThumbsUp, ThumbsDown,
  ChevronLeft, ChevronRight, Clock, Calendar, User
} from 'lucide-react';

// =============================================
// TIPOS
// =============================================
interface Ticket {
  id: string;
  titulo: string;
  tecnico?: string;
  prioridad: 'baja' | 'media' | 'alta' | 'muy_alta';
  categoria: string;
  fecha_apertura: string;
  tiempo_solucion?: string;
  tiempo_estimado?: string;
  tiempo_cierre?: string;
  fecha_cierre?: string;
  encuesta_completada: boolean;
  estado: string;
}

interface UsuarioInfo {
  id: string;
  nombre: string;
  apellidos: string;
  area: string;
}

// =============================================
// COMPONENTE PRINCIPAL
// =============================================
export default function DetalleTicketsUsuarioPage() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  
  const usuarioId = userId || searchParams.get('usuario');

  const [usuario, setUsuario] = useState<UsuarioInfo | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroMes, setFiltroMes] = useState<string>('todos');
  const [filtroAnio, setFiltroAnio] = useState<string>('todos');
  const [exportando, setExportando] = useState(false);
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPorPagina, setFilasPorPagina] = useState(15);

  // =============================================
  // CARGAR DATOS
  // =============================================
  const cargarDatos = async () => {
    if (!usuarioId) return;
    
    setCargando(true);
    try {
      // 1. Cargar información del usuario
      const { data: usuarioData, error: errorUsuario } = await supabase
        .from('usuarios')
        .select('id, nombre, apellidos, area')
        .eq('id', usuarioId)
        .single();

      if (errorUsuario) throw errorUsuario;
      setUsuario(usuarioData);

      // 2. Cargar tickets del usuario
      let query = supabase
        .from('tickets')
        .select('*')
        .eq('solicitante_id', usuarioId)
        .order('fecha_apertura', { ascending: false });

      // Aplicar filtros de período
      if (filtroAnio !== 'todos') {
        const inicioAnio = `${filtroAnio}-01-01`;
        const finAnio = `${filtroAnio}-12-31`;
        query = query.gte('fecha_apertura', inicioAnio).lte('fecha_apertura', finAnio);
      }

      if (filtroMes !== 'todos' && filtroAnio !== 'todos') {
        const mesNum = parseInt(filtroMes);
        const inicioMes = `${filtroAnio}-${String(mesNum).padStart(2, '0')}-01`;
        const finMes = new Date(parseInt(filtroAnio), mesNum, 0).toISOString().split('T')[0];
        query = query.gte('fecha_apertura', inicioMes).lte('fecha_apertura', finMes);
      }

      const { data: ticketsData, error: errorTickets } = await query;

      if (errorTickets) throw errorTickets;

      // Transformar datos
      const ticketsTransformados: Ticket[] = (ticketsData || []).map(t => ({
        id: t.id || `BAP-${String(t.id).padStart(4, '0')}`,
        titulo: t.titulo || t.descripcion || 'Sin título',
        tecnico: t.tecnico_nombre || t.tecnico_id || 'Sin asignar',
        prioridad: t.prioridad || 'media',
        categoria: t.categoria || 'General',
        fecha_apertura: t.fecha_apertura || t.created_at,
        tiempo_solucion: t.tiempo_solucion,
        tiempo_estimado: t.tiempo_estimado,
        tiempo_cierre: t.tiempo_cierre,
        fecha_cierre: t.fecha_cierre,
        encuesta_completada: t.encuesta_completada || false,
        estado: t.estado
      }));

      setTickets(ticketsTransformados);
      setPaginaActual(1);
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('❌ Error al cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [usuarioId, filtroMes, filtroAnio]);

  // =============================================
  // FILTRADO Y BÚSQUEDA
  // =============================================
  const ticketsFiltrados = useMemo(() => {
    return tickets.filter(t => {
      const q = busqueda.toLowerCase().trim();
      if (!q) return true;
      return (
        t.id.toLowerCase().includes(q) ||
        t.titulo.toLowerCase().includes(q)
      );
    });
  }, [tickets, busqueda]);

  // =============================================
  // PAGINACIÓN
  // =============================================
  const totalPaginas = Math.ceil(ticketsFiltrados.length / filasPorPagina);
  const inicio = (paginaActual - 1) * filasPorPagina;
  const fin = inicio + filasPorPagina;
  const ticketsPaginados = ticketsFiltrados.slice(inicio, fin);

  // =============================================
  // 📊 EXPORTAR A EXCEL - MISMAS COLUMNAS DE LA TABLA (sin Acciones)
  // =============================================
  const exportarAExcel = () => {
    setExportando(true);
    try {
      // ✅ MISMAS COLUMNAS QUE LA TABLA (excepto Acciones)
      const datosParaExcel = ticketsFiltrados.map(t => ({
        'ID': `#${t.id}`,
        'Título': t.titulo,
        'Técnico': t.tecnico || 'Sin asignar',
        'Prioridad': t.prioridad.charAt(0).toUpperCase() + t.prioridad.slice(1).replace('_', ' '),
        'Categoría': t.categoria,
        'Fecha de Apertura': new Date(t.fecha_apertura).toLocaleString('es-PE'),
        'Tiempo de Solución': t.tiempo_solucion || 'N/A',
        'Tiempo Estimado': t.tiempo_estimado || 'N/A',
        'Tiempo de Cierre': t.tiempo_cierre || 'N/A',
        'Fecha de Cierre': t.fecha_cierre 
          ? new Date(t.fecha_cierre).toLocaleString('es-PE') 
          : 'N/A',
        'Encuesta Completada': t.encuesta_completada ? 'Sí' : 'No'
      }));

      // Si no hay datos, igual exportar con encabezados
      if (datosParaExcel.length === 0) {
        const encabezados = [
          'ID', 'Título', 'Técnico', 'Prioridad', 'Categoría',
          'Fecha de Apertura', 'Tiempo de Solución', 'Tiempo Estimado',
          'Tiempo de Cierre', 'Fecha de Cierre', 'Encuesta Completada'
        ];
        const filaVacia: any = {};
        encabezados.forEach(e => filaVacia[e] = '');
        datosParaExcel.push(filaVacia);
      }

      const ws = XLSX.utils.json_to_sheet(datosParaExcel);

      // Anchos de columnas
      ws['!cols'] = [
        { wch: 15 },  // ID
        { wch: 40 },  // Título
        { wch: 20 },  // Técnico
        { wch: 12 },  // Prioridad
        { wch: 15 },  // Categoría
        { wch: 22 },  // Fecha Apertura
        { wch: 18 },  // Tiempo Solución
        { wch: 18 },  // Tiempo Estimado
        { wch: 18 },  // Tiempo Cierre
        { wch: 22 },  // Fecha Cierre
        { wch: 20 },  // Encuesta
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Tickets del Usuario');

      const fechaFiltro = filtroMes !== 'todos' || filtroAnio !== 'todos'
        ? `_${filtroAnio !== 'todos' ? filtroAnio : ''}${filtroMes !== 'todos' ? `-${filtroMes.padStart(2, '0')}` : ''}`
        : '';

      const nombreUsuario = usuario ? `${usuario.nombre}_${usuario.apellidos}`.replace(/\s+/g, '_') : 'usuario';
      const fileName = `Tickets_${nombreUsuario}${fechaFiltro}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      XLSX.writeFile(wb, fileName);

      if (ticketsFiltrados.length === 0) {
        alert('⚠️ No hay tickets con los filtros seleccionados.\n\nSe exportó un archivo con los encabezados.');
      } else {
        alert(`✅ Exportado correctamente: ${datosParaExcel.length} tickets\n\nArchivo: ${fileName}`);
      }
    } catch (error) {
      console.error('Error exportando:', error);
      alert('❌ Error al exportar los datos a Excel');
    } finally {
      setExportando(false);
    }
  };

  // =============================================
  // OPCIONES DE FILTROS
  // =============================================
  const meses = [
    { value: '1', label: 'Enero' }, { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' }, { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' }, { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' }, { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' }, { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' },
  ];

  const aniosDisponibles = useMemo(() => {
    const anioActual = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => anioActual - i);
  }, []);

  // =============================================
  // COLORES DE PRIORIDAD
  // =============================================
  const colorPrioridad = (prioridad: string) => {
    switch (prioridad) {
      case 'baja': return '#73c59b';
      case 'media': return '#3b82f6';
      case 'alta': return '#f59e0b';
      case 'muy_alta': return '#e84545';
      default: return '#6b7280';
    }
  };

  // =============================================
  // RENDER
  // =============================================
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Volver"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {usuario ? `${usuario.nombre} ${usuario.apellidos}` : 'Cargando...'}
            </h1>
            <p className="text-gray-500 text-sm">
              Área: <span className="font-semibold" style={{ color: '#73c59b' }}>
                {usuario?.area || 'Cargando...'}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportarAExcel}
            disabled={exportando}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:shadow-lg transition-all disabled:opacity-50"
            style={{ backgroundColor: '#73c59b' }}
          >
            <Download className={`w-5 h-5 ${exportando ? 'animate-spin' : ''}`} />
            {exportando ? 'Exportando...' : 'Exportar a Excel'}
          </button>
          {/* ✅ AHORA LLEVA A UsuarioDetallePage (módulo existente) */}
          <button
            onClick={() => navigate(`/dashboard/usuario/${usuarioId}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
          >
            <FileText className="w-5 h-5" />
            Ver detalles
          </button>
        </div>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por ID o título..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none"
              onFocus={(e) => e.target.style.borderColor = '#73c59b'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filtroMes}
              onChange={e => setFiltroMes(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none min-w-[160px]"
              onFocus={(e) => e.target.style.borderColor = '#73c59b'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            >
              <option value="todos">Todos los Meses</option>
              {meses.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <select
            value={filtroAnio}
            onChange={e => setFiltroAnio(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none min-w-[140px]"
            onFocus={(e) => e.target.style.borderColor = '#73c59b'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          >
            <option value="todos">Todos los Años</option>
            {aniosDisponibles.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <button
            onClick={cargarDatos}
            disabled={cargando}
            className="p-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* TABLA DE TICKETS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase">ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase">Título</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase">Técnico</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-600 uppercase">Prioridad</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase">Categoría</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-600 uppercase">Fecha Apertura</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-600 uppercase">Tiempo Solución</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-600 uppercase">Tiempo Estimado</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-600 uppercase">Tiempo Cierre</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-600 uppercase">Fecha Cierre</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-600 uppercase">Encuesta</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <RefreshCw className="w-8 h-8 animate-spin" />
                      <p>Cargando tickets...</p>
                    </div>
                  </td>
                </tr>
              ) : ticketsPaginados.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <AlertCircle className="w-12 h-12" />
                      <p className="text-lg font-medium">No se encontraron tickets</p>
                      <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                    </div>
                  </td>
                </tr>
              ) : (
                ticketsPaginados.map(ticket => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold text-gray-800">
                        #{ticket.id}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-800 font-medium line-clamp-2">
                        {ticket.titulo}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <User className="w-4 h-4 text-gray-400" />
                        {ticket.tecnico}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: colorPrioridad(ticket.prioridad) }}
                      >
                        {ticket.prioridad.charAt(0).toUpperCase() + ticket.prioridad.slice(1).replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{ticket.categoria}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="text-xs text-gray-600">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {new Date(ticket.fecha_apertura).toLocaleDateString('es-PE', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                        <br />
                        <span className="text-gray-400">
                          {new Date(ticket.fecha_apertura).toLocaleTimeString('es-PE', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="inline-flex items-center gap-1 text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded">
                        <Clock className="w-3 h-3" />
                        {ticket.tiempo_solucion || 'N/A'}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="inline-flex items-center gap-1 text-xs text-gray-600 bg-amber-50 px-2 py-1 rounded">
                        <Clock className="w-3 h-3" />
                        {ticket.tiempo_estimado || 'N/A'}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="inline-flex items-center gap-1 text-xs text-gray-600 bg-purple-50 px-2 py-1 rounded">
                        <Clock className="w-3 h-3" />
                        {ticket.tiempo_cierre || 'N/A'}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="text-xs text-gray-600">
                        {ticket.fecha_cierre ? (
                          <>
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(ticket.fecha_cierre).toLocaleDateString('es-PE', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {ticket.encuesta_completada ? (
                        <div className="inline-flex items-center gap-1 text-green-600">
                          <ThumbsUp className="w-4 h-4" />
                          <span className="text-xs font-medium">Sí</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-gray-400">
                          <ThumbsDown className="w-4 h-4" />
                          <span className="text-xs">No</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/tickets/${ticket.id}`);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Mostrar:</span>
            <select
              value={filasPorPagina}
              onChange={(e) => {
                setFilasPorPagina(parseInt(e.target.value));
                setPaginaActual(1);
              }}
              className="px-2 py-1 border border-gray-300 rounded text-sm bg-white focus:outline-none"
            >
              <option value={15}>15 filas</option>
              <option value={30}>30 filas</option>
              <option value={50}>50 filas</option>
              <option value={100}>100 filas</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            Mostrando {ticketsFiltrados.length > 0 ? inicio + 1 : 0} - {Math.min(fin, ticketsFiltrados.length)} de {ticketsFiltrados.length}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">
              Página {paginaActual} de {totalPaginas || 1}
            </span>
            <button
              onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual === totalPaginas || totalPaginas === 0}
              className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* PIE DE PÁGINA */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Nota:</strong> Este módulo es de solo lectura. Haz clic en cualquier fila o en el botón "Ver" para acceder al detalle completo del ticket.
          </span>
        </p>
      </div>
    </div>
  );
}