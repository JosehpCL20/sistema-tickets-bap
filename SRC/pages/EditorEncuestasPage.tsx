// =============================================
// PÁGINA: EDITOR DE ENCUESTAS (Creación/Edición Visual)
// CON DATOS MOCK - Sin Supabase temporalmente
// Para: superadmin, administrador
// Sistema de Gestión de Tickets - Banco de Alimentos Perú
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Eye, Save, Plus, Type, Image as ImageIcon,
  Trash2, Copy, X, ChevronDown, ChevronUp,
  ToggleLeft, ToggleRight, GripVertical, Layout, List
} from 'lucide-react';

// =============================================
// TIPOS
// =============================================
interface Opcion {
  texto: string;
  id?: string;
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
}

// =============================================
// PREGUNTAS PREDETERMINADAS (como en el mockup)
// =============================================
const PREGUNTAS_PREDETERMINADAS: Pregunta[] = [
  {
    id: 1,
    texto: '¿El problema fue resuelto?',
    tipo: 'multiple_choice',
    obligatoria: true,
    orden: 0,
    opciones: [
      { texto: 'Sí, completamente' },
      { texto: 'Parcialmente' },
      { texto: 'No fue resuelto' }
    ]
  },
  {
    id: 2,
    texto: '¿Qué tan satisfecho estás con la atención recibida?',
    tipo: 'multiple_choice',
    obligatoria: true,
    orden: 1,
    opciones: [
      { texto: 'Muy satisfecho' },
      { texto: 'Satisfecho' },
      { texto: 'Neutral' },
      { texto: 'Insatisfecho' },
      { texto: 'Muy insatisfecho' }
    ]
  },
  {
    id: 3,
    texto: '¿El tiempo de respuesta fue adecuado?',
    tipo: 'multiple_choice',
    obligatoria: true,
    orden: 2,
    opciones: [
      { texto: 'Sí, fue rápido' },
      { texto: 'Fue aceptable' },
      { texto: 'No, fue muy lento' }
    ]
  },
  {
    id: 4,
    texto: '¿El agente demostró conocimiento para resolver tu solicitud?',
    tipo: 'multiple_choice',
    obligatoria: true,
    orden: 3,
    opciones: [
      { texto: 'Sí' },
      { texto: 'Fue aceptable' },
      { texto: 'No' }
    ]
  },
  {
    id: 5,
    texto: '¿Recomendarías este servicio a otro compañero?',
    tipo: 'multiple_choice',
    obligatoria: true,
    orden: 4,
    opciones: [
      { texto: 'Sí' },
      { texto: 'Tal vez' },
      { texto: 'No' }
    ]
  },
  {
    id: 6,
    texto: 'Comentarios adicionales',
    tipo: 'short_text',
    obligatoria: false,
    orden: 5,
    opciones: []
  }
];

