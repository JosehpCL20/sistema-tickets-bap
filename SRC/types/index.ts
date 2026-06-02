// =============================================
// TIPOS COMPARTIDOS — Sistema de Tickets BAP
// =============================================

export type UserRole = 'superadmin' | 'administrador' | 'supervisor' | 'tecnico' | 'usuario';
export type TicketStatus = 'nuevo' | 'asignado' | 'planificado' | 'resuelto' | 'cerrado';
export type TicketPriority = 'muy_baja' | 'baja' | 'media' | 'alta' | 'muy_alta';

export interface UserPreferences {
  id?: string;
  user_id?: string;
  email_asignacion: boolean;
  sonido_mensaje: boolean;
  alerta_sla: boolean;
  vista_tickets: string;
  por_pagina: number;
  auto_actualizar: number;
  modo_oscuro: boolean;
  tamano_texto: number;       // sin tilde para BD
  lector_pantalla: boolean;
  contraste_imagenes: boolean;
  tamano_botones: number;     // sin tilde para BD
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  nombre: string;
  apellidos: string;
  correo: string;
  telefono?: string;
  rol: UserRole;
  area: string;
  activo: boolean;
  avatar?: string;
  fechaCreacion: Date;
  ultimoAcceso?: Date;
  preferencias?: UserPreferences | null;
}

export interface Mensaje {
  id: string;
  ticketId: number;
  autorId: string;
  contenido: string;
  esNotaInterna: boolean;
  fechaCreacion: string;
  archivos?: Archivo[];
}

export interface Archivo {
  id: string;
  nombre: string;
  tipo: string;
  url: string;
  tamanio?: number;
}

export interface Ticket {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  subcategoria?: string;
  prioridad: TicketPriority;
  estado: TicketStatus;
  activo: boolean;
  solicitanteId: string;
  tecnicoAsignadoId?: string | null;
  tecnico_tomo_id?: string | null;
  supervisorId?: string | null;
  participantes: string[];
  fechaCreacion: string;
  fechaModificacion: string;
  fechaPlanificada?: string | null;
  fecha_tomada?: string | null;
  fecha_resolucion?: string | null;
  fecha_cierre?: string | null;
  tiempo_estimado?: string | null;
  duracion_estimada_minutos?: number | null;
  encuesta_requerida?: boolean;
}

export interface FiltrosTicket {
  estado?: TicketStatus | '';
  prioridad?: TicketPriority | '';
  categoria?: string;
  tecnicoId?: string;
  busqueda?: string;
}

export interface EstadisticasDashboard {
  ticketsTotal: number;
  ticketsNuevos: number;
  ticketsAsignados: number;
  ticketsPlanificados: number;
  ticketsResueltos: number;
  ticketsCerrados: number;
  tiempoPromedioRespuesta: number;
  ticketsPorCategoria: Record<string, number>;
  ticketsPorPrioridad: Record<string, number>;
}

export interface Notificacion {
  id: string;
  user_id: string;
  ticket_id: number | null;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  metadata: Record<string, any>;
  created_at: string;
}
