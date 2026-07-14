// =============================================
// APLICACIÓN PRINCIPAL — ROUTING COMPLETO
// Sistema de Gestión de Tickets - Banco de Alimentos Perú
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
import MisUsuariosPage from './pages/MisUsuariosPage';
import TicketsPorAtenderPage from './pages/TicketsPorAtenderPage';
import TicketsAtendidosPage from './pages/TicketsAtendidosPage';
import DashboardAreaPage from './pages/DashboardAreaPage';
import DashboardGeneralPage from './pages/DashboardGeneralPage';
import DashboardEncuestasPage from './pages/DashboardEncuestasPage';
import RecuperarPasswordPage from './pages/RecuperarPasswordPage';
import UsuarioDetallePage from './pages/UsuarioDetallePage';
import NotificacionesPage from './pages/NotificacionesPage';
import GestionEncuestasPage from './pages/GestionEncuestasPage';
import EditorEncuestasPage from './pages/EditorEncuestasPage';
import EncuestaUsuarioFinalPage from './pages/EncuestaUsuarioFinalPage';
import DetalleTicketsUsuarioPage from './pages/DetalleTicketsUsuarioPage';

// ─── Guards ───────────────────────────────────────────────────────────────────
function RutaProtegida({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function RutaPublica({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function RutaPorRol({ children, rolesPermitidos }: { children: React.ReactNode; rolesPermitidos: string[] }) {
  const { usuarioActual } = useAuthStore();

  if (!usuarioActual || !rolesPermitidos.includes(usuarioActual.rol)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center p-8">
          <p className="text-4xl mb-4">🔒</p>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-slate-100">Acceso Restringido</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-2">No tienes permisos para esta sección</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-gray-200 dark:bg-slate-700 dark:text-slate-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600"
          >
            ← Volver
          </button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  // Nota: las preferencias de apariencia (modo oscuro, tamaño de texto, etc.)
  // ya las aplica themeStore.ts directamente al <html> — no duplicar aquí.
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Públicas ── */}
        <Route path="/login" element={<RutaPublica><LoginPage /></RutaPublica>} />
        <Route path="/recuperar-password" element={<RecuperarPasswordPage />} />

        {/* ── Protegidas con Layout ── */}
        <Route path="/" element={<RutaProtegida><MainLayout /></RutaProtegida>}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Dashboard usuario */}
          <Route path="dashboard" element={<InicioPage />} />

          {/* Dashboards admin */}
          <Route path="dashboard-general" element={
            <RutaPorRol rolesPermitidos={['superadmin', 'administrador']}>
              <DashboardGeneralPage />
            </RutaPorRol>
          } />
          <Route path="dashboard-area" element={
            <RutaPorRol rolesPermitidos={['superadmin', 'administrador', 'supervisor']}>
              <DashboardAreaPage />
            </RutaPorRol>
          } />
          <Route path="dashboard-encuestas" element={
            <RutaPorRol rolesPermitidos={['superadmin', 'administrador', 'supervisor']}>
              <DashboardEncuestasPage />
            </RutaPorRol>
          } />

          {/* Tickets */}
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="tickets/nuevo" element={<NuevoTicketPage />} />
          <Route path="tickets/atender" element={
            <RutaPorRol rolesPermitidos={['superadmin', 'administrador', 'tecnico']}>
              <TicketsPorAtenderPage />
            </RutaPorRol>
          } />
          <Route path="tickets/atendidos" element={
            <RutaPorRol rolesPermitidos={['superadmin', 'administrador', 'tecnico']}>
              <TicketsAtendidosPage />
            </RutaPorRol>
          } />
          <Route path="tickets/:id" element={
            <RutaPorRol rolesPermitidos={['superadmin', 'administrador', 'tecnico', 'supervisor', 'usuario']}>
              <ChatMaestro />
            </RutaPorRol>
          } />

          {/* Usuarios */}
          <Route path="usuarios" element={
            <RutaPorRol rolesPermitidos={['superadmin', 'administrador']}>
              <UsuariosPage />
            </RutaPorRol>
          } />
          <Route path="usuarios/mis-usuarios" element={
            <RutaPorRol rolesPermitidos={['superadmin', 'supervisor']}>
              <MisUsuariosPage />
            </RutaPorRol>
          } />
          <Route path="dashboard/usuario/:userId" element={
            <RutaPorRol rolesPermitidos={['superadmin', 'administrador']}>
              <UsuarioDetallePage />
            </RutaPorRol>
          } />

          {/* Perfil y Configuración */}
          <Route path="perfil" element={<PerfilPage />} />
          <Route path="configuracion" element={<ConfiguracionPage />} />

          {/* Notificaciones */}
          <Route path="notificaciones" element={<NotificacionesPage />} />

          {/* Detalle de Tickets por Usuario */}
          <Route path="detalle-tickets-usuario/:userId" element={
            <RutaPorRol rolesPermitidos={['superadmin', 'administrador', 'supervisor']}>
              <DetalleTicketsUsuarioPage />
            </RutaPorRol>
          } />

          {/* Gestión de Encuestas */}
          <Route path="gestion-encuestas" element={
            <RutaPorRol rolesPermitidos={['superadmin', 'administrador']}>
              <GestionEncuestasPage />
            </RutaPorRol>
          } />

          <Route path="/encuesta/:encuestaToken" element={<EncuestaUsuarioFinalPage />} />

          <Route path="editor-encuestas" element={
            <RutaPorRol rolesPermitidos={['superadmin', 'administrador']}>
              <EditorEncuestasPage />
            </RutaPorRol>
          } />

          <Route path="editor-encuestas/:plantillaId" element={
            <RutaPorRol rolesPermitidos={['superadmin', 'administrador']}>
              <EditorEncuestasPage />
            </RutaPorRol>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;