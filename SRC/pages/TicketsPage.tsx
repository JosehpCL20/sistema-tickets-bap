// =============================================
// PÁGINA: MIS TICKETS
// Sistema de Gestión de Tickets - Banco de Alimentos Perú
// =============================================

import React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTicketStore } from '../store/ticketStore';
import { 
  PlusCircle, Search, Filter, ChevronLeft, ChevronRight, 
  Clock, User, Calendar, CheckCircle, Ticket
} from 'lucide-react';

export default function TicketsPage() {
  const navigate = useNavigate();
  const { usuarioActual } = useAuthStore();
  const ticketStore = useTicketStore();
  
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const filasPorPagina = 15;

  useEffect(() => {
    const cargarTickets = async () => {
      if (usuarioActual) {
        try {
          await ticketStore.cargarTickets();
        } catch (error) {
          console.error('Error cargando tickets:', error);
        } finally {
          setCargando(false);
        }
      } else {
        setCargando(false);
      }
    };
    cargarTickets();
  }, [usuarioActual]);

  const misTickets = useMemo(() => {
    if (!usuarioActual?.id) return [];
    return ticketStore.obtenerTicketsPorUsuario?.(usuarioActual.id) || [];
  }, [ticketStore.tickets, usuarioActual]);

  const ticketsFiltrados = useMemo(() => {
    return misTickets.filter((ticket: any) => {
      if (filtroEstado !== 'todos' && ticket.estado !== filtroEstado) return false;
      if (busqueda && !ticket.titulo.toLowerCase().includes(busqueda.toLowerCase())) return false;
      return true;
    });
  }, [misTickets, busqueda, filtroEstado]);

  const totalPaginas = Math.ceil(ticketsFiltrados.length / filasPorPagina);
  const inicio = (pagina - 1) * filasPorPagina;
  const ticketsPagina = ticketsFiltrados.slice(inicio, inicio + filasPorPagina);

  const calcularTiempoResolucion = (ticket: any): string => {
    if (!ticket.fechaResolucion && !ticket.fechaCierre) return '-';
    if (ticket.estado !== 'resuelto' && ticket.estado !== 'cerrado') return '-';
    
    const inicio = new Date(ticket.fechaCreacion).getTime();
    const fin = new Date(ticket.fechaResolucion || ticket.fechaCierre).getTime();
    
    if (!inicio || !fin || isNaN(fin) || fin <= inicio) return '-';
    
    const diffMs = fin - inicio;
    const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (dias > 0) return `${dias}d ${horas}h`;
    if (horas > 0) return `${horas}h ${mins}m`;
    return `${mins}m`;
  };

  const getEstadoColor = (estado: string) => {
    const colores: Record<string, string> = {
      'nuevo': 'bg-yellow-100 text-yellow-700',
      'asignado': 'bg-blue-100 text-blue-700',
      'planificado': 'bg-purple-100 text-purple-700',
      'resuelto': 'bg-green-100 text-green-700',
      'cerrado': 'bg-gray-100 text-gray-700'
    };
    return colores[estado] || 'bg-gray-100 text-gray-700';
  };

  // ✅ FORMATEAR FECHA - HORA LIMA (SIN RESTRICCIÓN DE AÑO 1970)
  const formatearFecha = (fecha: any): string => {
    if (!fecha || fecha === '' || fecha === null || fecha === undefined) {
      return '-';
    }
    const date = new Date(fecha);
    // ✅ Solo validar si es fecha inválida (NaN), NO bloquear por año
    if (isNaN(date.getTime())) {
      return '-';
    }
    return new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  };

  const getNombreTecnico = (tecnicoId: string | null) => {
    if (!tecnicoId) return 'Sin asignar';
    const tecnico = useAuthStore.getState().obtenerUsuarioPorId(tecnicoId);
    return tecnico ? `${tecnico.nombre} ${tecnico.apellidos}` : 'Sin asignar';
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
          <p className="text-gray-500">Cargando tus tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis Tickets</h1>
          <p className="text-gray-500 mt-1">Gestiona y da seguimiento a tus solicitudes</p>
        </div>
        <button
          onClick={() => navigate('/tickets/nuevo')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium transition-colors"
          style={{ backgroundColor: '#80c398' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6ab088'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#80c398'}
        >
          <PlusCircle className="w-5 h-5" />
          Nuevo Ticket
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por título..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none"
                style={{ '--tw-ring-color': '#80c398' } as any}
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:outline-none bg-white"
              style={{ '--tw-ring-color': '#80c398' } as any}
            >
              <option value="todos">Todos los estados</option>
              <option value="nuevo">Nuevo</option>
              <option value="asignado">Asignado</option>
              <option value="planificado">Planificado</option>
              <option value="resuelto">Resuelto</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200" style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Título</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Última Modificación</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Fecha de Inicio</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Fecha de Cierre</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Tiempo de Resolución</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Técnico Asignado</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ticketsPagina.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    <Ticket className="w-12 h-12 mx-auto mb-3" style={{ color: '#80c398' }} />
                    <p>No hay tickets para mostrar</p>
                    <button onClick={() => navigate('/tickets/nuevo')} className="mt-4 font-medium" style={{ color: '#ea4c5b' }}>
                      Crear mi primer ticket
                    </button>
                  </td>
                </tr>
              ) : (
                ticketsPagina.map((ticket: any) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/tickets/${String(ticket.id)}`)}>
                    <td className="px-4 py-3"><span className="font-mono text-sm text-gray-600">#{String(ticket.id || 0).padStart(4, '0')}</span></td>
                    <td className="px-4 py-3"><span className="font-medium hover:underline" style={{ color: '#ea4c5b' }}>{ticket.titulo}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatearFecha(ticket.fechaModificacion)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatearFecha(ticket.fechaCreacion)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatearFecha(ticket.fechaCierre)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {calcularTiempoResolucion(ticket)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {getNombreTecnico(ticket.tecnicoAsignadoId)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getEstadoColor(ticket.estado)}`}>
                        {ticket.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Mostrando {inicio + 1}-{Math.min(inicio + filasPorPagina, ticketsFiltrados.length)} de {ticketsFiltrados.length} registros
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">Página {pagina} de {totalPaginas}</span>
              <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}