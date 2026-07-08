import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  TrendingUp,
  Building2,
  Wallet,
  ArrowRight,
  Tv,
  LogIn,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { getDashboardStats, getProperties, getBookings } from '../services/api';
import { DirectvManagerModal } from '../components/DirectvManagerModal';

interface MonthlyAvailability {
  month_name: string;
  year: number;
  total_free_days: number;
  status: 'full' | 'partial' | 'none';
  free_ranges: string[];
}

interface DirectvDevice {
  id: string;
  location: string;
  card_number: string;
  days_remaining: number;
}

interface Booking {
  id: string;
  booking_number: string;
  check_in: string;
  check_out: string;
  status: string;
  client_name?: string;
  property_name?: string;
  guests_count?: number;
  deposit_ars?: number;
  left_to_pay_usd?: number;
}

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

const getStatusChip = (booking: Booking): { label: string; text: string; bg: string } => {
  if (booking.status === 'cancelled') return { label: 'Cancelada', text: '#dc2626', bg: '#fdecec' };
  if (booking.status === 'completed') return { label: 'Finalizada', text: '#7b6b95', bg: '#f3eefa' };
  if (booking.status === 'active') return { label: 'En curso', text: '#2563eb', bg: '#e6eefc' };
  if (booking.status === 'pending') return { label: 'Pendiente', text: '#5c3a8c', bg: '#f0ebf8' };
  // confirmed
  if ((booking.left_to_pay_usd || 0) > 0) return { label: 'Seña', text: '#c2410c', bg: '#fdf0e2' };
  return { label: 'Confirmada', text: '#2f8f4e', bg: '#e4f3ea' };
};

const StatCard = ({
  label,
  value,
  subtitle,
  subtitleColor,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string;
  subtitle?: string;
  subtitleColor?: string;
  icon: typeof Calendar;
  iconBg: string;
  iconColor: string;
}) => (
  <div className="bg-white rounded-2xl border border-[#e7dff3] shadow-card p-[18px]">
    <div className="flex items-start justify-between mb-3">
      <p className="text-[11px] font-bold text-[#8b7aab] uppercase tracking-wider">{label}</p>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg, color: iconColor }}
      >
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <p className="font-display font-extrabold text-[27px] text-[#121325] tracking-tight leading-none">{value}</p>
    {subtitle && (
      <p className="text-xs font-semibold mt-2" style={{ color: subtitleColor || '#7b6b95' }}>
        {subtitle}
      </p>
    )}
  </div>
);

