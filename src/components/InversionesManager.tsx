'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth';

interface Inversion {
  id: string;
  descripcion: string;
  monto: string;
  fecha: string;
  createdAt: string;
}

interface InversionesManagerProps {
  refreshKey?: number;
}

export default function InversionesManager({ refreshKey }: InversionesManagerProps) {
  const [inversiones, setInversiones] = useState<Inversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(() => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  useEffect(() => {
    fetchInversiones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const fetchInversiones = async () => {
    try {
      const response = await authFetch('/api/inversiones');
      const data = await response.json();
      setInversiones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching inversiones:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDescripcion('');
    setMonto('');
    setFecha(() => {
      const hoy = new Date();
      const year = hoy.getFullYear();
      const month = String(hoy.getMonth() + 1).padStart(2, '0');
      const day = String(hoy.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!descripcion.trim() || !monto || parseFloat(monto) <= 0) {
      alert('Por favor completa todos los campos correctamente');
      return;
    }

    try {
      const url = editingId ? `/api/inversiones/${editingId}` : '/api/inversiones';
      const method = editingId ? 'PUT' : 'POST';

      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descripcion,
          monto: parseFloat(monto),
          fecha: new Date(fecha),
        }),
      });

      if (response.ok) {
        resetForm();
        fetchInversiones();
      } else {
        alert('Error al guardar inversión');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar inversión');
    }
  };

  const handleEdit = (inversion: Inversion) => {
    setDescripcion(inversion.descripcion);
    setMonto(inversion.monto);
    setFecha(new Date(inversion.fecha).toISOString().split('T')[0]);
    setEditingId(inversion.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta inversión?')) return;

    try {
      const response = await authFetch(`/api/inversiones/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchInversiones();
      } else {
        alert('Error al eliminar inversión');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar inversión');
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

  const totalInversiones = inversiones.reduce((sum, inv) => sum + parseFloat(inv.monto), 0);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 absolute top-0"></div>
        </div>
        <p className="mt-6 text-gray-600 font-medium text-lg">Cargando inversiones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Estadísticas */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-lg p-8 border-l-4 border-indigo-500 hover:shadow-xl transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">Total Inversiones</h3>
            <p className="text-5xl font-bold text-indigo-600">{formatMoney(totalInversiones.toString())}</p>
          </div>
          <div className="text-6xl">📈</div>
        </div>
      </div>

      {/* Botón agregar */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg"
        >
          ➕ Agregar Nueva Inversión
        </button>
      )}

      {/* Formulario */}
      {isAdding && (
        <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-indigo-500">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            {editingId ? '✏️ Editar Inversión' : '➕ Nueva Inversión'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descripción
              </label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Ej: Compra de materiales"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Monto
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 font-semibold shadow-md"
              >
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de inversiones */}
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">📋 Lista de Inversiones</h3>
        <div className="overflow-x-auto">
          {inversiones.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500 text-lg font-medium">No hay inversiones registradas</p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Descripción</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {inversiones.map((inversion) => (
                  <tr 
                    key={inversion.id}
                    className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 text-sm text-gray-600 font-semibold whitespace-nowrap">
                      {formatDate(inversion.fecha)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {inversion.descripcion}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-indigo-600 whitespace-nowrap">
                      {formatMoney(inversion.monto)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(inversion)}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200 font-semibold shadow-sm hover:shadow-md text-sm"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(inversion.id)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 font-semibold shadow-sm hover:shadow-md text-sm"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
