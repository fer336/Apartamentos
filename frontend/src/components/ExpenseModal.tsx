import React, { useState, useEffect, useRef } from 'react';
import { X, Wrench, Upload, FileText, Trash2, AlertCircle, Plus, Check } from 'lucide-react';

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
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {expense ? 'Editar Gasto' : 'Nuevo Gasto'}
                </h2>
                <p className="text-orange-100 text-sm">Registra gastos y reparaciones</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Propiedad y Fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Propiedad *
              </label>
              <select
                value={formData.property_id}
                onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border-2 ${errors.property_id ? 'border-red-300 bg-red-50' : 'border-border'} focus:border-orange-400 focus:outline-none transition-colors`}
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
                <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  No se encontraron propiedades. Recarga la página.
                </p>
              )}
              {errors.property_id && <p className="text-red-500 text-xs mt-1">{errors.property_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Fecha *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border-2 ${errors.date ? 'border-red-300 bg-red-50' : 'border-border'} focus:border-orange-400 focus:outline-none transition-colors`}
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            </div>
          </div>

          {/* Categoría */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-700">
                Categoría
              </label>
              {!isAddingCategory && (
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Nueva categoría
                </button>
              )}
            </div>

            {/* Formulario para nueva categoría */}
            {isAddingCategory && (
              <div className="mb-3 p-4 bg-orange-50 border-2 border-orange-200 rounded-xl space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-orange-700">Nueva Categoría</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCategoryName('');
                      setNewCategoryIcon('📦');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ej: Blanquería, Limpieza profunda..."
                  className="w-full px-3 py-2 rounded-lg border-2 border-orange-200 focus:border-orange-400 focus:outline-none text-sm"
                  autoFocus
                />

                <div>
                  <span className="text-xs font-bold text-gray-500 mb-1 block">Selecciona un icono:</span>
                  <div className="flex flex-wrap gap-1">
                    {AVAILABLE_ICONS.map(({ icon }) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewCategoryIcon(icon)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                          newCategoryIcon === icon
                            ? 'bg-orange-500 shadow-md scale-110'
                            : 'bg-white border border-gray-200 hover:border-orange-300'
                        }`}
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
                  className={`w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    newCategoryName.trim()
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" />
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
                  className={`px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-2 justify-center ${
                    formData.category === cat.value
                      ? 'border-orange-400 bg-orange-50 text-orange-700'
                      : 'border-border hover:border-orange-200 text-gray-600'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="hidden md:inline">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Descripción *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ej: Reparación de cañería en baño"
              className={`w-full px-4 py-3 rounded-xl border-2 ${errors.description ? 'border-red-300 bg-red-50' : 'border-border'} focus:border-orange-400 focus:outline-none transition-colors`}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          {/* Proveedor */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Proveedor / Empresa *
            </label>
            <input
              type="text"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              placeholder="Ej: Plomería González"
              className={`w-full px-4 py-3 rounded-xl border-2 ${errors.provider ? 'border-red-300 bg-red-50' : 'border-border'} focus:border-orange-400 focus:outline-none transition-colors`}
            />
            {errors.provider && <p className="text-red-500 text-xs mt-1">{errors.provider}</p>}
          </div>

          {/* Monto y Moneda */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Monto *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-400 font-bold">$</span>
                <input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className={`w-full pl-8 pr-4 py-3 rounded-xl border-2 ${errors.amount ? 'border-red-300 bg-red-50' : 'border-border'} focus:border-orange-400 focus:outline-none transition-colors`}
                />
              </div>
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Moneda
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, currency: 'ARS' })}
                  className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${
                    formData.currency === 'ARS'
                      ? 'border-blue-400 bg-blue-50 text-blue-700'
                      : 'border-border text-gray-500 hover:border-blue-200'
                  }`}
                >
                  ARS
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, currency: 'USD' })}
                  className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${
                    formData.currency === 'USD'
                      ? 'border-green-400 bg-green-50 text-green-700'
                      : 'border-border text-gray-500 hover:border-green-200'
                  }`}
                >
                  USD
                </button>
              </div>
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Estado del Pago
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'pending' })}
                className={`flex-1 py-3 rounded-xl border-2 font-medium transition-all ${
                  formData.status === 'pending'
                    ? 'border-amber-400 bg-amber-50 text-amber-700'
                    : 'border-border text-gray-500 hover:border-amber-200'
                }`}
              >
                Pendiente
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'paid' })}
                className={`flex-1 py-3 rounded-xl border-2 font-medium transition-all ${
                  formData.status === 'paid'
                    ? 'border-green-400 bg-green-50 text-green-700'
                    : 'border-border text-gray-500 hover:border-green-200'
                }`}
              >
                Pagado
              </button>
            </div>
          </div>

          {/* Upload Factura */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Factura / Comprobante
            </label>

            {receiptPreview ? (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border-2 border-border">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{receiptPreview}</p>
                  <p className="text-xs text-gray-500">
                    {receiptFile ? `${(receiptFile.size / 1024).toFixed(1)} KB` : 'Archivo adjunto'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-all"
              >
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="font-medium text-gray-700">Click para subir factura</p>
                <p className="text-sm text-gray-500 mt-1">PDF, JPG, PNG (máx. 2MB)</p>
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
              <div className="flex items-center gap-2 mt-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{fileError}</span>
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Notas adicionales
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observaciones, detalles adicionales..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-orange-400 focus:outline-none transition-colors resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-border flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-red-600 transition-all shadow-lg"
          >
            {expense ? 'Guardar Cambios' : 'Registrar Gasto'}
          </button>
        </div>
      </div>
    </div>
  );
};
