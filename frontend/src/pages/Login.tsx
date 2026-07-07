import { Sparkles, Heart } from 'lucide-react';
import { Logo } from '../components/Logo';

export const Login = () => {
  const handleLogin = () => {
    // Usa la variable de entorno o ruta relativa en producción
    const backendUrl = import.meta.env.VITE_BACKEND_URL || ''; 
    window.location.href = `${backendUrl}/auth/login/google`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-amber-50 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-teal-200 rounded-full blur-3xl opacity-40"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-40"></div>
      <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-amber-200 rounded-full blur-3xl opacity-40"></div>

      <div className="w-full max-w-md relative z-10 px-4">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-block hover:scale-110 transition-transform duration-500 drop-shadow-lg mb-4">
            <Logo className="w-24 h-24" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">
            Apartamentos
            <span className="text-teal-600 block">Valeria</span>
          </h1>
          <p className="text-gray-500 font-medium flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Valeria del Mar
          </p>
        </div>
        
        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white shadow-xl shadow-teal-900/5">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
              ¡Bienvenida! 
              <Heart className="w-6 h-6 text-rose-500 fill-rose-500 animate-pulse" />
            </h2>
            <p className="text-sm text-gray-500">Inicia sesión para gestionar tus propiedades</p>
          </div>
          
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            <img 
              src="https://www.google.com/favicon.ico" 
              alt="Google" 
              className="w-6 h-6 bg-white rounded-full p-0.5"
            />
            Continuar con Google
          </button>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-center text-gray-400 font-medium">
              Acceso exclusivo para administradores
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-400 font-medium flex items-center justify-center gap-2">
            © 2025 Apartamentos Valeria
          </p>
        </div>
      </div>
    </div>
  );
};
