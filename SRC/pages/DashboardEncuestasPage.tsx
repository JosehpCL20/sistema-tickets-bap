// =============================================
// PÁGINA: DASHBOARD DE ENCUESTAS
// Para: superadmin, administrador, supervisor
// =============================================
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, RefreshCw, Download, Search, CheckCircle, XCircle, Star } from 'lucide-react';

const AREAS = ['Todas las Áreas', 'Logística y Calidad', 'Sistemas y Procesos', 'Gestión Social', 'Administración', 'Estrategias y Alianzas', 'Fundraising', 'Proyectos'];
const MESES = ['Todos los Meses', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const formatearFecha = (f: string | null) => {
  if (!f) return '-';
  return new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(f));
};

export default function DashboardEncuestasPage() {
  const navigate = useNavigate();
  const { usuarioActual, obtenerUsuarioPorId } = useAuthStore();
  const [encuestas, setEncuestas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroArea, setFiltroArea] = useState('Todas las Áreas');
  const [filtroMes, setFiltroMes] = useState('Todos los Meses');

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      let q = supabase.from('encuestas').select(`*, tickets(id, titulo, solicitante_id, tecnico_asignado_id), users(nombre, apellidos, area)`).order('fecha_creacion', { ascending: false });
      if (usuarioActual?.rol === 'supervisor') {
        q = q.eq('users.area', usuarioActual.area);
      }
      const { data, error } = await q;
      if (error) throw error;
      setEncuestas(data || []);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  const encuestasFiltradas = useMemo(() => {
    return encuestas.filter(e => {
      const usuario = e.users;
      const area = usuario?.area || '';
      const nombre = `${usuario?.nombre || ''} ${usuario?.apellidos || ''}`.toLowerCase();
      const ticketId = e.tickets?.id ? `BAP-${String(e.tickets.id).padStart(4, '0')}` : '';
      if (filtroArea !== 'Todas las Áreas' && area !== filtroArea) return false;
      if (filtroMes !== 'Todos los Meses') {
        const mes = new Date(e.fecha_creacion).getMonth();
        if (mes !== MESES.indexOf(filtroMes) - 1) return false;
      }
      if (busqueda && !nombre.includes(busqueda.toLowerCase()) && !ticketId.toLowerCase().includes(busqueda.toLowerCase())) return false;
      return true;
    });
  }, [encuestas, filtroArea, filtroMes, busqueda]);

  const stats = useMemo(() => ({
    total: encuestasFiltradas.length,
    enviadas: encuestasFiltradas.filter(e => e.fecha_creacion).length,
    completadas: encuestasFiltradas.filter(e => e.completada).length,
    promedio: encuestasFiltradas.filter(e => e.puntuacion_general).length > 0
      ? (encuestasFiltradas.reduce((a, e) => a + (e.puntuacion_general || 0), 0) / encuestasFiltradas.filter(e => e.puntuacion_general).length).toFixed(1)
      : '-',
  }), [encuestasFiltradas]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard de Encuestas</h1>
            <p className="text-gray-500 text-sm">Vista de Encuestas - Banco de Alimentos Perú</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={cargar} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-600">
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-600">
            <Download className="w-4 h-4" /> Exportar a Excel
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <span className="text-sm text-gray-500 font-medium flex items-center gap-1">🔽 Filtros:</span>
        <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          {MESES.map(m => <option key={m}>{m}</option>)}
        </select>
        <select value={filtroArea} onChange={e => setFiltroArea(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
          {AREAS.map(a => <option key={a}>{a}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: '#80c398' },
          { label: 'Enviadas', value: stats.enviadas, color: '#3b82f6' },
          { label: 'Completadas', value: stats.completadas, color: '#10b981' },
          { label: 'Promedio ★', value: stats.promedio, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por usuario o ticket..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg" />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-sm text-gray-600 font-medium">
          📂 Resumen: {filtroArea === 'Todas las Áreas' ? 'TODOS los Usuarios x Encuestas' : filtroArea}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Área', 'Usuario', 'Ticket', 'Enviada', 'Completada', 'Puntuación', 'Fecha de Envío'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
              ) : encuestasFiltradas.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Sin encuestas para mostrar</td></tr>
              ) : encuestasFiltradas.map(e => {
                const usuario = e.users;
                const ticketId = e.tickets?.id ? `BAP-${String(e.tickets.id).padStart(4, '0')}` : '-';
                return (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">{usuario?.area || '-'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{usuario ? `${usuario.nombre} ${usuario.apellidos}` : '-'}</td>
                    <td className="px-4 py-3 text-sm font-mono" style={{ color: '#ea4c5b' }}>{ticketId}</td>
                    <td className="px-4 py-3">
                      {e.fecha_creacion ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}
                    </td>
                    <td className="px-4 py-3">
                      {e.completada ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-400" />}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {e.puntuacion_general ? (
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          {e.puntuacion_general}/5
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatearFecha(e.fecha_completado || e.fecha_creacion)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
