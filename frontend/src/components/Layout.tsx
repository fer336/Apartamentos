import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Home,
  Calendar,
  Building2,
  Users,
  Plus,
  LogOut,
  X,
  Settings,
  Package,
  DollarSign,
  FileSpreadsheet,
  Wrench,
  Bell,
  MoreHorizontal,
} from 'lucide-react';
import { BookingModal } from './BookingModal';
import { ConfirmModal } from './ConfirmModal';
import { createBooking, getBookings } from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { KanagawaBackground } from './layout/KanagawaBackground';
import { ThemeToggle } from './ui/ThemeToggle';
import { useTheme } from '../theme/ThemeProvider';

const ToriiIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M2 7L4 4h16l2 3" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.5 9h17" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" />
    <path d="M6.5 9v11M17.5 9v11" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" />
    <path d="M12 9v2" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" />
  </svg>
);

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

const NAV_ALL: NavItem[] = [...NAV_PRINCIPAL, ...NAV_GESTION];

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
  const { theme } = useTheme();

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
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

  /** Horizontal pill nav item, used in the desktop header bar. */
  const renderHeaderNavItem = (item: NavItem) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    if (item.disabled) {
      return (
        <div
          key={item.path}
          aria-disabled="true"
          className="header-nav-link opacity-40 cursor-not-allowed"
        >
          <Icon className="w-3.5 h-3.5" strokeWidth={1.7} />
          <span>{item.label}</span>
        </div>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`header-nav-link ${isActive ? 'header-nav-link-active' : ''}`}
      >
        <Icon className="w-3.5 h-3.5" strokeWidth={1.7} />
        <span>{item.label}</span>
      </Link>
    );
  };

  /** Vertical nav item, used in the mobile slide-in menu. */
  const renderMobileNavItem = (item: NavItem) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    if (item.disabled) {
      return (
        <div
          key={item.path}
          aria-disabled="true"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md opacity-40 cursor-not-allowed"
        >
          <Icon className="w-[18px] h-[18px] text-ink-violet" strokeWidth={1.7} />
          <span className="text-sm font-semibold text-ink-violet flex-1">{item.label}</span>
          <span className="text-[9px] font-bold uppercase tracking-wide bg-white/10 text-ink-violet px-1.5 py-0.5 rounded">
            Pronto
          </span>
        </div>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-colors duration-fast ease-kanagawa ${
          isActive
            ? 'sidebar-link-active'
            : 'text-ink-violet hover:bg-white/5 hover:text-ink-primary'
        }`}
      >
        <Icon className="w-[18px] h-[18px]" strokeWidth={1.7} />
        <span>{item.label}</span>
      </Link>
    );
  };

  const mobileMenuContent = (
    <div className="flex flex-col flex-1 min-h-0 relative overflow-hidden">
      {/* Decorative glow, non-interactive */}
      <div className="absolute -top-16 -right-20 w-56 h-56 bg-primary/20 rounded-full blur-[70px] pointer-events-none" aria-hidden="true" />

      <div className="relative flex items-center gap-3 px-5 pt-6 pb-8">
        <div className="w-10 h-10 rounded-md bg-gradient-to-br from-cta-hover to-cta flex items-center justify-center flex-shrink-0">
          <ToriiIcon className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <p className="font-display font-bold text-lg text-ink-primary leading-tight">Valeria</p>
          <p className="text-[10px] text-ink-violet">Gestión inmobiliaria</p>
        </div>
      </div>

      <nav className="relative flex-1 px-3 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-[.16em] text-ink-violet/80 mb-2">
            Principal
          </p>
          <div className="space-y-1">{NAV_PRINCIPAL.map(renderMobileNavItem)}</div>
        </div>
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-[.16em] text-ink-violet/80 mb-2">
            Gestión
          </p>
          <div className="space-y-1">{NAV_GESTION.map(renderMobileNavItem)}</div>
        </div>
      </nav>

      <div className="relative p-3 mt-auto">
        <div className="bg-white/5 border border-white/10 rounded-md p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-gradient-to-br from-primary-soft to-primary flex items-center justify-center font-bold text-primary-foreground text-sm overflow-hidden flex-shrink-0">
            {user?.picture ? (
              <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0).toUpperCase() || 'V'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-ink-primary truncate">{user?.name || 'Usuario'}</p>
            <p className="text-[10px] text-ink-violet">Propietaria</p>
          </div>
          <button
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="w-8 h-8 rounded-md hover:bg-white/10 flex items-center justify-center transition-colors duration-fast ease-kanagawa flex-shrink-0"
          >
            <LogOut className="w-4 h-4 text-ink-violet" strokeWidth={1.7} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div data-theme={theme} className="app-shell min-h-screen relative">
      <KanagawaBackground theme={theme} />

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="kanagawa-sidebar fixed inset-x-0 bottom-0 z-50 lg:hidden animate-in slide-in-from-bottom duration-200 flex flex-col max-h-[75vh] rounded-t-2xl border-t border-border-subtle shadow-2xl overflow-hidden">
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0" aria-hidden="true">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-md bg-white/10 flex items-center justify-center z-10"
            >
              <X className="w-4 h-4 text-ink-primary" strokeWidth={1.7} />
            </button>
            {mobileMenuContent}
          </div>
        </>
      )}

      <div className="flex flex-col min-h-screen dashboard-content">
        {/* Shared header — logo, horizontal nav, search and actions */}
        <header className="kanagawa-topbar sticky top-0 z-30 px-4 md:px-6 py-3 lg:py-0 lg:h-[72px] flex items-center gap-2 md:gap-3">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-cta-hover to-cta flex items-center justify-center flex-shrink-0">
              <ToriiIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="hidden sm:inline font-display font-bold text-lg text-ink-primary">Valeria</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto flex-1 min-w-0">
            {NAV_ALL.map(renderHeaderNavItem)}
          </nav>

          {/* Mobile/tablet page title — the active pill communicates this on desktop */}
          <div className="flex-1 min-w-0 lg:hidden">
            <h1 className="font-display font-semibold text-lg text-ink-primary truncate">
              {pageHeader.title}
            </h1>
          </div>

          <ThemeToggle />

          <div className="relative flex-shrink-0">
            <button
              onClick={() => setIsNotifOpen((open) => !open)}
              className="relative w-9 h-9 rounded-md bg-surface border border-border-subtle hover:bg-surface-hover flex items-center justify-center transition-colors duration-fast ease-kanagawa flex-shrink-0"
            >
              <Bell className="w-5 h-5 text-primary" strokeWidth={1.7} />
              {checkoutsToday.length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-state-orange" />
              )}
            </button>

            {isNotifOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsNotifOpen(false)}
                />
                <div className="kanagawa-card absolute right-0 top-full mt-2 w-72 z-50 overflow-hidden p-0">
                  <div className="px-4 py-3 border-b border-border-subtle">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">
                      Checkouts de hoy
                    </p>
                  </div>
                  {checkoutsToday.length === 0 ? (
                    <p className="px-4 py-5 text-sm text-ink-secondary text-center">Sin checkouts hoy</p>
                  ) : (
                    <div className="max-h-72 overflow-y-auto">
                      {checkoutsToday.map((booking) => (
                        <button
                          key={booking.id}
                          onClick={() => {
                            setIsNotifOpen(false);
                            navigate('/calendar');
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors duration-fast ease-kanagawa border-b border-border-subtle last:border-b-0"
                        >
                          <p className="text-sm font-semibold text-ink-primary">
                            {booking.client_name || 'Cliente'}
                          </p>
                          <p className="text-xs text-ink-secondary">{booking.property_name || 'Propiedad'}</p>
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
            className="button-primary flex items-center gap-1.5 font-semibold px-3 py-2 text-sm flex-shrink-0 hover:-translate-y-px transition-all duration-fast ease-kanagawa"
          >
            <Plus className="w-4 h-4" strokeWidth={1.7} />
            <span className="hidden sm:inline">Nueva reserva</span>
          </button>

          <button
            onClick={() => setIsLogoutConfirmOpen(true)}
            title={user?.name || 'Usuario'}
            className="hidden lg:flex w-9 h-9 rounded-full bg-gradient-to-br from-primary-soft to-primary items-center justify-center font-bold text-primary-foreground text-sm overflow-hidden flex-shrink-0"
          >
            {user?.picture ? (
              <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0).toUpperCase() || 'V'
            )}
          </button>
        </header>

        <main className="flex-1 w-full max-w-[1220px] mx-auto px-4 md:px-[30px] pt-4 md:pt-[26px] pb-28 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="kanagawa-sidebar lg:hidden fixed bottom-0 left-0 right-0 px-4 py-4 rounded-t-xl shadow-2xl z-30">
        <div className="flex justify-between items-center relative">
          {NAV_PRINCIPAL.slice(0, 2).map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 transition-colors duration-fast ease-kanagawa ${
                  isActive ? 'text-ink-primary' : 'text-ink-violet hover:text-ink-primary'
                }`}
              >
                <Icon className="w-6 h-6" strokeWidth={1.7} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          <div className="w-10"></div>

          <div className="absolute left-1/2 -top-7 -translate-x-1/2">
            <button
              onClick={openBookingModal}
              className="button-primary w-12 h-12 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-fast ease-kanagawa"
            >
              <Plus className="w-6 h-6" strokeWidth={1.7} />
            </button>
          </div>

          {NAV_PRINCIPAL.slice(2, 3).map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 transition-colors duration-fast ease-kanagawa ${
                  isActive ? 'text-ink-primary' : 'text-ink-violet hover:text-ink-primary'
                }`}
              >
                <Icon className="w-6 h-6" strokeWidth={1.7} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className={`flex flex-col items-center gap-1 transition-colors duration-fast ease-kanagawa ${
              [...NAV_GESTION, NAV_PRINCIPAL[3]].some((item) => location.pathname === item.path)
                ? 'text-ink-primary'
                : 'text-ink-violet hover:text-ink-primary'
            }`}
          >
            <MoreHorizontal className="w-6 h-6" strokeWidth={1.7} />
            <span className="text-[10px] font-medium">Más</span>
          </button>
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
