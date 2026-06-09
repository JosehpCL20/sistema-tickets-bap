// =============================================
// PÁGINA: GESTIÓN DE ENCUESTAS (PLANTILLAS)
// Para: superadmin, administrador
// Sistema de Gestión de Tickets - Banco de Alimentos Perú
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import {
  ArrowLeft, Plus, Edit2, Trash2, Eye, ToggleLeft,
  ToggleRight, AlertCircle, CheckCircle, X, Star,
  CheckSquare, Type, MessageSquare
} from 'lucide-react';

// =============================================
// TIPOS
// =============================================
interface Opcion {
  texto: string;
}

interface Pregunta {
  id?: number;
  texto: string;
  tipo: 'multiple_choice' | 'short_text' | 'long_text' | 'scale';
  obligatoria: boolean;
  orden: number;
  opciones?: Opcion[];
}

interface PlantillaEncuesta {
  id?: number;
  nombre: string;
  descripcion: string;
  activa: boolean;
  preguntas: Pregunta[];
  fecha_creacion?: string;
  fecha_modificacion?: string;
}

// =============================================
// COMPONENTE PRINCIPAL
// =============================================
export default function GestionEncuestasPage() {
  const navigate = useNavigate();
  const [plantillas, setPlantillas] = useState<PlantillaEncuesta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vistaPrevia, setVistaPrevia] = useState<PlantillaEncuesta | null>(null);

  // =============================================
  // CARGAR PLANTILLAS
  // =============================================
  const cargarPlantillas = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('plantillas_encuesta')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;

      // Cargar preguntas para cada plantilla
      const plantillasConPreguntas = await Promise.all(
        (data || []).map(async (plantilla) => {
          const { data: preguntas } = await supabase
            .from('preguntas_encuesta')
            .select('*')
            .eq('plantilla_id', plantilla.id)
            .order('orden');

          return {
            ...plantilla,
            preguntas: preguntas || []
          };
        })
      );

      setPlantillas(plantillasConPreguntas);
    } catch (error) {
      console.error('Error cargando plantillas:', error);
      alert('❌ Error al cargar las plantillas');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPlantillas();
  }, []);

  // =============================================
  // ACCIONES
  // =============================================
  
  // ✅ NUEVA ENCUESTA → Navega al editor visual
  const handleNuevaEncuesta = () => {
    navigate('/editor-encuestas');
  };

  // ✅ EDITAR → Navega al editor visual con ID
  const handleEditar = (plantilla: PlantillaEncuesta) => {
    navigate(`/editor-encuestas/${plantilla.id}`);
  };

  // ✅ VER → Modal de vista previa
  const handleVistaPrevia = (plantilla: PlantillaEncuesta) => {
    setVistaPrevia(plantilla);
  };

  // ✅ ELIMINAR → Con validación y confirmación
  const handleEliminar = async (plantilla: PlantillaEncuesta) => {
    // Validar que no sea la única plantilla activa
    const plantillasActivas = plantillas.filter(p => p.activa);
    if (plantilla.activa && plantillasActivas.length === 1) {
      alert('⚠️ No se puede eliminar la única plantilla activa del sistema.\n\nDebe haber al menos una plantilla activa para el envío automático de encuestas.');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar la plantilla "${plantilla.nombre}"?\n\nEsta acción es permanente y eliminará todas las preguntas asociadas.`)) return;

    try {
      // Eliminar preguntas primero
      await supabase
        .from('preguntas_encuesta')
        .delete()
        .eq('plantilla_id', plantilla.id);

      // Eliminar plantilla
      await supabase
        .from('plantillas_encuesta')
        .delete()
        .eq('id', plantilla.id);

      alert('✅ Plantilla eliminada correctamente');
      await cargarPlantillas();
    } catch (error) {
      console.error('Error eliminando:', error);
      alert('❌ Error al eliminar la plantilla');
    }
  };

  // ✅ ACTIVAR/DESACTIVAR → Solo puede haber UNA activa a la vez
  const handleToggleActiva = async (plantilla: PlantillaEncuesta) => {
    // Si se va a activar, desactivar todas las demás primero
    if (!plantilla.activa) {
      try {
        // Desactivar todas las demás plantillas
        await supabase
          .from('plantillas_encuesta')
          .update({ activa: false })
          .eq('activa', true);

        // Activar la seleccionada
        await supabase
          .from('plantillas_encuesta')
          .update({ activa: true })
          .eq('id', plantilla.id);

        alert('✅ Plantilla activada correctamente. Las demás plantillas han sido desactivadas automáticamente.');
        await cargarPlantillas();
      } catch (error) {
        console.error('Error activando:', error);
        alert('❌ Error al activar la plantilla');
      }
    } else {
      // Si se va a desactivar
      const plantillasActivas = plantillas.filter(p => p.activa);
      if (plantillasActivas.length === 1) {
        alert('⚠️ No se puede desactivar la única plantilla activa del sistema.\n\nDebe haber al menos una plantilla activa para el envío automático de encuestas.');
        return;
      }

      if (!confirm(`¿Desactivar la plantilla "${plantilla.nombre}"?\n\nEsta plantilla dejará de enviarse automáticamente cuando los tickets sean resueltos.`)) return;

      try {
        await supabase
          .from('plantillas_encuesta')
          .update({ activa: false })
          .eq('id', plantilla.id);

        alert('✅ Plantilla desactivada correctamente');
        await cargarPlantillas();
      } catch (error) {
        console.error('Error desactivando:', error);
        alert('❌ Error al desactivar la plantilla');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Volver"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Encuesta</h1>
            <p className="text-gray-500 text-sm">Gestión de Plantillas de Encuesta - BAP</p>
          </div>
        </div>
        <button
          onClick={handleNuevaEncuesta}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:shadow-lg transition-all"
          style={{ backgroundColor: '#80c398' }}
        >
          <Plus className="w-5 h-5" />
          Nueva Encuesta
        </button>
      </div>

      {/* TABLA DE PLANTILLAS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase">Plantillas</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase">Cantidad de Preguntas</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    Cargando plantillas...
                  </td>
                </tr>
              ) : plantillas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <AlertCircle className="w-12 h-12" />
                      <p className="text-lg font-medium">No hay plantillas creadas</p>
                      <p className="text-sm">Crea tu primera plantilla de encuesta</p>
                      <button
                        onClick={handleNuevaEncuesta}
                        className="mt-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                        style={{ backgroundColor: '#80c398' }}
                      >
                        Crear Plantilla
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                plantillas.map((plantilla) => (
                  <tr key={plantilla.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{plantilla.nombre}</span>
                          {plantilla.activa && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Activa
                            </span>
                          )}
                        </div>
                        {plantilla.descripcion && (
                          <p className="text-sm text-gray-500 mt-0.5">{plantilla.descripcion}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {plantilla.preguntas?.length || 0} Preguntas
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        plantilla.activa
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {plantilla.activa ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <button
                          onClick={() => handleEditar(plantilla)}
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleVistaPrevia(plantilla)}
                          className="p-1.5 rounded hover:bg-purple-50 text-purple-600 transition-colors"
                          title="Ver"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActiva(plantilla)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors"
                          title={plantilla.activa ? 'Desactivar' : 'Activar'}
                        >
                          {plantilla.activa ? (
                            <ToggleRight className="w-5 h-5 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEliminar(plantilla)}
                          className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE VISTA PREVIA */}
      {vistaPrevia && (
        <ModalVistaPrevia
          plantilla={vistaPrevia}
          onClose={() => setVistaPrevia(null)}
        />
      )}
    </div>
  );
}

// =============================================
// MODAL DE VISTA PREVIA
// =============================================
function ModalVistaPrevia({
  plantilla,
  onClose
}: {
  plantilla: PlantillaEncuesta;
  onClose: () => void;
}) {
  const renderPregunta = (p: Pregunta, index: number) => {
    return (
      <div key={index} className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <p className="font-medium text-gray-800 flex items-start gap-2">
            <span className="text-gray-400">{index + 1}.</span>
            <span>{p.texto || 'Pregunta sin texto'}</span>
            {p.obligatoria && <span className="text-red-500 ml-1">*</span>}
          </p>
        </div>
        
        {p.tipo === 'multiple_choice' && p.opciones && (
          <div className="space-y-2 pl-6">
            {p.opciones.map((opt, optIndex) => (
              <label key={optIndex} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" disabled className="rounded" />
                <span className="text-sm text-gray-700">{opt.texto}</span>
              </label>
            ))}
          </div>
        )}
        
        {p.tipo === 'short_text' && (
          <div className="pl-6">
            <input
              type="text"
              disabled
              placeholder="Tu respuesta..."
              className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
            />
          </div>
        )}
        
        {p.tipo === 'long_text' && (
          <div className="pl-6">
            <textarea
              disabled
              placeholder="Tu respuesta..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
            />
          </div>
        )}
        
        {p.tipo === 'scale' && (
          <div className="pl-6 flex gap-2">
            {[1, 2, 3, 4, 5].map(num => (
              <button
                key={num}
                disabled
                className="w-10 h-10 rounded-full border border-gray-300 bg-gray-50 text-sm font-medium flex items-center justify-center"
              >
                {num}
              </button>
            ))}
          </div>
        )}
        
        <div className="mt-2 pl-6">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            {p.tipo === 'multiple_choice' && <><CheckSquare className="w-3 h-3" /> Opción Múltiple</>}
            {p.tipo === 'short_text' && <><Type className="w-3 h-3" /> Respuesta Corta</>}
            {p.tipo === 'long_text' && <><MessageSquare className="w-3 h-3" /> Respuesta Larga</>}
            {p.tipo === 'scale' && <><Star className="w-3 h-3" /> Escala (1-5)</>}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Vista Previa</h2>
            <p className="text-sm text-gray-500">{plantilla.nombre}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {plantilla.descripcion && (
            <p className="text-gray-600 text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
              {plantilla.descripcion}
            </p>
          )}

          <div className="space-y-4">
            {plantilla.preguntas && plantilla.preguntas.length > 0 ? (
              plantilla.preguntas.map((p, index) => renderPregunta(p, index))
            ) : (
              <p className="text-gray-500 text-center py-8">No hay preguntas en esta plantilla</p>
            )}
          </div>

          {plantilla.preguntas && plantilla.preguntas.filter(p => p.obligatoria).length > 0 && (
            <p className="text-xs text-gray-500 mt-4">
              <span className="text-red-500">*</span> Preguntas obligatorias
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}