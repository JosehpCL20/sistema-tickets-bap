// =============================================
// PÁGINA: MIS USUARIOS — Para Supervisor
// Vista de los usuarios de su propia área
// =============================================
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTicketStore } from '../store/ticketStore';
import { Search, Users, Ticket, CheckCircle, Clock, User } from 'lucide-react';

const avatarFallback = (nombre: string, apellidos = '') =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(`${nombre} ${apellidos}`.trim())}&background=80c398&color=fff&size=256`;

export default function MisUsuariosPage() {
  const navigate = useNavigate();
  const { usuarioActual, usuarios } = useAuthStore();
  const { tickets, cargarTickets } = useTicketStore();
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => { cargarTickets(); }, []);

  // Solo usuarios de mi área
  const misUsuarios = useMemo(() =>
    usuarios.filter(u => u.area === usuarioActual?.area && u.rol === 'usuario' && u.activo),
    [usuarios, usuarioActual]
  );

  const usuariosFiltrados = useMemo(() =>
    misUsuarios.filter(u => {
      const q = busqueda.toLowerCase();
      return `${u.nombre} ${u.apellidos}`.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q);
    }),
    [misUsuarios, busqueda]
  );

  const statsUsuario = (userId: string) => {
    const suyos = tickets.filter(t => t.solicitanteId === userId);
    return {
      total: suyos.length,
      enCurso: suyos.filter(t => ['nuevo', 'asignado', 'planificado'].includes(t.estado)).length,
      resueltos: suyos.filter(t => t.estado === 'resuelto').length,
      cerrados: suyos.filter(t => t.estado === 'cerrado').length,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis Usuarios</h1>
          <p className="text-gray-500 text-sm">Usuarios de tu área: <span className="font-medium">{usuarioActual?.area}</span></p>
        </div>
        <span className="ml-auto px-3 py-1 rounded-full text-sm font-medium text-white" style={{ backgroundColor: '#80c398' }}>
          {misUsuarios.length} usuarios
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o correo..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg" />
      </div>

      {usuariosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No hay usuarios en tu área</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usuariosFiltrados.map(u => {
            const stats = statsUsuario(u.id);
            return (
              <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={u.avatar || avatarFallback(u.nombre, u.apellidos)}
                    onError={e => { (e.target as HTMLImageElement).src = avatarFallback(u.nombre, u.apellidos); }}
                    alt={u.nombre} className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">{u.nombre} {u.apellidos}</p>
                    <p className="text-xs text-gray-500">{u.correo}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: 'Total', value: stats.total, color: '#80c398' },
                    { label: 'En curso', value: stats.enCurso, color: '#3b82f6' },
                    { label: 'Cerrados', value: stats.cerrados, color: '#6b7280' },
                  ].map(s => (
                    <div key={s.label} className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-xs text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate(`/tickets?usuario=${u.id}`)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  <Ticket className="w-4 h-4" /> Ver sus tickets
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
