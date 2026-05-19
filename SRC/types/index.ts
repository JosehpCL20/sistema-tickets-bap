// =============================================
// TIPOS COMPARTIDOS - Sistema de Tickets
// =============================================

export type UserRole = 'superadmin' | 'administrador' | 'supervisor' | 'tecnico' | 'usuario';

export type TicketStatus = 'nuevo' | 'asignado' | 'planificado' | 'resuelto' | 'cerrado';
export type TicketPriority = 'muy_baja' | 'baja' | 'media' | 'alta' | 'muy_alta';
export type TicketCategory = 
  | 'hardware_computadora' | 'hardware_impresora' | 'hardware_red' | 'hardware_telefonia'
  | 'software_instalacion' | 'software_error' | 'software_actualizacion'
  | 'correo_electronico' | 'internet_wifi' | 'internet_cable'
  | 'sistema_interno' | 'seguridad' | 'cuenta_acceso' | 'otro';

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
}

export interface Ticket {
  id: number;
  titulo: string;
  asunto: string;
  descripcion: string;
  categoria: TicketCategory;
  subcategoria?: string;
  prioridad: TicketPriority;
  estado: TicketStatus;
  solicitanteId: string;
  tecnicoAsignadoId?: string;
  tecnico_tomo_id?: string;
  fechaCreacion: Date;
  fechaModificacion: Date;
  fechaPlanificada?: Date;
  fecha_tomada?: Date | string;
  fecha_resolucion?: Date | string;
  fecha_cierre?: Date | string;
  fechaResolucion?: Date | string;
  fechaCierre?: Date | string;
  duracionEstimada?: string;
  tiempoResolucion?: string;
  participantes: string[];
  mensajes: Mensaje[];
  encuestaCompletada?: boolean;
  tiempo_estimado?: string;           
  duracion_estimada_minutos?: number; 
  usuario_estimo_id?: string;
}

export interface Mensaje {
  id: string;
  ticketId: string;
  autorId: string;
  contenido: string;
  fechaCreacion: Date;
  archivos?: Archivo[];
  esNotaInterna?: boolean;
}

export interface Archivo {
  id: string;
  nombre: string;
  tipo: string;
  url: string;
  tamaño?: number;
}

export interface Notificacion {
  id: string;
  usuarioId: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  ticketId?: string;
  leida: boolean;
  fechaCreacion: Date;
}

export interface FiltrosTicket {
  estado?: TicketStatus;
  prioridad?: TicketPriority;
  categoria?: TicketCategory;
  tecnicoId?: string;
  busqueda?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
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