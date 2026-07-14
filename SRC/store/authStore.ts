// =============================================
// STORE DE AUTENTICACIÓN — Zustand + Supabase
// =============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';
import type { User, UserRole, Notificacion } from '../types';

interface AuthState {
  usuarioActual: User | null;
  usuarios: User[];
  notificaciones: Notificacion[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (correo: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  cargarUsuarios: () => Promise<void>;
  obtenerUsuarioPorId: (id: string) => User | undefined;
  obtenerUsuariosPorRol: (rol: UserRole) => User[];
  obtenerTecnicos: () => User[];
  obtenerAdministradores: () => User[];
  obtenerSupervisores: () => User[];
  actualizarUsuario: (id: string, datos: Partial<User>) => Promise<void>;
  cargarNotificaciones: () => Promise<void>;
  obtenerNotificacionesNoLeidas: () => Notificacion[];
  marcarNotificacionLeida: (id: string) => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;
  eliminarNotificacion: (id: string) => Promise<void>;
  SuscribirseNotificaciones: () => () => void;
  limpiarError: () => void;
}

const avatarFallback = (nombre: string, apellidos = '') =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(`${nombre} ${apellidos}`.trim())}&background=80c398&color=fff&size=256`;

const mapearUsuario = (u: any): User => ({
  id: u.id,
  nombre: u.nombre || '',
  apellidos: u.apellidos || '',
  correo: u.correo,
  telefono: u.telefono,
  rol: u.rol as UserRole,
  area: u.area || '',
  activo: u.activo ?? true,
  avatar: u.avatar || avatarFallback(u.nombre || '', u.apellidos || ''),
  fechaCreacion: new Date(u.fecha_creacion),
  ultimoAcceso: u.ultimo_acceso ? new Date(u.ultimo_acceso) : undefined,
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      usuarioActual: null,
      usuarios: [],
      notificaciones: [],
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ─── LOGIN ────────────────────────────────────────────
      login: async (correo, password) => {
        set({ isLoading: true, error: null });

        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: correo, password
          });
          if (authError) {
            console.error('Error Supabase Auth:', authError);
            set({ isLoading: false, error: `Error ${authError.status}: ${authError.message}` });
            return false;
          }

          const { data: usuario, error: userError } = await supabase
            .from('users').select('*').eq('correo', correo).single();
          if (userError || !usuario) { set({ isLoading: false, error: 'Usuario no encontrado' }); return false; }
          if (!usuario.activo) { set({ isLoading: false, error: 'Usuario inactivo. Contacta a Sistemas.' }); return false; }

          await supabase.from('users').update({ ultimo_acceso: new Date().toISOString() }).eq('id', usuario.id);

          const usuarioActual: User = mapearUsuario(usuario);

          await get().cargarUsuarios();
          await get().cargarNotificaciones();

          set({ usuarioActual, isAuthenticated: true, isLoading: false, error: null });
          return true;
        } catch (err: any) {
          set({ isLoading: false, error: err.message || 'Error al iniciar sesión' });
          return false;
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ usuarioActual: null, isAuthenticated: false, notificaciones: [], usuarios: [] });
      },

      // ─── USUARIOS ─────────────────────────────────────────
      cargarUsuarios: async () => {
        try {
          const { data, error } = await supabase
            .from('users').select('*').eq('activo', true).order('nombre');
          if (error) throw error;
          set({ usuarios: (data || []).map(mapearUsuario) });
        } catch (err) {
          console.error('Error cargando usuarios:', err);
        }
      },

      obtenerUsuarioPorId: (id) => get().usuarios.find(u => u.id === id),
      obtenerUsuariosPorRol: (rol) => get().usuarios.filter(u => u.rol === rol && u.activo),
      obtenerTecnicos: () => get().usuarios.filter(u => u.rol === 'tecnico' && u.activo),
      obtenerAdministradores: () => get().usuarios.filter(u => u.rol === 'administrador' && u.activo),
      obtenerSupervisores: () => get().usuarios.filter(u => u.rol === 'supervisor' && u.activo),

      actualizarUsuario: async (id, datos) => {
        try {
          const updatePayload: any = {
            fecha_modificacion: new Date().toISOString(),
          };
          if (datos.nombre !== undefined) updatePayload.nombre = datos.nombre;
          if (datos.apellidos !== undefined) updatePayload.apellidos = datos.apellidos;
          if (datos.telefono !== undefined) updatePayload.telefono = datos.telefono;
          if (datos.area !== undefined) updatePayload.area = datos.area;
          if (datos.avatar !== undefined) updatePayload.avatar = datos.avatar;
          if (datos.rol !== undefined) updatePayload.rol = datos.rol;
          if (datos.activo !== undefined) updatePayload.activo = datos.activo;

          const { error } = await supabase.from('users').update(updatePayload).eq('id', id);
          if (error) throw error;

          set(state => ({
            usuarios: state.usuarios.map(u => u.id === id ? { ...u, ...datos } : u),
            usuarioActual: state.usuarioActual?.id === id
              ? { ...state.usuarioActual, ...datos }
              : state.usuarioActual
          }));
        } catch (err: any) {
          console.error('Error actualizando usuario:', err);
          throw err;
        }
      },

      // ─── NOTIFICACIONES ───────────────────────────────────
      cargarNotificaciones: async () => {
        const usuario = get().usuarioActual;
        if (!usuario) return;
        try {
          const { data, error } = await supabase
            .from('notifications').select('*')
            .eq('user_id', usuario.id)
            .order('created_at', { ascending: false })
            .limit(50);
          if (error) throw error;
          set({ notificaciones: data || [] });
        } catch (err) {
          console.error('Error cargando notificaciones:', err);
        }
      },

      obtenerNotificacionesNoLeidas: () => get().notificaciones.filter(n => !n.is_read),

      marcarNotificacionLeida: async (id) => {
        try {
          await supabase.from('notifications').update({ is_read: true }).eq('id', id);
          set(state => ({
            notificaciones: state.notificaciones.map(n => n.id === id ? { ...n, is_read: true } : n)
          }));
        } catch (err) { console.error('Error marcando notificación:', err); }
      },

      marcarTodasLeidas: async () => {
        const usuario = get().usuarioActual;
        if (!usuario) return;
        try {
          await supabase.from('notifications').update({ is_read: true })
            .eq('user_id', usuario.id).eq('is_read', false);
          set(state => ({
            notificaciones: state.notificaciones.map(n => ({ ...n, is_read: true }))
          }));
        } catch (err) { console.error('Error marcando todas:', err); }
      },

      eliminarNotificacion: async (id) => {
        try {
          await supabase.from('notifications').delete().eq('id', id);
          set(state => ({ notificaciones: state.notificaciones.filter(n => n.id !== id) }));
        } catch (err) { console.error('Error eliminando notificación:', err); }
      },

      // ─── REALTIME ─────────────────────────────────────────
      SuscribirseNotificaciones: () => {
        const usuario = get().usuarioActual;
        if (!usuario) return () => {};

        const channel = supabase
          .channel(`notif-${usuario.id}`)
          .on('postgres_changes', {
            event: 'INSERT', schema: 'public', table: 'notifications',
            filter: `user_id=eq.${usuario.id}`
          }, (payload) => {
            const nueva = payload.new as Notificacion;
            set(state => ({
              notificaciones: [nueva, ...state.notificaciones].slice(0, 50)
            }));
          })
          .on('postgres_changes', {
            event: 'UPDATE', schema: 'public', table: 'notifications',
            filter: `user_id=eq.${usuario.id}`
          }, (payload) => {
            const actualizada = payload.new as Notificacion;
            set(state => ({
              notificaciones: state.notificaciones.map(n => n.id === actualizada.id ? actualizada : n)
            }));
          })
          .on('postgres_changes', {
            event: 'DELETE', schema: 'public', table: 'notifications',
            filter: `user_id=eq.${usuario.id}`
          }, (payload) => {
            set(state => ({
              notificaciones: state.notificaciones.filter(n => n.id !== payload.old.id)
            }));
          })
          .subscribe();

        return () => { supabase.removeChannel(channel); };
      },

      limpiarError: () => set({ error: null }),
    }),
    {
      name: 'bap-auth-storage',
      partialize: (state) => ({
        usuarioActual: state.usuarioActual,
        isAuthenticated: state.isAuthenticated,
        usuarios: state.usuarios,
      }),
    }
  )
);