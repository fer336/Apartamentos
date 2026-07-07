import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Home,
  Calendar,
  Building2,
  Users,
  Plus,
  LogOut,
  Menu,
  X,
  Settings,
  Package,
  DollarSign,
  FileSpreadsheet,
  Wrench,
  Search,
  Bell,
} from 'lucide-react';
import { BookingModal } from './BookingModal';
import { ConfirmModal } from './ConfirmModal';
import { createBooking, getBookings } from '../services/api';
import { jwtDecode } from 'jwt-decode';

interface CheckoutToday {
  id: string;
  client_name?: string;
  property_name?: string;
  check_out: string;
  status: string;
}

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface NavItem {
  path: string;
  icon: typeof Home;
  label: string;
  disabled?: boolean;
}

const NAV_PRINCIPAL: NavItem[] = [
  { path: '/', icon: Home, label: 'Inicio' },
  { path: '/calendar', icon: Calendar, label: 'Calendario' },
  { path: '/properties', icon: Building2, label: 'Propiedades' },
  { path: '/clients', icon: Users, label: 'Clientes' },
];

const NAV_GESTION: NavItem[] = [
  { path: '/finance', icon: DollarSign, label: 'Contabilidad' },
  { path: '/expenses', icon: Wrench, label: 'Gastos' },
  { path: '/import', icon: FileSpreadsheet, label: 'Importar' },
  { path: '/inventory', icon: Package, label: 'Inventario', disabled: true },
  { path: '/settings', icon: Settings, label: 'Configuración', disabled: true },
];

const PAGE_HEADERS: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Inicio', subtitle: 'Resumen general de tu operación' },
  '/calendar': { title: 'Calendario', subtitle: 'Reservas y disponibilidad' },
  '/properties': { title: 'Propiedades', subtitle: 'Tus unidades en alquiler' },
  '/clients': { title: 'Clientes', subtitle: 'Inquilinos y contactos' },
  '/finance': { title: 'Contabilidad', subtitle: 'Ingresos en pesos y dólares' },
  '/expenses': { title: 'Gastos y reparaciones', subtitle: 'Egresos operativos por propiedad' },
  '/import': { title: 'Importar/Exportar', subtitle: 'Carga y descarga de reservas' },
  '/inventory': { title: 'Inventario', subtitle: 'Próximamente disponible' },
  '/settings': { title: 'Configuración', subtitle: 'Próximamente disponible' },
};

