// =============================================
// STORE DE PREFERENCIAS GLOBALES (Apariencia / Notificaciones / Tickets)
// Sistema de Gestión de Tickets - Banco de Alimentos Perú
// =============================================
// Este store centraliza TODO lo que toca al módulo de Configuración Global.
// - Aplica el modo oscuro y las preferencias de apariencia al <html> raíz,
//   por eso se reflejan en TODA la aplicación y no solo en la página de Configuración.
// - Persiste localmente (localStorage) para que no haya parpadeo al recargar.
// - Sincroniza con Supabase (tabla `user_preferences`) para que cada usuario
//   mantenga sus preferencias entre dispositivos/sesiones.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';

export type VistaTickets = 'cola_general' | 'lista' | 'tarjetas';
export type FrecuenciaActualizacion = 0 | 30 | 60 | 120 | 300;
export type TicketsPorPagina = 15 | 30 | 50;

export interface PreferenciasUsuario {
  // Notificaciones
  emailAlAsignarTicket: boolean;
  sonidoNuevoMensaje: boolean;
  alertaSlaPorVencer: boolean;
  // Tickets
  vistaTickets: VistaTickets;
  ticketsPorPagina: TicketsPorPagina;
  autoActualizar: FrecuenciaActualizacion;
  // Apariencia
  modoOscuro: boolean;
  tamañoTexto: number; // porcentaje, 100 = normal
  lectorPantalla: boolean;
  contrasteImagenes: boolean;
  tamañoBotones: number; // porcentaje, 100 = normal
}

export const PREFERENCIAS_POR_DEFECTO: PreferenciasUsuario = {
  emailAlAsignarTicket: true,
  sonidoNuevoMensaje: true,
  alertaSlaPorVencer: true,
  vistaTickets: 'cola_general',
  ticketsPorPagina: 15,
  autoActualizar: 60,
  modoOscuro: false,
  tamañoTexto: 100,
  lectorPantalla: false,
  contrasteImagenes: false,
  tamañoBotones: 100,
};

const LIMITES = {
  tamañoTexto: { min: 80, max: 150 },
  tamañoBotones: { min: 80, max: 150 },
};

function clamp(valor: number, min: number, max: number) {
  return Math.min(max, Math.max(min, valor));
}

/**
 * Aplica las preferencias de apariencia directamente al DOM.
 * Se ejecuta tanto al cargar la app como cada vez que cambian las preferencias guardadas.
 */
function aplicarAlDOM(prefs: PreferenciasUsuario) {
  const root = document.documentElement;

  // Modo oscuro: clase 'dark' en <html>, que es lo que Tailwind espera
  // con darkMode: 'class'. Sin esto, ninguna clase dark: del proyecto se activa.
  root.classList.toggle('dark', prefs.modoOscuro);

  // Tamaño de texto global vía variable CSS + font-size en root
  // (rem en toda la app escala automáticamente porque Tailwind usa rem por defecto)
  const textoClamp = clamp(prefs.tamañoTexto, LIMITES.tamañoTexto.min, LIMITES.tamañoTexto.max);
  root.style.fontSize = `${textoClamp}%`;

  // Tamaño de botones/elementos interactivos vía variable CSS,
  // consumida por utilidades .btn-scalable definidas en index.css
  const botonesClamp = clamp(prefs.tamañoBotones, LIMITES.tamañoBotones.min, LIMITES.tamañoBotones.max);
  root.style.setProperty('--bap-button-scale', String(botonesClamp / 100));

  // Contraste de imágenes: clase global que controla un filtro CSS
  root.classList.toggle('bap-contraste-imagenes', prefs.contrasteImagenes);

  // Lector de pantalla: clase que activa ajustes de accesibilidad
  // (focus rings más visibles, aria-live regions más explícitas, etc.)
  root.classList.toggle('bap-modo-lector', prefs.lectorPantalla);
  root.setAttribute('data-screen-reader-friendly', String(prefs.lectorPantalla));
}

