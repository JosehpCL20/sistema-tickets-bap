// =============================================
// PÁGINA: DASHBOARD POR ÁREA
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
  RefreshCw, Ticket, Building2, Tag, Clock,
  CheckCircle, ClipboardList, TrendingUp, Filter
} from 'lucide-react';

const AREAS = [
  'Logística y Calidad',
  'Sistemas y Procesos',
  'Gestión Social',
  'Administración',
  'Estrategias y Alianzas',
  'Fundraising',
  'Proyectos'
];

const CATEGORIAS: Record<string, string> = {
  hardware_computadora: 'Hardware - PC',
  hardware_impresora: 'Hardware - Impresora',
  hardware_red: 'Hardware - Red',
  hardware_telefonia: 'Hardware - Telefonía',
  software_instalacion: 'Software - Instalación',
  software_error: 'Software - Error',
  software_actualizacion: 'Software - Actualización',
  correo_electronico: 'Correo Electrónico',
  internet_wifi: 'Internet - WiFi',
  internet_cable: 'Internet - Cable',
  sistema_interno: 'Sistema Interno',
  seguridad: 'Seguridad',
  cuenta_acceso: 'Cuenta / Acceso',
  otro: 'Otro',
};

const COLORES = ['#80c398', '#fbe066', '#ea4c5b', '#6ab088', '#f5a623', '#3b82f6', '#a855f7', '#06b6d4'];

const ESTADO_LABELS: Record<string, string> = {
  nuevo: 'Nuevo',
  asignado: 'Asignado',
  planificado: 'Planificado',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
};

const ESTADO_COLORES: Record<string, string> = {
  nuevo: '#fbe066',
  asignado: '#6ab088',
  planificado: '#a855f7',
  resuelto: '#80c398',
  cerrado: '#9ca3af',
};