const AvailabilityWidget = ({ forecast }: { forecast: MonthlyAvailability[] }) => {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  if (!forecast || forecast.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#e7dff3] shadow-card p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display font-extrabold text-lg text-[#121325]">Disponibilidad de temporada</h3>
          <p className="text-xs text-[#7b6b95]">Noches libres por mes · todas las propiedades</p>
        </div>
        <span className="text-xs font-semibold text-[#5c3a8c] bg-[#ece6f6] px-3 py-1 rounded-full border border-[#d9caeb]">
          {currentYear}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {forecast.map((month) => {
          const dotColor = month.status === 'full' ? '#2f8f4e' : month.status === 'none' ? '#dc2626' : '#f97316';
          const fraction = Math.min(100, Math.round((month.total_free_days / 30) * 100));

          return (
            <div key={`${month.year}-${month.month_name}`} className="bg-[#faf8fd] rounded-2xl p-4 border border-[#eee5f6]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[#121325] capitalize">{month.month_name.slice(0, 3)}</span>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }}></span>
              </div>
              <p className="font-display font-extrabold text-2xl text-[#121325] leading-none mb-1">
                {month.total_free_days}
              </p>
              <p className="text-[10px] text-[#9583b3] uppercase tracking-wide mb-3">Noches libres</p>
              <div className="h-1.5 bg-[#eae1f5] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${fraction}%`, background: dotColor }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const [view, setView] = useState<'general' | 'operativa'>('general');
  const [stats, setStats] = useState({
    availability_forecast: [] as MonthlyAvailability[],
    total_revenue_month: 0,
    directv_devices_summary: [] as DirectvDevice[],
    active_bookings: 0,
    occupancy_rate: 0,
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDirectvModalOpen, setIsDirectvModalOpen] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [statsData, bookingsData, propertiesData] = await Promise.all([
        getDashboardStats(),
        getBookings(),
        getProperties(),
      ]);
      setStats({ ...statsData, availability_forecast: statsData.availability_forecast || [] });
      setBookings(bookingsData || []);
      setProperties(propertiesData || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // active_bookings y occupancy_rate ahora vienen calculados de verdad desde
  // /dashboard/stats. checkinsThisWeek/checkinsToday/checkoutsToday siguen
  // calculándose acá porque necesitan los objetos completos de reserva (para
  // Vista operativa) o una ventana de tiempo (semana) que el endpoint no expone.
  const weekAheadStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return d.toISOString().split('T')[0];
  }, []);

  const checkinsThisWeek = useMemo(
    () =>
      bookings.filter((b) => b.status !== 'cancelled' && b.check_in >= todayStr && b.check_in <= weekAheadStr).length,
    [bookings, todayStr, weekAheadStr]
  );

  // El % de ocupación en sí viene real de stats.occupancy_rate (backend). Acá solo
  // derivamos el desglose "X de Y noches" para el subtítulo, con la misma fórmula.
  const occupancyDetail = useMemo(() => {
    if (!properties.length) return { bookedNights: 0, totalNights: 0 };
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEndExclusive = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const daysInMonth = (monthEndExclusive.getTime() - monthStart.getTime()) / 86400000;

    let bookedNights = 0;
    bookings.forEach((b) => {
      if (b.status === 'cancelled') return;
      const checkIn = new Date(b.check_in);
      const checkOut = new Date(b.check_out);
      const overlapStart = checkIn > monthStart ? checkIn : monthStart;
      const overlapEnd = checkOut < monthEndExclusive ? checkOut : monthEndExclusive;
      const nights = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 86400000);
      if (nights > 0) bookedNights += nights;
    });

    return { bookedNights, totalNights: daysInMonth };
  }, [bookings, properties]);

  const receivables = useMemo(() => {
    const pending = bookings.filter(
      (b) => !['cancelled', 'completed'].includes(b.status) && (b.left_to_pay_usd || 0) > 0
    );
    const total = pending.reduce((sum, b) => sum + (b.left_to_pay_usd || 0), 0);
    return { total, count: pending.length, bookings: pending };
  }, [bookings]);

  const upcomingBookings = useMemo(() => {
    return bookings
      .filter((b) => b.status !== 'cancelled' && b.check_in >= todayStr)
      .sort((a, b) => a.check_in.localeCompare(b.check_in))
      .slice(0, 5);
  }, [bookings, todayStr]);

  const checkinsToday = useMemo(
    () => bookings.filter((b) => b.status !== 'cancelled' && b.check_in === todayStr),
    [bookings, todayStr]
  );

  const checkoutsToday = useMemo(
    () => bookings.filter((b) => b.status !== 'cancelled' && b.check_out === todayStr),
    [bookings, todayStr]
  );

  const attentionItems = useMemo(() => {
    const items: { id: string; severity: 'warning' | 'danger'; title: string; description: string; action: string; onAction: () => void }[] = [];

    (stats.directv_devices_summary || [])
      .filter((d) => d.days_remaining <= 3)
      .forEach((d) => {
        items.push({
          id: `directv-${d.id}`,
          severity: 'danger',
          title: `DirecTV vence en ${d.days_remaining} día${d.days_remaining === 1 ? '' : 's'}`,
          description: `${d.location} · tarjeta ${d.card_number}`,
          action: 'Recargar',
          onAction: () => setIsDirectvModalOpen(true),
        });
      });

    receivables.bookings
      .slice()
      .sort((a, b) => (b.left_to_pay_usd || 0) - (a.left_to_pay_usd || 0))
      .slice(0, 4)
      .forEach((b) => {
        items.push({
          id: `saldo-${b.id}`,
          severity: 'warning',
          title: `Saldo pendiente: ${b.client_name || 'Sin cliente'}`,
          description: `${b.property_name || ''} · U$D ${(b.left_to_pay_usd || 0).toLocaleString()}`,
          action: 'Ver reserva',
          onAction: () => {
            window.location.href = '/calendar';
          },
        });
      });

    return items.slice(0, 6);
  }, [stats.directv_devices_summary, receivables.bookings]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {error && (
        <div className="bg-[#fdecec] border-2 border-[#f8c9c9] rounded-2xl p-4 text-[#dc2626] flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="font-semibold text-sm">{error}</p>
        </div>
      )}

      {/* Switcher Vista general / operativa */}
      <div className="inline-flex bg-[#e2daf0] rounded-xl p-1">
        {(['general', 'operativa'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              view === v ? 'bg-white text-[#5c3a8c] shadow-sm' : 'text-[#8b7aab] hover:text-[#5c3a8c]'
            }`}
          >
            {v === 'general' ? 'Vista general' : 'Vista operativa'}
          </button>
        ))}
      </div>

      {view === 'general' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Ingresos del mes"
              value={loading ? '...' : `$${stats.total_revenue_month.toLocaleString()}`}
              subtitle="Mes actual"
              icon={TrendingUp}
              iconBg="#e4f3ea"
              iconColor="#2f8f4e"
            />
            <StatCard
              label="Ocupación"
              value={loading ? '...' : `${Math.round(stats.occupancy_rate)}%`}
              subtitle={loading ? undefined : `${occupancyDetail.bookedNights} de ${occupancyDetail.totalNights} noches`}
              icon={Calendar}
              iconBg="#ece6f6"
              iconColor="#7c5ca8"
            />
            <StatCard
              label="Reservas activas"
              value={loading ? '...' : String(stats.active_bookings)}
              subtitle={checkinsThisWeek > 0 ? `${checkinsThisWeek} llegan esta semana` : undefined}
              subtitleColor="#2563eb"
              icon={Building2}
              iconBg="#e6eefc"
              iconColor="#2563eb"
            />
            <StatCard
              label="Saldos por cobrar"
              value={loading ? '...' : `U$D ${receivables.total.toLocaleString()}`}
              subtitle={receivables.count > 0 ? `en ${receivables.count} reserva${receivables.count > 1 ? 's' : ''}` : undefined}
              subtitleColor="#c2410c"
              icon={Wallet}
              iconBg="#fdecdd"
              iconColor="#f97316"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2">
              {!loading && stats.availability_forecast.length > 0 && (
                <AvailabilityWidget forecast={stats.availability_forecast} />
              )}
            </div>

            {!loading && stats.directv_devices_summary && stats.directv_devices_summary.length > 0 && (
              <button
                onClick={() => setIsDirectvModalOpen(true)}
                className="bg-gradient-to-br from-[#3a2459] to-[#26173e] rounded-2xl p-5 text-left hover:opacity-95 transition-opacity"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-[11px] bg-white/10 flex items-center justify-center">
                    <Tv className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">DirecTV</p>
                    <p className="text-[10px] text-[#b9a9d6]">Vencimiento por equipo</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {stats.directv_devices_summary.map((device) => (
                    <div key={device.id} className="bg-white/5 rounded-[11px] p-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-[9px] text-[#b9a9d6] uppercase tracking-wide truncate">{device.location}</p>
                        <p className="text-sm font-bold text-white truncate">{device.card_number}</p>
                      </div>
                      <div
                        className="px-3 py-1 rounded-lg text-center flex-shrink-0 ml-2"
                        style={{
                          background: device.days_remaining <= 3 ? 'rgba(252,165,165,.15)' : 'rgba(126,207,134,.15)',
                          color: device.days_remaining <= 3 ? '#fca5a5' : '#7ecf86',
                        }}
                      >
                        <p className="text-[8px] uppercase font-bold leading-none">Días</p>
                        <p className="text-lg font-black leading-none">{device.days_remaining}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#e7dff3] shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-extrabold text-lg text-[#121325]">Próximas reservas</h3>
              <Link to="/calendar" className="text-sm font-semibold text-[#7c5ca8] hover:text-[#5c3a8c] flex items-center gap-1">
                Ver calendario <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <p className="text-sm text-[#9583b3] text-center py-8">Cargando...</p>
            ) : upcomingBookings.length === 0 ? (
              <p className="text-sm text-[#9583b3] text-center py-8">No hay reservas próximas</p>
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
                    {upcomingBookings.map((b) => {
                      const chip = getStatusChip(b);
                      const isPaid = (b.left_to_pay_usd || 0) <= 0;
                      return (
                        <tr key={b.id} className="hover:bg-[#faf8fd] transition-colors">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-[10px] bg-[#ece6f6] text-[#5c3a8c] flex items-center justify-center text-xs font-bold flex-shrink-0">
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
                            <span
                              className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
                              style={{ color: chip.text, background: chip.bg }}
                            >
                              {chip.label}
                            </span>
                          </td>
                          <td
                            className="py-3 text-right font-display font-bold whitespace-nowrap"
                            style={{ color: isPaid ? '#9583b3' : '#121325' }}
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
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Check-in de hoy */}
            <div className="bg-white rounded-2xl border border-[#e7dff3] shadow-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-[11px] bg-[#e4f3ea] text-[#2f8f4e] flex items-center justify-center flex-shrink-0">
                  <LogIn className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-[#121325]">Check-in de hoy</h3>
                  <p className="text-xs text-[#7b6b95]">
                    {checkinsToday.length} llegada{checkinsToday.length === 1 ? '' : 's'} · a partir de las 14:00
                  </p>
                </div>
              </div>
              {checkinsToday.length === 0 ? (
                <p className="text-sm text-[#9583b3] text-center py-6">No hay llegadas hoy</p>
              ) : (
                <div className="space-y-2">
                  {checkinsToday.map((b) => {
                    const owesBalance = (b.left_to_pay_usd || 0) > 0;
                    return (
                      <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#faf8fd]">
                        <div className="w-9 h-9 rounded-[10px] bg-[#ece6f6] text-[#5c3a8c] flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {getInitials(b.client_name || '?')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#121325] truncate">{b.client_name || 'Sin cliente'}</p>
                          <p className="text-xs text-[#7b6b95] truncate">
                            {b.property_name} · {b.guests_count || 0} huésped{(b.guests_count || 0) === 1 ? '' : 'es'}
                          </p>
                        </div>
                        <span
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex-shrink-0"
                          style={
                            owesBalance
                              ? { color: '#c2410c', background: '#fdf0e2' }
                              : { color: '#2f8f4e', background: '#e4f3ea' }
                          }
                        >
                          {owesBalance ? 'Cobrar saldo' : 'Pagado'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Check-out de hoy */}
            <div className="bg-white rounded-2xl border border-[#e7dff3] shadow-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-[11px] bg-[#fdecec] text-[#dc2626] flex items-center justify-center flex-shrink-0">
                  <LogOut className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-[#121325]">Check-out de hoy</h3>
                  <p className="text-xs text-[#7b6b95]">
                    {checkoutsToday.length} salida{checkoutsToday.length === 1 ? '' : 's'} · antes de las 11:00
                  </p>
                </div>
              </div>
              {checkoutsToday.length === 0 ? (
                <p className="text-sm text-[#9583b3] text-center py-6">No hay salidas hoy</p>
              ) : (
                <div className="space-y-2">
                  {checkoutsToday.map((b) => {
                    const needsDepositReview = (b.deposit_ars || 0) > 0;
                    const owesBalance = (b.left_to_pay_usd || 0) > 0;
                    return (
                      <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#faf8fd]">
                        <div className="w-9 h-9 rounded-[10px] bg-[#ece6f6] text-[#5c3a8c] flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {getInitials(b.client_name || '?')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#121325] truncate">{b.client_name || 'Sin cliente'}</p>
                          <p className="text-xs text-[#7b6b95] truncate">
                            {b.property_name} · {b.guests_count || 0} huésped{(b.guests_count || 0) === 1 ? '' : 'es'}
                          </p>
                        </div>
                        {needsDepositReview ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex-shrink-0 text-[#5c3a8c] bg-[#f0ebf8]">
                            Revisar depósito
                          </span>
                        ) : owesBalance ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex-shrink-0 text-[#c2410c] bg-[#fdf0e2]">
                            Cobrar saldo
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e7dff3] shadow-card p-6">
            <h3 className="font-display font-extrabold text-lg text-[#121325] mb-4">Pendientes que requieren atención</h3>
            {attentionItems.length === 0 ? (
              <p className="text-sm text-[#9583b3] text-center py-6">No hay pendientes por ahora</p>
            ) : (
              <div className="space-y-2">
                {attentionItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl border"
                    style={
                      item.severity === 'danger'
                        ? { background: '#fdecec', borderColor: '#f8c9c9' }
                        : { background: '#fdf0e2', borderColor: '#f7dcb0' }
                    }
                  >
                    <div
                      className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0"
                      style={
                        item.severity === 'danger'
                          ? { background: '#fdecec', color: '#dc2626' }
                          : { background: '#fdf0e2', color: '#c2410c' }
                      }
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-[#121325] truncate">{item.title}</p>
                      <p className="text-xs text-[#7b6b95] truncate">{item.description}</p>
                    </div>
                    <button
                      onClick={item.onAction}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#e0d7ef] text-[#5c3a8c] hover:bg-[#f0ebf8] flex-shrink-0 transition-colors"
                    >
                      {item.action}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <DirectvManagerModal
        isOpen={isDirectvModalOpen}
        onClose={() => setIsDirectvModalOpen(false)}
        properties={properties}
        onUpdate={fetchAll}
      />
    </div>
  );
};
