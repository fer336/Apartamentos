import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, Plus, Trash2, Edit, Check, Tv, ListTodo } from 'lucide-react';
import { getProperties, createProperty, updateProperty, deleteProperty } from '../services/api';
import { PropertyModal } from '../components/PropertyModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { DirectvManager } from '../components/DirectvManager';
import { TaskManager } from '../components/TaskManager';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  status: string;
  property_type: string;
  amenities: string[];
  description: string;
}

export const Properties = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; property: Property | null }>({
    isOpen: false,
    property: null,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // DirecTV State
  const [isDirectvOpen, setIsDirectvOpen] = useState(false);
  const [selectedPropertyForDirectv, setSelectedPropertyForDirectv] = useState<Property | null>(null);

  // Task Manager State
  const [isTaskManagerOpen, setIsTaskManagerOpen] = useState(false);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const data = await getProperties();
      // Asegurarnos de que data sea un array
      if (Array.isArray(data)) {
        setProperties(data);
      } else {
        console.error('Data received from getProperties is not an array:', data);
        setProperties([]);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleSaveProperty = async (propertyData: any) => {
    try {
      setErrorMessage(null);
      if (editingProperty) {
        await updateProperty(editingProperty.id, propertyData);
      } else {
        await createProperty(propertyData);
      }
      setIsModalOpen(false);
      setEditingProperty(undefined);
      fetchProperties();
    } catch (error: any) {
      console.error('Error saving property:', error);
      setErrorMessage(error.response?.data?.detail || 'Error al guardar la propiedad');
    }
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (property: Property) => {
    setDeleteConfirm({ isOpen: true, property });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.property) return;

    try {
      await deleteProperty(deleteConfirm.property.id);
      fetchProperties();
      setErrorMessage(null);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Error al eliminar la propiedad';
      setErrorMessage(message);
      setDeleteConfirm({ isOpen: false, property: null });
    }
  };

  const handleOpenDirectv = (property: Property) => {
    setSelectedPropertyForDirectv(property);
    setIsDirectvOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700';
      case 'occupied':
        return 'bg-red-100 text-red-700';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'occupied':
        return 'Ocupado';
      case 'maintenance':
        return 'Mantenimiento';
      default:
        return status;
    }
  };

  const getAmenitiesText = (amenities: string[]) => {
    const labels: any = {
      wifi: 'WiFi',
      tv: 'TV',
      ac: 'AC',
      cocina_equipada: 'Cocina',
      vajilla_completa: 'Vajilla',
      ropa_de_cama: 'Ropa Cama',
      toallas: 'Toallas',
      balcon: 'Balcón',
    };
    return amenities.slice(0, 4).map(a => labels[a] || a).join(', ') + (amenities.length > 4 ? '...' : '');
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
              <Building className="w-5 h-5 md:w-8 md:h-8 text-purple-500 flex-shrink-0" />
              Propiedades
            </h1>
            <p className="text-muted-foreground mt-1 hidden md:block">Administra tus departamentos</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsTaskManagerOpen(true)}
            className="w-9 h-9 md:w-auto md:h-auto md:px-6 md:py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center justify-center gap-2 font-medium"
          >
            <ListTodo className="w-5 h-5 text-blue-500" />
            <span className="hidden md:inline">Tareas</span>
          </button>

          <button
            onClick={() => {
              setEditingProperty(undefined);
              setIsModalOpen(true);
            }}
            className="w-9 h-9 md:w-auto md:h-auto md:px-6 md:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden md:inline">Nueva Propiedad</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-12 bg-white rounded-2xl border-2 border-border">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando propiedades...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border-2 border-border text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">No hay propiedades</h2>
          <p className="text-muted-foreground mb-6">Agrega tu primera propiedad para comenzar</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg inline-flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Crear Primera Propiedad
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-2xl p-6 border-2 border-border hover:border-purple-300 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(property.status)}`}>
                    {getStatusText(property.status)}
                  </span>
                </div>
              </div>

              <h3 className="font-bold text-lg text-foreground mb-1">{property.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{property.city}, {property.state}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span>🛏️</span>
                    <span className="text-muted-foreground">{property.bedrooms} dorm.</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>👥</span>
                    <span className="text-muted-foreground">{property.capacity} pers.</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🚿</span>
                    <span className="text-muted-foreground">{property.bathrooms} baño</span>
                  </div>
                </div>

                {property.amenities && property.amenities.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground border-t border-border pt-2">
                    <Check className="w-3 h-3 text-green-600" />
                    <span>{getAmenitiesText(property.amenities)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 border-t border-border pt-4">
                <button
                  onClick={() => handleOpenDirectv(property)}
                  className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-1.5"
                  title="Gestionar DirecTV"
                >
                  <Tv className="w-4 h-4" />
                  <span className="text-sm">TV</span>
                </button>
                <button
                  onClick={() => handleEditProperty(property)}
                  className="flex-1 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-sm">Editar</span>
                </button>
                <button
                  onClick={() => handleDeleteClick(property)}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-medium transition-colors flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Property Modal */}
      <PropertyModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProperty(undefined);
        }}
        onSave={handleSaveProperty}
        property={editingProperty}
      />

      {/* Directv Manager Modal */}
      <DirectvManager
        isOpen={isDirectvOpen}
        onClose={() => setIsDirectvOpen(false)}
        property={selectedPropertyForDirectv}
      />

      {/* Task Manager Modal */}
      <TaskManager
        isOpen={isTaskManagerOpen}
        onClose={() => setIsTaskManagerOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, property: null })}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar Propiedad?"
        message={`¿Estás segura que deseas eliminar "${deleteConfirm.property?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};
