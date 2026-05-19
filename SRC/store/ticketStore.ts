// =============================================
// STORE DE TICKETS - ZUSTAND + SUPABASE
// Sistema de Gestión de Tickets - Banco de Alimentos Perú
// =============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from './authStore';
import type { Ticket, TicketStatus, FiltrosTicket, EstadisticasDashboard } from '../types';

interface TicketState {
  tickets: Ticket[];
  ticketSeleccionado: Ticket | null;
  filtros: FiltrosTicket;
  isLoading: boolean;
  error: string | null;

  cargarTickets: () => Promise<void>;
  crearTicket: (datos: any) => Promise<any>;
  actualizarTicket: (id: number, datos: any) => Promise<void>;
  eliminarTicket: (id: number) => Promise<void>;
  cambiarEstado: (id: number, estado: TicketStatus) => Promise<void>;
  asignarTecnico: (ticketId: number, tecnicoId: string) => Promise<void>;
  agregarMensaje: (ticketId: number, contenido: string) => Promise<void>;
  
  tomarTicket: (ticketId: number) => Promise<void>;
  marcarResuelto: (ticketId: number) => Promise<void>;
  cerrarTicket: (ticketId: number) => Promise<void>;
  reabrirTicket: (ticketId: number) => Promise<void>;
  
  obtenerTicketsPorUsuario: (usuarioId: string) => Ticket[];
  obtenerTicketsEnCurso: (usuarioId: string) => Ticket[];
  obtenerTicketsResueltos: (usuarioId: string) => Ticket[];
  obtenerTicketsFiltrados: () => Ticket[];
  obtenerEstadisticas: () => EstadisticasDashboard;
  
  seleccionarTicket: (id: number | null) => void;
  establecerFiltros: (filtros: FiltrosTicket) => void;
  limpiarFiltros: () => void;
  limpiarError: () => void;
}

