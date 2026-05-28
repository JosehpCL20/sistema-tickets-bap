// =============================================
// STORE DE AUTENTICACIÓN - ZUSTAND + SUPABASE
// Sistema de Gestión de Tickets - Banco de Alimentos Perú
// =============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';
import type { User, UserRole, Notificacion, UserPreferences } from '../types';

export interface Notification {
  id: string;
  user_id: string;
  ticket_id: number | null;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata: Record<string, any>;
}

interface AuthState {
  usuarioActual: User | null;
  usuarios: User[];
  notificaciones: Notification[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Autenticación
  login: (correo: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Usuarios
  cargarUsuarios: () => Promise<void>;
  obtenerUsuarioPorId: (id: string) => User | undefined;
  obtenerUsuariosPorRol: (rol: UserRole) => User[];
  obtenerTecnicos: () => User[];
  obtenerAdministradores: () => User[];
  obtenerSupervisores: () => User[];
  actualizarUsuario: (id: string, datos: Partial<User>) => Promise<void>;
  
  // Preferencias de configuración
  actualizarPreferencias: (datos: Partial<UserPreferences>) => Promise<void>;
  
  // Notificaciones
  cargarNotificaciones: () => Promise<void>;
  agregarNotificacion: (notif: Omit<Notification, 'id' | 'is_read' | 'created_at'>) => Promise<void>;
  marcarNotificacionLeida: (id: string) => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;
  eliminarNotificacion: (id: string) => Promise<void>;
  obtenerNotificacionesNoLeidas: () => Notification[];
  
  // Realtime
  SuscribirseNotificaciones: () => () => void;
  
  // Utilidades
  limpiarError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      usuarioActual: null,
      usuarios: [],
      notificaciones: [],
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ========== AUTENTICACIÓN ==========
      login: async (correo: string, password: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        
        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: correo,
            password: password
          });
          
          if (authError) {
            set({ isLoading: false, error: 'Correo o contraseña incorrectos' });
            return false;
          }
          
          const { data: usuario, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('correo', correo)
            .single();
          
          if (userError || !usuario) {
            set({ isLoading: false, error: 'Usuario no encontrado' });
            return false;
          }
          
          if (!usuario.activo) {
            set({ isLoading: false, error: 'Usuario inactivo. Contacta a Sistemas.' });
            return false;
          }
          
          // Actualizar último acceso
          await supabase.from('users').update({ 
            ultimo_acceso: new Date().toISOString() 
          }).eq('id', usuario.id);
          
          // ✅ Cargar preferencias del usuario
          const { data: prefs, error: prefsError } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', usuario.id)
            .single();
          
          const preferencias = prefsError || !prefs ? null : prefs as UserPreferences;
          
          const usuarioActual: User = {
            id: usuario.id,
            nombre: usuario.nombre,
            apellidos: usuario.apellidos,
            correo: usuario.correo,
            telefono: usuario.telefono,
            rol: usuario.rol as UserRole,
            area: usuario.area,
            activo: usuario.activo,
            avatar: usuario.avatar,
            fechaCreacion: new Date(usuario.fecha_creacion),
            ultimoAcceso: new Date(),
            preferencias: preferencias
          };
          
          await get().cargarUsuarios();
          await get().cargarNotificaciones();
          
          set({ usuarioActual, isAuthenticated: true, isLoading: false, error: null });
          return true;
        } catch (error: any) {
          set({ isLoading: false, error: error.message || 'Error al iniciar sesión' });
          return false;
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ 
          usuarioActual: null, 
          isAuthenticated: false, 
          notificaciones: [],
          usuarios: []
        });
      },

      // ========== USUARIOS ==========
      cargarUsuarios: async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('activo', true)
            .order('nombre', { ascending: true });
          
          if (error) throw error;
          
          const usuariosMapeados: User[] = (data || []).map((u: any) => ({
            id: u.id,
            nombre: u.nombre,
            apellidos: u.apellidos,
            correo: u.correo,
            telefono: u.telefono,
            rol: u.rol as UserRole,
            area: u.area,
            activo: u.activo,
            avatar: u.avatar,
            fechaCreacion: new Date(u.fecha_creacion),
            ultimoAcceso: u.ultimo_acceso ? new Date(u.ultimo_acceso) : undefined
          }));
          
          set({ usuarios: usuariosMapeados });
        } catch (error: any) {
          console.error('Error cargando usuarios:', error);
        }
      },

      obtenerUsuarioPorId: (id: string) => 
        get().usuarios.find(u => u.id === id),
      
      obtenerUsuariosPorRol: (rol: UserRole) => 
        get().usuarios.filter(u => u.rol === rol && u.activo),
      
      obtenerTecnicos: () => 
        get().usuarios.filter(u => u.rol === 'tecnico' && u.activo),
      
      obtenerAdministradores: () => 
        get().usuarios.filter(u => u.rol === 'administrador' && u.activo),
      
      obtenerSupervisores: () => 
        get().usuarios.filter(u => u.rol === 'supervisor' && u.activo),

      actualizarUsuario: async (id: string, datos: Partial<User>) => {
        try {
          const { error } = await supabase
            .from('users')
            .update({
              nombre: datos.nombre,
              apellidos: datos.apellidos,
              telefono: datos.telefono,
              area: datos.area,
              avatar: datos.avatar,
              fecha_modificacion: new Date().toISOString()
            })
            .eq('id', id);
          
          if (error) throw error;
          
          set(state => ({
            usuarios: state.usuarios.map(u => 
              u.id === id ? { ...u, ...datos } : u
            ),
            usuarioActual: state.usuarioActual?.id === id 
              ? { ...state.usuarioActual, ...datos } 
              : state.usuarioActual
          }));
        } catch (error: any) {
          console.error('Error actualizando usuario:', error);
          throw error;
        }
      },

      // ✅ NUEVO: Función para guardar preferencias de configuración
      actualizarPreferencias: async (datos: Partial<UserPreferences>) => {
        const usuario = get().usuarioActual;
        if (!usuario) return;

        try {
          // Verificar si ya existe registro de preferencias
          const { data: existing } = await supabase
            .from('user_preferences')
            .select('id')
            .eq('user_id', usuario.id)
            .single();

          if (existing) {
            // Actualizar registro existente
            const { error } = await supabase
              .from('user_preferences')
              .update({ 
                ...datos, 
                updated_at: new Date().toISOString() 
              })
              .eq('user_id', usuario.id);
            
            if (error) throw error;
          } else {
            // Insertar nuevo registro
            const { error } = await supabase
              .from('user_preferences')
              .insert([{ 
                user_id: usuario.id, 
                ...datos,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }]);
            
            if (error) throw error;
          }

          // Actualizar en el estado local del store
          const nuevasPrefs = { 
            ...(usuario.preferencias || {}), 
            ...datos 
          } as UserPreferences;
          
          set({
            usuarioActual: { 
              ...usuario, 
              preferencias: nuevasPrefs 
            }
          });
          
        } catch (error: any) {
          console.error('Error guardando preferencias:', error);
          throw error;
        }
      },

      // ========== NOTIFICACIONES ==========
      cargarNotificaciones: async () => {
        const usuario = get().usuarioActual;
        if (!usuario) return;

        try {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', usuario.id)
            .order('created_at', { ascending: false })
            .limit(50);
          
          if (error) throw error;
          set({ notificaciones: data || [] });
        } catch (error: any) {
          console.error('Error cargando notificaciones:', error);
        }
      },

      agregarNotificacion: async (notif) => {
        const usuario = get().usuarioActual;
        if (!usuario) return;

        try {
          const { data, error } = await supabase
            .from('notifications')
            .insert([{
              user_id: usuario.id,
              ticket_id: notif.ticket_id || null,
              type: notif.type,
              title: notif.title,
              message: notif.message,
              metadata: notif.metadata || {},
              created_at: new Date().toISOString()
            }])
            .select()
            .single();
          
          if (error) throw error;
          
          set(state => ({
            notificaciones: [data, ...state.notificaciones].slice(0, 50)
          }));
        } catch (error: any) {
          console.error('Error agregando notificación:', error);
        }
      },

      marcarNotificacionLeida: async (id: string) => {
        try {
          const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);
          
          if (error) throw error;
          
          set(state => ({
            notificaciones: state.notificaciones.map(n => 
              n.id === id ? { ...n, is_read: true } : n
            )
          }));
        } catch (error: any) {
          console.error('Error marcando notificación:', error);
        }
      },

      marcarTodasLeidas: async () => {
        const usuario = get().usuarioActual;
        if (!usuario) return;

        try {
          const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', usuario.id)
            .eq('is_read', false);
          
          if (error) throw error;
          
          set(state => ({
            notificaciones: state.notificaciones.map(n => ({ ...n, is_read: true }))
          }));
        } catch (error: any) {
          console.error('Error marcando todas:', error);
        }
      },

      eliminarNotificacion: async (id: string) => {
        try {
          const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id);
          
          if (error) throw error;
          
          set(state => ({
            notificaciones: state.notificaciones.filter(n => n.id !== id)
          }));
        } catch (error: any) {
          console.error('Error eliminando notificación:', error);
        }
      },

      obtenerNotificacionesNoLeidas: () => 
        get().notificaciones.filter(n => !n.is_read),

      // ========== REALTIME ==========
      SuscribirseNotificaciones: () => {
        const usuario = get().usuarioActual;
        if (!usuario) return () => {};

        const channel = supabase
          .channel(`notifications:${usuario.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${usuario.id}`
            },
            (payload) => {
              const nuevaNotif = payload.new as Notification;
              set(state => ({
                notificaciones: [nuevaNotif, ...state.notificaciones].slice(0, 50)
              }));
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${usuario.id}`
            },
            (payload) => {
              const actualizada = payload.new as Notification;
              set(state => ({
                notificaciones: state.notificaciones.map(n => 
                  n.id === actualizada.id ? actualizada : n
                )
              }));
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      },

      // ========== UTILIDADES ==========
      limpiarError: () => set({ error: null })
    }),
    
    {
      name: 'helpdesk-auth-storage',
      partialize: (state) => ({
        usuarioActual: state.usuarioActual,
        isAuthenticated: state.isAuthenticated,
        usuarios: state.usuarios
      })
    }
  )
);