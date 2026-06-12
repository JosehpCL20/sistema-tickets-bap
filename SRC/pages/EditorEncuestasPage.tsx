// =============================================
// PÁGINA: EDITOR DE ENCUESTAS
// Con corrección de URLs de YouTube
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Eye, Save, Plus, Image as ImageIcon,
  Trash2, Copy, X, GripVertical, Layout,
  Video, AlignLeft, Star, CheckCircle, AlertTriangle,
  Palette, Type, Heading, Section, FileText, Link as LinkIcon,
  Send, Check
} from 'lucide-react';

// =============================================
// COLORES CORPORATIVOS
// =============================================
const COLORES_CORPORATIVOS = [
  { nombre: 'Rojo', valor: '#e84545' },
  { nombre: 'Amarillo', valor: '#ffdf6a' },
  { nombre: 'Gris', valor: '#818386' },
  { nombre: 'Verde', valor: '#73c59b' },
];

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
export default function EditorEncuestasPage() {
  const navigate = useNavigate();
  const { plantillaId } = useParams<{ plantillaId?: string }>();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  const [mostrarPaleta, setMostrarPaleta] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [bloqueActivoId, setBloqueActivoId] = useState<string | null>(null);

  const [plantilla, setPlantilla] = useState<PlantillaEncuesta>({
    nombre: '',
    descripcion: '',
    activa: true,
    color_principal: '#73c59b',
    preguntas: []
  });

  const colorPrincipal = plantilla.color_principal;

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
  // ACCIONES DE BLOQUES
  // =============================================
  const crearBloquePregunta = (): Pregunta => ({
    id: `preg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tipo_bloque: 'pregunta',
    texto: '',
    tipo: 'multiple_choice',
    obligatoria: false,
    orden: plantilla.preguntas.length,
    opciones: [
      { id: `opt_${Date.now()}_1`, texto: '' },
      { id: `opt_${Date.now()}_2`, texto: '' }
    ]
  });

  const crearBloqueSeccion = (): Pregunta => ({
    id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tipo_bloque: 'seccion',
    texto: '',
    descripcion: '',
    orden: plantilla.preguntas.length,
  });

  const crearBloqueTituloDescripcion = (): Pregunta => ({
    id: `td_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tipo_bloque: 'titulo_descripcion',
    texto: '',
    descripcion: '',
    orden: plantilla.preguntas.length,
  });

  // =============================================
  // FUNCIONES HELPER PARA YOUTUBE
  // =============================================
  const extraerVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\s?]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const convertirAEmbedUrl = (url: string): string => {
    const videoId = extraerVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };
  // =============================================

  const agregarPreguntaEnPosicion = (despuesDeId: string) => {
    const nuevo = crearBloquePregunta();
    const index = plantilla.preguntas.findIndex(p => p.id === despuesDeId);
    const nuevas = [...plantilla.preguntas];
    nuevas.splice(index + 1, 0, nuevo);
    setPlantilla({
      ...plantilla,
      preguntas: nuevas.map((p, i) => ({ ...p, orden: i }))
    });
    setBloqueActivoId(nuevo.id);
  };

  const agregarSeccionEnPosicion = (despuesDeId: string) => {
    const nuevo = crearBloqueSeccion();
    const index = plantilla.preguntas.findIndex(p => p.id === despuesDeId);
    const nuevas = [...plantilla.preguntas];
    nuevas.splice(index + 1, 0, nuevo);
    setPlantilla({
      ...plantilla,
      preguntas: nuevas.map((p, i) => ({ ...p, orden: i }))
    });
    setBloqueActivoId(nuevo.id);
  };

  const agregarTituloEnPosicion = (despuesDeId: string) => {
    const nuevo = crearBloqueTituloDescripcion();
    const index = plantilla.preguntas.findIndex(p => p.id === despuesDeId);
    const nuevas = [...plantilla.preguntas];
    nuevas.splice(index + 1, 0, nuevo);
    setPlantilla({
      ...plantilla,
      preguntas: nuevas.map((p, i) => ({ ...p, orden: i }))
    });
    setBloqueActivoId(nuevo.id);
  };

  const agregarImagenEnPosicion = (despuesDeId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const nuevo: Pregunta = {
            id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            tipo_bloque: 'titulo_descripcion',
            texto: '',
            descripcion: '',
            imagen: event.target?.result as string,
            orden: plantilla.preguntas.length,
          };
          const index = plantilla.preguntas.findIndex(p => p.id === despuesDeId);
          const nuevas = [...plantilla.preguntas];
          nuevas.splice(index + 1, 0, nuevo);
          setPlantilla({
            ...plantilla,
            preguntas: nuevas.map((p, i) => ({ ...p, orden: i }))
          });
          setBloqueActivoId(nuevo.id);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const agregarVideoEnPosicion = (despuesDeId: string) => {
    const url = prompt('Pega la URL del video de YouTube:');
    if (url) {
      const embedUrl = convertirAEmbedUrl(url);
      const nuevo: Pregunta = {
        id: `vid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tipo_bloque: 'titulo_descripcion',
        texto: '',
        descripcion: '',
        video: embedUrl,
        orden: plantilla.preguntas.length,
      };
      const index = plantilla.preguntas.findIndex(p => p.id === despuesDeId);
      const nuevas = [...plantilla.preguntas];
      nuevas.splice(index + 1, 0, nuevo);
      setPlantilla({
        ...plantilla,
        preguntas: nuevas.map((p, i) => ({ ...p, orden: i }))
      });
      setBloqueActivoId(nuevo.id);
    }
  };

  const agregarPregunta = () => {
    const nuevo = crearBloquePregunta();
    setPlantilla({
      ...plantilla,
      preguntas: [...plantilla.preguntas, nuevo]
    });
    setBloqueActivoId(nuevo.id);
  };

  const eliminarBloque = (id: string) => {
    const nuevas = plantilla.preguntas.filter(p => p.id !== id);
    setPlantilla({
      ...plantilla,
      preguntas: nuevas.map((p, i) => ({ ...p, orden: i }))
    });
    if (bloqueActivoId === id) setBloqueActivoId(null);
  };

  const duplicarBloque = (id: string) => {
    const original = plantilla.preguntas.find(p => p.id === id);
    if (!original) return;

    const duplicado: Pregunta = {
      ...original,
      id: `${original.tipo_bloque}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orden: plantilla.preguntas.length,
      opciones: original.opciones?.map(o => ({
        ...o,
        id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }))
    };

    const nuevas = [...plantilla.preguntas];
    const index = nuevas.findIndex(p => p.id === id);
    nuevas.splice(index + 1, 0, duplicado);

    setPlantilla({
      ...plantilla,
      preguntas: nuevas.map((p, i) => ({ ...p, orden: i }))
    });
    setBloqueActivoId(duplicado.id);
  };

  const actualizarBloque = (id: string, campo: keyof Pregunta, valor: any) => {
    const nuevas = plantilla.preguntas.map(p =>
      p.id === id ? { ...p, [campo]: valor } : p
    );
    setPlantilla({ ...plantilla, preguntas: nuevas });
  };

  // =============================================
  // DRAG AND DROP
  // =============================================
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
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

  const agregarImagenOpcion = (preguntaId: string, opcionId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const nuevas = plantilla.preguntas.map(p => {
            if (p.id === preguntaId) {
              return {
                ...p,
                opciones: p.opciones?.map(o =>
                  o.id === opcionId ? { ...o, imagen: event.target?.result as string } : o
                ) || []
              };
            }
            return p;
          });
          setPlantilla({ ...plantilla, preguntas: nuevas });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const eliminarImagenOpcion = (preguntaId: string, opcionId: string) => {
    const nuevas = plantilla.preguntas.map(p => {
      if (p.id === preguntaId) {
        return {
          ...p,
          opciones: p.opciones?.map(o =>
            o.id === opcionId ? { ...o, imagen: undefined } : o
          ) || []
        };
      }
      return p;
    });
    setPlantilla({ ...plantilla, preguntas: nuevas });
  };

  const handleAgregarImagen = (preguntaId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          actualizarBloque(preguntaId, 'imagen', event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleAgregarVideo = (preguntaId: string) => {
    const url = prompt('Pega la URL del video de YouTube:');
    if (url) {
      const embedUrl = convertirAEmbedUrl(url);
      actualizarBloque(preguntaId, 'video', embedUrl);
    }
  };

  const handleEliminarImagen = (preguntaId: string) => {
    actualizarBloque(preguntaId, 'imagen', undefined);
  };

  const handleEliminarVideo = (preguntaId: string) => {
    actualizarBloque(preguntaId, 'video', undefined);
  };

  const obtenerNumeroSeccion = (index: number): number => {
    let contador = 0;
    for (let i = 0; i <= index; i++) {
      if (plantilla.preguntas[i].tipo_bloque === 'seccion') {
        contador++;
      }
    }
    return contador;
  };

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
      const p = plantilla.preguntas[i];
      if (p.tipo_bloque === 'pregunta' && !p.texto.trim()) {
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
              <span className="text-sm text-gray-600 hidden sm:inline">Vista previa</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setMostrarPaleta(!mostrarPaleta)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                title="Cambiar color"
              >
                <Palette className="w-5 h-5" style={{ color: colorPrincipal }} />
              </button>
              {mostrarPaleta && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-30 min-w-[180px]">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Color principal</p>
                  <div className="flex gap-2">
                    {COLORES_CORPORATIVOS.map(c => (
                      <button
                        key={c.valor}
                        onClick={() => {
                          setPlantilla({ ...plantilla, color_principal: c.valor });
                          setMostrarPaleta(false);
                        }}
                        className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                        style={{
                          backgroundColor: c.valor,
                          borderColor: colorPrincipal === c.valor ? '#1f2937' : 'transparent'
                        }}
                        title={c.nombre}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleGuardar}
              disabled={guardando}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-white font-medium disabled:opacity-50 hover:shadow-md transition-all"
              style={{ backgroundColor: colorPrincipal }}
            >
              <Save className="w-5 h-5" />
              Guardar
            </button>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div style={{
        paddingTop: '50px',
        paddingBottom: '80px',
        backgroundColor: '#f3f4f6',
        minHeight: '100vh'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 16px' }}>

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
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4" style={{ borderTop: `4px solid ${colorPrincipal}` }}>
            <input
              type="text"
              value={plantilla.nombre}
              onChange={e => setPlantilla({ ...plantilla, nombre: e.target.value })}
              placeholder="Título del formulario"
              className="w-full px-0 py-2 border-b border-gray-200 focus:outline-none text-3xl font-normal text-gray-800 placeholder-gray-300 mb-2"
              onFocus={(e) => e.target.style.borderBottomColor = colorPrincipal}
              onBlur={(e) => e.target.style.borderBottomColor = '#e5e7eb'}
            />
            <textarea
              value={plantilla.descripcion}
              onChange={e => setPlantilla({ ...plantilla, descripcion: e.target.value })}
              placeholder="Descripción del formulario"
              rows={1}
              className="w-full px-0 py-2 border-b border-gray-200 focus:outline-none text-sm text-gray-600 placeholder-gray-300 resize-none"
              onFocus={(e) => e.target.style.borderBottomColor = colorPrincipal}
              onBlur={(e) => e.target.style.borderBottomColor = '#e5e7eb'}
            />
          </div>

          {plantilla.preguntas.length === 0 && (
            <BarraFlotanteHerramientas
              colorPrincipal={colorPrincipal}
              onAgregarPregunta={agregarPregunta}
            />
          )}

          {plantilla.preguntas.map((bloque, index) => (
            <React.Fragment key={bloque.id}>
              <BloqueCard
                bloque={bloque}
                index={index}
                numeroSeccion={obtenerNumeroSeccion(index)}
                esActivo={bloqueActivoId === bloque.id}
                colorPrincipal={colorPrincipal}
                onActivar={() => setBloqueActivoId(bloque.id)}
                onUpdate={(campo, valor) => actualizarBloque(bloque.id, campo, valor)}
                onDelete={() => eliminarBloque(bloque.id)}
                onDuplicate={() => duplicarBloque(bloque.id)}
                onAddOpcion={() => agregarOpcion(bloque.id)}
                onDeleteOpcion={(optId) => eliminarOpcion(bloque.id, optId)}
                onUpdateOpcion={(optId, texto) => actualizarOpcion(bloque.id, optId, texto)}
                onAgregarImagenOpcion={(optId) => agregarImagenOpcion(bloque.id, optId)}
                onEliminarImagenOpcion={(optId) => eliminarImagenOpcion(bloque.id, optId)}
                onAgregarImagen={() => handleAgregarImagen(bloque.id)}
                onAgregarVideo={() => handleAgregarVideo(bloque.id)}
                onEliminarImagen={() => handleEliminarImagen(bloque.id)}
                onEliminarVideo={() => handleEliminarVideo(bloque.id)}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                isDragging={dragIndex === index}
              />
              {bloqueActivoId === bloque.id && (
                <BarraFlotanteHerramientas
                  colorPrincipal={colorPrincipal}
                  onAgregarPregunta={() => agregarPreguntaEnPosicion(bloque.id)}
                  onAgregarSeccion={() => agregarSeccionEnPosicion(bloque.id)}
                  onAgregarTitulo={() => agregarTituloEnPosicion(bloque.id)}
                  onAgregarImagen={() => agregarImagenEnPosicion(bloque.id)}
                  onAgregarVideo={() => agregarVideoEnPosicion(bloque.id)}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

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
// COMPONENTE: BARRA FLOTANTE DE HERRAMIENTAS
// =============================================
function BarraFlotanteHerramientas({
  colorPrincipal,
  onAgregarPregunta,
  onAgregarSeccion,
  onAgregarTitulo,
  onAgregarImagen,
  onAgregarVideo
}: {
  colorPrincipal: string;
  onAgregarPregunta: () => void;
  onAgregarSeccion?: () => void;
  onAgregarTitulo?: () => void;
  onAgregarImagen?: () => void;
  onAgregarVideo?: () => void;
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const esBarraSimple = !onAgregarSeccion;

  if (esBarraSimple) {
    return (
      <div className="flex justify-center mb-4">
        <button
          onClick={onAgregarPregunta}
          className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-white hover:scale-110"
          style={{ backgroundColor: colorPrincipal }}
          title="Agregar pregunta"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center mb-4 relative">
      <div className="bg-white rounded-full shadow-lg border border-gray-200 flex items-center px-2 py-1 gap-1">
        <button
          onClick={onAgregarPregunta}
          className="w-10 h-10 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center"
          style={{ color: colorPrincipal }}
          title="Agregar pregunta"
        >
          <Plus className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-gray-200" />

        <button
          onClick={onAgregarTitulo}
          className="w-10 h-10 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-600"
          title="Agregar título y descripción"
        >
          <AlignLeft className="w-5 h-5" />
        </button>

        <button
          onClick={onAgregarImagen}
          className="w-10 h-10 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-600"
          title="Agregar imagen"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        <button
          onClick={onAgregarVideo}
          className="w-10 h-10 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-600"
          title="Agregar video"
        >
          <Video className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-gray-200" />

        <div className="relative">
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="w-10 h-10 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-600"
            title="Más opciones"
          >
            <Section className="w-5 h-5" />
          </button>
          {menuAbierto && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-30 min-w-[180px]">
              <button
                onClick={() => {
                  onAgregarSeccion?.();
                  setMenuAbierto(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: `${colorPrincipal}20` }}>
                  <Section className="w-4 h-4" style={{ color: colorPrincipal }} />
                </div>
                <span className="text-sm text-gray-700 font-medium">Agregar sección</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================
// COMPONENTE: TARJETA DE BLOQUE
// =============================================
function BloqueCard({
  bloque,
  index,
  numeroSeccion,
  esActivo,
  colorPrincipal,
  onActivar,
  onUpdate,
  onDelete,
  onDuplicate,
  onAddOpcion,
  onDeleteOpcion,
  onUpdateOpcion,
  onAgregarImagenOpcion,
  onEliminarImagenOpcion,
  onAgregarImagen,
  onAgregarVideo,
  onEliminarImagen,
  onEliminarVideo,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging
}: {
  bloque: Pregunta;
  index: number;
  numeroSeccion: number;
  esActivo: boolean;
  colorPrincipal: string;
  onActivar: () => void;
  onUpdate: (campo: keyof Pregunta, valor: any) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddOpcion: () => void;
  onDeleteOpcion: (optId: string) => void;
  onUpdateOpcion: (optId: string, texto: string) => void;
  onAgregarImagenOpcion: (optId: string) => void;
  onEliminarImagenOpcion: (optId: string) => void;
  onAgregarImagen: () => void;
  onAgregarVideo: () => void;
  onEliminarImagen: () => void;
  onEliminarVideo: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  // Si es una SECCIÓN
  if (bloque.tipo_bloque === 'seccion') {
    return esActivo ? (
      <div
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onClick={onActivar}
        className={`bg-white rounded-lg shadow-sm border border-gray-200 relative transition-all mb-4 ${
          isDragging ? 'opacity-50' : ''
        }`}
        style={{ borderLeft: `4px solid ${colorPrincipal}` }}
      >
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="pt-3 cursor-grab active:cursor-grabbing" title="Arrastra para reordenar">
              <GripVertical className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Sección {numeroSeccion}</p>
              <input
                type="text"
                value={bloque.texto}
                onChange={e => onUpdate('texto', e.target.value)}
                placeholder="Título de la sección"
                className="w-full px-0 py-2 border-b border-gray-200 focus:outline-none text-xl font-medium text-gray-800 placeholder-gray-300 mb-2"
                onFocus={(e) => e.target.style.borderBottomColor = colorPrincipal}
                onBlur={(e) => e.target.style.borderBottomColor = '#e5e7eb'}
              />
              <textarea
                value={bloque.descripcion || ''}
                onChange={e => onUpdate('descripcion', e.target.value)}
                placeholder="Descripción de la sección (opcional)"
                rows={2}
                className="w-full px-0 py-2 border-b border-gray-200 focus:outline-none text-sm text-gray-600 placeholder-gray-300 resize-none"
                onFocus={(e) => e.target.style.borderBottomColor = colorPrincipal}
                onBlur={(e) => e.target.style.borderBottomColor = '#e5e7eb'}
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="p-2 hover:bg-gray-100 rounded-full text-gray-600" title="Duplicar">
                <Copy className="w-4 h-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 hover:bg-red-50 rounded-full text-gray-600" title="Eliminar">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onClick={onActivar}
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4 cursor-pointer hover:shadow-md transition-shadow ${
          isDragging ? 'opacity-50' : ''
        }`}
        style={{ borderBottom: `2px solid ${colorPrincipal}` }}
      >
        <div className="flex items-start gap-3">
          <div className="pt-1 cursor-grab" onClick={(e) => e.stopPropagation()}>
            <GripVertical className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Sección {numeroSeccion}</p>
            <h3 className="text-xl font-medium text-gray-800">
              {bloque.texto || <span className="text-gray-300 italic">Sección sin título</span>}
            </h3>
            {bloque.descripcion && (
              <p className="text-sm text-gray-600 mt-1">{bloque.descripcion}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Si es TÍTULO Y DESCRIPCIÓN
  if (bloque.tipo_bloque === 'titulo_descripcion') {
    return esActivo ? (
      <div
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onClick={onActivar}
        className={`bg-white rounded-lg shadow-sm border border-gray-200 relative transition-all mb-4 ${
          isDragging ? 'opacity-50' : ''
        }`}
        style={{ borderLeft: `4px solid ${colorPrincipal}` }}
      >
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="pt-3 cursor-grab active:cursor-grabbing" title="Arrastra para reordenar">
              <GripVertical className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={bloque.texto}
                onChange={e => onUpdate('texto', e.target.value)}
                placeholder="Título"
                className="w-full px-0 py-2 border-b border-gray-200 focus:outline-none text-xl font-medium text-gray-800 placeholder-gray-300 mb-2"
                onFocus={(e) => e.target.style.borderBottomColor = colorPrincipal}
                onBlur={(e) => e.target.style.borderBottomColor = '#e5e7eb'}
              />
              <textarea
                value={bloque.descripcion || ''}
                onChange={e => onUpdate('descripcion', e.target.value)}
                placeholder="Descripción (opcional)"
                rows={2}
                className="w-full px-0 py-2 border-b border-gray-200 focus:outline-none text-sm text-gray-600 placeholder-gray-300 resize-none"
                onFocus={(e) => e.target.style.borderBottomColor = colorPrincipal}
                onBlur={(e) => e.target.style.borderBottomColor = '#e5e7eb'}
              />
              {bloque.imagen && (
                <div className="mt-3 relative group">
                  <img src={bloque.imagen} alt="" className="max-h-48 rounded" />
                  <button
                    onClick={(e) => { e.stopPropagation(); onEliminarImagen(); }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {bloque.video && (
                <div className="mt-3 relative group">
                  <iframe src={bloque.video} className="w-full h-48 rounded" allowFullScreen />
                  <button
                    onClick={(e) => { e.stopPropagation(); onEliminarVideo(); }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="p-2 hover:bg-gray-100 rounded-full text-gray-600" title="Duplicar">
                <Copy className="w-4 h-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 hover:bg-red-50 rounded-full text-gray-600" title="Eliminar">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onClick={onActivar}
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4 cursor-pointer hover:shadow-md transition-shadow ${
          isDragging ? 'opacity-50' : ''
        }`}
        style={{ borderLeft: `4px solid ${colorPrincipal}` }}
      >
        <div className="flex items-start gap-3">
          <div className="pt-1 cursor-grab" onClick={(e) => e.stopPropagation()}>
            <GripVertical className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-medium text-gray-800">
              {bloque.texto || <span className="text-gray-300 italic">Título sin contenido</span>}
            </h3>
            {bloque.descripcion && (
              <p className="text-sm text-gray-600 mt-1">{bloque.descripcion}</p>
            )}
            {bloque.imagen && <img src={bloque.imagen} alt="" className="max-h-32 rounded mt-2" />}
          </div>
        </div>
      </div>
    );
  }

  // Si es PREGUNTA
  const esOpcionMultiple = bloque.tipo === 'multiple_choice' || bloque.tipo === 'checkbox' || bloque.tipo === 'dropdown';

  if (esActivo) {
    return (
      <div
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onClick={onActivar}
        className={`bg-white rounded-lg shadow-sm border border-gray-200 relative transition-all mb-4 ${
          isDragging ? 'opacity-50' : ''
        }`}
        style={{ borderLeft: `4px solid ${colorPrincipal}` }}
      >
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="pt-3 cursor-grab active:cursor-grabbing" title="Arrastra para reordenar">
              <GripVertical className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={bloque.texto}
                  onChange={e => onUpdate('texto', e.target.value)}
                  placeholder="Escribe tu pregunta aquí"
                  className="flex-1 px-0 py-2 border-b border-gray-200 focus:outline-none text-base text-gray-800 placeholder-gray-300"
                  onFocus={(e) => e.target.style.borderBottomColor = colorPrincipal}
                  onBlur={(e) => e.target.style.borderBottomColor = '#e5e7eb'}
                />
                {bloque.obligatoria && (
                  <span className="text-red-500 font-bold text-lg">*</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {bloque.imagen ? (
                <div className="relative group">
                  <img
                    src={bloque.imagen}
                    alt="Imagen de pregunta"
                    className="w-10 h-10 object-cover rounded border border-gray-300"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); onEliminarImagen(); }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onAgregarImagen(); }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  title="Agregar imagen a la pregunta"
                >
                  <ImageIcon className="w-5 h-5 text-gray-500" />
                </button>
              )}

              <select
                value={bloque.tipo}
                onChange={e => onUpdate('tipo', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none min-w-[180px]"
                onFocus={(e) => e.target.style.borderColor = colorPrincipal}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
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

          {bloque.imagen && (
            <div className="mb-4 ml-8 relative group">
              <img src={bloque.imagen} alt="" className="max-h-48 rounded border border-gray-200" />
              <button
                onClick={(e) => { e.stopPropagation(); onEliminarImagen(); }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {bloque.video && (
            <div className="mb-4 ml-8 relative group">
              <iframe src={bloque.video} className="w-full max-h-64 rounded border border-gray-200" allowFullScreen />
              <button
                onClick={(e) => { e.stopPropagation(); onEliminarVideo(); }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {esOpcionMultiple && bloque.opciones && (
            <div className="space-y-2 mb-4 ml-8">
              {bloque.opciones.map((opcion, optIndex) => (
                <div key={opcion.id} className="flex items-center gap-3 group">
                  <input
                    type={bloque.tipo === 'checkbox' ? 'checkbox' : 'radio'}
                    disabled
                    className="w-4 h-4"
                    style={{ accentColor: colorPrincipal }}
                  />
                  <input
                    type="text"
                    value={opcion.texto}
                    onChange={e => onUpdateOpcion(opcion.id, e.target.value)}
                    placeholder={`Opción ${optIndex + 1}`}
                    className="flex-1 px-2 py-1 border-b border-gray-200 focus:outline-none text-sm text-gray-700 placeholder-gray-300"
                    onFocus={(e) => e.target.style.borderBottomColor = colorPrincipal}
                    onBlur={(e) => e.target.style.borderBottomColor = '#e5e7eb'}
                  />
                  {opcion.imagen ? (
                    <div className="relative group/img">
                      <img src={opcion.imagen} alt="" className="w-10 h-10 object-cover rounded border border-gray-300" />
                      <button
                        onClick={(e) => { e.stopPropagation(); onEliminarImagenOpcion(opcion.id); }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); onAgregarImagenOpcion(opcion.id); }}
                      className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Agregar imagen a esta opción"
                    >
                      <ImageIcon className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteOpcion(opcion.id); }}
                    className="p-1 hover:bg-red-50 rounded text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar opción"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={(e) => { e.stopPropagation(); onAddOpcion(); }}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 ml-7"
              >
                <input type={bloque.tipo === 'checkbox' ? 'checkbox' : 'radio'} disabled className="w-4 h-4" />
                Agregar opción
              </button>
            </div>
          )}

          {bloque.tipo === 'short_text' && (
            <div className="mb-4 ml-8">
              <input type="text" disabled placeholder="Respuesta corta" className="w-full px-2 py-2 border-b border-gray-400 text-sm text-gray-400 bg-transparent" />
            </div>
          )}

          {bloque.tipo === 'long_text' && (
            <div className="mb-4 ml-8">
              <textarea disabled placeholder="Respuesta larga" rows={2} className="w-full px-2 py-2 border-b border-gray-400 text-sm text-gray-400 bg-transparent resize-none" />
            </div>
          )}

          {bloque.tipo === 'scale' && (
            <div className="mb-4 ml-8 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(num => (
                <Star
                  key={num}
                  className="w-8 h-8 cursor-pointer transition-colors"
                  style={{ color: '#d1d5db', fill: '#d1d5db' }}
                  onMouseEnter={(e) => { 
                    e.currentTarget.style.color = colorPrincipal; 
                    e.currentTarget.style.fill = colorPrincipal; 
                  }}
                  onMouseLeave={(e) => { 
                    e.currentTarget.style.color = '#d1d5db'; 
                    e.currentTarget.style.fill = '#d1d5db'; 
                  }}
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="p-2 hover:bg-gray-100 rounded-full text-gray-600" title="Duplicar">
                <Copy className="w-4 h-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 hover:bg-red-50 rounded-full text-gray-600" title="Eliminar">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Obligatoria</span>
              <button
                onClick={(e) => { e.stopPropagation(); onUpdate('obligatoria', !bloque.obligatoria); }}
                type="button"
                className="relative rounded-full transition-colors duration-300 focus:outline-none cursor-pointer shadow-inner"
                style={{
                  width: '60px',
                  height: '32px',
                  backgroundColor: bloque.obligatoria ? colorPrincipal : '#d1d5db',
                  padding: '4px'
                }}
              >
                <span
                  className="absolute top-1 left-1 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out"
                  style={{
                    width: '24px',
                    height: '24px',
                    transform: bloque.obligatoria ? 'translateX(26px)' : 'translateX(0)'
                  }}
                />
              </button>
              {bloque.obligatoria && (
                <span className="text-red-500 font-bold text-lg">*</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VISTA PREVIA DE LA PREGUNTA
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onClick={onActivar}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4 cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={{ borderLeft: `4px solid ${colorPrincipal}` }}
    >
      <div className="flex items-start gap-3">
        <div className="pt-1 cursor-grab" onClick={(e) => e.stopPropagation()}>
          <GripVertical className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-800 mb-3">
            {bloque.texto || <span className="text-gray-300 italic">Pregunta sin texto</span>}
            {bloque.obligatoria && <span className="text-red-500 ml-1 font-bold">*</span>}
          </p>

          {bloque.imagen && (
            <img src={bloque.imagen} alt="" className="max-h-32 rounded mb-3" />
          )}

          {bloque.tipo === 'multiple_choice' && bloque.opciones && (
            <div className="space-y-2 pl-6">
              {bloque.opciones.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2">
                  <input type="radio" disabled className="w-4 h-4" style={{ accentColor: colorPrincipal }} />
                  <span className="text-sm text-gray-700">{opt.texto || 'Opción vacía'}</span>
                  {opt.imagen && <img src={opt.imagen} alt="" className="w-8 h-8 object-cover rounded" />}
                </label>
              ))}
            </div>
          )}

          {bloque.tipo === 'checkbox' && bloque.opciones && (
            <div className="space-y-2 pl-6">
              {bloque.opciones.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2">
                  <input type="checkbox" disabled className="w-4 h-4" style={{ accentColor: colorPrincipal }} />
                  <span className="text-sm text-gray-700">{opt.texto || 'Opción vacía'}</span>
                  {opt.imagen && <img src={opt.imagen} alt="" className="w-8 h-8 object-cover rounded" />}
                </label>
              ))}
            </div>
          )}

          {bloque.tipo === 'dropdown' && bloque.opciones && (
            <select disabled className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50">
              <option>Seleccionar...</option>
              {bloque.opciones.map((opt) => (
                <option key={opt.id}>{opt.texto || 'Opción vacía'}</option>
              ))}
            </select>
          )}

          {bloque.tipo === 'short_text' && (
            <input type="text" disabled placeholder="Tu respuesta..." className="w-full px-2 py-2 border-b border-gray-400 text-sm" />
          )}

          {bloque.tipo === 'long_text' && (
            <textarea disabled placeholder="Tu respuesta..." rows={3} className="w-full px-2 py-2 border-b border-gray-400 text-sm resize-none" />
          )}

          {bloque.tipo === 'scale' && (
            <div className="flex items-center gap-1 pl-6">
              {[1, 2, 3, 4, 5].map(num => (
                <Star key={num} className="w-8 h-8 text-gray-300 fill-gray-300" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================
// COMPONENTE: MODAL VISTA PREVIA INTERACTIVA
// =============================================
function ModalVistaPrevia({
  plantilla,
  onClose
}: {
  plantilla: PlantillaEncuesta;
  onClose: () => void;
}) {
  const color = plantilla.color_principal || '#73c59b';
  const [respuestas, setRespuestas] = useState<Record<string, any>>({});
  const [enviado, setEnviado] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const obtenerNumeroSeccionPreview = (index: number): number => {
    let contador = 0;
    for (let i = 0; i <= index; i++) {
      if (plantilla.preguntas[i].tipo_bloque === 'seccion') {
        contador++;
      }
    }
    return contador;
  };

  const actualizarRespuesta = (preguntaId: string, valor: any) => {
    setRespuestas(prev => ({ ...prev, [preguntaId]: valor }));
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

  const handleEnviar = () => {
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
      return;
    }

    setEnviado(true);
    console.log('Respuestas enviadas:', respuestas);
  };

  const handleLimpiar = () => {
    setRespuestas({});
    setErrores({});
    setEnviado(false);
  };

  if (enviado) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-8 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${color}30` }}>
            <Check className="w-10 h-10" style={{ color }} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Respuestas enviadas!</h2>
          <p className="text-gray-600 mb-6">Tus respuestas han sido registradas correctamente.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleLimpiar}
              className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Enviar otra respuesta
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-white"
              style={{ backgroundColor: color }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-800">Vista previa interactiva</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          <div className="bg-white rounded-lg p-6" style={{ borderTop: `4px solid ${color}` }}>
            <h1 className="text-2xl font-normal text-gray-800 mb-2">
              {plantilla.nombre || 'Sin título'}
            </h1>
            {plantilla.descripcion && (
              <p className="text-sm text-gray-600">{plantilla.descripcion}</p>
            )}
            <p className="text-xs text-gray-400 mt-3">
              * indica que la pregunta es obligatoria
            </p>
          </div>

          {plantilla.preguntas.map((p, index) => {
            if (p.tipo_bloque === 'seccion') {
              return (
                <div key={p.id} className="bg-white rounded-lg p-6" style={{ borderBottom: `2px solid ${color}` }}>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Sección {obtenerNumeroSeccionPreview(index)}</p>
                  <h3 className="text-xl font-medium text-gray-800">{p.texto || 'Sección sin título'}</h3>
                  {p.descripcion && <p className="text-sm text-gray-600 mt-1">{p.descripcion}</p>}
                </div>
              );
            }
            if (p.tipo_bloque === 'titulo_descripcion') {
              return (
                <div key={p.id} className="bg-white rounded-lg p-6" style={{ borderLeft: `4px solid ${color}` }}>
                  <h3 className="text-xl font-medium text-gray-800">{p.texto || 'Título'}</h3>
                  {p.descripcion && <p className="text-sm text-gray-600 mt-1">{p.descripcion}</p>}
                  {p.imagen && <img src={p.imagen} alt="" className="max-h-40 rounded mt-2" />}
                  {p.video && <iframe src={p.video} className="w-full h-48 rounded mt-2" allowFullScreen />}
                </div>
              );
            }
            
            const tieneError = !!errores[p.id];
            return (
              <div
                key={p.id}
                className={`bg-white rounded-lg p-6 shadow-sm transition-all ${tieneError ? 'ring-2 ring-red-400' : ''}`}
                style={{ borderLeft: `4px solid ${tieneError ? '#e84545' : color}` }}
              >
                <p className="font-medium text-gray-800 mb-3">
                  {p.texto || 'Pregunta sin texto'}
                  {p.obligatoria && <span className="text-red-500 ml-1 font-bold">*</span>}
                </p>
                {tieneError && (
                  <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errores[p.id]}
                  </p>
                )}

                {p.imagen && <img src={p.imagen} alt="" className="max-h-40 rounded mb-3" />}

                {p.tipo === 'multiple_choice' && p.opciones && (
                  <div className="space-y-2">
                    {p.opciones.map((opt) => (
                      <label key={opt.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="radio"
                          name={p.id}
                          checked={respuestas[p.id] === opt.id}
                          onChange={() => actualizarRespuesta(p.id, opt.id)}
                          className="w-4 h-4"
                          style={{ accentColor: color }}
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm text-gray-700">{opt.texto}</span>
                          {opt.imagen && <img src={opt.imagen} alt="" className="w-12 h-12 object-cover rounded" />}
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {p.tipo === 'checkbox' && p.opciones && (
                  <div className="space-y-2">
                    {p.opciones.map((opt) => (
                      <label key={opt.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={((respuestas[p.id] as string[]) || []).includes(opt.id)}
                          onChange={() => toggleCheckbox(p.id, opt.id)}
                          className="w-4 h-4"
                          style={{ accentColor: color }}
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm text-gray-700">{opt.texto}</span>
                          {opt.imagen && <img src={opt.imagen} alt="" className="w-12 h-12 object-cover rounded" />}
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {p.tipo === 'dropdown' && p.opciones && (
                  <select
                    value={respuestas[p.id] || ''}
                    onChange={(e) => actualizarRespuesta(p.id, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none min-w-[200px]"
                    style={{ borderColor: tieneError ? '#e84545' : '#d1d5db' }}
                    onFocus={(e) => e.target.style.borderColor = color}
                    onBlur={(e) => e.target.style.borderColor = tieneError ? '#e84545' : '#d1d5db'}
                  >
                    <option value="">Seleccionar...</option>
                    {p.opciones.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.texto}</option>
                    ))}
                  </select>
                )}

                {p.tipo === 'short_text' && (
                  <input
                    type="text"
                    value={respuestas[p.id] || ''}
                    onChange={(e) => actualizarRespuesta(p.id, e.target.value)}
                    placeholder="Tu respuesta..."
                    className="w-full px-2 py-2 border-b-2 bg-transparent focus:outline-none text-sm"
                    style={{ borderBottomColor: tieneError ? '#e84545' : '#d1d5db' }}
                    onFocus={(e) => e.target.style.borderBottomColor = color}
                    onBlur={(e) => e.target.style.borderBottomColor = tieneError ? '#e84545' : '#d1d5db'}
                  />
                )}

                {p.tipo === 'long_text' && (
                  <textarea
                    value={respuestas[p.id] || ''}
                    onChange={(e) => actualizarRespuesta(p.id, e.target.value)}
                    placeholder="Tu respuesta..."
                    rows={3}
                    className="w-full px-2 py-2 border-2 rounded-md bg-transparent focus:outline-none text-sm resize-none"
                    style={{ borderColor: tieneError ? '#e84545' : '#d1d5db' }}
                    onFocus={(e) => e.target.style.borderColor = color}
                    onBlur={(e) => e.target.style.borderColor = tieneError ? '#e84545' : '#d1d5db'}
                  />
                )}

                {p.tipo === 'scale' && (
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(num => (
                      <Star
                        key={num}
                        onClick={() => actualizarRespuesta(p.id, num)}
                        className="w-10 h-10 cursor-pointer transition-colors"
                        style={{
                          color: (respuestas[p.id] || 0) >= num ? color : '#d1d5db',
                          fill: (respuestas[p.id] || 0) >= num ? color : '#d1d5db'
                        }}
                      />
                    ))}
                    {respuestas[p.id] && (
                      <span className="ml-2 text-sm text-gray-600">{respuestas[p.id]}/5</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {plantilla.preguntas.length === 0 && (
            <div className="text-center py-8 text-gray-500">No hay preguntas en esta encuesta</div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-between bg-gray-50">
          <button
            onClick={handleLimpiar}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Borrar respuestas
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Cerrar
            </button>
            <button
              onClick={handleEnviar}
              className="px-5 py-2 rounded-lg text-white flex items-center gap-2 hover:shadow-md transition-all"
              style={{ backgroundColor: color }}
            >
              <Send className="w-4 h-4" />
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}