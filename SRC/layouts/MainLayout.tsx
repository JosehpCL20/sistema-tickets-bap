// =============================================
// LAYOUT PRINCIPAL CON NAVEGACIÓN Y FILTROS POR ROL
// Sistema de Gestión de Tickets - Banco de Alimentos Perú
// =============================================

import React from 'react';
import { useState, useEffect } from 'react'; 
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTicketStore } from '../store/ticketStore';
import { useThemeStore } from '../store/themeStore';
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
  FileCheck
} from 'lucide-react';

export default function MainLayout() {
  const navigate = useNavigate();
  const { usuarioActual, logout, notificaciones } = useAuthStore();
  const obtenerNotificacionesNoLeidas = useAuthStore((state) => state.obtenerNotificacionesNoLeidas);
  const cargarPreferencias = useThemeStore((state) => state.cargarPreferencias);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [perfilOpen, setPerfilOpen] = useState(false);

  // Defensivo: si Zustand aún está rehidratando desde localStorage, la función puede no estar lista
  const notificacionesNoLeidas = typeof obtenerNotificacionesNoLeidas === 'function'
    ? obtenerNotificacionesNoLeidas()
    : [];

  useEffect(() => {
    if (usuarioActual) {
      useTicketStore.getState().cargarTickets();
      cargarPreferencias(usuarioActual.id);
    }
  }, [usuarioActual]);

  if (!usuarioActual) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
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
      label: 'Dashboard Área',
      roles: ['superadmin', 'administrador', 'supervisor']
    },
    { 
      path: '/dashboard-general', 
      icon: Shield, 
      label: 'Dashboard General',
      roles: ['superadmin', 'administrador']
    },
    { 
      path: '/dashboard-encuestas', 
      icon: LayoutDashboard, 
      label: 'Dashboard Encuestas',
      roles: ['superadmin', 'administrador', 'supervisor']
    },
    { 
      path: '/gestion-encuestas', 
      icon: Settings, 
      label: 'Gestión de Encuestas',
      roles: ['superadmin', 'administrador']
    },
    { 
      path: '/usuarios', 
      icon: Users, 
      label: 'Usuarios',
      roles: ['superadmin', 'administrador']
    },
    { 
      path: '/usuarios/mis-usuarios', 
      icon: Users, 
      label: 'Mis Usuarios',
      roles: ['superadmin', 'supervisor']
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - VERDE #80c398 */}
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
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>Banco de Alimentos Perú</p>
          </div>
        </div>

        {/* =============================================
            NAVEGACIÓN - CON ESPACIO PARA EL PERFIL ABAJO
        ============================================= */}
        <nav 
          className="p-4 space-y-1"
          style={{ 
            maxHeight: 'calc(100vh - 280px)',
            overflowY: 'auto'
          }}
        >
          {menuFiltrado.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors"
              style={({ isActive }) => isActive ? {
                backgroundColor: '#6ab088',
                color: 'white'
              } : {
                backgroundColor: 'transparent',
                color: 'rgba(255,255,255,0.9)'
              }}
              onMouseEnter={(e) => {
                const isActive = e.currentTarget.classList.contains('active') || 
                                window.location.pathname === item.path;
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#72b58d';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                const isActive = e.currentTarget.classList.contains('active') || 
                                window.location.pathname === item.path;
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                }
              }}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* =============================================
            PERFIL DE USUARIO - FIJO EN LA PARTE INFERIOR
        ============================================= */}
        <div 
          className="absolute left-0 right-0 border-t border-white/20 pt-4 px-4"
          style={{ 
            bottom: '0px',  // ✅ Distancia desde el borde inferior de la pantalla
            backgroundColor: 'rgba(0,0,0,0.1)',
            paddingTop: '10px',   // ✅ Distancia desde el nombre hasta el borde superior del fondo
            paddingBottom: '10px' // ✅ Distancia desde el correo hasta el borde inferior del fondo
          }}
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <img
              src={usuarioActual?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(usuarioActual?.nombre || 'User')}&background=fbe066&color=fff`}
              alt={usuarioActual?.nombre}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(usuarioActual?.nombre || 'User')}&background=fbe066&color=fff`;
              }}
            />
            
            {/* Info - Solo nombre y correo */}
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
        {/* Header - CORREGIDO */}
        <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-30 transition-colors">
          <div className="flex items-center justify-between px-4 py-3 h-16">
            
            {/* Izquierda - Botón hamburguesa */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-gray-500 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex-shrink-0 btn-scalable"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Centro - Título */}
            <div 
              className="flex-1 text-center cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Sistema de Gestión de Tickets
              </h2>
            </div>

            {/* Derecha - Acciones */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Notificaciones */}
              <button 
                onClick={() => navigate('/notificaciones')}
                className="relative p-2 rounded-lg text-gray-500 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 btn-scalable"
              >
                <Bell className="w-5 h-5" />
                {notificacionesNoLeidas.length > 0 && (
                  <span 
                    className="absolute top-1 right-1 w-4 h-4 text-white text-xs rounded-full flex items-center justify-center"
                    style={{ backgroundColor: '#ea4c5b' }}
                  >
                    {notificacionesNoLeidas.length > 9 ? '9+' : notificacionesNoLeidas.length}
                  </span>
                )}
              </button>

              {/* Perfil - Dropdown COMPLETO CON AVATAR */}
              <div className="relative flex items-center">
                <button
                  onClick={() => setPerfilOpen(!perfilOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 btn-scalable"
                >
                  <img 
                    src={usuarioActual.avatar} 
                    alt={usuarioActual.nombre}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-700 dark:text-slate-200">{usuarioActual.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{usuarioActual.area}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                </button>

                {/* Dropdown del perfil - BIEN POSICIONADO */}
                {perfilOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setPerfilOpen(false)}
                    />
                    <div 
                      className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 z-50 overflow-hidden"
                      style={{
                        top: '100%',
                        maxHeight: 'calc(100vh - 80px)',
                        overflowY: 'auto'
                      }}
                    >
                      {/* Info del usuario CON AVATAR */}
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-3">
                          <img 
                            src={usuarioActual.avatar} 
                            alt={usuarioActual.nombre}
                            className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-700 shadow-sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 dark:text-slate-100 truncate">
                              {usuarioActual.nombre} {usuarioActual.apellidos}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-slate-400 truncate">{usuarioActual.correo}</p>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${getRolBadgeColor(usuarioActual.rol)}`}>
                              {getRolLabel(usuarioActual.rol)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Opciones del menú */}
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setPerfilOpen(false);
                            navigate('/perfil');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <User className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                          <span>Mi Perfil</span>
                        </button>
                        <button
                          onClick={() => {
                            setPerfilOpen(false);
                            navigate('/configuracion');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                          <span>Configuración</span>
                        </button>
                      </div>

                      {/* Logout - Separado */}
                      <div className="border-t border-gray-200 dark:border-slate-700 py-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          style={{ color: '#ea4c5b' }}
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

        {/* Contenido de la página */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}