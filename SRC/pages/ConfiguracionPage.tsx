// =============================================
// PÁGINA: CONFIGURACIÓN GLOBAL
// Sistema de Gestión de Tickets - Banco de Alimentos Perú
// =============================================
// Tres bloques: Notificaciones, Tickets y Apariencia.
// Los cambios de Apariencia se previsualizan en vivo (vía themeStore) y
// TODOS los cambios (incluida Apariencia) solo se persisten al pulsar
// "Guardar Cambios". "Cancelar" descarta y restaura lo último guardado.

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  useThemeStore,
  type VistaTickets,
  type TicketsPorPagina,
  type FrecuenciaActualizacion,
} from '../store/themeStore';
import {
  Bell, Ticket as TicketIcon, Moon, Sun,
  Save, X, Loader2, CheckCircle2, AlertTriangle, Info,
} from 'lucide-react';

// =============================================
// SUBCOMPONENTES DE UI REUTILIZABLES (con soporte modo oscuro)
// =============================================

function Tarjeta({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 transition-colors">
      {children}
    </div>
  );
}

function EncabezadoTarjeta({
  icono: Icono,
  titulo,
  descripcion,
}: {
  icono: React.ElementType;
  titulo: string;
  descripcion: string;
}) {
  return (
    <div className="flex items-start gap-3 p-5 border-b border-gray-100 dark:border-slate-700">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: 'rgba(128,195,152,0.15)' }}
      >
        <Icono className="w-5 h-5" style={{ color: '#6ab088' }} />
      </div>
      <div>
        <h2 className="font-semibold text-gray-800 dark:text-slate-100">{titulo}</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400">{descripcion}</p>
      </div>
    </div>
  );
}

