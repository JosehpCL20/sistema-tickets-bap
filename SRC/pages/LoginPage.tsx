// =============================================
// PÁGINA DE LOGIN
// Sistema de Gestión de Tickets - Banco de Alimentos Perú
// Con botón de Modo Preview
// =============================================

import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, PREVIEW_MODE } from '../store/authStore';
import { supabase } from '../lib/supabaseClient';
import { 
  LogIn, 
  Mail, 
  Lock, 
  AlertCircle, 
  Loader2,
  HelpCircle,
  Eye,
  EyeOff,
  Heart,
  Eye as EyeIcon
} from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, limpiarError } = useAuthStore();
  
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [recordarme, setRecordarme] = useState(false);
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false);
  const [emailRecuperacion, setEmailRecuperacion] = useState('');
  const [mensajeRecuperacion, setMensajeRecuperacion] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Cargar datos guardados al montar
  useEffect(() => {
    const datosGuardados = localStorage.getItem('helpdesk_recordar');
    if (datosGuardados) {
      try {
        const datos = JSON.parse(datosGuardados);
        setCorreo(datos.correo || '');
        setPassword(datos.password || '');
        setRecordarme(true);
      } catch (e) {
        console.error('Error cargando datos guardados:', e);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    limpiarError();
    
    if (recordarme) {
      localStorage.setItem('helpdesk_recordar', JSON.stringify({
        correo: correo,
        password: password
      }));
    } else {
      localStorage.removeItem('helpdesk_recordar');
    }
    
    const exito = await login(correo, password);
    if (exito) {
      navigate('/dashboard');
    }
  };

  const handlePreviewMode = async () => {
    console.log('🔓 Activando modo preview...');
    const exito = await login('preview', 'preview');
    if (exito) {
      navigate('/dashboard');
    }
  };

  const handleRecuperarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeRecuperacion(null);
    setEnviando(true);

    if (!emailRecuperacion) {
      setMensajeRecuperacion({ tipo: 'error', texto: 'Ingresa tu correo electrónico' });
      setEnviando(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailRecuperacion, {
        redirectTo: `${window.location.origin}/recuperar-password`
      });

      if (error) throw error;

      setMensajeRecuperacion({ 
        tipo: 'success', 
        texto: `✅ Se ha enviado un correo a ${emailRecuperacion} con instrucciones para restablecer tu contraseña. 
                ℹ️ Cada enlace solo se puede usar una vez. Si no lo recibes, puedes solicitar otro.` 
      });
      
      setTimeout(() => {
        setMensajeRecuperacion(null);
      }, 8000);

    } catch (error: any) {
      console.error('Error recuperando contraseña:', error);
      setMensajeRecuperacion({ 
        tipo: 'error', 
        texto: error.message || 'Error al enviar el correo. Verifica que el correo exista o intenta de nuevo en unos minutos.' 
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado izquierdo - Branding */}
      <div 
        className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden"
        style={{ 
          background: 'linear-gradient(135deg, #80c398 0%, #6ab088 50%, #5a9f7c 100%)'
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center">
          <div className="mb-8">
            <div className="w-40 h-40 mx-auto bg-white rounded-3xl shadow-2xl flex items-center justify-center mb-6">
              <img 
                src="/img/logo-banco-alimentos.jpg" 
                alt="Banco de Alimentos Perú"
                className="w-36 h-36 object-contain rounded-2xl"
              />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Help Desk
            </h1>
            <p className="text-xl text-white/90 mb-2">
              Banco de Alimentos Perú
            </p>
            <p className="text-white/80 max-w-md mx-auto">
              Sistema de Gestión de Tickets - Soporte Técnico
            </p>
          </div>

          <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-2xl max-w-md mx-auto">
            <Heart className="w-8 h-8 text-white mx-auto mb-3" />
            <p className="text-white italic text-lg">
              "Conectando corazones, alimentando esperanzas"
            </p>
          </div>
        </div>
      </div>

      {/* Lado derecho - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-24 h-24 mx-auto bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4">
              <img 
                src="/img/logo-banco-alimentos.jpg" 
                alt="Logo"
                className="w-20 h-20 object-contain rounded-xl"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Help Desk</h1>
            <p className="text-gray-500">Banco de Alimentos Perú</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Bienvenido de vuelta
              </h2>
              <p className="text-gray-500">
                Ingresa tus credenciales para acceder
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="tu@bancodealimentosperu.org"
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:outline-none transition-all"
                    style={{ '--tw-ring-color': '#80c398' } as any}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={verPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:outline-none transition-all"
                    style={{ '--tw-ring-color': '#80c398' } as any}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setVerPassword(!verPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {verPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={recordarme}
                    onChange={(e) => setRecordarme(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    style={{ accentColor: '#80c398' }}
                  />
                  <span className="text-sm text-gray-600">Recordarme</span>
                </label>
                <button
                  type="button"
                  onClick={() => setMostrarRecuperar(true)}
                  className="text-sm font-medium hover:underline"
                  style={{ color: '#ea4c5b' }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg"
                style={{ backgroundColor: '#80c398' }}
                onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#6ab088')}
                onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#80c398')}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Iniciar Sesión
                  </>
                )}
              </button>
            </form>

            {/* Botón de Modo Preview */}
            {PREVIEW_MODE && (
              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">o</span>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handlePreviewMode}
                  disabled={isLoading}
                  className="mt-4 w-full py-3.5 px-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg"
                  style={{ backgroundColor: '#f0ad4e' }}
                  onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#ec971f')}
                  onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#f0ad4e')}
                >
                  <EyeIcon className="w-5 h-5" />
                  Entrar en Modo Preview
                </button>
                
                <p className="text-xs text-center text-gray-500 mt-2">
                  🔓 Acceso de demostración sin autenticación
                </p>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-xl flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">¿Necesitas ayuda?</p>
                <p className="text-blue-600">
                  Contacta al área de Sistemas y Procesos:<br/>
                  📧 sistemas@bancodealimentosperu.org<br/>
                  📞 +51 917 023 025
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            © 2026 Banco de Alimentos Perú. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Modal de Recuperar Contraseña */}
      {mostrarRecuperar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Recuperar Contraseña
              </h3>
              <p className="text-gray-500 text-sm">
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
              </p>
            </div>

            {mensajeRecuperacion && (
              <div className={`mb-4 p-4 rounded-xl flex items-start gap-2 ${
                mensajeRecuperacion.tipo === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  mensajeRecuperacion.tipo === 'success' ? 'text-green-500' : 'text-red-500'
                }`} />
                <p className={`text-sm ${
                  mensajeRecuperacion.tipo === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {mensajeRecuperacion.texto}
                </p>
              </div>
            )}

            <form onSubmit={handleRecuperarPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={emailRecuperacion}
                    onChange={(e) => setEmailRecuperacion(e.target.value)}
                    placeholder="tu@bancodealimentosperu.org"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#80c398' } as any}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarRecuperar(false);
                    setEmailRecuperacion('');
                    setMensajeRecuperacion(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="flex-1 px-4 py-3 rounded-xl text-white font-medium disabled:opacity-50"
                  style={{ backgroundColor: '#80c398' }}
                >
                  {enviando ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando...
                    </span>
                  ) : (
                    'Enviar Correo'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}