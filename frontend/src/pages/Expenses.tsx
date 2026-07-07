import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Wrench,
  Plus,
  Trash2,
  Edit,
  FileText,
  Calendar,
  Building,
  Filter,
  Download,
  Search,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import { getProperties, getExpenses, createExpense, updateExpense, deleteExpense } from '../services/api';
import { ExpenseModal } from '../components/ExpenseModal';
import { ConfirmModal } from '../components/ConfirmModal';

interface Property {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  property_id: string;
  property_name?: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  currency: 'USD' | 'ARS';
  provider: string;
  receipt_url?: string;
  receipt_filename?: string;
  notes?: string;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
}

interface Category {
  value: string;
  label: string;
  icon: string;
  color: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { value: 'plomeria', label: 'Plomería', icon: '🔧', color: 'blue' },
  { value: 'electricidad', label: 'Electricidad', icon: '⚡', color: 'yellow' },
  { value: 'gas', label: 'Gas', icon: '🔥', color: 'orange' },
  { value: 'pintura', label: 'Pintura', icon: '🎨', color: 'purple' },
  { value: 'carpinteria', label: 'Carpintería', icon: '🪚', color: 'amber' },
  { value: 'cerrajeria', label: 'Cerrajería', icon: '🔑', color: 'gray' },
  { value: 'electrodomesticos', label: 'Electrodomésticos', icon: '🔌', color: 'cyan' },
  { value: 'mantenimiento', label: 'Mantenimiento', icon: '🧹', color: 'green' },
  { value: 'impuestos', label: 'Impuestos/Tasas', icon: '📋', color: 'red' },
  { value: 'seguros', label: 'Seguros', icon: '🛡️', color: 'indigo' },
  { value: 'otro', label: 'Otro', icon: '📦', color: 'slate' }
];

