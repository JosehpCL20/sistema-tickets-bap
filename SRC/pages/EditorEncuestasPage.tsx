// =============================================
// PÁGINA: EDITOR DE ENCUESTAS
// Con placeholders transparentes y toggle corregido
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Eye, Save, Plus, Image as ImageIcon,
  Trash2, Copy, X, GripHorizontal, Layout,
  Video, AlignLeft, Star, CheckCircle, AlertTriangle
} from 'lucide-react';

// =============================================
// TIPOS
// =============================================
interface Opcion {
  id: string;
  texto: string;
}

interface Pregunta {
  id: string;
  texto: string;
  tipo: 'multiple_choice' | 'checkbox' | 'short_text' | 'long_text' | 'scale' | 'dropdown';
  obligatoria: boolean;
  orden: number;
  opciones?: Opcion[];
  imagen?: string;
}

interface PlantillaEncuesta {
  id?: number;
  nombre: string;
  descripcion: string;
  activa: boolean;
  preguntas: Pregunta[];
}

// =============================================
// COMPONENTE PRINCIPAL
// =============================================
export default function EditorEncuestasPage() {
  const navigate = useNavigate();
  const { plantillaId } = useParams<{ plantillaId?: string }>();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const [plantilla, setPlantilla] = useState<PlantillaEncuesta>({
    nombre: '',
    descripcion: '',
    activa: true,
    preguntas: []
  });

  useEffect(() => {
    if (plantillaId) {
      cargarPlantilla(parseInt(plantillaId));
    } else {
      setCargando(false);
    }
  }, [plantillaId]);

  const cargarPlantilla = async (id: number) => {
    setCargando(true);
    try {
      const guardadas = localStorage.getItem('plantillas_encuestas');
      if (guardadas) {
        const plantillas = JSON.parse(guardadas);
        const encontrada = plantillas.find((p: any) => p.id === id);
        if (encontrada) {
          setPlantilla(encontrada);
        } else {
          setMensaje({ tipo: 'error', texto: 'Plantilla no encontrada' });
          setTimeout(() => navigate('/gestion-encuestas'), 2000);
        }
      }
    } catch (error) {
      console.error('Error cargando:', error);
      setMensaje({ tipo: 'error', texto: 'Error al cargar la plantilla' });
    } finally {
      setCargando(false);
    }
  };

  // =============================================
  // ACCIONES DE PREGUNTAS
  // =============================================
  const agregarPregunta = () => {
    const nuevaPregunta: Pregunta = {
      id: `preg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      texto: '',
      tipo: 'multiple_choice',
      obligatoria: false,
      orden: plantilla.preguntas.length,
      opciones: [
        { id: `opt_${Date.now()}_1`, texto: '' },
        { id: `opt_${Date.now()}_2`, texto: '' }
      ]
    };
    setPlantilla({
      ...plantilla,
      preguntas: [...plantilla.preguntas, nuevaPregunta]
    });
  };

  const eliminarPregunta = (id: string) => {
    const nuevas = plantilla.preguntas.filter(p => p.id !== id);
    setPlantilla({
      ...plantilla,
      preguntas: nuevas.map((p, i) => ({ ...p, orden: i }))
    });
  };

  const duplicarPregunta = (id: string) => {
    const original = plantilla.preguntas.find(p => p.id === id);
    if (!original) return;

    const duplicada: Pregunta = {
      ...original,
      id: `preg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orden: plantilla.preguntas.length,
      opciones: original.opciones?.map(o => ({
        ...o,
        id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }))
    };

    const nuevas = [...plantilla.preguntas];
    const index = nuevas.findIndex(p => p.id === id);
    nuevas.splice(index + 1, 0, duplicada);

    setPlantilla({
      ...plantilla,
      preguntas: nuevas.map((p, i) => ({ ...p, orden: i }))
    });
  };

  const actualizarPregunta = (id: string, campo: keyof Pregunta, valor: any) => {
    const nuevas = plantilla.preguntas.map(p =>
      p.id === id ? { ...p, [campo]: valor } : p
    );
    setPlantilla({ ...plantilla, preguntas: nuevas });
  };

  // =============================================
  // DRAG AND DROP
  // =============================================
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const nuevas = [...plantilla.preguntas];
    const [movida] = nuevas.splice(dragIndex, 1);
    nuevas.splice(index, 0, movida);

    setPlantilla({
      ...plantilla,
      preguntas: nuevas.map((p, i) => ({ ...p, orden: i }))
    });
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  // =============================================
  // ACCIONES DE OPCIONES
  // =============================================
  const agregarOpcion = (preguntaId: string) => {
    const nuevas = plantilla.preguntas.map(p => {
      if (p.id === preguntaId) {
        const opciones = p.opciones || [];
        return {
          ...p,
          opciones: [...opciones, { id: `opt_${Date.now()}`, texto: '' }]
        };
      }
      return p;
    });
    setPlantilla({ ...plantilla, preguntas: nuevas });
  };

  const eliminarOpcion = (preguntaId: string, opcionId: string) => {
    const nuevas = plantilla.preguntas.map(p => {
      if (p.id === preguntaId) {
        return {
          ...p,
          opciones: p.opciones?.filter(o => o.id !== opcionId) || []
        };
      }
      return p;
    });
    setPlantilla({ ...plantilla, preguntas: nuevas });
  };

  const actualizarOpcion = (preguntaId: string, opcionId: string, texto: string) => {
    const nuevas = plantilla.preguntas.map(p => {
      if (p.id === preguntaId) {
        return {
          ...p,
          opciones: p.opciones?.map(o =>
            o.id === opcionId ? { ...o, texto } : o
          ) || []
        };
      }
      return p;
    });
    setPlantilla({ ...plantilla, preguntas: nuevas });
  };

  // =============================================
  // AGREGAR IMAGEN
  // =============================================
  const handleAgregarImagen = (preguntaId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const nuevas = plantilla.preguntas.map(p =>
            p.id === preguntaId ? { ...p, imagen: event.target?.result as string } : p
          );
          setPlantilla({ ...plantilla, preguntas: nuevas });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleEliminarImagen = (preguntaId: string) => {
    const nuevas = plantilla.preguntas.map(p =>
      p.id === preguntaId ? { ...p, imagen: undefined } : p
    );
    setPlantilla({ ...plantilla, preguntas: nuevas });
  };

  // =============================================
  // GUARDAR
  // =============================================
  const handleGuardar = async () => {
    if (!plantilla.nombre.trim()) {
      setMensaje({ tipo: 'error', texto: 'Ingresa un nombre para la plantilla' });
      setTimeout(() => setMensaje(null), 3000);
      return;
    }

    if (plantilla.preguntas.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Agrega al menos una pregunta' });
      setTimeout(() => setMensaje(null), 3000);
      return;
    }

    for (let i = 0; i < plantilla.preguntas.length; i++) {
      if (!plantilla.preguntas[i].texto.trim()) {
        setMensaje({ tipo: 'error', texto: `La pregunta ${i + 1} no tiene texto` });
        setTimeout(() => setMensaje(null), 3000);
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
          plantillas[index] = plantilla;
        }
      } else {
        plantillas.push({
          ...plantilla,
          id: Date.now(),
          fecha_creacion: new Date().toISOString()
        });
      }

      localStorage.setItem('plantillas_encuestas', JSON.stringify(plantillas));
      setMensaje({ tipo: 'success', texto: '✅ Encuesta guardada correctamente' });
      setTimeout(() => {
        navigate('/gestion-encuestas');
      }, 1500);
    } catch (error) {
      console.error('Error guardando:', error);
      setMensaje({ tipo: 'error', texto: 'Error al guardar la encuesta' });
      setTimeout(() => setMensaje(null), 3000);
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
  <>
    {/* HEADER SUPERIOR FIJO */}
    <div style={{
      position: 'fixed',
      top: '64px',
      left: 0,
      right: 0,
      zIndex: 20,
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    }}>
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => navigate('/gestion-encuestas')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Volver"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMostrarVistaPrevia(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
            title="Vista Previa"
          >
            <Eye className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-white font-medium disabled:opacity-50 hover:shadow-md transition-all"
            style={{ backgroundColor: '#80c398' }}
          >
            <Save className="w-5 h-5" />
            Guardar Encuesta
          </button>
        </div>
      </div>
    </div>

    {/* CONTENIDO - Con padding-top exacto para compensar la barra fija */}
    <div style={{
      paddingTop: '50px',
      paddingBottom: '80px',
      backgroundColor: '#f3f4f6',
      minHeight: '100vh'
    }}>
      <div style={{ maxWidth: '896px', margin: '0 auto', padding: '0 16px' }}>

        {/* MENSAJES DE ALERTA */}
        {mensaje && (
          <div className={`p-4 rounded-lg flex items-center gap-2 mb-4 ${
            mensaje.tipo === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {mensaje.tipo === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            )}
            <p className={mensaje.tipo === 'success' ? 'text-green-700' : 'text-red-700'}>
              {mensaje.texto}
            </p>
          </div>
        )}

        {/* BLOQUE 1: TÍTULO Y DESCRIPCIÓN */}
        <div className="bg-white rounded-lg border-t-4 border-t-[#80c398] shadow-sm p-6 mb-4">
          <input
            type="text"
            value={plantilla.nombre}
            onChange={e => setPlantilla({ ...plantilla, nombre: e.target.value })}
            placeholder="Título del formulario"
            className="w-full px-0 py-2 border-b border-gray-200 focus:border-[#80c398] focus:outline-none text-3xl font-normal text-gray-800 placeholder-gray-300 mb-2"
          />
          <textarea
            value={plantilla.descripcion}
            onChange={e => setPlantilla({ ...plantilla, descripcion: e.target.value })}
            placeholder="Descripción del formulario"
            rows={1}
            className="w-full px-0 py-2 border-b border-gray-200 focus:border-[#80c398] focus:outline-none text-sm text-gray-600 placeholder-gray-300 resize-none"
          />
        </div>

        {/* BLOQUES DE PREGUNTAS */}
        {plantilla.preguntas.map((pregunta, index) => (
          <PreguntaCard
            key={pregunta.id}
            pregunta={pregunta}
            index={index}
            onUpdate={(campo, valor) => actualizarPregunta(pregunta.id, campo, valor)}
            onDelete={() => eliminarPregunta(pregunta.id)}
            onDuplicate={() => duplicarPregunta(pregunta.id)}
            onAddOpcion={() => agregarOpcion(pregunta.id)}
            onDeleteOpcion={(optId) => eliminarOpcion(pregunta.id, optId)}
            onUpdateOpcion={(optId, texto) => actualizarOpcion(pregunta.id, optId, texto)}
            onAgregarImagen={() => handleAgregarImagen(pregunta.id)}
            onEliminarImagen={() => handleEliminarImagen(pregunta.id)}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            isDragging={dragIndex === index}
          />
        ))}

        {/* MENSAJE CUANDO NO HAY PREGUNTAS */}
        {plantilla.preguntas.length === 0 && (
          <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center mb-4">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-1">
                Comienza a crear tu encuesta
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Haz clic en el botón <strong>+</strong> para agregar tu primera pregunta
              </p>
              <button
                onClick={agregarPregunta}
                className="px-6 py-2 rounded-full text-white font-medium hover:shadow-md transition-all"
                style={{ backgroundColor: '#80c398' }}
              >
                + Agregar primera pregunta
              </button>
            </div>
          </div>
        )}

        {/* BOTÓN AGREGAR PREGUNTA AL FINAL */}
        {plantilla.preguntas.length > 0 && (
          <button
            onClick={agregarPregunta}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#80c398] hover:text-[#80c398] transition-colors flex items-center justify-center gap-2 mb-4"
          >
            <Plus className="w-5 h-5" />
            Agregar pregunta
          </button>
        )}
      </div>
    </div>

    {/* MODAL VISTA PREVIA */}
    {mostrarVistaPrevia && (
      <ModalVistaPrevia
        plantilla={plantilla}
        onClose={() => setMostrarVistaPrevia(false)}
      />
    )}
  </>
);
}

// =============================================
// COMPONENTE: TARJETA DE PREGUNTA
// =============================================
function PreguntaCard({
  pregunta,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
  onAddOpcion,
  onDeleteOpcion,
  onUpdateOpcion,
  onAgregarImagen,
  onEliminarImagen,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging
}: {
  pregunta: Pregunta;
  index: number;
  onUpdate: (campo: keyof Pregunta, valor: any) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddOpcion: () => void;
  onDeleteOpcion: (optId: string) => void;
  onUpdateOpcion: (optId: string, texto: string) => void;
  onAgregarImagen: () => void;
  onEliminarImagen: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  const esOpcionMultiple = pregunta.tipo === 'multiple_choice' || pregunta.tipo === 'checkbox' || pregunta.tipo === 'dropdown';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 relative transition-all ${
        isDragging ? 'opacity-50 border-[#80c398] border-2' : ''
      }`}
    >
      {/* Borde superior de color */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#80c398] rounded-l-lg" />

      <div className="p-6">
        {/* Header: Grip horizontal + Pregunta + Tipo */}
        <div className="flex items-start gap-3 mb-4">
          {/* Grip horizontal para arrastrar */}
          <div className="pt-3 cursor-grab active:cursor-grabbing" title="Arrastra para reordenar">
            <GripHorizontal className="w-5 h-5 text-gray-400" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={pregunta.texto}
                onChange={e => onUpdate('texto', e.target.value)}
                placeholder="Escribe tu pregunta aquí"
                className="flex-1 px-0 py-2 border-b border-gray-200 focus:border-[#80c398] focus:outline-none text-base text-gray-800 placeholder-gray-300"
              />
              {pregunta.obligatoria && (
                <span className="text-red-500 font-bold text-lg">*</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón de imagen */}
            {pregunta.imagen ? (
              <div className="relative group">
                <img
                  src={pregunta.imagen}
                  alt="Imagen de pregunta"
                  className="w-10 h-10 object-cover rounded border border-gray-300"
                />
                <button
                  onClick={onEliminarImagen}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={onAgregarImagen}
                className="p-2 hover:bg-gray-100 rounded-full"
                title="Agregar imagen"
              >
                <ImageIcon className="w-5 h-5 text-gray-500" />
              </button>
            )}

            {/* Selector de tipo */}
            <select
              value={pregunta.tipo}
              onChange={e => onUpdate('tipo', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:border-[#80c398] min-w-[180px]"
            >
              <option value="multiple_choice">Opción Múltiple</option>
              <option value="checkbox">Casillas de verificación</option>
              <option value="dropdown">Desplegable</option>
              <option value="short_text">Respuesta corta</option>
              <option value="long_text">Párrafo</option>
              <option value="scale">Escala (estrellas)</option>
            </select>
          </div>
        </div>

        {/* Imagen si existe */}
        {pregunta.imagen && (
          <div className="mb-4 ml-8">
            <img
              src={pregunta.imagen}
              alt="Imagen de pregunta"
              className="max-h-48 rounded border border-gray-200"
            />
          </div>
        )}

        {/* Opciones (solo para tipos de opción múltiple) */}
        {esOpcionMultiple && pregunta.opciones && (
          <div className="space-y-2 mb-4 ml-8">
            {pregunta.opciones.map((opcion, optIndex) => (
              <div key={opcion.id} className="flex items-center gap-3">
                <input
                  type={pregunta.tipo === 'checkbox' ? 'checkbox' : 'radio'}
                  disabled
                  className="w-4 h-4 text-[#80c398]"
                />
                <input
                  type="text"
                  value={opcion.texto}
                  onChange={e => onUpdateOpcion(opcion.id, e.target.value)}
                  placeholder={`Opción ${optIndex + 1}`}
                  className="flex-1 px-2 py-1 border-b border-gray-200 focus:border-[#80c398] focus:outline-none text-sm text-gray-700 placeholder-gray-300"
                />
                <button
                  onClick={() => onDeleteOpcion(opcion.id)}
                  className="p-1 hover:bg-red-50 rounded text-red-500"
                  title="Eliminar opción"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={onAddOpcion}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#80c398] ml-7"
            >
              <input type={pregunta.tipo === 'checkbox' ? 'checkbox' : 'radio'} disabled className="w-4 h-4" />
              Agregar una Opción
            </button>
          </div>
        )}

        {/* Preview para respuesta corta */}
        {pregunta.tipo === 'short_text' && (
          <div className="mb-4 ml-8">
            <input
              type="text"
              disabled
              placeholder="Texto con respuesta breve."
              className="w-full px-2 py-2 border-b border-gray-400 text-sm text-gray-400 bg-transparent"
            />
          </div>
        )}

        {/* Preview para párrafo */}
        {pregunta.tipo === 'long_text' && (
          <div className="mb-4 ml-8">
            <textarea
              disabled
              placeholder="Texto con respuesta larga."
              rows={2}
              className="w-full px-2 py-2 border-b border-gray-400 text-sm text-gray-400 bg-transparent resize-none"
            />
          </div>
        )}

        {/* Preview para escala con ESTRELLAS */}
        {pregunta.tipo === 'scale' && (
          <div className="mb-4 ml-8 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(num => (
              <Star
                key={num}
                className="w-8 h-8 text-gray-300 fill-gray-300 cursor-pointer hover:text-yellow-400 hover:fill-yellow-400 transition-colors"
              />
            ))}
          </div>
        )}

        {/* Footer: Acciones + Toggle Obligatoria */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center gap-1">
            <button
              onClick={onDuplicate}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
              title="Duplicar"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 hover:bg-red-50 rounded-full text-gray-600"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle Obligatoria - Estilo Configuración */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Obligatoria</span>
            <button
              onClick={() => onUpdate('obligatoria', !pregunta.obligatoria)}
              type="button"
              className="relative rounded-full transition-colors duration-300 focus:outline-none cursor-pointer shadow-inner"
              style={{
                width: '60px',
                height: '32px',
                backgroundColor: pregunta.obligatoria ? '#80c398' : '#d1d5db',
                padding: '4px'
              }}
            >
              <span
                className="absolute top-1 left-1 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out"
                style={{
                  width: '24px',
                  height: '24px',
                  transform: pregunta.obligatoria ? 'translateX(-26px)' : 'translateX(0)'
                }}
              />
            </button>
            {pregunta.obligatoria && (
              <span className="text-red-500 font-bold text-lg">*</span>
            )}
          </div>
        </div>
      </div>
    </div>
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
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Vista Previa: {plantilla.nombre || 'Sin título'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          <div className="bg-white rounded-lg border-t-4 border-t-[#80c398] p-6">
            <h1 className="text-2xl font-normal text-gray-800 mb-2">
              {plantilla.nombre || 'Sin título'}
            </h1>
            {plantilla.descripcion && (
              <p className="text-sm text-gray-600">{plantilla.descripcion}</p>
            )}
          </div>

          {plantilla.preguntas.map((p, index) => (
            <div key={p.id} className="bg-white rounded-lg p-6 shadow-sm">
              <p className="font-medium text-gray-800 mb-3">
                {index + 1}. {p.texto || 'Pregunta sin texto'}
                {p.obligatoria && <span className="text-red-500 ml-1 font-bold">*</span>}
              </p>

              {p.imagen && (
                <img src={p.imagen} alt="Imagen" className="max-h-32 rounded mb-3" />
              )}

              {p.tipo === 'multiple_choice' && p.opciones && (
                <div className="space-y-2 pl-6">
                  {p.opciones.map((opt) => (
                    <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" disabled className="w-4 h-4" />
                      <span className="text-sm text-gray-700">{opt.texto}</span>
                    </label>
                  ))}
                </div>
              )}

              {p.tipo === 'checkbox' && p.opciones && (
                <div className="space-y-2 pl-6">
                  {p.opciones.map((opt) => (
                    <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" disabled className="w-4 h-4" />
                      <span className="text-sm text-gray-700">{opt.texto}</span>
                    </label>
                  ))}
                </div>
              )}

              {p.tipo === 'short_text' && (
                <input type="text" disabled placeholder="Tu respuesta..." className="w-full px-2 py-2 border-b border-gray-400 text-sm" />
              )}

              {p.tipo === 'long_text' && (
                <textarea disabled placeholder="Tu respuesta..." rows={3} className="w-full px-2 py-2 border-b border-gray-400 text-sm resize-none" />
              )}

              {p.tipo === 'scale' && (
                <div className="flex items-center gap-1 pl-6">
                  {[1, 2, 3, 4, 5].map(num => (
                    <Star key={num} className="w-8 h-8 text-gray-300 fill-gray-300" />
                  ))}
                </div>
              )}
            </div>
          ))}

          {plantilla.preguntas.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay preguntas en esta encuesta
            </div>
          )}
        </div>

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