import { useEffect, useState, useMemo } from 'react';
import { Building2, Plus, Trash2, Edit, Check, Tv, ListTodo, MapPin } from 'lucide-react';
import { getProperties, getBookings, createProperty, updateProperty, deleteProperty } from '../services/api';
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

interface Booking {
  id: string;
  property_id: string;
  status: string;
  check_in: string;
  check_out: string;
  total_price_usd: number;
}

const STATUS_CONFIG: Record<string, { label: string; chip: string }> = {
  available: { label: 'Disponible', chip: 'bg-[#e4f3ea] text-[#2f8f4e] border-[#bfe3cc]' },
  occupied: { label: 'Ocupada', chip: 'bg-[#e6eefc] text-[#2563eb] border-[#c7d9f9]' },
  maintenance: { label: 'Mantenimiento', chip: 'bg-[#fdf0e2] text-[#c2410c] border-[#f6ddb5]' },
};

const TYPE_LABELS: Record<string, string> = {
  apartment: 'Departamento',
  house: 'Casa',
  studio: 'Monoambiente',
};

const dateFromISO = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const nightsBetween = (checkIn: string, checkOut: string) => {
  const diff = dateFromISO(checkOut).getTime() - dateFromISO(checkIn).getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
};

export const Properties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'occupied'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; property: Property | null }>({
    isOpen: false,
    property: null,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isDirectvOpen, setIsDirectvOpen] = useState(false);
  const [selectedPropertyForDirectv, setSelectedPropertyForDirectv] = useState<Property | null>(null);
  const [isTaskManagerOpen, setIsTaskManagerOpen] = useState(false);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const data = await getProperties();
      setProperties(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
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
    fetchProperties();
    fetchBookings();
  }, []);

  // Reservas reales por propiedad, para precio promedio y ocupación del mes — sin datos inventados.
  const bookingsByProperty = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach((b) => {
      if (b.status === 'cancelled') return;
      if (!map.has(b.property_id)) map.set(b.property_id, []);
      map.get(b.property_id)!.push(b);
    });
    return map;
  }, [bookings]);

  const getAvgPricePerNight = (propertyId: string): number | null => {
    const list = bookingsByProperty.get(propertyId) || [];
    let totalNights = 0;
    let totalUsd = 0;
    list.forEach((b) => {
      const nights = nightsBetween(b.check_in, b.check_out);
      if (nights > 0) {
        totalNights += nights;
        totalUsd += b.total_price_usd || 0;
      }
    });
    return totalNights > 0 ? totalUsd / totalNights : null;
  };

  const getMonthOccupancy = (propertyId: string): number => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysInMonth = monthEnd.getDate();
    const list = bookingsByProperty.get(propertyId) || [];
    let bookedNights = 0;
    list.forEach((b) => {
      const ci = dateFromISO(b.check_in);
      const co = dateFromISO(b.check_out);
      const overlapStart = ci > monthStart ? ci : monthStart;
      const overlapEnd = co < monthEnd ? co : monthEnd;
      const nights = Math.max(0, Math.round((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)));
      bookedNights += nights;
    });
    return Math.round((bookedNights / daysInMonth) * 100);
  };

  const counts = useMemo(() => ({
    all: properties.length,
    available: properties.filter((p) => p.status === 'available').length,
    occupied: properties.filter((p) => p.status === 'occupied').length,
  }), [properties]);

  const filteredProperties = properties.filter((p) => statusFilter === 'all' || p.status === statusFilter);

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
      setErrorMessage(error.response?.data?.detail || 'Error al eliminar la propiedad');
    } finally {
      setDeleteConfirm({ isOpen: false, property: null });
    }
  };

  const handleOpenDirectv = (property: Property) => {
    setSelectedPropertyForDirectv(property);
    setIsDirectvOpen(true);
  };

  const getAmenitiesText = (amenities: string[]) => {
    const labels: Record<string, string> = {
      wifi: 'WiFi',
      tv: 'TV',
      ac: 'AC',
      cocina_equipada: 'Cocina',
      vajilla_completa: 'Vajilla',
      ropa_de_cama: 'Ropa Cama',
      toallas: 'Toallas',
      balcon: 'Balcón',
    };
    return amenities.slice(0, 4).map((a) => labels[a] || a).join(', ') + (amenities.length > 4 ? '...' : '');
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
        <div className="flex items-center gap-2 flex-wrap">
          {([
            { value: 'all', label: `Todas · ${counts.all}` },
            { value: 'available', label: `Disponibles · ${counts.available}` },
            { value: 'occupied', label: `Ocupadas · ${counts.occupied}` },
          ] as const).map((chip) => (
            <button
              key={chip.value}
              onClick={() => setStatusFilter(chip.value)}
              className={`px-4 py-2 rounded-[11px] text-sm font-semibold transition-all border ${
                statusFilter === chip.value
                  ? 'bg-brand-600 text-white border-brand-600 shadow-btn-primary'
                  : 'bg-white text-[#5c3a8c] border-[#e0d7ef] hover:bg-brand-50'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTaskManagerOpen(true)}
            className="px-4 py-2.5 bg-white border border-[#e0d7ef] text-[#5c3a8c] rounded-[11px] hover:bg-brand-50 transition-all flex items-center gap-2 font-semibold text-sm"
          >
            <ListTodo className="w-4 h-4" />
            <span className="hidden md:inline">Tareas</span>
          </button>
          <button
            onClick={() => { setEditingProperty(undefined); setIsModalOpen(true); }}
            className="px-4 py-2.5 bg-brand-600 hover:bg-[#6b4d95] text-white rounded-[11px] shadow-btn-primary transition-all hover:-translate-y-px flex items-center gap-2 font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Agregar propiedad</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-12 bg-white rounded-2xl border border-[#e7dff3]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-[#7b6b95]">Cargando propiedades...</p>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-[#e7dff3] text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-brand-600" />
          </div>
          <h2 className="font-display text-2xl font-extrabold text-[#121325] mb-2">No hay propiedades</h2>
          <p className="text-[#7b6b95] mb-6">Agrega tu primera propiedad para comenzar</p>
          <button
            onClick={() => { setEditingProperty(undefined); setIsModalOpen(true); }}
            className="px-6 py-3 bg-brand-600 hover:bg-[#6b4d95] text-white rounded-[11px] shadow-btn-primary transition-all inline-flex items-center gap-2 font-semibold"
          >
            <Plus className="w-5 h-5" />
            Crear primera propiedad
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[18px]">
          {filteredProperties.map((property) => {
            const status = STATUS_CONFIG[property.status] || { label: property.status, chip: 'bg-gray-100 text-gray-600 border-gray-200' };
            const avgPrice = getAvgPricePerNight(property.id);
            const occupancy = getMonthOccupancy(property.id);

            return (
              <div
                key={property.id}
                className="bg-white rounded-2xl border border-[#e7dff3] shadow-card hover:shadow-card-hover hover:-translate-y-[3px] transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className="relative h-24 bg-gradient-to-br from-brand-300 to-brand-600 flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-white/40" strokeWidth={1.5} />
                  <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${status.chip}`}>
                    {status.label}
                  </span>
                </div>

                <div className="p-[18px] flex-1 flex flex-col">
                  <h3 className="font-display text-base font-extrabold text-[#121325] mb-1">{property.name}</h3>
                  <p className="text-xs text-[#7b6b95] flex items-center gap-1 mb-3">
                    <MapPin className="w-3 h-3" />
                    {[property.city, property.state].filter(Boolean).join(', ') || property.address}
                    {' · '}{TYPE_LABELS[property.property_type] || property.property_type}
                  </p>

                  <div className="flex items-center text-sm mb-3 divide-x divide-[#eee5f6]">
                    <div className="flex-1 text-center">
                      <p className="font-display text-lg font-extrabold text-[#121325] leading-none">{property.capacity}</p>
                      <p className="text-[10px] text-[#9583b3] uppercase font-bold tracking-wide mt-1">Huésp.</p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="font-display text-lg font-extrabold text-[#121325] leading-none">{property.bedrooms}</p>
                      <p className="text-[10px] text-[#9583b3] uppercase font-bold tracking-wide mt-1">Dorm.</p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="font-display text-lg font-extrabold text-[#121325] leading-none">{property.bathrooms}</p>
                      <p className="text-[10px] text-[#9583b3] uppercase font-bold tracking-wide mt-1">Baños</p>
                    </div>
                  </div>

                  {property.amenities && property.amenities.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-[#7b6b95] border-t border-[#eee5f6] pt-2 mb-3">
                      <Check className="w-3 h-3 text-[#2f8f4e]" />
                      <span className="truncate">{getAmenitiesText(property.amenities)}</span>
                    </div>
                  )}

                  <div className="mt-auto flex items-end justify-between pt-2">
                    <div>
                      {avgPrice !== null ? (
                        <>
                          <p className="font-display text-base font-extrabold text-[#5c3a8c] leading-none">
                            USD {Math.round(avgPrice).toLocaleString()} <span className="font-sans text-xs font-normal text-[#9583b3]">/noche</span>
                          </p>
                          <p className="text-[9px] text-[#9583b3] font-semibold uppercase tracking-wide mt-0.5">Promedio histórico</p>
                        </>
                      ) : (
                        <p className="text-xs text-[#9583b3] font-medium">Sin historial de reservas</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[#9583b3] font-bold uppercase tracking-wide">Ocupación</p>
                      <p className="font-display text-sm font-extrabold text-[#2f8f4e] leading-none">{occupancy}%</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-[#eee5f6] p-3">
                  <button
                    onClick={() => handleOpenDirectv(property)}
                    title="Gestionar DirecTV"
                    className="flex-1 px-3 py-2 bg-[#e6eefc] hover:bg-[#d6e4fb] text-[#2563eb] rounded-[10px] font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Tv className="w-4 h-4" />
                    TV
                  </button>
                  <button
                    onClick={() => handleEditProperty(property)}
                    className="flex-1 px-3 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-[10px] font-semibold text-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteClick(property)}
                    title="Eliminar"
                    className="px-3 py-2 bg-[#fdecec] hover:bg-[#fbd9d9] text-[#dc2626] rounded-[10px] transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PropertyModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingProperty(undefined); }}
        onSave={handleSaveProperty}
        property={editingProperty}
      />

      <DirectvManager
        isOpen={isDirectvOpen}
        onClose={() => setIsDirectvOpen(false)}
        property={selectedPropertyForDirectv}
      />

      <TaskManager
        isOpen={isTaskManagerOpen}
        onClose={() => setIsTaskManagerOpen(false)}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, property: null })}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar propiedad?"
        message={`¿Estás segura que deseas eliminar "${deleteConfirm.property?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};
