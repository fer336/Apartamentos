import React, { useState, useEffect, useRef } from 'react';
import { X, Wrench, Upload, FileText, Trash2, AlertCircle, Plus, Check } from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from './ui/Button';

interface Property {
  id: string;
  name: string;
}

interface Category {
  value: string;
  label: string;
  icon: string;
  color: string;
}

interface Expense {
  id?: string;
  property_id: string;
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
}

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: any) => void;
  onAddCategory?: (category: Category) => void;
  expense?: Expense;
  properties: Property[];
  categories: Category[];
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

// Iconos disponibles para categorías personalizadas
const AVAILABLE_ICONS = [
  { icon: '🧺', label: 'Blanquería' },
  { icon: '🧹', label: 'Limpieza' },
  { icon: '🛠️', label: 'Herramientas' },
  { icon: '🪟', label: 'Vidrios' },
  { icon: '🚿', label: 'Baño' },
  { icon: '🍳', label: 'Cocina' },
  { icon: '🛋️', label: 'Muebles' },
  { icon: '🌿', label: 'Jardín' },
  { icon: '🚗', label: 'Estacionamiento' },
  { icon: '📱', label: 'Tecnología' },
  { icon: '🔒', label: 'Seguridad' },
  { icon: '💡', label: 'Iluminación' },
  { icon: '❄️', label: 'Refrigeración' },
  { icon: '🔥', label: 'Calefacción' },
  { icon: '🏠', label: 'General' },
  { icon: '📦', label: 'Otro' },
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onAddCategory,
  expense,
  properties,
  categories
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para nueva categoría
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📦');

  const [formData, setFormData] = useState<Expense>({
    property_id: '',
    date: new Date().toISOString().split('T')[0],
    category: 'mantenimiento',
    description: '',
    amount: 0,
    currency: 'ARS',
    provider: '',
    notes: '',
    status: 'pending'
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (expense) {
      setFormData({
        property_id: expense.property_id,
        date: expense.date,
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        currency: expense.currency,
        provider: expense.provider,
        notes: expense.notes || '',
        status: expense.status
      });
      if (expense.receipt_url) {
        setReceiptPreview(expense.receipt_filename || 'Factura adjunta');
      }
    } else {
      setFormData({
        property_id: properties[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        category: 'mantenimiento',
        description: '',
        amount: 0,
        currency: 'ARS',
        provider: '',
        notes: '',
        status: 'pending'
      });
      setReceiptFile(null);
      setReceiptPreview(null);
    }
    setFileError(null);
    setErrors({});
    // Reset nueva categoría
    setIsAddingCategory(false);
    setNewCategoryName('');
    setNewCategoryIcon('📦');
  }, [expense, isOpen, properties]);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;

    const newCategory: Category = {
      value: newCategoryName.toLowerCase().replace(/\s+/g, '_'),
      label: newCategoryName.trim(),
      icon: newCategoryIcon,
      color: 'orange'
    };

    if (onAddCategory) {
      onAddCategory(newCategory);
    }

    // Seleccionar la nueva categoría
    setFormData({ ...formData, category: newCategory.value });

    // Resetear formulario de nueva categoría
    setIsAddingCategory(false);
    setNewCategoryName('');
    setNewCategoryIcon('📦');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);

    if (!file) {
      setReceiptFile(null);
      setReceiptPreview(null);
      return;
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      setFileError('El archivo no puede superar 2MB');
      return;
    }

    // Validar tipo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Solo se permiten archivos PDF, JPG, PNG o WebP');
      return;
    }

    setReceiptFile(file);
    setReceiptPreview(file.name);
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.property_id) newErrors.property_id = 'Selecciona una propiedad';
    if (!formData.date) newErrors.date = 'Ingresa la fecha';
    if (!formData.description.trim()) newErrors.description = 'Ingresa una descripción';
    if (formData.amount <= 0) newErrors.amount = 'El monto debe ser mayor a 0';
    if (!formData.provider.trim()) newErrors.provider = 'Ingresa el proveedor';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const expenseData = {
      ...formData,
      receipt_file: receiptFile
    };

    onSave(expenseData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface rounded-3xl max-w-2xl w-full shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-state-orange to-state-red p-6 text-primary-foreground flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <Wrench className="w-6 h-6" strokeWidth={1.7} />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold">
                  {expense ? 'Editar Gasto' : 'Nuevo Gasto'}
                </h2>
                <p className="text-primary-foreground/80 text-sm">Registra gastos y reparaciones</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-primary-foreground/20 hover:bg-primary-foreground/30 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" strokeWidth={1.7} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Propiedad y Fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-ink-secondary mb-2">
                Propiedad *
              </label>
              <select
                value={formData.property_id}
                onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                className={cn(
                  'form-control w-full px-4 py-3 focus:outline-none',
                  errors.property_id && 'border-state-red bg-state-red/10'
                )}
                disabled={properties.length === 0}
              >
                <option value="">
                  {properties.length === 0 ? 'Cargando propiedades...' : 'Seleccionar propiedad'}
                </option>
                {properties.map(prop => (
                  <option key={prop.id} value={prop.id}>{prop.name}</option>
                ))}
              </select>
              {properties.length === 0 && !errors.property_id && (
                <p className="text-state-yellow text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" strokeWidth={1.7} />
                  No se encontraron propiedades. Recarga la página.
                </p>
              )}
              {errors.property_id && <p className="text-state-red text-xs mt-1">{errors.property_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-ink-secondary mb-2">
                Fecha *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={cn(
                  'form-control w-full px-4 py-3 focus:outline-none',
                  errors.date && 'border-state-red bg-state-red/10'
                )}
              />
              {errors.date && <p className="text-state-red text-xs mt-1">{errors.date}</p>}
            </div>
          </div>

          {/* Categoría */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-ink-secondary">
                Categoría
              </label>
              {!isAddingCategory && (
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="text-xs font-bold text-state-orange hover:text-state-red flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" strokeWidth={1.7} />
                  Nueva categoría
                </button>
              )}
            </div>

            {/* Formulario para nueva categoría */}
            {isAddingCategory && (
              <div className="mb-3 p-4 bg-state-orange/10 border-2 border-state-orange/30 rounded-xl space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-state-orange">Nueva Categoría</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCategoryName('');
                      setNewCategoryIcon('📦');
                    }}
                    className="text-ink-muted hover:text-ink-secondary"
                  >
                    <X className="w-4 h-4" strokeWidth={1.7} />
                  </button>
                </div>

                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ej: Blanquería, Limpieza profunda..."
                  className="w-full px-3 py-2 rounded-lg border-2 border-state-orange/30 bg-surface focus:border-state-orange focus:outline-none text-sm text-ink-primary"
                  autoFocus
                />

                <div>
                  <span className="text-xs font-bold text-ink-muted mb-1 block">Selecciona un icono:</span>
                  <div className="flex flex-wrap gap-1">
                    {AVAILABLE_ICONS.map(({ icon }) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewCategoryIcon(icon)}
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all',
                          newCategoryIcon === icon
                            ? 'bg-state-orange shadow-md scale-110'
                            : 'bg-surface border border-border-subtle hover:border-state-orange/50'
                        )}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim()}
                  className={cn(
                    'w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all',
                    newCategoryName.trim()
                      ? 'bg-state-orange text-primary-foreground hover:opacity-90'
                      : 'bg-surface-hover text-ink-muted cursor-not-allowed'
                  )}
                >
                  <Check className="w-4 h-4" strokeWidth={1.7} />
                  Agregar "{newCategoryName || '...'}"
                </button>
              </div>
            )}

            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  className={cn(
                    'px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-2 justify-center',
                    formData.category === cat.value
                      ? 'border-state-orange bg-state-orange/10 text-state-orange'
                      : 'border-border hover:border-state-orange/40 text-ink-secondary'
                  )}
                >
                  <span>{cat.icon}</span>
                  <span className="hidden md:inline">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-bold text-ink-secondary mb-2">
              Descripción *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ej: Reparación de cañería en baño"
              className={cn(
                'form-control w-full px-4 py-3 focus:outline-none',
                errors.description && 'border-state-red bg-state-red/10'
              )}
            />
            {errors.description && <p className="text-state-red text-xs mt-1">{errors.description}</p>}
          </div>

          {/* Proveedor */}
          <div>
            <label className="block text-sm font-bold text-ink-secondary mb-2">
              Proveedor / Empresa *
            </label>
            <input
              type="text"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              placeholder="Ej: Plomería González"
              className={cn(
                'form-control w-full px-4 py-3 focus:outline-none',
                errors.provider && 'border-state-red bg-state-red/10'
              )}
            />
            {errors.provider && <p className="text-state-red text-xs mt-1">{errors.provider}</p>}
          </div>

          {/* Monto y Moneda */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-ink-secondary mb-2">
                Monto *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-ink-muted font-bold font-mono">$</span>
                <input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className={cn(
                    'form-control w-full pl-8 pr-4 py-3 font-mono focus:outline-none',
                    errors.amount && 'border-state-red bg-state-red/10'
                  )}
                />
              </div>
              {errors.amount && <p className="text-state-red text-xs mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-ink-secondary mb-2">
                Moneda
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, currency: 'ARS' })}
                  className={cn(
                    'flex-1 py-3 rounded-xl border-2 font-bold font-mono transition-all',
                    formData.currency === 'ARS'
                      ? 'border-state-blue bg-state-blue/10 text-state-blue'
                      : 'border-border text-ink-muted hover:border-state-blue/40'
                  )}
                >
                  ARS
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, currency: 'USD' })}
                  className={cn(
                    'flex-1 py-3 rounded-xl border-2 font-bold font-mono transition-all',
                    formData.currency === 'USD'
                      ? 'border-state-green bg-state-green/10 text-state-green'
                      : 'border-border text-ink-muted hover:border-state-green/40'
                  )}
                >
                  USD
                </button>
              </div>
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-bold text-ink-secondary mb-2">
              Estado del Pago
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'pending' })}
                className={cn(
                  'flex-1 py-3 rounded-xl border-2 font-medium transition-all',
                  formData.status === 'pending'
                    ? 'border-state-yellow bg-state-yellow/10 text-state-yellow'
                    : 'border-border text-ink-muted hover:border-state-yellow/40'
                )}
              >
                Pendiente
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'paid' })}
                className={cn(
                  'flex-1 py-3 rounded-xl border-2 font-medium transition-all',
                  formData.status === 'paid'
                    ? 'border-state-green bg-state-green/10 text-state-green'
                    : 'border-border text-ink-muted hover:border-state-green/40'
                )}
              >
                Pagado
              </button>
            </div>
          </div>

          {/* Upload Factura */}
          <div>
            <label className="block text-sm font-bold text-ink-secondary mb-2">
              Factura / Comprobante
            </label>

            {receiptPreview ? (
              <div className="flex items-center gap-3 p-4 bg-surface-elevated rounded-xl border-2 border-border">
                <div className="w-10 h-10 rounded-lg bg-state-orange/15 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-state-orange" strokeWidth={1.7} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink-primary truncate">{receiptPreview}</p>
                  <p className="text-xs text-ink-muted font-mono">
                    {receiptFile ? `${(receiptFile.size / 1024).toFixed(1)} KB` : 'Archivo adjunto'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-2 text-state-red hover:bg-state-red/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" strokeWidth={1.7} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="upload-zone p-8 text-center cursor-pointer"
              >
                <Upload className="w-10 h-10 text-ink-muted mx-auto mb-3" strokeWidth={1.7} />
                <p className="font-medium text-ink-secondary">Click para subir factura</p>
                <p className="text-sm text-ink-muted mt-1">PDF, JPG, PNG (máx. 2MB)</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {fileError && (
              <div className="flex items-center gap-2 mt-2 text-state-red">
                <AlertCircle className="w-4 h-4" strokeWidth={1.7} />
                <span className="text-sm">{fileError}</span>
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-bold text-ink-secondary mb-2">
              Notas adicionales
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observaciones, detalles adicionales..."
              rows={3}
              className="form-control w-full px-4 py-3 focus:outline-none resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 bg-surface-elevated border-t border-border flex gap-3 flex-shrink-0">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-state-orange to-state-red border-none shadow-lg hover:opacity-90"
          >
            {expense ? 'Guardar Cambios' : 'Registrar Gasto'}
          </Button>
        </div>
      </div>
    </div>
  );
};