function FilaControl({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-700 dark:text-slate-200">{titulo}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{descripcion}</p>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Interruptor({
  activo,
  onChange,
  etiqueta,
}: {
  activo: boolean;
  onChange: (valor: boolean) => void;
  etiqueta: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      onClick={() => onChange(!activo)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 btn-scalable focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
      style={{
        backgroundColor: activo ? '#80c398' : undefined,
        // @ts-ignore - color personalizado para foco accesible
        '--tw-ring-color': '#80c398',
      }}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          activo ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
      {!activo && (
        <span className="absolute inset-0 rounded-full bg-gray-300 dark:bg-slate-600 -z-10" />
      )}
    </button>
  );
}

function Select<T extends string | number>({
  valor,
  opciones,
  onChange,
}: {
  valor: T;
  opciones: { valor: T; etiqueta: string }[];
  onChange: (valor: T) => void;
}) {
  return (
    <select
      value={String(valor)}
      onChange={(e) => {
        const seleccion = opciones.find((o) => String(o.valor) === e.target.value);
        if (seleccion) onChange(seleccion.valor);
      }}
      className="btn-scalable text-sm border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:border-transparent min-w-[160px]"
      style={{ '--tw-ring-color': '#80c398' } as any}
    >
      {opciones.map((o) => (
        <option key={String(o.valor)} value={String(o.valor)}>
          {o.etiqueta}
        </option>
      ))}
    </select>
  );
}

function CampoNumerico({
  valor,
  min,
  max,
  paso = 5,
  sufijo = '%',
  onChange,
}: {
  valor: number;
  min: number;
  max: number;
  paso?: number;
  sufijo?: string;
  onChange: (valor: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 btn-scalable">
      <button
        type="button"
        aria-label="Disminuir"
        onClick={() => onChange(Math.max(min, valor - paso))}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
      >
        −
      </button>
      <input
        type="number"
        value={valor}
        min={min}
        max={max}
        step={paso}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
        className="w-20 text-center text-sm border border-gray-300 dark:border-slate-600 rounded-lg px-2 py-2 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-100 focus:outline-none focus:ring-2"
        style={{ '--tw-ring-color': '#80c398' } as any}
      />
      <span className="text-xs text-gray-400 dark:text-slate-500 w-6">{sufijo}</span>
      <button
        type="button"
        aria-label="Aumentar"
        onClick={() => onChange(Math.min(max, valor + paso))}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
      >
        +
      </button>
    </div>
  );
}

// =============================================
// PÁGINA PRINCIPAL
// =============================================

export default function ConfiguracionPage() {
  const { usuarioActual } = useAuthStore();
  const {
    preferencias,
    setPreferencia,
    cargarPreferencias,
    guardarPreferencias,
    descartarCambios,
    hayCambiosSinGuardar,
    cargando,
    guardando,
    hayTablaPreferencias,
  } = useThemeStore();

  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error' | 'warning'; texto: string } | null>(null);

  useEffect(() => {
    if (usuarioActual) {
      cargarPreferencias(usuarioActual.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioActual?.id]);

  const handleGuardar = async () => {
    if (!usuarioActual) return;
    setMensaje(null);
    const resultado = await guardarPreferencias(usuarioActual.id);
    setMensaje({
      tipo: resultado.ok ? 'success' : 'warning',
      texto: resultado.mensaje,
    });
    if (resultado.ok) {
      setTimeout(() => setMensaje(null), 4000);
    }
  };

  const handleCancelar = () => {
    descartarCambios();
    setMensaje(null);
  };

  const cambiosPendientes = hayCambiosSinGuardar();

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Configuración</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">
          Personaliza notificaciones, visualización de tickets y apariencia del sistema.
        </p>
      </div>

      {hayTablaPreferencias === false && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10">
          <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Aún no existe la tabla <code className="font-mono">user_preferences</code> en la base de datos. Tus
            cambios se aplican y guardan en este dispositivo, pero no se sincronizarán entre sesiones hasta que se
            cree la tabla en Supabase.
          </p>
        </div>
      )}

      {cargando && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando tus preferencias guardadas...
        </div>
      )}

      {/* ============== NOTIFICACIONES ============== */}
      <Tarjeta>
        <EncabezadoTarjeta
          icono={Bell}
          titulo="Notificaciones"
          descripcion="Controla las alertas que recibes dentro y fuera del sistema."
        />
        <div className="p-5 divide-y divide-gray-100 dark:divide-slate-700">
          <FilaControl
            titulo="Email al asignar ticket"
            descripcion="Recibe un correo cuando se te asigna un nuevo ticket."
          >
            <Interruptor
              etiqueta="Email al asignar ticket"
              activo={preferencias.emailAlAsignarTicket}
              onChange={(v) => setPreferencia('emailAlAsignarTicket', v)}
            />
          </FilaControl>

          <FilaControl
            titulo="Sonido en nuevo mensaje"
            descripcion="Reproduce un sonido cuando llega un mensaje o comentario."
          >
            <Interruptor
              etiqueta="Sonido en nuevo mensaje"
              activo={preferencias.sonidoNuevoMensaje}
              onChange={(v) => setPreferencia('sonidoNuevoMensaje', v)}
            />
          </FilaControl>

          <FilaControl
            titulo="Alerta SLA por vencer"
            descripcion="Muestra avisos visuales cuando un ticket está por superar su tiempo límite."
          >
            <Interruptor
              etiqueta="Alerta SLA por vencer"
              activo={preferencias.alertaSlaPorVencer}
              onChange={(v) => setPreferencia('alertaSlaPorVencer', v)}
            />
          </FilaControl>
        </div>
      </Tarjeta>

      {/* ============== TICKETS ============== */}
      <Tarjeta>
        <EncabezadoTarjeta
          icono={TicketIcon}
          titulo="Tickets"
          descripcion="Define cómo se visualizan y actualizan las listas de solicitudes."
        />
        <div className="p-5 divide-y divide-gray-100 dark:divide-slate-700">
          <FilaControl titulo="Vista" descripcion="Modo de visualización predeterminado de la lista de tickets.">
            <Select<VistaTickets>
              valor={preferencias.vistaTickets}
              onChange={(v) => setPreferencia('vistaTickets', v)}
              opciones={[
                { valor: 'cola_general', etiqueta: 'Cola general' },
                { valor: 'lista', etiqueta: 'Lista' },
                { valor: 'tarjetas', etiqueta: 'Tarjetas' },
              ]}
            />
          </FilaControl>

          <FilaControl titulo="Por página" descripcion="Cantidad de tickets mostrados por página.">
            <Select<TicketsPorPagina>
              valor={preferencias.ticketsPorPagina}
              onChange={(v) => setPreferencia('ticketsPorPagina', v)}
              opciones={[
                { valor: 15, etiqueta: '15 tickets' },
                { valor: 30, etiqueta: '30 tickets' },
                { valor: 50, etiqueta: '50 tickets' },
              ]}
            />
          </FilaControl>

          <FilaControl
            titulo="Auto-actualizar"
            descripcion="Intervalo en que la página se recarga para mostrar datos nuevos."
          >
            <Select<FrecuenciaActualizacion>
              valor={preferencias.autoActualizar}
              onChange={(v) => setPreferencia('autoActualizar', v)}
              opciones={[
                { valor: 0, etiqueta: 'Desactivado' },
                { valor: 30, etiqueta: '30 segundos' },
                { valor: 60, etiqueta: '60 segundos' },
                { valor: 120, etiqueta: '2 minutos' },
                { valor: 300, etiqueta: '5 minutos' },
              ]}
            />
          </FilaControl>
        </div>
      </Tarjeta>

      {/* ============== APARIENCIA ============== */}
      <Tarjeta>
        <EncabezadoTarjeta
          icono={preferencias.modoOscuro ? Moon : Sun}
          titulo="Apariencia"
          descripcion="Ajusta accesibilidad y preferencias visuales. Se aplican al guardar."
        />
        <div className="p-5 divide-y divide-gray-100 dark:divide-slate-700">
          <FilaControl
            titulo="Modo Oscuro"
            descripcion="Alterna entre el tema claro y oscuro de toda la interfaz."
          >
            <Interruptor
              etiqueta="Modo oscuro"
              activo={preferencias.modoOscuro}
              onChange={(v) => setPreferencia('modoOscuro', v)}
            />
          </FilaControl>

          <FilaControl
            titulo="Tamaño del texto"
            descripcion="Aumenta o disminuye el tamaño de fuente general del sistema."
          >
            <CampoNumerico
              valor={preferencias.tamañoTexto}
              min={80}
              max={150}
              paso={10}
              onChange={(v) => setPreferencia('tamañoTexto', v)}
            />
          </FilaControl>

          <FilaControl
            titulo="Lector de pantalla"
            descripcion="Activa ajustes de compatibilidad para herramientas de lectura de pantalla."
          >
            <Interruptor
              etiqueta="Lector de pantalla"
              activo={preferencias.lectorPantalla}
              onChange={(v) => setPreferencia('lectorPantalla', v)}
            />
          </FilaControl>

          <FilaControl
            titulo="Contraste de imágenes"
            descripcion="Mejora el contraste de las imágenes cargadas en los tickets."
          >
            <Interruptor
              etiqueta="Contraste de imágenes"
              activo={preferencias.contrasteImagenes}
              onChange={(v) => setPreferencia('contrasteImagenes', v)}
            />
          </FilaControl>

          <FilaControl
            titulo="Tamaño de Botones"
            descripcion="Ajusta el tamaño de botones y elementos interactivos."
          >
            <CampoNumerico
              valor={preferencias.tamañoBotones}
              min={80}
              max={150}
              paso={10}
              onChange={(v) => setPreferencia('tamañoBotones', v)}
            />
          </FilaControl>
        </div>
      </Tarjeta>

      {/* ============== MENSAJE DE ESTADO ============== */}
      {mensaje && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border ${
            mensaje.tipo === 'success'
              ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10'
              : 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10'
          }`}
        >
          {mensaje.tipo === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          )}
          <p
            className={`text-sm ${
              mensaje.tipo === 'success'
                ? 'text-emerald-800 dark:text-emerald-300'
                : 'text-amber-800 dark:text-amber-300'
            }`}
          >
            {mensaje.texto}
          </p>
        </div>
      )}

      {/* ============== ACCIONES GLOBALES ============== */}
      <div className="sticky bottom-4 flex justify-end">
        <div className="flex gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg p-3">
          <button
            type="button"
            onClick={handleCancelar}
            disabled={guardando || !cambiosPendientes}
            className="btn-scalable px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando || !cambiosPendientes}
            className="btn-scalable px-4 py-2.5 rounded-lg text-white font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ backgroundColor: '#80c398' }}
            onMouseEnter={(e) => !guardando && cambiosPendientes && (e.currentTarget.style.backgroundColor = '#6ab088')}
            onMouseLeave={(e) => !guardando && (e.currentTarget.style.backgroundColor = '#80c398')}
          >
            {guardando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
