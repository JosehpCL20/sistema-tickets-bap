// =============================================
// PÁGINA: NOTIFICACIONES
// Sistema de Gestión de Tickets - Banco de Alimentos Perú
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabaseClient';
import {
  Bell,
  Ticket,
  MessageSquare,
  CheckCircle,
  User,
  AlertTriangle,
  FileCheck,
  Clock,
  Trash2,
  Eye,
  ExternalLink,
  X
} from 'lucide-react';

interface Notification {
  id: string;
  user_id: string;
  ticket_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata: any;
}

export default function NotificacionesPage() {
  const navigate = useNavigate();
  const { usuarioActual } = useAuthStore();
  const [notificaciones, setNotificaciones] = useState<Notification[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | 'no_leidas' | 'leidas'>('todas');

  useEffect(() => {
    if (usuarioActual) {
      cargarNotificaciones();
    }
  }, [usuarioActual]);

  // Suscribirse a notificaciones en tiempo real
  useEffect(() => {
    if (!usuarioActual) return;

    const channel = supabase
      .channel('notifications_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${usuarioActual.id}`
        },
        (payload) => {
          setNotificaciones((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${usuarioActual.id}`
        },
        (payload) => {
          setNotificaciones((prev) =>
            prev.map((notif) =>
              notif.id === payload.new.id ? (payload.new as Notification) : notif
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [usuarioActual]);

  const cargarNotificaciones = async () => {
    if (!usuarioActual) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', usuarioActual.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotificaciones(data || []);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setCargando(false);
    }
  };

  const marcarComoLeida = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotificaciones((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marcando como leída:', error);
    }
  };

  const marcarTodasComoLeidas = async () => {
    if (!usuarioActual) return;

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', usuarioActual.id)
        .eq('is_read', false);

      setNotificaciones((prev) =>
        prev.map((notif) => ({ ...notif, is_read: true }))
      );
    } catch (error) {
      console.error('Error marcando todas:', error);
    }
  };

  const eliminarNotificacion = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      setNotificaciones((prev) => prev.filter((notif) => notif.id !== notificationId));
    } catch (error) {
      console.error('Error eliminando:', error);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'new_ticket':
      case 'ticket_assigned': return <Ticket className="w-6 h-6" />;
      case 'new_message': return <MessageSquare className="w-6 h-6" />;
      case 'ticket_resolved': return <CheckCircle className="w-6 h-6" />;
      case 'ticket_taken': return <User className="w-6 h-6" />;
      case 'sla_warning': return <AlertTriangle className="w-6 h-6" />;
      case 'survey_sent':
      case 'survey_completed': return <FileCheck className="w-6 h-6" />;
      default: return <Bell className="w-6 h-6" />;
    }
  };

  const getNotifColor = (type: string) => {
    switch (type) {
      case 'new_ticket':
      case 'ticket_assigned': return 'text-blue-600 bg-blue-100';
      case 'new_message': return 'text-green-600 bg-green-100';
      case 'ticket_resolved': return 'text-emerald-600 bg-emerald-100';
      case 'ticket_taken': return 'text-purple-600 bg-purple-100';
      case 'sla_warning': return 'text-red-600 bg-red-100';
      case 'survey_sent':
      case 'survey_completed': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatearTiempo = (fecha: string) => {
    const ahora = new Date();
    const notifDate = new Date(fecha);
    const diffMs = ahora.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'hace un momento';
    if (diffMins < 60) return `hace ${diffMins} min`;
    if (diffHours < 24) return `hace ${diffHours} h`;
    if (diffDays < 7) return `hace ${diffDays} d`;
    return notifDate.toLocaleDateString('es-PE');
  };

  const notificacionesFiltradas = notificaciones.filter((notif) => {
    if (filtro === 'no_leidas') return !notif.is_read;
    if (filtro === 'leidas') return notif.is_read;
    return true;
  });

  const noLeidasCount = notificaciones.filter((n) => !n.is_read).length;

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Bell className="w-12 h-12 animate-pulse mx-auto mb-4 text-emerald-600" />
          <p className="text-gray-500">Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notificaciones</h1>
          <p className="text-gray-500 mt-1">
            {noLeidasCount > 0
              ? `${noLeidasCount} notificación${noLeidasCount !== 1 ? 'es' : ''} sin leer`
              : 'Todas las notificaciones están leídas'}
          </p>
        </div>
        {noLeidasCount > 0 && (
          <button
            onClick={marcarTodasComoLeidas}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <button
          onClick={() => setFiltro('todas')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filtro === 'todas'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFiltro('no_leidas')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filtro === 'no_leidas'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          No leídas
        </button>
        <button
          onClick={() => setFiltro('leidas')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filtro === 'leidas'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Leídas
        </button>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {notificacionesFiltradas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay notificaciones</p>
          </div>
        ) : (
          notificacionesFiltradas.map((notif) => (
            <div
              key={notif.id}
              className={`bg-white rounded-xl shadow-sm border-2 p-4 transition-all hover:shadow-md ${
                !notif.is_read ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getNotifColor(notif.type)}`}>
                  {getNotifIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className={`font-semibold ${!notif.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notif.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{formatearTiempo(notif.created_at)}</span>
                        {notif.ticket_id && (
                          <>
                            <span>•</span>
                            <button
                              onClick={() => navigate(`/tickets/${notif.ticket_id}`)}
                              className="text-emerald-600 hover:underline flex items-center gap-1"
                            >
                              Ticket #{String(notif.ticket_id).padStart(4, '0')}
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!notif.is_read && (
                        <button
                          onClick={() => marcarComoLeida(notif.id)}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          title="Marcar como leída"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => eliminarNotificacion(notif.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}