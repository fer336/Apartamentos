import { useEffect, useState, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, Users as UsersIcon } from 'lucide-react';
import { getClients, getBookings, createClient, updateClient, deleteClient } from '../services/api';
import { ClientModal } from '../components/ClientModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { Pagination } from '../components/Pagination';

const PAGE_SIZE = 10;

interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  document_type?: string;
  document_id?: string;
  whatsapp?: string;
  notes?: string;
}

interface Booking {
  id: string;
  client_id: string;
  status: string;
  check_in: string;
  check_out: string;
}

// Misma paleta y hash estable por id que usa Calendar.tsx, para que el color de
// un cliente sea consistente en toda la app (grilla del calendario y esta tabla).
const CLIENT_COLORS = [
  'bg-brand-600',
  'bg-emerald-500',
  'bg-blue-500',
  'bg-orange-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-fuchsia-500',
];

const getClientColor = (clientId: string) => {
  let hash = 0;
  for (let i = 0; i < clientId.length; i++) {
    hash = (hash * 31 + clientId.charCodeAt(i)) >>> 0;
  }
  return CLIENT_COLORS[hash % CLIENT_COLORS.length];
};

const dateFromISO = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatMonthYear = (date: Date) =>
  date.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }).replace('.', '');

export const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; client: Client | null }>({
    isOpen: false,
    client: null,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await getClients();
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const data = await getBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchBookings();
  }, []);

  // Estadías y última visita reales, calculadas desde las reservas del cliente
  // (la API de clientes no trae estos campos) — sin datos inventados.
  const statsByClient = useMemo(() => {
    const map = new Map<string, { count: number; lastDate: Date | null }>();
    bookings.forEach((b) => {
      if (b.status === 'cancelled') return;
      const entry = map.get(b.client_id) || { count: 0, lastDate: null };
      entry.count += 1;
      const checkOut = dateFromISO(b.check_out);
      if (!entry.lastDate || checkOut > entry.lastDate) entry.lastDate = checkOut;
      map.set(b.client_id, entry);
    });
    return map;
  }, [bookings]);

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      c.full_name.toLowerCase().includes(q) ||
      (c.document_id || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  }, [clients, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / PAGE_SIZE));

  const paginatedClients = useMemo(
    () => filteredClients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredClients, currentPage]
  );

  const getInitials = (name: string) =>
    name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase();

  const handleSaveClient = async (clientData: any) => {
    try {
      setErrorMessage(null);
      if (editingClient) {
        await updateClient(editingClient.id, clientData);
      } else {
        await createClient(clientData);
      }
      setIsModalOpen(false);
      setEditingClient(undefined);
      fetchClients();
    } catch (error: any) {
      console.error('Error saving client:', error);
      setErrorMessage(error.response?.data?.detail || 'Error al guardar el cliente');
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (client: Client) => {
    setDeleteConfirm({ isOpen: true, client });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.client) return;
    try {
      await deleteClient(deleteConfirm.client.id);
      fetchClients();
      setErrorMessage(null);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || 'Error al eliminar el cliente');
    } finally {
      setDeleteConfirm({ isOpen: false, client: null });
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {errorMessage && (
        <div className="bg-[#fdecec] border border-[#f7d2d2] rounded-xl p-4 flex items-start gap-3 animate-in fade-in">
          <div className="w-8 h-8 rounded-lg bg-[#fdecec] flex items-center justify-center flex-shrink-0">
            <span className="text-[#dc2626] font-bold">!</span>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-[#dc2626] mb-1">Error</h4>
            <p className="text-sm text-[#dc2626]">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-[#dc2626]/60 hover:text-[#dc2626]">✕</button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9583b3]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, DNI o teléfono…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e0d7ef] rounded-[11px] text-sm text-[#121325] placeholder:text-[#9583b3] focus:outline-none focus:border-[#ad8ed2] focus:ring-[3px] focus:ring-[#7c5ca8]/15 transition-all"
          />
        </div>
        <button
          onClick={() => { setEditingClient(undefined); setIsModalOpen(true); }}
          className="px-4 py-2.5 bg-brand-600 hover:bg-[#6b4d95] text-white rounded-[11px] shadow-btn-primary transition-all hover:-translate-y-px flex items-center gap-2 font-semibold text-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo cliente
        </button>
      </div>

      {loading ? (
        <div className="text-center p-12 bg-white rounded-2xl border border-[#e7dff3]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-[#7b6b95]">Cargando clientes...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-[#e7dff3] text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <UsersIcon className="w-8 h-8 text-brand-600" />
          </div>
          <h2 className="font-display text-2xl font-extrabold text-[#121325] mb-2">
            {searchQuery ? 'Sin resultados' : 'No hay clientes'}
          </h2>
          <p className="text-[#7b6b95] mb-6">
            {searchQuery ? 'Probá con otro nombre, DNI o teléfono.' : 'Agrega tu primer cliente para comenzar'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => { setEditingClient(undefined); setIsModalOpen(true); }}
              className="px-6 py-3 bg-brand-600 hover:bg-[#6b4d95] text-white rounded-[11px] shadow-btn-primary transition-all inline-flex items-center gap-2 font-semibold"
            >
              <Plus className="w-5 h-5" />
              Crear primer cliente
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e7dff3] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#faf8fd] text-left">
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-[#9583b3]">Cliente</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-[#9583b3]">Documento</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-[#9583b3]">Contacto</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-[#9583b3]">Estadías</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wide text-[#9583b3] text-right">Última</th>
                  <th className="px-5 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee5f6]">
                {paginatedClients.map((client) => {
                  const stats = statsByClient.get(client.id);
                  return (
                    <tr key={client.id} className="hover:bg-[#faf8fd] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-[11px] ${getClientColor(client.id)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                            {getInitials(client.full_name)}
                          </div>
                          <span className="font-semibold text-[#121325] truncate">{client.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {client.document_id ? (
                          <span className="font-mono text-[#5c3a8c]">
                            {client.document_type || 'DNI'} {client.document_id}
                          </span>
                        ) : (
                          <span className="text-[#9583b3]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          {client.phone && <span className="text-[#121325]">{client.phone}</span>}
                          {client.email && <span className="text-xs text-[#7b6b95] truncate">{client.email}</span>}
                          {!client.phone && !client.email && <span className="text-[#9583b3]">—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-display font-extrabold text-[#121325]">{stats?.count ?? 0}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-[#5c3a8c]">
                        {stats?.lastDate ? formatMonthYear(stats.lastDate) : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditClient(client)}
                            title="Editar"
                            className="w-8 h-8 rounded-[10px] bg-brand-50 hover:bg-brand-100 text-brand-700 flex items-center justify-center transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(client)}
                            title="Eliminar"
                            className="w-8 h-8 rounded-[10px] bg-[#fdecec] hover:bg-[#fbd9d9] text-[#dc2626] flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

      <ClientModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingClient(undefined); }}
        onSave={handleSaveClient}
        client={editingClient}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, client: null })}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar cliente?"
        message={`¿Estás segura que deseas eliminar a "${deleteConfirm.client?.full_name}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};
