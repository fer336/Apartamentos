import { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Edit,
  Calendar,
  Building,
  Filter,
  Download,
  Search
} from 'lucide-react';
import { getProperties, getExpenses, createExpense, updateExpense, deleteExpense } from '../services/api';
import { ExpenseModal } from '../components/ExpenseModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { Pagination } from '../components/Pagination';
import { Button } from '../components/ui/Button';
import { Badge, type BadgeTone } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { KanagawaCard } from '../components/ui/KanagawaCard';
import { kanagawaAssets } from '../theme/kanagawa-assets';

const PAGE_SIZE = 10;

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

// Kanagawa token equivalents for each category color name, referenced as CSS
// custom properties (inline `var(--x)` strings) instead of hex literals.
// Used as inline styles instead of dynamic `bg-${color}-500` classes, since
// custom categories are created at runtime (localStorage) and Tailwind's
// JIT purge can't discover class names that don't appear literally in source.
const COLOR_TOKENS: Record<string, string> = {
  blue: 'var(--blue)',
  yellow: 'var(--yellow)',
  orange: 'var(--orange)',
  purple: 'var(--primary)',
  amber: 'var(--orange)',
  gray: 'var(--text-muted)',
  cyan: 'var(--cyan)',
  green: 'var(--green)',
  red: 'var(--red)',
  indigo: 'var(--primary-soft)',
  slate: 'var(--border-strong)',
};

