// =============================================
// TICKETS POR ATENDER - ✅ CON BOTÓN ASIGNAR TÉCNICO
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
  ArrowLeft, Search, Clock, AlertTriangle, User, ChevronLeft, ChevronRight,
  Timer, Wrench, CheckCircle, PlayCircle, Calendar, Eye, X, Save,
  Users, AlertCircle, Loader2
} from 'lucide-react';
import type { TicketStatus, TicketPriority } from '../types';

export default function TicketsPorAtenderPage() {
  const navigate = useNavigate();
  const { usuarioActual, obtenerUsuarioPorId, usuarios } = useAuthStore();
  const { tickets, tomarTicket, marcarResuelto, asignarTecnico, cargarTickets } = useTicketStore();
  
  const [busquedaLocal, setBusquedaLocal] = useState('');
  const [filasPorPagina, setFilasPorPagina] = useState(15);
  const [paginaActual, setPaginaActual] = useState(1);
  
  // ✅ ESTADOS PARA MODAL DE ASIGNACIÓN
  const [mostrarModalAsignar, setMostrarModalAsignar] = useState(false);
  const [ticketAsignar, setTicketAsignar] = useState<any>(null);
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState<string>('');
  const [asignando, setAsignando] = useState(false);
  const [mensajeModal, setMensajeModal] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null);

  // ✅ FILTRO DE TÉCNICOS DISPONIBLES
  const tecnicosDisponibles = useMemo(() => {
    return usuarios.filter((u: any) => 
      u.rol === 'tecnico' && u.activo === true
    );
  }, [usuarios]);

  // ✅ FILTRO CORREGIDO: 
  // - Técnico: Solo ve tickets ASIGNADOS a él (no ve 'nuevo' sin asignar)
  // - Admin/Superadmin: Ven todos los pendientes (nuevo, asignado, planificado)
  const ticketsPorAtender = useMemo(() => {
    let lista = tickets.filter(t => {
      const estadoValido = t.estado === 'nuevo' || t.estado === 'asignado' || t.estado === 'planificado';
      
      if (usuarioActual?.rol === 'tecnico') {
        const miId = String(usuarioActual.id).trim();
        const asignadoPorId = String(t.tecnicoAsignadoId).trim() === miId;
        const tomoPorId = String(t.tecnico_tomo_id).trim() === miId;
        return estadoValido && (asignadoPorId || tomoPorId);
      }
      
      return estadoValido;
    });
    
    if (busquedaLocal.trim()) {
      lista = lista.filter(t => 
        t.titulo.toLowerCase().includes(busquedaLocal.toLowerCase()) ||
        t.descripcion.toLowerCase().includes(busquedaLocal.toLowerCase())
      );
    }
    
    return lista.sort((a, b) => {
      const prioridadOrden: Record<string, number> = {
        'muy_alta': 1, 'alta': 2, 'media': 3, 'baja': 4, 'muy_baja': 5
      };
      return (prioridadOrden[a.prioridad] || 5) - (prioridadOrden[b.prioridad] || 5);
    });
  }, [tickets, usuarioActual, busquedaLocal]);

  const totalPaginas = Math.ceil(ticketsPorAtender.length / filasPorPagina);
  const ticketsPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * filasPorPagina;
    return ticketsPorAtender.slice(inicio, inicio + filasPorPagina);
  }, [ticketsPorAtender, paginaActual, filasPorPagina]);

  // ✅ FORMATEAR FECHA - HORA LIMA
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

  const getInfoEstado = (estado: TicketStatus) => {
    const estados: Record<TicketStatus, { label: string; color: string }> = {
      'nuevo': { label: 'Nuevo', color: 'bg-blue-100 text-blue-700' },
      'asignado': { label: 'Asignado', color: 'bg-yellow-100 text-yellow-700' },
      'planificado': { label: 'Planificado', color: 'bg-purple-100 text-purple-700' },
      'resuelto': { label: 'Resuelto', color: 'bg-green-100 text-green-700' },
      'cerrado': { label: 'Cerrado', color: 'bg-gray-100 text-gray-700' }
    };
    return estados[estado] || estados['nuevo'];
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

  const handleTomarTicket = async (ticketId: number) => {
    try {
      await tomarTicket(ticketId);
      alert('✅ Ticket tomado.');
    } catch (error: any) { alert('❌ Error: ' + error.message); }
  };

  const handleMarcarResuelto = async (ticketId: number) => {
    try {
      await marcarResuelto(ticketId);
      alert('✅ Ticket resuelto.');
    } catch (error: any) { alert('❌ Error: ' + error.message); }
  };

  // ✅ ABRIR MODAL DE ASIGNACIÓN
  const handleAbrirModalAsignar = (ticket: any) => {
    setTicketAsignar(ticket);
    setTecnicoSeleccionado('');
    setMensajeModal(null);
    setMostrarModalAsignar(true);
  };

  // ✅ ASIGNAR TÉCNICO AL TICKET
  const handleAsignarTecnico = async () => {
    if (!ticketAsignar || !tecnicoSeleccionado) {
      setMensajeModal({ tipo: 'error', texto: '❌ Debes seleccionar un técnico' });
      return;
    }

    setAsignando(true);
    setMensajeModal(null);

    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          tecnico_asignado_id: tecnicoSeleccionado,
          estado: 'asignado',
          fecha_modificacion: new Date().toISOString()
        })
        .eq('id', ticketAsignar.id);

      if (error) throw error;

      await supabase
        .from('ticket_participantes')
        .upsert({ 
          ticket_id: ticketAsignar.id, 
          usuario_id: tecnicoSeleccionado 
        });

      await cargarTickets();

      setMensajeModal({ tipo: 'success', texto: '✅ Técnico asignado correctamente' });

      setTimeout(() => {
        setMostrarModalAsignar(false);
        setTicketAsignar(null);
        setTecnicoSeleccionado('');
      }, 1500);

    } catch (error: any) {
      console.error('Error asignando técnico:', error);
      setMensajeModal({ tipo: 'error', texto: `❌ Error: ${error.message}` });
    } finally {
      setAsignando(false);
    }
  };

  // ✅ Técnico solo puede tomar/resolver tickets que ya le fueron asignados
  const puedeTomarTicket = (ticket: any): boolean => {
    const yaAsignado = ticket.tecnicoAsignadoId || ticket.tecnico_tomo_id;
    return !yaAsignado && !ticket.fecha_tomada && ticket.estado !== 'resuelto' && ticket.estado !== 'cerrado';
  };

  const puedeResolverTicket = (ticket: any): boolean => {
    const esTecnicoAsignado = 
      String(ticket.tecnicoAsignadoId) === String(usuarioActual?.id) ||
      String(ticket.tecnico_tomo_id) === String(usuarioActual?.id);
    
    return esTecnicoAsignado && ticket.estado !== 'resuelto' && ticket.estado !== 'cerrado';
  };

  // ✅ Solo Admin/SuperAdmin pueden asignar técnicos
  const puedeAsignarTecnico = (): boolean => {
    return usuarioActual?.rol === 'superadmin' || usuarioActual?.rol === 'administrador';
  };

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
            <h1 className="text-2xl font-bold text-gray-800">Tickets por Atender</h1>
            <p className="text-gray-500 mt-1">
              {usuarioActual?.rol === 'tecnico' 
                ? 'Tus tickets asignados' 
                : 'Tickets pendientes de atención'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg">
          <Clock className="w-5 h-5 text-amber-600" />
          <span className="font-medium text-amber-700">{ticketsPorAtender.length} pendientes</span>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Buscar tickets..." value={busquedaLocal}
            onChange={(e) => { setBusquedaLocal(e.target.value); setPaginaActual(1); }}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg" />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">ID</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Título</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Solicitante</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Estado</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Prioridad</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Fecha Apertura</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Última Modificación</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">¿Quién lo tomó?</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Categoría</th>
                {/* ✅ CAMBIO: Eliminado "Tiempo Total", mantenido "Tiempo Estimado" */}
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">⏱️ Tiempo Estimado</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 text-xs">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ticketsPaginados.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-12 text-gray-500">
                  <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-2" />
                  <p>
                    {usuarioActual?.rol === 'tecnico' 
                      ? 'No tienes tickets asignados aún' 
                      : '¡No hay tickets pendientes!'}
                  </p>
                </td></tr>
              ) : (
                ticketsPaginados.map((ticket) => {
                  const infoEstado = getInfoEstado(ticket.estado);
                  const infoPrioridad = getInfoPrioridad(ticket.prioridad);
                  const solicitante = obtenerUsuarioPorId(ticket.solicitanteId);
                  const quienTomó = obtenerUsuarioPorId(ticket.tecnico_tomo_id || '');
                  const tecnicoAsignado = obtenerUsuarioPorId(ticket.tecnicoAsignadoId || '');
                  
                  return (
                    <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-3"><span className="font-mono text-xs text-gray-600">#{String(ticket.id || 0).padStart(4, '0')}</span></td>
                      <td className="px-3 py-3">
                        <button onClick={() => navigate(`/tickets/${String(ticket.id)}`)} className="text-emerald-600 hover:underline text-left">
                          {ticket.titulo.length > 40 ? ticket.titulo.substring(0, 40) + '...' : ticket.titulo}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600">{solicitante ? `${solicitante.nombre} ${solicitante.apellidos}` : 'Desconocido'}</td>
                      <td className="px-3 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${infoEstado.color}`}>{infoEstado.label}</span></td>
                      <td className="px-3 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${infoPrioridad.color}`}>{infoPrioridad.label}</span></td>
                      <td className="px-3 py-3 text-xs text-gray-600">{formatearFecha(ticket.fechaCreacion)}</td>
                      <td className="px-3 py-3 text-xs text-gray-600">{formatearFecha(ticket.fechaModificacion)}</td>
                      <td className="px-3 py-3 text-xs text-gray-600">
                        {quienTomó ? (
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{quienTomó.nombre}</span>
                        ) : tecnicoAsignado ? (
                          <span className="flex items-center gap-1 text-blue-600"><Wrench className="w-3 h-3" />{tecnicoAsignado.nombre}</span>
                        ) : (
                          <span className="text-gray-400 italic">Disponible</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600">{ticket.categoria || '-'}</td>
                      {/* ✅ CAMBIO: Eliminado Tiempo Total, mantenido Tiempo Estimado */}
                      <td className="px-3 py-3">
                        <span className="text-xs font-medium text-gray-600">
                          {ticket.tiempo_estimado || '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {/* ✅ BOTÓN ASIGNAR - Solo Admin/SuperAdmin */}
                          {puedeAsignarTecnico() && (
                            <button 
                              onClick={() => handleAbrirModalAsignar(ticket)} 
                              className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                                ticket.tecnicoAsignadoId || ticket.tecnico_tomo_id
                                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                              }`}
                            >
                              <Users className="w-3 h-3" />
                              {ticket.tecnicoAsignadoId || ticket.tecnico_tomo_id 
                                ? 'Reasignar' 
                                : 'Asignar'}
                            </button>
                          )}
                          
                          {/* ✅ BOTÓN TOMAR - Solo si NO está asignado */}
                          {puedeTomarTicket(ticket) && (
                            <button 
                              onClick={() => handleTomarTicket(ticket.id)} 
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                            >
                              Tomar
                            </button>
                          )}
                          
                          {/* ✅ BOTÓN RESOLVER - Si es el técnico asignado */}
                          {puedeResolverTicket(ticket) && (
                            <button 
                              onClick={() => handleMarcarResuelto(ticket.id)} 
                              className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                            >
                              Resolver
                            </button>
                          )}
                          
                          {/* ✅ BOTÓN VER - Siempre visible */}
                          <button 
                            onClick={() => navigate(`/tickets/${String(ticket.id)}`)} 
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                          >
                            Ver
                          </button>
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
        {ticketsPorAtender.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
            Página {paginaActual} de {totalPaginas || 1}
          </div>
        )}
      </div>

      {/* ✅ MODAL DE ASIGNACIÓN DE TÉCNICO */}
      {mostrarModalAsignar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            {/* Header del Modal */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Asignar Técnico
                </h3>
                <button 
                  onClick={() => setMostrarModalAsignar(false)} 
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {ticketAsignar && (
                <p className="text-sm text-gray-500 mt-2">
                  Ticket: <strong>#{String(ticketAsignar.id).padStart(4, '0')}</strong> - {ticketAsignar.titulo}
                </p>
              )}
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-4">
              {/* Mensajes */}
              {mensajeModal && (
                <div className={`p-3 rounded-lg flex items-start gap-2 ${
                  mensajeModal.tipo === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  {mensajeModal.tipo === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <p className={`text-sm ${mensajeModal.tipo === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                    {mensajeModal.texto}
                  </p>
                </div>
              )}

              {/* Lista de Técnicos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecciona un técnico *
                </label>
                {tecnicosDisponibles.length === 0 ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                    <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                    <p className="text-amber-800 text-sm">No hay técnicos disponibles en el sistema</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {tecnicosDisponibles.map((tecnico: any) => (
                      <label
                        key={tecnico.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          tecnicoSeleccionado === tecnico.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="tecnico"
                          value={tecnico.id}
                          checked={tecnicoSeleccionado === tecnico.id}
                          onChange={(e) => setTecnicoSeleccionado(e.target.value)}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <img
                            src={tecnico.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(tecnico.nombre)}&background=80c398&color=fff`}
                            alt={tecnico.nombre}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{tecnico.nombre} {tecnico.apellidos}</p>
                            <p className="text-xs text-gray-500">{tecnico.area || 'Sin área asignada'}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Información del ticket */}
              {ticketAsignar && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Información del ticket:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Categoría:</span>
                      <p className="font-medium">{ticketAsignar.categoria}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Prioridad:</span>
                      <p className="font-medium capitalize">{ticketAsignar.prioridad.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Solicitante:</span>
                      <p className="font-medium">{obtenerUsuarioPorId(ticketAsignar.solicitanteId)?.nombre || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Estado:</span>
                      <p className="font-medium capitalize">{ticketAsignar.estado}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setMostrarModalAsignar(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={asignando}
              >
                Cancelar
              </button>
              <button
                onClick={handleAsignarTecnico}
                disabled={asignando || !tecnicoSeleccionado || tecnicosDisponibles.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: '#80c398' }}
                onMouseEnter={(e) => !asignando && tecnicoSeleccionado && (e.currentTarget.style.backgroundColor = '#6ab088')}
                onMouseLeave={(e) => !asignando && (e.currentTarget.style.backgroundColor = '#80c398')}
              >
                {asignando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Asignando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Asignar Técnico
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}