// Cargar categorías personalizadas desde localStorage
const loadCustomCategories = (): Category[] => {
  try {
    const saved = localStorage.getItem('expense_custom_categories');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

// Guardar categorías personalizadas en localStorage
const saveCustomCategories = (categories: Category[]) => {
  localStorage.setItem('expense_custom_categories', JSON.stringify(categories));
};

export const Expenses = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; expense: Expense | null }>({
    isOpen: false,
    expense: null,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Categorías (default + personalizadas)
  const [customCategories, setCustomCategories] = useState<Category[]>(loadCustomCategories());
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  // Filtros
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const years = [2024, 2025, 2026];

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const [propertiesData, expensesData] = await Promise.all([
        getProperties(),
        getExpenses({ year: selectedYear })
      ]);

      console.log('Properties loaded:', propertiesData);
      console.log('Expenses loaded:', expensesData);

      if (Array.isArray(propertiesData)) {
        setProperties(propertiesData);
      }
      if (Array.isArray(expensesData)) {
        setExpenses(expensesData);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Error al cargar los datos';
      setErrorMessage(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar gastos
  const filteredExpenses = expenses.filter(expense => {
    const matchesYear = new Date(expense.date).getFullYear() === selectedYear;
    const matchesProperty = selectedProperty === 'all' || expense.property_id === selectedProperty;
    const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
    const matchesSearch = searchTerm === '' ||
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.provider.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesYear && matchesProperty && matchesCategory && matchesSearch;
  });

  // Calcular totales
  const totalARS = filteredExpenses
    .filter(e => e.currency === 'ARS' && e.status !== 'cancelled')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalUSD = filteredExpenses
    .filter(e => e.currency === 'USD' && e.status !== 'cancelled')
    .reduce((sum, e) => sum + e.amount, 0);

  const pendingCount = filteredExpenses.filter(e => e.status === 'pending').length;

  const handleOpenModal = () => {
    // Asegurarse de que las propiedades estén cargadas antes de abrir el modal
    if (properties.length === 0) {
      console.warn('No properties loaded, fetching...');
      fetchData().then(() => {
        setIsModalOpen(true);
      });
    } else {
      setIsModalOpen(true);
    }
  };

  const handleSaveExpense = async (expenseData: any) => {
    try {
      setErrorMessage(null);

      // Crear FormData para enviar archivo
      const formData = new FormData();
      formData.append('property_id', expenseData.property_id);
      formData.append('date', expenseData.date);
      formData.append('category', expenseData.category);
      formData.append('description', expenseData.description);
      formData.append('provider', expenseData.provider);
      formData.append('amount', expenseData.amount.toString());
      formData.append('currency', expenseData.currency);
      formData.append('status', expenseData.status);
      if (expenseData.notes) {
        formData.append('notes', expenseData.notes);
      }
      if (expenseData.receipt_file) {
        formData.append('receipt', expenseData.receipt_file);
      }

      if (editingExpense) {
        await updateExpense(editingExpense.id, formData);
      } else {
        await createExpense(formData);
      }

      setIsModalOpen(false);
      setEditingExpense(undefined);
      await fetchData();
    } catch (error: any) {
      console.error('Error saving expense:', error);
      setErrorMessage(error.response?.data?.detail || 'Error al guardar el gasto');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (expense: Expense) => {
    setDeleteConfirm({ isOpen: true, expense });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.expense) return;
    try {
      await deleteExpense(deleteConfirm.expense.id);
      setExpenses(prev => prev.filter(e => e.id !== deleteConfirm.expense?.id));
      setDeleteConfirm({ isOpen: false, expense: null });
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || 'Error al eliminar el gasto');
    }
  };

  const handleAddCategory = (newCategory: Category) => {
    // Verificar que no exista ya
    if (allCategories.some(c => c.value === newCategory.value)) {
      return;
    }

    const updatedCustomCategories = [...customCategories, newCategory];
    setCustomCategories(updatedCustomCategories);
    saveCustomCategories(updatedCustomCategories);
  };

  const getCategoryInfo = (categoryValue: string) => {
    return allCategories.find(c => c.value === categoryValue) || allCategories[allCategories.length - 1];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-500 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagado';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <span className="text-red-600 font-bold">!</span>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-red-900 mb-1">Error</h4>
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white border-2 border-orange-200 hover:bg-orange-50 flex items-center justify-center transition-all flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-3xl font-bold text-foreground flex items-center gap-2 md:gap-3 truncate">
              <Wrench className="w-5 h-5 md:w-8 md:h-8 text-orange-500 flex-shrink-0" />
              Gastos y Reparaciones
            </h1>
            <p className="text-muted-foreground mt-1 hidden md:block">Control de gastos por propiedad</p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingExpense(undefined);
            handleOpenModal();
          }}
          className="w-9 h-9 md:w-auto md:h-auto md:px-6 md:py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden md:inline">Nuevo Gasto</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border-2 border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase">Total ARS</span>
          </div>
          <p className="text-xl md:text-2xl font-black text-blue-600">${totalARS.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border-2 border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase">Total USD</span>
          </div>
          <p className="text-xl md:text-2xl font-black text-green-600">U$D {totalUSD.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border-2 border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase">Registros</span>
          </div>
          <p className="text-xl md:text-2xl font-black text-gray-800">{filteredExpenses.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border-2 border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase">Pendientes</span>
          </div>
          <p className="text-xl md:text-2xl font-black text-amber-600">{pendingCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border-2 border-border">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-orange-500" />
          <span className="font-bold text-gray-700">Filtros</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Año */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Año</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border-2 border-border bg-gray-50 font-medium focus:border-orange-400 focus:outline-none"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Propiedad */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Propiedad</label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-border bg-gray-50 font-medium focus:border-orange-400 focus:outline-none"
            >
              <option value="all">Todas</option>
              {properties.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.name}</option>
              ))}
            </select>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Categoría</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-border bg-gray-50 font-medium focus:border-orange-400 focus:outline-none"
            >
              <option value="all">Todas</option>
              {allCategories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
              ))}
            </select>
          </div>

          {/* Búsqueda */}
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Descripción o proveedor..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border-2 border-border bg-gray-50 font-medium focus:border-orange-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      {loading ? (
        <div className="text-center p-12 bg-white rounded-2xl border-2 border-border">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando gastos...</p>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border-2 border-border text-center">
          <div className="text-6xl mb-4">🔧</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">No hay gastos registrados</h2>
          <p className="text-muted-foreground mb-6">Registra tu primer gasto o reparación</p>
          <button
            onClick={() => {
              setEditingExpense(undefined);
              handleOpenModal();
            }}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg inline-flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Registrar Primer Gasto
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-border overflow-hidden">
          {/* Table Header - Desktop */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-gray-50 border-b-2 border-border text-xs font-bold text-gray-500 uppercase">
            <div className="col-span-1">Fecha</div>
            <div className="col-span-2">Propiedad</div>
            <div className="col-span-2">Categoría</div>
            <div className="col-span-3">Descripción</div>
            <div className="col-span-2 text-right">Monto</div>
            <div className="col-span-2 text-center">Acciones</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-border">
            {filteredExpenses.map((expense) => {
              const category = getCategoryInfo(expense.category);
              return (
                <div
                  key={expense.id}
                  className="p-4 hover:bg-orange-50/50 transition-colors"
                >
                  {/* Mobile View */}
                  <div className="md:hidden space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{category.icon}</span>
                        <div>
                          <p className="font-bold text-gray-800">{expense.description}</p>
                          <p className="text-xs text-gray-500">{expense.property_name}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(expense.status)}`}>
                        {getStatusText(expense.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(expense.date).toLocaleDateString('es-AR')}
                      </div>
                      <p className={`text-lg font-black ${expense.currency === 'USD' ? 'text-green-600' : 'text-blue-600'}`}>
                        {expense.currency === 'USD' ? 'U$D' : '$'} {expense.amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {expense.receipt_url && (
                        <a
                          href={expense.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-sm">Factura</span>
                        </a>
                      )}
                      <button
                        onClick={() => handleEditExpense(expense)}
                        className="flex-1 px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="text-sm">Editar</span>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(expense)}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-medium transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 text-sm text-gray-600">
                      {new Date(expense.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-800 truncate">{expense.property_name}</span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{category.icon}</span>
                        <span className="text-sm font-medium text-gray-600">{category.label}</span>
                      </div>
                    </div>
                    <div className="col-span-3">
                      <p className="font-medium text-gray-800 truncate">{expense.description}</p>
                      <p className="text-xs text-gray-500">{expense.provider}</p>
                    </div>
                    <div className="col-span-2 text-right">
                      <p className={`text-lg font-black ${expense.currency === 'USD' ? 'text-green-600' : 'text-blue-600'}`}>
                        {expense.currency === 'USD' ? 'U$D' : '$'} {expense.amount.toLocaleString()}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(expense.status)}`}>
                        {getStatusText(expense.status)}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center justify-center gap-2">
                      {expense.receipt_url && (
                        <a
                          href={expense.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                          title="Ver factura"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleEditExpense(expense)}
                        className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(expense)}
                        className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(undefined);
        }}
        onSave={handleSaveExpense}
        onAddCategory={handleAddCategory}
        expense={editingExpense}
        properties={properties}
        categories={allCategories}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, expense: null })}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar Gasto?"
        message={`¿Estás seguro que deseas eliminar "${deleteConfirm.expense?.description}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};
