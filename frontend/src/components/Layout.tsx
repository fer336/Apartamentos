import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { Home, Sparkles, Calendar, Building, Users, Plus, LogOut, Menu, X, Settings, Package, DollarSign, FileSpreadsheet, Wrench } from 'lucide-react';
import { Logo } from './Logo';
import { BookingModal } from './BookingModal';
import { createBooking } from '../services/api';
import { jwtDecode } from 'jwt-decode';

export const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  // State para el Modal Global de Reserva
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // State para el Menú de Usuario
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // State para el Sidebar de Navegación
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // State para el usuario logueado
  const [user, setUser] = useState<{ name: string; picture: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUser({
          name: decoded.name || 'Usuario',
          picture: decoded.picture || ''
        });
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);


  const handleGlobalCreateBooking = async (bookingData: any) => {
    try {
      await createBooking(bookingData);
      setIsBookingModalOpen(false);
      // Redirigir al calendario o recargar para ver la nueva reserva
      if (location.pathname === '/calendar') {
        window.location.reload();
      } else {
        navigate('/calendar');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error al crear la reserva');
    }
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Inicio' },
    { path: '/calendar', icon: Calendar, label: 'Calendario' },
    { path: '/properties', icon: Building, label: 'Propiedades' },
    { path: '/clients', icon: Users, label: 'Clientes' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-amber-50 pb-24 md:pb-0">

      {/* --- DESKTOP HEADER (Hidden on Mobile) --- */}
      <header className="hidden md:flex bg-white border-b-2 border-teal-100 sticky top-0 z-40 shadow-sm items-center justify-between px-8 h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="group-hover:scale-110 transition-transform duration-300 drop-shadow-md">
            <Logo className="w-12 h-12" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              Apartamentos Valeria
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Valeria del Mar
            </p>
          </div>
        </Link>

        {/* Breadcrumb */}
        {!isHome && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white/50 px-4 py-1.5 rounded-full border border-teal-100">
            <Link to="/" className="hover:text-teal-600 transition-colors flex items-center gap-1">
              <Home className="w-4 h-4" />
              Inicio
            </Link>
            <span className="text-teal-300">/</span>
            <span className="text-foreground font-medium">
              {location.pathname.split('/')[1].charAt(0).toUpperCase() + location.pathname.split('/')[1].slice(1)}
            </span>
          </div>
        )}

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-teal-700 bg-teal-50 px-4 py-2 rounded-full border border-teal-100">
            {new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
          </div>

          {/* Botón Menu Hamburguesa */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 rounded-xl bg-white border border-teal-100 hover:border-teal-300 hover:bg-teal-50 transition-all shadow-sm hover:shadow-md flex items-center justify-center group"
          >
            <Menu className="w-5 h-5 text-teal-600 group-hover:scale-110 transition-transform" />
          </button>

          <button className="flex items-center gap-3 px-2 pr-4 py-1.5 rounded-xl bg-white border border-teal-100 hover:border-teal-300 transition-all shadow-sm hover:shadow-md group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center font-bold text-white shadow-sm text-sm group-hover:scale-105 transition-transform overflow-hidden">
              {user?.picture ? (
                <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || 'A'
              )}
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-bold text-gray-700 leading-none truncate max-w-[100px]">{user?.name || 'Admin'}</span>
              <span className="text-[10px] text-teal-500 font-medium">Propietario</span>
            </div>
          </button>
        </div>
      </header>

      {/* --- MOBILE HEADER (Visible only on Mobile) --- */}
      <div className="md:hidden flex items-center justify-between px-5 py-4 bg-gradient-to-b from-white to-blue-50/30">
        <Link to="/" className="flex items-center gap-3">
          <div className="drop-shadow-md">
            <Logo className="w-12 h-12" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-lg font-extrabold text-teal-900 leading-tight tracking-tight">
              Apartamentos Valeria
            </h1>
            <p className="text-xs text-teal-600/80 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
              Valeria del Mar
            </p>
          </div>
        </Link>

        {/* Botón Menu Hamburguesa - Mobile */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="w-11 h-11 rounded-xl bg-white border-2 border-teal-200 hover:border-teal-400 hover:bg-teal-50 transition-all shadow-md hover:shadow-lg flex items-center justify-center active:scale-95"
        >
          <Menu className="w-6 h-6 text-teal-600" />
        </button>

        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-md hover:shadow-lg active:scale-95 transition-all text-sm border-2 border-white overflow-hidden"
          >
            {user?.picture ? (
              <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0).toUpperCase() || 'A'
            )}
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/20"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cuenta</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {user?.name || 'Admin'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('¿Deseas cerrar sesión?')) {
                      localStorage.removeItem('token');
                      navigate('/login');
                    }
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 font-medium hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sidebar Flotante - Animación Rápida */}
      {isSidebarOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/30 z-[55] animate-in fade-in duration-150"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed right-0 top-0 h-full w-72 bg-white border-l border-gray-200 shadow-2xl z-[55] animate-in slide-in-from-right duration-150 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">Navegación</h2>
                  <p className="text-[9px] text-gray-500 font-medium">Accesos rápidos</p>
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <nav className="space-y-2">
              {[
                { icon: Calendar, label: 'Calendario', to: '/calendar', gradient: 'from-rose-400 to-pink-500' },
                { icon: Building, label: 'Propiedades', to: '/properties', gradient: 'from-violet-500 to-purple-600' },
                { icon: Users, label: 'Clientes', to: '/clients', gradient: 'from-blue-400 to-cyan-500' },
                { icon: DollarSign, label: 'Contabilidad', to: '/finance', gradient: 'from-emerald-400 to-teal-500' },
                { icon: Wrench, label: 'Gastos y Reparaciones', to: '/expenses', gradient: 'from-orange-400 to-red-500' },
                { icon: FileSpreadsheet, label: 'Importar/Exportar', to: '/import', gradient: 'from-indigo-400 to-blue-500' },
                { icon: Package, label: 'Inventario', to: '/inventory', gradient: 'from-amber-400 to-orange-500' },
                { icon: Settings, label: 'Configuración', to: '/settings', gradient: 'from-gray-500 to-slate-600' }
              ].map((item) => (
                <button
                  key={item.to}
                  onClick={() => {
                    navigate(item.to);
                    setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-150 group"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-150`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-4 md:px-8 py-4 md:py-8">
        <Outlet />
      </main>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black text-gray-400 px-6 py-4 rounded-t-3xl shadow-2xl z-50">
        <div className="flex justify-between items-center relative">

          {navItems.slice(0, 2).map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-white' : 'hover:text-gray-200'}`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Floating Action Button (FAB) Placeholder */}
          <div className="w-12"></div>

          {/* Actual FAB */}
          <div className="absolute left-1/2 -top-10 -translate-x-1/2">
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="w-16 h-16 bg-blue-200 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all text-black"
            >
              <Plus className="w-8 h-8" />
            </button>
          </div>

          {navItems.slice(2, 4).map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-white' : 'hover:text-gray-200'}`}
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
      />

    </div>
  );
};
