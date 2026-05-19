// =============================================
// PÁGINA: DETALLE DE TICKET - CHAT MAESTRO
// Sistema de Gestión de Tickets - Banco de Alimentos Perú
// =============================================

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTicketStore } from '../store/ticketStore';
import { supabase } from '../lib/supabaseClient';
import {
  ArrowLeft, Send, Clock, CheckCircle, Calendar,
  Tag, Timer, FileCheck, XCircle, MessageSquare,
  User, Wrench, AlertCircle, Save, Loader2,
  BarChart3, RefreshCw, ThumbsUp, ThumbsDown, Users,
  Plus, Trash2
} from 'lucide-react';

export default function TicketDetallePage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuarioActual, obtenerUsuarioPorId, usuarios } = useAuthStore();
  const ticketStore = useTicketStore();

  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);

  // ✅ ESTADOS PARA TIEMPO ESTIMADO
  const [tiempoEstimado, setTiempoEstimado] = useState({ dias: 0, horas: 0, minutos: 0 });
  const [editandoTiempo, setEditandoTiempo] = useState(false);

  // ✅ ESTADOS PARA ENCUESTA
  const [encuestaCompletada, setEncuestaCompletada] = useState<boolean | null>(null);
  const [editandoEncuesta, setEditandoEncuesta] = useState(false);

  // ✅ ESTADOS PARA ACCIONES
  const [accionando, setAccionando] = useState(false);

  // ✅ ESTADO PARA AGREGAR PARTICIPANTE
  const [mostrarAgregarParticipante, setMostrarAgregarParticipante] = useState(false);
  const [participanteSeleccionado, setParticipanteSeleccionado] = useState('');

  const ticketId = idParam ? parseInt(idParam, 10) : null;

  const ticket = useMemo(() => {
    if (!ticketId) return null;
    return ticketStore.tickets.find((t: any) => t.id === ticketId) || null;
  }, [ticketStore.tickets, ticketId]);

  // Cargar datos al montar
  useEffect(() => {
    if (idParam) {
      ticketStore.seleccionarTicket(ticketId);
      setCargando(false);
    }
  }, [idParam, ticketId]);

  // ✅ VALIDAR ACCESO PARA TÉCNICOS
  useEffect(() => {
    if (usuarioActual?.rol === 'tecnico' && ticket) {
      const esAsignado =
        String(ticket.tecnicoAsignadoId) === String(usuarioActual.id) ||
        String(ticket.tecnico_tomo_id) === String(usuarioActual.id);
      if (!esAsignado) {
        alert('❌ No tienes acceso a este ticket');
        navigate('/tickets/atender');
      }
    }
  }, [ticket, usuarioActual, navigate]);

  // ✅ CARGAR TIEMPO ESTIMADO Y ENCUESTA DESDE EL TICKET
  useEffect(() => {
    if (ticket) {
      if (ticket.tiempo_estimado) {
        const match = ticket.tiempo_estimado.match(/((\d+)\s*d)?\s*((\d+)\s*h)?\s*((\d+)\s*m)?/i);
        if (match) {
          setTiempoEstimado({
            dias: parseInt(match[1] || '0'),
            horas: parseInt(match[2] || '0'),
            minutos: parseInt(match[3] || '0')
          });
        }
      }
      setEncuestaCompletada(ticket.encuestaCompletada ?? null);
    }
  }, [ticket]);

  // ✅ OBTENER PARTICIPANTES POR DEFECTO (SOLICITANTE + TÉCNICO + SUPERVISOR + ADMIN + SUPERADMIN)
  const participantesPorDefecto = useMemo((): string[] => {
    if (!ticket) return [];
    
    const participantes: string[] = [];
    
    // 1. Solicitante (quien creó el ticket)
    if (ticket.solicitanteId && !participantes.includes(ticket.solicitanteId)) {
      participantes.push(ticket.solicitanteId);
    }
    
    // 2. Técnico asignado o que tomó el ticket
    if (ticket.tecnicoAsignadoId && !participantes.includes(ticket.tecnicoAsignadoId)) {
      participantes.push(ticket.tecnicoAsignadoId);
    }
    if (ticket.tecnico_tomo_id && !participantes.includes(ticket.tecnico_tomo_id)) {
      participantes.push(ticket.tecnico_tomo_id);
    }
    
    // 3. ✅ SUPERVISOR DE ÁREA - Busca supervisor por área del solicitante
    if (ticket.solicitanteId && usuarios && Array.isArray(usuarios)) {
      const solicitante = obtenerUsuarioPorId(ticket.solicitanteId);
      if (solicitante && solicitante.area) {
        // Buscar usuario con rol supervisor en la misma área
        const supervisor = usuarios.find((u: any) => 
          u.rol === 'supervisor' && 
          u.area === solicitante.area && 
          u.activo !== false
        );
        if (supervisor && !participantes.includes(supervisor.id)) {
          participantes.push(supervisor.id);
        }
      }
    }
    
    // 4. Admin y Superadmin (todos los que tengan ese rol)
    if (usuarios && Array.isArray(usuarios)) {
      usuarios.forEach((u: any) => {
        if ((u.rol === 'administrador' || u.rol === 'superadmin') && 
            u.activo !== false && 
            !participantes.includes(u.id)) {
          participantes.push(u.id);
        }
      });
    }
    
    // 5. Participantes adicionales de ticket.participantes
    if (ticket.participantes && Array.isArray(ticket.participantes)) {
      ticket.participantes.forEach((id: string) => {
        if (!participantes.includes(id)) {
          participantes.push(id);
        }
      });
    }
    
    console.log('🟢 Participantes por defecto:', participantes);
    return participantes;
  }, [ticket, usuarios]);

  // Calcular tiempo transcurrido entre dos fechas
  const calcularTiempoTranscurrido = (inicio: any, fin: any): string => {
    if (!inicio || !fin) return '-';
    const inicioMs = new Date(inicio).getTime();
    const finMs = new Date(fin).getTime();
    if (isNaN(inicioMs) || isNaN(finMs) || finMs < inicioMs) return '-';
    const diffMs = finMs - inicioMs;
    const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (dias > 0) return `${dias}d ${horas}h ${mins}m`;
    if (horas > 0) return `${horas}h ${mins}m`;
    return `${mins}m`;
  };

  // ✅ FORMATEAR FECHA
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

  // ✅ OBTENER TÉCNICO RESPONSABLE
  const tecnicoResponsable = useMemo(() => {
    if (!ticket) return null;
    const id = ticket.tecnico_tomo_id || ticket.tecnicoAsignadoId;
    return id ? obtenerUsuarioPorId(id) : null;
  }, [ticket]);

  // ✅ VERIFICAR SI PUEDE GESTIONAR
  const puedeGestionar = () => {
    if (!usuarioActual || !ticket) return false;
    if (usuarioActual.rol === 'superadmin' || usuarioActual.rol === 'administrador') return true;
    if (String(ticket.tecnico_tomo_id) === String(usuarioActual.id)) return true;
    if (String(ticket.tecnicoAsignadoId) === String(usuarioActual.id)) return true;
    return false;
  };

  // ✅ OBTENER ROL DEL PARTICIPANTE
  const obtenerRolParticipante = (participanteId: string) => {
    if (!ticket) return 'Participante';
    if (participanteId === ticket.solicitanteId) return 'Solicitante';
    if (participanteId === ticket.tecnicoAsignadoId || participanteId === ticket.tecnico_tomo_id) return 'Técnico';
    
    // ✅ Verificar si es supervisor por área
    if (ticket.solicitanteId && usuarios && Array.isArray(usuarios)) {
      const solicitante = obtenerUsuarioPorId(ticket.solicitanteId);
      if (solicitante && solicitante.area) {
        const supervisor = usuarios.find((u: any) => 
          u.rol === 'supervisor' && 
          u.area === solicitante.area && 
          u.id === participanteId
        );
        if (supervisor) return 'Supervisor';
      }
    }
    
    const usuario = obtenerUsuarioPorId(participanteId);
    if (usuario) {
      if (usuario.rol === 'superadmin') return 'Super Admin';
      if (usuario.rol === 'administrador') return 'Admin';
    }
    
    return 'Participante';
  };

  // ✅ OBTENER COLOR DE ETIQUETA SEGÚN ROL
  const obtenerColorEtiqueta = (rol: string) => {
    switch (rol) {
      case 'Solicitante': return 'bg-blue-100 text-blue-700';
      case 'Técnico': return 'bg-green-100 text-green-700';
      case 'Supervisor': return 'bg-orange-100 text-orange-700';
      case 'Super Admin': return 'bg-purple-100 text-purple-700';
      case 'Admin': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // ✅ GUARDAR TIEMPO ESTIMADO
  const handleGuardarTiempoEstimado = async () => {
    if (!ticket) return;
    setAccionando(true);
    try {
      const tiempoStr = `${tiempoEstimado.dias}d ${tiempoEstimado.horas}h ${tiempoEstimado.minutos}m`;
      const minutosTotales = (tiempoEstimado.dias * 24 * 60) + (tiempoEstimado.horas * 60) + tiempoEstimado.minutos;

      await supabase
        .from('tickets')
        .update({
          tiempo_estimado: tiempoStr,
          duracion_estimada_minutos: minutosTotales,
          usuario_estimo_id: usuarioActual?.id,
          fecha_modificacion: new Date().toISOString()
        })
        .eq('id', ticket.id);

      await ticketStore.cargarTickets();
      setEditandoTiempo(false);
      alert('✅ Tiempo estimado guardado');
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setAccionando(false);
    }
  };

  // ✅ GUARDAR ENCUESTA
  const handleGuardarEncuesta = async (valor: boolean) => {
    if (!ticket) return;
    setAccionando(true);
    try {
      await supabase
        .from('tickets')
        .update({
          encuestaCompletada: valor,
          fecha_modificacion: new Date().toISOString()
        })
        .eq('id', ticket.id);

      await ticketStore.cargarTickets();
      setEncuestaCompletada(valor);
      setEditandoEncuesta(false);
      alert('✅ Encuesta actualizada');
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setAccionando(false);
    }
  };

  // ✅ MARCAR COMO RESUELTO
  const handleMarcarResuelto = async () => {
    if (!ticket) return;
    setAccionando(true);
    try {
      await ticketStore.marcarResuelto(ticket.id);
      await ticketStore.cargarTickets();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setAccionando(false);
    }
  };

  // ✅ ENVIAR ENCUESTA
  const handleEnviarEncuesta = async () => {
    if (!ticket) return;
    setAccionando(true);
    try {
      await supabase
        .from('tickets')
        .update({
          encuesta_enviada: true,
          fecha_encuesta: new Date().toISOString(),
          fecha_modificacion: new Date().toISOString()
        })
        .eq('id', ticket.id);

      alert('✅ Encuesta enviada al solicitante');
      await ticketStore.cargarTickets();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setAccionando(false);
    }
  };

  // ✅ CERRAR TICKET
  const handleCerrarTicket = async () => {
    if (!ticket || !confirm('¿Estás seguro de cerrar este ticket permanentemente?')) return;
    setAccionando(true);
    try {
      await ticketStore.cerrarTicket(ticket.id);
      await ticketStore.cargarTickets();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setAccionando(false);
    }
  };

  // ✅ SOLTAR TICKET (Para admin/superadmin que tomó por error)
  const handleSoltarTicket = async () => {
    if (!ticket || !confirm('¿Estás seguro de soltar este ticket? Volverá a estar disponible para ser asignado/tomado por otro técnico.')) return;
    setAccionando(true);
    
    try {
      await supabase
        .from('tickets')
        .update({
          tecnico_tomo_id: null,
          tecnico_asignado_id: null,
          estado: 'nuevo',
          fecha_modificacion: new Date().toISOString()
        })
        .eq('id', ticket.id);

      await ticketStore.cargarTickets();
      alert('✅ Ticket liberado correctamente');
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setAccionando(false);
    }
  };

  // ✅ ENVIAR MENSAJE
  const handleEnviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !ticket) return;
    setEnviando(true);
    try {
      await ticketStore.agregarMensaje(ticket.id, nuevoMensaje);
      setNuevoMensaje('');
    } catch (error: any) {
      alert('Error al enviar mensaje: ' + error.message);
    } finally {
      setEnviando(false);
    }
  };

  // ✅ AGREGAR PARTICIPANTE
  const handleAgregarParticipante = async () => {
    if (!ticket || !participanteSeleccionado) {
      alert('⚠️ Selecciona un usuario primero');
      return;
    }

    setAccionando(true);

    try {
      const participantesActuales = ticket.participantes || [];

      if (participantesActuales.includes(participanteSeleccionado)) {
        alert('⚠️ Este usuario ya es participante');
        setAccionando(false);
        return;
      }

      const nuevosParticipantes = [...participantesActuales, participanteSeleccionado];

      console.log('🔵 Actualizando participantes:', nuevosParticipantes);

      const { data, error } = await supabase
        .from('tickets')
        .update({
          participantes: nuevosParticipantes,
          fecha_modificacion: new Date().toISOString()
        })
        .eq('id', ticket.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error al actualizar:', error);
        throw error;
      }

      console.log('✅ Actualización exitosa:', data);

      await supabase
        .from('ticket_participantes')
        .upsert([{
          ticket_id: ticket.id,
          usuario_id: participanteSeleccionado
        }], {
          onConflict: 'ticket_id,usuario_id'
        });

      await ticketStore.cargarTickets();

      setParticipanteSeleccionado('');
      setMostrarAgregarParticipante(false);
      alert('✅ Participante agregado correctamente');

    } catch (error: any) {
      console.error('❌ Error completo:', error);
      alert('❌ Error: ' + (error.message || 'No se pudo agregar el participante'));
    } finally {
      setAccionando(false);
    }
  };

  // ✅ ELIMINAR PARTICIPANTE
  const handleEliminarParticipante = async (participanteId: string) => {
    if (!ticket || !confirm('¿Eliminar participante?')) return;
    setAccionando(true);

    try {
      const participantesActuales = ticket.participantes || [];
      const nuevosParticipantes = participantesActuales.filter((p: string) => p !== participanteId);

      await supabase
        .from('tickets')
        .update({
          participantes: nuevosParticipantes,
          fecha_modificacion: new Date().toISOString()
        })
        .eq('id', ticket.id);

      await supabase
        .from('ticket_participantes')
        .delete()
        .eq('ticket_id', ticket.id)
        .eq('usuario_id', participanteId);

      await ticketStore.cargarTickets();
      alert('✅ Participante eliminado');

    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setAccionando(false);
    }
  };

  // ✅ RENDERIZAR ACCIONES - ✅ AHORA TÉCNICOS TAMBIÉN PUEDEN CERRAR
  const renderizarAcciones = () => {
    if (!ticket) return null;

    const esAdmin = usuarioActual?.rol === 'superadmin' || usuarioActual?.rol === 'administrador';
    const esTecnicoAsignado = puedeGestionar();

    if (!esAdmin && !esTecnicoAsignado) {
      return <p className="text-gray-500 text-sm text-center py-4">Sin permisos para realizar acciones</p>;
    }

    if (ticket.estado === 'cerrado') {
      return (
        <div className="p-4 bg-gray-100 rounded-lg text-center">
          <CheckCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-700 font-medium">Ticket Cerrado</p>
          <p className="text-sm text-gray-500 mt-1">No se permiten más acciones</p>
        </div>
      );
    }

    if (ticket.estado === 'resuelto') {
      return (
        <div className="space-y-2">
          <button
            onClick={handleEnviarEncuesta}
            disabled={accionando}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <FileCheck className="w-5 h-5" />
            Enviar Encuesta
          </button>
          {/* ✅ CAMBIO: Ahora técnicos asignados TAMBIÉN pueden cerrar tickets resueltos */}
          {(esAdmin || esTecnicoAsignado) && (
            <button
              onClick={handleCerrarTicket}
              disabled={accionando}
              className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <XCircle className="w-5 h-5" />
              Cerrar Ticket
            </button>
          )}
        </div>
      );
    }

    if (ticket.estado === 'asignado' || ticket.estado === 'planificado') {
      if (esTecnicoAsignado) {
        return (
          <div className="space-y-2">
            <button
              onClick={handleMarcarResuelto}
              disabled={accionando}
              style={{
                backgroundColor: accionando ? '#9CA3AF' : '#16A34A',
                color: 'white',
                cursor: accionando ? 'not-allowed' : 'pointer',
                opacity: accionando ? 0.6 : 1
              }}
              className="w-full font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <CheckCircle className="w-5 h-5" />
              Marcar como Resuelto
            </button>
            {/* ✅ BOTÓN SOLTAR TICKET - Solo admin */}
            {esAdmin && (
              <button
                onClick={handleSoltarTicket}
                disabled={accionando}
                style={{
                  backgroundColor: accionando ? '#9CA3AF' : '#F97316',
                  color: 'white',
                  cursor: accionando ? 'not-allowed' : 'pointer',
                  opacity: accionando ? 0.6 : 1
                }}
                className="w-full font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                Soltar Ticket
              </button>
            )}
          </div>
        );
      } else {
        return <p className="text-gray-500 text-sm text-center py-4">Esperando asignación...</p>;
      }
    }

    if (ticket.estado === 'nuevo') {
      if (usuarioActual?.rol === 'tecnico') {
        return (
          <button
            onClick={async () => {
              setAccionando(true);
              try {
                await ticketStore.tomarTicket(ticket.id);
                await ticketStore.cargarTickets();
              } catch (error: any) {
                alert('❌ Error: ' + error.message);
              } finally {
                setAccionando(false);
              }
            }}
            disabled={accionando}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Wrench className="w-5 h-5" />
            Tomar Ticket
          </button>
        );
      }
    }

    return (
      <div className="p-4 bg-blue-50 rounded-lg text-center">
        <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
        <p className="text-blue-700 font-medium">Ticket Nuevo</p>
        <p className="text-sm text-blue-500 mt-1">Esperando ser tomado/asignado</p>
      </div>
    );
  };

  if (!usuarioActual || cargando) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
          <p className="text-gray-500">Cargando detalles del ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <p className="text-gray-500">Ticket no encontrado</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-emerald-600 hover:underline">
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  const creador = obtenerUsuarioPorId(ticket.solicitanteId);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-4 pb-4 border-b">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-800 truncate">{ticket.titulo}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
            <span>ID #{String(ticket.id || 0).padStart(4, '0')}</span>
            <span>|</span>
            <span>{creador?.nombre} {creador?.apellidos}</span>
            <span>|</span>
            <span>{creador?.area}</span>
          </div>
        </div>
      </div>

      {/* ✅ LAYOUT PRINCIPAL - CON SCROLL INTERNO (MODIFICADO) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ height: 'calc(100vh - 200px)' }}>
        
        {/* ZONA CENTRAL: CHAT (2 columnas) */}
        <div className="lg:col-span-2 flex flex-col h-full">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b bg-gray-50 font-semibold text-gray-700 flex justify-between items-center">
              <span className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> Chat del Ticket
              </span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {participantesPorDefecto.length} Participantes
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {/* Mensaje Inicial */}
              <div className="bg-white p-3 rounded-lg shadow-sm border-l-4 border-blue-500">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span className="font-medium">Reporte Inicial</span>
                  <span>{formatearFecha(ticket.fechaCreacion)}</span>
                </div>
                <p className="text-sm text-gray-700">{ticket.descripcion}</p>
              </div>

              {/* Mensajes */}
              {!ticket.mensajes || ticket.mensajes.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Sin mensajes aún</div>
              ) : (
                ticket.mensajes.map((m: any) => {
                  const autor = obtenerUsuarioPorId(m.autor_id);
                  const esMiMensaje = String(m.autor_id) === String(usuarioActual?.id);
                  return (
                    <div key={m.id} className={`p-3 rounded-lg max-w-[80%] ${esMiMensaje ? 'bg-blue-50 self-end ml-auto' : 'bg-white'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-700">{autor?.nombre || 'Desconocido'}</span>
                        <span className="text-xs text-gray-400">{formatearFecha(m.fecha_creacion)}</span>
                      </div>
                      <p className="text-sm text-gray-700">{m.contenido}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Mensaje */}
            <div className="p-4 border-t bg-white flex gap-2">
              <input
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEnviarMensaje()}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                disabled={ticket.estado === 'cerrado'}
              />
              <button
                onClick={handleEnviarMensaje}
                disabled={!nuevoMensaje.trim() || enviando || ticket.estado === 'cerrado'}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>

        {/* ✅ PANEL DERECHO - CON SCROLL INTERNO (1 columna) */}
        <div className="lg:col-span-1 overflow-y-auto space-y-4 pr-2">
          
          {/* 1. DETALLES DEL TICKET */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-500" /> Detalles del Ticket
            </h3>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block">Categoría</label>
                  <p className="font-medium text-gray-800">{ticket.categoria || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block">Subcategoría</label>
                  <p className="font-medium text-gray-800">{ticket.subcategoria || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block">Estado</label>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    ticket.estado === 'resuelto' ? 'bg-green-100 text-green-700' :
                    ticket.estado === 'cerrado' ? 'bg-gray-100 text-gray-700' :
                    ticket.estado === 'asignado' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{ticket.estado}</span>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block">Prioridad</label>
                  <p className="font-medium capitalize text-gray-800">{ticket.prioridad?.replace('_', ' ') || '-'}</p>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block">Técnico Responsable</label>
                <p className="font-medium text-gray-800 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {tecnicoResponsable ? `${tecnicoResponsable.nombre} ${tecnicoResponsable.apellidos}` : 'Sin asignar'}
                </p>
              </div>

              {/* TIEMPO ESTIMADO */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-700">⏱️ Tiempo Estimado</label>
                  {puedeGestionar() && !editandoTiempo && ticket.estado !== 'cerrado' && (
                    <button
                      onClick={() => setEditandoTiempo(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                    >
                      ✏️ Editar
                    </button>
                  )}
                </div>
                {editandoTiempo ? (
                  <div className="space-y-2 bg-blue-50 p-3 rounded-lg border-2 border-blue-300">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Días</label>
                        <input
                          type="number"
                          min="0"
                          value={tiempoEstimado.dias}
                          onChange={(e) => setTiempoEstimado({ ...tiempoEstimado, dias: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Horas</label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={tiempoEstimado.horas}
                          onChange={(e) => setTiempoEstimado({ ...tiempoEstimado, horas: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Min</label>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={tiempoEstimado.minutos}
                          onChange={(e) => setTiempoEstimado({ ...tiempoEstimado, minutos: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={handleGuardarTiempoEstimado}
                        disabled={accionando}
                        style={{
                          backgroundColor: accionando ? '#9CA3AF' : '#16A34A',
                          color: 'white',
                          cursor: accionando ? 'not-allowed' : 'pointer',
                          opacity: accionando ? 0.6 : 1
                        }}
                        className="flex-1 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                      >
                        <Save className="w-5 h-5" />
                        GUARDAR
                      </button>
                      <button
                        onClick={() => setEditandoTiempo(false)}
                        disabled={accionando}
                        style={{
                          backgroundColor: accionando ? '#9CA3AF' : '#DC2626',
                          color: 'white',
                          cursor: accionando ? 'not-allowed' : 'pointer',
                          opacity: accionando ? 0.6 : 1
                        }}
                        className="flex-1 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                      >
                        <XCircle className="w-5 h-5" />
                        CANCELAR
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 p-3 rounded-lg border-2 border-gray-300">
                    <p className="font-bold text-gray-800 text-lg">
                      {ticket.tiempo_estimado || '⚠️ No estimado'}
                    </p>
                  </div>
                )}
              </div>

              {/* ENCUESTA COMPLETADA */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-700">📋 Encuesta Completada</label>
                  {puedeGestionar() && !editandoEncuesta && ticket.estado !== 'cerrado' && (
                    <button
                      onClick={() => setEditandoEncuesta(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                    >
                      ✏️ Editar
                    </button>
                  )}
                </div>
                {editandoEncuesta ? (
                  <div className="flex gap-2 bg-purple-50 p-3 rounded-lg border-2 border-purple-300">
                    <button
                      onClick={() => handleGuardarEncuesta(true)}
                      disabled={accionando}
                      style={{
                        backgroundColor: accionando ? '#9CA3AF' : '#16A34A',
                        color: 'white',
                        cursor: accionando ? 'not-allowed' : 'pointer',
                        opacity: accionando ? 0.6 : 1
                      }}
                      className="flex-1 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                    >
                      <ThumbsUp className="w-5 h-5" />
                      SÍ
                    </button>
                    <button
                      onClick={() => handleGuardarEncuesta(false)}
                      disabled={accionando}
                      style={{
                        backgroundColor: accionando ? '#9CA3AF' : '#DC2626',
                        color: 'white',
                        cursor: accionando ? 'not-allowed' : 'pointer',
                        opacity: accionando ? 0.6 : 1
                      }}
                      className="flex-1 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                    >
                      <ThumbsDown className="w-5 h-5" />
                      NO
                    </button>
                    <button
                      onClick={() => setEditandoEncuesta(false)}
                      disabled={accionando}
                      style={{
                        backgroundColor: accionando ? '#9CA3AF' : '#6B7280',
                        color: 'white',
                        cursor: accionando ? 'not-allowed' : 'pointer',
                        opacity: accionando ? 0.6 : 1
                      }}
                      className="px-4 font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <span className={`text-sm px-4 py-3 rounded-lg font-bold block text-center border-2 ${
                    encuestaCompletada === true ? 'bg-green-100 text-green-700 border-green-300' :
                    encuestaCompletada === false ? 'bg-red-100 text-red-700 border-red-300' :
                    'bg-gray-100 text-gray-600 border-gray-300'
                  }`}>
                    {encuestaCompletada === true ? '✅ SÍ - Completada' :
                      encuestaCompletada === false ? '❌ NO - Pendiente' :
                      '⚠️ No registrada'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. TIMELINE DEL CASO */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" /> Timeline del Caso
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" /> Apertura:
                </span>
                <span className="font-medium text-gray-800">{formatearFecha(ticket.fechaCreacion)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-gray-500" /> Última Mod:
                </span>
                <span className="font-medium text-gray-800">{formatearFecha(ticket.fechaModificacion)}</span>
              </div>
              {(ticket.fecha_tomada || ticket.tecnicoAsignadoId || ticket.tecnico_tomo_id) && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-purple-500" /> Asignado/Tomado:
                  </span>
                  <span className="font-medium text-gray-800">{formatearFecha(ticket.fecha_tomada || ticket.fechaCreacion)}</span>
                </div>
              )}
              {ticket.fecha_resolucion && ticket.estado === 'resuelto' ? (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" /> Resuelto:
                    </span>
                    <span className="font-medium text-green-700">{formatearFecha(ticket.fecha_resolucion)}</span>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-green-700 font-medium">⏱️ Tiempo Real:</span>
                      <span className="font-bold text-green-800">
                        {calcularTiempoTranscurrido(ticket.fechaCreacion, ticket.fecha_resolucion)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                ticket.estado !== 'resuelto' && ticket.estado !== 'cerrado' && (
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="text-xs text-yellow-700 font-medium">
                      ⏳ En proceso - El tiempo se calculará al marcar como resuelto
                    </p>
                  </div>
                )
              )}
              {ticket.fecha_cierre && ticket.estado === 'cerrado' ? (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-gray-500" /> Cerrado:
                    </span>
                    <span className="font-medium text-gray-800">{formatearFecha(ticket.fecha_cierre)}</span>
                  </div>
                  {ticket.fecha_resolucion && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600 font-medium">⏱️ Para Cerrar:</span>
                        <span className="font-bold text-gray-700">
                          {calcularTiempoTranscurrido(ticket.fecha_resolucion, ticket.fecha_cierre)}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>

          {/* 3. PARTICIPANTES */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-500" /> Participantes
              </h3>
              {puedeGestionar() && !mostrarAgregarParticipante && (
                <button
                  onClick={() => setMostrarAgregarParticipante(true)}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold transition-colors"
                >
                  <Plus className="w-3 h-3" /> Agregar
                </button>
              )}
            </div>

            {mostrarAgregarParticipante && (
              <div className="mb-3 p-3 bg-blue-50 rounded-lg border-2 border-blue-300">
                <label className="text-xs font-bold text-gray-700 block mb-2">Seleccionar usuario:</label>
                <select
                  value={participanteSeleccionado}
                  onChange={(e) => setParticipanteSeleccionado(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-sm font-bold mb-2"
                >
                  <option value="">-- Seleccionar --</option>
                  {usuarios
                    .filter((u: any) => u.activo !== false)
                    .map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} {u.apellidos} ({u.area})
                      </option>
                    ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleAgregarParticipante}
                    disabled={!participanteSeleccionado || accionando}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-2 rounded-lg transition-colors"
                  >
                    Agregar
                  </button>
                  <button
                    onClick={() => {
                      setMostrarAgregarParticipante(false);
                      setParticipanteSeleccionado('');
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* ✅ LISTA DE PARTICIPANTES POR DEFECTO + ADICIONALES */}
            {participantesPorDefecto.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {participantesPorDefecto.map((participanteId: string, index: number) => {
                  const participante = obtenerUsuarioPorId(participanteId);

                  if (!participante) {
                    return (
                      <div key={index} className="p-3 bg-red-50 border-2 border-red-300 rounded-lg">
                        <p className="text-red-700 text-sm font-bold">⚠️ Usuario no encontrado</p>
                        <p className="text-xs text-red-600">ID: {participanteId}</p>
                      </div>
                    );
                  }

                  const rol = obtenerRolParticipante(participanteId);
                  const colorEtiqueta = obtenerColorEtiqueta(rol);
                  const esSolicitante = participanteId === ticket.solicitanteId;
                  const esTecnicoAsignado = participanteId === ticket.tecnicoAsignadoId || participanteId === ticket.tecnico_tomo_id;
                  const esSupervisor = rol === 'Supervisor';
                  const esAdmin = participante.rol === 'administrador' || participante.rol === 'superadmin';

                  return (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                      <img
                        src={participante.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(participante.nombre)}&background=80c398&color=fff`}
                        alt={participante.nombre}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(participante.nombre)}&background=80c398&color=fff`;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">
                          {participante.nombre} {participante.apellidos}
                        </p>
                        <p className="text-xs text-gray-600 font-medium">{participante.area || 'Sin área'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${colorEtiqueta}`}>
                          {rol}
                        </span>
                        {puedeGestionar() && !esSolicitante && !esTecnicoAsignado && !esSupervisor && !esAdmin && (
                          <button
                            onClick={() => handleEliminarParticipante(participanteId)}
                            className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 transition-opacity p-1"
                            title="Eliminar participante"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold">Sin participantes</p>
                <p className="text-xs mt-1">Haz clic en "Agregar" para añadir participantes</p>
              </div>
            )}
          </div>

          {/* 4. ACCIONES */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" /> Acciones
            </h3>
            {renderizarAcciones()}
          </div>

        </div>
      </div>
    </div>
  );
}