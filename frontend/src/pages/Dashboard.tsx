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
import { DecorativeCardImage } from '../components/ui/DecorativeCardImage';
import { KanagawaCard, type KanagawaCardTone } from '../components/ui/KanagawaCard';
import { kanagawaAssets, pickKpiArtwork, pickThemedArtwork, type KanagawaArtworkComponent } from '../theme/kanagawa-assets';
import { useTheme } from '../theme/ThemeProvider';
import type { AppTheme } from '../theme/kanagawa-tokens';

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
  if (booking.status === 'cancelled') return { label: 'Cancelada', text: 'var(--red-strong)', bg: 'rgba(166,77,69,0.14)' };
  if (booking.status === 'completed') return { label: 'Finalizada', text: 'var(--text-secondary)', bg: 'var(--surface-violet)' };
  if (booking.status === 'active') return { label: 'En curso', text: 'var(--blue)', bg: 'rgba(118,102,154,0.14)' };
  if (booking.status === 'pending') return { label: 'Pendiente', text: 'var(--primary)', bg: 'var(--surface-violet)' };
  // confirmed
  if ((booking.left_to_pay_usd || 0) > 0) return { label: 'Seña', text: 'var(--orange)', bg: 'rgba(198,138,78,0.14)' };
  return { label: 'Confirmada', text: 'var(--green-strong)', bg: 'rgba(125,143,116,0.16)' };
};

const StatCard = ({
  label,
  value,
  subtitle,
  subtitleColor,
  icon: Icon,
  iconBg,
  iconColor,
  tone,
  linkTo,
  linkLabel,
  artwork,
  valueColor,
}: {
  label: string;
  value: string;
  subtitle?: string;
  subtitleColor?: string;
  icon: typeof Calendar;
  iconBg: string;
  iconColor: string;
  tone: KanagawaCardTone;
  linkTo?: string;
  linkLabel?: string;
  artwork?: KanagawaArtworkComponent;
  valueColor: string;
}) => (
  <KanagawaCard tone={tone} artwork={artwork} padded={false} className="kanagawa-card--squared p-[18px]">
    <div className="flex items-start justify-between mb-3">
      <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">{label}</p>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg, color: iconColor }}
      >
        <Icon className="w-4 h-4" strokeWidth={1.7} />
      </div>
    </div>
    <p className="font-display font-bold text-[27px] tracking-tight leading-none" style={{ color: valueColor }}>{value}</p>
    {subtitle && (
      <p className="text-xs font-semibold mt-2" style={{ color: subtitleColor || 'var(--text-secondary)' }}>
        {subtitle}
      </p>
    )}
    {linkTo && linkLabel && (
      <Link
        to={linkTo}
        className="inline-flex items-center gap-1 text-xs font-semibold text-cta hover:text-cta-hover mt-2 transition-colors duration-fast ease-kanagawa"
      >
        {linkLabel}
        <ArrowRight className="w-3 h-3" strokeWidth={2} />
      </Link>
    )}
  </KanagawaCard>
);

