import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users as UsersIcon, Plus, Mail, Phone, MapPin, Edit, Trash2 } from 'lucide-react';
import { getClients, createClient, updateClient, deleteClient } from '../services/api';
import { ClientModal } from '../components/ClientModal';
import { ConfirmModal } from '../components/ConfirmModal';

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

export const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; client: Client | null }>({
    isOpen: false,
    client: null,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await getClients();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

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
      const message = error.response?.data?.detail || 'Error al eliminar el cliente';
      setErrorMessage(message);
      setDeleteConfirm({ isOpen: false, client: null });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      'from-pink-400 to-rose-500',
      'from-purple-400 to-indigo-500',
      'from-blue-400 to-cyan-500',
      'from-emerald-400 to-teal-500',
      'from-amber-400 to-orange-500',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <span className="text-red-600 font-bold">!</span>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-red-900 mb-1">Error</h4>
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => navigate('/')}
            className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white border-2 border-purple-200 hover:bg-purple-50 flex items-center justify-center transition-all flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-3xl font-bold text-foreground flex items-center gap-2 md:gap-3 truncate">
              <UsersIcon className="w-5 h-5 md:w-8 md:h-8 text-blue-500 flex-shrink-0" />
              Clientes
            </h1>
            <p className="text-muted-foreground mt-1 hidden md:block">Gestiona tus inquilinos</p>
          </div>
        </div>
        <button 
          onClick={() => {
            setEditingClient(undefined);
            setIsModalOpen(true);
          }}
          className="w-9 h-9 md:w-auto md:h-auto md:px-6 md:py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden md:inline">Nuevo Cliente</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center p-12 bg-white rounded-2xl border-2 border-border">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando clientes...</p>
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border-2 border-border text-center">
          <div className="text-6xl mb-4">👥</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">No hay clientes</h2>
          <p className="text-muted-foreground mb-6">Agrega tu primer cliente para comenzar</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg inline-flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Crear Primer Cliente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client, index) => (
            <div 
              key={client.id}
              className="bg-white rounded-2xl p-6 border-2 border-border hover:border-blue-300 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${getAvatarColor(index)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                  {getInitials(client.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-foreground truncate">{client.full_name}</h3>
                  {client.nationality && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>{client.nationality}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 border-t border-border pt-4 mb-4">
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 text-purple-500" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 text-green-500" />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 border-t border-border pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEditClient(client)}
                  className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteClick(client)}
                  className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Client Modal */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingClient(undefined);
        }}
        onSave={handleSaveClient}
        client={editingClient}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, client: null })}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar Cliente?"
        message={`¿Estás segura que deseas eliminar a "${deleteConfirm.client?.full_name}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};
