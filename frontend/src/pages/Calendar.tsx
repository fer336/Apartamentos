import { useState } from 'react';
import { useEffect } from 'react';
import {
  Calendar as CalendarIcon, Plus, Edit, Trash2,
  Home, User, Clock, CheckCircle, Coffee, Ban, DollarSign,
  Hourglass, LogOut, MessageSquare, ChevronLeft, ChevronRight, LayoutGrid, List,
  X
} from 'lucide-react';
import { getBookings, createBooking, updateBooking, deleteBooking } from '../services/api';
import { BookingModal } from '../components/BookingModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { PaymentModal } from '../components/PaymentModal';
import { CheckoutModal } from '../components/CheckoutModal';

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

export const Calendar = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // View State
  const [viewMode, setViewMode] = useState<'cards' | 'calendar'>('cards');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filter State
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [filterPayment, setFilterPayment] = useState<'all' | 'paid' | 'pending'>('all');
  const [filterMonth, setFilterMonth] = useState<Date>(new Date()); // Mes actual por defecto

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

  const handleDeleteClick = (booking: Booking) => setDeleteConfirm({ isOpen: true, booking });
  const handleEditBooking = (booking: Booking) => { setEditingBooking(booking); setIsModalOpen(true); };

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

  // --- Helpers ---
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [, month, day] = dateString.split('-');
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${parseInt(day)} ${months[parseInt(month) - 1]}`;
  };

  // Filtrar reservas según los filtros seleccionados
  const filteredBookings = bookings.filter(booking => {
    if (filterStatus !== 'all' && booking.status !== filterStatus) {
      return false;
    }

    if (filterPayment === 'paid' && (booking.left_to_pay_usd || 0) > 0) {
      return false;
    }
    if (filterPayment === 'pending' && (booking.left_to_pay_usd || 0) <= 0) {
      return false;
    }

    if (viewMode === 'cards') {
      const checkInDate = new Date(booking.check_in);
      const checkOutDate = new Date(booking.check_out);
      const filterMonthStart = new Date(filterMonth.getFullYear(), filterMonth.getMonth(), 1);
      const filterMonthEnd = new Date(filterMonth.getFullYear(), filterMonth.getMonth() + 1, 0);

      return checkInDate <= filterMonthEnd && checkOutDate >= filterMonthStart;
    }

    return true;
  });

  const getDaysRemaining = (checkOutDate: string) => {
    if (!checkOutDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = checkOutDate.split('-');
    const end = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    end.setHours(0, 0, 0, 0);

    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

  // --- Render Components ---

  const renderCardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredBookings.map((booking) => {
        const leftToPay = booking.left_to_pay_usd || 0;
        const isFullyPaid = leftToPay <= 0;
        const hasServices = booking.service_status === 'SERVICIOS';
        const daysRemaining = getDaysRemaining(booking.check_out);
        const isEndingSoon = daysRemaining <= 2 && daysRemaining >= 0;
        const isCompleted = booking.status === 'completed';

        return (
          <div key={booking.id} className="bg-white rounded-2xl p-5 border border-[#e7dff3] shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between font-sans">
            <div className="flex justify-between items-start mb-4">
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(booking.status)}`}>
                {booking.status}
              </div>
              <div className="text-right">
                <div className="font-display text-lg font-black text-[#121325] leading-none">
                  ${booking.total_price_usd.toLocaleString()}
                </div>
                {isFullyPaid ? (
                  <span className="text-[10px] font-bold text-[#2f8f4e] flex items-center justify-end gap-1 mt-1">
                    <CheckCircle className="w-3 h-3" /> PAGADO
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-[#c2410c] flex items-center justify-end gap-1 mt-1 bg-[#fdf0e2] px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" /> DEBE ${leftToPay.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-[11px] bg-brand-50 flex items-center justify-center text-brand-600 flex-shrink-0">
                  <Home className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-[#9583b3] font-bold uppercase tracking-wide">Propiedad</p>
                  <h3 className="font-bold text-sm text-[#121325] truncate">{booking.property_name}</h3>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-[11px] bg-[#e6eefc] flex items-center justify-center text-[#2563eb] flex-shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-[#9583b3] font-bold uppercase tracking-wide">Cliente</p>
                  <h3 className="font-bold text-sm text-[#121325] truncate">{booking.client_name}</h3>
                </div>
              </div>

              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                booking.deposit_ars && booking.deposit_ars > 0
                  ? 'bg-[#fdf0e2] border-[#f6ddb5]'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  booking.deposit_ars && booking.deposit_ars > 0
                    ? 'bg-[#f6ddb5]'
                    : 'bg-gray-200'
                }`}>
                  {booking.deposit_ars && booking.deposit_ars > 0 ? '💰' : '⏳'}
                </div>
                <span className={`text-xs font-bold ${
                  booking.deposit_ars && booking.deposit_ars > 0
                    ? 'text-[#c2410c]'
                    : 'text-gray-500'
                }`}>
                  {booking.deposit_ars && booking.deposit_ars > 0
                    ? `Depósito: $${booking.deposit_ars.toLocaleString()} ARS`
                    : 'Sin depósito'}
                </span>
              </div>

              {booking.checkout_notes && booking.checkout_notes.trim() && (
                <div className="bg-brand-50 p-3 rounded-xl border border-brand-100">
                  <p className="text-[10px] font-bold text-brand-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Observaciones del Huésped
                  </p>
                  <p className="text-xs text-gray-700 font-medium">{booking.checkout_notes}</p>
                </div>
              )}

              <div className="pt-3 border-t border-dashed border-gray-100 space-y-2">
                <div className="flex items-center gap-2 text-gray-600 font-medium text-sm">
                  <CalendarIcon className="w-4 h-4 text-brand-500" />
                  <span>{formatDate(booking.check_in)} - {formatDate(booking.check_out)}</span>
                </div>

                {!isCompleted && daysRemaining >= 0 && (
                  <div className={`flex items-center gap-1.5 text-xs font-bold ${isEndingSoon ? 'text-[#dc2626]' : 'text-gray-400'}`}>
                    <Hourglass className="w-3 h-3" /> {daysRemaining === 0 ? 'Check-out HOY' : `Quedan ${daysRemaining} días`}
                  </div>
                )}

                <div className="bg-[#f5f2fa] px-3 py-2 rounded-xl border border-[#e7dff3]">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                    {booking.adults !== undefined && booking.adults > 0 && (
                      <span className="flex items-center gap-1 text-[#2563eb] bg-white/70 px-2 py-1 rounded-lg">
                        👤 <strong>{booking.adults}</strong> {booking.adults === 1 ? 'Adulto' : 'Adultos'}
                      </span>
                    )}
                    {booking.children !== undefined && booking.children > 0 && (
                      <span className="flex items-center gap-1 text-brand-700 bg-white/70 px-2 py-1 rounded-lg">
                        👶 <strong>{booking.children}</strong> {booking.children === 1 ? 'Niño' : 'Niños'}
                      </span>
                    )}
                    {booking.pets && (
                      <span className="flex items-center gap-1 text-[#c2410c] bg-white/70 px-2 py-1 rounded-lg">
                        🐾 Mascota
                      </span>
                    )}
                    {(!booking.adults && !booking.children) && (
                      <span className="flex items-center gap-1 text-gray-700 bg-white/70 px-2 py-1 rounded-lg">
                        👥 <strong>{booking.guests_count}</strong> {booking.guests_count === 1 ? 'Huésped' : 'Huéspedes'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  {hasServices ? (
                    <span className="text-[10px] font-bold text-white bg-brand-600 px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm"><Coffee className="w-3 h-3" /> CON SERVICIOS</span>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg flex items-center gap-1"><Ban className="w-3 h-3" /> SIN SERVICIOS</span>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones — siempre visibles (no ocultas detrás de hover, rompía en mobile) */}
            <div className="flex gap-2 border-t border-[#eee5f6] pt-4 mt-auto">
              {!isCompleted && booking.status !== 'cancelled' && (
                <button onClick={() => setCheckoutBooking(booking)} title="Checkout" className="flex-1 flex flex-col items-center gap-1 py-2 hover:bg-violet-50 text-violet-600 rounded-xl transition-colors">
                  <LogOut className="w-4 h-4" /><span className="text-[9px] font-bold">Checkout</span>
                </button>
              )}
              {!isFullyPaid && !isCompleted && (
                <button onClick={() => setSettleBooking(booking)} title="Saldar" className="flex-1 flex flex-col items-center gap-1 py-2 hover:bg-emerald-50 text-emerald-600 rounded-xl transition-colors">
                  <DollarSign className="w-4 h-4" /><span className="text-[9px] font-bold">Saldar</span>
                </button>
              )}
              <button onClick={() => handleEditBooking(booking)} title="Editar" className="flex-1 flex flex-col items-center gap-1 py-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-colors">
                <Edit className="w-4 h-4" /><span className="text-[9px] font-bold">Editar</span>
              </button>
              <button onClick={() => handleDeleteClick(booking)} title="Eliminar" className="flex-1 flex flex-col items-center gap-1 py-2 hover:bg-red-50 text-red-600 rounded-xl transition-colors">
                <Trash2 className="w-4 h-4" /><span className="text-[9px] font-bold">Eliminar</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderCalendarView = () => {
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

    return (
      <div className="animate-in fade-in">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-[11px] border border-[#e0d7ef] overflow-hidden">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-brand-50 transition-colors"><ChevronLeft className="w-5 h-5 text-brand-700" /></button>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-brand-50 transition-colors border-l border-[#e0d7ef]"><ChevronRight className="w-5 h-5 text-brand-700" /></button>
            </div>
            <h2 className="font-display text-[22px] font-extrabold text-[#121325] capitalize">
              {monthNames[month]} {year}
            </h2>
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
            <button onClick={() => { setEditingBooking(undefined); setIsModalOpen(true); }} className="px-4 py-2.5 bg-brand-600 hover:bg-[#6b4d95] text-white rounded-[11px] shadow-btn-primary transition-all hover:-translate-y-px flex items-center gap-2 font-semibold text-sm">
              <Plus className="w-4 h-4" />
              Nueva reserva
            </button>
          </div>
        </div>

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
                          onClick={() => handleEditBooking(b)}
                          title={`${b.client_name} · ${b.property_name}`}
                          className={`${color.solid} text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-1 rounded-md truncate cursor-pointer`}
                        >
                          {getSurname(b.client_name)}
                        </div>
                      ) : (
                        <div
                          key={b.id}
                          onClick={() => handleEditBooking(b)}
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
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 font-sans">
      {errorMessage && (
        <div className="bg-[#fdecec] border border-[#f7d2d2] rounded-xl p-4 flex items-start gap-3 animate-in fade-in">
          <div className="text-[#dc2626] font-bold">!</div>
          <div className="flex-1"><p className="text-sm text-[#dc2626]">{errorMessage}</p></div>
          <button onClick={() => setErrorMessage(null)} className="text-[#dc2626]/60 hover:text-[#dc2626]">✕</button>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <div className="bg-brand-50 p-1 rounded-[11px] flex">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-2 rounded-[9px] transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-brand-700' : 'text-[#9583b3] hover:text-brand-600'}`}
            title="Vista de tarjetas"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`p-2 rounded-[9px] transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-brand-700' : 'text-[#9583b3] hover:text-brand-600'}`}
            title="Vista de calendario"
          >
            <List className="w-4 h-4 rotate-180" />
          </button>
        </div>

        {viewMode === 'cards' && (
          <button onClick={() => { setEditingBooking(undefined); setIsModalOpen(true); }} className="px-4 py-2.5 bg-brand-600 hover:bg-[#6b4d95] text-white rounded-[11px] shadow-btn-primary transition-all hover:-translate-y-px flex items-center gap-2 font-semibold text-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Nueva reserva</span>
          </button>
        )}
      </div>

      {viewMode === 'cards' && (
        <div className="bg-white rounded-2xl border border-[#e7dff3] p-4 md:p-6 shadow-card">
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <div className="flex items-center gap-3 bg-[#faf8fd] rounded-[11px] p-2">
              <button
                onClick={() => {
                  const newDate = new Date(filterMonth);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setFilterMonth(newDate);
                }}
                className="w-9 h-9 rounded-[9px] bg-white hover:bg-brand-50 flex items-center justify-center transition-all shadow-sm"
              >
                <ChevronLeft className="w-5 h-5 text-brand-700" />
              </button>
              <div className="px-4 min-w-[140px] text-center">
                <div className="font-display text-sm font-extrabold text-[#121325]">
                  {monthNames[filterMonth.getMonth()]} {filterMonth.getFullYear()}
                </div>
              </div>
              <button
                onClick={() => {
                  const newDate = new Date(filterMonth);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setFilterMonth(newDate);
                }}
                className="w-9 h-9 rounded-[9px] bg-white hover:bg-brand-50 flex items-center justify-center transition-all shadow-sm"
              >
                <ChevronRight className="w-5 h-5 text-brand-700" />
              </button>
              <button
                onClick={() => setFilterMonth(new Date())}
                className="px-3 py-1.5 rounded-[9px] bg-brand-600 hover:bg-[#6b4d95] text-white text-xs font-bold transition-all"
              >
                Hoy
              </button>
            </div>

            <div className="flex-1">
              <label className="text-xs font-bold text-[#9583b3] uppercase mb-2 block">Estado</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'Todas', color: 'bg-gray-100 text-gray-700' },
                  { value: 'active', label: 'Activas', color: 'bg-[#e4f3ea] text-[#2f8f4e]' },
                  { value: 'confirmed', label: 'Confirmadas', color: 'bg-[#e6eefc] text-[#2563eb]' },
                  { value: 'pending', label: 'Pendientes', color: 'bg-[#f0ebf8] text-[#5c3a8c]' },
                  { value: 'completed', label: 'Finalizadas', color: 'bg-gray-100 text-gray-600' },
                ].map(status => (
                  <button
                    key={status.value}
                    onClick={() => setFilterStatus(status.value as any)}
                    className={`px-3 py-1.5 rounded-[9px] text-xs font-bold transition-all ${
                      filterStatus === status.value
                        ? 'ring-2 ring-brand-400 ' + status.color
                        : status.color + ' opacity-50 hover:opacity-100'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#9583b3] uppercase mb-2 block">Pago</label>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'Todos', icon: DollarSign },
                  { value: 'paid', label: 'Pagados', icon: CheckCircle },
                  { value: 'pending', label: 'Pendientes', icon: Hourglass },
                ].map(payment => {
                  const Icon = payment.icon;
                  return (
                    <button
                      key={payment.value}
                      onClick={() => setFilterPayment(payment.value as any)}
                      className={`px-3 py-1.5 rounded-[9px] text-xs font-bold transition-all flex items-center gap-1 ${
                        filterPayment === payment.value
                          ? 'bg-brand-600 text-white ring-2 ring-brand-400'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {payment.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#eee5f6] flex items-center justify-between">
            <p className="text-xs text-gray-500 font-medium">
              <span className="font-bold text-brand-700">{filteredBookings.length}</span> reservas encontradas
            </p>
            {(filterStatus !== 'all' || filterPayment !== 'all') && (
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setFilterPayment('all');
                }}
                className="text-xs text-brand-700 hover:text-brand-800 font-bold flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center p-12 bg-white rounded-2xl border border-[#e7dff3]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div><p className="mt-4 text-muted-foreground">Cargando...</p></div>
      ) : (
        <>
          {viewMode === 'cards' ? renderCardsView() : renderCalendarView()}
        </>
      )}

      <BookingModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingBooking(undefined); }} onSave={handleSaveBooking} booking={editingBooking} />
      <PaymentModal isOpen={!!settleBooking} booking={settleBooking} onClose={() => setSettleBooking(null)} onConfirm={handleSettlePayment} />
      <CheckoutModal isOpen={!!checkoutBooking} booking={checkoutBooking} onClose={() => setCheckoutBooking(null)} onConfirm={handleCheckout} />
      <ConfirmModal isOpen={deleteConfirm.isOpen} onClose={() => setDeleteConfirm({ isOpen: false, booking: null })} onConfirm={handleConfirmDelete} title="¿Eliminar Reserva?" message="¿Estás segura? Esta acción no se puede deshacer." confirmText="Eliminar" cancelText="Cancelar" type="danger" />
    </div>
  );
};
