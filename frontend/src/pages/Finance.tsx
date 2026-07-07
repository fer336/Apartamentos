import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, BarChart3, ArrowRight, User, Home, CheckCircle, Edit } from 'lucide-react';
import { getAccountingStats, getBookings } from '../services/api';

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

const monthsList = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const Finance = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AccountingData | null>(null);
  const [completedBookings, setCompletedBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros personalizados
  const [selectedMonth, setSelectedMonth] = useState<number>(0); // 0 = Temporada completa
  const [year1, setYear1] = useState<number>(new Date().getFullYear());
  const [year2, setYear2] = useState<number>(new Date().getFullYear() - 1);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stats, bookings] = await Promise.all([
        getAccountingStats(
          selectedMonth > 0 ? selectedMonth : undefined,
          selectedMonth > 0 ? year1 : undefined,
          selectedMonth > 0 ? year2 : undefined
        ),
        getBookings('completed')
      ]);
      setData(stats);
      setCompletedBookings(bookings);
    } catch (error) {
      console.error('Error fetching accounting stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, year1, year2]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const diff = (data?.current_season_total || 0) - (data?.previous_season_total || 0);
  const percentChange = data?.previous_season_total
    ? (diff / data.previous_season_total) * 100
    : 0;

  // Agrupar por mes para comparar años
  const months = ['Diciembre', 'Enero', 'Febrero', 'Marzo'];
  const currentYear = data?.comparisons[0]?.year || new Date().getFullYear();

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="w-12 h-12 rounded-2xl bg-white border-2 border-emerald-100 hover:bg-emerald-50 flex items-center justify-center transition-all shadow-sm"
          >
            <ArrowLeft className="w-6 h-6 text-emerald-600" />
          </button>
          <div>
            <h1 className="text-4xl font-black text-gray-900 flex items-center gap-3">
              <BarChart3 className="w-10 h-10 text-emerald-500" />
              Contabilidad
            </h1>
            <p className="text-gray-500 mt-1 font-medium">Análisis y Comparativa de Temporadas</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-[2rem] border border-emerald-100 shadow-xl shadow-emerald-900/5">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Análisis</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-emerald-50 border-none rounded-xl px-4 py-2 font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value={0}>Temporada Completa</option>
              {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>

          {selectedMonth > 0 && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Año A</label>
                <select
                  value={year1}
                  onChange={(e) => setYear1(parseInt(e.target.value))}
                  className="bg-gray-50 border-none rounded-xl px-4 py-2 font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="text-gray-300 font-black mt-4">vs</div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Año B</label>
                <select
                  value={year2}
                  onChange={(e) => setYear2(parseInt(e.target.value))}
                  className="bg-gray-50 border-none rounded-xl px-4 py-2 font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards - More Compact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-lg shadow-emerald-900/5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
            {selectedMonth > 0 ? `${monthsList[selectedMonth - 1]} ${year1}` : 'Temporada Actual'}
          </p>
          <div className="text-2xl font-black text-gray-900 mb-1">
            U$D {(data?.current_season_total || 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
            <Calendar className="w-3.5 h-3.5" /> {selectedMonth > 0 ? 'Mes Seleccionado' : 'Dic - Mar'}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg shadow-gray-900/5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-gray-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            {selectedMonth > 0 ? `${monthsList[selectedMonth - 1]} ${year2}` : 'Temporada Anterior'}
          </p>
          <div className="text-2xl font-black text-gray-400 mb-1">
            U$D {(data?.previous_season_total || 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-300">
            <Calendar className="w-3.5 h-3.5" /> {selectedMonth > 0 ? 'Mes Comparado' : 'Dic - Mar'}
          </div>
        </div>

        <div className={`rounded-2xl p-6 border shadow-lg relative overflow-hidden group ${diff >= 0 ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-rose-500 border-rose-400 text-white'}`}>
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-80">Rendimiento</p>
          <div className="text-2xl font-black mb-1 flex items-center gap-1.5">
            {diff >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
            {Math.abs(percentChange).toFixed(1)}%
          </div>
          <p className="text-[10px] font-bold opacity-90">
            {diff >= 0 ? 'Rendimiento Positivo' : 'Rendimiento Negativo'}
          </p>
        </div>
      </div>

      {/* Comparison - Mobile Optimized */}
      {selectedMonth === 0 && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden">
          <div className="p-6 md:p-8 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
              Comparativa Mensual
            </h3>
            <span className="text-[10px] md:text-xs font-black bg-emerald-100 text-emerald-700 px-2 md:px-3 py-1 rounded-full uppercase">USD</span>
          </div>

          {/* Mobile View - Cards */}
          <div className="block md:hidden divide-y divide-gray-100">
            {months.map(monthName => {
              const current = data?.comparisons.find(c => c.month_name === monthName && (c.month === 12 ? c.year === currentYear : c.year === currentYear + 1));
              const previous = data?.comparisons.find(c => c.month_name === monthName && (c.month === 12 ? c.year === currentYear - 1 : c.year === currentYear));

              const currentVal = current?.total_revenue || 0;
              const previousVal = previous?.total_revenue || 0;
              const mDiff = currentVal - previousVal;
              const mPercent = previousVal ? (mDiff / previousVal) * 100 : 0;

              return (
                <div key={monthName} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-black text-gray-900 text-base capitalize">{monthName}</h4>
                    {currentVal > 0 && (
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase ${mDiff >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {mDiff >= 0 ? 'Mejorado' : 'Bajo'}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Temp. Anterior</p>
                      <p className="text-gray-600 font-bold text-sm">USD {previousVal.toLocaleString()}</p>
                      <p className="text-[9px] text-gray-400 font-bold">{previous?.bookings_count || 0} Reservas</p>
                    </div>

                    <div className="bg-emerald-50 rounded-xl p-3">
                      <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Temp. Actual</p>
                      <p className="text-gray-900 font-black text-base">USD {currentVal.toLocaleString()}</p>
                      <p className="text-[9px] text-emerald-600 font-bold">{current?.bookings_count || 0} Reservas</p>
                    </div>
                  </div>

                  {currentVal > 0 && (
                    <div className="mt-3 flex items-center justify-center">
                      <div className={`text-sm font-black ${mDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {mDiff >= 0 ? '+' : ''}{mDiff.toLocaleString()} <span className="text-xs opacity-70">({mPercent.toFixed(1)}%)</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-5 text-sm font-black text-gray-400 uppercase tracking-wider">Mes</th>
                  <th className="px-8 py-5 text-sm font-black text-gray-400 uppercase tracking-wider">Temp. Anterior</th>
                  <th className="px-8 py-5 text-sm font-black text-gray-400 uppercase tracking-wider">Temp. Actual</th>
                  <th className="px-8 py-5 text-sm font-black text-gray-400 uppercase tracking-wider">Diferencia</th>
                  <th className="px-8 py-5 text-sm font-black text-gray-400 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {months.map(monthName => {
                  const current = data?.comparisons.find(c => c.month_name === monthName && (c.month === 12 ? c.year === currentYear : c.year === currentYear + 1));
                  const previous = data?.comparisons.find(c => c.month_name === monthName && (c.month === 12 ? c.year === currentYear - 1 : c.year === currentYear));

                  const currentVal = current?.total_revenue || 0;
                  const previousVal = previous?.total_revenue || 0;
                  const mDiff = currentVal - previousVal;
                  const mPercent = previousVal ? (mDiff / previousVal) * 100 : 0;

                  return (
                    <tr key={monthName} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <span className="font-black text-gray-900 text-lg capitalize">{monthName}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-gray-400 font-bold">U$D {previousVal.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-300 font-black uppercase">{previous?.bookings_count || 0} Reservas</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-gray-900 font-black text-xl">U$D {currentVal.toLocaleString()}</div>
                        <div className="text-[10px] text-emerald-500 font-black uppercase">{current?.bookings_count || 0} Reservas</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={`font-black flex items-center gap-1 ${mDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {mDiff >= 0 ? '+' : ''}{mDiff.toLocaleString()}
                          <span className="text-xs opacity-70">({mPercent.toFixed(1)}%)</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {currentVal > 0 ? (
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${mDiff >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {mDiff >= 0 ? 'Mejorado' : 'Bajo'}
                          </div>
                        ) : (
                          <span className="text-[10px] font-black text-gray-300 uppercase">Sin Datos</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Completed Bookings - Mobile Optimized */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden">
        <div className="p-6 md:p-8 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
          <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
            <span className="hidden sm:inline">Historial de Reservas</span>
            <span className="sm:hidden">Historial</span>
          </h3>
          <span className="text-[10px] md:text-xs font-black bg-emerald-100 text-emerald-700 px-2 md:px-3 py-1 rounded-full uppercase">
            {completedBookings.length} <span className="hidden sm:inline">Finalizadas</span>
          </span>
        </div>

        {completedBookings.length === 0 ? (
          <div className="px-6 md:px-8 py-12 text-center text-gray-400 font-medium italic">
            No hay reservas finalizadas registradas.
          </div>
        ) : (
          <>
            {/* Mobile View - Cards */}
            <div className="block md:hidden divide-y divide-gray-100">
              {completedBookings.map((booking) => (
                <div key={booking.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <Home className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-gray-900 text-sm truncate">{booking.property_name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" /> {booking.client_name}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        // TODO: Implementar edición
                        alert('Edición de reserva próximamente');
                      }}
                      className="ml-2 w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors shrink-0"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 mb-3">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Periodo</p>
                    <p className="text-xs font-bold text-gray-700">
                      {formatDate(booking.check_in)} - {formatDate(booking.check_out)}
                    </p>
                    <p className="text-[9px] text-gray-400 font-bold mt-1">
                      {Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24))} Noches
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-base font-black text-gray-900">USD {booking.total_price_usd.toLocaleString()}</div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-700">
                      Completado
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-wider">Propiedad / Cliente</th>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-wider">Periodo</th>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-wider">Total</th>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-wider">Estado Pago</th>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {completedBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Home className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-black text-gray-900">{booking.property_name}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <User className="w-3 h-3" /> {booking.client_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-bold text-gray-700">
                          {formatDate(booking.check_in)} - {formatDate(booking.check_out)}
                        </div>
                        <div className="text-[10px] text-gray-400 font-black uppercase">
                          {Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24))} Noches
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-lg font-black text-gray-900">U$D {booking.total_price_usd.toLocaleString()}</div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-700">
                          Completado
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <button 
                          onClick={() => {
                            // TODO: Implementar edición
                            alert('Edición de reserva próximamente');
                          }}
                          className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Insights - More Compact */}
      <div className="bg-emerald-900 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-48 bg-emerald-800 rounded-full -translate-y-1/2 translate-x-1/2 opacity-30"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20">💡</div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-lg font-black mb-1">Análisis de Rentabilidad</h4>
            <p className="text-xs text-emerald-100 font-medium leading-relaxed">
              {selectedMonth > 0
                ? `El mes de ${monthsList[selectedMonth - 1]} muestra un rendimiento del `
                : 'La temporada actual muestra un rendimiento del '
              }
              <span className="text-white font-black">{percentChange.toFixed(1)}%</span> respecto al periodo comparado.
              {diff >= 0
                ? ' El aumento en la recaudación sugiere una mejor gestión de tarifas o mayor demanda.'
                : ' Se recomienda revisar la estrategia de precios para optimizar la rentabilidad.'}
            </p>
          </div>
          <button className="px-6 py-3 bg-white text-emerald-900 rounded-xl text-sm font-black hover:bg-emerald-50 transition-all flex items-center gap-2 group whitespace-nowrap">
            Ver Reporte
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};


