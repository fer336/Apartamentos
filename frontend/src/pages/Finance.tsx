import { useEffect, useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Download, Home, User } from 'lucide-react';
import { getAccountingStats, getBookings, getDashboardStats, getExpenses } from '../services/api';

interface SeasonStats {
  year: number;
  month: number;
  month_name: string;
  total_revenue: number;
  bookings_count: number;
  occupancy_rate: number;
}

interface AccountingData {
  current_season_total: number;
  previous_season_total: number;
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
}

const monthsList = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
};

const downloadCsv = (rows: CompletedBooking[]) => {
  const header = ['Fecha check-in', 'Fecha check-out', 'Cliente', 'Propiedad', 'Monto USD'];
  const lines = rows.map((b) => [
    b.check_in,
    b.check_out,
    b.client_name || '',
    b.property_name || '',
    String(b.total_price_usd ?? 0),
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
  const [year2, setYear2] = useState<number>(new Date().getFullYear() - 1);

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

  const diff = (data?.current_season_total || 0) - (data?.previous_season_total || 0);
  const percentChange = data?.previous_season_total ? (diff / data.previous_season_total) * 100 : 0;

  const months = ['Diciembre', 'Enero', 'Febrero', 'Marzo'];
  const currentYear = data?.comparisons[0]?.year || new Date().getFullYear();

  const saldosArs = Math.max(0, dashboardStats.total_revenue_month_ars - dashboardStats.total_advance_month_ars);
  const saldosUsd = Math.max(0, dashboardStats.total_revenue_month_usd - dashboardStats.total_advance_month_usd);
  const resultadoMes = dashboardStats.total_revenue_month_ars - monthExpensesArs;

  const KpiCard = useMemo(
    () =>
      ({
        emoji,
        title,
        value,
        breakdown,
        bg,
        valueColor,
      }: {
        emoji: string;
        title: string;
        value: string;
        breakdown: string;
        bg: string;
        valueColor: string;
      }) => (
        <div className={`rounded-2xl p-6 border ${bg}`}>
          <div className="flex items-start justify-between mb-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#7b6b95]">{title}</p>
            <span className="text-xl leading-none">{emoji}</span>
          </div>
          <p className={`font-display font-extrabold text-[27px] tracking-tight leading-none ${valueColor}`}>{value}</p>
          <p className="text-xs font-semibold mt-2 text-[#7b6b95]">{breakdown}</p>
        </div>
      ),
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          emoji="🇦🇷"
          title="Recaudado en pesos"
          value={`$${dashboardStats.total_revenue_month_ars.toLocaleString()}`}
          breakdown={`Anticipos $${dashboardStats.total_advance_month_ars.toLocaleString()} · Saldos $${saldosArs.toLocaleString()}`}
          bg="bg-[#eaf1fd] border-[#d6e4fb]"
          valueColor="text-[#1d4ed8]"
        />
        <KpiCard
          emoji="💵"
          title="Recaudado en dólares"
          value={`U$D ${dashboardStats.total_revenue_month_usd.toLocaleString()}`}
          breakdown={`Anticipos U$D ${dashboardStats.total_advance_month_usd.toLocaleString()} · Saldos U$D ${saldosUsd.toLocaleString()}`}
          bg="bg-[#e7f5ec] border-[#cdeadb]"
          valueColor="text-[#1d7a3e]"
        />
        <div className="rounded-2xl p-6 bg-gradient-to-br from-[#3a2459] to-[#26173e] text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/5 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#b9a9d6]">Resultado del mes</p>
              <TrendingUp className="w-5 h-5 text-white/80" />
            </div>
            <p className="font-display font-extrabold text-[27px] tracking-tight leading-none">
              ${resultadoMes.toLocaleString()}
            </p>
            <p className="text-xs font-semibold mt-2 text-[#b9a9d6]">
              Ingresos ${dashboardStats.total_revenue_month_ars.toLocaleString()} − Gastos ${monthExpensesArs.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Comparativa de temporadas (funcionalidad existente, retinteada) */}
      <div className="bg-white rounded-2xl border border-[#e7dff3] shadow-card overflow-hidden">
        <div className="p-6 border-b border-[#eee5f6] bg-[#faf8fd] flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-display font-extrabold text-lg text-[#121325] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-600" />
            Comparativa de temporadas
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-white border border-[#e0d7ef] rounded-[10px] px-3 py-2 text-sm font-semibold text-[#5c3a8c] focus:outline-none focus:border-[#ad8ed2] focus:ring-[3px] focus:ring-[#7c5ca8]/15"
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
                  className="bg-white border border-[#e0d7ef] rounded-[10px] px-3 py-2 text-sm font-semibold text-[#121325] focus:outline-none focus:border-[#ad8ed2]"
                >
                  {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <span className="text-[#9583b3] text-sm font-semibold">vs</span>
                <select
                  value={year2}
                  onChange={(e) => setYear2(parseInt(e.target.value))}
                  className="bg-white border border-[#e0d7ef] rounded-[10px] px-3 py-2 text-sm font-semibold text-[#121325] focus:outline-none focus:border-[#ad8ed2]"
                >
                  {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </>
            )}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl p-4 bg-[#faf8fd] border border-[#eee5f6]">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#9583b3] mb-1">
              {selectedMonth > 0 ? `${monthsList[selectedMonth - 1]} ${year2}` : 'Temporada anterior'}
            </p>
            <p className="font-display font-extrabold text-xl text-[#7b6b95]">U$D {(data?.previous_season_total || 0).toLocaleString()}</p>
          </div>
          <div className="rounded-xl p-4 bg-[#f5f2fa] border border-[#e7dff3]">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#5c3a8c] mb-1">
              {selectedMonth > 0 ? `${monthsList[selectedMonth - 1]} ${year1}` : 'Temporada actual'}
            </p>
            <p className="font-display font-extrabold text-xl text-[#121325]">U$D {(data?.current_season_total || 0).toLocaleString()}</p>
          </div>
          <div className={`rounded-xl p-4 border flex items-center gap-2 ${diff >= 0 ? 'bg-[#e4f3ea] border-[#c7e8d3]' : 'bg-[#fdecec] border-[#f8c9c9]'}`}>
            {diff >= 0 ? <TrendingUp className="w-5 h-5 text-[#2f8f4e]" /> : <TrendingDown className="w-5 h-5 text-[#dc2626]" />}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: diff >= 0 ? '#2f8f4e' : '#dc2626' }}>Rendimiento</p>
              <p className="font-display font-extrabold text-lg" style={{ color: diff >= 0 ? '#2f8f4e' : '#dc2626' }}>{Math.abs(percentChange).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {selectedMonth === 0 && (
          <div className="overflow-x-auto border-t border-[#eee5f6]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#faf8fd] text-left">
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wide text-[#9583b3]">Mes</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wide text-[#9583b3]">Temp. anterior</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wide text-[#9583b3]">Temp. actual</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wide text-[#9583b3]">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee5f6]">
                {months.map((monthName) => {
                  const current = data?.comparisons.find((c) => c.month_name === monthName && (c.month === 12 ? c.year === currentYear : c.year === currentYear + 1));
                  const previous = data?.comparisons.find((c) => c.month_name === monthName && (c.month === 12 ? c.year === currentYear - 1 : c.year === currentYear));
                  const currentVal = current?.total_revenue || 0;
                  const previousVal = previous?.total_revenue || 0;
                  const mDiff = currentVal - previousVal;
                  const mPercent = previousVal ? (mDiff / previousVal) * 100 : 0;
                  return (
                    <tr key={monthName} className="hover:bg-[#faf8fd] transition-colors">
                      <td className="px-6 py-3.5 font-semibold text-[#121325] capitalize">{monthName}</td>
                      <td className="px-6 py-3.5 text-[#9583b3]">U$D {previousVal.toLocaleString()}</td>
                      <td className="px-6 py-3.5 font-display font-bold text-[#121325]">U$D {currentVal.toLocaleString()}</td>
                      <td className="px-6 py-3.5 font-semibold" style={{ color: mDiff >= 0 ? '#2f8f4e' : '#dc2626' }}>
                        {mDiff >= 0 ? '+' : ''}{mDiff.toLocaleString()} ({mPercent.toFixed(1)}%)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Movimientos recientes: no existe un endpoint de pagos individuales en el
          backend (el modelo Payment existe pero no tiene ruta expuesta), así que
          esta tabla usa el historial real de reservas completadas — el dato más
          cercano disponible — en vez de inventar filas de pagos sueltos. */}
      <div className="bg-white rounded-2xl border border-[#e7dff3] shadow-card overflow-hidden">
        <div className="p-6 border-b border-[#eee5f6] bg-[#faf8fd] flex items-center justify-between">
          <h3 className="font-display font-extrabold text-lg text-[#121325]">Movimientos recientes</h3>
          <button
            onClick={() => downloadCsv(completedBookings)}
            disabled={completedBookings.length === 0}
            className="px-4 py-2 bg-white border border-[#e0d7ef] hover:bg-[#f0ebf8] text-[#5c3a8c] rounded-[11px] text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>

        {completedBookings.length === 0 ? (
          <p className="px-6 py-12 text-center text-[#9583b3]">No hay movimientos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#faf8fd] text-left">
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wide text-[#9583b3]">Fecha</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wide text-[#9583b3]">Cliente</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wide text-[#9583b3]">Concepto</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wide text-[#9583b3]">Propiedad</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wide text-[#9583b3] text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee5f6]">
                {completedBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-[#faf8fd] transition-colors">
                    <td className="px-6 py-3.5 text-[#7b6b95] whitespace-nowrap">{formatDate(booking.check_out)}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-[10px] bg-[#ece6f6] text-[#5c3a8c] flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-[#121325] truncate">{booking.client_name || 'Sin cliente'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-[#5c3a8c] font-medium">Reserva completa</td>
                    <td className="px-6 py-3.5 text-[#7b6b95]">
                      <div className="flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{booking.property_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right font-display font-bold text-[#121325] whitespace-nowrap">
                      💵 U$D {booking.total_price_usd.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
