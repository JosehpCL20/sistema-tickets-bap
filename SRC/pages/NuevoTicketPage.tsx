// =============================================
// PÁGINA: CREAR NUEVO TICKET - ✅ CON VALIDACIONES COMPLETAS
// Sistema de Gestión de Tickets - Banco de Alimentos Perú
// =============================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTicketStore } from '../store/ticketStore';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';

// Tipo para las categorías
interface CategoriaType {
  valor: string;
  label: string;
  icon: string;
  desc: string;
  subproblemas: string[];
}

export default function NuevoTicketPage() {
  const navigate = useNavigate();
  const { usuarioActual } = useAuthStore();
  const ticketStore = useTicketStore();
  
  const [titulo, setTitulo] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [categoria, setCategoria] = useState<string>('');
  const [subproblema, setSubproblema] = useState<string>('');
  const [prioridad, setPrioridad] = useState<string>('media');
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // ✅ ESTADOS DE VALIDACIÓN POR CAMPO
  const [errores, setErrores] = useState<Record<string, string>>({});

  const categorias: CategoriaType[] = [
    { 
      valor: 'Hardware', 
      label: 'Hardware', 
      icon: '💻',
      desc: 'Computadoras, laptops, periféricos',
      subproblemas: [
        'Computadora no enciende',
        'Pantalla azul / errores de sistema',
        'Computadora muy lenta',
        'Teclado o mouse no funciona',
        'Monitor no da imagen',
        'Ruido extraño en la PC',
        'Sobrecalentamiento',
        'Disco duro lleno',
        'Memoria RAM insuficiente',
        'Otro problema de hardware'
      ]
    },
    { 
      valor: 'Software', 
      label: 'Software', 
      icon: '🖥️',
      desc: 'Programas, aplicaciones, SAP',
      subproblemas: [
        'No puedo abrir SAP',
        'Error al ingresar a SAP',
        'SAP muy lento',
        'No puedo descargar reportes de SAP',
        'Error en módulo de SAP',
        'Excel no funciona correctamente',
        'Word/PowerPoint con errores',
        'Necesito instalar un programa',
        'Actualización de software',
        'Licencia de software vencida',
        'Programa se cierra inesperadamente',
        'Otro problema de software'
      ]
    },
    { 
      valor: 'Redes', 
      label: 'Redes', 
      icon: '🌐',
      desc: 'Internet, WiFi, conectividad',
      subproblemas: [
        'No tengo internet',
        'Internet muy lento',
        'WiFi no conecta',
        'Conexión intermitente',
        'No puedo acceder a la red interna',
        'VPN no funciona',
        'Cable de red dañado',
        'No puedo acceder a carpetas compartidas',
        'Problemas con el router',
        'Otro problema de red'
      ]
    },
    { 
      valor: 'Accesos', 
      label: 'Accesos', 
      icon: '🔐',
      desc: 'Contraseñas, permisos, usuarios',
      subproblemas: [
        'Olvidé mi contraseña',
        'Mi cuenta está bloqueada',
        'No tengo acceso a SAP',
        'Necesito permisos adicionales',
        'Error de autenticación',
        'Token de seguridad no funciona',
        'Acceso denegado a sistema',
        'Necesito crear usuario nuevo',
        'Cambiar correo electrónico',
        'Otro problema de acceso'
      ]
    },
    { 
      valor: 'Impresoras', 
      label: 'Impresoras', 
      icon: '🖨️',
      desc: 'Impresión, escáner, drivers',
      subproblemas: [
        'Impresora no imprime',
        'Impresión muy lenta',
        'Impresión borrosa o con rayas',
        'Atasco de papel',
        'No se detecta la impresora',
        'Error de driver de impresora',
        'Impresora sin tóner/tinta',
        'Escáner no funciona',
        'Configurar impresora en red',
        'Otro problema de impresora'
      ]
    },
    { 
      valor: 'Correo', 
      label: 'Correo', 
      icon: '📧',
      desc: 'Email, Outlook, webmail',
      subproblemas: [
        'No puedo enviar correos',
        'No recibo correos',
        'Outlook no funciona',
        'Buzón lleno',
        'Error al adjuntar archivos',
        'Correo va a spam',
        'No puedo acceder al webmail',
        'Configurar correo en celular',
        'Contraseña de correo olvidada',
        'Otro problema de correo'
      ]
    },
    { 
      valor: 'Reportes', 
      label: 'Reportes', 
      icon: '📊',
      desc: 'Descarga, generación, errores',
      subproblemas: [
        'No puedo descargar reportes',
        'Reporte sale en blanco',
        'Error al generar reporte',
        'Reporte con datos incorrectos',
        'Reporte muy lento',
        'No encuentro un reporte',
        'Necesito un reporte personalizado',
        'Exportar a Excel/PDF no funciona',
        'Filtros de reporte no funcionan',
        'Otro problema con reportes'
      ]
    },
    { 
      valor: 'Otros', 
      label: 'Otros', 
      icon: '📋',
      desc: 'Cualquier otro problema',
      subproblemas: [
        'Capacitación en sistema',
        'Solicitud de equipo nuevo',
        'Mantenimiento preventivo',
        'Consulta general',
        'Sugerencia de mejora',
        'Otro (especificar en descripción)'
      ]
    }
  ];

  const prioridades = [
    { valor: 'muy_baja', label: 'Muy Baja', color: 'bg-gray-100 text-gray-700 border-gray-300' },
    { valor: 'baja', label: 'Baja', color: 'bg-green-100 text-green-700 border-green-300' },
    { valor: 'media', label: 'Media', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { valor: 'alta', label: 'Alta', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    { valor: 'muy_alta', label: 'Muy Alta', color: 'bg-red-100 text-red-700 border-red-300' }
  ];

  // =============================================
  // ✅ FUNCIONES DE VALIDACIÓN
  // =============================================
  
  const validarTitulo = (valor: string): string => {
    if (!valor.trim()) return 'El título es obligatorio';
    if (valor.trim().length < 5) return 'El título debe tener al menos 5 caracteres';
    if (valor.trim().length > 150) return 'El título no puede exceder 150 caracteres';
    return '';
  };

  const validarDescripcion = (valor: string): string => {
    if (!valor.trim()) return 'La descripción es obligatoria';
    if (valor.trim().length < 10) return 'La descripción debe tener al menos 10 caracteres';
    if (valor.trim().length > 2000) return 'La descripción no puede exceder 2000 caracteres';
    return '';
  };

  const validarCategoria = (valor: string): string => {
    if (!valor) return 'Debes seleccionar una categoría';
    return '';
  };

  const validarSubproblema = (valor: string): string => {
    if (!valor) return 'Debes seleccionar el problema específico';
    return '';
  };

  // ✅ VALIDAR CAMPO INDIVIDUAL AL SALIR DEL INPUT
  const handleBlur = (campo: string, valor: string) => {
    let error = '';
    
    switch (campo) {
      case 'titulo':
        error = validarTitulo(valor);
        break;
      case 'descripcion':
        error = validarDescripcion(valor);
        break;
      case 'categoria':
        error = validarCategoria(valor);
        break;
      case 'subproblema':
        error = validarSubproblema(valor);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMensaje(null);

    // ✅ VALIDAR TODOS LOS CAMPOS
    const nuevosErrores: Record<string, string> = {};
    
    const errorTitulo = validarTitulo(titulo);
    if (errorTitulo) nuevosErrores.titulo = errorTitulo;
    
    const errorDescripcion = validarDescripcion(descripcion);
    if (errorDescripcion) nuevosErrores.descripcion = errorDescripcion;
    
    const errorCategoria = validarCategoria(categoria);
    if (errorCategoria) nuevosErrores.categoria = errorCategoria;
    
    const errorSubproblema = validarSubproblema(subproblema);
    if (errorSubproblema) nuevosErrores.subproblema = errorSubproblema;

    setErrores(nuevosErrores);

    // ✅ SI HAY ERRORES, MOSTRAR MENSAJE Y NO ENVIAR
    if (Object.keys(nuevosErrores).length > 0) {
      const camposConError = Object.keys(nuevosErrores).map(campo => {
        switch (campo) {
          case 'titulo': return 'Título';
          case 'descripcion': return 'Descripción';
          case 'categoria': return 'Categoría';
          case 'subproblema': return 'Problema específico';
          default: return campo;
        }
      });
      
      setError(`❌ Errores en: ${camposConError.join(', ')}. Revise los campos marcados.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!usuarioActual) {
      setError('Debes iniciar sesión para crear un ticket');
      return;
    }

    setIsSubmitting(true);

    try {
      const tituloFinal = subproblema ? `${titulo} - ${subproblema}` : titulo;

      const { data, error: supabaseError } = await supabase
        .from('tickets')
        .insert([{
          titulo: tituloFinal,
          descripcion: descripcion.trim(),
          categoria: categoria,
          subcategoria: subproblema || null,
          prioridad: prioridad,
          estado: 'nuevo',
          solicitante_id: usuarioActual.id,
          tecnico_asignado_id: null,
          fecha_creacion: new Date().toISOString(),
          fecha_modificacion: new Date().toISOString(),
          activo: true
        }])
        .select()
        .single();

      if (supabaseError) throw supabaseError;
      if (!data) throw new Error('No se pudo crear el ticket');

      await supabase.from('ticket_participantes').insert([{
        ticket_id: data.id,
        usuario_id: usuarioActual.id
      }]);

      await ticketStore.cargarTickets();

      setMensaje('✅ Ticket creado correctamente. Serás redirigido...');
      
      setTimeout(() => {
        navigate('/tickets');
      }, 2000);

    } catch (err: any) {
      console.error('Error creando ticket:', err);
      setError(err.message || 'Error al crear el ticket. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Crear Nuevo Ticket</h1>
          <p className="text-gray-500 text-sm mt-1">Selecciona la categoría y describe tu problema</p>
        </div>
      </div>

      {/* ✅ MENSAJE DE ERROR PRINCIPAL */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* ✅ MENSAJE DE ÉXITO */}
      {mensaje && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-green-700 text-sm">{mensaje}</p>
        </div>
      )}

      {/* Formulario */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título del problema *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => {
                setTitulo(e.target.value);
                if (errores.titulo) handleBlur('titulo', e.target.value);
              }}
              onBlur={(e) => handleBlur('titulo', e.target.value)}
              placeholder="Ej: No puedo acceder al sistema"
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none ${
                errores.titulo ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-emerald-200'
              }`}
              style={{ '--tw-ring-color': errores.titulo ? '#fecaca' : '#80c398' } as any}
              maxLength={150}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {titulo.length}/150 caracteres (mínimo 5)
            </p>
            {errores.titulo && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errores.titulo}
              </p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción detallada *
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => {
                setDescripcion(e.target.value);
                if (errores.descripcion) handleBlur('descripcion', e.target.value);
              }}
              onBlur={(e) => handleBlur('descripcion', e.target.value)}
              placeholder="Describe el problema con el mayor detalle posible:
• ¿Qué estabas haciendo cuando ocurrió?
• ¿Qué mensaje de error ves?
• ¿Cuándo comenzó el problema?
• ¿Qué intentaste para solucionarlo?"
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none min-h-[120px] resize-y ${
                errores.descripcion ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-emerald-200'
              }`}
              style={{ '--tw-ring-color': errores.descripcion ? '#fecaca' : '#80c398' } as any}
              maxLength={2000}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {descripcion.length}/2000 caracteres (mínimo 10)
            </p>
            {errores.descripcion && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errores.descripcion}
              </p>
            )}
          </div>

          {/* Categoría y Prioridad */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Categoría - TARJETAS CON SUBPROBLEMAS INTEGRADOS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Categoría del problema *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categorias.map((cat: CategoriaType, index: number) => (
                  <div key={index} className="relative">
                    <label 
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all block ${
                        categoria === cat.valor 
                          ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                          : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setCategoria(cat.valor);
                        setSubproblema('');
                        if (errores.categoria) handleBlur('categoria', cat.valor);
                      }}
                    >
                      <input
                        type="radio"
                        name="categoria"
                        value={cat.valor}
                        checked={categoria === cat.valor}
                        onChange={(e) => {
                          setCategoria(e.target.value);
                          setSubproblema('');
                          if (errores.categoria) handleBlur('categoria', e.target.value);
                        }}
                        className="hidden"
                      />
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{cat.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-800 text-sm mb-1">{cat.label}</h3>
                          <p className="text-xs text-gray-500 truncate">{cat.desc}</p>
                        </div>
                        {categoria === cat.valor && (
                          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        )}
                      </div>
                    </label>
                    
                    {/* ✅ Dropdown integrado EN la tarjeta - CON VALIDACIÓN */}
                    {categoria === cat.valor && (
                      <div className="mt-3 pt-3 border-t border-emerald-200">
                        <div className="relative">
                          <select
                            value={subproblema}
                            onChange={(e) => {
                              setSubproblema(e.target.value);
                              if (errores.subproblema) handleBlur('subproblema', e.target.value);
                            }}
                            onBlur={(e) => handleBlur('subproblema', e.target.value)}
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white appearance-none ${
                              errores.subproblema ? 'border-red-300 focus:ring-red-200' : 'border-emerald-300'
                            }`}
                            required
                          >
                            {/* ✅ Opción placeholder SOLO si no hay subproblema seleccionado */}
                            {!subproblema && (
                              <option value="" disabled>
                                Selecciona el problema específico...
                              </option>
                            )}
                            {cat.subproblemas.map((sub: string, subIndex: number) => (
                              <option key={subIndex} value={sub}>{sub}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        {errores.subproblema && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {errores.subproblema}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {errores.categoria && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errores.categoria}
                </p>
              )}
            </div>

            {/* Prioridad - CON COLORES BONITOS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Prioridad *
              </label>
              <div className="space-y-2">
                {prioridades.map((pri, idx: number) => (
                  <label 
                    key={idx} 
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      prioridad === pri.valor 
                        ? 'border-emerald-500 ring-2 ring-emerald-200' 
                        : 'hover:shadow-md'
                    } ${pri.color}`}
                  >
                    <input
                      type="radio"
                      name="prioridad"
                      value={pri.valor}
                      checked={prioridad === pri.valor}
                      onChange={(e) => setPrioridad(e.target.value)}
                      className="w-4 h-4 focus:ring-emerald-500"
                    />
                    <span className="font-semibold">{pri.label}</span>
                    {prioridad === pri.valor && (
                      <CheckCircle className="w-5 h-5 ml-auto" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Información del solicitante */}
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-4 border border-emerald-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">📋 Tu información:</p>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>👤 Nombre:</strong> {usuarioActual?.nombre} {usuarioActual?.apellidos}</p>
              <p><strong>🏢 Área:</strong> {usuarioActual?.area || '⚠️ No definida'}</p>
              <p><strong>📧 Correo:</strong> {usuarioActual?.correo}</p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Object.keys(errores).length > 0}
              className="flex-1 px-4 py-2.5 rounded-lg text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg"
              style={{ backgroundColor: '#80c398' }}
              onMouseEnter={(e) => !isSubmitting && Object.keys(errores).length === 0 && (e.currentTarget.style.backgroundColor = '#6ab088')}
              onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#80c398')}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Crear Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}