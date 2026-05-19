// =============================================
// PÁGINA: INICIO (DASHBOARD USUARIO FINAL)
// Sistema de Gestión de Tickets - Banco de Alimentos Perú
// =============================================

import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTicketStore } from '../store/ticketStore';
import { 
  Ticket, Clock, CheckCircle, ClipboardList,
  TrendingUp, PlusCircle, Calendar, User, ArrowRight
} from 'lucide-react';

export default function InicioPage() {
  const navigate = useNavigate();
  const { usuarioActual } = useAuthStore();
  const ticketStore = useTicketStore();
  
  const [ticketsEnCurso, setTicketsEnCurso] = useState<any[]>([]);
  const [ticketsResueltos, setTicketsResueltos] = useState<any[]>([]);
  const [ticketsCerrados, setTicketsCerrados] = useState<any[]>([]);
  
  // ✅ Pestaña activa para las tablas
  const [pestanaActiva, setPestanaActiva] = useState<'enCurso' | 'resueltos' | 'cerrados'>('enCurso');

  useEffect(() => {
    const cargarTickets = async () => {
      if (usuarioActual) {
        await ticketStore.cargarTickets();
      }
    };
    cargarTickets();
  }, [usuarioActual]);

  const misTickets = useMemo(() => {
    return ticketStore.obtenerTicketsPorUsuario?.(usuarioActual?.id || '') || [];
  }, [ticketStore.tickets, usuarioActual]);

  useEffect(() => {
    const enCurso = misTickets.filter((t: any) => 
      ['nuevo', 'asignado', 'planificado'].includes(t.estado)
    );
    const resueltos = misTickets.filter((t: any) => t.estado === 'resuelto');
    const cerrados = misTickets.filter((t: any) => t.estado === 'cerrado');
    
    setTicketsEnCurso(enCurso.slice(0, 15));
    setTicketsResueltos(resueltos.slice(0, 15));
    setTicketsCerrados(cerrados.slice(0, 15));
  }, [misTickets]);

  const stats = useMemo(() => ({
    total: misTickets.length,
    enCurso: misTickets.filter((t: any) => ['nuevo', 'asignado', 'planificado'].includes(t.estado)).length,
    resueltos: misTickets.filter((t: any) => t.estado === 'resuelto').length,
    cerrados: misTickets.filter((t: any) => t.estado === 'cerrado').length
  }), [misTickets]);

  const getEstadoStyle = (estado: string) => {
    const colores: Record<string, any> = {
      'nuevo': { backgroundColor: '#fbe066', color: '#856404' },
      'asignado': { backgroundColor: '#e3f2fd', color: '#1565c0' },
      'planificado': { backgroundColor: '#f3e5f5', color: '#7b1fa2' },
      'resuelto': { backgroundColor: '#e8f5e9', color: '#2e7d32' },
      'cerrado': { backgroundColor: '#f5f5f5', color: '#616161' }
    };
    return colores[estado] || { backgroundColor: '#f5f5f5', color: '#616161' };
  };

  // ✅ FORMATEAR FECHA - HORA LIMA (SIN RESTRICCIÓN DE AÑO 1970)
  const formatearFecha = (fecha: any): string => {
    // Solo validar si existe la fecha
    if (!fecha || fecha === '' || fecha === null || fecha === undefined) {
      return '-';
    }
    
    const date = new Date(fecha);
    
    // Solo validar si es fecha inválida (NaN)
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    // ✅ Formatear con timezone Lima
    return new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header de bienvenida */}
      <div className="rounded-2xl p-8 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #80c398 0%, #6ab088 100%)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            ¡Bienvenido{usuarioActual?.nombre ? `, ${usuarioActual.nombre}` : ''}!👋
          </h1>
          <p className="text-white/90 text-lg">
            {usuarioActual?.area} • {usuarioActual?.rol === 'superadmin' ? 'Jefe de Sistemas y Procesos' : 
              usuarioActual?.rol === 'administrador' ? 'Administrador de Sistemas' :
              usuarioActual?.rol === 'supervisor' ? 'Supervisor de Área' :
              usuarioActual?.rol === 'tecnico' ? 'Técnico de Sistemas' : 'Usuario'}
          </p>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Tickets</p>
              <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="w-20 h-20 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#80c398' }}>
              <Ticket className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">En Curso</p>
              <p className="text-3xl font-bold text-gray-800">{stats.enCurso}</p>
            </div>
            <div className="w-20 h-20 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#fbe066' }}>
              <Clock className="w-10 h-10 text-gray-800" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Resueltos</p>
              <p className="text-3xl font-bold text-gray-800">{stats.resueltos}</p>
            </div>
            <div className="w-20 h-20 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#4caf50' }}>
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Cerrados</p>
              <p className="text-3xl font-bold text-gray-800">{stats.cerrados}</p>
            </div>
            <div className="w-20 h-20 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#6b7280' }}>
              <ClipboardList className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción rápida */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/tickets/nuevo')}
          className="p-6 rounded-xl border-2 border-dashed transition-all hover:shadow-lg text-left w-full"
          style={{ borderColor: '#80c398', backgroundColor: '#f0f9f4' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#80c398' }}>
              <PlusCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Crear Nuevo Ticket</h3>
              <p className="text-sm text-gray-500">Reporta un problema o solicitud</p>
            </div>
            <ArrowRight className="w-5 h-5 ml-auto" style={{ color: '#80c398' }} />
          </div>
        </button>

        <button
          onClick={() => navigate('/tickets')}
          className="p-6 rounded-xl border-2 border-dashed transition-all hover:shadow-lg text-left w-full"
          style={{ borderColor: '#ea4c5b', backgroundColor: '#fef2f2' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#ea4c5b' }}>
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Ver Mis Tickets</h3>
              <p className="text-sm text-gray-500">Consulta el estado de tus solicitudes</p>
            </div>
            <ArrowRight className="w-5 h-5 ml-auto" style={{ color: '#ea4c5b' }} />
          </div>
        </button>
      </div>

      {/* ✅ TABLAS CON PESTAÑAS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Pestañas */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setPestanaActiva('enCurso')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              pestanaActiva === 'enCurso'
                ? 'border-b-2 border-amber-500 text-amber-600 bg-amber-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-5 h-5" />
              Casos en Curso
              <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                {ticketsEnCurso.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setPestanaActiva('resueltos')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              pestanaActiva === 'resueltos'
                ? 'border-b-2 border-green-500 text-green-600 bg-green-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Casos Resueltos
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                {ticketsResueltos.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setPestanaActiva('cerrados')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              pestanaActiva === 'cerrados'
                ? 'border-b-2 border-gray-500 text-gray-600 bg-gray-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Casos Cerrados
              <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                {ticketsCerrados.length}
              </span>
            </div>
          </button>
        </div>

        {/* Contenido de pestañas */}
        <div className="p-6">
          
          {/* PESTAÑA: Casos en Curso */}
          {pestanaActiva === 'enCurso' && (
            <div>
              {ticketsEnCurso.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay tickets en curso</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200" style={{ backgroundColor: '#f8f9fa' }}>
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">ID</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Título</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Estado</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ticketsEnCurso.map((ticket: any) => (
                        <tr key={ticket.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/tickets/${String(ticket.id)}`)}>
                          <td className="px-4 py-3"><span className="font-mono text-sm text-gray-600">#{String(ticket.id || 0).padStart(4, '0')}</span></td>
                          <td className="px-4 py-3"><span className="font-medium hover:underline cursor-pointer" style={{ color: '#ea4c5b' }}>{ticket.titulo}</span></td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getEstadoStyle(ticket.estado)}`}>{ticket.estado}</span></td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatearFecha(ticket.fechaModificacion)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PESTAÑA: Casos Resueltos */}
          {pestanaActiva === 'resueltos' && (
            <div>
              {ticketsResueltos.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay tickets resueltos</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200" style={{ backgroundColor: '#f8f9fa' }}>
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">ID</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Título</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Estado</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ticketsResueltos.map((ticket: any) => (
                        <tr key={ticket.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/tickets/${String(ticket.id)}`)}>
                          <td className="px-4 py-3"><span className="font-mono text-sm text-gray-600">#{String(ticket.id || 0).padStart(4, '0')}</span></td>
                          <td className="px-4 py-3"><span className="font-medium hover:underline cursor-pointer" style={{ color: '#ea4c5b' }}>{ticket.titulo}</span></td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getEstadoStyle(ticket.estado)}`}>{ticket.estado}</span></td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatearFecha(ticket.fechaCierre)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PESTAÑA: Casos Cerrados */}
          {pestanaActiva === 'cerrados' && (
            <div>
              {ticketsCerrados.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay tickets cerrados</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200" style={{ backgroundColor: '#f8f9fa' }}>
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">ID</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Título</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Estado</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Fecha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ticketsCerrados.map((ticket: any) => (
                        <tr key={ticket.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/tickets/${String(ticket.id)}`)}>
                          <td className="px-4 py-3"><span className="font-mono text-sm text-gray-600">#{String(ticket.id || 0).padStart(4, '0')}</span></td>
                          <td className="px-4 py-3"><span className="font-medium hover:underline cursor-pointer" style={{ color: '#ea4c5b' }}>{ticket.titulo}</span></td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getEstadoStyle(ticket.estado)}`}>{ticket.estado}</span></td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatearFecha(ticket.fechaCierre)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}