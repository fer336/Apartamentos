import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar as CalendarIcon, Plus, Edit, Trash2,
  Home, User, Clock, CheckCircle, Coffee, Ban, DollarSign,
  Hourglass, LogOut, MessageSquare, ChevronLeft, ChevronRight, LayoutGrid, List,
  CalendarCheck, CalendarX, CalendarDays, X
} from 'lucide-react';
import { getBookings, createBooking, updateBooking, deleteBooking, getProperties } from '../services/api';
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

interface Property {
  id: string;
  name: string;
}

export const Calendar = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
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
      const [bookingsData, propertiesData] = await Promise.all([
        getBookings(),
        getProperties()
      ]);
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

  const formatDateShort = (date: Date) => {
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  // Filtrar reservas según los filtros seleccionados
  const filteredBookings = bookings.filter(booking => {
    // Filtro por estado de reserva
    if (filterStatus !== 'all' && booking.status !== filterStatus) {
      return false;
    }

    // Filtro por estado de pago
    if (filterPayment === 'paid' && (booking.left_to_pay_usd || 0) > 0) {
      return false;
    }
    if (filterPayment === 'pending' && (booking.left_to_pay_usd || 0) <= 0) {
      return false;
    }

    // Filtro por mes (solo para vista de cards)
    if (viewMode === 'cards') {
      const checkInDate = new Date(booking.check_in);
      const checkOutDate = new Date(booking.check_out);
      const filterMonthStart = new Date(filterMonth.getFullYear(), filterMonth.getMonth(), 1);
      const filterMonthEnd = new Date(filterMonth.getFullYear(), filterMonth.getMonth() + 1, 0);

      // Incluir reservas que toquen el mes seleccionado
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
      case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
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

      // MODIFICADO: Ahora incluye el día de checkout (<= end)
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
          <div key={booking.id} className="bg-white rounded-3xl p-5 border-2 border-border hover:border-pink-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(booking.status)}`}>
                {booking.status}
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-gray-800 leading-none">
                  ${booking.total_price_usd.toLocaleString()}
                </div>
                {isFullyPaid ? (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center justify-end gap-1 mt-1">
                    <CheckCircle className="w-3 h-3" /> PAGADO
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-600 flex items-center justify-end gap-1 mt-1 bg-amber-50 px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" /> DEBE ${leftToPay.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
                  <Home className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Propiedad</p>
                  <h3 className="font-bold text-sm text-foreground truncate">{booking.property_name}</h3>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Cliente</p>
                  <h3 className="font-bold text-sm text-foreground truncate">{booking.client_name}</h3>
                </div>
              </div>

              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                booking.deposit_ars && booking.deposit_ars > 0 
                  ? 'bg-amber-50 border-amber-100' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  booking.deposit_ars && booking.deposit_ars > 0 
                    ? 'bg-amber-200' 
                    : 'bg-gray-200'
                }`}>
                  {booking.deposit_ars && booking.deposit_ars > 0 ? '💰' : '⏳'}
                </div>
                <span className={`text-xs font-bold ${
                  booking.deposit_ars && booking.deposit_ars > 0 
                    ? 'text-amber-800' 
                    : 'text-gray-500'
                }`}>
                  {booking.deposit_ars && booking.deposit_ars > 0 
                    ? `Depósito: $${booking.deposit_ars.toLocaleString()} ARS` 
                    : 'Sin depósito'}
                </span>
              </div>

              {booking.checkout_notes && booking.checkout_notes.trim() && (
                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                  <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Observaciones del Huésped
                  </p>
                  <p className="text-xs text-gray-700 font-medium">{booking.checkout_notes}</p>
                </div>
              )}

              <div className="pt-3 border-t border-dashed border-gray-100 space-y-2">
                <div className="flex items-center gap-2 text-gray-600 font-medium text-sm">
                  <CalendarIcon className="w-4 h-4 text-pink-400" />
                  <span>{formatDate(booking.check_in)} - {formatDate(booking.check_out)}</span>
                </div>

                {!isCompleted && daysRemaining >= 0 && (
                  <div className={`flex items-center gap-1.5 text-xs font-bold ${isEndingSoon ? 'text-red-500' : 'text-gray-400'}`}>
                    <Hourglass className="w-3 h-3" /> {daysRemaining === 0 ? 'Check-out HOY' : `Quedan ${daysRemaining} días`}
                  </div>
                )}

                {/* Información de huéspedes detallada */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-3 py-2 rounded-xl border border-blue-100">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                    {booking.adults !== undefined && booking.adults > 0 && (
                      <span className="flex items-center gap-1 text-blue-700 bg-white/70 px-2 py-1 rounded-lg">
                        👤 <strong>{booking.adults}</strong> {booking.adults === 1 ? 'Adulto' : 'Adultos'}
                      </span>
                    )}
                    {booking.children !== undefined && booking.children > 0 && (
                      <span className="flex items-center gap-1 text-purple-700 bg-white/70 px-2 py-1 rounded-lg">
                        👶 <strong>{booking.children}</strong> {booking.children === 1 ? 'Niño' : 'Niños'}
                      </span>
                    )}
                    {booking.pets && (
                      <span className="flex items-center gap-1 text-amber-700 bg-white/70 px-2 py-1 rounded-lg">
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
                    <span className="text-[10px] font-bold text-white bg-indigo-500 px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm"><Coffee className="w-3 h-3" /> CON SERVICIOS</span>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg flex items-center gap-1"><Ban className="w-3 h-3" /> SIN SERVICIOS</span>
                  )}
                </div>
              </div>
            </div>

            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 rounded-3xl z-10 px-4">
              {!isCompleted && booking.status !== 'cancelled' && (
                <button onClick={() => setCheckoutBooking(booking)} className="flex flex-col items-center gap-1 p-2 hover:bg-violet-50 text-violet-600 rounded-2xl transition-all scale-90 hover:scale-100">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shadow-sm"><LogOut className="w-5 h-5" /></div><span className="text-[10px] font-bold">Checkout</span>
                </button>
              )}
              {!isFullyPaid && !isCompleted && (
                <button onClick={() => setSettleBooking(booking)} className="flex flex-col items-center gap-1 p-2 hover:bg-emerald-50 text-emerald-600 rounded-2xl transition-all scale-90 hover:scale-100">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shadow-sm"><DollarSign className="w-5 h-5" /></div><span className="text-[10px] font-bold">Saldar</span>
                </button>
              )}
              <button onClick={() => handleEditBooking(booking)} className="flex flex-col items-center gap-1 p-2 hover:bg-blue-50 text-blue-600 rounded-2xl transition-all scale-90 hover:scale-100">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><Edit className="w-4 h-4" /></div><span className="text-[10px] font-bold">Editar</span>
              </button>
              <button onClick={() => handleDeleteClick(booking)} className="flex flex-col items-center gap-1 p-2 hover:bg-red-50 text-red-600 rounded-2xl transition-all scale-90 hover:scale-100">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center"><Trash2 className="w-4 h-4" /></div><span className="text-[10px] font-bold">Eliminar</span>
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

    // --- Lógica de Disponibilidad del Mes Completo ---
    // const totalProperties = properties.length;

    let daysWithActivity = 0; // Días con al menos 1 reserva
    let daysFullyFree = 0;    // Días con 0 reservas
    let freeWeeksSabSab = 0;  // Semanas completas de Sábado a Sábado

    let lastBookedDate: Date | null = null;

    days.forEach(day => {
      const dayDate = new Date(year, month, day);
      dayDate.setHours(0, 0, 0, 0);

      const bookingsToday = getBookingsForDay(day);

      if (bookingsToday.length > 0) {
        daysWithActivity++;
        if (!lastBookedDate || dayDate > lastBookedDate) {
          lastBookedDate = dayDate;
        }
      } else {
        daysFullyFree++;
      }
    });

    // Calcular semanas libres de Sábado a Sábado
    for (let d = 1; d <= totalDays - 6; d++) {
      const dDate = new Date(year, month, d);
      if (dDate.getDay() === 6) { // 6 = Sábado
        let isWeekFree = true;
        for (let i = 0; i < 7; i++) {
          if (d + i <= totalDays) {
            if (getBookingsForDay(d + i).length > 0) {
              isWeekFree = false;
              break;
            }
          } else {
            isWeekFree = false;
          }
        }
        if (isWeekFree) freeWeeksSabSab++;
      }
    }

    // Calcular disponibilidad por propiedad
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    const propertyAvailability: Map<string, { name: string; freeFrom: Date | null }> = new Map();
    
    // Inicializar TODAS las propiedades del sistema
    properties.forEach(property => {
      propertyAvailability.set(property.id, {
        name: property.name,
        freeFrom: monthStart // Por defecto, libre desde el inicio del mes
      });
    });

    // Para cada propiedad, encontrar desde cuándo está libre
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    properties.forEach(property => {
      const propertyBookings = bookings
        .filter(b => 
          b.property_id === property.id && 
          b.status !== 'cancelled' && 
          new Date(b.check_out) >= today // Solo reservas que terminan HOY o después
        )
        .sort((a, b) => new Date(b.check_out).getTime() - new Date(a.check_out).getTime());

      const prop = propertyAvailability.get(property.id);
      if (!prop) return;

      if (propertyBookings.length === 0) {
        // Sin reservas en todo el mes - completamente libre
        prop.freeFrom = monthStart;
      } else {
        const lastBooking = propertyBookings[0];
        const lastCheckOut = new Date(lastBooking.check_out);
        
        // Solo considerar si la última reserva termina antes del fin del mes
        if (lastCheckOut < monthEnd) {
          const nextDay = new Date(lastCheckOut);
          nextDay.setDate(nextDay.getDate() + 1);
          prop.freeFrom = nextDay;
        } else {
          // Si la última reserva termina después del fin del mes, no está libre en este mes
          prop.freeFrom = null;
        }
      }
    });

    // Agrupar propiedades por rango de fechas similar
    const availabilityGroups: Map<string, string[]> = new Map();
    
    propertyAvailability.forEach((data) => {
      if (data.freeFrom && data.freeFrom <= monthEnd) {
        const rangeKey = `${formatDateShort(data.freeFrom)} - ${formatDateShort(monthEnd)}`;
        if (!availabilityGroups.has(rangeKey)) {
          availabilityGroups.set(rangeKey, []);
        }
        availabilityGroups.get(rangeKey)?.push(data.name);
      }
    });

    // Crear texto de disponibilidad
    let freeRangeText = 'Sin disponibilidad';
    if (availabilityGroups.size > 0) {
      const entries = Array.from(availabilityGroups.entries());
      const [firstRange, firstProps] = entries[0];
      
      if (firstProps.length === 1) {
        freeRangeText = `${firstProps[0]}\n${firstRange}`;
      } else {
        freeRangeText = `${firstProps.length} deptos libres\n${firstRange}`;
      }
    }

    return (
      <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in">
        {/* Calendar Grid */}
        <div className="flex-1 bg-white rounded-3xl border-2 border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-pink-500" />
              {monthNames[month]} {year}
            </h2>
            <div className="flex gap-2">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
              <div key={day} className="text-center text-[10px] md:text-xs font-black text-gray-400 uppercase py-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {allCells.map((day, index) => {
              if (!day) return <div key={`blank-${index}`} className="h-32 bg-gray-50/50 rounded-xl border border-transparent"></div>;

              const dayBookings = getBookingsForDay(day);
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
              const isPast = new Date(year, month, day) < new Date(new Date().setHours(0, 0, 0, 0));
              const isReserved = dayBookings.length > 0;

              return (
                <div
                  key={day}
                  className={`min-h-[5rem] md:min-h-[8rem] p-1 md:p-2 rounded-xl border transition-all hover:border-pink-300 relative overflow-hidden
                    ${isToday ? 'ring-2 ring-pink-400 z-10' : ''} 
                    ${isPast ? 'opacity-60' : ''} 
                    ${isReserved ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}
                >
                  <div className={`text-right text-xs md:text-sm font-black mb-1 ${isToday ? 'text-pink-600' : isReserved ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5 md:space-y-1 overflow-y-auto max-h-[3.5rem] md:max-h-[6rem] scrollbar-none">
                    {dayBookings.map(b => (
                      <div
                        key={b.id}
                        onClick={() => handleEditBooking(b)}
                        className="text-[8px] md:text-[10px] font-bold px-1 md:px-2 py-0.5 md:py-1 rounded-md bg-white/60 text-rose-900 border border-rose-200 truncate cursor-pointer hover:bg-white transition-colors"
                        title={`${b.property_name} - ${b.client_name}`}
                      >
                        {b.property_name}
                      </div>
                    ))}
                    {!isReserved && !isPast && (
                      <div className="text-[8px] md:text-[10px] font-bold text-emerald-400 text-center mt-2 uppercase tracking-widest opacity-50">
                        Libre
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Availability Summary Card */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> Disponibilidad
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
                <span className="text-sm font-medium opacity-90 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-white" /> Días del Mes
                </span>
                <span className="font-bold text-xl">{totalDays}</span>
              </div>

              <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
                <span className="text-sm font-medium opacity-90 flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-emerald-300" /> Con Reservas
                </span>
                <span className="font-bold text-xl text-emerald-300">
                  {daysWithActivity >= 7
                    ? `${(daysWithActivity / 7).toFixed(1)} Sem.`
                    : `${daysWithActivity} Días`}
                </span>
              </div>

              <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
                <span className="text-sm font-medium opacity-90 flex items-center gap-2">
                  <CalendarX className="w-4 h-4 text-white" /> 100% Libres
                </span>
                <span className="font-bold text-xl text-white">
                  {daysFullyFree >= 7
                    ? `${(daysFullyFree / 7).toFixed(1)} Sem.`
                    : `${daysFullyFree} Días`}
                </span>
              </div>

              <div className="border-t border-white/20 my-2"></div>

              {/* Rango Final Libre */}
              <div className="bg-white/20 rounded-xl p-4 text-center">
                <span className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2 block">Próxima Libertad Total</span>
                <div className="text-base font-black whitespace-pre-line leading-tight">{freeRangeText}</div>
              </div>
              
              {/* Lista detallada de propiedades si hay múltiples */}
              {availabilityGroups.size > 0 && Array.from(availabilityGroups.values()).some(props => props.length > 1) && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-2 block">Departamentos Libres</span>
                  {Array.from(availabilityGroups.entries()).map(([, props], idx) => (
                    props.length > 1 && (
                      <div key={idx} className="text-xs opacity-90 mb-1">
                        <span className="font-bold">{props.join(', ')}</span>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-white/20">
              <p className="text-[10px] opacity-75 text-center leading-relaxed">
                * Cálculo basado en la totalidad del mes visible.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border-2 border-border p-6">
            <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Referencias</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-4 h-4 rounded bg-rose-100 border border-rose-200"></div>
                <span className="text-gray-600 font-bold">Reservado / Alquilado</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-200"></div>
                <span className="text-gray-600 font-bold">Disponible / Libre</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-4 h-4 rounded bg-pink-50 border border-pink-200 ring-1 ring-pink-400"></div>
                <span className="text-gray-600 font-bold">Hoy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {errorMessage && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in">
          <div className="text-red-600 font-bold">!</div>
          <div className="flex-1"><p className="text-sm text-red-700">{errorMessage}</p></div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={() => navigate('/')} className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white border-2 border-purple-200 hover:bg-purple-50 flex items-center justify-center transition-all flex-shrink-0">
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-3xl font-bold text-foreground flex items-center gap-2 md:gap-3 truncate">
              <CalendarIcon className="w-5 h-5 md:w-8 md:h-8 text-pink-500 flex-shrink-0" />
              Calendario
            </h1>
            <p className="text-muted-foreground mt-1 hidden md:block">Gestión de disponibilidad y reservas</p>
          </div>
        </div>

        <div className="flex gap-1.5 md:gap-2 justify-end flex-shrink-0">
          <div className="bg-gray-100 p-1 rounded-xl flex">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 md:p-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white shadow text-pink-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 md:p-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-white shadow text-pink-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-4 h-4 md:w-5 md:h-5 rotate-180" />
            </button>
          </div>

          <button onClick={() => { setEditingBooking(undefined); setIsModalOpen(true); }} className="w-9 h-9 md:w-auto md:h-auto md:px-6 md:py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg flex items-center justify-center gap-2 font-medium">
            <Plus className="w-5 h-5" />
            <span className="hidden md:inline">Nueva Reserva</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-[2rem] border-2 border-gray-100 p-4 md:p-6 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          {/* Navegación de Mes (solo para vista cards) */}
          {viewMode === 'cards' && (
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-2">
              <button
                onClick={() => {
                  const newDate = new Date(filterMonth);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setFilterMonth(newDate);
                }}
                className="w-9 h-9 rounded-lg bg-white hover:bg-pink-50 flex items-center justify-center transition-all shadow-sm"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="px-4 min-w-[140px] text-center">
                <div className="text-sm font-black text-gray-900">
                  {monthNames[filterMonth.getMonth()]} {filterMonth.getFullYear()}
                </div>
              </div>
              <button
                onClick={() => {
                  const newDate = new Date(filterMonth);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setFilterMonth(newDate);
                }}
                className="w-9 h-9 rounded-lg bg-white hover:bg-pink-50 flex items-center justify-center transition-all shadow-sm"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setFilterMonth(new Date())}
                className="px-3 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition-all"
              >
                Hoy
              </button>
            </div>
          )}

          {/* Filtro por Estado */}
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Estado</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'Todas', color: 'bg-gray-100 text-gray-700' },
                { value: 'active', label: 'Activas', color: 'bg-green-100 text-green-700' },
                { value: 'confirmed', label: 'Confirmadas', color: 'bg-blue-100 text-blue-700' },
                { value: 'pending', label: 'Pendientes', color: 'bg-yellow-100 text-yellow-700' },
                { value: 'completed', label: 'Finalizadas', color: 'bg-gray-100 text-gray-600' },
              ].map(status => (
                <button
                  key={status.value}
                  onClick={() => setFilterStatus(status.value as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterStatus === status.value
                      ? 'ring-2 ring-pink-400 ' + status.color
                      : status.color + ' opacity-50 hover:opacity-100'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por Pago */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Pago</label>
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      filterPayment === payment.value
                        ? 'bg-pink-500 text-white ring-2 ring-pink-400'
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

        {/* Contador de resultados */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500 font-medium">
            <span className="font-bold text-pink-600">{filteredBookings.length}</span> reservas encontradas
          </p>
          {(filterStatus !== 'all' || filterPayment !== 'all') && (
            <button
              onClick={() => {
                setFilterStatus('all');
                setFilterPayment('all');
              }}
              className="text-xs text-pink-600 hover:text-pink-700 font-bold flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center p-12 bg-white rounded-2xl border-2 border-border"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div><p className="mt-4 text-muted-foreground">Cargando...</p></div>
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
