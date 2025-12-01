import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Building2, Filter, Search, Trash2, ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import Button from '../common/Button';

interface Reservation {
  id: number;
  space_id: number;
  space_name: string;
  space_type: string;
  space_capacity: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  notas: string;
  created_by: string;
  created_at: string;
}

const Reservations: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal states
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch reservations
  const fetchReservations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/v1/assignments/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar las reservas');
      }

      const data = await response.json();
      
      // Transform data to match our interface
      const transformedReservations: Reservation[] = data.map((item: any) => ({
        id: item.id,
        space_id: item.room_id || item.space_id,
        space_name: item.space_name || item.room_name || `Espacio ${item.room_id || item.space_id}`,
        space_type: item.space_type || 'General',
        space_capacity: item.space_capacity || 0,
        fecha_inicio: item.fecha || item.fecha_inicio,
        fecha_fin: item.fecha_fin || item.fecha,
        estado: item.estado || 'activo',
        notas: item.notas || '',
        created_by: item.created_by || 'Usuario',
        created_at: item.created_at || new Date().toISOString()
      }));

      setReservations(transformedReservations);
    } catch (err: any) {
      console.error('Error fetching reservations:', err);
      setError(err.message || 'Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  // Filter reservations
  const filteredReservations = reservations.filter(res => {
    // Status filter
    if (filterStatus !== 'all' && res.estado !== filterStatus) return false;
    
    // Date filters
    if (filterDateFrom && new Date(res.fecha_inicio) < new Date(filterDateFrom)) return false;
    if (filterDateTo && new Date(res.fecha_fin) > new Date(filterDateTo)) return false;
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        res.space_name.toLowerCase().includes(query) ||
        res.notas.toLowerCase().includes(query) ||
        res.space_type.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const paginatedReservations = filteredReservations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Cancel reservation
  const handleCancelReservation = async (id: number) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/v1/assignments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cancelar la reserva');
      }

      // Update local state
      setReservations(prev => prev.filter(r => r.id !== id));
      setShowDeleteConfirm(false);
      setSelectedReservation(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('es-ES', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      activo: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle className="h-3 w-3" />, label: 'Activa' },
      pendiente: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <AlertCircle className="h-3 w-3" />, label: 'Pendiente' },
      cancelado: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: <XCircle className="h-3 w-3" />, label: 'Cancelada' },
      completado: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: <CheckCircle className="h-3 w-3" />, label: 'Completada' },
    };

    const config = statusConfig[status] || statusConfig.pendiente;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  // Statistics
  const stats = {
    total: reservations.length,
    active: reservations.filter(r => r.estado === 'activo').length,
    pending: reservations.filter(r => r.estado === 'pendiente').length,
    cancelled: reservations.filter(r => r.estado === 'cancelado').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Calendar className="h-8 w-8" />
              Mis Reservas
            </h2>
            <p className="text-blue-100 mt-1">
              Gestiona y visualiza todas tus reservas de espacios
            </p>
          </div>
          <button
            onClick={fetchReservations}
            className="inline-flex items-center px-4 py-2 rounded-md font-medium bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <span className="block text-3xl font-bold">{stats.total}</span>
            <span className="text-sm text-blue-100">Total</span>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <span className="block text-3xl font-bold text-green-300">{stats.active}</span>
            <span className="text-sm text-blue-100">Activas</span>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <span className="block text-3xl font-bold text-yellow-300">{stats.pending}</span>
            <span className="text-sm text-blue-100">Pendientes</span>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <span className="block text-3xl font-bold text-red-300">{stats.cancelled}</span>
            <span className="text-sm text-blue-100">Canceladas</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-slate-500" />
          <h3 className="font-medium text-slate-800 dark:text-white">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por espacio o notas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            >
              <option value="all">Todos los estados</option>
              <option value="activo">Activas</option>
              <option value="pendiente">Pendientes</option>
              <option value="cancelado">Canceladas</option>
              <option value="completado">Completadas</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              placeholder="Desde"
            />
          </div>

          {/* Date To */}
          <div>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              placeholder="Hasta"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Reservations List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">Cargando reservas...</p>
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">
              No hay reservas
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {searchQuery || filterStatus !== 'all' 
                ? 'No se encontraron reservas con los filtros aplicados'
                : 'Aún no tienes reservas. ¡Usa el Asistente IA para crear una!'}
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                      Espacio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                      Fecha y Hora
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                      Notas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {paginatedReservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-white">
                              {reservation.space_name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Cap: {reservation.space_capacity} • {reservation.space_type}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm text-slate-800 dark:text-white flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            {formatDate(reservation.fecha_inicio)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(reservation.fecha_inicio)} - {formatTime(reservation.fecha_fin)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(reservation.estado)}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                          {reservation.notas || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedReservation(reservation);
                              setShowDetailModal(true);
                            }}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {reservation.estado === 'activo' && (
                            <button
                              onClick={() => {
                                setSelectedReservation(reservation);
                                setShowDeleteConfirm(true);
                              }}
                              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                              title="Cancelar reserva"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredReservations.length)} de {filteredReservations.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-lg w-full shadow-xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                Detalles de la Reserva
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <div className="w-14 h-14 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Building2 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white text-lg">
                    {selectedReservation.space_name}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedReservation.space_type} • Capacidad: {selectedReservation.space_capacity}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">Fecha inicio</label>
                  <p className="font-medium text-slate-800 dark:text-white">
                    {formatDate(selectedReservation.fecha_inicio)}
                  </p>
                  <p className="text-sm text-slate-500">{formatTime(selectedReservation.fecha_inicio)}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">Fecha fin</label>
                  <p className="font-medium text-slate-800 dark:text-white">
                    {formatDate(selectedReservation.fecha_fin)}
                  </p>
                  <p className="text-sm text-slate-500">{formatTime(selectedReservation.fecha_fin)}</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400">Estado</label>
                <div className="mt-1">{getStatusBadge(selectedReservation.estado)}</div>
              </div>

              {selectedReservation.notas && (
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">Notas</label>
                  <p className="text-slate-800 dark:text-white mt-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    {selectedReservation.notas}
                  </p>
                </div>
              )}

              <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                ID: #{selectedReservation.id} • Creada el {formatDate(selectedReservation.created_at)}
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                Cerrar
              </Button>
              {selectedReservation.estado === 'activo' && (
                <Button
                  variant="danger"
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowDeleteConfirm(true);
                  }}
                >
                  Cancelar Reserva
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full shadow-xl p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                ¿Cancelar esta reserva?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Estás a punto de cancelar la reserva de <strong>{selectedReservation.space_name}</strong>.
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-2 rounded-md font-medium bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 disabled:opacity-50"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedReservation(null);
                }}
                disabled={actionLoading}
              >
                No, mantener
              </button>
              <button
                className="flex-1 px-4 py-2 rounded-md font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                onClick={() => handleCancelReservation(selectedReservation.id)}
                disabled={actionLoading}
              >
                {actionLoading ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservations;
