// =============================================
// PÁGINA: MI PERFIL - ✅ CON ACTUALIZACIÓN INMEDIATA
// Sistema de Gestión de Tickets - Banco de Alimentos Perú
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabaseClient';
import { 
  ArrowLeft, User, Mail, Phone, MapPin, Lock, Save, X, Camera,
  AlertCircle, CheckCircle, Loader2, Eye, EyeOff
} from 'lucide-react';

// Áreas oficiales de la organización
const AREAS_OFICIALES = [
  'Logística y Calidad',
  'Sistemas y Procesos',
  'Gestión Social',
  'Administración',
  'Estrategias y Alianzas',
  'Fundraising',
  'Proyectos'
];

// Dominios de correo permitidos
const DOMINIOS_PERMITIDOS = [
  'bancodealimentosperu.org'
];

export default function PerfilPage() {
  const navigate = useNavigate();
  const { usuarioActual, actualizarUsuario } = useAuthStore();
  
  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [area, setArea] = useState('');
  const [telefono, setTelefono] = useState('');
  const [avatar, setAvatar] = useState('');
  
  // Estados para contraseña
  const [cambiarPassword, setCambiarPassword] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [verPasswordActual, setVerPasswordActual] = useState(false);
  const [verPasswordNuevo, setVerPasswordNuevo] = useState(false);
  const [verPasswordConfirmar, setVerPasswordConfirmar] = useState(false);
  
  // Estados de UI
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [imageKey, setImageKey] = useState(0);
  
  // ✅ ESTADOS DE VALIDACIÓN POR CAMPO
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Cargar datos actuales al montar
  useEffect(() => {
    if (usuarioActual) {
      setNombre(usuarioActual.nombre || '');
      setApellidos(usuarioActual.apellidos || '');
      setCorreo(usuarioActual.correo || '');
      setArea(usuarioActual.area || '');
      setTelefono(usuarioActual.telefono || '');
      setAvatar(usuarioActual.avatar || '');
      setAvatarPreview(usuarioActual.avatar || getDefaultAvatar(usuarioActual.nombre, usuarioActual.apellidos));
      setImageKey(prev => prev + 1);
      
      // ✅ LIMPIAR ERRORES AL CARGAR DATOS
      setErrores({});
      setMensaje(null);
    }
  }, [usuarioActual]);

  const getDefaultAvatar = (nombre: string, apellidos: string) => {
    const nombreCompleto = `${nombre || ''} ${apellidos || ''}`.trim();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCompleto)}&background=80c398&color=fff&size=256`;
  };

  // =============================================
  // ✅ FUNCIONES DE VALIDACIÓN
  // =============================================
  
  const validarNombre = (valor: string): string => {
    if (!valor.trim()) return 'El nombre es obligatorio';
    if (valor.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
    if (valor.trim().length > 50) return 'El nombre no puede exceder 50 caracteres';
    if (!/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/.test(valor.trim())) return 'El nombre solo puede contener letras';
    return '';
  };

  const validarApellidos = (valor: string): string => {
    if (!valor.trim()) return 'Los apellidos son obligatorios';
    if (valor.trim().length < 2) return 'Los apellidos deben tener al menos 2 caracteres';
    if (valor.trim().length > 100) return 'Los apellidos no pueden exceder 100 caracteres';
    if (!/^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/.test(valor.trim())) return 'Los apellidos solo pueden contener letras';
    return '';
  };

  const validarCorreo = (valor: string): string => {
    if (!valor.trim()) return 'El correo es obligatorio';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(valor.trim())) return 'Formato de correo inválido';
    
    const dominio = valor.trim().split('@')[1]?.toLowerCase();
    if (!DOMINIOS_PERMITIDOS.includes(dominio)) {
      return `El correo debe terminar en: ${DOMINIOS_PERMITIDOS.join(', ')}`;
    }
    
    return '';
  };

  const validarArea = (valor: string): string => {
    if (!valor.trim()) return 'Debe seleccionar un área';
    if (!AREAS_OFICIALES.includes(valor)) return 'El área seleccionada no es válida';
    return '';
  };

  const validarTelefono = (valor: string): string => {
    if (!valor.trim()) return ''; // Opcional
    const telefonoLimpio = valor.replace(/[\s\-\(\)]/g, '');
    if (!/^\+?51?9\d{8}$/.test(telefonoLimpio)) {
      return 'Formato inválido. Use: +51 999 999 999';
    }
    return '';
  };

  // ✅ VALIDAR CAMPO INDIVIDUAL AL SALIR DEL INPUT
  const handleBlur = (campo: string, valor: string) => {
    let error = '';
    
    switch (campo) {
      case 'nombre':
        error = validarNombre(valor);
        break;
      case 'apellidos':
        error = validarApellidos(valor);
        break;
      case 'correo':
        error = validarCorreo(valor);
        break;
      case 'area':
        error = validarArea(valor);
        break;
      case 'telefono':
        error = validarTelefono(valor);
        break;
    }
    
    setErrores(prev => {
      const nuevosErrores = { ...prev };
      if (error) {
        nuevosErrores[campo] = error;
      } else {
        delete nuevosErrores[campo];
      }
      return nuevosErrores;
    });
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);
    
    // ✅ VALIDAR TODOS LOS CAMPOS
    const nuevosErrores: Record<string, string> = {};
    
    const errorNombre = validarNombre(nombre);
    if (errorNombre) nuevosErrores.nombre = errorNombre;
    
    const errorApellidos = validarApellidos(apellidos);
    if (errorApellidos) nuevosErrores.apellidos = errorApellidos;
    
    const errorCorreo = validarCorreo(correo);
    if (errorCorreo) nuevosErrores.correo = errorCorreo;
    
    const errorArea = validarArea(area);
    if (errorArea) nuevosErrores.area = errorArea;
    
    const errorTelefono = validarTelefono(telefono);
    if (errorTelefono) nuevosErrores.telefono = errorTelefono;
    
    setErrores(nuevosErrores);
    
    // ✅ SI HAY ERRORES, MOSTRAR MENSAJE ESPECÍFICO
    if (Object.keys(nuevosErrores).length > 0) {
      const camposConError = Object.keys(nuevosErrores).map(campo => {
        switch (campo) {
          case 'nombre': return 'Nombre';
          case 'apellidos': return 'Apellidos';
          case 'correo': return 'Correo';
          case 'area': return 'Área';
          case 'telefono': return 'Teléfono';
          default: return campo;
        }
      });
      
      setMensaje({ 
        tipo: 'error', 
        texto: `❌ Errores en: ${camposConError.join(', ')}. Revise los campos marcados en rojo.` 
      });
      
      // Scroll al primer error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setGuardando(true);

    try {
      if (!usuarioActual) throw new Error('Usuario no autenticado');

      // ✅ 1. Generar nuevo avatar con el nombre actualizado
      const nuevoAvatar = getDefaultAvatar(nombre, apellidos);

      // ✅ 2. Actualizar en BD con .select() para obtener datos actualizados
      const { data, error } = await supabase
        .from('users')
        .update({
          nombre: nombre.trim(),
          apellidos: apellidos.trim(),
          correo: correo.trim().toLowerCase(),
          area: area.trim(),
          telefono: telefono.trim(),
          avatar: nuevoAvatar,  // ← Usar el nuevo avatar generado
          fecha_modificacion: new Date().toISOString()
        })
        .eq('id', usuarioActual.id)
        .select()
        .single();

      if (error) throw error;

      // ✅ 3. Actualizar store CON LOS DATOS NUEVOS
      if (data) {
        await actualizarUsuario(usuarioActual.id, {
          ...data
        });
        
        // ✅ 4. Actualizar avatarPreview inmediatamente
        setAvatarPreview(nuevoAvatar);
        setImageKey(prev => prev + 1);  // ← Forzar refresh de la imagen
        
        // ✅ 5. Forzar actualización del store global de auth
        useAuthStore.setState((state) => ({
          usuarioActual: {
            ...state.usuarioActual,
            ...data,
            avatar: nuevoAvatar
          }
        }));
      }

      setMensaje({ tipo: 'success', texto: '✅ Perfil actualizado correctamente' });
      
      // ✅ 6. Forzar recarga COMPLETA después de 1.5 segundos
      // Esto asegura que el Super Admin vea los cambios inmediatamente
      setTimeout(() => {
        window.location.reload();  // ← Recarga completa de toda la app
      }, 1500);

    } catch (error: any) {
      console.error('Error guardando perfil:', error);
      setMensaje({ tipo: 'error', texto: `❌ Error: ${error.message}` });
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);

    if (passwordNuevo.length < 6) {
      setMensaje({ tipo: 'error', texto: '❌ La nueva contraseña debe tener al menos 6 caracteres' });
      setGuardando(false);
      return;
    }

    if (passwordNuevo !== passwordConfirmar) {
      setMensaje({ tipo: 'error', texto: '❌ Las contraseñas no coinciden' });
      setGuardando(false);
      return;
    }

    try {
      if (!usuarioActual) throw new Error('Usuario no autenticado');

      const { error: authError } = await supabase.auth.updateUser({
        password: passwordNuevo
      });

      if (authError) throw authError;

      setMensaje({ tipo: 'success', texto: '✅ Contraseña actualizada correctamente. Usa tu nueva contraseña para ingresar.' });
      
      setPasswordActual('');
      setPasswordNuevo('');
      setPasswordConfirmar('');
      setCambiarPassword(false);

    } catch (error: any) {
      console.error('Error cambiando contraseña:', error);
      setMensaje({ tipo: 'error', texto: `❌ Error: ${error.message}` });
    } finally {
      setGuardando(false);
    }
  };

  const handleSubirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !usuarioActual) return;

    if (!file.type.startsWith('image/')) {
      setMensaje({ tipo: 'error', texto: '❌ Solo se permiten imágenes' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMensaje({ tipo: 'error', texto: '❌ La imagen no debe superar los 5MB' });
      return;
    }

    setSubiendoFoto(true);
    setMensaje(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${usuarioActual.id}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('tickets-archivos')
        .upload(`avatars/${fileName}`, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('tickets-archivos')
        .getPublicUrl(`avatars/${fileName}`);
      
      const publicUrlWithCache = `${publicUrl}?t=${Date.now()}`;

      const { error: dbError } = await supabase
        .from('users')
        .update({ avatar: publicUrlWithCache })
        .eq('id', usuarioActual.id);

      if (dbError) throw dbError;

      await actualizarUsuario(usuarioActual.id, {
        avatar: publicUrlWithCache
      });

      setAvatarPreview(publicUrlWithCache);
      setAvatar(publicUrlWithCache);
      setImageKey(prev => prev + 1);
      
      setMensaje({ tipo: 'success', texto: '✅ Foto actualizada correctamente' });

    } catch (error: any) {
      console.error('Error subiendo foto:', error);
      setMensaje({ tipo: 'error', texto: `❌ Error subiendo foto: ${error.message}` });
    } finally {
      setSubiendoFoto(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Volver"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>
            <p className="text-gray-500 mt-1">Gestiona tu información personal y contraseña</p>
          </div>
        </div>

      {/* ✅ MENSAJE PRINCIPAL DE ERROR/ÉXITO */}
      {mensaje && (
        <div className={`p-4 rounded-lg flex items-start gap-2 ${
          mensaje.tipo === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {mensaje.tipo === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          )}
          <p className={mensaje.tipo === 'success' ? 'text-green-700' : 'text-red-700'}>
            {mensaje.texto}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Foto de perfil */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Foto de Perfil
          </h2>
          
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              {subiendoFoto && (
                <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center z-10">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#80c398' }} />
                </div>
              )}
              <img
                key={imageKey}
                src={avatarPreview}
                alt="Perfil"
                className="w-32 h-32 rounded-full object-cover border-4"
                style={{ borderColor: '#80c398' }}
                onError={(e) => {
                  const defaultAvatar = getDefaultAvatar(nombre, apellidos);
                  (e.target as HTMLImageElement).src = defaultAvatar;
                }}
              />
              <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <Camera className="w-5 h-5" style={{ color: '#80c398' }} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSubirFoto}
                  className="hidden"
                  disabled={guardando || subiendoFoto}
                />
              </label>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Haz clic en la cámara para subir una nueva foto
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PNG, JPG hasta 5MB
            </p>
          </div>
        </div>

        {/* Columna derecha - Formulario */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Información Personal
          </h2>

          <form onSubmit={handleGuardar} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombres *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    onBlur={(e) => handleBlur('nombre', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none ${
                      errores.nombre ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-emerald-200'
                    }`}
                    placeholder="Ej: Juan Carlos"
                    required
                  />
                </div>
                {errores.nombre && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errores.nombre}
                  </p>
                )}
              </div>

              {/* Apellidos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellidos *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    onBlur={(e) => handleBlur('apellidos', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none ${
                      errores.apellidos ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-emerald-200'
                    }`}
                    placeholder="Ej: Pérez López"
                    required
                  />
                </div>
                {errores.apellidos && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errores.apellidos}
                  </p>
                )}
              </div>

              {/* Correo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    onBlur={(e) => handleBlur('correo', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none ${
                      errores.correo ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-emerald-200'
                    }`}
                    placeholder="usuario@bancodealimentosperu.org"
                    required
                  />
                </div>
                {errores.correo && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errores.correo}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  💡 Debe usar correo corporativo
                </p>
              </div>

              {/* ✅ Área - DROPDOWN SIN OPCION "SELECCIONAR" */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Área *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    onBlur={(e) => handleBlur('area', e.target.value)}
                    className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:outline-none bg-white appearance-none ${
                      errores.area ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-emerald-200'
                    }`}
                    style={{ 
                      '--tw-ring-color': errores.area ? '#fecaca' : '#80c398',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      appearance: 'none'
                    } as any}
                    required
                  >
                    {!area && <option value="" disabled>Seleccionar área...</option>}
                    {AREAS_OFICIALES.map(areaItem => (
                      <option key={areaItem} value={areaItem}>{areaItem}</option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {errores.area && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errores.area}
                  </p>
                )}
              </div>

              {/* Teléfono */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Teléfono <span className="text-gray-400">(opcional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    onBlur={(e) => handleBlur('telefono', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none ${
                      errores.telefono ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-emerald-200'
                    }`}
                    placeholder="+51 999 999 999"
                  />
                </div>
                {errores.telefono && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errores.telefono}
                  </p>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando || Object.keys(errores).length > 0}
                className="flex-1 px-4 py-2.5 rounded-lg text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: '#80c398' }}
                onMouseEnter={(e) => !guardando && Object.keys(errores).length === 0 && (e.currentTarget.style.backgroundColor = '#6ab088')}
                onMouseLeave={(e) => !guardando && (e.currentTarget.style.backgroundColor = '#80c398')}
              >
                {guardando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Sección de Cambiar Contraseña */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Seguridad
          </h2>
          {!cambiarPassword && (
            <button
              onClick={() => setCambiarPassword(true)}
              className="text-sm font-medium"
              style={{ color: '#ea4c5b' }}
            >
              Cambiar Contraseña
            </button>
          )}
        </div>

        {cambiarPassword && (
          <form onSubmit={handleCambiarPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={verPasswordActual ? 'text' : 'password'}
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                  style={{ '--tw-ring-color': '#80c398' } as any}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setVerPasswordActual(!verPasswordActual)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {verPasswordActual ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={verPasswordNuevo ? 'text' : 'password'}
                    value={passwordNuevo}
                    onChange={(e) => setPasswordNuevo(e.target.value)}
                    className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#80c398' } as any}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setVerPasswordNuevo(!verPasswordNuevo)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {verPasswordNuevo ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={verPasswordConfirmar ? 'text' : 'password'}
                    value={passwordConfirmar}
                    onChange={(e) => setPasswordConfirmar(e.target.value)}
                    className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': '#80c398' } as any}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setVerPasswordConfirmar(!verPasswordConfirmar)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {verPasswordConfirmar ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setCambiarPassword(false);
                  setPasswordActual('');
                  setPasswordNuevo('');
                  setPasswordConfirmar('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 px-4 py-2.5 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: '#ea4c5b' }}
                onMouseEnter={(e) => !guardando && (e.currentTarget.style.backgroundColor = '#d93a4a')}
                onMouseLeave={(e) => !guardando && (e.currentTarget.style.backgroundColor = '#ea4c5b')}
              >
                {guardando ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Actualizando...
                  </span>
                ) : (
                  'Actualizar Contraseña'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}