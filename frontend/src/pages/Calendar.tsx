import { useState } from 'react';
import { useEffect } from 'react';
import {
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { getBookings, createBooking, updateBooking, deleteBooking } from '../services/api';
import { BookingModal } from '../components/BookingModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { PaymentModal } from '../components/PaymentModal';
import { CheckoutModal } from '../components/CheckoutModal';
import { BookingDetailModal } from '../components/BookingDetailModal';
import { Pagination } from '../components/Pagination';

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

// Paleta fija para diferenciar clientes en la grilla del calendario (hash estable por client_id)
const CLIENT_COLORS = [
  { solid: 'bg-brand-600', dot: 'bg-brand-600' },
  { solid: 'bg-emerald-500', dot: 'bg-emerald-500' },
  { solid: 'bg-blue-500', dot: 'bg-blue-500' },
  { solid: 'bg-orange-500', dot: 'bg-orange-500' },
  { solid: 'bg-rose-500', dot: 'bg-rose-500' },
  { solid: 'bg-amber-500', dot: 'bg-amber-500' },
  { solid: 'bg-cyan-500', dot: 'bg-cyan-500' },
  { solid: 'bg-fuchsia-500', dot: 'bg-fuchsia-500' },
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

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const formatShortDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }).replace('.', '');
};

export const Calendar = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
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
      const bookingsData = await getBookings();
      setBookings(bookingsData);
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
      case 'confirmed': return 'bg-[#e6eefc] text-[#2563eb] border-[#c7d9f9]';
      case 'active': return 'bg-[#e4f3ea] text-[#2f8f4e] border-[#bfe3cc]';
      case 'completed': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'pending': return 'bg-[#f0ebf8] text-[#5c3a8c] border-[#e0d3f0]';
      case 'cancelled': return 'bg-[#fdecec] text-[#dc2626] border-[#f7d2d2]';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
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

  return (
    <div className="space-y-6 pb-20 font-sans">
      {errorMessage && (
        <div className="bg-[#fdecec] border border-[#f7d2d2] rounded-xl p-4 flex items-start gap-3 animate-in fade-in">
          <div className="text-[#dc2626] font-bold">!</div>
          <div className="flex-1"><p className="text-sm text-[#dc2626]">{errorMessage}</p></div>
          <button onClick={() => setErrorMessage(null)} className="text-[#dc2626]/60 hover:text-[#dc2626]">✕</button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-[11px] border border-[#e0d7ef] overflow-hidden">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-brand-50 transition-colors"><ChevronLeft className="w-5 h-5 text-brand-700" /></button>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-brand-50 transition-colors border-l border-[#e0d7ef]"><ChevronRight className="w-5 h-5 text-brand-700" /></button>
          </div>
          <h2 className="font-display text-[22px] font-extrabold text-[#121325] capitalize">
            {monthNames[month]} {year}
          </h2>
          <div className="inline-flex bg-[#e2daf0] rounded-xl p-1">
            {(['grid', 'list'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === v ? 'bg-white text-[#5c3a8c] shadow-sm' : 'text-[#8b7aab] hover:text-[#5c3a8c]'
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
                <div key={clientId} className="flex items-center gap-1.5 text-xs font-semibold text-[#5c3a8c]">
                  <span className={`w-2.5 h-2.5 rounded-full ${getClientColor(clientId).dot}`}></span>
                  {getSurname(name)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center p-12 bg-white rounded-2xl border border-[#e7dff3]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div><p className="mt-4 text-muted-foreground">Cargando...</p></div>
      ) : viewMode === 'grid' ? (
        <div className="bg-white rounded-2xl border border-[#e7dff3] p-5 shadow-card">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekdayLabels.map(day => (
              <div key={day} className="text-center text-[11px] font-bold text-[#9583b3] uppercase py-1">{day}</div>
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
                  className={`min-h-[72px] sm:min-h-[96px] p-1.5 rounded-[11px] border transition-colors overflow-hidden flex flex-col
                    ${isToday ? 'bg-[#f5f2fa] border-[#c3abdf]' : 'bg-[#faf8fd] border-transparent'}`}
                >
                  <div className="flex justify-end mb-1">
                    {isToday ? (
                      <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">{day}</span>
                    ) : (
                      <span className="text-xs font-bold text-[#5c3a8c]">{day}</span>
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
                          className={`${color.solid} text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-1 rounded-md truncate cursor-pointer`}
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
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e7dff3] shadow-card p-6">
          {monthBookings.length === 0 ? (
            <p className="text-sm text-[#9583b3] text-center py-8">No hay reservas este mes</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-[#9583b3] border-b border-[#eee5f6]">
                    <th className="pb-3 font-semibold">Cliente</th>
                    <th className="pb-3 font-semibold">Propiedad</th>
                    <th className="pb-3 font-semibold">Estadía</th>
                    <th className="pb-3 font-semibold">Estado</th>
                    <th className="pb-3 font-semibold text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f3eefa]">
                  {paginatedMonthBookings.map(b => {
                    const isPaid = (b.left_to_pay_usd || 0) <= 0;
                    const color = getClientColor(b.client_id);
                    return (
                      <tr
                        key={b.id}
                        onClick={() => setSelectedBooking(b)}
                        className="hover:bg-[#faf8fd] transition-colors cursor-pointer"
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-[10px] ${color.solid} text-white flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                              {getInitials(b.client_name || '?')}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#121325] truncate">{b.client_name || 'Sin cliente'}</p>
                              <p className="text-[11px] font-mono text-[#9583b3]">{b.booking_number}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-[#5c3a8c]">{b.property_name}</td>
                        <td className="py-3 pr-4 text-[#5c3a8c] font-medium whitespace-nowrap">
                          {formatShortDate(b.check_in)} – {formatShortDate(b.check_out)}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(b.status)}`}>
                            {b.status}
                          </span>
                        </td>
                        <td
                          className="py-3 text-right font-display font-bold whitespace-nowrap"
                          style={{ color: isPaid ? '#9583b3' : '#c2410c' }}
                        >
                          {isPaid ? 'Pagado' : `U$D ${(b.left_to_pay_usd || 0).toLocaleString()}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
