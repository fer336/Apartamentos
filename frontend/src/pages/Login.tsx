import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, Heart } from 'lucide-react';
import { Logo } from '../components/Logo';
import { KanagawaBackground } from '../components/layout/KanagawaBackground';
import { useTheme } from '../theme/ThemeProvider';

export const Login = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const notAllowed = searchParams.get('error') === 'not_allowed';

  const [demoUsername, setDemoUsername] = useState('');
  const [demoPassword, setDemoPassword] = useState('');
  const [demoError, setDemoError] = useState<string | null>(null);
  const [isSubmittingDemo, setIsSubmittingDemo] = useState(false);

  const handleLogin = () => {
    // Usa la variable de entorno o ruta relativa en producción
    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
    window.location.href = `${backendUrl}/auth/login/google`;
  };

  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoError(null);
    setIsSubmittingDemo(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const { data } = await axios.post(`${backendUrl}/auth/login`, {
        username: demoUsername,
        password: demoPassword,
      });
      localStorage.setItem('token', data.access_token);
      navigate('/');
    } catch {
      setDemoError('Usuario o contraseña incorrectos');
    } finally {
      setIsSubmittingDemo(false);
    }
  };

  return (
    <div data-theme={theme} className="app-shell min-h-screen relative flex items-center justify-center overflow-y-auto py-3">
      <KanagawaBackground theme={theme} />

      <div className="dashboard-content w-full max-w-md px-4">
        {/* Logo Section */}
        <div className="text-center mb-4">
          <div className="inline-block hover:scale-110 transition-transform duration-500 drop-shadow-lg mb-2">
            <Logo className="w-16 h-16" />
          </div>
          <h1 className="font-display text-3xl font-extrabold text-ink-primary mb-1 tracking-tight">
            Apartamentos
            <span className="text-primary-soft block">Valeria</span>
          </h1>
          <p className="text-ink-secondary font-medium flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow" strokeWidth={1.7} />
            Valeria del Mar
          </p>
        </div>

        {/* Login Card */}
        <div className="kanagawa-card p-6">
          <div className="card-content">
            <div className="text-center mb-4">
              <h2 className="font-display text-2xl font-bold text-ink-primary mb-1 flex items-center justify-center gap-2">
                ¡Bienvenida!
                <Heart className="w-6 h-6 text-cta fill-cta animate-pulse" strokeWidth={1.7} />
              </h2>
              <p className="text-sm text-ink-secondary">Inicia sesión para gestionar tus propiedades</p>
            </div>

            {notAllowed && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-state-red/10 border border-state-red/30 text-sm text-state-red text-center font-medium">
                Tu cuenta de Google no tiene acceso a este sistema.
              </div>
            )}

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

            <div className="mt-5 pt-4 border-t border-border-subtle">
              <p className="text-xs text-center text-ink-muted font-medium mb-3">
                ¿Solo querés probarlo? Entrá con la cuenta demo
              </p>
              <form onSubmit={handleDemoLogin} className="space-y-3">
                <input
                  type="text"
                  value={demoUsername}
                  onChange={(e) => setDemoUsername(e.target.value)}
                  placeholder="Usuario"
                  autoComplete="username"
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle bg-surface text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <input
                  type="password"
                  value={demoPassword}
                  onChange={(e) => setDemoPassword(e.target.value)}
                  placeholder="Contraseña"
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle bg-surface text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                {demoError && (
                  <p className="text-xs text-state-red text-center font-medium">{demoError}</p>
                )}
                <button
                  type="submit"
                  disabled={isSubmittingDemo}
                  className="w-full py-2.5 px-6 rounded-xl border border-border-subtle bg-surface hover:bg-surface-hover text-sm font-semibold text-ink-secondary transition-colors duration-fast ease-kanagawa disabled:opacity-50"
                >
                  {isSubmittingDemo ? 'Entrando...' : 'Entrar a la demo'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-sm text-ink-muted font-medium flex items-center justify-center gap-2">
            © 2025 Apartamentos Valeria
          </p>
        </div>
      </div>
    </div>
  );
};
