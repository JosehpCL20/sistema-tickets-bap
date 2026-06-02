// =============================================
// LAYOUT PRINCIPAL CON NAVEGACIÓN Y NOTIFICACIONES REALTIME
// Sistema de Gestión de Tickets - Banco de Alimentos Perú
// =============================================

import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTicketStore } from '../store/ticketStore';
import { supabase } from '../lib/supabaseClient';
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Settings,
  Wrench,
  Shield,
  FileCheck,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    usuarioActual, 
    logout, 
    cargarNotificaciones,
    marcarNotificacionLeida,
    marcarTodasLeidas,
    SuscribirseNotificaciones
  } = useAuthStore();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [perfilOpen, setPerfilOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const notifsRef = useRef<HTMLDivElement>(null);
  
  const notificaciones = useAuthStore(state => state.notificaciones);
  const notificacionesNoLeidas = notificaciones.filter(n => !n.is_read);

  // Cargar tickets y notificaciones al montar
  useEffect(() => {
    if (usuarioActual) {
      useTicketStore.getState().cargarTickets();
      cargarNotificaciones();
      
      // Suscribirse a notificaciones en tiempo real
      const unsubscribe = SuscribirseNotificaciones();
      return () => {
        unsubscribe?.();
      };
    }
  }, [usuarioActual]);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(event.target as Node)) {
        setNotifsOpen(false);
      }
      if (!event.target || !(event.target as Element).closest('[data-perfil]')) {
        setPerfilOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Redirigir si no hay usuario
  useEffect(() => {
    if (!usuarioActual && location.pathname !== '/login') {
      navigate('/login');
    }
  }, [usuarioActual, location.pathname, navigate]);

  if (!usuarioActual) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // =============================================
  // MENÚ DE NAVEGACIÓN CON ROLES
  // =============================================
  const menuItems = [
    { 
      path: '/dashboard', 
      icon: LayoutDashboard, 
      label: 'Inicio',
      roles: ['superadmin', 'administrador', 'supervisor', 'tecnico', 'usuario'] 
    },
    { 
      path: '/tickets', 
      icon: Ticket, 
      label: 'Mis Tickets',
      roles: ['superadmin', 'administrador', 'supervisor', 'tecnico', 'usuario'] 
    },
    { 
      path: '/tickets/nuevo', 
      icon: Ticket, 
      label: 'Nuevo Ticket',
      roles: ['supervisor', 'usuario'] 
    },
    { 
      path: '/tickets/atender', 
      icon: Wrench, 
      label: 'Tickets por Atender',
      roles: ['superadmin', 'administrador', 'tecnico']
    },
    { 
      path: '/tickets/atendidos',
      icon: FileCheck, 
      label: 'Tickets Atendidos',
      roles: ['superadmin', 'administrador', 'tecnico']
    },
    { 
      path: '/dashboard-area', 
      icon: LayoutDashboard, 
      label: 'Dashboard Mi Área',
      roles: ['superadmin', 'supervisor']
    },
    { 
      path: '/dashboard-general', 
      icon: Shield, 
      label: 'Dashboard General',
      roles: ['superadmin', 'administrador']
    },
    { 
      path: '/usuarios/mis-usuarios', 
      icon: Users, 
      label: 'Mis Usuarios',
      roles: ['superadmin', 'supervisor']
    },
    { 
      path: '/usuarios', 
      icon: Users, 
      label: 'Usuarios',
      roles: ['superadmin', 'administrador']
    },
    { 
      path: '/dashboard-encuestas', 
      icon: FileCheck, 
      label: 'Dashboard Encuestas',
      roles: ['superadmin', 'administrador']
    },
    { 
      path: '/gestion-encuestas', 
      icon: Settings, 
      label: 'Gestión Encuestas',
      roles: ['superadmin', 'administrador']
    }
  ];

  const menuFiltrado = menuItems.filter(item => 
    item.roles.includes(usuarioActual.rol)
  );

  const getRolBadgeColor = (rol: string) => {
    switch (rol) {
      case 'superadmin': return 'bg-purple-100 text-purple-700';
      case 'administrador': return 'bg-red-100 text-red-700';
      case 'supervisor': return 'bg-cyan-100 text-cyan-700';
      case 'tecnico': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRolLabel = (rol: string) => {
    switch (rol) {
      case 'superadmin': return 'Super Admin';
      case 'administrador': return 'Administrador';
      case 'supervisor': return 'Supervisor';
      case 'tecnico': return 'Técnico';
      default: return 'Usuario';
    }
  };

  // =============================================
  // UTILIDADES DE NOTIFICACIONES
  // =============================================
  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'new_ticket':
      case 'ticket_assigned': return <Ticket className="w-5 h-5" />;
      case 'new_message': return <MessageSquare className="w-5 h-5" />;
      case 'ticket_resolved': return <CheckCircle className="w-5 h-5" />;
      case 'ticket_taken': return <User className="w-5 h-5" />;
      case 'sla_warning': return <AlertTriangle className="w-5 h-5" />;
      case 'survey_sent':
      case 'survey_completed': return <FileCheck className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
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

  const formatearTiempoRelativo = (fecha: string) => {
    const ahora = new Date();
    const notifDate = new Date(fecha);
    const diffMs = ahora.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'ahora';
    if (diffMins < 60) return `hace ${diffMins}m`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays < 7) return `hace ${diffDays}d`;
    return notifDate.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  };

  const handleNotifClick = (notif: any) => {
    marcarNotificacionLeida(notif.id);
    setNotifsOpen(false);
    
    if (notif.ticket_id) {
      navigate(`/tickets/${notif.ticket_id}`);
    } else {
      navigate('/notificaciones');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Overlay para móvil - SIEMPRE que sidebarOpen sea true */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - VERDE #80c398 - DESPLEGABLE EN TODAS LAS PANTALLAS */}
      <aside 
        className={`
          fixed top-0 left-0 z-50 h-full w-64 text-white
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ backgroundColor: '#80c398' }}
      >
        {/* Logo */}
        <div 
          className="flex flex-col items-center gap-3 p-6"
          style={{ borderBottom: '1px solid #6ab088' }}
        >
          <img 
            src="/img/logo-banco-alimentos.jpg" 
            alt="Logo Banco de Alimentos Perú"
            className="w-16 h-16 object-contain rounded-2xl"
          />
          <div className="text-center">
            <h1 className="font-bold text-xl text-white">Help Desk</h1>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Banco de Alimentos Perú
            </p>
          </div>
        </div>

        {/* Navegación */}
        <nav 
          className="p-4 space-y-1 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 230px)',
            paddingBottom: '10px'
           }}
        >
          {menuFiltrado.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                end={item.path === '/tickets' || item.path === '/dashboard' || item.path === '/usuarios'}
                className={({ isActive }) => 
                  `flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-[#6ab088] text-white' 
                      : 'text-white/90 hover:bg-[#72b58d] hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  {item.label}
                </div>
                <ChevronRight className="w-4 h-4 text-white/60 flex-shrink-0" />
              </NavLink>
            );
          })}
        </nav>

        {/* Perfil en Sidebar */}
        <div 
          className="absolute left-0 right-0 border-t border-white/20 pt-4 px-4"
          style={{ 
            bottom: '0px',
            backgroundColor: 'rgba(0,0,0,0.1)',
            paddingTop: '10px',
            paddingBottom: '10px'
          }}
        >
          <div className="flex items-center gap-3">
            <img
              src={usuarioActual?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(usuarioActual?.nombre || 'User')}&background=fbe066&color=fff`}
              alt={usuarioActual?.nombre}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {usuarioActual?.nombre} {usuarioActual?.apellidos}
              </p>
              <p className="text-xs text-white/70 truncate">
                {usuarioActual?.correo}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3 h-16">
            
            {/* Izquierda - Menú hamburguesa - SIEMPRE visible */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Centro - Título como botón */}
            <div className="flex-1 text-center">
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-lg font-semibold text-gray-800 hover:text-[#80c398] transition-colors"
                title="Ir al Inicio"
              >
                Sistema de Gestión de Tickets
              </button>
            </div>

            {/* Derecha - Acciones */}
            <div className="flex items-center gap-2">
              
              {/* 🔔 Notificaciones */}
              <div className="relative" ref={notifsRef}>
                <button 
                  onClick={() => setNotifsOpen(!notifsOpen)}
                  className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {notificacionesNoLeidas.length > 0 && (
                    <span 
                      className="absolute -top-1 -right-1 w-5 h-5 text-white text-xs rounded-full flex items-center justify-center font-medium"
                      style={{ backgroundColor: '#ea4c5b' }}
                    >
                      {notificacionesNoLeidas.length > 9 ? '9+' : notificacionesNoLeidas.length}
                    </span>
                  )}
                </button>

                {/* Dropdown de notificaciones */}
                {notifsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                      <h3 className="font-semibold text-gray-800">Notificaciones</h3>
                      {notificacionesNoLeidas.length > 0 && (
                        <button
                          onClick={marcarTodasLeidas}
                          className="text-xs text-[#80c398] hover:underline"
                        >
                          Marcar todas
                        </button>
                      )}
                    </div>

                    {/* Lista */}
                    <div className="max-h-96 overflow-y-auto">
                      {notificaciones.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 text-sm">
                          <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p>No hay notificaciones</p>
                        </div>
                      ) : (
                        notificaciones.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => handleNotifClick(notif)}
                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                              !notif.is_read ? 'bg-blue-50/50' : ''
                            }`}
                          >
                            <div className="flex gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getNotifColor(notif.type)}`}>
                                {getNotifIcon(notif.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${!notif.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                                  {notif.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                  {notif.message}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-400">
                                    {formatearTiempoRelativo(notif.created_at)}
                                  </span>
                                  {notif.ticket_id && (
                                    <span className="text-xs text-[#80c398]">
                                      Ticket #{String(notif.ticket_id).padStart(4, '0')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {!notif.is_read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                      <button
                        onClick={() => {
                          setNotifsOpen(false);
                          navigate('/notificaciones');
                        }}
                        className="w-full text-center text-sm text-[#80c398] hover:underline"
                      >
                        Ver todas las notificaciones
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 👤 Perfil */}
              <div className="relative" data-perfil>
                <button
                  onClick={() => setPerfilOpen(!perfilOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <img 
                    src={usuarioActual.avatar} 
                    alt={usuarioActual.nombre}
                    className="w-8 h-8 rounded-full border border-gray-200"
                  />
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-700">{usuarioActual.nombre}</p>
                    <p className="text-xs text-gray-500">{usuarioActual.area}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {/* Dropdown de perfil */}
                {perfilOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setPerfilOpen(false)} />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                      
                      {/* Info usuario */}
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-3">
                          <img 
                            src={usuarioActual.avatar} 
                            alt={usuarioActual.nombre}
                            className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 truncate">
                              {usuarioActual.nombre} {usuarioActual.apellidos}
                            </p>
                            <p className="text-sm text-gray-600 truncate">{usuarioActual.correo}</p>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${getRolBadgeColor(usuarioActual.rol)}`}>
                              {getRolLabel(usuarioActual.rol)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Opciones */}
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setPerfilOpen(false);
                            navigate('/perfil');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User className="w-4 h-4 text-gray-500" />
                          <span>Mi Perfil</span>
                        </button>
                        
                          <button
                            onClick={() => {
                              setPerfilOpen(false);
                              navigate('/configuracion');
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Settings className="w-4 h-4 text-gray-500" />
                            <span>Configuración</span>
                          </button>
                        
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-200 py-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>
        </header>

        {/* Contenido de página */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}