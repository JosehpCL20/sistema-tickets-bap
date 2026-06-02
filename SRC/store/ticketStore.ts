// =============================================
// STORE DE TICKETS — Zustand + Supabase
// Fix: no persistir tickets en localStorage
// =============================================

import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from './authStore';
import type { Ticket, TicketStatus, FiltrosTicket, EstadisticasDashboard } from '../types';
import {
  notificarNuevoTicket,
  notificarTicketAsignado,
  notificarTicketTomado,
  notificarTicketResuelto,
  crearNotificacion,
} from '../utils/notifications';

interface TicketState {
  tickets: Ticket[];
  isLoading: boolean;
  error: string | null;
  filtros: FiltrosTicket;

  cargarTickets: () => Promise<void>;
  crearTicket: (datos: any) => Promise<Ticket>;
  actualizarTicket: (id: number, datos: any) => Promise<void>;
  eliminarTicket: (id: number) => Promise<void>;
  tomarTicket: (ticketId: number) => Promise<void>;
  asignarTecnico: (ticketId: number, tecnicoId: string) => Promise<void>;
  marcarResuelto: (ticketId: number) => Promise<void>;
  cerrarTicket: (ticketId: number) => Promise<void>;
  reabrirTicket: (ticketId: number) => Promise<void>;
  cambiarEstado: (ticketId: number, estado: TicketStatus) => Promise<void>;
  guardarTiempoEstimado: (ticketId: number, tiempo: string) => Promise<void>;

  obtenerTicketsPorUsuario: (usuarioId: string) => Ticket[];
  obtenerTicketsEnCurso: (usuarioId: string) => Ticket[];
  obtenerTicketsResueltos: (usuarioId: string) => Ticket[];
  obtenerTicketsFiltrados: () => Ticket[];
  obtenerEstadisticas: () => EstadisticasDashboard;

  establecerFiltros: (filtros: FiltrosTicket) => void;
  limpiarFiltros: () => void;
  limpiarError: () => void;
}

const mapearTicket = (d: any): Ticket => ({
  id: d.id,
  titulo: d.titulo || '',
  descripcion: d.descripcion || '',
  categoria: d.categoria || '',
  subcategoria: d.subcategoria || '',
  prioridad: d.prioridad,
  estado: d.estado,
  activo: d.activo ?? true,
  solicitanteId: d.solicitante_id,
  tecnicoAsignadoId: d.tecnico_asignado_id || null,
  tecnico_tomo_id: d.tecnico_tomo_id || null,
  supervisorId: d.supervisor_id || null,
  participantes: Array.isArray(d.participantes) ? d.participantes : [],
  fechaCreacion: d.fecha_creacion,
  fechaModificacion: d.fecha_modificacion,
  fechaPlanificada: d.fecha_planificada || null,
  fecha_tomada: d.fecha_tomada || null,
  fecha_resolucion: d.fecha_resolucion || null,
  fecha_cierre: d.fecha_cierre || null,
  tiempo_estimado: d.tiempo_estimado || null,
  duracion_estimada_minutos: d.duracion_estimada_minutos || null,
  encuesta_requerida: d.encuesta_requerida ?? true,
});

