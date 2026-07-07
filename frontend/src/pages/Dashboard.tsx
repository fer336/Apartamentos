import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, Sparkles } from 'lucide-react';
import { getDashboardStats, getProperties } from '../services/api';
import { DirectvManagerModal } from '../components/DirectvManagerModal';

interface MonthlyAvailability {
  month_name: string;
  year: number;
  total_free_days: number;
  status: 'full' | 'partial' | 'none';
  free_ranges: string[];
}

const WEEKS = [
  { label: 'Sem 1', days: '1-7' },
  { label: 'Sem 2', days: '8-14' },
  { label: 'Sem 3', days: '15-21' },
  { label: 'Sem 4', days: '22+' },
];

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const AvailabilityWidget = ({ forecast }: { forecast: MonthlyAvailability[] }) => {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);

  if (!forecast || forecast.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-600 via-violet-700 to-purple-800 rounded-[2rem] p-6 text-white shadow-xl animate-in slide-in-from-bottom-4 duration-700 relative overflow-hidden">
      <h3 className="font-black text-lg mb-4 flex items-center gap-2 relative z-10">
        <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
          <Sparkles className="w-4 h-4 text-yellow-300" />
        </div>
        Disponibilidad Temporada
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {forecast.map((month) => {
          const isPastMonth = month.year < currentYear || (month.year === currentYear && MONTH_NAMES.indexOf(month.month_name) + 1 < currentMonth);

          return (
            <div key={`${month.year}-${month.month_name}`} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between group hover:bg-white/15 transition-all duration-300">
              <div className="flex justify-between items-center mb-3">
                <span className="font-black text-base capitalize tracking-tight">{month.month_name}</span>
                <div className="flex flex-col items-end gap-1">
                  {month.status === 'full' && (
                    <span className="bg-emerald-400/20 text-emerald-300 text-[8px] font-black px-2 py-0.5 rounded-full border border-emerald-400/30 uppercase tracking-wider">LIBRE</span>
                  )}
                  {month.status === 'none' && (
                    <span className="bg-rose-400/20 text-rose-300 text-[8px] font-black px-2 py-0.5 rounded-full border border-rose-400/30 uppercase tracking-wider">OCUPADO</span>
                  )}
                  {isPastMonth && (
                    <span className="bg-white/10 text-white/50 text-[8px] font-black px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-wider">FINALIZADO</span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-end gap-1">
                  {month.total_free_days >= 7 ? (
                    <>
                      <span className="text-2xl font-black leading-none">{(month.total_free_days / 7).toFixed(1)}</span>
                      <span className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest mb-0.5">Semanas Libres</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl font-black leading-none">{month.total_free_days}</span>
                      <span className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest mb-0.5">Días Libres</span>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1">
                  {WEEKS.map((w, idx) => {
                    const weekStart = idx * 7 + 1;
                    const weekEnd = (idx + 1) * 7;
                    const isFree = month.status === 'full' || (month.status === 'partial' && month.free_ranges.some(r => {
                      const [start, end] = r.split('-').map(Number);
                      // Una semana se considera libre si el rango libre cubre al menos 5 días de la semana
                      const overlapStart = Math.max(start, weekStart);
                      const overlapEnd = Math.min(end, weekEnd);
                      const overlapDays = Math.max(0, overlapEnd - overlapStart + 1);
                      return overlapDays >= 5;
                    }));

                    return (
                      <div key={w.label} className="flex flex-col items-center gap-1">
                        <div className={`w-full h-1.5 rounded-full ${isFree ? 'bg-emerald-400' : 'bg-white/20'}`}></div>
                        <span className="text-[7px] font-black text-white/60 uppercase">{w.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    availability_forecast: [] as MonthlyAvailability[],
    total_revenue_accumulated: 0,
    total_revenue_accumulated_ars: 0,
    total_revenue_accumulated_usd: 0,
    total_revenue_month: 0,
    total_revenue_month_ars: 0,
    total_revenue_month_usd: 0,
    total_advance_ars: 0,
    total_advance_usd: 0,
    total_advance_month_ars: 0,
    total_advance_month_usd: 0,
    directv_devices_summary: [] as any[]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDirectvModalOpen, setIsDirectvModalOpen] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        setStats({
          ...data,
          availability_forecast: data.availability_forecast || []
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };

    const fetchProperties = async () => {
      try {
        const props = await getProperties();
        setProperties(props);
      } catch (err) {
        console.error('Error fetching properties:', err);
      }
    };

    fetchStats();
    fetchProperties();
  }, []);

  return (
    <div className="min-h-screen space-y-6 animate-in fade-in duration-700 pt-2 pb-10">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] -left-[10%] w-[30%] h-[30%] bg-purple-100/30 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[10%] right-[20%] w-[25%] h-[25%] bg-emerald-100/30 rounded-full blur-[80px]"></div>
      </div>


      {/* Error Message */}
      {error && (
        <div className="bg-red-50/80 backdrop-blur-md border border-red-100 rounded-3xl p-6 text-red-700 flex items-center justify-center gap-3 shadow-xl shadow-red-900/5">
          <span className="text-2xl">⚠️</span>
          <p className="font-bold">{error}</p>
        </div>
      )}

      {/* Seasonal Availability Widget */}
      {!loading && stats.availability_forecast && stats.availability_forecast.length > 0 && (
        <div className="relative group">
          <div className="absolute inset-0 bg-indigo-600 rounded-3xl blur-2xl opacity-5 group-hover:opacity-10 transition-opacity duration-500"></div>
          <AvailabilityWidget forecast={stats.availability_forecast} />
        </div>
      )}

      {/* Grid de Cards: Contabilidad + DirecTV */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingresos Consolidados - CLICKEABLE */}
        <button
          onClick={() => navigate('/finance')}
          className="lg:col-span-2 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-3xl p-6 md:p-8 border border-emerald-100 shadow-2xl shadow-emerald-900/10 relative overflow-hidden hover:shadow-emerald-900/20 hover:-translate-y-1 transition-all duration-300 text-left group"
        >
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500"></div>
          <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-teal-400/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Contabilidad</h2>
                  <p className="text-xs text-gray-500 font-medium">Click para ver análisis completo</p>
                </div>
              </div>
              <div className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Recaudado del Mes ARS/USD */}
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white shadow-lg">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] mb-3">Recaudado del Mes</p>

                <div className="space-y-2">
                  {/* ARS */}
                  <div className="flex items-center justify-between p-2.5 bg-blue-50/50 rounded-xl">
                    <div>
                      <p className="text-[7px] font-black text-blue-400 uppercase tracking-wider mb-0.5">Pesos</p>
                      <p className="text-lg font-black text-blue-600">
                        {loading ? '...' : `$${(stats.total_revenue_month_ars || 0).toLocaleString()}`}
                      </p>
                    </div>
                    <div className="text-xl">🇦🇷</div>
                  </div>

                  {/* USD */}
                  <div className="flex items-center justify-between p-2.5 bg-green-50/50 rounded-xl">
                    <div>
                      <p className="text-[7px] font-black text-green-400 uppercase tracking-wider mb-0.5">Dólares</p>
                      <p className="text-lg font-black text-green-600">
                        {loading ? '...' : `U$D ${(stats.total_revenue_month_usd || 0).toLocaleString()}`}
                      </p>
                    </div>
                    <div className="text-xl">💵</div>
                  </div>
                </div>
              </div>

              {/* Anticipos del Mes */}
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white shadow-lg">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] mb-3">Anticipos del Mes</p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 bg-blue-50/50 rounded-xl">
                    <div>
                      <p className="text-[7px] font-black text-blue-400 uppercase tracking-wider mb-0.5">Pesos</p>
                      <p className="text-lg font-black text-blue-600">
                        {loading ? '...' : `$${(stats.total_advance_month_ars || 0).toLocaleString()}`}
                      </p>
                    </div>
                    <div className="text-xl">🇦🇷</div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-green-50/50 rounded-xl">
                    <div>
                      <p className="text-[7px] font-black text-green-400 uppercase tracking-wider mb-0.5">Dólares</p>
                      <p className="text-lg font-black text-green-600">
                        {loading ? '...' : `U$D ${(stats.total_advance_month_usd || 0).toLocaleString()}`}
                      </p>
                    </div>
                    <div className="text-xl">💵</div>
                  </div>
                </div>
              </div>

              {/* Ingresos del Mes */}
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white shadow-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">Ingresos del Mes</p>
                    <div className="text-2xl font-black text-amber-600 tracking-tight">
                      {loading ? (
                        <div className="h-8 w-24 bg-gray-100/50 rounded-lg animate-pulse" />
                      ) : (
                        `$${(stats.total_revenue_month || 0).toLocaleString()}`
                      )}
                    </div>
                  </div>
                  <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-[9px] text-gray-500 font-medium">Mes actual</p>
              </div>
            </div>
          </div>
        </button>

        {/* DirecTV Card - Compacto y Clickeable */}
        {!loading && stats.directv_devices_summary && stats.directv_devices_summary.length > 0 && (
          <button
            onClick={() => setIsDirectvModalOpen(true)}
            className="bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 rounded-3xl p-5 border border-blue-100 shadow-2xl shadow-blue-900/10 hover:shadow-blue-900/20 hover:-translate-y-1 relative overflow-hidden transition-all duration-300 text-left group"
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500"></div>
            
            <div className="relative z-10 space-y-2.5">
              {stats.directv_devices_summary.map((device: any) => (
                <div key={device.id} className="bg-white/70 backdrop-blur-md rounded-xl p-3 border border-white shadow-sm flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="text-2xl">📺</div>
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{device.location}</p>
                      <p className="font-black text-gray-800 text-xs">{device.card_number}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg ${device.days_remaining <= 3 ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                    <p className={`text-[7px] font-black uppercase tracking-wider leading-none mb-0.5 ${device.days_remaining <= 3 ? 'text-red-400' : 'text-emerald-400'}`}>Días</p>
                    <p className={`text-xl font-black leading-none ${device.days_remaining <= 3 ? 'text-red-600' : 'text-emerald-600'}`}>{device.days_remaining}</p>
                  </div>
                </div>
              ))}
            </div>
          </button>
        )}
      </div>

      {/* DirecTV Manager Modal */}
      <DirectvManagerModal
        isOpen={isDirectvModalOpen}
        onClose={() => setIsDirectvModalOpen(false)}
        properties={properties}
        onUpdate={async () => {
          // Refrescar estadísticas después de actualizar DirecTV
          const data = await getDashboardStats();
          setStats({
            ...data,
            availability_forecast: data.availability_forecast || []
          });
        }}
      />
    </div>
  );
};