const colorToken = (color: string) => COLOR_TOKENS[color] || 'var(--primary)';

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
  const [expensesPage, setExpensesPage] = useState(1);

  useEffect(() => {
    setExpensesPage(1);
  }, [selectedYear, selectedProperty, selectedCategory, searchTerm]);

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

  const nonCancelled = filteredExpenses.filter(e => e.status !== 'cancelled');

  const expensesTotalPages = Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE));
  const paginatedExpenses = filteredExpenses.slice(
    (expensesPage - 1) * PAGE_SIZE,
    expensesPage * PAGE_SIZE
  );

  // Calcular totales
  const totalARS = nonCancelled
    .filter(e => e.currency === 'ARS')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalUSD = nonCancelled
    .filter(e => e.currency === 'USD')
    .reduce((sum, e) => sum + e.amount, 0);

  // "Por categoría": breakdown por moneda dominante (real, no inventado).
  // Si hay gasto en ambas monedas se muestran ambos desgloses; si solo hay
  // una, se omite la otra en vez de mezclar montos de distinta moneda.
  const buildBreakdown = (currency: 'ARS' | 'USD', total: number) => {
    if (total <= 0) return [];
    const byCategory = new Map<string, number>();
    nonCancelled
      .filter(e => e.currency === currency)
      .forEach(e => byCategory.set(e.category, (byCategory.get(e.category) || 0) + e.amount));

    return Array.from(byCategory.entries())
      .map(([value, amount]) => ({
        category: allCategories.find(c => c.value === value) || allCategories[allCategories.length - 1],
        amount,
        percent: (amount / total) * 100,
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const breakdownARS = buildBreakdown('ARS', totalARS);
  const breakdownUSD = buildBreakdown('USD', totalUSD);

  const handleOpenModal = () => {
    if (properties.length === 0) {
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

  const getStatusTone = (status: string): BadgeTone => {
    switch (status) {
      case 'paid':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'cancelled':
        return 'neutral';
      default:
        return 'neutral';
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

  const CategoryBreakdownBlock = ({ label, total, rows }: { label: string; total: number; rows: ReturnType<typeof buildBreakdown> }) => {
    if (rows.length === 0) return null;
    return (
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">{label}</span>
          <span className="font-display font-black text-lg text-state-red">
            {label === 'USD' ? 'U$D ' : '$'}{total.toLocaleString()}
          </span>
        </div>
        <div className="space-y-2.5">
          {rows.map(({ category, amount, percent }) => (
            <div key={category.value}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0"
                    style={{ backgroundColor: colorToken(category.color) }}
                  />
                  <span className="text-sm font-medium text-ink-primary truncate">{category.label}</span>
                </div>
                <div className="flex items-baseline gap-1.5 flex-shrink-0 ml-2">
                  <span className="font-display font-bold text-sm text-ink-primary">
                    {label === 'USD' ? 'U$D ' : '$'}{amount.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-ink-muted">
                    {percent.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${percent}%`, backgroundColor: colorToken(category.color) }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {errorMessage && (
        <div className="bg-state-red/10 border-2 border-state-red/30 rounded-xl p-4 flex items-start gap-3 animate-in fade-in">
          <div className="w-8 h-8 rounded-lg bg-state-red/15 flex items-center justify-center flex-shrink-0">
            <span className="text-state-red font-bold">!</span>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-ink-primary mb-1">Error</h4>
            <p className="text-sm text-state-red">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-state-red/60 hover:text-state-red transition-colors duration-fast ease-kanagawa">
            ✕
          </button>
        </div>
      )}

      {/* Filters */}
      <KanagawaCard>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-primary" strokeWidth={1.7} />
          <span className="font-semibold text-sm text-ink-primary">Filtros</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-ink-muted uppercase mb-1">Año</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="form-control w-full px-3 py-2 text-sm font-medium"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-ink-muted uppercase mb-1">Propiedad</label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="form-control w-full px-3 py-2 text-sm font-medium"
            >
              <option value="all">Todas</option>
              {properties.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-ink-muted uppercase mb-1">Categoría</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-control w-full px-3 py-2 text-sm font-medium"
            >
              <option value="all">Todas</option>
              {allCategories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-[11px] font-bold text-ink-muted uppercase mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-ink-muted" strokeWidth={1.7} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Descripción o proveedor..."
                className="form-control w-full pl-9 pr-4 py-2 text-sm font-medium"
              />
            </div>
          </div>
        </div>
      </KanagawaCard>

      {/* Content: Egresos + Por categoría */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
        {/* Left: Egresos table */}
        <KanagawaCard padded={false}>
          <div className="flex items-center justify-between p-5 border-b border-border-subtle">
            <div>
              <h2 className="font-display font-extrabold text-lg text-ink-primary">Egresos {selectedYear}</h2>
              <p className="text-xs text-ink-muted">{filteredExpenses.length} registro{filteredExpenses.length === 1 ? '' : 's'}</p>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setEditingExpense(undefined);
                handleOpenModal();
              }}
            >
              <Plus className="w-4 h-4" strokeWidth={1.7} />
              <span className="hidden sm:inline">Registrar gasto</span>
            </Button>
          </div>

          {loading ? (
            <div className="text-center p-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-sm text-ink-muted">Cargando gastos...</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <EmptyState
              icon={<kanagawaAssets.cards.expenseFuji className="w-16 h-16" />}
              title="No hay gastos registrados"
              description="Registrá tu primer gasto o reparación"
              action={
                <Button
                  variant="primary"
                  onClick={() => {
                    setEditingExpense(undefined);
                    handleOpenModal();
                  }}
                >
                  <Plus className="w-4 h-4" strokeWidth={1.7} />
                  Registrar primer gasto
                </Button>
              }
            />
          ) : (
            <>
              {/* Table Header - Desktop */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-5 py-3 bg-background-alt border-b border-border-subtle table-head-cell">
                <div className="col-span-1">Fecha</div>
                <div className="col-span-2">Categoría</div>
                <div className="col-span-3">Descripción</div>
                <div className="col-span-2">Propiedad</div>
                <div className="col-span-2 text-right">Monto</div>
                <div className="col-span-2 text-center">Acciones</div>
              </div>

              <div className="divide-y divide-border-subtle">
                {paginatedExpenses.map((expense) => {
                  const category = getCategoryInfo(expense.category);
                  return (
                    <div key={expense.id} className="p-4 md:px-5 hover:bg-surface-hover transition-colors duration-fast ease-kanagawa">
                      {/* Mobile */}
                      <div className="md:hidden space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0"
                              style={{ backgroundColor: colorToken(category.color) }}
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-ink-primary truncate">{expense.description}</p>
                              <p className="text-xs text-ink-muted truncate">{expense.property_name}</p>
                            </div>
                          </div>
                          <Badge tone={getStatusTone(expense.status)} className="flex-shrink-0">
                            {getStatusText(expense.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-ink-muted">
                            <Calendar className="w-3.5 h-3.5" strokeWidth={1.7} />
                            {new Date(expense.date).toLocaleDateString('es-AR')}
                          </div>
                          <p className="font-display font-bold text-base text-state-red">
                            {expense.currency === 'USD' ? 'U$D' : '$'} {expense.amount.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {expense.receipt_url && (
                            <a
                              href={expense.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 px-3 py-2 bg-surface-elevated hover:bg-surface-hover text-ink-secondary rounded-md font-medium transition-colors duration-fast ease-kanagawa flex items-center justify-center gap-1.5 text-sm"
                            >
                              <Download className="w-4 h-4" strokeWidth={1.7} />
                              Factura
                            </a>
                          )}
                          <button
                            onClick={() => handleEditExpense(expense)}
                            className="flex-1 px-3 py-2 bg-surface-elevated hover:bg-surface-hover text-ink-secondary rounded-md font-medium transition-colors duration-fast ease-kanagawa flex items-center justify-center gap-1.5 text-sm"
                          >
                            <Edit className="w-4 h-4" strokeWidth={1.7} />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteClick(expense)}
                            className="px-3 py-2 bg-state-red/10 hover:bg-state-red/20 text-state-red rounded-md font-medium transition-colors duration-fast ease-kanagawa"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={1.7} />
                          </button>
                        </div>
                      </div>

                      {/* Desktop */}
                      <div className="hidden md:grid md:grid-cols-12 gap-4 items-center">
                        <div className="col-span-1 text-sm text-ink-secondary font-mono">
                          {new Date(expense.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0"
                              style={{ backgroundColor: colorToken(category.color) }}
                            />
                            <span className="text-sm font-medium text-ink-primary truncate">{category.label}</span>
                          </div>
                        </div>
                        <div className="col-span-3 min-w-0">
                          <p className="font-medium text-ink-primary truncate">{expense.description}</p>
                          <p className="text-xs text-ink-muted truncate">{expense.provider}</p>
                        </div>
                        <div className="col-span-2 flex items-center gap-2 min-w-0">
                          <Building className="w-4 h-4 text-ink-muted flex-shrink-0" strokeWidth={1.7} />
                          <span className="text-sm text-ink-secondary truncate">{expense.property_name}</span>
                        </div>
                        <div className="col-span-2 text-right">
                          <p className="font-display font-bold text-base text-state-red">
                            {expense.currency === 'USD' ? 'U$D' : '$'} {expense.amount.toLocaleString()}
                          </p>
                          <Badge tone={getStatusTone(expense.status)}>
                            {getStatusText(expense.status)}
                          </Badge>
                        </div>
                        <div className="col-span-2 flex items-center justify-center gap-1.5">
                          {expense.receipt_url && (
                            <a
                              href={expense.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 flex items-center justify-center bg-surface-elevated hover:bg-surface-hover text-ink-secondary rounded-md transition-colors duration-fast ease-kanagawa"
                              title="Ver factura"
                            >
                              <Download className="w-4 h-4" strokeWidth={1.7} />
                            </a>
                          )}
                          <button
                            onClick={() => handleEditExpense(expense)}
                            className="w-8 h-8 flex items-center justify-center bg-surface-elevated hover:bg-surface-hover text-ink-secondary rounded-md transition-colors duration-fast ease-kanagawa"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" strokeWidth={1.7} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(expense)}
                            className="w-8 h-8 flex items-center justify-center bg-state-red/10 hover:bg-state-red/20 text-state-red rounded-md transition-colors duration-fast ease-kanagawa"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={1.7} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Pagination
                currentPage={expensesPage}
                totalPages={expensesTotalPages}
                onPageChange={setExpensesPage}
              />
            </>
          )}
        </KanagawaCard>

        {/* Right: Por categoría */}
        <KanagawaCard tone="violet" className="space-y-5">
          <h2 className="font-display font-extrabold text-lg text-ink-primary">Por categoría</h2>
          {breakdownARS.length === 0 && breakdownUSD.length === 0 ? (
            <p className="text-sm text-ink-muted">Sin gastos registrados en {selectedYear}.</p>
          ) : (
            <>
              <CategoryBreakdownBlock label="Pesos" total={totalARS} rows={breakdownARS} />
              <CategoryBreakdownBlock label="USD" total={totalUSD} rows={breakdownUSD} />
            </>
          )}
        </KanagawaCard>
      </div>

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
