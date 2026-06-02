// =============================================
// PÁGINA: DASHBOARD POR ÁREA (Supervisor)
// Sistema de Gestión de Tickets - Banco de Alimentos Perú
// =============================================

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTicketStore } from '../store/ticketStore';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import {
  RefreshCw, Ticket, Building2, Tag, Users,
  ClipboardList, CheckCircle, FileX, TrendingUp, FileCheck, Clock, Layers,
  Download, Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';

const AREAS = [
  'Logística y Calidad',
  'Sistemas y Procesos',
  'Gestión Social',
  'Administración',
  'Estrategias y Alianzas',
  'Fundraising',
  'Proyectos'
];

const CATEGORIAS = [
  'Hardware', 'Software', 'Redes', 'Accesos',
  'Impresoras', 'Correo', 'Reportes', 'Otros'
];

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const COLORES = {
  verde: '#80c398',
  amarillo: '#fbe066',
  rojo: '#ea4c5b',
  azul: '#6ab088',
  naranja: '#f5a623',
  morado: '#a855f7',
  cyan: '#06b6d4'
};

const COLORES_ESTADOS: Record<string, string> = {
  nuevo: '#fbe066',
  asignado: '#3b82f6',
  planificado: '#a855f7',
  resuelto: '#22c55e',
  cerrado: '#6b7280'
};

const COLORES_CATEGORIAS_TABLA: Record<string, string> = {
  'Hardware': '#80c398',
  'Software': '#fbe066',
  'Redes': '#ea4c5b',
  'Accesos': '#6ab088',
  'Impresoras': '#f5a623',
  'Correo': '#3b82f6',
  'Reportes': '#a855f7',
  'Otros': '#6b7280'
};

const generarColoresAdicionales = (cantidad: number): string[] => {
  const colores: string[] = [];
  for (let i = 0; i < cantidad; i++) {
    const hue = Math.floor((i * 137.508) % 360);
    const saturation = 65 + (i % 20);
    const lightness = 55 + (i % 15);
    colores.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  return colores;
};

export default function DashboardAreaPage() {
  const navigate = useNavigate();
  const { usuarioActual, usuarios } = useAuthStore();
  const ticketStore = useTicketStore();
  
  const [filtroMesGlobal, setFiltroMesGlobal] = useState<string>('todos');
  const [filtroAnioGlobal, setFiltroAnioGlobal] = useState<number>(-1);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        await ticketStore.cargarTickets();
        await useAuthStore.getState().cargarUsuarios();
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  // Filtrar tickets por área del usuario actual
  const ticketsFiltradosGlobal = useMemo(() => {
    return ticketStore.tickets.filter((t: any) => {
      const solicitante = usuarios.find((u: any) => u.id === t.solicitanteId);
      const areaCoincide = solicitante?.area === usuarioActual?.area;
      
      const fecha = new Date(t.fechaCreacion);
      const cumpleAnio = filtroAnioGlobal === -1 || fecha.getFullYear() === filtroAnioGlobal;
      const cumpleMes = filtroMesGlobal === 'todos' || fecha.getMonth() === parseInt(filtroMesGlobal);
      
      return areaCoincide && cumpleAnio && cumpleMes;
    });
  }, [ticketStore.tickets, usuarios, usuarioActual?.area, filtroMesGlobal, filtroAnioGlobal]);

  // Estadísticas generales
  const stats = useMemo(() => ({
    total: ticketsFiltradosGlobal.length,
    nuevo: ticketsFiltradosGlobal.filter((t: any) => t.estado === 'nuevo').length,
    asignado: ticketsFiltradosGlobal.filter((t: any) => t.estado === 'asignado').length,
    planificado: ticketsFiltradosGlobal.filter((t: any) => t.estado === 'planificado').length,
    resuelto: ticketsFiltradosGlobal.filter((t: any) => t.estado === 'resuelto').length,
    cerrado: ticketsFiltradosGlobal.filter((t: any) => t.estado === 'cerrado').length,
  }), [ticketsFiltradosGlobal]);

  // Datos para gráfico por estado
  const datosPorEstado = useMemo(() => {
    const conteo: Record<string, number> = {};
    const estadosList = ['nuevo', 'asignado', 'planificado', 'resuelto', 'cerrado'];
    estadosList.forEach(e => { conteo[e] = 0; });
    ticketsFiltradosGlobal.forEach((t: any) => {
      if (conteo[t.estado] !== undefined) {
        conteo[t.estado]++;
      }
    });
    return estadosList.map(e => ({
      name: e.charAt(0).toUpperCase() + e.slice(1),
      value: conteo[e],
      color: COLORES_ESTADOS[e]
    }));
  }, [ticketsFiltradosGlobal]);

  // Datos para gráfico por categoría
  const datosPorCategoria = useMemo(() => {
    const conteo: Record<string, number> = {};
    CATEGORIAS.forEach(cat => { conteo[cat] = 0; });
    ticketsFiltradosGlobal.forEach((t: any) => {
      if (conteo[t.categoria] !== undefined) {
        conteo[t.categoria]++;
      }
    });
    return CATEGORIAS.map((cat, index) => ({
      name: cat,
      value: conteo[cat],
      color: Object.values(COLORES)[index % Object.values(COLORES).length]
    })).filter(d => d.value > 0);
  }, [ticketsFiltradosGlobal]);

  // Datos para gráfico por subcategoría
  const datosPorSubcategoria = useMemo(() => {
    const conteo: Record<string, number> = {};
    ticketsFiltradosGlobal.forEach((t: any) => {
      let subcat = t.subcategoria;
      if (!subcat && t.titulo) {
        const partes = t.titulo.split(' - ');
        if (partes.length > 1) {
          subcat = partes[partes.length - 1].trim();
        }
      }
      if (subcat) {
        conteo[subcat] = (conteo[subcat] || 0) + 1;
      }
    });
    const subcategoriasConDatos = Object.keys(conteo).filter(subcat => conteo[subcat] > 0);
    const coloresUnicos = generarColoresAdicionales(subcategoriasConDatos.length);
    return subcategoriasConDatos
      .map((subcat, index) => ({
        name: subcat,
        value: conteo[subcat],
        color: coloresUnicos[index]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [ticketsFiltradosGlobal]);

  // Top 5 usuarios por total de tickets
  const datosPorUsuarioTotal = useMemo(() => {
    const conteo: Record<string, any> = {};
    ticketsFiltradosGlobal.forEach((t: any) => {
      const solicitante = usuarios.find((u: any) => u.id === t.solicitanteId);
      if (solicitante) {
        const nombreCompleto = `${solicitante.nombre} ${solicitante.apellidos}`;
        if (!conteo[nombreCompleto]) {
          conteo[nombreCompleto] = { name: nombreCompleto, total: 0 };
        }
        conteo[nombreCompleto].total++;
      }
    });
    const usuariosOrdenados = Object.values(conteo)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, 5);
    const coloresUsuarios = generarColoresAdicionales(usuariosOrdenados.length);
    return usuariosOrdenados.map((d: any, i: number) => ({
      ...d,
      color: coloresUsuarios[i]
    }));
  }, [ticketsFiltradosGlobal, usuarios]);

  // Tasa de completitud
  const datosTasaEncuestas = useMemo(() => {
    const enviadas = ticketsFiltradosGlobal.filter((t: any) => ['resuelto', 'cerrado'].includes(t.estado)).length;
    const completadas = ticketsFiltradosGlobal.filter((t: any) => t.encuestaCompletada === true).length;
    const pendientes = enviadas - completadas;
    return [
      { name: 'Completadas', value: completadas, color: COLORES.verde },
      { name: 'Pendientes', value: pendientes, color: COLORES.rojo }
    ];
  }, [ticketsFiltradosGlobal]);

  // Resumen por usuarios
  const datosResumenPorUsuario = useMemo(() => {
    const usuariosDelArea = usuarios.filter((u: any) => u.area === usuarioActual?.area);
    const usuariosConTickets: Record<string, any> = {};
    
    usuariosDelArea.forEach((u: any) => {
      const nombreCompleto = `${u.nombre} ${u.apellidos}`;
      usuariosConTickets[nombreCompleto] = {
        id: u.id,
        nombre: nombreCompleto,
        area: u.area,
        rol: u.rol,
        categorias: {} as Record<string, number>,
        total: 0
      };
      CATEGORIAS.forEach(cat => {
        usuariosConTickets[nombreCompleto].categorias[cat] = 0;
      });
    });
    
    ticketsFiltradosGlobal.forEach((t: any) => {
      const solicitante = usuarios.find((u: any) => u.id === t.solicitanteId);
      if (solicitante && usuariosConTickets[solicitante.nombre + ' ' + solicitante.apellidos]) {
        const usuarioData = usuariosConTickets[solicitante.nombre + ' ' + solicitante.apellidos];
        if (t.categoria && usuarioData.categorias[t.categoria] !== undefined) {
          usuarioData.categorias[t.categoria]++;
        }
        usuarioData.total++;
      }
    });
    
    return Object.values(usuariosConTickets)
      .sort((a: any, b: any) => b.total - a.total);
  }, [ticketsFiltradosGlobal, usuarios, usuarioActual?.area]);

  const recargarDatos = async () => {
    setCargando(true);
    await ticketStore.cargarTickets();
    await useAuthStore.getState().cargarUsuarios();
    setCargando(false);
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: COLORES.verde }} />
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard de Supervisor</h1>
          <p className="text-gray-500 mt-1">Vista de Todos los Usuarios de mi Área - Banco de Alimentos</p>
        </div>
        <button onClick={recargarDatos} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* FILTROS GLOBALES */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-4 border border-emerald-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-gray-700">Filtros Globales:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filtroMesGlobal}
              onChange={(e) => setFiltroMesGlobal(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="todos">Todos los Meses</option>
              {MESES.map((mes, index) => (
                <option key={index} value={index}>{mes}</option>
              ))}
            </select>
            
            <select
              value={filtroAnioGlobal}
              onChange={(e) => setFiltroAnioGlobal(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value={-1}>Todos los Años</option>
              {[2024, 2025, 2026, 2027].map(anio => (
                <option key={anio} value={anio}>{anio}</option>
              ))}
            </select>
            
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium hover:shadow-lg transition-all"
              style={{ backgroundColor: COLORES.verde }}
            >
              <Download className="w-4 h-4" />
              Exportar a Excel
            </button>
          </div>
        </div>
      </div>

      {/* TARJETAS DE RESUMEN */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#fbe066' }}>
              <Clock className="w-6 h-6 text-gray-800" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Nuevos</p>
              <p className="text-2xl font-bold text-gray-800">{stats.nuevo}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#3b82f6' }}>
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Asignados</p>
              <p className="text-2xl font-bold text-gray-800">{stats.asignado}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#22c55e' }}>
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Resueltos</p>
              <p className="text-2xl font-bold text-gray-800">{stats.resuelto}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#6b7280' }}>
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Cerrados</p>
              <p className="text-2xl font-bold text-gray-800">{stats.cerrado}</p>
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICO 1: Tickets por Estado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Ticket className="w-5 h-5" style={{ color: COLORES.verde }} />
            Tickets por Estado
          </h3>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosPorEstado}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {datosPorEstado.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRÁFICO 2: Tickets por Categoría */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Tag className="w-5 h-5" style={{ color: COLORES.verde }} />
            Tickets por Categoría
          </h3>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosPorCategoria}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {datosPorCategoria.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRÁFICO 3: Tickets por Subcategoría */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Layers className="w-5 h-5" style={{ color: COLORES.verde }} />
            Tickets por Subcategoría
          </h3>
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosPorSubcategoria} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={50} interval={0} />
              <Tooltip />
              <Bar dataKey="value" name="Tickets" radius={[0, 4, 4, 0]}>
                {datosPorSubcategoria.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRÁFICO 4: Top 5 Usuarios */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: COLORES.verde }} />
            Top 5 Usuarios por Total de Tickets
          </h3>
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosPorUsuarioTotal} layout="vertical" margin={{ left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={80} />
              <Tooltip />
              <Bar dataKey="total" name="Total Tickets" radius={[0, 4, 4, 0]}>
                {datosPorUsuarioTotal.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRÁFICO 5: Tasa de Completitud */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5" style={{ color: COLORES.verde }} />
          Tasa de Completitud
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={datosTasaEncuestas} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" nameKey="name" label={(entry: any) => `${entry.name}: ${entry.value}`}>
                  {datosTasaEncuestas.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col justify-center space-y-4">
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#ecfdf5' }}>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8" style={{ color: COLORES.verde }} />
                <div>
                  <p className="text-sm text-gray-600">Completadas</p>
                  <p className="text-2xl font-bold" style={{ color: COLORES.verde }}>{datosTasaEncuestas[0]?.value || 0}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#fef2f2' }}>
              <div className="flex items-center gap-3">
                <FileX className="w-8 h-8" style={{ color: COLORES.rojo }} />
                <div>
                  <p className="text-sm text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold" style={{ color: COLORES.rojo }}>{datosTasaEncuestas[1]?.value || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA: Resumen por Usuarios */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: COLORES.verde }} />
            Resumen: TODOS mis Usuarios x Categorías
          </h3>
          <p className="text-sm text-gray-500 mt-1">Detalle individual de tickets por usuario del área</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-gray-200" style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Usuario</th>
                <th className="text-center px-3 py-3 font-medium text-gray-600">Rol</th>
                {CATEGORIAS.map(cat => (
                  <th key={cat} className="text-center px-2 py-3 font-medium text-gray-600 min-w-[80px]">{cat}</th>
                ))}
                <th className="text-center px-4 py-3 font-medium text-gray-600 min-w-[80px]">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {datosResumenPorUsuario.map((usuario: any) => (
                <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: COLORES.verde }}>
                        {usuario.nombre.charAt(0)}
                      </div>
                      <span>{usuario.nombre}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      usuario.rol === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                      usuario.rol === 'administrador' ? 'bg-blue-100 text-blue-700' :
                      usuario.rol === 'supervisor' ? 'bg-orange-100 text-orange-700' :
                      usuario.rol === 'tecnico' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}
                    </span>
                  </td>
                  {CATEGORIAS.map((cat) => {
                    const count = usuario.categorias[cat] || 0;
                    return (
                      <td key={cat} className="px-2 py-3 text-center">
                        {count > 0 ? (
                          <span
                            className="px-2 py-1 rounded-md text-xs font-semibold text-white shadow-sm"
                            style={{ backgroundColor: COLORES_CATEGORIAS_TABLA[cat] }}
                          >
                            {count}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: usuario.total > 0 ? COLORES.verde : '#9ca3af' }}>
                      {usuario.total}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {datosResumenPorUsuario.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No hay usuarios registrados en el área</p>
          </div>
        )}
      </div>
    </div>
  );
}