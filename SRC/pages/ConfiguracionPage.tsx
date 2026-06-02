// =============================================
// PÁGINA: CONFIGURACIÓN PERSONAL — CORREGIDA
// Fix: handleCancelar restaura TODOS los campos
// =============================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  ArrowLeft, Bell, Mail, Volume2, AlertTriangle,
  Layout, Eye, Type, Contrast, Save, X, CheckCircle, Loader2
} from 'lucide-react';

const PREFS_DEFAULT = {
  modo_oscuro: false,
  tamano_texto: 100,
  contraste_imagenes: false,
  email_asignacion: true,
  sonido_mensaje: true,
  alerta_sla: true,
  vista_tickets: 'cola_general',
  por_pagina: 15,
  auto_actualizar: 60,
  lector_pantalla: false,
  tamano_botones: 100,
};

export default function ConfiguracionPage() {
  const navigate = useNavigate();
  const { usuarioActual, actualizarPreferencias } = useAuthStore();

  const [form, setForm] = useState({ ...PREFS_DEFAULT });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [cargando, setCargando] = useState(true);

  // Cargar preferencias guardadas
  useEffect(() => {
    if (usuarioActual?.preferencias) {
      const p = usuarioActual.preferencias;
      setForm({
        modo_oscuro: p.modo_oscuro ?? false,
        tamano_texto: p.tamano_texto ?? 100,
        contraste_imagenes: p.contraste_imagenes ?? false,
        email_asignacion: p.email_asignacion ?? true,
        sonido_mensaje: p.sonido_mensaje ?? true,
        alerta_sla: p.alerta_sla ?? true,
        vista_tickets: p.vista_tickets ?? 'cola_general',
        por_pagina: p.por_pagina ?? 15,
        auto_actualizar: p.auto_actualizar ?? 60,
        lector_pantalla: p.lector_pantalla ?? false,
        tamano_botones: p.tamano_botones ?? 100,
      });
    }
    setCargando(false);
  }, [usuarioActual?.preferencias]);

  // ✅ handleCancelar restaura TODOS los 11 campos
  const handleCancelar = () => {
    if (usuarioActual?.preferencias) {
      const p = usuarioActual.preferencias;
      setForm({
        modo_oscuro: p.modo_oscuro ?? false,
        tamano_texto: p.tamano_texto ?? 100,
        contraste_imagenes: p.contraste_imagenes ?? false,
        email_asignacion: p.email_asignacion ?? true,
        sonido_mensaje: p.sonido_mensaje ?? true,
        alerta_sla: p.alerta_sla ?? true,
        vista_tickets: p.vista_tickets ?? 'cola_general',
        por_pagina: p.por_pagina ?? 15,
        auto_actualizar: p.auto_actualizar ?? 60,
        lector_pantalla: p.lector_pantalla ?? false,
        tamano_botones: p.tamano_botones ?? 100,
      });
    } else {
      setForm({ ...PREFS_DEFAULT });
    }
    setMensaje(null);
  };

  const handleGuardar = async () => {
    if (!usuarioActual) return;
    setGuardando(true);
    setMensaje(null);
    try {
      await actualizarPreferencias(form);
      setMensaje({ tipo: 'success', texto: '✅ Configuración guardada correctamente' });
      setTimeout(() => setMensaje(null), 3000);
    } catch (error: any) {
      setMensaje({ tipo: 'error', texto: `❌ Error: ${error.message}` });
    } finally {
      setGuardando(false);
    }
  };

  const toggle = (key: keyof typeof form) =>
    setForm(f => ({ ...f, [key]: !f[key] }));

  const set = (key: keyof typeof form, value: any) =>
    setForm(f => ({ ...f, [key]: value }));

  if (cargando) return (
    <div className="flex items-center justify-center min-h-96">
      <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
    </div>
  );

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-gray-300'}`}
      style={checked ? { backgroundColor: '#80c398' } : {}}>
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-7' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Configuración Personal</h1>
          <p className="text-gray-500 text-sm">Preferencias de la cuenta</p>
        </div>
      </div>

      {mensaje && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${mensaje.tipo === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {mensaje.tipo === 'success' ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
          <p className={mensaje.tipo === 'success' ? 'text-green-700' : 'text-red-700'}>{mensaje.texto}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NOTIFICACIONES */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Bell className="w-5 h-5 text-blue-500" /> Notificaciones</h2>
          {[
            { key: 'email_asignacion' as const, icon: <Mail className="w-4 h-4" />, label: 'Email al asignar ticket' },
            { key: 'sonido_mensaje' as const, icon: <Volume2 className="w-4 h-4" />, label: 'Sonido en nuevo mensaje' },
            { key: 'alerta_sla' as const, icon: <AlertTriangle className="w-4 h-4" />, label: 'Alerta SLA por vencer' },
          ].map(({ key, icon, label }) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-700">{icon}{label}</div>
              <Toggle checked={!!form[key]} onChange={() => toggle(key)} />
            </div>
          ))}
        </div>

        {/* TICKETS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Layout className="w-5 h-5 text-purple-500" /> Tickets</h2>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Vista</label>
            <select value={form.vista_tickets} onChange={e => set('vista_tickets', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm">
              <option value="cola_general">Cola general</option>
              <option value="lista">Lista</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Registros por página: {form.por_pagina}</label>
            <input type="range" min={10} max={50} step={5} value={form.por_pagina}
              onChange={e => set('por_pagina', parseInt(e.target.value))}
              className="w-full" style={{ accentColor: '#80c398' }} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Auto-actualizar: {form.auto_actualizar}s</label>
            <select value={form.auto_actualizar} onChange={e => set('auto_actualizar', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm">
              {[30, 60, 120, 300].map(v => <option key={v} value={v}>{v}s</option>)}
            </select>
          </div>
        </div>

        {/* ACCESIBILIDAD */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Eye className="w-5 h-5 text-green-500" /> Accesibilidad</h2>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Tamaño de texto: {form.tamano_texto}%</label>
            <input type="range" min={80} max={130} step={5} value={form.tamano_texto}
              onChange={e => set('tamano_texto', parseInt(e.target.value))}
              className="w-full" style={{ accentColor: '#80c398' }} />
          </div>
          {[
            { key: 'lector_pantalla' as const, icon: <Eye className="w-4 h-4" />, label: 'Modo lector de pantalla' },
            { key: 'contraste_imagenes' as const, icon: <Contrast className="w-4 h-4" />, label: 'Alto contraste en imágenes' },
          ].map(({ key, icon, label }) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-700">{icon}{label}</div>
              <Toggle checked={!!form[key]} onChange={() => toggle(key)} />
            </div>
          ))}
        </div>

        {/* APARIENCIA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Type className="w-5 h-5 text-orange-500" /> Apariencia</h2>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Tamaño de botones: {form.tamano_botones}%</label>
            <input type="range" min={80} max={130} step={5} value={form.tamano_botones}
              onChange={e => set('tamano_botones', parseInt(e.target.value))}
              className="w-full" style={{ accentColor: '#80c398' }} />
          </div>
          <p className="text-xs text-gray-400">El modo oscuro está desactivado temporalmente (en desarrollo).</p>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={handleCancelar}
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">
          <X className="w-4 h-4" /> Cancelar
        </button>
        <button onClick={handleGuardar} disabled={guardando}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium disabled:opacity-60"
          style={{ backgroundColor: '#80c398' }}>
          {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