export const useTicketStore = create<TicketState>()((set, get) => ({
  tickets: [],
  isLoading: false,
  error: null,
  filtros: {},

  // ─── CARGAR ────────────────────────────────────────────
  cargarTickets: async () => {
    const usuario = useAuthStore.getState().usuarioActual;
    if (!usuario) return;
    set({ isLoading: true });
    try {
      let query = supabase.from('tickets').select('*').eq('activo', true);
      if (usuario.rol === 'usuario') {
        query = query.eq('solicitante_id', usuario.id);
      } else if (usuario.rol === 'supervisor') {
        query = query.or(`solicitante_id.eq.${usuario.id},supervisor_id.eq.${usuario.id}`);
      }
      const { data, error } = await query.order('fecha_modificacion', { ascending: false });
      if (error) throw error;
      set({ tickets: (data || []).map(mapearTicket), isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  // ─── CREAR ─────────────────────────────────────────────
  crearTicket: async (datos) => {
    const usuario = useAuthStore.getState().usuarioActual;
    if (!usuario) throw new Error('No autenticado');
    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert([{
          titulo: datos.titulo,
          descripcion: datos.descripcion,
          categoria: datos.categoria,
          subcategoria: datos.subcategoria || null,
          prioridad: datos.prioridad,
          estado: 'nuevo',
          solicitante_id: usuario.id,
          participantes: [usuario.id],
          fecha_creacion: new Date().toISOString(),
          fecha_modificacion: new Date().toISOString(),
        }])
        .select()
        .single();
      if (error) throw error;

      // Agregar solicitante como participante en tabla relacional
      await supabase.from('ticket_participantes')
        .upsert([{ ticket_id: data.id, usuario_id: usuario.id }], { onConflict: 'ticket_id,usuario_id' });

      await get().cargarTickets();

      // Notificaciones
      await notificarNuevoTicket(data.id, data.titulo, usuario.id);
      await crearNotificacion(
        usuario.id, data.id, 'ticket_created',
        '📝 Ticket creado',
        `Tu ticket #${String(data.id).padStart(4, '0')} fue registrado correctamente.`,
        {}
      );

      return mapearTicket(data);
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  // ─── ACTUALIZAR ────────────────────────────────────────
  actualizarTicket: async (id, datos) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ ...datos, fecha_modificacion: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      await get().cargarTickets();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  eliminarTicket: async (id) => {
    try {
      // Soft delete
      await supabase.from('tickets').update({ activo: false }).eq('id', id);
      await get().cargarTickets();
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  // ─── ACCIONES DE TICKETS ───────────────────────────────
  tomarTicket: async (ticketId) => {
    const usuario = useAuthStore.getState().usuarioActual;
    if (!usuario) throw new Error('No autenticado');
    try {
      const ticket = get().tickets.find(t => t.id === ticketId);
      await supabase.from('tickets').update({
        tecnico_tomo_id: usuario.id,
        tecnico_asignado_id: usuario.id,
        estado: 'asignado',
        fecha_tomada: new Date().toISOString(),
        fecha_modificacion: new Date().toISOString(),
      }).eq('id', ticketId);

      // Agregar técnico como participante
      await supabase.from('ticket_participantes')
        .upsert([{ ticket_id: ticketId, usuario_id: usuario.id }], { onConflict: 'ticket_id,usuario_id' });

      await get().cargarTickets();

      // Notificar a participantes
      if (ticket) {
        const participantes = ticket.participantes.filter(p => p !== usuario.id);
        await notificarTicketTomado(
          participantes,
          `${usuario.nombre} ${usuario.apellidos}`,
          ticketId,
          ticket.titulo
        );
      }
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  asignarTecnico: async (ticketId, tecnicoId) => {
    const usuario = useAuthStore.getState().usuarioActual;
    try {
      const ticket = get().tickets.find(t => t.id === ticketId);
      await supabase.from('tickets').update({
        tecnico_asignado_id: tecnicoId,
        estado: 'asignado',
        fecha_modificacion: new Date().toISOString(),
      }).eq('id', ticketId);

      await supabase.from('ticket_participantes')
        .upsert([{ ticket_id: ticketId, usuario_id: tecnicoId }], { onConflict: 'ticket_id,usuario_id' });

      await get().cargarTickets();
      if (ticket) await notificarTicketAsignado(tecnicoId, ticketId, ticket.titulo);
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  marcarResuelto: async (ticketId) => {
    const usuario = useAuthStore.getState().usuarioActual;
    try {
      const ticket = get().tickets.find(t => t.id === ticketId);
      await supabase.from('tickets').update({
        estado: 'resuelto',
        fecha_resolucion: new Date().toISOString(),
        fecha_modificacion: new Date().toISOString(),
      }).eq('id', ticketId);

      await get().cargarTickets();

      if (ticket && ticket.solicitanteId) {
        await notificarTicketResuelto(ticket.solicitanteId, ticketId, ticket.titulo);
      }
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  cerrarTicket: async (ticketId) => {
    try {
      await supabase.from('tickets').update({
        estado: 'cerrado',
        fecha_cierre: new Date().toISOString(),
        fecha_modificacion: new Date().toISOString(),
      }).eq('id', ticketId);
      await get().cargarTickets();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  reabrirTicket: async (ticketId) => {
    try {
      await supabase.from('tickets').update({
        estado: 'asignado',
        fecha_cierre: null,
        fecha_modificacion: new Date().toISOString(),
      }).eq('id', ticketId);
      await get().cargarTickets();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  cambiarEstado: async (ticketId, estado) => {
    const actualizaciones: any = { estado };
    if (estado === 'resuelto') actualizaciones.fecha_resolucion = new Date().toISOString();
    if (estado === 'cerrado') actualizaciones.fecha_cierre = new Date().toISOString();
    if (estado === 'planificado') actualizaciones.fecha_planificada = new Date().toISOString();
    await get().actualizarTicket(ticketId, actualizaciones);
  },

  guardarTiempoEstimado: async (ticketId, tiempo) => {
    await get().actualizarTicket(ticketId, { tiempo_estimado: tiempo });
  },

  // ─── SELECTORS ─────────────────────────────────────────
  obtenerTicketsPorUsuario: (usuarioId) =>
    get().tickets.filter(t => String(t.solicitanteId) === String(usuarioId)),

  obtenerTicketsEnCurso: (usuarioId) =>
    get().tickets.filter(t =>
      String(t.solicitanteId) === String(usuarioId) &&
      ['nuevo', 'asignado', 'planificado'].includes(t.estado)
    ),

  obtenerTicketsResueltos: (usuarioId) =>
    get().tickets.filter(t =>
      String(t.solicitanteId) === String(usuarioId) &&
      ['resuelto', 'cerrado'].includes(t.estado)
    ),

  obtenerTicketsFiltrados: () => {
    const { tickets, filtros } = get();
    return tickets.filter(t => {
      if (filtros.busqueda && !t.titulo.toLowerCase().includes(filtros.busqueda.toLowerCase())) return false;
      if (filtros.estado && t.estado !== filtros.estado) return false;
      if (filtros.prioridad && t.prioridad !== filtros.prioridad) return false;
      if (filtros.categoria && t.categoria !== filtros.categoria) return false;
      if (filtros.tecnicoId && t.tecnicoAsignadoId !== filtros.tecnicoId && t.tecnico_tomo_id !== filtros.tecnicoId) return false;
      return true;
    });
  },

  obtenerEstadisticas: () => {
    const tickets = get().tickets;
    const porCategoria: Record<string, number> = {};
    const porPrioridad: Record<string, number> = {};
    tickets.forEach(t => {
      porCategoria[t.categoria] = (porCategoria[t.categoria] || 0) + 1;
      porPrioridad[t.prioridad] = (porPrioridad[t.prioridad] || 0) + 1;
    });
    return {
      ticketsTotal: tickets.length,
      ticketsNuevos: tickets.filter(t => t.estado === 'nuevo').length,
      ticketsAsignados: tickets.filter(t => t.estado === 'asignado').length,
      ticketsPlanificados: tickets.filter(t => t.estado === 'planificado').length,
      ticketsResueltos: tickets.filter(t => t.estado === 'resuelto').length,
      ticketsCerrados: tickets.filter(t => t.estado === 'cerrado').length,
      tiempoPromedioRespuesta: 24,
      ticketsPorCategoria: porCategoria,
      ticketsPorPrioridad: porPrioridad,
    };
  },

  establecerFiltros: (filtros) => set({ filtros }),
  limpiarFiltros: () => set({ filtros: {} }),
  limpiarError: () => set({ error: null }),
}));
