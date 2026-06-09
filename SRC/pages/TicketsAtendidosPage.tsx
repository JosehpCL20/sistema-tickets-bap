// =============================================
// TICKETS ATENDIDOS - ✅ CON TIEMPO ESTIMADO EN AMBAS PESTAÑAS
// ✅ Columna "Estado" eliminada (redundante)
// Para: Técnico, Administrador, Super Admin
// Sistema de Gestión de Tickets - Banco de Alimentos Perú
// =============================================

import React from 'react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTicketStore } from '../store/ticketStore';
import { supabase } from '../lib/supabaseClient';
import { 
  ArrowLeft, Search, CheckCircle, XCircle, User, ChevronLeft, ChevronRight,
  Calendar, Clock, FileCheck, Timer, Lock, Eye, RotateCcw
} from 'lucide-react';
import type { TicketStatus, TicketPriority } from '../types';

export default function TicketsAtendidosPage() {
  const navigate = useNavigate();
  const { usuarioActual, obtenerUsuarioPorId } = useAuthStore();
  const { tickets, cerrarTicket } = useTicketStore();
  
  const [pestanaActiva, setPestanaActiva] = useState<'resueltos' | 'cerrados'>('resueltos');
  const [busquedaLocal, setBusquedaLocal] = useState('');
  const [filasPorPagina, setFilasPorPagina] = useState(15);
  const [paginaActual, setPaginaActual] = useState(1);

  const ticketsAtendidos = useMemo(() => {
    let lista = tickets.filter(t => 
      t.estado === (pestanaActiva === 'resueltos' ? 'resuelto' : 'cerrado')
    );
    
    if (usuarioActual?.rol === 'tecnico') {
      lista = lista.filter(t => 
        String(t.tecnico_tomo_id) === String(usuarioActual.id) ||
        String(t.tecnicoAsignadoId) === String(usuarioActual.id)
      );
    }
    
    if (busquedaLocal.trim()) {
      lista = lista.filter(t => 
        t.titulo.toLowerCase().includes(busquedaLocal.toLowerCase()) ||
        t.descripcion.toLowerCase().includes(busquedaLocal.toLowerCase())
      );
    }
    
    return lista.sort((a, b) => {
      const fechaA = new Date(a.fecha_cierre || a.fecha_resolucion || 0).getTime();
      const fechaB = new Date(b.fecha_cierre || b.fecha_resolucion || 0).getTime();
      return fechaB - fechaA;
    });
  }, [tickets, usuarioActual, pestanaActiva, busquedaLocal]);

  const totalPaginas = Math.ceil(ticketsAtendidos.length / filasPorPagina);
  const ticketsPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * filasPorPagina;
    return ticketsAtendidos.slice(inicio, inicio + filasPorPagina);
  }, [ticketsAtendidos, paginaActual, filasPorPagina]);

  const formatearFecha = (fecha: any): string => {
    if (!fecha || fecha === '' || fecha === null || fecha === undefined) return '-';
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return '-';
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

  const calcularTiempoSolucion = (ticket: any): string => {
    const inicio = ticket.fecha_tomada || ticket.fechaCreacion;
    const fin = ticket.fecha_resolucion;
    
    if (!inicio || !fin) return '-';
    
    const inicioMs = new Date(inicio).getTime();
    const finMs = new Date(fin).getTime();
    const diffMs = finMs - inicioMs;
    
    if (diffMs < 0) return '-';
    
    const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (dias > 0) return `${dias}d ${horas}h ${mins}m`;
    if (horas > 0) return `${horas}h ${mins}m`;
    return `${mins}m`;
  };

  const calcularTiempoCierre = (ticket: any): string => {
    if (!ticket.fecha_resolucion || !ticket.fecha_cierre) return '-';
    const inicioMs = new Date(ticket.fecha_resolucion).getTime();
    const finMs = new Date(ticket.fecha_cierre).getTime();
    const diffMs = finMs - inicioMs;
    if (diffMs < 0) return '-';
    const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (dias > 0) return `${dias}d ${horas}h ${mins}m`;
    if (horas > 0) return `${horas}h ${mins}m`;
    return `${mins}m`;
  };

  const getInfoPrioridad = (prioridad: TicketPriority) => {
    const prioridades: Record<TicketPriority, { label: string; color: string }> = {
      'muy_baja': { label: 'Muy Baja', color: 'bg-gray-100 text-gray-600' },
      'baja': { label: 'Baja', color: 'bg-green-100 text-green-700' },
      'media': { label: 'Media', color: 'bg-blue-100 text-blue-700' },
      'alta': { label: 'Alta', color: 'bg-orange-100 text-orange-700' },
      'muy_alta': { label: 'Muy Alta', color: 'bg-red-100 text-red-700' }
    };
    return prioridades[prioridad] || prioridades['media'];
  };

  const handleCerrarTicket = async (ticketId: number) => {
    if (confirm('¿Estás seguro de cerrar este ticket permanentemente?')) {
      try {
        await cerrarTicket(ticketId);
        alert('✅ Ticket cerrado permanentemente.');
      } catch (error: any) {
        alert('❌ Error: ' + error.message);
      }
    }
  };

  const handleReabrirTicket = async (ticketId: number) => {
    if (confirm('¿Estás seguro de reabrir este ticket? Volverá a estado "Asignado".')) {
      try {
        await supabase
          .from('tickets')
          .update({
            estado: 'asignado',
            fecha_cierre: null,
            fecha_modificacion: new Date().toISOString()
          })
          .eq('id', ticketId);
        
        await useTicketStore.getState().cargarTickets();
        alert('✅ Ticket reabierto. Ahora aparece en "Tickets por Atender".');
      } catch (error: any) {
        alert('❌ Error: ' + error.message);
      }
    }
  };

  const puedeGestionarTicket = (ticket: any): boolean => {
    if (!usuarioActual) return false;
    if (usuarioActual.rol === 'superadmin' || usuarioActual.rol === 'administrador') return true;
    if (String(ticket.tecnico_tomo_id) === String(usuarioActual.id) ||
        String(ticket.tecnicoAsignadoId) === String(usuarioActual.id)) return true;
    return false;
  };

  // ✅ CÁLCULO DE COLSPAN: 11 columnas para resueltos, 12 para cerrados
  // (Antes era 12 y 13 respectivamente, ahora -1 por eliminación de columna Estado)
  const colSpanVacio = pestanaActiva === 'resueltos' ? 11 : 12;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Volver"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Tickets Atendidos</h1>
            <p className="text-gray-500 mt-1">
              {pestanaActiva === 'resueltos' ? 'Tickets resueltos (pendientes de cierre)' : 'Tickets cerrados'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
          <FileCheck className="w-5 h-5 text-green-600" />
          <span className="font-medium text-green-700">{ticketsAtendidos.length} tickets</span>
        </div>
      </div>

      {/* Pestañas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <div className="flex gap-2">
          <button
            onClick={() => { setPestanaActiva('resueltos'); setPaginaActual(1); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              pestanaActiva === 'resueltos'
                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            Resueltos
            <span className="ml-auto bg-green-200 text-green-800 px-2 py-0.5 rounded-full text-xs">
              {tickets.filter(t => t.estado === 'resuelto').length}
            </span>
          </button>
          <button
            onClick={() => { setPestanaActiva('cerrados'); setPaginaActual(1); }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              pestanaActiva === 'cerrados'
                ? 'bg-gray-600 text-white border-2 border-gray-700'
                : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
            }`}
          >
            <XCircle className="w-5 h-5" />
            Cerrados
            <span className="ml-auto bg-gray-700 text-white px-2 py-0.5 rounded-full text-xs">
              {tickets.filter(t => t.estado === 'cerrado').length}
            </span>
          </button>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar tickets..."
            value={busquedaLocal}
            onChange={(e) => { setBusquedaLocal(e.target.value); setPaginaActual(1); }}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {/* Tabla de tickets */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">ID</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Título</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Solicitante</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Técnico</th>
                {/* ✅ ELIMINADA: Columna "Estado" (redundante) */}
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Prioridad</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Categoría</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Fecha Apertura</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">⏱️ Tiempo de Solución</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">📊 Tiempo Estimado</th>
                {pestanaActiva === 'cerrados' && (
                  <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">⏱️ Tiempo de Cierre</th>
                )}
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Fecha {pestanaActiva === 'resueltos' ? 'Resolución' : 'Cierre'}</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ticketsPaginados.length === 0 ? (
                <tr>
                  <td colSpan={colSpanVacio} className="text-center py-12 text-gray-500">
                    {pestanaActiva === 'resueltos' ? (
                      <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-2" />
                    ) : (
                      <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    )}
                    <p>No hay tickets {pestanaActiva} para mostrar</p>
                  </td>
                </tr>
              ) : (
                ticketsPaginados.map((ticket) => {
                  const infoPrioridad = getInfoPrioridad(ticket.prioridad);
                  const solicitante = obtenerUsuarioPorId(ticket.solicitanteId);
                  const tecnico = obtenerUsuarioPorId(ticket.tecnico_tomo_id || '');
                  
                  return (
                    <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-3"><span className="font-mono text-xs text-gray-600">#{String(ticket.id || 0).padStart(4, '0')}</span></td>
                      <td className="px-3 py-3">
                        <button onClick={() => navigate(`/tickets/${String(ticket.id)}`)} className="text-emerald-600 hover:underline text-left">
                          {ticket.titulo.length > 40 ? ticket.titulo.substring(0, 40) + '...' : ticket.titulo}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600">{solicitante ? `${solicitante.nombre} ${solicitante.apellidos}` : 'Desconocido'}</td>
                      <td className="px-3 py-3 text-xs text-gray-600">{tecnico ? `${tecnico.nombre} ${tecnico.apellidos}` : 'Sin asignar'}</td>
                      {/* ✅ ELIMINADA: Celda de "Estado" */}
                      <td className="px-3 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${infoPrioridad.color}`}>{infoPrioridad.label}</span></td>
                      <td className="px-3 py-3 text-xs text-gray-600">{ticket.categoria || '-'}</td>
                      <td className="px-3 py-3 text-xs text-gray-600">{formatearFecha(ticket.fechaCreacion)}</td>
                      <td className="px-3 py-3">
                        <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          {calcularTiempoSolucion(ticket)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs font-medium text-gray-600">
                          {ticket.tiempo_estimado || '-'}
                        </span>
                      </td>
                      {pestanaActiva === 'cerrados' && (
                        <td className="px-3 py-3">
                          <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {calcularTiempoCierre(ticket)}
                          </span>
                        </td>
                      )}
                      <td className="px-3 py-3 text-xs text-gray-600">{formatearFecha(ticket.fecha_cierre || ticket.fecha_resolucion)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {puedeGestionarTicket(ticket) && (
                            <button onClick={() => handleReabrirTicket(ticket.id)} className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs">Reabrir</button>
                          )}
                          {pestanaActiva === 'resueltos' && puedeGestionarTicket(ticket) && (
                            <button onClick={() => handleCerrarTicket(ticket.id)} className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs">Cerrar</button>
                          )}
                          <button onClick={() => navigate(`/tickets/${String(ticket.id)}`)} className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded text-xs">Ver</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {ticketsAtendidos.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Mostrar:</span>
              <select value={filasPorPagina} onChange={(e) => { setFilasPorPagina(Number(e.target.value)); setPaginaActual(1); }} className="px-2 py-1 border border-gray-300 rounded text-sm">
                <option value={15}>15 filas</option>
                <option value={25}>25 filas</option>
                <option value={50}>50 filas</option>
                <option value={100}>100 filas</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Mostrando {((paginaActual - 1) * filasPorPagina) + 1} - {Math.min(paginaActual * filasPorPagina, ticketsAtendidos.length)} de {ticketsAtendidos.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1} className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
              <span className="px-3 py-1 text-sm font-medium">Página {paginaActual} de {totalPaginas || 1}</span>
              <button onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual >= totalPaginas} className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}