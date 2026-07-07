import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, TrendingUp, Building2, Wallet, ArrowRight } from 'lucide-react';
import { getDashboardStats, getProperties, getBookings } from '../services/api';
import { DirectvManagerModal } from '../components/DirectvManagerModal';

interface MonthlyAvailability {
  month_name: string;
  year: number;
  total_free_days: number;
  status: 'full' | 'partial' | 'none';
  free_ranges: string[];
}

interface Booking {
  id: string;
  booking_number: string;
  check_in: string;
  check_out: string;
  status: string;
  client_name?: string;
  property_name?: string;
  left_to_pay_usd?: number;
}

const STATUS_BADGE: Record<string, string> = {
  confirmed: 'bg-blue-50 text-blue-700 border border-blue-200',
  active: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  completed: 'bg-gray-100 text-gray-600 border border-gray-200',
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  cancelled: 'bg-rose-50 text-rose-700 border border-rose-200',
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmada',
  active: 'En curso',
  completed: 'Finalizada',
  pending: 'Pendiente',
  cancelled: 'Cancelada',
};

const STAT_COLORS: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-600',
  violet: 'bg-violet-50 text-violet-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
};

const StatCard = ({
  label,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: typeof Calendar;
  color: keyof typeof STAT_COLORS;
}) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <div className="flex items-start justify-between mb-3">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${STAT_COLORS[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <p className="text-2xl font-black text-gray-900 tracking-tight">{value}</p>
    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
  </div>
);

const AvailabilityWidget = ({ forecast }: { forecast: MonthlyAvailability[] }) => {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  if (!forecast || forecast.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Disponibilidad de temporada</h3>
          <p className="text-xs text-gray-400">Noches libres por mes · todas las propiedades</p>
        </div>
        <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-3 py-1 rounded-full border border-violet-100">
          {currentYear}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {forecast.map((month) => {
          const dotColor =
            month.status === 'full' ? 'bg-emerald-500' : month.status === 'none' ? 'bg-rose-500' : 'bg-amber-500';
          const fraction = Math.min(100, Math.round((month.total_free_days / 30) * 100));

          return (
            <div
              key={`${month.year}-${month.month_name}`}
              className="bg-gray-50 rounded-2xl p-4 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-700 capitalize">{month.month_name.slice(0, 3)}</span>
                <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
              </div>
              <p className="text-2xl font-black text-gray-900 leading-none mb-1">{month.total_free_days}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-3">Noches libres</p>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full ${dotColor}`} style={{ width: `${fraction}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const [stats, setStats] = useState({
    availability_forecast: [] as MonthlyAvailability[],
    total_revenue_month: 0,
    directv_devices_summary: [] as any[],
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

  // Nota: active_bookings/occupancy_rate/checkins_today del endpoint /dashboard/stats
  // están hardcodeados a 0 en el backend (no implementados todavía), así que se
  // calculan acá con datos reales de reservas y propiedades.
  const activeBookingsCount = useMemo(
    () => bookings.filter((b) => ['confirmed', 'active'].includes(b.status)).length,
    [bookings]
  );

  const checkinsToday = useMemo(
    () => bookings.filter((b) => b.status !== 'cancelled' && b.check_in === todayStr).length,
    [bookings, todayStr]
  );

  const occupancyRate = useMemo(() => {
    if (!properties.length) return 0;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEndExclusive = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const daysInMonth = (monthEndExclusive.getTime() - monthStart.getTime()) / 86400000;
    const totalAvailableNights = properties.length * daysInMonth;
    if (totalAvailableNights <= 0) return 0;

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

    return Math.min(100, Math.round((bookedNights / totalAvailableNights) * 100));
  }, [bookings, properties]);

  const receivables = useMemo(() => {
    const pending = bookings.filter(
      (b) => !['cancelled', 'completed'].includes(b.status) && (b.left_to_pay_usd || 0) > 0
    );
    const total = pending.reduce((sum, b) => sum + (b.left_to_pay_usd || 0), 0);
    return { total, count: pending.length };
  }, [bookings]);

  const upcomingBookings = useMemo(() => {
    return bookings
      .filter((b) => b.status !== 'cancelled' && b.check_in >= todayStr)
      .sort((a, b) => a.check_in.localeCompare(b.check_in))
      .slice(0, 5);
  }, [bookings, todayStr]);

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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-red-700 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <p className="font-semibold text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Ingresos del mes"
          value={loading ? '...' : `$${stats.total_revenue_month.toLocaleString()}`}
          subtitle="Mes actual"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          label="Ocupación"
          value={loading ? '...' : `${occupancyRate}%`}
          subtitle="Ocupación del mes"
          icon={Calendar}
          color="violet"
        />
        <StatCard
          label="Reservas activas"
          value={loading ? '...' : String(activeBookingsCount)}
          subtitle={checkinsToday > 0 ? `${checkinsToday} ingresan hoy` : undefined}
          icon={Building2}
          color="blue"
        />
        <StatCard
          label="Saldos por cobrar"
          value={loading ? '...' : `U$D ${receivables.total.toLocaleString()}`}
          subtitle={receivables.count > 0 ? `en ${receivables.count} reserva${receivables.count > 1 ? 's' : ''}` : undefined}
          icon={Wallet}
          color="amber"
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
            className="bg-[#1E1533] rounded-3xl p-5 text-left hover:opacity-95 transition-opacity"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <span className="text-lg">📺</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">DirecTV</p>
                <p className="text-[10px] text-violet-300">Vencimiento por equipo</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {stats.directv_devices_summary.map((device: any) => (
                <div key={device.id} className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[9px] text-violet-300 uppercase tracking-wide truncate">{device.location}</p>
                    <p className="text-sm font-bold text-white truncate">{device.card_number}</p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-lg text-center flex-shrink-0 ml-2 ${
                      device.days_remaining <= 3 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}
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

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Próximas reservas</h3>
          <Link to="/calendar" className="text-sm font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1">
            Ver calendario <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Cargando...</p>
        ) : upcomingBookings.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No hay reservas próximas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-semibold">Cliente</th>
                  <th className="pb-3 font-semibold">Propiedad</th>
                  <th className="pb-3 font-semibold">Estadía</th>
                  <th className="pb-3 font-semibold">Estado</th>
                  <th className="pb-3 font-semibold text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {upcomingBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {getInitials(b.client_name || '?')}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{b.client_name || 'Sin cliente'}</p>
                          <p className="text-[11px] text-gray-400">{b.booking_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{b.property_name}</td>
                    <td className="py-3 pr-4 text-violet-600 font-medium whitespace-nowrap">
                      {formatShortDate(b.check_in)} – {formatShortDate(b.check_out)}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          STATUS_BADGE[b.status] || STATUS_BADGE.completed
                        }`}
                      >
                        {STATUS_LABEL[b.status] || b.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold text-gray-900 whitespace-nowrap">
                      {(b.left_to_pay_usd || 0) > 0 ? `U$D ${b.left_to_pay_usd!.toLocaleString()}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DirectvManagerModal
        isOpen={isDirectvModalOpen}
        onClose={() => setIsDirectvModalOpen(false)}
        properties={properties}
        onUpdate={fetchAll}
      />
    </div>
  );
};
