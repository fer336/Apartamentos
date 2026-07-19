import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Calendar } from './pages/Calendar';
import { Properties } from './pages/Properties';
import { Clients } from './pages/Clients';
import { Finance } from './pages/Finance';
import { Expenses } from './pages/Expenses';
import { Import } from './pages/Import';
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import './index.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // const token = localStorage.getItem('token');
  // Temporalmente permitir acceso sin token para debug visual
  // if (!token) {
  //   return <Navigate to="/login" replace />;
  // }
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/login/callback" element={<AuthCallback />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="properties" element={<Properties />} />
          <Route path="clients" element={<Clients />} />
          <Route path="finance" element={<Finance />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="import" element={<Import />} />
          <Route path="inventory" element={<div className="kanagawa-card card-content text-center p-12"><div className="text-6xl mb-4">📦</div><h2 className="font-display text-2xl font-bold text-ink-primary">Inventario</h2><p className="text-muted-foreground mt-2">Esta sección está en desarrollo</p></div>} />
          <Route path="settings" element={<div className="kanagawa-card card-content text-center p-12"><div className="text-6xl mb-4">⚙️</div><h2 className="font-display text-2xl font-bold text-ink-primary">Configuración</h2><p className="text-muted-foreground mt-2">Esta sección está en desarrollo</p></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
