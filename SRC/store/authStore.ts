// =============================================
// STORE DE AUTENTICACIÓN - ZUSTAND + SUPABASE
// =============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';
import type { User, UserRole, Notificacion } from '../types';

const generarId = () => Math.random().toString(36).substring(2, 15);

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
  agregarNotificacion: (notificacion: Omit<Notificacion, 'id' | 'fechaCreacion'>) => void;
  marcarNotificacionLeida: (id: string) => void;
  obtenerNotificacionesNoLeidas: () => Notificacion[];
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

      cargarUsuarios: async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('activo', true);
          
          if (error) throw error;
          
          const usuariosMapeados: User[] = data.map((u: any) => ({
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
            set({ isLoading: false, error: 'Usuario inactivo' });
            return false;
          }
          
          await supabase.from('users').update({ ultimo_acceso: new Date().toISOString() }).eq('id', usuario.id);
          
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
            ultimoAcceso: new Date()
          };
          
          await get().cargarUsuarios();
          
          set({ usuarioActual, isAuthenticated: true, isLoading: false, error: null });
          return true;
        } catch (error: any) {
          set({ isLoading: false, error: error.message || 'Error al iniciar sesión' });
          return false;
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ usuarioActual: null, isAuthenticated: false, notificaciones: [] });
      },

      obtenerUsuarioPorId: (id: string) => get().usuarios.find(u => u.id === id),
      obtenerUsuariosPorRol: (rol: UserRole) => get().usuarios.filter(u => u.rol === rol && u.activo),
      obtenerTecnicos: () => get().usuarios.filter(u => u.rol === 'tecnico' && u.activo),
      obtenerAdministradores: () => get().usuarios.filter(u => u.rol === 'administrador' && u.activo),
      obtenerSupervisores: () => get().usuarios.filter(u => u.rol === 'supervisor' && u.activo),

      actualizarUsuario: async (id: string, datos: Partial<User>) => {
        try {
          await supabase.from('users').update({
            nombre: datos.nombre,
            apellidos: datos.apellidos,
            telefono: datos.telefono,
            area: datos.area,
            avatar: datos.avatar
          }).eq('id', id);
          
          set(state => ({
            usuarios: state.usuarios.map(u => u.id === id ? { ...u, ...datos } : u),
            usuarioActual: state.usuarioActual?.id === id ? { ...state.usuarioActual, ...datos } : state.usuarioActual
          }));
        } catch (error) {
          console.error('Error actualizando usuario:', error);
        }
      },
      agregarUsuario: (nuevoUsuario: User) => {
        set((state) => ({
          usuarios: [...state.usuarios, nuevoUsuario]
        }));
      },

      agregarNotificacion: (notificacion) => {
        const nueva: Notificacion = {
          ...notificacion,
          id: `notif-${generarId()}`,
          fechaCreacion: new Date()
        };
        set(state => ({ notificaciones: [nueva, ...state.notificaciones].slice(0, 50) }));
      },

      marcarNotificacionLeida: (id: string) => {
        set(state => ({
          notificaciones: state.notificaciones.map(n => n.id === id ? { ...n, leida: true } : n)
        }));
      },
      obtenerNotificacionesNoLeidas: () => get().notificaciones.filter(n => !n.leida),
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