import { useState } from 'react';
import { useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Users, BedDouble, Bath, Pencil,
} from 'lucide-react';
import { getBookings, getProperties, createBooking, updateBooking, deleteBooking } from '../services/api';
import { BookingModal } from '../components/BookingModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { PaymentModal } from '../components/PaymentModal';
import { CheckoutModal } from '../components/CheckoutModal';
import { BookingDetailModal } from '../components/BookingDetailModal';
import { Pagination } from '../components/Pagination';
import { KanagawaCard } from '../components/ui/KanagawaCard';
import { kanagawaAssets, pickThemedArtwork } from '../theme/kanagawa-assets';
import { useTheme } from '../theme/ThemeProvider';

const PAGE_SIZE = 10;

interface Booking {
  id: string;
  booking_number: string;
  check_in: string;
  check_out: string;
  status: string;
  guests_count: number;
  adults?: number;
  children?: number;
  pets?: boolean;
  total_price_usd: number;
  advance_payment_usd?: number;
  left_to_pay_usd?: number;
  property_id: string;
  client_id: string;
  property_name?: string;
  client_name?: string;
  deposit_ars?: number;
  payment_status?: string;
  service_status?: string;
  checkout_notes?: string;
}

interface Property {
  id: string;
  bedrooms: number;
  bathrooms: number;
  city?: string;
  state?: string;
}

// Paleta fija para diferenciar clientes en la grilla del calendario (hash estable por client_id)
const CLIENT_COLORS = [
  { solid: 'bg-primary', dot: 'bg-primary' },
  { solid: 'bg-state-green', dot: 'bg-state-green' },
  { solid: 'bg-state-blue', dot: 'bg-state-blue' },
  { solid: 'bg-state-orange', dot: 'bg-state-orange' },
  { solid: 'bg-state-red', dot: 'bg-state-red' },
  { solid: 'bg-state-yellow', dot: 'bg-state-yellow' },
  { solid: 'bg-state-cyan', dot: 'bg-state-cyan' },
  { solid: 'bg-state-green-strong', dot: 'bg-state-green-strong' },
];

const getClientColor = (clientId: string) => {
  let hash = 0;
  for (let i = 0; i < clientId.length; i++) {
    hash = (hash * 31 + clientId.charCodeAt(i)) >>> 0;
  }
  return CLIENT_COLORS[hash % CLIENT_COLORS.length];
};

const getSurname = (fullName?: string) => {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1];
};

const formatShortDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }).replace('.', '');
};

