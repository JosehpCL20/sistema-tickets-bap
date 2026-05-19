// =============================================
// APLICACIÓN PRINCIPAL - ROUTING CON PROTECCIÓN DE ROLES
// Sistema de Gestión de Tickets - Banco de Alimentos
// =============================================

import React from 'react'; 
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layouts
import MainLayout from './layouts/MainLayout';

// Páginas
import LoginPage from './pages/LoginPage';
import InicioPage from './pages/InicioPage';
import TicketsPage from './pages/TicketsPage';
import NuevoTicketPage from './pages/NuevoTicketPage';
import ChatMaestro from './pages/ChatMaestro';
import PerfilPage from './pages/PerfilPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import UsuariosPage from './pages/UsuariosPage';
import TicketsPorAtenderPage from './pages/TicketsPorAtenderPage';
//import DashboardAreaPage from './pages/DashboardAreaPage';
import DashboardGeneralPage from './pages/DashboardGeneralPage';
import RecuperarPasswordPage from './pages/RecuperarPasswordPage';
import UsuarioDetallePage from './pages/UsuarioDetallePage';
import TicketsAtendidosPage from './pages/TicketsAtendidosPage';

// =============================================
// COMPONENTE PARA RUTAS PROTEGIDAS (Autenticación)
// =============================================
function RutaProtegida({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// =============================================
// COMPONENTE PARA PROTECCIÓN POR ROLES
// =============================================
function RutaPorRol({ 
  children, 
  rolesPermitidos 
}: { 
  children: React.ReactNode; 
  rolesPermitidos: string[] 
}) {
  const { usuarioActual } = useAuthStore();
  
  if (!usuarioActual || !rolesPermitidos.includes(usuarioActual.rol)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-800">Acceso Restringido</h2>
          <p className="text-gray-500 mt-2">No tienes permisos para acceder a esta sección</p>
          <button 
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← Volver
          </button>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

// =============================================
// COMPONENTE PARA RUTAS PÚBLICAS
// =============================================
function RutaPublica({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========== RUTAS PÚBLICAS ========== */}
        <Route path="/login" element={
          <RutaPublica>
            <LoginPage />
          </RutaPublica>
        } />
        <Route path="/recuperar-password" element={<RecuperarPasswordPage />} />

        {/* ========== RUTAS PROTEGIDAS (con MainLayout) ========== */}
        <Route path="/" element={
          <RutaProtegida>
            <MainLayout />
          </RutaProtegida>
        }>
          {/* Redirección inicial */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          {/* Dashboards */}
          <Route path="dashboard" element={<InicioPage />} />
          {/*<Route path="dashboard-area" element={<DashboardAreaPage />} />*/}
          
          {/* ✅ Dashboard General - SOLO superadmin y admin */}
          <Route path="dashboard-general" element={
            <RutaPorRol rolesPermitidos={['superadmin', 'administrador']}>
              <DashboardGeneralPage />
            </RutaPorRol>
          } />
          
          {/* ✅ Detalle de Usuario - SOLO superadmin y admin */}
          <Route path="dashboard/usuario/:userId" element={
            <RutaPorRol rolesPermitidos={['superadmin', 'administrador']}>
              <UsuarioDetallePage />
            </RutaPorRol>
          } />
          
          {/* Tickets */}
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="tickets/nuevo" element={<NuevoTicketPage />} />
          
          {/* ✅ Detalle de Ticket - SOLO superadmin y admin */}
          <Route path="tickets/:id" element={
            <RutaPorRol rolesPermitidos={['superadmin', 'administrador', 'tecnico']}>
              <ChatMaestro />
            </RutaPorRol>
          } />
          
          {/* ✅ Tickets por Atender - superadmin, admin y tecnico */}
          <Route path="tickets/atender" element={
            <RutaPorRol rolesPermitidos={['superadmin', 'administrador', 'tecnico']}>
              <TicketsPorAtenderPage />
            </RutaPorRol>
          } />

          {/* ✅ Tickets Atendidos - superadmin, admin y tecnico */}
          <Route path="tickets/atendidos" element={
            <RutaPorRol rolesPermitidos={['superadmin', 'administrador', 'tecnico']}>
              <TicketsAtendidosPage />
            </RutaPorRol>
          } />
          
          {/* ✅ Gestión de Usuarios - SOLO superadmin y admin */}
          <Route path="usuarios" element={
            <RutaPorRol rolesPermitidos={['superadmin', 'administrador']}>
              <UsuariosPage />
            </RutaPorRol>
          } />

          {/* Perfil y Configuración */}
          <Route path="perfil" element={<PerfilPage />} />
          <Route path="configuracion" element={<ConfiguracionPage />} />

          {/* Notificaciones - placeholder */}
          <Route path="notificaciones" element={
            <div className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-800">Notificaciones</h1>
              <p className="text-gray-500 mt-2">Módulo en desarrollo</p>
            </div>
          } />
        </Route>

        {/* ========== 404 - Página no encontrada ========== */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-300">404</h1>
              <p className="text-gray-500 mt-2">Página no encontrada</p>
              <a href="/" className="mt-4 inline-block text-emerald-600 hover:text-emerald-700">
                Volver al inicio
              </a>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;