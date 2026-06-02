// =============================================
// STORE DE AUTENTICACIÓN — Zustand + Supabase
// Con soporte para Modo Preview
// =============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';
import type { User, UserRole, UserPreferences, Notificacion } from '../types';
import { usuarioMock, usuariosMock, notificacionesMock } from '../mockData';

// Detectar modo preview
const PREVIEW_MODE = import.meta.env.VITE_PREVIEW_MODE === 'true';

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
  actualizarPreferencias: (datos: Partial<UserPreferences>) => Promise<void>;
  cargarNotificaciones: () => Promise<void>;
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
        
        // MODO PREVIEW: Saltar autenticación real
        if (PREVIEW_MODE) {
          console.log('🔓 MODO PREVIEW ACTIVO - Saltando autenticación');
          set({ 
            usuarioActual: usuarioMock,
            usuarios: usuariosMock,
            notificaciones: notificacionesMock,
            isAuthenticated: true, 
            isLoading: false, 
            error: null 
          });
          return true;
        }
        
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

          const { data: prefs } = await supabase
            .from('user_preferences').select('*').eq('user_id', usuario.id).single();

          const preferencias: UserPreferences | null = prefs ? {
            ...prefs,
            tamano_texto: prefs.tamano_texto ?? 100,
            tamano_botones: prefs.tamano_botones ?? 100,
          } : null;

          const usuarioActual: User = {
            ...mapearUsuario(usuario),
            preferencias,
          };

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
        // MODO PREVIEW: Solo limpiar estado
        if (PREVIEW_MODE) {
          set({ 
            usuarioActual: null, 
            isAuthenticated: false, 
            notificaciones: [], 
            usuarios: [] 
          });
          return;
        }
        
        await supabase.auth.signOut();
        set({ usuarioActual: null, isAuthenticated: false, notificaciones: [], usuarios: [] });
      },

      // ─── USUARIOS ─────────────────────────────────────────
      cargarUsuarios: async () => {
        // MODO PREVIEW: Usar datos mock
        if (PREVIEW_MODE) {
          set({ usuarios: usuariosMock });
          return;
        }
        
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
        // MODO PREVIEW: Actualizar solo en memoria
        if (PREVIEW_MODE) {
          set(state => ({
            usuarios: state.usuarios.map(u => u.id === id ? { ...u, ...datos } : u),
            usuarioActual: state.usuarioActual?.id === id
              ? { ...state.usuarioActual, ...datos }
              : state.usuarioActual
          }));
          return;
        }
        
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

      // ─── PREFERENCIAS ─────────────────────────────────────
      actualizarPreferencias: async (datos) => {
        const usuario = get().usuarioActual;
        if (!usuario) return;
        
        // MODO PREVIEW: Actualizar solo en memoria
        if (PREVIEW_MODE) {
          const nuevasPrefs = { ...(usuario.preferencias || {}), ...datos } as UserPreferences;
          set({ usuarioActual: { ...usuario, preferencias: nuevasPrefs } });
          return;
        }
        
        try {
          const payload = { ...datos, updated_at: new Date().toISOString() };
          const { data: existing } = await supabase
            .from('user_preferences').select('id').eq('user_id', usuario.id).single();

          if (existing) {
            const { error } = await supabase
              .from('user_preferences').update(payload).eq('user_id', usuario.id);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('user_preferences')
              .insert([{ user_id: usuario.id, ...payload, created_at: new Date().toISOString() }]);
            if (error) throw error;
          }

          const nuevasPrefs = { ...(usuario.preferencias || {}), ...datos } as UserPreferences;
          set({ usuarioActual: { ...usuario, preferencias: nuevasPrefs } });
        } catch (err: any) {
          console.error('Error guardando preferencias:', err);
          throw err;
        }
      },

      // ─── NOTIFICACIONES ───────────────────────────────────
      cargarNotificaciones: async () => {
        // MODO PREVIEW: Usar datos mock
        if (PREVIEW_MODE) {
          set({ notificaciones: notificacionesMock });
          return;
        }
        
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

      marcarNotificacionLeida: async (id) => {
        // MODO PREVIEW: Actualizar solo en memoria
        if (PREVIEW_MODE) {
          set(state => ({
            notificaciones: state.notificaciones.map(n => n.id === id ? { ...n, is_read: true } : n)
          }));
          return;
        }
        
        try {
          await supabase.from('notifications').update({ is_read: true }).eq('id', id);
          set(state => ({
            notificaciones: state.notificaciones.map(n => n.id === id ? { ...n, is_read: true } : n)
          }));
        } catch (err) { console.error('Error marcando notificación:', err); }
      },

      marcarTodasLeidas: async () => {
        // MODO PREVIEW: Actualizar solo en memoria
        if (PREVIEW_MODE) {
          set(state => ({
            notificaciones: state.notificaciones.map(n => ({ ...n, is_read: true }))
          }));
          return;
        }
        
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
        // MODO PREVIEW: Actualizar solo en memoria
        if (PREVIEW_MODE) {
          set(state => ({ notificaciones: state.notificaciones.filter(n => n.id !== id) }));
          return;
        }
        
        try {
          await supabase.from('notifications').delete().eq('id', id);
          set(state => ({ notificaciones: state.notificaciones.filter(n => n.id !== id) }));
        } catch (err) { console.error('Error eliminando notificación:', err); }
      },

      // ─── REALTIME ─────────────────────────────────────────
      SuscribirseNotificaciones: () => {
        // MODO PREVIEW: No suscribirse a cambios en tiempo real
        if (PREVIEW_MODE) {
          return () => {};
        }
        
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

// Exportar para uso en otros componentes
export { PREVIEW_MODE };