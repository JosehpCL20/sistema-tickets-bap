import type { User, Notificacion } from './types';

// =============================================
// DATOS MOCK PARA MODO PREVIEW
// =============================================

export const usuarioMock: User = {
  id: 'preview-user-001',
  nombre: 'Evam',
  apellidos: 'Cabanillas',
  correo: 'practicante.sistemas@bancodealimentosperu.org',
  telefono: '+51 999 888 777',
  rol: 'superadmin',
  area: 'Sistemas y Procesos',
  activo: true,
  avatar: 'https://ui-avatars.com/api/?name=Evam+Cabanillas&background=80c398&color=fff&size=256',
  fechaCreacion: new Date('2026-01-15'),
  preferencias: {
    tamano_texto: 100,
    tamano_botones: 100,
  },
};

export const usuariosMock: User[] = [
  usuarioMock,
  {
    id: 'user-002',
    nombre: 'Juan',
    apellidos: 'Pérez García',
    correo: 'juan.perez@bancodealimentosperu.org',
    telefono: '+51 987 654 321',
    rol: 'administrador',
    area: 'Administración',
    activo: true,
    avatar: 'https://ui-avatars.com/api/?name=Juan+Perez&background=80c398&color=fff&size=256',
    fechaCreacion: new Date('2026-02-10'),
  },
  {
    id: 'user-003',
    nombre: 'María',
    apellidos: 'González López',
    correo: 'maria.gonzalez@bancodealimentosperu.org',
    telefono: '+51 976 543 210',
    rol: 'supervisor',
    area: 'Operaciones',
    activo: true,
    avatar: 'https://ui-avatars.com/api/?name=Maria+Gonzalez&background=80c398&color=fff&size=256',
    fechaCreacion: new Date('2026-02-15'),
  },
  {
    id: 'user-004',
    nombre: 'Carlos',
    apellidos: 'Rodríguez Sánchez',
    correo: 'carlos.rodriguez@bancodealimentosperu.org',
    telefono: '+51 965 432 109',
    rol: 'tecnico',
    area: 'Soporte TI',
    activo: true,
    avatar: 'https://ui-avatars.com/api/?name=Carlos+Rodriguez&background=80c398&color=fff&size=256',
    fechaCreacion: new Date('2026-03-01'),
  },
  {
    id: 'user-005',
    nombre: 'Ana',
    apellidos: 'Martínez Flores',
    correo: 'ana.martinez@bancodealimentosperu.org',
    telefono: '+51 954 321 098',
    rol: 'usuario',
    area: 'Logística',
    activo: true,
    avatar: 'https://ui-avatars.com/api/?name=Ana+Martinez&background=80c398&color=fff&size=256',
    fechaCreacion: new Date('2026-03-20'),
  },
];

export const notificacionesMock: Notificacion[] = [
  {
    id: 'notif-001',
    user_id: 'preview-user-001',
    titulo: 'Bienvenido al Sistema',
    mensaje: 'Has iniciado sesión correctamente en el Help Desk de Banco de Alimentos Perú.',
    tipo: 'info',
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'notif-002',
    user_id: 'preview-user-001',
    titulo: 'Nuevo Ticket Asignado',
    mensaje: 'Se te ha asignado el ticket #TK-2026-001 para revisión.',
    tipo: 'warning',
    is_read: false,
    created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
  },
  {
    id: 'notif-003',
    user_id: 'preview-user-001',
    titulo: 'Ticket Resuelto',
    mensaje: 'El ticket #TK-2026-045 ha sido marcado como resuelto.',
    tipo: 'success',
    is_read: true,
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 día atrás
  },
  {
    id: 'notif-004',
    user_id: 'preview-user-001',
    titulo: 'Comentario en Ticket',
    mensaje: 'Carlos Rodríguez ha comentado en el ticket #TK-2026-032.',
    tipo: 'info',
    is_read: false,
    created_at: new Date(Date.now() - 7200000).toISOString(), // 2 horas atrás
  },
];