export const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<{ name: string; picture: string } | null>(null);
  const [checkoutsToday, setCheckoutsToday] = useState<CheckoutToday[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUser({
          name: decoded.name || 'Usuario',
          picture: decoded.picture || '',
        });
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchCheckoutsToday = async () => {
      try {
        const bookings: CheckoutToday[] = await getBookings();
        const today = getLocalDateString(new Date());
        const todaysCheckouts = (bookings || []).filter(
          (b) => b.check_out === today && b.status !== 'cancelled'
        );
        setCheckoutsToday(todaysCheckouts);
      } catch (error) {
        console.error('Error fetching checkouts today:', error);
      }
    };
    fetchCheckoutsToday();
  }, []);

  const handleGlobalCreateBooking = async (bookingData: any) => {
    try {
      setBookingError(null);
      await createBooking(bookingData);
      setIsBookingModalOpen(false);
      if (location.pathname === '/calendar') {
        window.location.reload();
      } else {
        navigate('/calendar');
      }
    } catch (error: any) {
      console.error('Error creating booking:', error);
      setBookingError(error.response?.data?.detail || 'Error al crear la reserva');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const openBookingModal = () => {
    setBookingError(null);
    setIsBookingModalOpen(true);
  };

  const pathSegment = location.pathname.split('/')[1];
  const pageHeader =
    PAGE_HEADERS[location.pathname] || {
      title: pathSegment ? pathSegment.charAt(0).toUpperCase() + pathSegment.slice(1) : 'Inicio',
      subtitle: '',
    };

  const renderNavItem = (item: NavItem) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    if (item.disabled) {
      return (
        <div
          key={item.path}
          aria-disabled="true"
          className="flex items-center gap-3 px-3 py-2.5 rounded-[11px] opacity-40 cursor-not-allowed"
        >
          <Icon className="w-[18px] h-[18px] text-[#c9bce0]" />
          <span className="text-sm font-semibold text-[#c9bce0] flex-1">{item.label}</span>
          <span className="text-[9px] font-bold uppercase tracking-wide bg-white/10 text-[#c9bce0] px-1.5 py-0.5 rounded">
            Pronto
          </span>
        </div>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setIsSidebarOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-[11px] text-sm font-semibold transition-colors ${
          isActive
            ? 'bg-white/[.13] text-white'
            : 'text-[#c9bce0] hover:bg-white/5 hover:text-white'
        }`}
      >
        <Icon className="w-[18px] h-[18px]" />
        <span>{item.label}</span>
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Decorative glow, non-interactive */}
      <div className="absolute -top-16 -right-20 w-56 h-56 bg-[#ad8ed2]/20 rounded-full blur-[70px] pointer-events-none" />

      <div className="relative flex items-center gap-3 px-5 pt-6 pb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ad8ed2] to-[#7c5ca8] flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-display font-extrabold text-white leading-tight">Valeria</p>
          <p className="text-[10px] text-[#b9a9d6]">Administración</p>
        </div>
      </div>

      <nav className="relative flex-1 px-3 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-[.16em] text-[#8f7db0] mb-2">
            Principal
          </p>
          <div className="space-y-1">{NAV_PRINCIPAL.map(renderNavItem)}</div>
        </div>
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-[.16em] text-[#8f7db0] mb-2">
            Gestión
          </p>
          <div className="space-y-1">{NAV_GESTION.map(renderNavItem)}</div>
        </div>
      </nav>

      <div className="relative p-3 mt-auto">
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-[11px] bg-gradient-to-br from-[#ad8ed2] to-[#7c5ca8] flex items-center justify-center font-bold text-white text-sm overflow-hidden flex-shrink-0">
            {user?.picture ? (
              <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0).toUpperCase() || 'V'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{user?.name || 'Usuario'}</p>
            <p className="text-[10px] text-[#b9a9d6]">Propietaria</p>
          </div>
          <button
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4 text-[#c9bce0]" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#eeebf4]">
      {/* Desktop Sidebar (always visible, fixed) */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-[250px] bg-gradient-to-b from-[#3a2459] via-[#2a1a45] to-[#22133a] z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-[#3a2459] via-[#2a1a45] to-[#22133a] z-50 md:hidden animate-in slide-in-from-left duration-150 flex flex-col">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center z-10"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            {sidebarContent}
          </div>
        </>
      )}

      <div className="md:pl-[250px] flex flex-col min-h-screen">
        {/* Shared Topbar */}
        <header className="sticky top-0 z-30 bg-white/75 backdrop-blur-md border-b border-[#e0d7ef] px-4 md:px-8 py-3 md:py-0 md:h-[72px] flex items-center gap-3 md:gap-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden w-10 h-10 rounded-[11px] bg-white border border-[#e0d7ef] flex items-center justify-center flex-shrink-0"
          >
            <Menu className="w-5 h-5 text-[#5c3a8c]" />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="font-display font-extrabold text-lg md:text-[22px] text-[#121325] truncate">
              {pageHeader.title}
            </h1>
            {pageHeader.subtitle && (
              <p className="hidden md:block text-[12px] text-[#7b6b95]">{pageHeader.subtitle}</p>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 bg-white border border-[#e0d7ef] rounded-[11px] px-4 py-2 w-[240px] flex-shrink-0 focus-within:border-[#ad8ed2] focus-within:ring-2 focus-within:ring-[#7c5ca8]/15 transition-shadow">
            <Search className="w-4 h-4 text-[#9583b3] flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar reserva, cliente..."
              className="bg-transparent border-none outline-none text-sm text-[#121325] placeholder:text-[#9583b3] w-full"
            />
          </div>

          <div className="relative flex-shrink-0">
            <button
              onClick={() => setIsNotifOpen((open) => !open)}
              className="relative w-[42px] h-[42px] rounded-[11px] bg-white border border-[#e0d7ef] hover:bg-[#faf8fd] flex items-center justify-center transition-colors"
            >
              <Bell className="w-5 h-5 text-[#5c3a8c]" />
              {checkoutsToday.length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#f97316]" />
              )}
            </button>

            {isNotifOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsNotifOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-[14px] border border-[#e7dff3] shadow-[0_16px_36px_rgba(92,58,140,.14)] z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#eee5f6]">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#9583b3]">
                      Checkouts de hoy
                    </p>
                  </div>
                  {checkoutsToday.length === 0 ? (
                    <p className="px-4 py-5 text-sm text-[#7b6b95] text-center">Sin checkouts hoy</p>
                  ) : (
                    <div className="max-h-72 overflow-y-auto">
                      {checkoutsToday.map((booking) => (
                        <button
                          key={booking.id}
                          onClick={() => {
                            setIsNotifOpen(false);
                            navigate('/calendar');
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-[#faf8fd] transition-colors border-b border-[#f3eefa] last:border-b-0"
                        >
                          <p className="text-sm font-semibold text-[#121325]">
                            {booking.client_name || 'Cliente'}
                          </p>
                          <p className="text-xs text-[#7b6b95]">{booking.property_name || 'Propiedad'}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <button
            onClick={openBookingModal}
            className="flex items-center gap-2 bg-[#7c5ca8] hover:bg-[#6b4d95] hover:-translate-y-px text-white font-semibold px-4 py-2.5 rounded-[11px] shadow-[0_8px_22px_rgba(92,58,140,.32)] transition-all flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva reserva</span>
          </button>
        </header>

        <main className="flex-1 w-full max-w-[1220px] mx-auto px-4 md:px-[30px] pt-4 md:pt-[26px] pb-28 md:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#25163a] px-6 py-4 rounded-t-3xl shadow-2xl z-30">
        <div className="flex justify-between items-center relative">
          {NAV_PRINCIPAL.slice(0, 2).map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  isActive ? 'text-white' : 'text-[#c9bce0] hover:text-white'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          <div className="w-12"></div>

          <div className="absolute left-1/2 -top-10 -translate-x-1/2">
            <button
              onClick={openBookingModal}
              className="w-16 h-16 bg-[#7c5ca8] rounded-3xl flex items-center justify-center shadow-lg shadow-[#3a2459]/40 hover:scale-105 active:scale-95 transition-all text-white"
            >
              <Plus className="w-8 h-8" />
            </button>
          </div>

          {NAV_PRINCIPAL.slice(2, 4).map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  isActive ? 'text-white' : 'text-[#c9bce0] hover:text-white'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Global Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSave={handleGlobalCreateBooking}
        errorMessage={bookingError}
      />

      {/* Logout Confirmation */}
      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        title="Cerrar sesión"
        message="¿Deseas cerrar sesión?"
        confirmText="Cerrar sesión"
        type="warning"
      />
    </div>
  );
};
