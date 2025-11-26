'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth';

interface DashboardData {
  capital: {
    total: number;
    inversiones: number;
    pagos: number;
    ventas: number;
    gastos: number;
  };
  capitalSemana: {
    total: number;
    inversiones: number;
    pagos: number;
    ventas: number;
    gastos: number;
  };
  capitalSemanaActual: {
    total: number;
    inversiones: number;
    pagos: number;
    ventas: number;
    gastos: number;
  };
  saldoDeudores: number;
  ultimasPagos: Array<{
    id: string;
    fechaPago: string;
    monto: string;
    cliente: { nombre: string };
  }>;
  ultimasVentas: Array<{
    id: string;
    fechaVenta: string;
    totalVenta: string;
    cliente: { nombre: string };
  }>;
  clientesDeudores: Array<{
    nombre: string;
    saldoAPagar: string;
  }>;
  fechaActualizacion: string;
}

interface DashboardProps {
  refreshKey?: number;
  onUpdate?: (fecha: string) => void;
}

export default function Dashboard({ refreshKey, onUpdate }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const fetchData = async () => {
    try {
      const response = await authFetch('/api/dashboard');
      const json = await response.json();
      setData(json);
      if (onUpdate && json.fechaActualizacion) {
        onUpdate(json.fechaActualizacion);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0"></div>
        </div>
        <p className="mt-6 text-gray-600 font-medium text-lg">Cargando dashboard...</p>
      </div>
    );
  }

  if (!data || !data.capital) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center border-l-4 border-red-500">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-2xl font-bold text-red-600 mb-2">Error al cargar datos</h3>
        <p className="text-gray-600">No se pudieron obtener los datos del dashboard. Por favor, intenta actualizar la página.</p>
      </div>
    );
  }

  const formatMoney = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    // Extraer solo la parte de fecha en UTC sin conversión de zona horaria
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-8">

      {/* Sección: Esta Semana */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          📅 Esta Semana
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 hover:shadow-xl transition-shadow duration-200 ${
            data.capitalSemanaActual.total >= 0 ? 'border-green-500' : 'border-red-500'
          }`}>
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Capital Semanal</h3>
            <p className={`text-4xl font-bold ${
              data.capitalSemanaActual.total >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatMoney(data.capitalSemanaActual.total)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow duration-200">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Inversiones</h3>
            <p className="text-4xl font-bold text-purple-600">
              {formatMoney(data.capitalSemanaActual.inversiones)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-200">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Pagos</h3>
            <p className="text-4xl font-bold text-green-600">
              {formatMoney(data.capitalSemanaActual.pagos)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition-shadow duration-200">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Ventas</h3>
            <p className="text-4xl font-bold text-orange-600">
              {formatMoney(data.capitalSemanaActual.ventas)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500 hover:shadow-xl transition-shadow duration-200">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Gastos</h3>
            <p className="text-4xl font-bold text-red-600">
              {formatMoney(data.capitalSemanaActual.gastos)}
            </p>
          </div>
        </div>
      </div>

      {/* Sección: Semana Pasada */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          📅 Semana Pasada
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 hover:shadow-xl transition-shadow duration-200 ${
            data.capitalSemana.total >= 0 ? 'border-green-500' : 'border-red-500'
          }`}>
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Capital Semanal</h3>
            <p className={`text-4xl font-bold ${
              data.capitalSemana.total >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatMoney(data.capitalSemana.total)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow duration-200">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Inversiones</h3>
            <p className="text-4xl font-bold text-purple-600">
              {formatMoney(data.capitalSemana.inversiones)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-200">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Pagos</h3>
            <p className="text-4xl font-bold text-green-600">
              {formatMoney(data.capitalSemana.pagos)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition-shadow duration-200">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Ventas</h3>
            <p className="text-4xl font-bold text-orange-600">
              {formatMoney(data.capitalSemana.ventas)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500 hover:shadow-xl transition-shadow duration-200">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Gastos</h3>
            <p className="text-4xl font-bold text-red-600">
              {formatMoney(data.capitalSemana.gastos)}
            </p>
          </div>
        </div>
      </div>

      {/* Sección: Totales */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          📊 Total Historico
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 hover:shadow-xl transition-shadow duration-200 ${
          data.capital.total >= 0 ? 'border-green-500' : 'border-red-500'
        }`}>
          <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Capital Total</h3>
          <p className={`text-4xl font-bold ${
            data.capital.total >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatMoney(data.capital.total)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow duration-200">
          <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Saldo Deudores</h3>
          <p className="text-4xl font-bold text-blue-600">
            {formatMoney(data.saldoDeudores)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow duration-200">
          <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Inversiones</h3>
          <p className="text-4xl font-bold text-purple-600">
            {formatMoney(data.capital.inversiones)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-200">
          <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Pagos (desde 04/11)</h3>
          <p className="text-4xl font-bold text-green-600">
            {formatMoney(data.capital.pagos)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition-shadow duration-200">
          <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Ventas (desde 04/11)</h3>
          <p className="text-4xl font-bold text-orange-600">
            {formatMoney(data.capital.ventas)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500 hover:shadow-xl transition-shadow duration-200">
          <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Gastos</h3>
          <p className="text-4xl font-bold text-red-600">
            {formatMoney(data.capital.gastos)}
          </p>
        </div>
        </div>
      </div>

      {/* Últimos pagos y ventas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos Pagos */}
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-5 flex items-center gap-2">
            💰 Últimos 10 Pagos
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data.ultimasPagos.slice(0, 10).map((pago) => (
              <div key={pago.id} className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:shadow-md transition-all duration-200 border border-gray-100">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{pago.cliente.nombre}</p>
                  <p className="text-sm text-gray-500">{formatDate(pago.fechaPago)}</p>
                </div>
                <p className="font-bold text-green-600 text-lg">{formatMoney(pago.monto)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Últimas Ventas */}
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-5 flex items-center gap-2">
            🛍️ Últimas 10 Ventas
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data.ultimasVentas.slice(0, 10).map((venta) => (
              <div key={venta.id} className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg hover:shadow-md transition-all duration-200 border border-gray-100">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{venta.cliente.nombre}</p>
                  <p className="text-sm text-gray-500">{formatDate(venta.fechaVenta)}</p>
                </div>
                <p className="font-bold text-orange-600 text-lg">{formatMoney(venta.totalVenta)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Deudores */}
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-5 flex items-center gap-2">
          📊 Últimos 10 Clientes Deudores
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.clientesDeudores.map((cliente, index) => (
            <div key={index} className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-white rounded-lg hover:shadow-md transition-all duration-200 border border-blue-100">
              <p className="font-semibold text-gray-900 flex-1">{cliente.nombre}</p>
              <p className="font-bold text-blue-600 text-lg">{formatMoney(cliente.saldoAPagar)}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}