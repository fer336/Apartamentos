import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from './ui/Button';

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (propertyData: any) => void;
  property?: any;
}

const DEFAULT_AMENITIES = [
  { value: 'wifi', label: 'WiFi' },
  { value: 'tv', label: 'TV' },
  { value: 'ac', label: 'Aire Acondicionado' },
  { value: 'cocina_equipada', label: 'Cocina Equipada' },
  { value: 'heladera', label: 'Heladera' },
  { value: 'microondas', label: 'Microondas' },
  { value: 'vajilla_completa', label: 'Vajilla Completa' },
  { value: 'ropa_de_cama', label: 'Ropa de Cama' },
  { value: 'toallas', label: 'Toallas' },
  { value: 'balcon', label: 'Balcón' },
  { value: 'parrilla', label: 'Parrilla' },
  { value: 'cochera', label: 'Cochera' },
  { value: 'pileta', label: 'Pileta' },
];

export const PropertyModal: React.FC<PropertyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  property,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: 'Mar del Plata',
    state: 'Buenos Aires',
    country: 'Argentina',
    capacity: 4,
    bedrooms: 2,
    bathrooms: 1,
    description: '',
    status: 'available',
    property_type: 'apartment',
    amenities: [] as string[],
    check_in_day: 5, // Sábado
    check_out_day: 5, // Sábado
    rental_unit: 'days',
  });

  const [customAmenity, setCustomAmenity] = useState('');

  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name || '',
        address: property.address || '',
        city: property.city || 'Mar del Plata',
        state: property.state || 'Buenos Aires',
        country: property.country || 'Argentina',
        capacity: property.capacity || 4,
        bedrooms: property.bedrooms || 2,
        bathrooms: property.bathrooms || 1,
        description: property.description || '',
        status: property.status || 'available',
        property_type: property.property_type || 'apartment',
        amenities: property.amenities || [],
        check_in_day: property.check_in_day !== undefined ? property.check_in_day : 5,
        check_out_day: property.check_out_day !== undefined ? property.check_out_day : 5,
        rental_unit: property.rental_unit || 'days',
      });
    } else {
      // Reset form for new property
      setFormData({
        name: '',
        address: '',
        city: 'Mar del Plata',
        state: 'Buenos Aires',
        country: 'Argentina',
        capacity: 4,
        bedrooms: 2,
        bathrooms: 1,
        description: '',
        status: 'available',
        property_type: 'apartment',
        amenities: [],
        check_in_day: 5,
        check_out_day: 5,
        rental_unit: 'days',
      });
    }
  }, [property, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const addCustomAmenity = () => {
    if (customAmenity.trim() && !formData.amenities.includes(customAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, customAmenity.trim()]
      }));
      setCustomAmenity('');
    }
  };

  const removeAmenity = (amenityToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenityToRemove)
    }));
  };

  // Filtrar amenities custom (los que no están en la lista default)
  const customAmenitiesList = formData.amenities.filter(
    a => !DEFAULT_AMENITIES.some(da => da.value === a)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border-subtle p-6 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="font-display text-2xl font-bold text-ink-primary">
            {property ? 'Editar Propiedad' : 'Nueva Propiedad'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-surface-hover flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-ink-secondary" strokeWidth={1.7} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-lg text-ink-primary">Información Básica</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-primary mb-2">
                  Nombre de la Propiedad *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-control w-full px-4 py-3 focus:outline-none"
                  placeholder="Ej: Departamento A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-primary mb-2">
                  Tipo de Propiedad
                </label>
                <select
                  value={formData.property_type}
                  onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                  className="form-control w-full px-4 py-3 focus:outline-none"
                >
                  <option value="apartment">Departamento</option>
                  <option value="house">Casa</option>
                  <option value="studio">Monoambiente</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-primary mb-2">
                Dirección *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="form-control w-full px-4 py-3 focus:outline-none"
                placeholder="Ej: Complejo Valeria - Torre Norte, Piso 3, Depto A"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-primary mb-2">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="form-control w-full px-4 py-3 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-primary mb-2">
                  Provincia
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="form-control w-full px-4 py-3 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-primary mb-2">
                  País
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="form-control w-full px-4 py-3 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Capacidad */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-lg text-ink-primary">Capacidad y Espacios</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-primary mb-2">
                  Capacidad Máxima (personas) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="form-control w-full px-4 py-3 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-primary mb-2">
                  Dormitorios
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
                  className="form-control w-full px-4 py-3 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-primary mb-2">
                  Baños
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: parseFloat(e.target.value) })}
                  className="form-control w-full px-4 py-3 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Servicios/Amenities */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-lg text-ink-primary">Servicios y Amenities</h3>

            {/* Lista Default */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {DEFAULT_AMENITIES.map((amenity) => (
                <label
                  key={amenity.value}
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${formData.amenities.includes(amenity.value)
                    ? 'border-primary bg-surface-violet'
                    : 'border-border hover:border-primary-soft'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity.value)}
                    onChange={() => toggleAmenity(amenity.value)}
                    className="w-5 h-5 accent-primary rounded"
                  />
                  <span className="text-sm font-medium text-ink-primary">{amenity.label}</span>
                </label>
              ))}
            </div>

            {/* Custom Amenities */}
            <div className="pt-4 border-t border-border-subtle">
              <label className="block text-sm font-medium text-ink-primary mb-2">
                Agregar Servicio Personalizado
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customAmenity}
                  onChange={(e) => setCustomAmenity(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAmenity())}
                  className="form-control flex-1 px-4 py-2 focus:outline-none"
                  placeholder="Ej: Netflix, Jacuzzi, Vista al mar..."
                />
                <button
                  type="button"
                  onClick={addCustomAmenity}
                  className="px-4 py-2 bg-surface-violet text-primary rounded-xl hover:bg-surface-hover transition-colors font-medium flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" strokeWidth={1.7} />
                  Agregar
                </button>
              </div>

              {/* Lista de Custom Amenities */}
              {customAmenitiesList.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {customAmenitiesList.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 bg-surface-violet text-primary px-3 py-1.5 rounded-full text-sm font-medium border border-border"
                    >
                      <span>{amenity}</span>
                      <button
                        type="button"
                        onClick={() => removeAmenity(amenity)}
                        className="hover:text-state-red transition-colors"
                      >
                        <X className="w-4 h-4" strokeWidth={1.7} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Configuración de Alquiler */}
          <div className="space-y-4 p-6 bg-surface-violet rounded-2xl border border-border">
            <h3 className="font-display font-semibold text-lg text-ink-primary">Configuración de Alquiler</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-2">
                  Día de Check-in Preferido
                </label>
                <select
                  value={formData.check_in_day}
                  onChange={(e) => setFormData({ ...formData, check_in_day: parseInt(e.target.value) })}
                  className="form-control w-full px-4 py-3 focus:outline-none"
                >
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day, i) => (
                    <option key={i} value={i}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-2">
                  Día de Check-out Preferido
                </label>
                <select
                  value={formData.check_out_day}
                  onChange={(e) => setFormData({ ...formData, check_out_day: parseInt(e.target.value) })}
                  className="form-control w-full px-4 py-3 focus:outline-none"
                >
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day, i) => (
                    <option key={i} value={i}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-2">
                  Unidad de Alquiler
                </label>
                <select
                  value={formData.rental_unit}
                  onChange={(e) => setFormData({ ...formData, rental_unit: e.target.value })}
                  className="form-control w-full px-4 py-3 focus:outline-none"
                >
                  <option value="days">Días</option>
                  <option value="weeks">Semanas</option>
                  <option value="fortnights">Quincenas</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-ink-muted italic">
              * Esta configuración ayudará a validar las fechas al crear reservas y mostrar la disponibilidad en el calendario.
            </p>
          </div>

          {/* Descripción */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-lg text-ink-primary">Descripción</h3>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="form-control w-full px-4 py-3 focus:outline-none resize-none"
              placeholder="Describe la propiedad, características especiales, ubicación, etc."
            />
          </div>

          {/* Estado */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-lg text-ink-primary">Estado</h3>
            <div className="flex gap-3">
              {[
                { value: 'available', label: 'Disponible', color: 'bg-state-green/16 border-state-green/32 text-state-green-strong' },
                { value: 'occupied', label: 'Ocupado', color: 'bg-state-red/16 border-state-red/32 text-state-red' },
                { value: 'maintenance', label: 'Mantenimiento', color: 'bg-state-yellow/16 border-state-yellow/32 text-state-yellow' },
              ].map((status) => (
                <label
                  key={status.value}
                  className={`flex-1 p-3 rounded-xl border cursor-pointer transition-all text-center font-medium ${formData.status === status.value ? status.color : 'border-border text-ink-secondary hover:border-primary-soft'
                    }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={status.value}
                    checked={formData.status === status.value}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="sr-only"
                  />
                  {status.label}
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4 border-t border-border-subtle">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              {property ? 'Actualizar' : 'Crear'} Propiedad
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
