// =============================================
// PÁGINA: CONFIGURACIÓN PERSONAL
// =============================================

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  ArrowLeft, Bell, Mail, Volume2, AlertTriangle,
  Layout, Eye, Type, Contrast, Save, X, CheckCircle,
  Loader2, Moon, Sun, Monitor
} from 'lucide-react';

// ---------------------------------------------
// Tipos y valores por defecto
// ---------------------------------------------
export interface Preferencias {
  // Apariencia / accesibilidad
  modo_oscuro: boolean;
  tamano_texto: number;
  tamano_botones: number;
  contraste_imagenes: boolean;
  lector_pantalla: boolean;
  // Notificaciones
  email_asignacion: boolean;
  sonido_mensaje: boolean;
  alerta_sla: boolean;
  // Tickets
  vista_tickets: 'cola_general' | 'lista' | 'tarjetas';
  por_pagina: 15 | 30 | 50;
  auto_actualizar: 30 | 60 | 120 | 300;
}

const PREFS_DEFAULT: Preferencias = {
  modo_oscuro: false,
  tamano_texto: 100,
  tamano_botones: 100,
  contraste_imagenes: false,
  lector_pantalla: false,
  email_asignacion: true,
  sonido_mensaje: true,
  alerta_sla: true,
  vista_tickets: 'cola_general',
  por_pagina: 15,
  auto_actualizar: 60,
};

const TAMANO_MIN = 80;
const TAMANO_MAX = 130;

const clamp = (valor: number, min: number, max: number) =>
  Math.min(max, Math.max(min, valor));

// Combina lo que viene de Supabase (puede venir incompleto o null) con los
// valores por defecto, para que el formulario siempre tenga un shape válido.
function mergePreferencias(guardadas?: Partial<Preferencias> | null): Preferencias {
  return {
    modo_oscuro: guardadas?.modo_oscuro ?? PREFS_DEFAULT.modo_oscuro,
    tamano_texto: guardadas?.tamano_texto ?? PREFS_DEFAULT.tamano_texto,
    tamano_botones: guardadas?.tamano_botones ?? PREFS_DEFAULT.tamano_botones,
    contraste_imagenes: guardadas?.contraste_imagenes ?? PREFS_DEFAULT.contraste_imagenes,
    lector_pantalla: guardadas?.lector_pantalla ?? PREFS_DEFAULT.lector_pantalla,
    email_asignacion: guardadas?.email_asignacion ?? PREFS_DEFAULT.email_asignacion,
    sonido_mensaje: guardadas?.sonido_mensaje ?? PREFS_DEFAULT.sonido_mensaje,
    alerta_sla: guardadas?.alerta_sla ?? PREFS_DEFAULT.alerta_sla,
    vista_tickets: guardadas?.vista_tickets ?? PREFS_DEFAULT.vista_tickets,
    por_pagina: (guardadas?.por_pagina as 15 | 30 | 50) ?? PREFS_DEFAULT.por_pagina,
    auto_actualizar: (guardadas?.auto_actualizar as 30 | 60 | 120 | 300) ?? PREFS_DEFAULT.auto_actualizar,
  };
}

// Aplica los ajustes visuales/de accesibilidad al documento.
// IMPORTANTE: se invoca solo al cargar la página y al guardar -no en cada
// cambio del formulario- para cumplir con "los cambios se aplican
// inmediatamente en la interfaz después de guardar".
function aplicarPreferencias(p: Preferencias) {
  document.documentElement.classList.toggle('dark', p.modo_oscuro);
  document.documentElement.style.fontSize = `${p.tamano_texto}%`;
  document.documentElement.style.setProperty('--button-scale', String(p.tamano_botones / 100));
  document.documentElement.style.setProperty('--image-contrast', p.contraste_imagenes ? '1.2' : '1');
  document.documentElement.classList.toggle('a11y-lector-pantalla', p.lector_pantalla);
  if (p.lector_pantalla) {
    document.documentElement.setAttribute('aria-live', 'polite');
  } else {
    document.documentElement.removeAttribute('aria-live');
  }
}

