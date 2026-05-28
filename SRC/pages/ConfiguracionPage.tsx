// =============================================
// PÁGINA: CONFIGURACIÓN GENERAL
// Sistema de Gestión de Tickets - Banco de Alimentos Perú
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabaseClient';
import {
  ArrowLeft, Bell, Mail, Volume2, AlertTriangle, Layout, Eye, Type,
  Monitor, Contrast, Save, X, CheckCircle, Loader2
} from 'lucide-react';

export default function ConfiguracionPage() {
  const navigate = useNavigate();
  const { usuarioActual, actualizarPreferencias } = useAuthStore();
  
  // Estados locales para los controles
  const [modoOscuro, setModoOscuro] = useState(false);
  const [tamañoTexto, setTamañoTexto] = useState(100);
  const [contrasteImagenes, setContrasteImagenes] = useState(false);
  const [emailAsignacion, setEmailAsignacion] = useState(true);
  const [sonidoMensaje, setSonidoMensaje] = useState(true);
  const [alertaSLA, setAlertaSLA] = useState(true);
  const [vistaTickets, setVistaTickets] = useState('cola_general');
  const [porPagina, setPorPagina] = useState(15);
  const [autoActualizar, setAutoActualizar] = useState(60);
  const [lectorPantalla, setLectorPantalla] = useState(false);
  const [tamañoBotones, setTamañoBotones] = useState(100);
  
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null);
  const [cargando, setCargando] = useState(true);

  // Cargar preferencias al montar
  useEffect(() => {
    if (usuarioActual?.preferencias) {
      const prefs = usuarioActual.preferencias;
      setModoOscuro(prefs.modo_oscuro ?? false);
      setTamañoTexto(prefs.tamaño_texto ?? 100);
      setContrasteImagenes(prefs.contraste_imagenes ?? false);
      setEmailAsignacion(prefs.email_asignacion ?? true);
      setSonidoMensaje(prefs.sonido_mensaje ?? true);
      setAlertaSLA(prefs.alerta_sla ?? true);
      setVistaTickets(prefs.vista_tickets ?? 'cola_general');
      setPorPagina(prefs.por_pagina ?? 15);
      setAutoActualizar(prefs.auto_actualizar ?? 60);
      setLectorPantalla(prefs.lector_pantalla ?? false);
      setTamañoBotones(prefs.tamaño_botones ?? 100);
    }
    setCargando(false);
  }, [usuarioActual?.preferencias]);

  // ✅ APLICAR MODO OSCURO INMEDIATAMENTE al cambiar el toggle
  useEffect(() => {
    if (modoOscuro) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [modoOscuro]);

  // ✅ APLICAR TAMAÑO DE TEXTO INMEDIATAMENTE
  useEffect(() => {
    document.documentElement.style.fontSize = `${tamañoTexto}%`;
  }, [tamañoTexto]);

  const handleGuardar = async () => {
    if (!usuarioActual) return;
    setGuardando(true);
    setMensaje(null);

    try {
      // ✅ LLAMAR AL STORE para guardar en Supabase
      await actualizarPreferencias({
        modo_oscuro: modoOscuro,
        tamaño_texto: tamañoTexto,
        contraste_imagenes: contrasteImagenes,
        email_asignacion: emailAsignacion,
        sonido_mensaje: sonidoMensaje,
        alerta_sla: alertaSLA,
        vista_tickets: vistaTickets,
        por_pagina: porPagina,
        auto_actualizar: autoActualizar,
        lector_pantalla: lectorPantalla,
        tamaño_botones: tamañoBotones
      });

      setMensaje({ tipo: 'success', texto: '✅ Configuración guardada correctamente' });
      setTimeout(() => setMensaje(null), 3000);
      
    } catch (error: any) {
      console.error('❌ Error guardando:', error);
      setMensaje({ tipo: 'error', texto: `❌ Error: ${error.message}` });
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => {
    // Recargar preferencias desde el store
    if (usuarioActual?.preferencias) {
      const prefs = usuarioActual.preferencias;
      setModoOscuro(prefs.modo_oscuro ?? false);
      setTamañoTexto(prefs.tamaño_texto ?? 100);
      // ... restaurar otros valores
    }
    setMensaje(null);
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
          <p className="text-gray-500 text-sm">Configuración del sistema</p>
        </div>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`p-4 rounded-lg flex items-start gap-2 ${
          mensaje.tipo === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {mensaje.tipo === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          )}
          <p className={mensaje.tipo === 'success' ? 'text-green-700' : 'text-red-700'}>{mensaje.texto}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna Izquierda */}
        <div className="space-y-6">
          
          {/* Notificaciones */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" /> Notificaciones
            </h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Email al asignar ticket</span>
                </div>
                <input type="checkbox" checked={emailAsignacion} onChange={(e) => setEmailAsignacion(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-emerald-600" style={{ accentColor: '#80c398' }} />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Sonido en nuevo mensaje</span>
                </div>
                <input type="checkbox" checked={sonidoMensaje} onChange={(e) => setSonidoMensaje(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-emerald-600" style={{ accentColor: '#80c398' }} />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Alerta SLA por vencer</span>
                </div>
                <input type="checkbox" checked={alertaSLA} onChange={(e) => setAlertaSLA(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-emerald-600" style={{ accentColor: '#80c398' }} />
              </label>
            </div>
          </div>

          {/* Tickets */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Layout className="w-5 h-5 text-purple-600" /> Tickets
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vista</label>
                <select value={vistaTickets} onChange={(e) => setVistaTickets(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white"
                  style={{ '--tw-ring-color': '#80c398' } as any}>
                  <option value="cola_general">Cola general</option>
                  <option value="lista">Lista</option>
                  <option value="tarjetas">Tarjetas</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Por página</label>
                <select value={porPagina} onChange={(e) => setPorPagina(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white"
                  style={{ '--tw-ring-color': '#80c398' } as any}>
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Auto-actualizar</label>
                <select value={autoActualizar} onChange={(e) => setAutoActualizar(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white"
                  style={{ '--tw-ring-color': '#80c398' } as any}>
                  <option value={30}>30 seg</option>
                  <option value={60}>60 seg</option>
                  <option value={120}>2 min</option>
                  <option value={0}>Desactivado</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha - Apariencia */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-600" /> Apariencia
            </h2>
            <div className="space-y-4">
              
              {/* ✅ MODO OSCURO - Toggle */}
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Modo Oscuro</span>
                </div>
                <input type="checkbox" checked={modoOscuro} onChange={(e) => setModoOscuro(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-emerald-600" style={{ accentColor: '#80c398' }} />
              </label>

              {/* Tamaño de texto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Type className="w-4 h-4" /> Tamaño del texto
                </label>
                <input type="number" value={tamañoTexto} onChange={(e) => setTamañoTexto(parseInt(e.target.value) || 100)}
                  min="80" max="150" step="5"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                  style={{ '--tw-ring-color': '#80c398' } as any} />
                <p className="text-xs text-gray-500 mt-1">{tamañoTexto}% (80-150%)</p>
              </div>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Lector de pantalla</span>
                </div>
                <input type="checkbox" checked={lectorPantalla} onChange={(e) => setLectorPantalla(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-emerald-600" style={{ accentColor: '#80c398' }} />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Contrast className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Contraste de imágenes</span>
                </div>
                <input type="checkbox" checked={contrasteImagenes} onChange={(e) => setContrasteImagenes(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-emerald-600" style={{ accentColor: '#80c398' }} />
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tamaño de Botones</label>
                <input type="number" value={tamañoBotones} onChange={(e) => setTamañoBotones(parseInt(e.target.value) || 100)}
                  min="80" max="150" step="5"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                  style={{ '--tw-ring-color': '#80c398' } as any} />
                <p className="text-xs text-gray-500 mt-1">{tamañoBotones}% (80-150%)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
        <button onClick={handleCancelar} disabled={guardando}
          className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
          <X className="w-5 h-5" /> Cancelar
        </button>
        <button onClick={handleGuardar} disabled={guardando}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium disabled:opacity-50"
          style={{ backgroundColor: '#80c398' }}
          onMouseEnter={(e) => !guardando && (e.currentTarget.style.backgroundColor = '#6ab088')}
          onMouseLeave={(e) => !guardando && (e.currentTarget.style.backgroundColor = '#80c398')}>
          {guardando ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</>
          ) : (
            <><Save className="w-5 h-5" /> Guardar Cambios</>
          )}
        </button>
      </div>
    </div>
  );
}