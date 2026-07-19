import { useEffect, useState, useMemo } from 'react';
import { Building2, Plus, Trash2, Edit, Check, Tv, ListTodo, MapPin } from 'lucide-react';
import { getProperties, getBookings, createProperty, updateProperty, deleteProperty } from '../services/api';
import { PropertyModal } from '../components/PropertyModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { DirectvManager } from '../components/DirectvManager';
import { TaskManager } from '../components/TaskManager';
import { KanagawaCard } from '../components/ui/KanagawaCard';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { kanagawaAssets, pickThemedArtwork } from '../theme/kanagawa-assets';
import { useTheme } from '../theme/ThemeProvider';

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
  available: { label: 'Disponible', chip: 'status-available' },
  occupied: { label: 'Ocupada', chip: 'status-occupied' },
  maintenance: {
    label: 'Mantenimiento',
    chip: 'border border-[rgba(212,178,111,0.28)] bg-[rgba(212,178,111,0.16)] text-state-yellow',
  },
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
  const { theme } = useTheme();
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

  const PropertyArt = pickThemedArtwork(kanagawaAssets.cards.propertyLandscape, theme);

  return (
    <div className="space-y-6 font-sans">
      {errorMessage && (
        <div className="bg-[rgba(166,77,69,0.14)] border border-[rgba(166,77,69,0.28)] rounded-xl p-4 flex items-start gap-3 animate-in fade-in">
          <div className="w-8 h-8 rounded-lg bg-[rgba(166,77,69,0.14)] flex items-center justify-center flex-shrink-0">
            <span className="text-state-red-strong font-bold">!</span>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-state-red-strong mb-1">Error</h4>
            <p className="text-sm text-state-red-strong">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-state-red-strong/60 hover:text-state-red-strong">✕</button>
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
              className={`px-4 py-2 rounded-[11px] text-sm font-semibold transition-all duration-fast ease-kanagawa border ${
                statusFilter === chip.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-btn-primary'
                  : 'bg-surface text-primary border-border hover:bg-surface-hover'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setIsTaskManagerOpen(true)}>
            <ListTodo className="w-4 h-4" strokeWidth={1.7} />
            <span className="hidden md:inline">Tareas</span>
          </Button>
          <Button variant="primary" onClick={() => { setEditingProperty(undefined); setIsModalOpen(true); }}>
            <Plus className="w-4 h-4" strokeWidth={1.7} />
            <span className="hidden md:inline">Agregar propiedad</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-12 bg-surface-elevated rounded-2xl border border-border-subtle">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-ink-secondary">Cargando propiedades...</p>
        </div>
      ) : filteredProperties.length === 0 ? (
        <KanagawaCard className="text-center">
          <EmptyState
            icon={<Building2 className="w-8 h-8" strokeWidth={1.7} />}
            title="No hay propiedades"
            description="Agrega tu primera propiedad para comenzar"
            action={
              <Button variant="primary" onClick={() => { setEditingProperty(undefined); setIsModalOpen(true); }}>
                <Plus className="w-5 h-5" strokeWidth={1.7} />
                Crear primera propiedad
              </Button>
            }
          />
        </KanagawaCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[18px]">
          {filteredProperties.map((property) => {
            const status = STATUS_CONFIG[property.status] || {
              label: property.status,
              chip: 'border border-border-subtle bg-surface-elevated text-ink-secondary',
            };
            const avgPrice = getAvgPricePerNight(property.id);
            const occupancy = getMonthOccupancy(property.id);

            return (
              <KanagawaCard
                key={property.id}
                padded={false}
                className="hover:shadow-card-hover hover:-translate-y-[3px] transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className="relative property-card-image w-full overflow-hidden">
                  <PropertyArt className="h-full w-full opacity-70" />
                  <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${status.chip}`}>
                    {status.label}
                  </span>
                </div>

                <div className="p-[18px] flex-1 flex flex-col">
                  <h3 className="font-display text-base font-extrabold text-ink-primary mb-1">{property.name}</h3>
                  <p className="text-xs text-ink-secondary flex items-center gap-1 mb-3">
                    <MapPin className="w-3 h-3" strokeWidth={1.7} />
                    {[property.city, property.state].filter(Boolean).join(', ') || property.address}
                    {' · '}{TYPE_LABELS[property.property_type] || property.property_type}
                  </p>

                  <div className="flex items-center text-sm mb-3 divide-x divide-border-subtle">
                    <div className="flex-1 text-center">
                      <p className="font-display text-lg font-extrabold text-ink-primary leading-none">{property.capacity}</p>
                      <p className="text-[10px] text-ink-muted uppercase font-bold tracking-wide mt-1">Huésp.</p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="font-display text-lg font-extrabold text-ink-primary leading-none">{property.bedrooms}</p>
                      <p className="text-[10px] text-ink-muted uppercase font-bold tracking-wide mt-1">Dorm.</p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="font-display text-lg font-extrabold text-ink-primary leading-none">{property.bathrooms}</p>
                      <p className="text-[10px] text-ink-muted uppercase font-bold tracking-wide mt-1">Baños</p>
                    </div>
                  </div>

                  {property.amenities && property.amenities.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-ink-secondary border-t border-border-subtle pt-2 mb-3">
                      <Check className="w-3 h-3 text-state-green-strong" strokeWidth={1.7} />
                      <span className="truncate">{getAmenitiesText(property.amenities)}</span>
                    </div>
                  )}

                  <div className="mt-auto flex items-end justify-between pt-2">
                    <div>
                      {avgPrice !== null ? (
                        <>
                          <p className="font-mono text-base font-extrabold text-primary leading-none">
                            USD {Math.round(avgPrice).toLocaleString()} <span className="font-sans text-xs font-normal text-ink-muted">/noche</span>
                          </p>
                          <p className="text-[9px] text-ink-muted font-semibold uppercase tracking-wide mt-0.5">Promedio histórico</p>
                        </>
                      ) : (
                        <p className="text-xs text-ink-muted font-medium">Sin historial de reservas</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-ink-muted font-bold uppercase tracking-wide">Ocupación</p>
                      <p className="font-display text-sm font-extrabold text-state-green-strong leading-none">{occupancy}%</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-border-subtle p-3">
                  <button
                    onClick={() => handleOpenDirectv(property)}
                    title="Gestionar DirecTV"
                    className="flex-1 px-3 py-2 bg-[rgba(118,102,154,0.14)] hover:bg-[rgba(118,102,154,0.24)] text-state-blue rounded-[10px] font-semibold text-sm transition-colors duration-fast ease-kanagawa flex items-center justify-center gap-1.5"
                  >
                    <Tv className="w-4 h-4" strokeWidth={1.7} />
                    TV
                  </button>
                  <button
                    onClick={() => handleEditProperty(property)}
                    className="flex-1 px-3 py-2 bg-surface-violet hover:bg-surface-hover text-primary rounded-[10px] font-semibold text-sm transition-colors duration-fast ease-kanagawa flex items-center justify-center gap-1.5"
                  >
                    <Edit className="w-4 h-4" strokeWidth={1.7} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteClick(property)}
                    title="Eliminar"
                    className="px-3 py-2 bg-[rgba(166,77,69,0.14)] hover:bg-[rgba(166,77,69,0.24)] text-state-red-strong rounded-[10px] transition-colors duration-fast ease-kanagawa flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.7} />
                  </button>
                </div>
              </KanagawaCard>
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