export default function ConfiguracionPage() {
  const navigate = useNavigate();
  const { usuarioActual, actualizarPreferencias } = useAuthStore();

  // Última versión guardada en Supabase (vía store de autenticación)
  const prefsGuardadas = useMemo(
    () => mergePreferencias(usuarioActual?.preferencias),
    [usuarioActual?.preferencias]
  );

  const [form, setForm] = useState<Preferencias>(prefsGuardadas);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [cargando, setCargando] = useState(true);

  // Sincroniza el formulario con lo guardado y aplica esos valores al
  // documento (modo oscuro, tamaño de texto, etc.) al entrar a la página
  // o cuando el perfil del usuario se actualiza (por ejemplo, tras guardar).
  useEffect(() => {
    setForm(prefsGuardadas);
    aplicarPreferencias(prefsGuardadas);
    setCargando(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioActual?.preferencias]);

  const hayCambios = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(prefsGuardadas),
    [form, prefsGuardadas]
  );

  const toggle = (key: keyof Preferencias) =>
    setForm(f => ({ ...f, [key]: !f[key as keyof Preferencias] } as Preferencias));

  const set = <K extends keyof Preferencias>(key: K, value: Preferencias[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const handleCancelar = () => {
    setForm(prefsGuardadas);
    setMensaje(null);
  };

  const handleGuardar = async () => {
    if (!usuarioActual) return;

    // Normaliza/valida los campos numéricos antes de enviarlos a Supabase
    const prefsValidadas: Preferencias = {
      ...form,
      tamano_texto: clamp(Math.round(form.tamano_texto / 5) * 5, TAMANO_MIN, TAMANO_MAX),
      tamano_botones: clamp(Math.round(form.tamano_botones / 5) * 5, TAMANO_MIN, TAMANO_MAX),
    };

    setGuardando(true);
    setMensaje(null);
    try {
      await actualizarPreferencias(prefsValidadas);
      setForm(prefsValidadas);
      aplicarPreferencias(prefsValidadas);
      setMensaje({ tipo: 'success', texto: 'Configuración guardada correctamente' });
      setTimeout(() => setMensaje(null), 3000);
    } catch (error: any) {
      setMensaje({
        tipo: 'error',
        texto: `No se pudo guardar la configuración: ${error?.message ?? 'intenta nuevamente'}`,
      });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-[#80c398]" />
      </div>
    );
  }

  if (!usuarioActual) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-center px-4">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <p className="text-gray-700 dark:text-gray-300">
          Debes iniciar sesión para ver tu configuración personal.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 rounded-lg text-white font-medium text-sm"
          style={{ backgroundColor: '#80c398' }}
        >
          Ir a iniciar sesión
        </button>
      </div>
    );
  }

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      type="button"
      role="switch"
      aria-checked={checked}
      className="relative rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#80c398] cursor-pointer shadow-inner flex-shrink-0"
      style={{
        width: '44px',
        height: '24px',
        backgroundColor: checked ? '#80c398' : (form.modo_oscuro ? '#4b5563' : '#d1d5db'),
        padding: '2px',
      }}
    >
      <span
        className="absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow-md transition-all duration-300 ease-in-out"
        style={{
          width: '20px',
          height: '20px',
          left: checked ? '22px' : '2px',
        }}
      />
    </button>
  );

  // Campo numérico reutilizable para "Tamaño del texto" y "Tamaño de botones"
  const CampoNumerico = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (valor: number) => void;
  }) => (
    <div>
      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={TAMANO_MIN}
          max={TAMANO_MAX}
          step={5}
          value={value}
          onChange={e => {
            const raw = e.target.value;
            if (raw === '') {
              onChange(0);
              return;
            }
            const n = parseInt(raw, 10);
            if (!Number.isNaN(n)) onChange(n);
          }}
          onBlur={e => {
            const n = parseInt(e.target.value, 10);
            onChange(clamp(Number.isNaN(n) ? PREFS_DEFAULT.tamano_texto : n, TAMANO_MIN, TAMANO_MAX));
          }}
          className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#80c398]"
        />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          % (rango {TAMANO_MIN}-{TAMANO_MAX})
        </span>
      </div>
    </div>
  );

  return (
    // ✅ LAYOUT CON SCROLL - Header fijo, contenido scrolleable, footer fijo
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">

      {/* HEADER FIJO */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-white">Configuración Personal</h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs">Preferencias de la cuenta</p>
          </div>
        </div>
      </div>

      {/* CONTENIDO SCROLLEABLE */}
      <div className="flex-1 overflow-y-auto p-4">
        {mensaje && (
          <div className={`p-3 rounded-lg flex items-center gap-2 mb-4 ${mensaje.tipo === 'success' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
            {mensaje.tipo === 'success' ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
            <p className={`text-sm ${mensaje.tipo === 'success' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{mensaje.texto}</p>
          </div>
        )}

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* NOTIFICACIONES */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700 mb-3">
              <Bell className="w-4 h-4 text-blue-500" /> Notificaciones
            </h2>
            <div className="space-y-3">
              {([
                { key: 'email_asignacion', icon: <Mail className="w-4 h-4" />, label: 'Email al asignar ticket', desc: 'Envía un correo al asignarte un nuevo ticket' },
                { key: 'sonido_mensaje', icon: <Volume2 className="w-4 h-4" />, label: 'Sonido en nuevo mensaje', desc: 'Reproduce una alerta sonora al recibir un mensaje' },
                { key: 'alerta_sla', icon: <AlertTriangle className="w-4 h-4" />, label: 'Alerta SLA por vencer', desc: 'Notifica visualmente cuando un ticket está por vencer su SLA' },
              ] as const).map(({ key, icon, label, desc }) => (
                <div key={key} className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-gray-400 dark:text-gray-500 mt-0.5">{icon}</span>
                    <div>
                      <div>{label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{desc}</div>
                    </div>
                  </div>
                  <Toggle checked={form[key]} onChange={() => toggle(key)} />
                </div>
              ))}
            </div>
          </div>

          {/* TICKETS */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700 mb-3">
              <Layout className="w-4 h-4 text-purple-500" /> Tickets
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Vista predeterminada</label>
                <select
                  value={form.vista_tickets}
                  onChange={e => set('vista_tickets', e.target.value as Preferencias['vista_tickets'])}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#80c398]"
                >
                  <option value="cola_general">Cola general</option>
                  <option value="lista">Lista</option>
                  <option value="tarjetas">Tarjetas</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Registros por página</label>
                <select
                  value={form.por_pagina}
                  onChange={e => set('por_pagina', parseInt(e.target.value, 10) as Preferencias['por_pagina'])}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#80c398]"
                >
                  <option value={15}>15 registros</option>
                  <option value={30}>30 registros</option>
                  <option value={50}>50 registros</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Auto-actualizar</label>
                <select
                  value={form.auto_actualizar}
                  onChange={e => set('auto_actualizar', parseInt(e.target.value, 10) as Preferencias['auto_actualizar'])}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#80c398]"
                >
                  <option value={30}>Cada 30 segundos</option>
                  <option value={60}>Cada 60 segundos</option>
                  <option value={120}>Cada 2 minutos</option>
                  <option value={300}>Cada 5 minutos</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Define cada cuánto se refrescan automáticamente las listas de tickets.
                </p>
              </div>
            </div>
          </div>

          {/* APARIENCIA (incluye accesibilidad, según especificación) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700 mb-3">
              <Type className="w-4 h-4 text-orange-500" /> Apariencia
            </h2>
            <div className="space-y-3">
              {/* Modo oscuro */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="text-gray-400 dark:text-gray-500">
                    {form.modo_oscuro ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </span>
                  <span>Modo Oscuro</span>
                </div>
                <Toggle checked={form.modo_oscuro} onChange={() => toggle('modo_oscuro')} />
              </div>

              {/* Tamaño del texto */}
              <CampoNumerico
                label="Tamaño del texto"
                value={form.tamano_texto}
                onChange={v => set('tamano_texto', v)}
              />

              {/* Tamaño de botones */}
              <CampoNumerico
                label="Tamaño de botones"
                value={form.tamano_botones}
                onChange={v => set('tamano_botones', v)}
              />

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-3">
                {/* Lector de pantalla */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Monitor className="w-4 h-4 mt-0.5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <div>Lector de pantalla</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Mejora la compatibilidad con lectores de pantalla</div>
                    </div>
                  </div>
                  <Toggle checked={form.lector_pantalla} onChange={() => toggle('lector_pantalla')} />
                </div>

                {/* Contraste de imágenes */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Contrast className="w-4 h-4 mt-0.5 text-gray-400 dark:text-gray-500" />
                    <div>
                      <div>Alto contraste en imágenes</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Mejora el contraste visual de las imágenes en los tickets</div>
                    </div>
                  </div>
                  <Toggle checked={form.contraste_imagenes} onChange={() => toggle('contraste_imagenes')} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
          <Eye className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
          <p className="text-xs text-blue-700 dark:text-blue-400">
            Los cambios de apariencia se aplican al hacer clic en "Guardar cambios". Las preferencias de notificaciones y
            de tickets se aplicarán en tus próximas sesiones. Toda la configuración es individual y no afecta a otros usuarios.
          </p>
        </div>
      </div>

      {/* FOOTER FIJO CON BOTONES */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-6xl mx-auto flex justify-end gap-2">
          <button
            onClick={handleCancelar}
            disabled={!hayCambios || guardando}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" /> Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={!hayCambios || guardando}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all text-sm"
            style={{ backgroundColor: '#80c398' }}
          >
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}