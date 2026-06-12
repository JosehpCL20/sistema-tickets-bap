// =============================================
// PÁGINA: ENCUESTA DE SATISFACCIÓN (VISTA USUARIO FINAL)
// Formulario que recibe el usuario final por correo
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Send, CheckCircle, AlertTriangle, Star,
  Check, X
} from 'lucide-react';

// =============================================
// TIPOS
// =============================================
interface Opcion {
  id: string;
  texto: string;
  imagen?: string;
}

interface Pregunta {
  id: string;
  tipo_bloque: 'pregunta' | 'seccion' | 'titulo_descripcion';
  texto: string;
  descripcion?: string;
  tipo?: 'multiple_choice' | 'checkbox' | 'short_text' | 'long_text' | 'scale' | 'dropdown';
  obligatoria?: boolean;
  orden: number;
  opciones?: Opcion[];
  imagen?: string;
  video?: string;
}

interface PlantillaEncuesta {
  id?: number;
  nombre: string;
  descripcion: string;
  activa: boolean;
  color_principal: string;
  preguntas: Pregunta[];
}

// =============================================
// COMPONENTE PRINCIPAL
// =============================================
export default function EncuestaUsuarioFinalPage() {
  const navigate = useNavigate();
  const { encuestaToken } = useParams<{ encuestaToken?: string }>();

  const [cargando, setCargando] = useState(true);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plantilla, setPlantilla] = useState<PlantillaEncuesta | null>(null);
  const [respuestas, setRespuestas] = useState<Record<string, any>>({});
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [encuestaCompletada, setEncuestaCompletada] = useState(false);

  useEffect(() => {
    if (encuestaToken) {
      cargarEncuesta(encuestaToken);
    } else {
      setError('Enlace de encuesta inválido');
      setCargando(false);
    }
  }, [encuestaToken]);

  const cargarEncuesta = (token: string) => {
    setCargando(true);
    
    // Verificar si la encuesta ya fue completada
    const encuestasCompletadas = localStorage.getItem('encuestas_completadas');
    const completadas = encuestasCompletadas ? JSON.parse(encuestasCompletadas) : [];
    
    if (completadas.includes(token)) {
      setEncuestaCompletada(true);
      setCargando(false);
      return;
    }

    // Cargar la plantilla activa
    try {
      const guardadas = localStorage.getItem('plantillas_encuestas');
      if (guardadas) {
        const plantillas = JSON.parse(guardadas);
        const activa = plantillas.find((p: any) => p.activa === true);
        
        if (activa) {
          setPlantilla(activa);
        } else {
          setError('No hay una encuesta activa disponible');
        }
      } else {
        setError('No se encontró la encuesta');
      }
    } catch (error) {
      console.error('Error cargando encuesta:', error);
      setError('Error al cargar la encuesta');
    } finally {
      setCargando(false);
    }
  };

  const actualizarRespuesta = (preguntaId: string, valor: any) => {
    setRespuestas(prev => ({ ...prev, [preguntaId]: valor }));
    // Limpiar error cuando el usuario responde
    setErrores(prev => {
      const nuevos = { ...prev };
      delete nuevos[preguntaId];
      return nuevos;
    });
  };

  const toggleCheckbox = (preguntaId: string, opcionId: string) => {
    const actuales = (respuestas[preguntaId] as string[]) || [];
    const nuevas = actuales.includes(opcionId)
      ? actuales.filter(id => id !== opcionId)
      : [...actuales, opcionId];
    actualizarRespuesta(preguntaId, nuevas);
  };

  const validarYEnviar = () => {
    if (!plantilla) return;

    const nuevosErrores: Record<string, string> = {};
    
    plantilla.preguntas.forEach(p => {
      if (p.tipo_bloque === 'pregunta' && p.obligatoria) {
        const resp = respuestas[p.id];
        if (!resp || (Array.isArray(resp) && resp.length === 0) || resp === '') {
          nuevosErrores[p.id] = 'Esta pregunta es obligatoria';
        }
      }
    });

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      // Scroll al primer error
      const primerErrorId = Object.keys(nuevosErrores)[0];
      const elemento = document.getElementById(`pregunta-${primerErrorId}`);
      if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Guardar respuestas
    guardarRespuestas();
  };

  const guardarRespuestas = () => {
    if (!plantilla || !encuestaToken) return;

    try {
      // Guardar en localStorage (después será Supabase)
      const respuestasGuardadas = localStorage.getItem('respuestas_encuestas');
      const todasRespuestas = respuestasGuardadas ? JSON.parse(respuestasGuardadas) : [];
      
      todasRespuestas.push({
        token: encuestaToken,
        plantilla_id: plantilla.id,
        respuestas: respuestas,
        fecha_envio: new Date().toISOString()
      });

      localStorage.setItem('respuestas_encuestas', JSON.stringify(todasRespuestas));

      // Marcar encuesta como completada
      const encuestasCompletadas = localStorage.getItem('encuestas_completadas');
      const completadas = encuestasCompletadas ? JSON.parse(encuestasCompletadas) : [];
      completadas.push(encuestaToken);
      localStorage.setItem('encuestas_completadas', JSON.stringify(completadas));

      setEnviado(true);
    } catch (error) {
      console.error('Error guardando respuestas:', error);
      setError('Error al enviar la encuesta');
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#73c59b] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando encuesta...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-[#73c59b] text-white rounded-lg hover:bg-[#6ab88f] transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (encuestaCompletada) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Encuesta ya completada</h2>
          <p className="text-gray-600 mb-6">
            Esta encuesta ya fue respondida anteriormente. El enlace es de un solo uso.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-[#73c59b] text-white rounded-lg hover:bg-[#6ab88f] transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (enviado) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-[#73c59b]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Gracias por tu retroalimentación!</h2>
          <p className="text-gray-600 mb-6">
            Tus respuestas han sido registradas exitosamente. Tu opinión nos ayuda a mejorar nuestro servicio.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-[#73c59b] text-white rounded-lg hover:bg-[#6ab88f] transition-colors"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    );
  }

  if (!plantilla) {
    return null;
  }

  const colorPrincipal = plantilla.color_principal || '#73c59b';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm('¿Estás seguro que deseas salir? Perderás tus respuestas.')) {
                navigate('/');
              }
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Salir</span>
          </button>
          <h1 className="text-lg font-semibold text-gray-800 truncate max-w-[60%]">
            {plantilla.nombre || 'Encuesta de Satisfacción'}
          </h1>
          <div className="w-20"></div> {/* Espacio para balancear */}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Nota informativa */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Nota:</span> Las preguntas marcadas con asterisco (*) son obligatorias y deben ser respondidas para enviar la encuesta.
          </p>
        </div>

        {/* Descripción de la encuesta */}
        {plantilla.descripcion && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6" style={{ borderTop: `4px solid ${colorPrincipal}` }}>
            <p className="text-gray-600">{plantilla.descripcion}</p>
          </div>
        )}

        {/* Preguntas */}
        <div className="space-y-4">
          {plantilla.preguntas.map((pregunta, index) => {
            if (pregunta.tipo_bloque === 'seccion') {
              return (
                <div key={pregunta.id} className="bg-white rounded-lg p-6" style={{ borderBottom: `2px solid ${colorPrincipal}` }}>
                  <h3 className="text-xl font-medium text-gray-800">{pregunta.texto}</h3>
                  {pregunta.descripcion && (
                    <p className="text-sm text-gray-600 mt-2">{pregunta.descripcion}</p>
                  )}
                </div>
              );
            }

            if (pregunta.tipo_bloque === 'titulo_descripcion') {
              return (
                <div key={pregunta.id} className="bg-white rounded-lg p-6" style={{ borderLeft: `4px solid ${colorPrincipal}` }}>
                  <h3 className="text-xl font-medium text-gray-800">{pregunta.texto}</h3>
                  {pregunta.descripcion && (
                    <p className="text-sm text-gray-600 mt-2">{pregunta.descripcion}</p>
                  )}
                  {pregunta.imagen && (
                    <img src={pregunta.imagen} alt="" className="max-h-48 rounded mt-3" />
                  )}
                </div>
              );
            }

            const tieneError = !!errores[pregunta.id];

            return (
              <div
                key={pregunta.id}
                id={`pregunta-${pregunta.id}`}
                className={`bg-white rounded-lg shadow-sm p-6 transition-all ${
                  tieneError ? 'ring-2 ring-red-400' : ''
                }`}
                style={{ borderLeft: `4px solid ${tieneError ? '#e84545' : colorPrincipal}` }}
              >
                {/* Enunciado */}
                <div className="mb-4">
                  <p className="font-medium text-gray-800 text-base">
                    {pregunta.texto}
                    {pregunta.obligatoria && (
                      <span className="text-red-500 ml-1 font-bold">*</span>
                    )}
                  </p>
                  {tieneError && (
                    <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {errores[pregunta.id]}
                    </p>
                  )}
                </div>

                {/* Imagen de la pregunta */}
                {pregunta.imagen && (
                  <img src={pregunta.imagen} alt="" className="max-h-48 rounded mb-4" />
                )}

                {/* Opción Múltiple */}
                {pregunta.tipo === 'multiple_choice' && pregunta.opciones && (
                  <div className="space-y-2">
                    {pregunta.opciones.map((opcion) => (
                      <label
                        key={opcion.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                      >
                        <input
                          type="radio"
                          name={pregunta.id}
                          checked={respuestas[pregunta.id] === opcion.id}
                          onChange={() => actualizarRespuesta(pregunta.id, opcion.id)}
                          className="w-4 h-4"
                          style={{ accentColor: colorPrincipal }}
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-sm text-gray-700">{opcion.texto}</span>
                          {opcion.imagen && (
                            <img src={opcion.imagen} alt="" className="w-12 h-12 object-cover rounded" />
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {/* Checkbox */}
                {pregunta.tipo === 'checkbox' && pregunta.opciones && (
                  <div className="space-y-2">
                    {pregunta.opciones.map((opcion) => (
                      <label
                        key={opcion.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={((respuestas[pregunta.id] as string[]) || []).includes(opcion.id)}
                          onChange={() => toggleCheckbox(pregunta.id, opcion.id)}
                          className="w-4 h-4"
                          style={{ accentColor: colorPrincipal }}
                        />
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-sm text-gray-700">{opcion.texto}</span>
                          {opcion.imagen && (
                            <img src={opcion.imagen} alt="" className="w-12 h-12 object-cover rounded" />
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {/* Dropdown */}
                {pregunta.tipo === 'dropdown' && pregunta.opciones && (
                  <select
                    value={respuestas[pregunta.id] || ''}
                    onChange={(e) => actualizarRespuesta(pregunta.id, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2"
                    style={{ 
                      borderColor: tieneError ? '#e84545' : '#d1d5db',
                      focusRingColor: colorPrincipal 
                    }}
                  >
                    <option value="">Seleccionar...</option>
                    {pregunta.opciones.map((opcion) => (
                      <option key={opcion.id} value={opcion.id}>
                        {opcion.texto}
                      </option>
                    ))}
                  </select>
                )}

                {/* Respuesta Corta */}
                {pregunta.tipo === 'short_text' && (
                  <input
                    type="text"
                    value={respuestas[pregunta.id] || ''}
                    onChange={(e) => actualizarRespuesta(pregunta.id, e.target.value)}
                    placeholder="Tu respuesta..."
                    className="w-full px-4 py-2 border-b-2 bg-transparent focus:outline-none text-sm"
                    style={{ 
                      borderBottomColor: tieneError ? '#e84545' : '#d1d5db'
                    }}
                    onFocus={(e) => e.target.style.borderBottomColor = colorPrincipal}
                    onBlur={(e) => e.target.style.borderBottomColor = tieneError ? '#e84545' : '#d1d5db'}
                  />
                )}

                {/* Respuesta Larga */}
                {pregunta.tipo === 'long_text' && (
                  <textarea
                    value={respuestas[pregunta.id] || ''}
                    onChange={(e) => actualizarRespuesta(pregunta.id, e.target.value)}
                    placeholder="Escribe tu respuesta aquí..."
                    rows={4}
                    className="w-full px-4 py-2 border-2 rounded-lg bg-transparent focus:outline-none text-sm resize-none"
                    style={{ 
                      borderColor: tieneError ? '#e84545' : '#d1d5db'
                    }}
                    onFocus={(e) => e.target.style.borderColor = colorPrincipal}
                    onBlur={(e) => e.target.style.borderColor = tieneError ? '#e84545' : '#d1d5db'}
                  />
                )}

                {/* Escala de Estrellas */}
                {pregunta.tipo === 'scale' && (
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <Star
                        key={num}
                        onClick={() => actualizarRespuesta(pregunta.id, num)}
                        className="w-10 h-10 cursor-pointer transition-all hover:scale-110"
                        style={{
                          color: (respuestas[pregunta.id] || 0) >= num ? colorPrincipal : '#d1d5db',
                          fill: (respuestas[pregunta.id] || 0) >= num ? colorPrincipal : '#d1d5db'
                        }}
                      />
                    ))}
                    {respuestas[pregunta.id] && (
                      <span className="ml-3 text-sm text-gray-600 font-medium">
                        {respuestas[pregunta.id]}/5
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Botón Enviar */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={validarYEnviar}
            className="flex items-center gap-2 px-8 py-3 rounded-lg text-white font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105"
            style={{ backgroundColor: colorPrincipal }}
          >
            <Send className="w-5 h-5" />
            Enviar Encuesta
          </button>
        </div>

        {/* Nota final */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Tiempo estimado para completar: 2-3 minutos
          </p>
        </div>
      </div>
    </div>
  );
}