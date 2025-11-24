'use client';

import { authFetch } from '@/lib/auth';
import { useEffect, useState, Fragment } from 'react';

interface Venta {
  id: string;
  clienteId: string;
  fechaVenta: string;
  totalVenta: string;
  numeroVentaDia: number;
}

interface Cliente {
  id: string;
  nombre: string;
}

export default function VentasView() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Map<string, Cliente>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch ventas
      const ventasRes = await authFetch('/api/ventas');
      const ventasData = await ventasRes.json();
      setVentas(ventasData);

      // Fetch clientes para nombres
      const clientesRes = await authFetch('/api/clientes');
      const clientesData = await clientesRes.json();
      const clientesMap = new Map<string, Cliente>(clientesData.map((c: Cliente) => [c.id, c]));
      setClientes(clientesMap);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (value: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(parseFloat(value));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const totalVentas = ventas.reduce((sum, v) => sum + parseFloat(v.totalVenta), 0);

  // Calcular ventas de esta semana
  const hoy = new Date();
  const diaSemana = hoy.getDay();
  const diasDesdeInicio = diaSemana === 0 ? 6 : diaSemana - 1;
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - diasDesdeInicio);
  inicioSemana.setHours(0, 0, 0, 0);

  const ventasSemana = ventas.filter(v => new Date(v.fechaVenta) >= inicioSemana);
  const totalVentasSemana = ventasSemana.reduce((sum, v) => sum + parseFloat(v.totalVenta), 0);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 absolute top-0"></div>
        </div>
        <p className="mt-6 text-gray-600 font-medium text-lg">Cargando ventas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Estadísticas */}
      <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl shadow-lg p-8 border-l-4 border-purple-500 hover:shadow-xl transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Total Ventas Realizadas</h3>
            <p className="text-5xl font-bold text-purple-600">{formatMoney(totalVentas.toString())}</p>
            <div className="mt-4 flex items-center gap-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">
                📊 {ventasSemana.length} ventas esta semana
              </span>
              <span className="text-lg font-bold text-purple-700">
                {formatMoney(totalVentasSemana.toString())}
              </span>
            </div>
          </div>
          <div className="text-6xl">🛒</div>
        </div>
      </div>

      {/* Lista de ventas */}
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            📋 Registro de Ventas
          </h3>
          <span className="text-sm text-gray-500 font-medium">
            Total: {ventas.length} ventas
          </span>
        </div>
        <div className="overflow-x-auto">
          {ventas.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500 text-lg font-medium">No hay ventas registradas</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {ventas.map((venta, index) => {
                  const fechaActual = formatDate(venta.fechaVenta);
                  const fechaAnterior = index > 0 ? formatDate(ventas[index - 1].fechaVenta) : null;
                  const cambioFecha = fechaActual !== fechaAnterior;
                  
                  return (
                    <Fragment key={venta.id}>
                      {cambioFecha && index > 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-2">
                            <div className="border-t-2 border-purple-200"></div>
                          </td>
                        </tr>
                      )}
                      <tr className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 transition-colors duration-150 border-b border-gray-100">
                        <td className="px-6 py-4 text-sm text-gray-500 font-medium">#{venta.numeroVentaDia}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-semibold">{fechaActual}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {clientes.get(venta.clienteId)?.nombre || 'Desconocido'}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-purple-600">{formatMoney(venta.totalVenta)}</td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
