import { useEffect, useState, useMemo, type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Download, Home, User } from 'lucide-react';
import { getAccountingStats, getBookings, getDashboardStats, getExpenses } from '../services/api';
import { Pagination } from '../components/Pagination';
import { KanagawaCard, type KanagawaCardTone } from '../components/ui/KanagawaCard';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { kanagawaAssets } from '../theme/kanagawa-assets';

const PAGE_SIZE = 10;

interface SeasonStats {
  year: number;
  month: number;
  month_name: string;
  total_revenue_ars: number;
  total_revenue_usd: number;
  bookings_count: number;
  occupancy_rate: number;
}

interface AccountingData {
  current_season_total_ars: number;
  current_season_total_usd: number;
  previous_season_total_ars: number;
  previous_season_total_usd: number;
  comparisons: SeasonStats[];
}

interface Expense {
  id: string;
  date: string;
  amount: number;
  currency: string;
}

interface CompletedBooking {
  id: string;
  property_name?: string;
  client_name?: string;
  check_in: string;
  check_out: string;
  total_price_usd: number;
  total_price_currency?: string;
  advance_payment_date?: string;
  balance_settled_at?: string;
}

const monthsList = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
};

const downloadCsv = (rows: CompletedBooking[]) => {
  const header = ['Fecha check-in', 'Fecha check-out', 'Cliente', 'Propiedad', 'Monto', 'Moneda'];
  const lines = rows.map((b) => [
    b.check_in,
    b.check_out,
    b.client_name || '',
    b.property_name || '',
    String(b.total_price_usd ?? 0),
    b.total_price_currency || 'USD',
  ]);
  const csv = [header, ...lines].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `movimientos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const Finance = () => {
  const [data, setData] = useState<AccountingData | null>(null);
  const [completedBookings, setCompletedBookings] = useState<CompletedBooking[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    total_revenue_month_ars: 0,
    total_revenue_month_usd: 0,
    total_advance_month_ars: 0,
    total_advance_month_usd: 0,
  });
  const [monthExpensesArs, setMonthExpensesArs] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filtros personalizados (comparativa de temporadas)
  const [selectedMonth, setSelectedMonth] = useState<number>(0); // 0 = Temporada completa
  const [year1, setYear1] = useState<number>(new Date().getFullYear());
  const [year2, setYear2] = useState<number>(new Date().getFullYear() + 1);
  const [movementsPage, setMovementsPage] = useState(1);
  // Año de "Movimientos recientes" (independiente de la comparativa de
  // temporadas): a diferencia del dashboard de inicio, acá sí se puede
  // revisar cualquier año viejo.
  const [movementsYear, setMovementsYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    setMovementsPage(1);
  }, [selectedMonth, year1, year2]);

  useEffect(() => {
    setMovementsPage(1);
  }, [movementsYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const [stats, bookings, dashStats, expenses] = await Promise.all([
        getAccountingStats(
          selectedMonth > 0 ? selectedMonth : undefined,
          selectedMonth > 0 ? year1 : undefined,
          selectedMonth > 0 ? year2 : undefined
        ),
        getBookings('completed'),
        getDashboardStats(),
        getExpenses({ year: now.getFullYear() }),
      ]);
      setData(stats);
      setCompletedBookings(bookings || []);
      setDashboardStats({
        total_revenue_month_ars: dashStats.total_revenue_month_ars || 0,
        total_revenue_month_usd: dashStats.total_revenue_month_usd || 0,
        total_advance_month_ars: dashStats.total_advance_month_ars || 0,
        total_advance_month_usd: dashStats.total_advance_month_usd || 0,
      });
      const currentMonth = now.getMonth() + 1;
      const monthTotal = (expenses || [])
        .filter((e: Expense) => {
          const [, m] = e.date.split('-').map(Number);
          return m === currentMonth && e.currency === 'ARS';
        })
        .reduce((sum: number, e: Expense) => sum + Number(e.amount || 0), 0);
      setMonthExpensesArs(monthTotal);
    } catch (error) {
      console.error('Error fetching accounting stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, year1, year2]);

  // "Rendimiento" se calcula sobre USD (histórico: es lo que ya se comparaba
  // antes de separar por moneda). Los bloques de temporada anterior/actual
  // muestran ambas monedas por separado, sin mezclarlas.
  const diffUsd = (data?.current_season_total_usd || 0) - (data?.previous_season_total_usd || 0);
  const percentChangeUsd = data?.previous_season_total_usd ? (diffUsd / data.previous_season_total_usd) * 100 : 0;
  const diffArs = (data?.current_season_total_ars || 0) - (data?.previous_season_total_ars || 0);

  // El backend ahora compara el año calendario completo actual vs el
  // consecutivo/siguiente (12 meses cada uno), ya no la "temporada" Dic-Mar
  // ni el año anterior: este negocio vende con meses de anticipación, así
  // que lo que importa por defecto es este año y el próximo.
  const months = monthsList;
  const currentYear = data?.comparisons[0]?.year || new Date().getFullYear();
  const nextYear = currentYear + 1;

  const saldosArs = Math.max(0, dashboardStats.total_revenue_month_ars - dashboardStats.total_advance_month_ars);
  const saldosUsd = Math.max(0, dashboardStats.total_revenue_month_usd - dashboardStats.total_advance_month_usd);
  const resultadoMes = dashboardStats.total_revenue_month_ars - monthExpensesArs;

  const KpiCard = useMemo(
    () =>
      ({
        icon,
        title,
        value,
        valueClassName,
        breakdown,
        tone,
        artwork,
      }: {
        icon: ReactNode;
        title: string;
        value: string;
        valueClassName: string;
        breakdown: string;
        tone: KanagawaCardTone;
        artwork: typeof kanagawaAssets.cards.pesos;
      }) => (
        <KanagawaCard tone={tone} artwork={artwork}>
          <div className="flex items-start justify-between mb-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">{title}</p>
            {icon}
          </div>
          <p className={`font-sans font-extrabold text-[27px] tracking-tight leading-none ${valueClassName}`}>{value}</p>
          <p className="text-xs font-semibold mt-2 text-ink-secondary">{breakdown}</p>
        </KanagawaCard>
      ),
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Filtramos por la fecha real de cobro (seña o saldo). Reservas viejas sin
  // esas fechas (previas a este cambio) usan check_out como respaldo.
  const movementsForYear = completedBookings.filter((b) => {
    const movementDate = b.balance_settled_at || b.advance_payment_date || b.check_out;
    return movementDate?.slice(0, 4) === String(movementsYear);
  });
  const movementsTotalPages = Math.max(1, Math.ceil(movementsForYear.length / PAGE_SIZE));
  const paginatedMovements = movementsForYear.slice(
    (movementsPage - 1) * PAGE_SIZE,
    movementsPage * PAGE_SIZE
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          icon={<span className="text-xl leading-none">🇦🇷</span>}
          title="Recaudado en pesos"
          value={`$${dashboardStats.total_revenue_month_ars.toLocaleString()}`}
          valueClassName="text-state-blue"
          breakdown={`Anticipos $${dashboardStats.total_advance_month_ars.toLocaleString()} · Saldos $${saldosArs.toLocaleString()}`}
          tone="blue"
          artwork={kanagawaAssets.cards.pesos}
        />
        <KpiCard
          icon={<span className="text-xl leading-none">💵</span>}
          title="Recaudado en dólares"
          value={`U$D ${dashboardStats.total_revenue_month_usd.toLocaleString()}`}
          valueClassName="text-state-green-strong"
          breakdown={`Anticipos U$D ${dashboardStats.total_advance_month_usd.toLocaleString()} · Saldos U$D ${saldosUsd.toLocaleString()}`}
          tone="green"
          artwork={kanagawaAssets.cards.dolares}
        />
        <KpiCard
          icon={<TrendingUp className="w-5 h-5 text-primary-soft" strokeWidth={1.7} />}
          title="Resultado del mes"
          value={`$${resultadoMes.toLocaleString()}`}
          valueClassName="text-ink-primary"
          breakdown={`Ingresos $${dashboardStats.total_revenue_month_ars.toLocaleString()} − Gastos $${monthExpensesArs.toLocaleString()}`}
          tone="red"
          artwork={kanagawaAssets.cards.resultado}
        />
      </div>

      {/* Comparativa de temporadas (funcionalidad existente, retinteada) */}
      <KanagawaCard padded={false} className="overflow-hidden">
        <div className="p-6 border-b border-border-subtle bg-background-alt flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-display font-extrabold text-lg text-ink-primary flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" strokeWidth={1.7} />
            Comparativa de temporadas
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="form-control px-3 py-2 text-sm font-semibold text-primary"
            >
              <option value={0}>Temporada completa</option>
              {monthsList.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            {selectedMonth > 0 && (
              <>
                <select
                  value={year1}
                  onChange={(e) => setYear1(parseInt(e.target.value))}
                  className="form-control px-3 py-2 text-sm font-semibold text-ink-primary"
                >
                  {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <span className="text-ink-muted text-sm font-semibold">vs</span>
                <select
                  value={year2}
                  onChange={(e) => setYear2(parseInt(e.target.value))}
                  className="form-control px-3 py-2 text-sm font-semibold text-ink-primary"
                >
                  {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </>
            )}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl p-4 bg-background-alt border border-border-subtle">
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted mb-1">
              {selectedMonth > 0 ? `${monthsList[selectedMonth - 1]} ${year2}` : `Temporada ${nextYear}`}
            </p>
            <p className="font-sans font-extrabold text-lg text-ink-secondary">$ {(data?.previous_season_total_ars || 0).toLocaleString()}</p>
            <p className="font-sans font-bold text-sm text-ink-muted">U$D {(data?.previous_season_total_usd || 0).toLocaleString()}</p>
          </div>
          <div className="rounded-xl p-4 bg-surface-violet border border-border">
            <p className="text-[10px] font-bold uppercase tracking-wide text-primary mb-1">
              {selectedMonth > 0 ? `${monthsList[selectedMonth - 1]} ${year1}` : 'Temporada actual'}
            </p>
            <p className="font-sans font-extrabold text-lg text-ink-primary">$ {(data?.current_season_total_ars || 0).toLocaleString()}</p>
            <p className="font-sans font-bold text-sm text-ink-secondary">U$D {(data?.current_season_total_usd || 0).toLocaleString()}</p>
          </div>
          <div className={`rounded-xl p-4 border flex items-center gap-2 ${diffUsd >= 0 ? 'bg-[rgba(125,143,116,0.16)] border-[rgba(125,143,116,0.28)]' : 'bg-[rgba(166,77,69,0.14)] border-[rgba(166,77,69,0.28)]'}`}>
            {diffUsd >= 0 ? <TrendingUp className="w-5 h-5 text-state-green-strong" strokeWidth={1.7} /> : <TrendingDown className="w-5 h-5 text-state-red-strong" strokeWidth={1.7} />}
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wide ${diffUsd >= 0 ? 'text-state-green-strong' : 'text-state-red-strong'}`}>Rendimiento (U$D)</p>
              <p className={`font-display font-extrabold text-lg ${diffUsd >= 0 ? 'text-state-green-strong' : 'text-state-red-strong'}`}>{Math.abs(percentChangeUsd).toFixed(1)}%</p>
              <p className={`text-[11px] font-semibold ${diffArs >= 0 ? 'text-state-green-strong' : 'text-state-red-strong'}`}>
                {diffArs >= 0 ? '+' : ''}$ {diffArs.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {selectedMonth === 0 && (
          <div className="overflow-x-auto border-t border-border-subtle">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background-alt text-left">
                  <th className="px-6 py-3 table-head-cell">Mes</th>
                  <th className="px-6 py-3 table-head-cell">Temp. siguiente</th>
                  <th className="px-6 py-3 table-head-cell">Temp. actual</th>
                  <th className="px-6 py-3 table-head-cell">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {months.map((monthName) => {
                  const current = data?.comparisons.find((c) => c.month_name === monthName && c.year === currentYear);
                  const previous = data?.comparisons.find((c) => c.month_name === monthName && c.year === nextYear);
                  const currentArs = current?.total_revenue_ars || 0;
                  const currentUsd = current?.total_revenue_usd || 0;
                  const previousArs = previous?.total_revenue_ars || 0;
                  const previousUsd = previous?.total_revenue_usd || 0;
                  const mDiffArs = currentArs - previousArs;
                  const mDiffUsd = currentUsd - previousUsd;
                  return (
                    <tr key={monthName} className="table-row">
                      <td className="px-6 py-3.5 font-semibold text-ink-primary capitalize">{monthName}</td>
                      <td className="px-6 py-3.5 font-sans text-ink-muted">
                        <div>$ {previousArs.toLocaleString()}</div>
                        <div className="text-xs">U$D {previousUsd.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-3.5 font-sans font-bold text-ink-primary">
                        <div>$ {currentArs.toLocaleString()}</div>
                        <div className="text-xs font-semibold text-ink-secondary">U$D {currentUsd.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-3.5 font-mono font-semibold">
                        <div className={mDiffArs >= 0 ? 'text-state-green-strong' : 'text-state-red-strong'}>
                          {mDiffArs >= 0 ? '+' : ''}$ {mDiffArs.toLocaleString()}
                        </div>
                        <div className={`text-xs ${mDiffUsd >= 0 ? 'text-state-green-strong' : 'text-state-red-strong'}`}>
                          {mDiffUsd >= 0 ? '+' : ''}U$D {mDiffUsd.toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </KanagawaCard>

      {/* Movimientos recientes: no existe un endpoint de pagos individuales en el
          backend (el modelo Payment existe pero no tiene ruta expuesta), así que
          esta tabla usa el historial real de reservas completadas — el dato más
          cercano disponible — en vez de inventar filas de pagos sueltos. */}
      <KanagawaCard padded={false} className="overflow-hidden">
        <div className="p-6 border-b border-border-subtle bg-background-alt flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display font-extrabold text-lg text-ink-primary">Movimientos recientes</h3>
          <div className="flex items-center gap-3">
            <select
              value={movementsYear}
              onChange={(e) => setMovementsYear(parseInt(e.target.value))}
              className="form-control px-3 py-2 text-sm font-semibold text-ink-primary"
            >
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <Button
              variant="secondary"
              onClick={() => downloadCsv(movementsForYear)}
              disabled={movementsForYear.length === 0}
            >
              <Download className="w-4 h-4" strokeWidth={1.7} />
              Exportar
            </Button>
          </div>
        </div>

        {movementsForYear.length === 0 ? (
          <EmptyState title="No hay movimientos registrados." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background-alt text-left">
                  <th className="px-6 py-3 table-head-cell">Fecha</th>
                  <th className="px-6 py-3 table-head-cell">Cliente</th>
                  <th className="px-6 py-3 table-head-cell">Concepto</th>
                  <th className="px-6 py-3 table-head-cell">Propiedad</th>
                  <th className="px-6 py-3 table-head-cell text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMovements.map((booking) => (
                  <tr key={booking.id} className="table-row">
                    <td className="px-6 py-3.5 font-mono text-ink-secondary whitespace-nowrap">
                      {formatDate(booking.balance_settled_at || booking.advance_payment_date || booking.check_out)}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-[10px] bg-surface-violet text-primary flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4" strokeWidth={1.7} />
                        </div>
                        <span className="font-semibold text-ink-primary truncate">{booking.client_name || 'Sin cliente'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-primary font-medium">Reserva completa</td>
                    <td className="px-6 py-3.5 text-ink-secondary">
                      <div className="flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.7} />
                        <span className="truncate">{booking.property_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right font-sans font-bold text-ink-primary whitespace-nowrap">
                      {booking.total_price_currency === 'ARS'
                        ? `💰 $ ${booking.total_price_usd.toLocaleString()}`
                        : `💵 U$D ${booking.total_price_usd.toLocaleString()}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination currentPage={movementsPage} totalPages={movementsTotalPages} onPageChange={setMovementsPage} />
      </KanagawaCard>
    </div>
  );
};