export const Calendar = () => {
  const { theme } = useTheme();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; booking: Booking | null }>({
    isOpen: false,
    booking: null,
  });
  const [settleBooking, setSettleBooking] = useState<Booking | null>(null);
  const [checkoutBooking, setCheckoutBooking] = useState<Booking | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ficha de detalle de la reserva clickeada en la grilla
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Paginado de la vista de lista
  const [listPage, setListPage] = useState(1);
  useEffect(() => {
    setListPage(1);
  }, [currentDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsData, propertiesData] = await Promise.all([getBookings(), getProperties()]);
      setBookings(bookingsData);
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- CRUD Handlers ---
  const handleSaveBooking = async (bookingData: any) => {
    try {
      setErrorMessage(null);
      if (editingBooking) {
        await updateBooking(editingBooking.id, bookingData);
      } else {
        await createBooking(bookingData);
      }
      setIsModalOpen(false);
      setEditingBooking(undefined);
      fetchData();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || 'Error al guardar la reserva');
    }
  };

  const handleSettlePayment = async (updateData: any) => {
    if (!settleBooking) return;
    try {
      await updateBooking(settleBooking.id, updateData);
      setSettleBooking(null);
      fetchData();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || 'Error al registrar el pago');
    }
  };

  const handleCheckout = async (checkoutData: any) => {
    if (!checkoutBooking) return;
    try {
      await updateBooking(checkoutBooking.id, checkoutData);
      setCheckoutBooking(null);
      fetchData();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || 'Error al finalizar estadía');
    }
  };

  const handleDeleteClick = (booking: Booking) => {
    setDeleteConfirm({ isOpen: true, booking });
  };
  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.booking) return;
    try {
      await deleteBooking(deleteConfirm.booking.id);
      fetchData();
      setErrorMessage(null);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || 'Error al eliminar la reserva');
    } finally {
      setDeleteConfirm({ isOpen: false, booking: null });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-state-blue bg-[rgba(118,102,154,0.14)] border-[rgba(118,102,154,0.28)]';
      case 'active': return 'text-state-green-strong bg-[rgba(125,143,116,0.16)] border-[rgba(125,143,116,0.28)]';
      case 'completed': return 'text-ink-secondary bg-surface-elevated border-border-subtle';
      case 'pending': return 'text-state-yellow bg-[rgba(212,178,111,0.16)] border-[rgba(212,178,111,0.28)]';
      case 'cancelled': return 'text-state-red-strong bg-[rgba(166,77,69,0.14)] border-[rgba(166,77,69,0.28)]';
      default: return 'text-ink-secondary bg-surface-elevated border-border-subtle';
    }
  };

  // --- Calendar Logic ---
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDayRaw = new Date(year, month, 1).getDay(); // 0 = Sunday
    // Ajustar para que 0 sea Lunes, 6 sea Domingo
    const firstDay = (firstDayRaw + 6) % 7;
    return { days, firstDay, year, month };
  };

  const { days: totalDays, firstDay, month, year } = getDaysInMonth(currentDate);
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
    setCurrentDate(new Date(newDate));
  };

  const getBookingsForDay = (day: number) => {
    const targetDate = new Date(year, month, day);
    targetDate.setHours(0, 0, 0, 0);

    return bookings.filter(b => {
      if (b.status === 'cancelled' || b.status === 'completed') return false;
      const [sy, sm, sd] = b.check_in.split('-').map(Number);
      const [ey, em, ed] = b.check_out.split('-').map(Number);

      const start = new Date(sy, sm - 1, sd);
      const end = new Date(ey, em - 1, ed);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      return targetDate >= start && targetDate <= end;
    });
  };

  // --- Render ---
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  const allCells = [...blanks, ...days];
  const weekdayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  // Clientes con reservas activas que tocan el mes visible, para la leyenda
  const visibleClients = new Map<string, string>();
  bookings.forEach(b => {
    if (b.status === 'cancelled') return;
    const checkInDate = new Date(b.check_in);
    const checkOutDate = new Date(b.check_out);
    if (checkInDate <= monthEnd && checkOutDate >= monthStart) {
      visibleClients.set(b.client_id, b.client_name || '');
    }
  });

  // Todas las reservas que tocan el mes visible, para la vista de lista
  const monthBookings = bookings
    .filter(b => {
      const checkInDate = new Date(b.check_in);
      const checkOutDate = new Date(b.check_out);
      return checkInDate <= monthEnd && checkOutDate >= monthStart;
    })
    .sort((a, b) => a.check_in.localeCompare(b.check_in));

  const listTotalPages = Math.max(1, Math.ceil(monthBookings.length / PAGE_SIZE));
  const paginatedMonthBookings = monthBookings.slice((listPage - 1) * PAGE_SIZE, listPage * PAGE_SIZE);
  const propertyById = new Map(properties.map((p) => [p.id, p]));
  const PropertyArt = pickThemedArtwork(kanagawaAssets.cards.propertyLandscape, theme);

  return (
    <div className="space-y-6 pb-20 font-sans">
      {errorMessage && (
        <div className="bg-[rgba(166,77,69,0.1)] border border-[rgba(166,77,69,0.22)] rounded-xl p-4 flex items-start gap-3 animate-in fade-in">
          <div className="text-state-red font-bold">!</div>
          <div className="flex-1"><p className="text-sm text-state-red">{errorMessage}</p></div>
          <button onClick={() => setErrorMessage(null)} className="text-state-red/60 hover:text-state-red">✕</button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-[11px] border border-border-subtle overflow-hidden">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-surface-hover transition-colors duration-fast ease-kanagawa"><ChevronLeft className="w-5 h-5 text-primary" strokeWidth={1.7} /></button>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-surface-hover transition-colors duration-fast ease-kanagawa border-l border-border-subtle"><ChevronRight className="w-5 h-5 text-primary" strokeWidth={1.7} /></button>
          </div>
          <h2 className="font-display text-[22px] font-extrabold text-ink-primary capitalize">
            {monthNames[month]} {year}
          </h2>
          <div className="inline-flex bg-surface-violet rounded-xl p-1">
            {(['grid', 'list'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-fast ease-kanagawa ${
                  viewMode === v ? 'bg-surface text-cta shadow-sm' : 'text-ink-muted hover:text-cta'
                }`}
              >
                {v === 'grid' ? 'Calendario' : 'Lista'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {visibleClients.size > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              {Array.from(visibleClients.entries()).map(([clientId, name]) => (
                <div key={clientId} className="flex items-center gap-1.5 text-xs font-semibold text-ink-secondary">
                  <span className={`w-2.5 h-2.5 rounded-full ${getClientColor(clientId).dot}`}></span>
                  {getSurname(name)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <KanagawaCard className="text-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-ink-muted">Cargando...</p>
        </KanagawaCard>
      ) : viewMode === 'grid' ? (
        <KanagawaCard className="p-5">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekdayLabels.map(day => (
              <div key={day} className="text-center text-[11px] font-bold text-ink-muted uppercase py-1">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {allCells.map((day, index) => {
              if (!day) return <div key={`blank-${index}`} className="min-h-[72px] sm:min-h-[96px] rounded-[11px] bg-transparent"></div>;

              const dayBookings = getBookingsForDay(day);
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

              return (
                <div
                  key={day}
                  className={`calendar-day min-h-[72px] sm:min-h-[96px] p-1.5 transition-colors overflow-hidden flex flex-col
                    ${isToday ? 'calendar-day-selected' : ''}`}
                >
                  <div className="flex justify-end mb-1">
                    {isToday ? (
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{day}</span>
                    ) : (
                      <span className="text-xs font-bold text-ink-secondary">{day}</span>
                    )}
                  </div>
                  <div className="space-y-1 overflow-y-auto flex-1 hide-scrollbar">
                    {dayBookings.map(b => {
                      const [ciY, ciM, ciD] = b.check_in.split('-').map(Number);
                      const isCheckInDay = ciY === year && (ciM - 1) === month && ciD === day;
                      const color = getClientColor(b.client_id);
                      return isCheckInDay ? (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBooking(b)}
                          title={`${b.client_name} · ${b.property_name}`}
                          className={`${color.solid} text-primary-foreground text-[9px] sm:text-[10px] font-bold px-1.5 py-1 rounded-md truncate cursor-pointer`}
                        >
                          {getSurname(b.client_name)}
                        </div>
                      ) : (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBooking(b)}
                          title={`${b.client_name} · ${b.property_name}`}
                          className={`${color.solid} opacity-55 h-2 rounded-md cursor-pointer`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </KanagawaCard>
      ) : (
        <div className="space-y-4">
          {monthBookings.length === 0 ? (
            <KanagawaCard className="p-6">
              <p className="text-sm text-ink-muted text-center py-8">No hay reservas este mes</p>
            </KanagawaCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedMonthBookings.map(b => {
                const isPaid = (b.left_to_pay_usd || 0) <= 0;
                const property = propertyById.get(b.property_id);
                const [ciDay] = b.check_in.split('-').slice(2);
                const ciMonthShort = formatShortDate(b.check_in).split(' ')[1];

                return (
                  <KanagawaCard
                    key={b.id}
                    padded={false}
                    className="cursor-pointer hover:shadow-card-hover hover:-translate-y-[3px] transition-all duration-300 overflow-hidden flex flex-col"
                    onClick={() => setSelectedBooking(b)}
                  >
                    <div className="relative property-card-image w-full overflow-hidden">
                      <PropertyArt className="h-full w-full" />
                      <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm rounded-md px-2.5 py-1 text-center">
                        <p className="font-display font-extrabold text-lg text-ink-primary leading-none">{ciDay}</p>
                        <p className="text-[9px] font-bold uppercase text-ink-muted leading-none mt-0.5">{ciMonthShort}</p>
                      </div>
                      <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(b.status)}`}>
                        {b.status}
                      </span>
                    </div>

                    <div className="p-[18px] flex-1 flex flex-col">
                      <p className="font-semibold text-ink-primary truncate">{b.client_name || 'Sin cliente'}</p>
                      <p className="text-[11px] font-mono text-ink-muted mb-3">{b.booking_number}</p>
                      <p className="text-xs text-ink-secondary mb-3">
                        {b.property_name}
                        {(property?.city || property?.state) && ` · ${[property?.city, property?.state].filter(Boolean).join(', ')}`}
                      </p>

                      <div className="flex items-center text-sm mb-3 divide-x divide-border-subtle border-t border-border-subtle pt-3">
                        <div className="flex-1 flex items-center justify-center gap-1.5 text-ink-secondary">
                          <Users className="w-3.5 h-3.5" strokeWidth={1.7} />
                          <span className="font-semibold">{b.guests_count}</span>
                        </div>
                        {property && (
                          <>
                            <div className="flex-1 flex items-center justify-center gap-1.5 text-ink-secondary">
                              <BedDouble className="w-3.5 h-3.5" strokeWidth={1.7} />
                              <span className="font-semibold">{property.bedrooms}</span>
                            </div>
                            <div className="flex-1 flex items-center justify-center gap-1.5 text-ink-secondary">
                              <Bath className="w-3.5 h-3.5" strokeWidth={1.7} />
                              <span className="font-semibold">{property.bathrooms}</span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <p className={`font-display font-bold ${isPaid ? 'text-ink-muted' : 'text-state-orange'}`}>
                          {isPaid ? 'Pagado' : `U$D ${(b.left_to_pay_usd || 0).toLocaleString()}`}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditBooking(b); }}
                          className="flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-primary transition-colors duration-fast ease-kanagawa"
                        >
                          <Pencil className="w-3.5 h-3.5" strokeWidth={1.7} />
                          Editar
                        </button>
                      </div>
                    </div>
                  </KanagawaCard>
                );
              })}
            </div>
          )}
          <Pagination currentPage={listPage} totalPages={listTotalPages} onPageChange={setListPage} />
        </div>
      )}

      <BookingDetailModal
        isOpen={!!selectedBooking}
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onCheckout={(b) => { setCheckoutBooking(b as Booking); setSelectedBooking(null); }}
        onSettle={(b) => { setSettleBooking(b as Booking); setSelectedBooking(null); }}
        onEdit={(b) => { handleEditBooking(b as Booking); setSelectedBooking(null); }}
        onDelete={(b) => { handleDeleteClick(b as Booking); setSelectedBooking(null); }}
        getStatusColor={getStatusColor}
      />

      <BookingModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingBooking(undefined); }} onSave={handleSaveBooking} booking={editingBooking} />
      <PaymentModal isOpen={!!settleBooking} booking={settleBooking} onClose={() => setSettleBooking(null)} onConfirm={handleSettlePayment} />
      <CheckoutModal isOpen={!!checkoutBooking} booking={checkoutBooking} onClose={() => setCheckoutBooking(null)} onConfirm={handleCheckout} />
      <ConfirmModal isOpen={deleteConfirm.isOpen} onClose={() => setDeleteConfirm({ isOpen: false, booking: null })} onConfirm={handleConfirmDelete} title="¿Eliminar Reserva?" message="¿Estás segura? Esta acción no se puede deshacer." confirmText="Eliminar" cancelText="Cancelar" type="danger" />
    </div>
  );
};
