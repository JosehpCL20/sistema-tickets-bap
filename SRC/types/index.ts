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

// ✅ NUEVO: Interfaz para preferencias de configuración del usuario
export interface UserPreferences {
  id?: string;
  // Notificaciones
  email_asignacion: boolean;
  sonido_mensaje: boolean;
  alerta_sla: boolean;
  // Tickets
  vista_tickets: string;
  por_pagina: number;
  auto_actualizar: number;
  // Apariencia
  modo_oscuro: boolean;
  tamaño_texto: number;
  lector_pantalla: boolean;
  contraste_imagenes: boolean;
  tamaño_botones: number;
  // Metadatos
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
  // ✅ Agregamos preferencias para configuración
  preferencias?: UserPreferences | null;
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