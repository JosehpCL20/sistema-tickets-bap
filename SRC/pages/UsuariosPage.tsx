// =============================================
// PÁGINA DE GESTIÓN DE USUARIOS - ✅ CON VALIDACIONES COMPLETAS Y REAL-TIME
// Para: Super Admin y Administrador
// Sistema de Gestión de Tickets - Banco de Alimentos Perú
// =============================================

import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabaseClient';
import type { UserRole } from '../types';
import { 
  ArrowLeft, Search, Filter, UserPlus, Edit2, Trash2, X, Save,
  CheckCircle, XCircle, Shield, Loader2, RefreshCw,
  Mail, Phone, Building2, AlertTriangle, AlertCircle
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
  'bancodealimentosperu.org',
];

export default function UsuariosPage() {
  const { 
    usuarioActual, 
    usuarios, 
    actualizarUsuario,
    cargarUsuarios // ✅ Función para recargar usuarios del store
  } = useAuthStore();
  
  const navigate = useNavigate();
  
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState<UserRole | ''>('');
  const [filtroArea, setFiltroArea] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<any>(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null);
  const [mostrarConfirmarEliminar, setMostrarConfirmarEliminar] = useState<any>(null);
  
  // ✅ ESTADOS DE VALIDACIÓN POR CAMPO
  const [errores, setErrores] = useState<Record<string, string>>({});

  // =============================================
  // ✅ VALIDACIÓN DE ACCESO - SOLO SUPERADMIN Y ADMINISTRADOR
  // =============================================
  useEffect(() => {
    const rolesPermitidos = ['superadmin', 'administrador'];
    if (usuarioActual && !rolesPermitidos.includes(usuarioActual.rol)) {
      navigate('/dashboard', { replace: true });
    }
  }, [usuarioActual, navigate]);

  // Si no es admin/superadmin, no renderizar nada
  if (usuarioActual && !['superadmin', 'administrador'].includes(usuarioActual.rol)) {
    return null;
  }

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

  const validarCorreo = (valor: string, idUsuario?: string): string => {
    if (!valor.trim()) return 'El correo es obligatorio';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(valor.trim())) return 'Formato de correo inválido';
    
    // Validar dominio permitido
    const dominio = valor.trim().split('@')[1]?.toLowerCase();
    if (!DOMINIOS_PERMITIDOS.includes(dominio)) {
      return `El correo debe pertenecer a: ${DOMINIOS_PERMITIDOS.join(', ')}`;
    }
    
    // Verificar que no exista otro usuario con el mismo correo
    const correoExiste = usuarios.some(u => 
      u.correo.toLowerCase() === valor.trim().toLowerCase() && 
      u.id !== idUsuario
    );
    if (correoExiste) return 'Este correo ya está registrado';
    
    return '';
  };

  const validarArea = (valor: string): string => {
    if (!valor.trim()) return 'El área es obligatoria';
    if (!AREAS_OFICIALES.includes(valor)) return 'Debe seleccionar un área válida';
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

  const validarRol = (valor: string): string => {
    if (!valor) return 'El rol es obligatorio';
    const rolesValidos = ['usuario', 'tecnico', 'supervisor', 'administrador', 'superadmin'];
    if (!rolesValidos.includes(valor)) return 'El rol seleccionado no es válido';
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
        error = validarCorreo(valor, usuarioEditando?.id);
        break;
      case 'area':
        error = validarArea(valor);
        break;
      case 'telefono':
        error = validarTelefono(valor);
        break;
      case 'rol':
        error = validarRol(valor);
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

  // Filtrar usuarios
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((usuario: any) => {
      if (busqueda) {
        const termino = busqueda.toLowerCase();
        const nombreCompleto = `${usuario.nombre} ${usuario.apellidos || ''}`.toLowerCase();
        const correo = usuario.correo?.toLowerCase() || '';
        if (!nombreCompleto.includes(termino) && !correo.includes(termino)) {
          return false;
        }
      }
      if (filtroRol && usuario.rol?.toLowerCase() !== filtroRol.toLowerCase()) {
        return false;
      }
      if (filtroArea && usuario.area !== filtroArea) {
        return false;
      }
      return true;
    });
  }, [usuarios, busqueda, filtroRol, filtroArea]);

  const coloresRol: Record<string, string> = {
    superadmin: 'bg-purple-100 text-purple-700',
    administrador: 'bg-red-100 text-red-700',
    supervisor: 'bg-cyan-100 text-cyan-700',
    tecnico: 'bg-blue-100 text-blue-700',
    usuario: 'bg-gray-100 text-gray-700'
  };

  const nombresRol: Record<string, string> = {
    superadmin: 'Super Admin',
    administrador: 'Administrador',
    supervisor: 'Supervisor',
    tecnico: 'Técnico',
    usuario: 'Usuario'
  };

  const handleAbrirModal = (usuario?: any) => {
    if (usuario) {
      setUsuarioEditando({ ...usuario });
    } else {
      setUsuarioEditando({
        id: crypto.randomUUID(),
        nombre: '',
        apellidos: '',
        correo: '',
        rol: 'usuario',
        area: '',
        telefono: '',
        avatar: '',
        activo: true
      });
    }
    setErrores({});
    setMensaje(null);
    setMostrarModal(true);
  };

  const handleGuardar = async () => {
    if (!usuarioEditando) return;
    
    setGuardando(true);
    setMensaje(null);
    
    // ✅ VALIDAR TODOS LOS CAMPOS
    const nuevosErrores: Record<string, string> = {};
    
    const errorNombre = validarNombre(usuarioEditando.nombre);
    if (errorNombre) nuevosErrores.nombre = errorNombre;
    
    const errorApellidos = validarApellidos(usuarioEditando.apellidos);
    if (errorApellidos) nuevosErrores.apellidos = errorApellidos;
    
    const errorCorreo = validarCorreo(usuarioEditando.correo, usuarioEditando.id);
    if (errorCorreo) nuevosErrores.correo = errorCorreo;
    
    const errorArea = validarArea(usuarioEditando.area);
    if (errorArea) nuevosErrores.area = errorArea;
    
    const errorTelefono = validarTelefono(usuarioEditando.telefono);
    if (errorTelefono) nuevosErrores.telefono = errorTelefono;
    
    const errorRol = validarRol(usuarioEditando.rol);
    if (errorRol) nuevosErrores.rol = errorRol;
    
    setErrores(nuevosErrores);
    
    // ✅ SI HAY ERRORES, NO GUARDAR
    if (Object.keys(nuevosErrores).length > 0) {
      const camposConError = Object.keys(nuevosErrores).map(campo => {
        switch (campo) {
          case 'nombre': return 'Nombre';
          case 'apellidos': return 'Apellidos';
          case 'correo': return 'Correo';
          case 'area': return 'Área';
          case 'telefono': return 'Teléfono';
          case 'rol': return 'Rol';
          default: return campo;
        }
      });
      
      setMensaje({ 
        tipo: 'error', 
        texto: `❌ Errores en: ${camposConError.join(', ')}. Revise los campos marcados.` 
      });
      setGuardando(false);
      return;
    }
    
    try {
      // Generar avatar si no existe
      if (!usuarioEditando.avatar && usuarioEditando.nombre) {
        usuarioEditando.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(usuarioEditando.nombre)}&background=80c398&color=fff&size=256`;
      }

      // Verificar si es usuario existente
      const usuarioExistente = usuarios.find((u: any) => u.id === usuarioEditando.id);

      if (usuarioExistente) {
        // === ACTUALIZAR USUARIO EXISTENTE ===
        await actualizarUsuario(usuarioEditando.id, {
          nombre: usuarioEditando.nombre.trim(),
          apellidos: usuarioEditando.apellidos?.trim() || '',
          correo: usuarioEditando.correo.trim().toLowerCase(),
          rol: usuarioEditando.rol,
          area: usuarioEditando.area,
          telefono: usuarioEditando.telefono || '',
          activo: usuarioEditando.activo,
          avatar: usuarioEditando.avatar
        });

        await supabase
          .from('users')
          .update({
            nombre: usuarioEditando.nombre.trim(),
            apellidos: usuarioEditando.apellidos?.trim() || '',
            correo: usuarioEditando.correo.trim().toLowerCase(),
            rol: usuarioEditando.rol,
            area: usuarioEditando.area,
            telefono: usuarioEditando.telefono || '',
            activo: usuarioEditando.activo,
            avatar: usuarioEditando.avatar
          })
          .eq('id', usuarioEditando.id);

        setMensaje({ tipo: 'success', texto: '✅ Usuario actualizado correctamente' });
      } else {
        // === CREAR NUEVO USUARIO ===
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: usuarioEditando.correo.trim().toLowerCase(),
          password: 'demo1234',
          options: {
            data: {
              nombre: usuarioEditando.nombre.trim(),
              apellidos: usuarioEditando.apellidos?.trim() || '',
              rol: usuarioEditando.rol || 'usuario',
              area: usuarioEditando.area || '',
              telefono: usuarioEditando.telefono || '',
              avatar: usuarioEditando.avatar
            },
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        });

        if (authError) throw authError;
        if (!authData?.user) throw new Error('No se pudo crear el usuario en Authentication');

        await new Promise(resolve => setTimeout(resolve, 1500));

        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (userData) {
          useAuthStore.setState((state: any) => ({
            usuarios: [...state.usuarios, userData]
          }));
        }

        setMensaje({ 
          tipo: 'success', 
          texto: `✅ Usuario creado. Email: ${usuarioEditando.correo} | Contraseña: demo1234` 
        });
      }
      
      setTimeout(() => {
        setMostrarModal(false);
        setUsuarioEditando(null);
        setMensaje(null);
        setErrores({});
      }, 2000);
      
    } catch (error: any) {
      console.error('Error guardando usuario:', error);
      setMensaje({ tipo: 'error', texto: `❌ Error: ${error.message || 'Error al guardar'}` });
    } finally {
      setGuardando(false);
    }
  };

  const toggleActivo = async (usuario: any) => {
    try {
      await supabase
        .from('users')
        .update({ activo: !usuario.activo })
        .eq('id', usuario.id);
      actualizarUsuario(usuario.id, { activo: !usuario.activo });
      setMensaje({ tipo: 'success', texto: `✅ Usuario ${usuario.activo ? 'desactivado' : 'activado'} correctamente` });
      setTimeout(() => setMensaje(null), 3000);
    } catch (error) {
      console.error('Error actualizando estado:', error);
      setMensaje({ tipo: 'error', texto: 'Error al actualizar estado' });
    }
  };

  const handleEliminar = async (usuario: any) => {
    setEliminando(usuario.id);
    setMensaje(null);

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', usuario.id);

      if (error) throw error;

      useAuthStore.setState((state: any) => ({
        usuarios: state.usuarios.filter((u: any) => u.id !== usuario.id)
      }));

      setMensaje({ tipo: 'success', texto: `✅ Usuario ${usuario.nombre} eliminado` });
      setMostrarConfirmarEliminar(null);

    } catch (error: any) {
      console.error('Error eliminando usuario:', error);
      setMensaje({ tipo: 'error', texto: `❌ Error: ${error.message}` });
    } finally {
      setEliminando(null);
    }
  };

  // =============================================
  // ✅ SUSCRIPCIÓN EN TIEMPO REAL - ACTUALIZACIÓN AUTOMÁTICA
  // =============================================
  useEffect(() => {
    // Suscribirse a cambios en la tabla users
    const channel = supabase
      .channel('users_changes_realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users'
        },
        (payload) => {
          console.log('🔄 Usuario actualizado en tiempo real:', payload.new);
          // Recargar lista de usuarios cuando alguien actualiza su perfil
          if (cargarUsuarios) {
            cargarUsuarios();
          }
        }
      )
      .subscribe();

    // Limpiar suscripción al desmontar
    return () => {
      supabase.removeChannel(channel);
    };
  }, [cargarUsuarios]);

  // Estadísticas
  const totalUsuarios = usuarios.length;
  const usuariosActivos = usuarios.filter((u: any) => u.activo).length;
  const porRol = {
    superadmin: usuarios.filter((u: any) => u.rol === 'superadmin').length,
    administrador: usuarios.filter((u: any) => u.rol === 'administrador').length,
    supervisor: usuarios.filter((u: any) => u.rol === 'supervisor').length,
    tecnico: usuarios.filter((u: any) => u.rol === 'tecnico').length,
    usuario: usuarios.filter((u: any) => u.rol === 'usuario').length
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Volver"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
            <p className="text-gray-500 mt-1">Administra los usuarios del sistema</p>
          </div>
        </div>
        {usuarioActual?.rol === 'superadmin' && (
          <button
            onClick={() => handleAbrirModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium transition-colors"
            style={{ backgroundColor: '#80c398' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6ab088'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#80c398'}
          >
            <UserPlus className="w-5 h-5" />
            Nuevo Usuario
          </button>
        )}
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`p-4 rounded-xl flex items-start gap-2 ${
          mensaje.tipo === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {mensaje.tipo === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          )}
          <p className={mensaje.tipo === 'success' ? 'text-green-700' : 'text-red-700'}>{mensaje.texto}</p>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-800">{totalUsuarios}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Activos</p>
          <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>{usuariosActivos}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Super Admin</p>
          <p className="text-2xl font-bold" style={{ color: '#a855f7' }}>{porRol.superadmin}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Admins</p>
          <p className="text-2xl font-bold" style={{ color: '#ea4c5b' }}>{porRol.administrador}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Supervisores</p>
          <p className="text-2xl font-bold" style={{ color: '#06b6d4' }}>{porRol.supervisor}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
              style={{ '--tw-ring-color': '#80c398' } as any}
            />
          </div>
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value as UserRole | '')}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none bg-white"
            style={{ '--tw-ring-color': '#80c398' } as any}
          >
            <option value="">Todos los roles</option>
            <option value="superadmin">Super Admin</option>
            <option value="administrador">Administrador</option>
            <option value="supervisor">Supervisor</option>
            <option value="tecnico">Técnico</option>
            <option value="usuario">Usuario</option>
          </select>
          <select
            value={filtroArea}
            onChange={(e) => setFiltroArea(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none bg-white"
            style={{ '--tw-ring-color': '#80c398' } as any}
          >
            <option value="">Todas las áreas</option>
            {AREAS_OFICIALES.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
          {/* Botón de recarga manual */}
          <button
            onClick={() => cargarUsuarios?.()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Recargar lista"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200" style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Usuario</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Rol</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Área</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Estado</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuariosFiltrados.map((usuario: any) => (
                <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={usuario.avatar} alt={usuario.nombre} className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario.nombre)}&background=80c398&color=fff`; }} />
                      <div>
                        <p className="font-medium text-gray-800">{usuario.nombre} {usuario.apellidos}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" />{usuario.correo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${coloresRol[usuario.rol] || coloresRol.usuario}`}>
                      {nombresRol[usuario.rol] || nombresRol.usuario}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1"><Building2 className="w-4 h-4 text-gray-400" />{usuario.area || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {usuario.activo ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 text-sm"><CheckCircle className="w-4 h-4" />Activo</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 text-sm"><XCircle className="w-4 h-4" />Inactivo</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleAbrirModal(usuario)} className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {usuarioActual?.rol === 'superadmin' && usuario.id !== usuarioActual?.id && (
                        <>
                          <button onClick={() => toggleActivo(usuario)} className={`p-1.5 rounded-lg transition-colors ${usuario.activo ? 'text-gray-500 hover:text-red-600 hover:bg-red-50' : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'}`} title={usuario.activo ? 'Desactivar' : 'Activar'}>
                            {usuario.activo ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => setMostrarConfirmarEliminar(usuario)} 
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                            title="Eliminar"
                            disabled={eliminando === usuario.id}
                          >
                            {eliminando === usuario.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {usuariosFiltrados.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No se encontraron usuarios con los filtros aplicados</p>
            <button onClick={() => { setBusqueda(''); setFiltroRol(''); setFiltroArea(''); }} className="mt-3 text-sm font-medium hover:underline" style={{ color: '#80c398' }}>Limpiar filtros</button>
          </div>
        )}
      </div>

      {/* Modal de edición/creación */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">{usuarioEditando?.id && usuarios.find((u: any) => u.id === usuarioEditando.id) ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                <button onClick={() => setMostrarModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
                <input 
                  type="text" 
                  value={usuarioEditando?.nombre || ''} 
                  onChange={(e) => setUsuarioEditando((prev: any) => prev ? { ...prev, nombre: e.target.value } : null)}
                  onBlur={(e) => handleBlur('nombre', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none ${
                    errores.nombre ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-emerald-200'
                  }`}
                  placeholder="Ej: Juan Carlos"
                />
                {errores.nombre && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errores.nombre}
                  </p>
                )}
              </div>
              
              {/* Apellidos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
                <input 
                  type="text" 
                  value={usuarioEditando?.apellidos || ''} 
                  onChange={(e) => setUsuarioEditando((prev: any) => prev ? { ...prev, apellidos: e.target.value } : null)}
                  onBlur={(e) => handleBlur('apellidos', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none ${
                    errores.apellidos ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-emerald-200'
                  }`}
                  placeholder="Ej: Pérez López"
                />
                {errores.apellidos && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errores.apellidos}
                  </p>
                )}
              </div>
              
              {/* Correo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="email" 
                    value={usuarioEditando?.correo || ''} 
                    onChange={(e) => setUsuarioEditando((prev: any) => prev ? { ...prev, correo: e.target.value } : null)}
                    onBlur={(e) => handleBlur('correo', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none ${
                      errores.correo ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-emerald-200'
                    }`}
                    placeholder="usuario@bancodealimentosperu.org"
                  />
                </div>
                {errores.correo && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errores.correo}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">💡 Debe usar correo institucional</p>
              </div>
              
              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono <span className="text-gray-400">(opcional)</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="tel" 
                    value={usuarioEditando?.telefono || ''} 
                    onChange={(e) => setUsuarioEditando((prev: any) => prev ? { ...prev, telefono: e.target.value } : null)}
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
              
              {/* Rol */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select 
                  value={usuarioEditando?.rol || 'usuario'} 
                  onChange={(e) => setUsuarioEditando((prev: any) => prev ? { ...prev, rol: e.target.value as UserRole } : null)}
                  onBlur={(e) => handleBlur('rol', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none bg-white ${
                    errores.rol ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-emerald-200'
                  }`}
                >
                  <option value="usuario">Usuario</option>
                  <option value="tecnico">Técnico</option>
                  {usuarioActual?.rol === 'superadmin' && (
                    <>
                      <option value="supervisor">Supervisor</option>
                      <option value="administrador">Administrador</option>
                      <option value="superadmin">Super Admin</option>
                    </>
                  )}
                </select>
                {errores.rol && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errores.rol}
                  </p>
                )}
              </div>
              
              {/* ✅ Área - DROPDOWN SIN OPCIÓN "SELECCIONAR" */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área *</label>
                <select 
                  value={usuarioEditando?.area || ''} 
                  onChange={(e) => setUsuarioEditando((prev: any) => prev ? { ...prev, area: e.target.value } : null)}
                  onBlur={(e) => handleBlur('area', e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none bg-white ${
                    errores.area ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-emerald-200'
                  }`}
                >
                  {!usuarioEditando?.area && <option value="" disabled>Seleccionar área...</option>}
                  {AREAS_OFICIALES.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                {errores.area && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errores.area}
                  </p>
                )}
              </div>
              
              {/* Activo */}
              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="activo" 
                  checked={usuarioEditando?.activo ?? true} 
                  onChange={(e) => setUsuarioEditando((prev: any) => prev ? { ...prev, activo: e.target.checked } : null)} 
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" 
                  style={{ accentColor: '#80c398' }} 
                />
                <label htmlFor="activo" className="text-sm text-gray-700">Usuario activo</label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button 
                onClick={() => setMostrarModal(false)} 
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleGuardar} 
                disabled={guardando || Object.keys(errores).length > 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium disabled:opacity-50 transition-colors"
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
                    Guardar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmar Eliminación */}
      {mostrarConfirmarEliminar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Eliminar Usuario</h3>
                  <p className="text-sm text-gray-500">¿Estás seguro de continuar?</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Se eliminará permanentemente a <strong>{mostrarConfirmarEliminar.nombre}</strong> ({mostrarConfirmarEliminar.correo}) del sistema.
              </p>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Esta acción eliminará al usuario de la base de datos. 
                  Para eliminarlo también de Authentication, hazlo manualmente desde: 
                  Supabase Dashboard → Authentication → Users
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setMostrarConfirmarEliminar(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={eliminando !== null}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleEliminar(mostrarConfirmarEliminar)}
                disabled={eliminando !== null}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium disabled:opacity-50 transition-colors"
                style={{ backgroundColor: '#ea4c5b' }}
                onMouseEnter={(e) => !eliminando && (e.currentTarget.style.backgroundColor = '#d93a4a')}
                onMouseLeave={(e) => !eliminando && (e.currentTarget.style.backgroundColor = '#ea4c5b')}
              >
                {eliminando === mostrarConfirmarEliminar.id ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}