import axios from 'axios';

// En producción usa rutas relativas (Traefik maneja el routing)
// En desarrollo usa localhost:8000
const API_URL = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      
      // Solo redirigir si no estamos ya en /login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Dashboard
export const getDashboardStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

export const getAccountingStats = async (month?: number, year1?: number, year2?: number) => {
  const params = month && year1 && year2 ? { month, year1, year2 } : {};
  const response = await api.get('/accounting/stats', { params });
  return response.data;
};

// Bookings
export const getBookings = async (status?: string) => {
  const params = status ? { status } : {};
  const response = await api.get('/bookings', { params });
  return response.data;
};

export const createBooking = async (bookingData: any) => {
  const response = await api.post('/bookings', bookingData);
  return response.data;
};

export const updateBooking = async (id: string, bookingData: any) => {
  const response = await api.put(`/bookings/${id}`, bookingData);
  return response.data;
};

export const deleteBooking = async (id: string) => {
  const response = await api.delete(`/bookings/${id}`);
  return response.data;
};

// Properties
export const getProperties = async () => {
  const response = await api.get('/properties');
  return response.data;
};

export const createProperty = async (propertyData: any) => {
  const response = await api.post('/properties', propertyData);
  return response.data;
};

export const updateProperty = async (id: string, propertyData: any) => {
  const response = await api.put(`/properties/${id}`, propertyData);
  return response.data;
};

export const deleteProperty = async (id: string) => {
  const response = await api.delete(`/properties/${id}`);
  return response.data;
};

// Clients
export const getClients = async () => {
  const response = await api.get('/clients');
  return response.data;
};

export const createClient = async (clientData: any) => {
  const response = await api.post('/clients', clientData);
  return response.data;
};

export const updateClient = async (id: string, clientData: any) => {
  const response = await api.put(`/clients/${id}`, clientData);
  return response.data;
};

export const deleteClient = async (id: string) => {
  const response = await api.delete(`/clients/${id}`);
  return response.data;
};

// --- DIRECTV ---
export const getDirectvDevices = async (propertyId: string) => {
  const response = await api.get(`/properties/${propertyId}/directv`);
  return response.data;
};

export const createDirectvDevice = async (propertyId: string, data: any) => {
  const response = await api.post(`/properties/${propertyId}/directv`, data);
  return response.data;
};

export const rechargeDirectvDevice = async (deviceId: string, data: any) => {
  const response = await api.post(`/directv/${deviceId}/recharge`, data);
  return response.data;
};

export const deleteDirectvDevice = async (deviceId: string) => {
  const response = await api.delete(`/directv/${deviceId}`);
  return response.data;
};

// --- TASKS ---
export const getTasks = async () => {
  const response = await api.get('/tasks');
  return response.data;
};

export const createTask = async (taskData: any) => {
  const response = await api.post('/tasks', taskData);
  return response.data;
};

export const updateTask = async (id: string, taskData: any) => {
  const response = await api.put(`/tasks/${id}`, taskData);
  return response.data;
};

export const deleteTask = async (id: string) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

// --- EXPENSES (Gastos y Reparaciones) ---
export const getExpenses = async (params?: { year?: number; property_id?: string; category?: string }) => {
  const response = await api.get('/expenses', { params });
  return response.data;
};

export const createExpense = async (expenseData: FormData) => {
  const response = await api.post('/expenses', expenseData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateExpense = async (id: string, expenseData: FormData) => {
  const response = await api.put(`/expenses/${id}`, expenseData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteExpense = async (id: string) => {
  const response = await api.delete(`/expenses/${id}`);
  return response.data;
};
