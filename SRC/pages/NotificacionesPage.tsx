// =============================================
// PÁGINA: NOTIFICACIONES — CORREGIDA
// Fix: usa el canal del authStore, no crea uno duplicado
// =============================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  ArrowLeft,Bell, CheckCheck, Ticket, MessageSquare,
  CheckCircle, User, AlertTriangle, X, Info
} from 'lucide-react';

const tiempoRelativo = (fecha: string): string => {
  const diff = Date.now() - new Date(fecha).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  return `hace ${Math.floor(hrs / 24)} d`;
};

const iconoPorTipo = (type: string) => {
  const mapa: Record<string, { icon: React.ReactNode; color: string }> = {
    new_ticket:      { icon: <Ticket className="w-5 h-5" />,        color: 'bg-blue-100 text-blue-600' },
    new_message:     { icon: <MessageSquare className="w-5 h-5" />,  color: 'bg-green-100 text-green-600' },
    ticket_resolved: { icon: <CheckCircle className="w-5 h-5" />,   color: 'bg-emerald-100 text-emerald-600' },
    ticket_assigned: { icon: <User className="w-5 h-5" />,           color: 'bg-purple-100 text-purple-600' },
    ticket_taken:    { icon: <User className="w-5 h-5" />,           color: 'bg-indigo-100 text-indigo-600' },
    ticket_created:  { icon: <Ticket className="w-5 h-5" />,         color: 'bg-gray-100 text-gray-600' },
    sla_warning:     { icon: <AlertTriangle className="w-5 h-5" />,  color: 'bg-red-100 text-red-600' },
  };
  return mapa[type] || { icon: <Info className="w-5 h-5" />, color: 'bg-gray-100 text-gray-500' };
};

export default function NotificacionesPage() {
  const navigate = useNavigate();
  const { notificaciones, marcarNotificacionLeida, marcarTodasLeidas, eliminarNotificacion } = useAuthStore();
  const [filtro, setFiltro] = useState<'todas' | 'no_leidas'>('todas');

  const noLeidas = notificaciones.filter(n => !n.is_read).length;
  const notifsFiltradas = filtro === 'no_leidas'
    ? notificaciones.filter(n => !n.is_read)
    : notificaciones;

  const handleClick = async (notif: any) => {
    if (!notif.is_read) await marcarNotificacionLeida(notif.id);
    if (notif.ticket_id) navigate(`/tickets/${notif.ticket_id}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Volver"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Bell className="w-6 h-6" style={{ color: '#80c398' }} />
              Notificaciones
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {noLeidas > 0 ? `${noLeidas} sin leer` : 'Todo al día ✓'}
            </p>
          </div>
        </div>
        {noLeidas > 0 && (
          <button
            onClick={marcarTodasLeidas}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 text-gray-600"
          >
            <CheckCheck className="w-4 h-4" /> Marcar todas leídas
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {(['todas', 'no_leidas'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filtro === f ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            style={filtro === f ? { backgroundColor: '#80c398' } : {}}
          >
            {f === 'todas' ? 'Todas' : `No leídas${noLeidas > 0 ? ` (${noLeidas})` : ''}`}
          </button>
        ))}
      </div>

      {notifsFiltradas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">Sin notificaciones</p>
          <p className="text-gray-400 text-sm mt-1">{filtro === 'no_leidas' ? 'Estás al día.' : 'Aún no hay nada.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifsFiltradas.map(notif => {
            const { icon, color } = iconoPorTipo(notif.type);
            return (
              <div key={notif.id}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${notif.is_read ? 'bg-white border-gray-200' : 'bg-emerald-50/50 border-emerald-200'}`}
                onClick={() => handleClick(notif)}
              >
                {!notif.is_read && <span className="mt-2 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#80c398' }} />}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${notif.is_read ? 'text-gray-700' : 'text-gray-900'}`}>{notif.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{tiempoRelativo(notif.created_at)}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); eliminarNotificacion(notif.id); }}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 flex-shrink-0" title="Eliminar">
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
