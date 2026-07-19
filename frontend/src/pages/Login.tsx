import { Sparkles, Heart } from 'lucide-react';
import { Logo } from '../components/Logo';
import { KanagawaBackground } from '../components/layout/KanagawaBackground';
import { useTheme } from '../theme/ThemeProvider';

export const Login = () => {
  const { theme } = useTheme();

  const handleLogin = () => {
    // Usa la variable de entorno o ruta relativa en producción
    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
    window.location.href = `${backendUrl}/auth/login/google`;
  };

  return (
    <div data-theme={theme} className="app-shell min-h-screen relative flex items-center justify-center overflow-hidden">
      <KanagawaBackground theme={theme} />

      <div className="dashboard-content w-full max-w-md px-4">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-block hover:scale-110 transition-transform duration-500 drop-shadow-lg mb-4">
            <Logo className="w-24 h-24" />
          </div>
          <h1 className="font-display text-4xl font-extrabold text-ink-primary mb-2 tracking-tight">
            Apartamentos
            <span className="text-primary-soft block">Valeria</span>
          </h1>
          <p className="text-ink-secondary font-medium flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow" strokeWidth={1.7} />
            Valeria del Mar
          </p>
        </div>

        {/* Login Card */}
        <div className="kanagawa-card p-8">
          <div className="card-content">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-bold text-ink-primary mb-2 flex items-center justify-center gap-2">
                ¡Bienvenida!
                <Heart className="w-6 h-6 text-cta fill-cta animate-pulse" strokeWidth={1.7} />
              </h2>
              <p className="text-sm text-ink-secondary">Inicia sesión para gestionar tus propiedades</p>
            </div>

            <button
              onClick={handleLogin}
              className="button-primary w-full flex items-center justify-center gap-3 font-bold py-4 px-6 hover:-translate-y-px transition-all duration-fast ease-kanagawa"
            >
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google"
                className="w-6 h-6 bg-white rounded-full p-0.5"
              />
              Continuar con Google
            </button>

            <div className="mt-8 pt-6 border-t border-border-subtle">
              <p className="text-xs text-center text-ink-muted font-medium">
                Acceso exclusivo para administradores
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-ink-muted font-medium flex items-center justify-center gap-2">
            © 2025 Apartamentos Valeria
          </p>
        </div>
      </div>
    </div>
  );
};