// =============================================
// COMPONENTE PRINCIPAL
// =============================================
export default function EditorEncuestasPage() {
  const navigate = useNavigate();
  const { plantillaId } = useParams<{ plantillaId?: string }>();
  
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  
  const [plantilla, setPlantilla] = useState<PlantillaEncuesta>({
    nombre: '',
    descripcion: '',
    activa: true,
    preguntas: []
  });

  // =============================================
  // CARGAR PLANTILLA
  // =============================================
  useEffect(() => {
    if (plantillaId) {
      // EDITAR existente
      const guardadas = localStorage.getItem('plantillas_encuestas');
      if (guardadas) {
        const plantillas = JSON.parse(guardadas);
        const encontrada = plantillas.find((p: any) => p.id === parseInt(plantillaId));
        if (encontrada) {
          setPlantilla(encontrada);
        } else {
          // Si no existe, cargar con predeterminadas
          setPlantilla({
            nombre: 'Predeterminada (Post-cierre)',
            descripcion: 'Encuesta de satisfacción enviada automáticamente al cerrar tickets',
            activa: true,
            preguntas: PREGUNTAS_PREDETERMINADAS
          });
        }
      } else {
        setPlantilla({
          nombre: 'Predeterminada (Post-cierre)',
          descripcion: 'Encuesta de satisfacción enviada automáticamente al cerrar tickets',
          activa: true,
          preguntas: PREGUNTAS_PREDETERMINADAS
        });
      }
    } else {
      // NUEVA encuesta - cargar con preguntas predeterminadas
      setPlantilla({
        nombre: 'Predeterminada (Post-cierre)',
        descripcion: '',
        activa: true,
        preguntas: PREGUNTAS_PREDETERMINADAS
      });
    }
    setCargando(false);
  }, [plantillaId]);

  // =============================================
  // ACCIONES DE PREGUNTAS
  // =============================================
  const agregarPregunta = () => {
    const nuevaPregunta: Pregunta = {
      id: Date.now(),
      texto: '',
      tipo: 'multiple_choice',
      obligatoria: true,
      orden: plantilla.preguntas.length,
      opciones: [
        { texto: 'Opción 1' },
        { texto: 'Opción 2' }
      ]
    };
    setPlantilla({
      ...plantilla,
      preguntas: [...plantilla.preguntas, nuevaPregunta]
    });
  };

  const eliminarPregunta = (index: number) => {
    const nuevas = plantilla.preguntas.filter((_, i) => i !== index);
    setPlantilla({
      ...plantilla,
      preguntas: nuevas.map((p, i) => ({ ...p, orden: i }))
    });
  };

  const duplicarPregunta = (index: number) => {
    const preguntaOriginal = plantilla.preguntas[index];
    const nuevaPregunta: Pregunta = {
      ...preguntaOriginal,
      id: Date.now(),
      orden: plantilla.preguntas.length,
      opciones: preguntaOriginal.opciones?.map(o => ({ ...o }))
    };
    setPlantilla({
      ...plantilla,
      preguntas: [...plantilla.preguntas, nuevaPregunta]
    });
  };

  const actualizarPregunta = (index: number, campo: keyof Pregunta, valor: any) => {
    const nuevas = [...plantilla.preguntas];
    nuevas[index] = { ...nuevas[index], [campo]: valor };
    setPlantilla({ ...plantilla, preguntas: nuevas });
  };

  const moverPregunta = (index: number, direccion: 'up' | 'down') => {
    if ((direccion === 'up' && index === 0) || 
        (direccion === 'down' && index === plantilla.preguntas.length - 1)) {
      return;
    }
    const nuevas = [...plantilla.preguntas];
    const newIndex = direccion === 'up' ? index - 1 : index + 1;
    [nuevas[index], nuevas[newIndex]] = [nuevas[newIndex], nuevas[index]];
    setPlantilla({
      ...plantilla,
      preguntas: nuevas.map((p, i) => ({ ...p, orden: i }))
    });
  };

  // =============================================
  // ACCIONES DE OPCIONES
  // =============================================
  const agregarOpcion = (preguntaIndex: number) => {
    const nuevas = [...plantilla.preguntas];
    const pregunta = nuevas[preguntaIndex];
    if (!pregunta.opciones) pregunta.opciones = [];
    pregunta.opciones.push({ texto: `Opción ${pregunta.opciones.length + 1}` });
    setPlantilla({ ...plantilla, preguntas: nuevas });
  };

  const eliminarOpcion = (preguntaIndex: number, opcionIndex: number) => {
    const nuevas = [...plantilla.preguntas];
    const pregunta = nuevas[preguntaIndex];
    if (pregunta.opciones) {
      pregunta.opciones = pregunta.opciones.filter((_, i) => i !== opcionIndex);
    }
    setPlantilla({ ...plantilla, preguntas: nuevas });
  };

  const actualizarOpcion = (preguntaIndex: number, opcionIndex: number, texto: string) => {
    const nuevas = [...plantilla.preguntas];
    const pregunta = nuevas[preguntaIndex];
    if (pregunta.opciones) {
      pregunta.opciones[opcionIndex] = { ...pregunta.opciones[opcionIndex], texto };
    }
    setPlantilla({ ...plantilla, preguntas: nuevas });
  };

  // =============================================
  // GUARDAR
  // =============================================
  const handleGuardar = async () => {
    if (!plantilla.nombre.trim()) {
      alert('⚠️ Ingresa un nombre para la plantilla');
      return;
    }

    if (plantilla.preguntas.length === 0) {
      alert('⚠️ Agrega al menos una pregunta');
      return;
    }

    for (let i = 0; i < plantilla.preguntas.length; i++) {
      if (!plantilla.preguntas[i].texto.trim()) {
        alert(`⚠️ La pregunta ${i + 1} no tiene texto`);
        return;
      }
    }

    setGuardando(true);
    try {
      const guardadas = localStorage.getItem('plantillas_encuestas');
      let plantillas = guardadas ? JSON.parse(guardadas) : [];

      if (plantilla.id) {
        const index = plantillas.findIndex((p: any) => p.id === plantilla.id);
        if (index !== -1) {
          plantillas[index] = {
            ...plantilla,
            fecha_modificacion: new Date().toISOString()
          };
        }
      } else {
        const nuevaPlantilla = {
          ...plantilla,
          id: Date.now(),
          fecha_creacion: new Date().toISOString()
        };
        plantillas.push(nuevaPlantilla);
      }

      localStorage.setItem('plantillas_encuestas', JSON.stringify(plantillas));
      alert('✅ Encuesta guardada correctamente');
      navigate('/gestion-encuestas');
    } catch (error) {
      console.error('Error guardando:', error);
      alert('❌ Error al guardar la encuesta');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER SUPERIOR - Como en el mockup */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate('/gestion-encuestas')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMostrarVistaPrevia(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Eye className="w-5 h-5" />
            </button>
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
              style={{ backgroundColor: '#80c398' }}
            >
              <Save className="w-5 h-5" />
              Guardar Encuesta
            </button>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* INFORMACIÓN DE LA PLANTILLA */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🏷️</span>
            <input
              type="text"
              value={plantilla.nombre}
              onChange={e => setPlantilla({ ...plantilla, nombre: e.target.value })}
              placeholder="Nombre de la plantilla"
              className="flex-1 px-3 py-2 border-b-2 border-gray-300 focus:border-emerald-500 focus:outline-none text-lg font-bold"
            />
          </div>
          <input
            type="text"
            value={plantilla.descripcion}
            onChange={e => setPlantilla({ ...plantilla, descripcion: e.target.value })}
            placeholder="Descripción del formulario"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm text-gray-500"
          />
        </div>

        {/* PREGUNTAS */}
        <div className="space-y-4">
          {plantilla.preguntas.map((pregunta, index) => (
            <PreguntaCard
              key={pregunta.id || index}
              pregunta={pregunta}
              index={index}
              total={plantilla.preguntas.length}
              onUpdate={(campo, valor) => actualizarPregunta(index, campo, valor)}
              onDelete={() => eliminarPregunta(index)}
              onDuplicate={() => duplicarPregunta(index)}
              onMove={(dir) => moverPregunta(index, dir)}
              onAddOpcion={() => agregarOpcion(index)}
              onDeleteOpcion={(optIndex) => eliminarOpcion(index, optIndex)}
              onUpdateOpcion={(optIndex, texto) => actualizarOpcion(index, optIndex, texto)}
            />
          ))}
        </div>

        {/* BOTÓN AGREGAR PREGUNTA */}
        <button
          onClick={agregarPregunta}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-emerald-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Agregar Pregunta
        </button>
      </div>

      {/* PANEL LATERAL DE HERRAMIENTAS */}
      <div className="fixed right-4 top-24 flex flex-col gap-2 z-30">
        <ToolButton icon={<Plus className="w-5 h-5" />} label="Agregar pregunta" onClick={agregarPregunta} />
        <ToolButton icon={<Type className="w-5 h-5" />} label="Agregar título" onClick={() => alert('Función próxima')} />
        <ToolButton icon={<ImageIcon className="w-5 h-5" />} label="Agregar imagen" onClick={() => alert('Función próxima')} />
        <ToolButton icon={<Layout className="w-5 h-5" />} label="Agregar sección" onClick={() => alert('Función próxima')} />
        <ToolButton icon={<List className="w-5 h-5" />} label="Reordenar" onClick={() => alert('Usa las flechas de cada pregunta')} />
      </div>

      {/* MODAL VISTA PREVIA */}
      {mostrarVistaPrevia && (
        <ModalVistaPrevia
          plantilla={plantilla}
          onClose={() => setMostrarVistaPrevia(false)}
        />
      )}
    </div>
  );
}

// =============================================
// COMPONENTE: TARJETA DE PREGUNTA (como en el mockup)
// =============================================
function PreguntaCard({
  pregunta,
  index,
  total,
  onUpdate,
  onDelete,
  onDuplicate,
  onMove,
  onAddOpcion,
  onDeleteOpcion,
  onUpdateOpcion
}: {
  pregunta: Pregunta;
  index: number;
  total: number;
  onUpdate: (campo: keyof Pregunta, valor: any) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (dir: 'up' | 'down') => void;
  onAddOpcion: () => void;
  onDeleteOpcion: (optIndex: number) => void;
  onUpdateOpcion: (optIndex: number, texto: string) => void;
}) {
  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'multiple_choice': return 'Opción Múltiple';
      case 'short_text': return 'Respuesta Corta';
      case 'long_text': return 'Respuesta Larga';
      case 'scale': return 'Escala (1-5)';
      default: return 'Opción Múltiple';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 relative">
      {/* Icono de arrastrar */}
      <div className="flex justify-center">
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {/* Header de la pregunta */}
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2">
          <input
            type="text"
            value={pregunta.texto}
            onChange={e => onUpdate('texto', e.target.value)}
            placeholder="Escribe tu pregunta aquí..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
          />
          <select
            value={pregunta.tipo}
            onChange={e => onUpdate('tipo', e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="multiple_choice">Opción Múltiple</option>
            <option value="short_text">Respuesta Corta</option>
            <option value="long_text">Respuesta Larga</option>
            <option value="scale">Escala (1-5)</option>
          </select>
        </div>
      </div>

      {/* Opciones (solo para multiple_choice) */}
      {pregunta.tipo === 'multiple_choice' && pregunta.opciones && (
        <div className="space-y-2 pl-4">
          {pregunta.opciones.map((opcion, optIndex) => (
            <div key={optIndex} className="flex items-center gap-2">
              <input type="checkbox" disabled className="rounded" />
              <input
                type="text"
                value={opcion.texto}
                onChange={e => onUpdateOpcion(optIndex, e.target.value)}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
              <button
                onClick={() => onDeleteOpcion(optIndex)}
                className="p-1 hover:bg-red-50 rounded text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={onAddOpcion}
            className="text-sm text-gray-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            <input type="checkbox" disabled className="rounded" />
            Agregar una Opción
          </button>
        </div>
      )}

      {/* Placeholder para short_text */}
      {pregunta.tipo === 'short_text' && (
        <div className="pl-4">
          <div className="border-b border-gray-400 py-2 text-sm text-gray-400">
            Texto con respuesta breve.
          </div>
        </div>
      )}

      {/* Placeholder para long_text */}
      {pregunta.tipo === 'long_text' && (
        <div className="pl-4">
          <div className="border-b border-gray-400 py-4 text-sm text-gray-400">
            Texto con respuesta larga.
          </div>
        </div>
      )}

      {/* Placeholder para scale */}
      {pregunta.tipo === 'scale' && (
        <div className="pl-4 flex gap-2">
          {[1, 2, 3, 4, 5].map(num => (
            <div
              key={num}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-sm"
            >
              {num}
            </div>
          ))}
        </div>
      )}

      {/* Footer de la pregunta */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={onDuplicate}
            className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
            title="Duplicar"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-50 rounded text-red-600"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Obligatoria</span>
          <button
            onClick={() => onUpdate('obligatoria', !pregunta.obligatoria)}
            className="relative w-10 h-6 rounded-full transition-colors"
            style={{ backgroundColor: pregunta.obligatoria ? '#80c398' : '#d1d5db' }}
          >
            <span
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform"
              style={{
                transform: pregunta.obligatoria ? 'translateX(24px)' : 'translateX(4px)'
              }}
            />
          </button>
        </div>
      </div>

      {/* Botones laterales de reordenar */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
        <button
          onClick={() => onMove('up')}
          disabled={index === 0}
          className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => onMove('down')}
          disabled={index === total - 1}
          className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// =============================================
// COMPONENTE: BOTÓN DE HERRAMIENTA
// =============================================
function ToolButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-12 h-12 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-emerald-500 transition-all flex items-center justify-center"
      title={label}
    >
      {icon}
    </button>
  );
}

// =============================================
// COMPONENTE: MODAL VISTA PREVIA
// =============================================
function ModalVistaPrevia({
  plantilla,
  onClose
}: {
  plantilla: PlantillaEncuesta;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Vista Previa: {plantilla.nombre}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {plantilla.descripcion && (
            <p className="text-gray-600 text-sm">{plantilla.descripcion}</p>
          )}

          <div className="space-y-4">
            {plantilla.preguntas.map((p, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <p className="font-medium text-gray-800 mb-3">
                  {index + 1}. {p.texto}
                  {p.obligatoria && <span className="text-red-500 ml-1">*</span>}
                </p>
                
                {p.tipo === 'multiple_choice' && p.opciones && (
                  <div className="space-y-2 pl-6">
                    {p.opciones.map((opt, optIndex) => (
                      <label key={optIndex} className="flex items-center gap-2">
                        <input type="checkbox" disabled className="rounded" />
                        <span className="text-sm text-gray-700">{opt.texto}</span>
                      </label>
                    ))}
                  </div>
                )}
                
                {p.tipo === 'short_text' && (
                  <input type="text" disabled placeholder="Tu respuesta..." className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50" />
                )}
                
                {p.tipo === 'long_text' && (
                  <textarea disabled placeholder="Tu respuesta..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50" />
                )}
                
                {p.tipo === 'scale' && (
                  <div className="flex gap-2 pl-6">
                    {[1, 2, 3, 4, 5].map(num => (
                      <div key={num} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center">{num}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}