interface ThemeState {
  preferencias: PreferenciasUsuario;
  preferenciasGuardadas: PreferenciasUsuario;
  cargando: boolean;
  guardando: boolean;
  error: string | null;
  hayTablaPreferencias: boolean | null; // null = aún no se sabe

  setPreferencia: <K extends keyof PreferenciasUsuario>(clave: K, valor: PreferenciasUsuario[K]) => void;
  cargarPreferencias: (usuarioId: string) => Promise<void>;
  guardarPreferencias: (usuarioId: string) => Promise<{ ok: boolean; mensaje: string }>;
  descartarCambios: () => void;
  hayCambiosSinGuardar: () => boolean;
  aplicarPreferenciasLocales: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      preferencias: PREFERENCIAS_POR_DEFECTO,
      preferenciasGuardadas: PREFERENCIAS_POR_DEFECTO,
      cargando: false,
      guardando: false,
      error: null,
      hayTablaPreferencias: null,

      setPreferencia: (clave, valor) => {
        set(state => ({
          preferencias: { ...state.preferencias, [clave]: valor },
        }));
        // Apariencia es la única sección que el documento pide aplicar
        // de inmediato (las demás se aplican "para próximas sesiones").
        // La previsualizamos en vivo para que el usuario vea el efecto
        // antes de guardar, pero solo persistimos al pulsar "Guardar".
        aplicarAlDOM(get().preferencias);
      },

      aplicarPreferenciasLocales: () => {
        aplicarAlDOM(get().preferenciasGuardadas);
      },