const AvailabilityWidget = ({ forecast, theme }: { forecast: MonthlyAvailability[]; theme: AppTheme }) => {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  if (!forecast || forecast.length === 0) return null;

  const upcoming = forecast.slice(0, 4);

  return (
    <div className="kanagawa-card p-6 h-full" style={{ ['--card-accent' as string]: 'var(--primary-soft)' }}>
      <DecorativeCardImage artwork={pickThemedArtwork(kanagawaAssets.cards.propertyLandscape, theme)} />
      <div className="card-content">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display font-semibold text-lg text-ink-primary">Disponibilidad de temporada</h3>
            <p className="text-xs text-ink-secondary">Próximos 4 meses · {currentYear}</p>
          </div>
          <Link
            to="/calendar"
            className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-surface-violet px-3 py-1.5 rounded-full border border-border-subtle hover:bg-surface-hover transition-colors duration-fast ease-kanagawa flex-shrink-0"
          >
            Ver calendario
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {upcoming.map((month) => {
            const dotColor =
              month.status === 'full' ? 'var(--green)' : month.status === 'none' ? 'var(--red)' : 'var(--orange)';
            const fraction = Math.min(100, Math.round((month.total_free_days / 30) * 100));

            return (
              <div key={`${month.year}-${month.month_name}`} className="bg-surface-elevated rounded-md p-4 border border-border-subtle">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wide">
                    {month.month_name.slice(0, 3)}
                  </span>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }}></span>
                </div>
                <p className="font-display font-bold text-2xl text-ink-primary leading-none mb-1">
                  {month.total_free_days}
                </p>
                <p className="text-[9px] font-bold text-ink-muted uppercase tracking-wide mb-1">Noches</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-3" style={{ color: dotColor }}>
                  {fraction}%
                </p>
                <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-slow ease-kanagawa"
                    style={{ width: `${fraction}%`, background: dotColor }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const { theme } = useTheme();
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

  const hasDirectv = Boolean(stats.directv_devices_summary && stats.directv_devices_summary.length > 0);

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
        <div className="rounded-lg border p-4 flex items-center gap-3" style={{ background: 'rgba(166,77,69,0.14)', borderColor: 'rgba(166,77,69,0.28)', color: 'var(--red-strong)' }}>
          <AlertTriangle className="w-5 h-5 flex-shrink-0" strokeWidth={1.7} />
          <p className="font-semibold text-sm">{error}</p>
        </div>
      )}

      {/* Switcher Vista general / operativa */}
      <div className="inline-flex bg-surface-elevated rounded-md p-1 border border-border-subtle">
        {(['general', 'operativa'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-fast ease-kanagawa ${
              view === v ? 'bg-surface text-cta shadow-sm' : 'text-ink-muted hover:text-cta'
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
              iconBg="rgba(125,143,116,0.16)"
              iconColor="var(--green-strong)"
              tone="green"
              linkTo="/finance"
              linkLabel="Ver más"
              artwork={pickKpiArtwork('income', theme)}
              valueColor="var(--green-strong)"
            />
            <StatCard
              label="Ocupación"
              value={loading ? '...' : `${Math.round(stats.occupancy_rate)}%`}
              subtitle={loading ? undefined : `${occupancyDetail.bookedNights} de ${occupancyDetail.totalNights} noches`}
              icon={Calendar}
              iconBg="rgba(195,95,82,0.14)"
              iconColor="var(--red)"
              tone="red"
              linkTo="/calendar"
              linkLabel="Ver reporte"
              artwork={pickKpiArtwork('occupancy', theme)}
              valueColor="var(--red)"
            />
            <StatCard
              label="Reservas activas"
              value={loading ? '...' : String(stats.active_bookings)}
              subtitle={checkinsThisWeek > 0 ? `${checkinsThisWeek} llegan esta semana` : undefined}
              subtitleColor="var(--violet)"
              icon={Building2}
              iconBg="rgba(118,102,154,0.16)"
              iconColor="var(--violet)"
              tone="violet"
              artwork={pickKpiArtwork('bookings', theme)}
              valueColor="var(--violet)"
            />
            <StatCard
              label="Saldos por cobrar"
              value={loading ? '...' : `U$D ${receivables.total.toLocaleString()}`}
              subtitle={receivables.count > 0 ? `en ${receivables.count} reserva${receivables.count > 1 ? 's' : ''}` : undefined}
              subtitleColor="var(--orange)"
              icon={Wallet}
              iconBg="rgba(198,138,78,0.16)"
              iconColor="var(--orange)"
              tone="gold"
              artwork={pickKpiArtwork('receivables', theme)}
              valueColor="var(--yellow)"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className={hasDirectv ? 'lg:col-span-2' : 'lg:col-span-3'}>
              {!loading && stats.availability_forecast.length > 0 && (
                <AvailabilityWidget forecast={stats.availability_forecast} theme={theme} />
              )}
            </div>

            {!loading && hasDirectv && (
              <button
                onClick={() => setIsDirectvModalOpen(true)}
                className="kanagawa-card p-5 text-left hover:opacity-95 transition-opacity duration-normal ease-kanagawa"
                style={{ background: 'linear-gradient(145deg, var(--primary-dark), var(--surface-violet))' }}
              >
                <div className="card-content">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-md bg-white/10 flex items-center justify-center">
                      <Tv className="w-4 h-4 text-ink-primary" strokeWidth={1.7} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink-primary">DirecTV</p>
                      <p className="text-[10px] text-ink-violet">Vencimiento por equipo</p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {stats.directv_devices_summary.map((device) => (
                      <div key={device.id} className="bg-white/5 rounded-md p-3 flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-[9px] text-ink-violet uppercase tracking-wide truncate">{device.location}</p>
                          <p className="text-sm font-bold text-ink-primary truncate font-mono">{device.card_number}</p>
                        </div>
                        <div
                          className="px-3 py-1 rounded-md text-center flex-shrink-0 ml-2"
                          style={{
                            background: device.days_remaining <= 3 ? 'rgba(166,77,69,0.18)' : 'rgba(125,143,116,0.18)',
                            color: device.days_remaining <= 3 ? 'var(--red)' : 'var(--green)',
                          }}
                        >
                          <p className="text-[8px] uppercase font-bold leading-none">Días</p>
                          <p className="text-lg font-black leading-none">{device.days_remaining}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            )}
          </div>

          <div className="kanagawa-card p-6">
            <div className="card-content">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-lg text-ink-primary">Próximas reservas</h3>
                <Link to="/calendar" className="text-sm font-semibold text-primary hover:text-primary-hover flex items-center gap-1">
                  Ver calendario <ArrowRight className="w-4 h-4" strokeWidth={1.7} />
                </Link>
              </div>

              {loading ? (
                <p className="text-sm text-ink-muted text-center py-8">Cargando...</p>
              ) : upcomingBookings.length === 0 ? (
                <p className="text-sm text-ink-muted text-center py-8">No hay reservas próximas</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left table-head-cell border-b border-border-subtle">
                        <th className="pb-3 font-semibold">Cliente</th>
                        <th className="pb-3 font-semibold">Propiedad</th>
                        <th className="pb-3 font-semibold">Estadía</th>
                        <th className="pb-3 font-semibold">Estado</th>
                        <th className="pb-3 font-semibold text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingBookings.map((b) => {
                        const chip = getStatusChip(b);
                        const isPaid = (b.left_to_pay_usd || 0) <= 0;
                        return (
                          <tr key={b.id} className="table-row">
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-md bg-surface-violet text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                                  {getInitials(b.client_name || '?')}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-ink-primary truncate">{b.client_name || 'Sin cliente'}</p>
                                  <p className="text-[11px] font-mono text-ink-muted">{b.booking_number}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-ink-secondary">{b.property_name}</td>
                            <td className="py-3 pr-4 text-ink-secondary font-mono font-medium whitespace-nowrap">
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
                              style={{ color: isPaid ? 'var(--text-muted)' : 'var(--text-primary)' }}
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
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Check-in de hoy */}
            <div className="kanagawa-card kanagawa-card--squared p-6" style={{ ['--card-accent' as string]: 'var(--green-strong)' }}>
              <DecorativeCardImage artwork={pickKpiArtwork('checkin', theme)} />
              <div className="card-content">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(125,143,116,0.16)', color: 'var(--green-strong)' }}>
                    <LogIn className="w-4 h-4" strokeWidth={1.7} />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-ink-primary">Check-in de hoy</h3>
                    <p className="text-xs text-ink-secondary">
                      {checkinsToday.length} llegada{checkinsToday.length === 1 ? '' : 's'} · a partir de las 14:00
                    </p>
                  </div>
                </div>
                {checkinsToday.length === 0 ? (
                  <p className="text-sm text-ink-muted text-center py-6">No hay llegadas hoy</p>
                ) : (
                  <div className="space-y-2">
                    {checkinsToday.map((b) => {
                      const owesBalance = (b.left_to_pay_usd || 0) > 0;
                      return (
                        <div key={b.id} className="flex items-center gap-3 p-3 rounded-md bg-surface-elevated">
                          <div className="w-9 h-9 rounded-md bg-surface-violet text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {getInitials(b.client_name || '?')}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-ink-primary truncate">{b.client_name || 'Sin cliente'}</p>
                            <p className="text-xs text-ink-secondary truncate">
                              {b.property_name} · {b.guests_count || 0} huésped{(b.guests_count || 0) === 1 ? '' : 'es'}
                            </p>
                          </div>
                          <span
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex-shrink-0"
                            style={
                              owesBalance
                                ? { color: 'var(--orange)', background: 'rgba(198,138,78,0.16)' }
                                : { color: 'var(--green-strong)', background: 'rgba(125,143,116,0.16)' }
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
            </div>

            {/* Check-out de hoy */}
            <div className="kanagawa-card kanagawa-card--squared p-6" style={{ ['--card-accent' as string]: 'var(--red)' }}>
              <DecorativeCardImage artwork={pickKpiArtwork('checkout', theme)} />
              <div className="card-content">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(166,77,69,0.14)', color: 'var(--red)' }}>
                    <LogOut className="w-4 h-4" strokeWidth={1.7} />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-ink-primary">Check-out de hoy</h3>
                    <p className="text-xs text-ink-secondary">
                      {checkoutsToday.length} salida{checkoutsToday.length === 1 ? '' : 's'} · antes de las 11:00
                    </p>
                  </div>
                </div>
                {checkoutsToday.length === 0 ? (
                  <p className="text-sm text-ink-muted text-center py-6">No hay salidas hoy</p>
                ) : (
                  <div className="space-y-2">
                    {checkoutsToday.map((b) => {
                      const needsDepositReview = (b.deposit_ars || 0) > 0;
                      const owesBalance = (b.left_to_pay_usd || 0) > 0;
                      return (
                        <div key={b.id} className="flex items-center gap-3 p-3 rounded-md bg-surface-elevated">
                          <div className="w-9 h-9 rounded-md bg-surface-violet text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {getInitials(b.client_name || '?')}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-ink-primary truncate">{b.client_name || 'Sin cliente'}</p>
                            <p className="text-xs text-ink-secondary truncate">
                              {b.property_name} · {b.guests_count || 0} huésped{(b.guests_count || 0) === 1 ? '' : 'es'}
                            </p>
                          </div>
                          {needsDepositReview ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex-shrink-0 text-primary bg-surface-violet">
                              Revisar depósito
                            </span>
                          ) : owesBalance ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide flex-shrink-0" style={{ color: 'var(--orange)', background: 'rgba(198,138,78,0.16)' }}>
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
          </div>

          <div className="kanagawa-card p-6">
            <div className="card-content">
              <h3 className="font-display font-semibold text-lg text-ink-primary mb-4">Pendientes que requieren atención</h3>
              {attentionItems.length === 0 ? (
                <p className="text-sm text-ink-muted text-center py-6">No hay pendientes por ahora</p>
              ) : (
                <div className="space-y-2">
                  {attentionItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-md border"
                      style={
                        item.severity === 'danger'
                          ? { background: 'rgba(166,77,69,0.1)', borderColor: 'rgba(166,77,69,0.24)' }
                          : { background: 'rgba(198,138,78,0.1)', borderColor: 'rgba(198,138,78,0.24)' }
                      }
                    >
                      <div
                        className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0"
                        style={
                          item.severity === 'danger'
                            ? { background: 'rgba(166,77,69,0.14)', color: 'var(--red)' }
                            : { background: 'rgba(198,138,78,0.14)', color: 'var(--orange)' }
                        }
                      >
                        <AlertTriangle className="w-4 h-4" strokeWidth={1.7} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-ink-primary truncate">{item.title}</p>
                        <p className="text-xs text-ink-secondary truncate">{item.description}</p>
                      </div>
                      <button
                        onClick={item.onAction}
                        className="button-secondary px-3 py-1.5 text-xs font-semibold hover:bg-surface-hover flex-shrink-0 transition-colors duration-fast ease-kanagawa"
                      >
                        {item.action}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
