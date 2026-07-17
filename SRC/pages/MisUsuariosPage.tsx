// =============================================
// PÁGINA: MIS USUARIOS — Vista Supervisor
// Monitoreo de usuarios del área del supervisor
// Sistema de Gestión de Tickets - BAP
// =============================================

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/authStore';
import * as XLSX from 'xlsx';
import {
  ArrowLeft, Search, Users, Ticket, CheckCircle, Clock,
  RefreshCw, Download, Filter, AlertCircle, UserCheck,
  UserX, Send, Mail, Calendar, ExternalLink
} from 'lucide-react';

// =============================================
// TIPOS
// =============================================
interface Usuario {
  id: string;
  nombre: string;
  apellidos: string;
  correo: string;
  area: string;
  activo: boolean;
  avatar?: string;
  fecha_creacion?: string;
}

interface TicketStats {
  total: number;
  nuevos: number;
  asignados: number;
  resueltos: number;
  cerrados: number;
}

interface EncuestaStats {
  completadas: number;
  pendientes: number;
  ultimoEnvio: string | null;
}

interface UsuarioConStats extends Usuario {
  tickets: TicketStats;
  encuestas: EncuestaStats;
}

// =============================================
// COMPONENTE PRINCIPAL
// =============================================
export default function MisUsuariosPage() {
  const navigate = useNavigate();
  const usuarioActual = useAuthStore(s => s.usuarioActual);
  const [usuarios, setUsuarios] = useState<UsuarioConStats[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroMes, setFiltroMes] = useState<string>('todos');
  const [filtroAnio, setFiltroAnio] = useState<string>('todos');
  const [areaSupervisor, setAreaSupervisor] = useState<string>('');
  const [exportando, setExportando] = useState(false);

  // Datos del supervisor real logueado
  const obtenerSupervisorActual = async () => {
    return {
      id: usuarioActual?.id || '',
      area: usuarioActual?.area || '',
      organizacion: 'Banco de Alimentos Perú'
    };
  };

  // =============================================
  // CARGAR DATOS
  // =============================================
  const cargarDatos = async () => {
    setCargando(true);
    try {
      const supervisor = await obtenerSupervisorActual();
      setAreaSupervisor(supervisor.area);

      // 1. Cargar usuarios del área del supervisor
      const { data: usuariosData, error: errorUsuarios } = await supabase
        .from('users')
        .select('*')
        .eq('area', supervisor.area)
        .order('nombre');

      if (errorUsuarios) throw errorUsuarios;

      // 2. Para cada usuario, cargar sus estadísticas
      const usuariosConStats: UsuarioConStats[] = await Promise.all(
        (usuariosData || []).map(async (usuario) => {
          const ticketsStats = await obtenerStatsTickets(usuario.id);
          const encuestasStats = await obtenerStatsEncuestas(usuario.id);

          return {
            ...usuario,
            tickets: ticketsStats,
            encuestas: encuestasStats
          };
        })
      );

      setUsuarios(usuariosConStats);
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('❌ Error al cargar los datos de usuarios');
    } finally {
      setCargando(false);
    }
  };

  // =============================================
  // ESTADÍSTICAS DE TICKETS POR USUARIO
  // =============================================
  const obtenerStatsTickets = async (userId: string): Promise<TicketStats> => {
    try {
      let query = supabase
        .from('tickets')
        .select('estado, fecha_creacion')
        .eq('solicitante_id', userId);

      // Aplicar filtros de período si están seleccionados
      if (filtroAnio !== 'todos') {
        const inicioAnio = `${filtroAnio}-01-01`;
        const finAnio = `${filtroAnio}-12-31`;
        query = query.gte('fecha_creacion', inicioAnio).lte('fecha_creacion', finAnio);
      }

      if (filtroMes !== 'todos' && filtroAnio !== 'todos') {
        const mesNum = parseInt(filtroMes);
        const inicioMes = `${filtroAnio}-${String(mesNum).padStart(2, '0')}-01`;
        const finMes = new Date(parseInt(filtroAnio), mesNum, 0).toISOString().split('T')[0];
        query = query.gte('fecha_creacion', inicioMes).lte('fecha_creacion', finMes);
      }

      const { data: tickets, error } = await query;
      if (error) throw error;

      return {
        total: tickets?.length || 0,
        nuevos: tickets?.filter(t => t.estado === 'nuevo').length || 0,
        asignados: tickets?.filter(t => t.estado === 'asignado').length || 0,
        resueltos: tickets?.filter(t => t.estado === 'resuelto').length || 0,
        cerrados: tickets?.filter(t => t.estado === 'cerrado').length || 0,
      };
    } catch (error) {
      console.error('Error obteniendo stats tickets:', error);
      return { total: 0, nuevos: 0, asignados: 0, resueltos: 0, cerrados: 0 };
    }
  };

  // =============================================
  // ESTADÍSTICAS DE ENCUESTAS POR USUARIO
  // =============================================
  const obtenerStatsEncuestas = async (userId: string): Promise<EncuestaStats> => {
    try {
      const { data: encuestasEnviadas, error } = await supabase
        .from('encuestas')
        .select('id, fecha_creacion, completada')
        .eq('user_id', userId)
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;

      const completadas = encuestasEnviadas?.filter(e => e.completada).length || 0;
      const pendientes = encuestasEnviadas?.filter(e => !e.completada).length || 0;
      const ultimoEnvio = encuestasEnviadas?.[0]?.fecha_creacion || null;

      return { completadas, pendientes, ultimoEnvio };
    } catch (error) {
      console.error('Error obteniendo stats encuestas:', error);
      return { completadas: 0, pendientes: 0, ultimoEnvio: null };
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Recargar cuando cambien los filtros
  useEffect(() => {
    if (!cargando) {
      cargarDatos();
    }
  }, [filtroMes, filtroAnio]);

  // =============================================
  // FILTRADO Y BÚSQUEDA
  // =============================================
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      const q = busqueda.toLowerCase().trim();
      if (!q) return true;
      return (
        `${u.nombre} ${u.apellidos}`.toLowerCase().includes(q) ||
        u.correo.toLowerCase().includes(q)
      );
    });
  }, [usuarios, busqueda]);

  // =============================================
  // ESTADÍSTICAS GENERALES DEL ÁREA
  // =============================================
  const statsArea = useMemo(() => {
    const total = usuarios.length;
    const activos = usuarios.filter(u => u.activo).length;
    const totalTickets = usuarios.reduce((acc, u) => acc + u.tickets.total, 0);
    const nuevos = usuarios.reduce((acc, u) => acc + u.tickets.nuevos, 0);
    const asignados = usuarios.reduce((acc, u) => acc + u.tickets.asignados, 0);
    const resueltos = usuarios.reduce((acc, u) => acc + u.tickets.resueltos, 0);
    const cerrados = usuarios.reduce((acc, u) => acc + u.tickets.cerrados, 0);

    return { total, activos, totalTickets, nuevos, asignados, resueltos, cerrados };
  }, [usuarios]);

  // =============================================
  // 📊 EXPORTAR A EXCEL (CORREGIDO)
  // =============================================
  // =============================================