      cargarPreferencias: async (usuarioId: string) => {
        set({ cargando: true, error: null });
        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', usuarioId)
            .maybeSingle();

          if (error) {
            // Tabla inexistente u otro error de esquema: degradamos con elegancia
            // y seguimos usando lo que haya en localStorage / valores por defecto.
            const tablaNoExiste = error.code === '42P01' || /relation .* does not exist/i.test(error.message || '');
            set({
              cargando: false,
              hayTablaPreferencias: tablaNoExiste ? false : get().hayTablaPreferencias,
              error: tablaNoExiste
                ? null
                : 'No se pudieron cargar tus preferencias guardadas en el servidor. Se muestran tus últimos valores locales.',
            });
            aplicarAlDOM(get().preferencias);
            return;
          }

          set({ hayTablaPreferencias: true });

          if (data) {
            const prefsRemotas: PreferenciasUsuario = {
              emailAlAsignarTicket: data.email_al_asignar_ticket ?? PREFERENCIAS_POR_DEFECTO.emailAlAsignarTicket,
              sonidoNuevoMensaje: data.sonido_nuevo_mensaje ?? PREFERENCIAS_POR_DEFECTO.sonidoNuevoMensaje,
              alertaSlaPorVencer: data.alerta_sla_por_vencer ?? PREFERENCIAS_POR_DEFECTO.alertaSlaPorVencer,
              vistaTickets: data.vista_tickets ?? PREFERENCIAS_POR_DEFECTO.vistaTickets,
              ticketsPorPagina: data.tickets_por_pagina ?? PREFERENCIAS_POR_DEFECTO.ticketsPorPagina,
              autoActualizar: data.auto_actualizar ?? PREFERENCIAS_POR_DEFECTO.autoActualizar,
              modoOscuro: data.modo_oscuro ?? PREFERENCIAS_POR_DEFECTO.modoOscuro,
              tamañoTexto: data.tamano_texto ?? PREFERENCIAS_POR_DEFECTO.tamañoTexto,
              lectorPantalla: data.lector_pantalla ?? PREFERENCIAS_POR_DEFECTO.lectorPantalla,
              contrasteImagenes: data.contraste_imagenes ?? PREFERENCIAS_POR_DEFECTO.contrasteImagenes,
              tamañoBotones: data.tamano_botones ?? PREFERENCIAS_POR_DEFECTO.tamañoBotones,
            };
            set({ preferencias: prefsRemotas, preferenciasGuardadas: prefsRemotas, cargando: false });
            aplicarAlDOM(prefsRemotas);
          } else {
            // El usuario aún no tiene fila de preferencias: usamos los valores
            // por defecto y los dejaremos crear en el primer "Guardar".
            set({ cargando: false });
            aplicarAlDOM(get().preferencias);
          }
        } catch (err: any) {
          set({ cargando: false, error: err?.message || 'Error al cargar preferencias' });
          aplicarAlDOM(get().preferencias);
        }
      },

      guardarPreferencias: async (usuarioId: string) => {
        set({ guardando: true, error: null });
        const prefs = get().preferencias;

        try {
          const payload = {
            user_id: usuarioId,
            email_al_asignar_ticket: prefs.emailAlAsignarTicket,
            sonido_nuevo_mensaje: prefs.sonidoNuevoMensaje,
            alerta_sla_por_vencer: prefs.alertaSlaPorVencer,
            vista_tickets: prefs.vistaTickets,
            tickets_por_pagina: prefs.ticketsPorPagina,
            auto_actualizar: prefs.autoActualizar,
            modo_oscuro: prefs.modoOscuro,
            tamano_texto: prefs.tamañoTexto,
            lector_pantalla: prefs.lectorPantalla,
            contraste_imagenes: prefs.contrasteImagenes,
            tamano_botones: prefs.tamañoBotones,
            actualizado_en: new Date().toISOString(),
          };

          const { error } = await supabase
            .from('user_preferences')
            .upsert(payload, { onConflict: 'user_id' });

          if (error) {
            const tablaNoExiste = error.code === '42P01' || /relation .* does not exist/i.test(error.message || '');
            set({ guardando: false, hayTablaPreferencias: tablaNoExiste ? false : get().hayTablaPreferencias });

            if (tablaNoExiste) {
              // Persistimos al menos localmente para que la apariencia no se pierda,
              // y avisamos con claridad que falta crear la tabla en Supabase.
              set({ preferenciasGuardadas: prefs });
              aplicarAlDOM(prefs);
              return {
                ok: false,
                mensaje: 'Tus cambios se aplicaron en este dispositivo, pero no se pudieron guardar en el servidor porque falta crear la tabla "user_preferences" en Supabase.',
              };
            }

            return { ok: false, mensaje: error.message || 'No se pudieron guardar las preferencias.' };
          }

          set({ preferenciasGuardadas: prefs, guardando: false, hayTablaPreferencias: true });
          aplicarAlDOM(prefs);
          return { ok: true, mensaje: 'Preferencias guardadas correctamente.' };
        } catch (err: any) {
          set({ guardando: false, error: err?.message || 'Error al guardar preferencias' });
          return { ok: false, mensaje: err?.message || 'Error inesperado al guardar.' };
        }
      },

      descartarCambios: () => {
        const guardadas = get().preferenciasGuardadas;
        set({ preferencias: guardadas });
        aplicarAlDOM(guardadas);
      },

      hayCambiosSinGuardar: () => {
        const { preferencias, preferenciasGuardadas } = get();
        return JSON.stringify(preferencias) !== JSON.stringify(preferenciasGuardadas);
      },
    }),
    {
      name: 'bap-theme-storage',
      partialize: (state) => ({
        preferencias: state.preferencias,
        preferenciasGuardadas: state.preferenciasGuardadas,
      }),
      onRehydrateStorage: () => (state) => {
        // Al recargar la página, reaplicamos de inmediato lo que había en
        // localStorage para evitar el "flash" de tema claro antes de que
        // termine de montar React / llegar la respuesta de Supabase.
        if (state) {
          aplicarAlDOM(state.preferenciasGuardadas);
        }
      },
    }
  )
);