export default function DashboardAreaPage() {
  const navigate = useNavigate();
  const { usuarioActual } = useAuthStore();
  const { tickets, cargarTickets, isLoading } = useTicketStore();

  const [areaSeleccionada, setAreaSeleccionada] = useState<string>(
    usuarioActual?.area || AREAS[0]
  );
  const [mesSeleccionado, setMesSeleccionado] = useState<number>(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    cargarTickets();
  }, []);

  // Filtrar tickets por área y período
  const ticketsFiltrados = useMemo(() => {
    return tickets.filter((t: any) => {
      const area = t.area_solicitante || t.area || '';
      const fecha = new Date(t.fechaCreacion || t.created_at || '');
      const mismoMes = fecha.getMonth() === mesSeleccionado;
      const mismoAnio = fecha.getFullYear() === anioSeleccionado;
      return area === areaSeleccionada && mismoMes && mismoAnio;
    });
  }, [tickets, areaSeleccionada, mesSeleccionado, anioSeleccionado]);

  // Estadísticas generales
  const stats = useMemo(() => ({
    total: ticketsFiltrados.length,
    nuevo: ticketsFiltrados.filter((t: any) => t.estado === 'nuevo').length,
    asignado: ticketsFiltrados.filter((t: any) => t.estado === 'asignado').length,
    planificado: ticketsFiltrados.filter((t: any) => t.estado === 'planificado').length,
    resuelto: ticketsFiltrados.filter((t: any) => t.estado === 'resuelto').length,
    cerrado: ticketsFiltrados.filter((t: any) => t.estado === 'cerrado').length,
  }), [ticketsFiltrados]);

  // Datos para gráfico por categoría
  const dataCategorias = useMemo(() => {
    const conteo: Record<string, number> = {};
    ticketsFiltrados.forEach((t: any) => {
      const cat = CATEGORIAS[t.categoria] || t.categoria || 'Otro';
      conteo[cat] = (conteo[cat] || 0) + 1;
    });
    return Object.entries(conteo)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [ticketsFiltrados]);

  // Datos para gráfico por estado
  const dataEstados = useMemo(() => {
    return Object.entries(ESTADO_LABELS).map(([key, label]) => ({
      name: label,
      value: ticketsFiltrados.filter((t: any) => t.estado === key).length,
      color: ESTADO_COLORES[key],
    })).filter(d => d.value > 0);
  }, [ticketsFiltrados]);

  // Tickets recientes del área
  const ticketsRecientes = useMemo(() => {
    return [...ticketsFiltrados]
      .sort((a: any, b: any) => new Date(b.fechaCreacion || b.created_at || 0).getTime() - new Date(a.fechaCreacion || a.created_at || 0).getTime())
      .slice(0, 8);
  }, [ticketsFiltrados]);

  const formatearFecha = (fecha: any): string => {
    if (!fecha) return '-';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  };

  const meses = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ];

  const getEstadoStyle = (estado: string) => ({
    backgroundColor: ESTADO_COLORES[estado] || '#e5e7eb',
    color: estado === 'nuevo' ? '#92400e' : '#fff',
    padding: '2px 10px',
    borderRadius: 99,
    fontSize: 12,
    fontWeight: 600,
    display: 'inline-block',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl p-8 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #80c398 0%, #4a9b6e 100%)' }}>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-7 h-7" />
            <h1 className="text-2xl font-bold">Dashboard por Área</h1>
          </div>
          <p className="text-green-100 text-sm">
            Estadísticas de tickets por área organizacional
          </p>
        </div>
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full opacity-10" style={{ background: '#fff' }} />
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Área</label>
            <select
              value={areaSeleccionada}
              onChange={e => setAreaSeleccionada(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Mes</label>
            <select
              value={mesSeleccionado}
              onChange={e => setMesSeleccionado(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              {meses.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Año</label>
            <select
              value={anioSeleccionado}
              onChange={e => setAnioSeleccionado(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button
            onClick={() => cargarTickets()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#80c398' }}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Ticket, color: '#6ab088' },
          { label: 'Nuevos', value: stats.nuevo, icon: ClipboardList, color: '#fbe066' },
          { label: 'Asignados', value: stats.asignado, icon: Tag, color: '#6ab088' },
          { label: 'Planificados', value: stats.planificado, icon: Clock, color: '#a855f7' },
          { label: 'Resueltos', value: stats.resuelto, icon: CheckCircle, color: '#80c398' },
          { label: 'Cerrados', value: stats.cerrado, icon: TrendingUp, color: '#9ca3af' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
              style={{ backgroundColor: color + '22' }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div className="text-2xl font-bold text-gray-800">{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por categoría */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4 text-green-500" />
            Tickets por Categoría
          </h2>
          {dataCategorias.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Filter className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Sin datos para el período seleccionado</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dataCategorias} margin={{ top: 0, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="Tickets" radius={[6,6,0,0]}>
                  {dataCategorias.map((_, i) => (
                    <Cell key={i} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Por estado */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Distribución por Estado
          </h2>
          {dataEstados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Filter className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Sin datos para el período seleccionado</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={dataEstados} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {dataEstados.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tabla de tickets recientes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-green-500" />
          Tickets Recientes — {areaSeleccionada}
        </h2>
        {ticketsRecientes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Ticket className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay tickets registrados para este período</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">#</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Título</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Categoría</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Estado</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {ticketsRecientes.map((t: any) => (
                  <tr
                    key={t.id}
                    className="border-b border-gray-50 hover:bg-green-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/tickets/${t.id}`)}
                  >
                    <td className="py-2 px-3 text-gray-400 font-mono text-xs">#{t.id}</td>
                    <td className="py-2 px-3 text-gray-800 font-medium max-w-xs truncate">{t.titulo || t.asunto}</td>
                    <td className="py-2 px-3 text-gray-500">{CATEGORIAS[t.categoria] || t.categoria || '-'}</td>
                    <td className="py-2 px-3">
                      <span style={getEstadoStyle(t.estado)}>
                        {ESTADO_LABELS[t.estado] || t.estado}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-400 text-xs">{formatearFecha(t.fechaCreacion || t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