// 📊 EXPORTAR A EXCEL (CORREGIDO - SIEMPRE CON ENCABEZADOS)
// =============================================
const exportarAExcel = () => {
  setExportando(true);
  try {
    // Definir los encabezados de las columnas (SIEMPRE se incluyen)
    const encabezados = [
      'Usuario',
      'Correo Electrónico',
      'Estado',
      'Total Tickets',
      'Tickets Nuevos',
      'Tickets Asignados',
      'Tickets Resueltos',
      'Tickets Cerrados',
      'Encuestas Completadas',
      'Encuestas Pendientes',
      'Último Envío de Encuesta'
    ];

    // Preparar datos de los usuarios
    const datosParaExcel = usuariosFiltrados.map(u => ({
      'Usuario': `${u.nombre} ${u.apellidos}`,
      'Correo Electrónico': u.correo,
      'Estado': u.activo ? 'Activo' : 'Inactivo',
      'Total Tickets': u.tickets.total,
      'Tickets Nuevos': u.tickets.nuevos,
      'Tickets Asignados': u.tickets.asignados,
      'Tickets Resueltos': u.tickets.resueltos,
      'Tickets Cerrados': u.tickets.cerrados,
      'Encuestas Completadas': u.encuestas.completadas,
      'Encuestas Pendientes': u.encuestas.pendientes,
      'Último Envío de Encuesta': u.encuestas.ultimoEnvio 
        ? new Date(u.encuestas.ultimoEnvio).toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        : 'N/A'
    }));

    // Si no hay datos, crear un objeto vacío con los encabezados
    if (datosParaExcel.length === 0) {
      // Crear objeto con todos los encabezados vacíos
      const filaVacia: any = {};
      encabezados.forEach(encabezado => {
        filaVacia[encabezado] = '';
      });
      datosParaExcel.push(filaVacia);
    }

    // Crear hoja de trabajo
    const ws = XLSX.utils.json_to_sheet(datosParaExcel, {
      header: encabezados // Forzar el orden de las columnas
    });

    // Ajustar ancho de columnas
    ws['!cols'] = [
      { wch: 30 }, // Usuario
      { wch: 35 }, // Correo
      { wch: 12 }, // Estado
      { wch: 15 }, // Total Tickets
      { wch: 15 }, // Nuevos
      { wch: 18 }, // Asignados
      { wch: 18 }, // Resueltos
      { wch: 18 }, // Cerrados
      { wch: 22 }, // Encuestas Completadas
      { wch: 22 }, // Encuestas Pendientes
      { wch: 25 }, // Último Envío
    ];

    // Agregar título al Excel
    const fechaFiltro = filtroMes !== 'todos' || filtroAnio !== 'todos'
      ? ` - ${filtroAnio !== 'todos' ? filtroAnio : 'Todos los años'}${filtroMes !== 'todos' ? ` - ${meses.find(m => m.value === filtroMes)?.label}` : ''}`
      : '';

    // Crear libro de trabajo
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Usuarios ${areaSupervisor}`);

    // Generar nombre de archivo
    const fileName = `Mis_Usuarios_${areaSupervisor.replace(/\s+/g, '_')}${fechaFiltro.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Descargar archivo
    XLSX.writeFile(wb, fileName);

    if (usuariosFiltrados.length === 0) {
      alert('⚠️ No hay usuarios con los filtros seleccionados.\n\nSe exportó un archivo Excel con los encabezados de la tabla.');
    } else {
      alert(`✅ Exportado correctamente: ${datosParaExcel.length} usuarios\n\nArchivo: ${fileName}`);
    }
  } catch (error) {
    console.error('Error exportando a Excel:', error);
    alert('❌ Error al exportar los datos a Excel');
  } finally {
    setExportando(false);
  }
};

  // =============================================
  // OPCIONES DE FILTROS
  // =============================================
  const meses = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  const aniosDisponibles = useMemo(() => {
    const anioActual = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => anioActual - i);
  }, []);

  // =============================================
  // AVATAR FALLBACK
  // =============================================
  const avatarFallback = (nombre: string, apellidos = '') =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(`${nombre} ${apellidos}`.trim())}&background=73c59b&color=fff&size=256`;

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
            <h1 className="text-2xl font-bold text-gray-800">Mis Usuarios</h1>
            <p className="text-gray-500 text-sm">
              Área: <span className="font-semibold" style={{ color: '#73c59b' }}>{areaSupervisor}</span> • Banco de Alimentos Perú
            </p>
          </div>
        </div>
        <button
          onClick={cargarDatos}
          disabled={cargando}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:shadow-lg transition-all disabled:opacity-50"
          style={{ backgroundColor: '#73c59b' }}
          title="Actualizar datos"
        >
          <RefreshCw className={`w-5 h-5 ${cargando ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* TARJETAS DE RESUMEN */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Total', value: statsArea.total, icon: Users, color: '#73c59b' },
          { label: 'Activos', value: statsArea.activos, icon: UserCheck, color: '#10b981' },
          { label: 'Total Tickets', value: statsArea.totalTickets, icon: Ticket, color: '#3b82f6' },
          { label: 'Nuevos', value: statsArea.nuevos, icon: Clock, color: '#f59e0b' },
          { label: 'Asignados', value: statsArea.asignados, icon: Users, color: '#8b5cf6' },
          { label: 'Resueltos', value: statsArea.resueltos, icon: CheckCircle, color: '#06b6d4' },
          { label: 'Cerrados', value: statsArea.cerrados, icon: CheckCircle, color: '#6b7280' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* FILTROS Y ACCIONES */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o correo..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ borderColor: '#d1d5db' } as any}
              onFocus={(e) => e.target.style.borderColor = '#73c59b'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* Filtro Mes */}
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

          {/* Filtro Año */}
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

          {/* Botón Exportar */}
          <button
            onClick={exportarAExcel}
            disabled={exportando}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium hover:shadow-lg transition-all disabled:opacity-50"
            style={{ backgroundColor: '#e84545' }}
            title="Exportar a Excel"
          >
            <Download className="w-5 h-5" />
            {exportando ? 'Exportando...' : 'Exportar a Excel'}
          </button>
        </div>

        {/* Contador de resultados */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <p className="text-gray-500">
            Mostrando <span className="font-semibold text-gray-700">{usuariosFiltrados.length}</span> de{' '}
            <span className="font-semibold text-gray-700">{usuarios.length}</span> usuarios
          </p>
          {(busqueda || filtroMes !== 'todos' || filtroAnio !== 'todos') && (
            <button
              onClick={() => {
                setBusqueda('');
                setFiltroMes('todos');
                setFiltroAnio('todos');
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* TABLA DE USUARIOS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase">Usuario</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-600 uppercase">Estado</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-600 uppercase">Tickets Registrados</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-600 uppercase">Nuevos</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-600 uppercase">Asignados</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-600 uppercase">Resueltos</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-600 uppercase">Cerrados</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-600 uppercase">Encuestas ✓</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-600 uppercase">Encuestas Pend.</th>
                <th className="text-center px-3 py-3 text-xs font-medium text-gray-600 uppercase">Último Envío</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <RefreshCw className="w-8 h-8 animate-spin" />
                      <p>Cargando usuarios...</p>
                    </div>
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <AlertCircle className="w-12 h-12" />
                      <p className="text-lg font-medium">No se encontraron usuarios</p>
                      <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                    </div>
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    {/* Usuario - ENLACE AL DETALLE DE TICKETS */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/tickets?usuario=${u.id}`)}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left group w-full"
                      >
                        <img
                          src={u.avatar || avatarFallback(u.nombre, u.apellidos)}
                          onError={e => { (e.target as HTMLImageElement).src = avatarFallback(u.nombre, u.apellidos); }}
                          alt={u.nombre}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <p className="font-semibold text-gray-800 group-hover:text-[#73c59b] transition-colors underline decoration-dotted decoration-gray-300 group-hover:decoration-[#73c59b]">
                              {u.nombre} {u.apellidos}
                            </p>
                            <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {u.correo}
                          </p>
                        </div>
                      </button>
                    </td>

                    {/* Estado */}
                    <td className="px-3 py-3 text-center">
                      {u.activo ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <UserCheck className="w-3 h-3" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          <UserX className="w-3 h-3" />
                          Inactivo
                        </span>
                      )}
                    </td>

                    {/* Tickets Registrados */}
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-700 font-bold">
                        {u.tickets.total}
                      </span>
                    </td>

                    {/* Nuevos */}
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-amber-50 text-amber-700 font-bold">
                        {u.tickets.nuevos}
                      </span>
                    </td>

                    {/* Asignados */}
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-purple-50 text-purple-700 font-bold">
                        {u.tickets.asignados}
                      </span>
                    </td>

                    {/* Resueltos */}
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-50 text-cyan-700 font-bold">
                        {u.tickets.resueltos}
                      </span>
                    </td>

                    {/* Cerrados */}
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-700 font-bold">
                        {u.tickets.cerrados}
                      </span>
                    </td>

                    {/* Encuestas Completadas */}
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 text-green-700 font-bold">
                        {u.encuestas.completadas}
                      </span>
                    </td>

                    {/* Encuestas Pendientes */}
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-red-50 text-red-700 font-bold">
                        {u.encuestas.pendientes}
                      </span>
                    </td>

                    {/* Último Envío */}
                    <td className="px-3 py-3 text-center">
                      {u.encuestas.ultimoEnvio ? (
                        <div className="inline-flex items-center gap-1 text-xs text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {new Date(u.encuestas.ultimoEnvio).toLocaleDateString('es-PE', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PIE DE PÁGINA INFORMATIVO */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Tip:</strong> Haz clic en el nombre de cualquier usuario para ver el detalle completo de sus tickets. 
            Los datos se actualizan en tiempo real desde la base de datos.
          </span>
        </p>
      </div>
    </div>
  );
}