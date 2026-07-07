import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Home,
  Calendar,
  Building,
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
import { createBooking } from '../services/api';
import { jwtDecode } from 'jwt-decode';

interface NavItem {
  path: string;
  icon: typeof Home;
  label: string;
  disabled?: boolean;
}

const NAV_PRINCIPAL: NavItem[] = [
  { path: '/', icon: Home, label: 'Inicio' },
  { path: '/calendar', icon: Calendar, label: 'Calendario' },
  { path: '/properties', icon: Building, label: 'Propiedades' },
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
  '/expenses': { title: 'Gastos', subtitle: 'Gastos y reparaciones' },
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
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl opacity-40 cursor-not-allowed"
        >
          <Icon className="w-[18px] h-[18px] text-violet-300" />
          <span className="text-sm font-medium text-violet-200 flex-1">{item.label}</span>
          <span className="text-[9px] font-bold uppercase tracking-wide bg-white/10 text-violet-200 px-1.5 py-0.5 rounded">
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
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
          isActive
            ? 'bg-violet-500/20 text-white font-semibold'
            : 'text-violet-200/80 hover:bg-white/5 hover:text-white'
        }`}
      >
        <Icon className="w-[18px] h-[18px]" />
        <span className="text-sm">{item.label}</span>
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 pt-6 pb-8">
        <div className="w-11 h-11 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
          <Building className="w-6 h-6 text-violet-300" />
        </div>
        <div>
          <p className="text-white font-bold leading-tight">Valeria</p>
          <p className="text-[11px] text-violet-300">Administración</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-violet-400/70 mb-2">
            Principal
          </p>
          <div className="space-y-1">{NAV_PRINCIPAL.map(renderNavItem)}</div>
        </div>
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-violet-400/70 mb-2">
            Gestión
          </p>
          <div className="space-y-1">{NAV_GESTION.map(renderNavItem)}</div>
        </div>
      </nav>

      <div className="p-3">
        <div className="bg-white/5 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center font-bold text-white text-sm overflow-hidden flex-shrink-0">
            {user?.picture ? (
              <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0).toUpperCase() || 'V'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{user?.name || 'Usuario'}</p>
            <p className="text-[10px] text-violet-300">Propietaria</p>
          </div>
          <button
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4 text-violet-300" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar (always visible) */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 bg-[#1E1533] z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-[#1E1533] z-50 md:hidden animate-in slide-in-from-left duration-150 flex flex-col">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            {sidebarContent}
          </div>
        </>
      )}

      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Shared Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 md:px-8 py-3 md:py-0 md:h-20 flex items-center gap-3 md:gap-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">{pageHeader.title}</h1>
            {pageHeader.subtitle && (
              <p className="hidden md:block text-sm text-gray-400">{pageHeader.subtitle}</p>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-4 py-2 w-64 xl:w-80 flex-shrink-0">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar reserva, cliente..."
              className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder:text-gray-400 w-full"
            />
          </div>

          <button className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 flex items-center justify-center flex-shrink-0 transition-colors">
            <Bell className="w-5 h-5 text-gray-500" />
          </button>

          <button
            onClick={openBookingModal}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva reserva</span>
          </button>
        </header>

        <main className="flex-1 max-w-[1800px] w-full mx-auto px-4 md:px-8 py-4 md:py-8 pb-28 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1E1533] px-6 py-4 rounded-t-3xl shadow-2xl z-30">
        <div className="flex justify-between items-center relative">
          {NAV_PRINCIPAL.slice(0, 2).map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  isActive ? 'text-white' : 'text-violet-300 hover:text-white'
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
              className="w-16 h-16 bg-violet-600 rounded-3xl flex items-center justify-center shadow-lg shadow-violet-900/40 hover:scale-105 active:scale-95 transition-all text-white"
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
                  isActive ? 'text-white' : 'text-violet-300 hover:text-white'
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
