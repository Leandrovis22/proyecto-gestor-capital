'use client';

import { useState, useEffect, Fragment } from 'react';
import { authFetch } from '@/lib/auth';

interface Pago {
  id: string;
  clienteId: string;
  fechaPago: string;
  monto: string;
  tipoPago: string;
  numeroPagoDia: number;
}

interface Cliente {
  id: string;
  nombre: string;
}

interface PagosViewProps {
  refreshKey?: number;
}

export default function PagosView({ refreshKey }: PagosViewProps) {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [clientes, setClientes] = useState<Map<string, Cliente>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const fetchData = async () => {
    try {
      // Fetch pagos
      const pagosRes = await authFetch('/api/pagos');
      const pagosData = await pagosRes.json();
      setPagos(pagosData);

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
    // Extraer solo la parte de fecha en UTC sin conversión de zona horaria
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  };

  const totalPagos = pagos.reduce((sum, p) => sum + parseFloat(p.monto), 0);

  // Calcular pagos de esta semana completa (lunes a domingo actual)
  const hoy = new Date();
  const diaSemana = hoy.getDay();

  // Calcular días hasta el lunes actual
  const diasHastaLunesActual = diaSemana === 0 ? 6 : diaSemana - 1;
  const fechaLunesActual = new Date(hoy);
  fechaLunesActual.setDate(hoy.getDate() - diasHastaLunesActual);
  fechaLunesActual.setHours(0, 0, 0, 0);

  const fechaDomingoActual = new Date(fechaLunesActual);
  fechaDomingoActual.setDate(fechaLunesActual.getDate() + 6);
  fechaDomingoActual.setHours(23, 59, 59, 999);

  const pagosSemana = pagos.filter(p => {
    const fechaPago = new Date(p.fechaPago);
    return fechaPago >= fechaLunesActual && fechaPago <= fechaDomingoActual;
  });
  const totalPagosSemana = pagosSemana.reduce((sum, p) => sum + parseFloat(p.monto), 0);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0"></div>
        </div>
        <p className="mt-6 text-gray-600 font-medium text-lg">Cargando pagos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Estadísticas */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-8 border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Total Pagos Recibidos</h3>
            <p className="text-5xl font-bold text-green-600">{formatMoney(totalPagos.toString())}</p>
            <div className="mt-4 flex items-center gap-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold">
                📊 {pagosSemana.length} pagos esta semana
              </span>
              <span className="text-lg font-bold text-green-700">
                {formatMoney(totalPagosSemana.toString())}
              </span>
            </div>
          </div>
          <div className="text-6xl">💰</div>
        </div>
      </div>

      {/* Lista de pagos */}
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            📋 Registro de Pagos
          </h3>
          <span className="text-sm text-gray-500 font-medium">
            Total: {pagos.length} pagos
          </span>
        </div>
        <div className="overflow-x-auto">
          {pagos.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500 text-lg font-medium">No hay pagos registrados</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tipo</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {pagos.map((pago, index) => {
                  const fechaActual = formatDate(pago.fechaPago);
                  const fechaAnterior = index > 0 ? formatDate(pagos[index - 1].fechaPago) : null;
                  const cambioFecha = fechaActual !== fechaAnterior;
                  
                  return (
                    <Fragment key={pago.id}>
                      {cambioFecha && index > 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-2">
                            <div className="border-t-4 border-blue-800"></div>
                          </td>
                        </tr>
                      )}
                      <tr className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-colors duration-150 border-b border-gray-100">
                        <td className="px-6 py-4 text-sm text-gray-500 font-medium">#{pago.numeroPagoDia}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-semibold">{fechaActual}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {clientes.get(pago.clienteId)?.nombre || 'Desconocido'}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-green-600">{formatMoney(pago.monto)}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {pago.tipoPago}
                          </span>
                        </td>
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