export const useTicketStore = create<TicketState>()(
  persist(
    (set, get) => ({
      tickets: [],
      ticketSeleccionado: null,
      filtros: {},
      isLoading: false,
      error: null,

      cargarTickets: async () => {
        const usuario = useAuthStore.getState().usuarioActual;
        if (!usuario) return;
        
        set({ isLoading: true });
        try {
          let query = supabase.from('tickets').select('*');
          
          if (usuario.rol === 'usuario') {
            query = query.eq('solicitante_id', usuario.id);
          }
          
          const { data, error } = await query.order('fecha_modificacion', { ascending: false });
          if (error) throw error;
          
          const ticketsMapeados: Ticket[] = (data || []).map((d: any) => ({
            id: d.id, // ✅ Ahora es number
            titulo: d.titulo,
            asunto: d.asunto,
            descripcion: d.descripcion,
            categoria: d.categoria,
            subcategoria: d.subcategoria,
            prioridad: d.prioridad,
            estado: d.estado,
            solicitanteId: d.solicitante_id,
            tecnicoAsignadoId: d.tecnico_asignado_id,
            tecnico_tomo_id: d.tecnico_tomo_id,
            fechaCreacion: d.fecha_creacion,
            fechaModificacion: d.fecha_modificacion,
            fecha_tomada: d.fecha_tomada,
            fecha_resolucion: d.fecha_resolucion,
            fecha_cierre: d.fecha_cierre,
            fechaResolucion: d.fecha_resolucion,
            fechaCierre: d.fecha_cierre,
            tiempo_estimado: d.tiempo_estimado,
            participantes: d.participantes || [],
            mensajes: d.mensajes || []
          }));
          
          set({ tickets: ticketsMapeados, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      crearTicket: async (datos: any) => {
        const usuario = useAuthStore.getState().usuarioActual;
        if (!usuario) throw new Error('No autenticado');
        
        try {
          const { data, error } = await supabase
            .from('tickets')
            .insert([{
              titulo: datos.titulo,
              asunto: datos.asunto,
              descripcion: datos.descripcion,
              categoria: datos.categoria,
              subcategoria: datos.subcategoria,
              prioridad: datos.prioridad,
              estado: 'nuevo',
              solicitante_id: usuario.id,
              fecha_creacion: new Date().toISOString(),
              fecha_modificacion: new Date().toISOString()
            }])
            .select()
            .single();
            
          if (error) throw error;
          
          await supabase
            .from('ticket_participantes')
            .insert([{ ticket_id: data.id, usuario_id: usuario.id }]);
            
          await get().cargarTickets();
          return data;
        } catch (err: any) {
          set({ error: err.message });
          throw err;
        }
      },

      // ✅ ID ahora es number
      actualizarTicket: async (id: number, datos: any) => {
        try {
          await supabase
            .from('tickets')
            .update({ ...datos, fecha_modificacion: new Date().toISOString() })
            .eq('id', id);
          await get().cargarTickets();
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      // ✅ ID ahora es number
      eliminarTicket: async (id: number) => {
        try {
          await supabase.from('tickets').delete().eq('id', id);
          await get().cargarTickets();
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      // ✅ ID ahora es number
      cambiarEstado: async (id: number, estado: TicketStatus) => {
        const actualizaciones: any = { estado };
        if (estado === 'resuelto') actualizaciones.fecha_resolucion = new Date().toISOString();
        if (estado === 'cerrado') actualizaciones.fecha_cierre = new Date().toISOString();
        await get().actualizarTicket(id, actualizaciones);
      },

      // ✅ ticketId ahora es number
      asignarTecnico: async (ticketId: number, tecnicoId: string) => {
        try {
          await supabase
            .from('tickets')
            .update({ 
              tecnico_asignado_id: tecnicoId, 
              estado: 'asignado',
              fecha_modificacion: new Date().toISOString()
            })
            .eq('id', ticketId);
          
          await supabase
            .from('ticket_participantes')
            .upsert({ ticket_id: ticketId, usuario_id: tecnicoId });
            
          await get().cargarTickets();
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      // ✅ ticketId ahora es number
      agregarMensaje: async (ticketId: number, contenido: string) => {
        const usuario = useAuthStore.getState().usuarioActual;
        if (!usuario) return;
        try {
          await supabase
            .from('mensajes')
            .insert([{
              ticket_id: ticketId,
              autor_id: usuario.id,
              contenido,
              fecha_creacion: new Date().toISOString()
            }]);
          await get().cargarTickets();
        } catch (err: any) {
          set({ error: err.message });
        }
      },

      // ✅ ticketId ahora es number
      tomarTicket: async (ticketId: number) => {
        const usuario = useAuthStore.getState().usuarioActual;
        if (!usuario) throw new Error('No autenticado');
        
        try {
          await supabase
            .from('tickets')
            .update({
              tecnico_tomo_id: usuario.id,
              tecnico_asignado_id: usuario.id,
              estado: 'asignado',
              fecha_tomada: new Date().toISOString(),
              fecha_modificacion: new Date().toISOString()
            })
            .eq('id', ticketId);
          
          await get().cargarTickets();
        } catch (err: any) {
          set({ error: err.message });
          throw err;
        }
      },

      // ✅ ticketId ahora es number
      marcarResuelto: async (ticketId: number) => {
        try {
          await supabase
            .from('tickets')
            .update({
              estado: 'resuelto',
              fecha_resolucion: new Date().toISOString(),
              fecha_modificacion: new Date().toISOString()
            })
            .eq('id', ticketId);
          
          await get().cargarTickets();
        } catch (err: any) {
          set({ error: err.message });
          throw err;
        }
      },

      // ✅ ticketId ahora es number
      cerrarTicket: async (ticketId: number) => {
        try {
          await supabase
            .from('tickets')
            .update({
              estado: 'cerrado',
              fecha_cierre: new Date().toISOString(),
              fecha_modificacion: new Date().toISOString()
            })
            .eq('id', ticketId);
          
          await get().cargarTickets();
        } catch (err: any) {
          set({ error: err.message });
          throw err;
        }
      },

      // ✅ ticketId ahora es number
      reabrirTicket: async (ticketId: number) => {
        try {
          await supabase
            .from('tickets')
            .update({
              estado: 'asignado',
              fecha_cierre: null,
              fecha_modificacion: new Date().toISOString()
            })
            .eq('id', ticketId);
          
          await get().cargarTickets();
        } catch (err: any) {
          set({ error: err.message });
          throw err;
        }
      },

      obtenerTicketsPorUsuario: (usuarioId: string) => 
        get().tickets.filter(t => String(t.solicitanteId) === String(usuarioId)),

      obtenerTicketsEnCurso: (usuarioId: string) => 
        get().tickets.filter(t => String(t.solicitanteId) === String(usuarioId) && ['nuevo', 'asignado', 'planificado'].includes(t.estado)),

      obtenerTicketsResueltos: (usuarioId: string) => 
        get().tickets.filter(t => String(t.solicitanteId) === String(usuarioId) && ['resuelto', 'cerrado'].includes(t.estado)),

      obtenerTicketsFiltrados: () => {
        const { tickets, filtros } = get();
        return tickets.filter(t => {
          if (filtros.busqueda && !t.titulo.toLowerCase().includes(filtros.busqueda.toLowerCase())) return false;
          if (filtros.estado && t.estado !== filtros.estado) return false;
          return true;
        });
      },

      obtenerEstadisticas: () => {
        const tickets = get().tickets;
        return {
          ticketsTotal: tickets.length,
          ticketsNuevos: tickets.filter(t => t.estado === 'nuevo').length,
          ticketsAsignados: tickets.filter(t => t.estado === 'asignado').length,
          ticketsPlanificados: tickets.filter(t => t.estado === 'planificado').length,
          ticketsResueltos: tickets.filter(t => t.estado === 'resuelto').length,
          ticketsCerrados: tickets.filter(t => t.estado === 'cerrado').length,
          tiempoPromedioRespuesta: 24,
          ticketsPorCategoria: {},
          ticketsPorPrioridad: {}
        };
      },

      // ✅ id ahora es number | null
      seleccionarTicket: (id: number | null) => {
        const ticket = id !== null ? get().tickets.find(t => t.id === id) || null : null;
        set({ ticketSeleccionado: ticket });
      },

      establecerFiltros: (filtros) => set({ filtros }),
      limpiarFiltros: () => set({ filtros: {} }),
      limpiarError: () => set({ error: null }),
    }),
    {
      name: 'helpdesk-tickets-storage',
      partialize: (state) => ({ 
        tickets: state.tickets, 
        ticketSeleccionado: state.ticketSeleccionado 
      })
    }
  )
);