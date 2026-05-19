// =============================================
// PÁGINA: RECUPERAR CONTRASEÑA
// Sistema de Gestión de Tickets - Banco de Alimentos Perú
// =============================================

import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { 
  Lock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';

export default function RecuperarPasswordPage() {
  const navigate = useNavigate();
  
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [verPasswordNuevo, setVerPasswordNuevo] = useState(false);
  const [verPasswordConfirmar, setVerPasswordConfirmar] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Verificar sesión de recuperación
  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          setError('El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo.');
        } else {
          // Verificar que es una sesión de recuperación
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            setError('No se pudo verificar tu identidad. Solicita un nuevo enlace de recuperación.');
          }
        }
      } catch (err) {
        setError('Error al verificar el enlace. Solicita uno nuevo.');
      }
      
      setCargando(false);
    };
    
    verificarSesion();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);

    // Validaciones
    if (passwordNuevo.length < 6) {
      setMensaje({ tipo: 'error', texto: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    if (passwordNuevo !== passwordConfirmar) {
      setMensaje({ tipo: 'error', texto: 'Las contraseñas no coinciden' });
      return;
    }

    setGuardando(true);

    try {
      // Actualizar contraseña
      const { error } = await supabase.auth.updateUser({
        password: passwordNuevo
      });

      if (error) {
        console.error('Error actualizando contraseña:', error);
        throw new Error(error.message);
      }

      // Verificar que se actualizó correctamente
      const {  data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('No se pudo verificar la actualización');
      }

      setMensaje({ 
        tipo: 'success', 
        texto: '✅ Contraseña actualizada correctamente. Serás redirigido al login...' 
      });

      // Cerrar sesión y redirigir al login después de 3 segundos
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login', { 
          state: { 
            mensaje: 'Tu contraseña fue actualizada. Ahora puedes ingresar con tu nueva contraseña.' 
          } 
        });
      }, 3000);

    } catch (error: any) {
      console.error('Error actualizando contraseña:', error);
      setMensaje({ 
        tipo: 'error', 
        texto: `❌ Error: ${error.message || 'Error al actualizar la contraseña. Intenta de nuevo.'}` 
      });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: '#80c398' }} />
          <p className="text-gray-600">Verificando enlace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Enlace Inválido o Expirado</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            ℹ️ Los enlaces de recuperación expiran después de 24 horas o después de usarse una vez.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 px-4 rounded-xl text-white font-medium mb-3"
            style={{ backgroundColor: '#80c398' }}
          >
            Volver al Login
          </button>
          <button
            onClick={() => navigate('/login', { state: { mostrarRecuperar: true } })}
            className="w-full py-3 px-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Solicitar Nuevo Enlace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <Key className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Nueva Contraseña
          </h2>
          <p className="text-gray-500">
            Ingresa tu nueva contraseña
          </p>
        </div>

        {mensaje && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-2 ${
            mensaje.tipo === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {mensaje.tipo === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${
              mensaje.tipo === 'success' ? 'text-green-700' : 'text-red-700'
            }`}>
              {mensaje.texto}
            </p>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-5">
          {/* Nueva Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nueva Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={verPasswordNuevo ? 'text' : 'password'}
                value={passwordNuevo}
                onChange={(e) => setPasswordNuevo(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-12 pr-12 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:outline-none"
                style={{ '--tw-ring-color': '#80c398' } as any}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setVerPasswordNuevo(!verPasswordNuevo)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {verPasswordNuevo ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirmar Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={verPasswordConfirmar ? 'text' : 'password'}
                value={passwordConfirmar}
                onChange={(e) => setPasswordConfirmar(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:outline-none"
                style={{ '--tw-ring-color': '#80c398' } as any}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setVerPasswordConfirmar(!verPasswordConfirmar)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {verPasswordConfirmar ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Información importante */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-700">
              ℹ️ <strong>Importante:</strong> Este enlace solo se puede usar una vez por seguridad. 
              Después de cambiar tu contraseña, el enlace expirará automáticamente.
            </p>
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={guardando}
            className="w-full py-3.5 px-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#80c398' }}
            onMouseEnter={(e) => !guardando && (e.currentTarget.style.backgroundColor = '#6ab088')}
            onMouseLeave={(e) => !guardando && (e.currentTarget.style.backgroundColor = '#80c398')}
          >
            {guardando ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Actualizar Contraseña
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}