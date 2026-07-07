import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-2 border-purple-100 p-6 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="text-2xl font-bold text-foreground">
            {property ? 'Editar Propiedad' : 'Nueva Propiedad'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">Información Básica</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nombre de la Propiedad *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-purple-400 focus:outline-none"
                  placeholder="Ej: Departamento A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tipo de Propiedad
                </label>
                <select
                  value={formData.property_type}
                  onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-purple-400 focus:outline-none"
                >
                  <option value="apartment">Departamento</option>
                  <option value="house">Casa</option>
                  <option value="studio">Monoambiente</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Dirección *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-purple-400 focus:outline-none"
                placeholder="Ej: Complejo Valeria - Torre Norte, Piso 3, Depto A"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Provincia
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  País
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-purple-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Capacidad */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">Capacidad y Espacios</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Capacidad Máxima (personas) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Dormitorios
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-purple-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Baños
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-purple-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Servicios/Amenities */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">Servicios y Amenities</h3>

            {/* Lista Default */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {DEFAULT_AMENITIES.map((amenity) => (
                <label
                  key={amenity.value}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.amenities.includes(amenity.value)
                    ? 'border-purple-400 bg-purple-50'
                    : 'border-border hover:border-purple-300'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity.value)}
                    onChange={() => toggleAmenity(amenity.value)}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-400"
                  />
                  <span className="text-sm font-medium">{amenity.label}</span>
                </label>
              ))}
            </div>

            {/* Custom Amenities */}
            <div className="pt-4 border-t border-border">
              <label className="block text-sm font-medium text-foreground mb-2">
                Agregar Servicio Personalizado
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customAmenity}
                  onChange={(e) => setCustomAmenity(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAmenity())}
                  className="flex-1 px-4 py-2 rounded-xl border-2 border-border focus:border-purple-400 focus:outline-none"
                  placeholder="Ej: Netflix, Jacuzzi, Vista al mar..."
                />
                <button
                  type="button"
                  onClick={addCustomAmenity}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors font-medium flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Agregar
                </button>
              </div>

              {/* Lista de Custom Amenities */}
              {customAmenitiesList.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {customAmenitiesList.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-sm font-medium border border-purple-200"
                    >
                      <span>{amenity}</span>
                      <button
                        type="button"
                        onClick={() => removeAmenity(amenity)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Configuración de Alquiler */}
          <div className="space-y-4 p-6 bg-purple-50 rounded-2xl border border-purple-100">
            <h3 className="font-semibold text-lg text-purple-900">Configuración de Alquiler</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-purple-800 mb-2">
                  Día de Check-in Preferido
                </label>
                <select
                  value={formData.check_in_day}
                  onChange={(e) => setFormData({ ...formData, check_in_day: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-400 focus:outline-none bg-white"
                >
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day, i) => (
                    <option key={i} value={i}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-800 mb-2">
                  Día de Check-out Preferido
                </label>
                <select
                  value={formData.check_out_day}
                  onChange={(e) => setFormData({ ...formData, check_out_day: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-400 focus:outline-none bg-white"
                >
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day, i) => (
                    <option key={i} value={i}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-800 mb-2">
                  Unidad de Alquiler
                </label>
                <select
                  value={formData.rental_unit}
                  onChange={(e) => setFormData({ ...formData, rental_unit: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-400 focus:outline-none bg-white"
                >
                  <option value="days">Días</option>
                  <option value="weeks">Semanas</option>
                  <option value="fortnights">Quincenas</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-purple-600 italic">
              * Esta configuración ayudará a validar las fechas al crear reservas y mostrar la disponibilidad en el calendario.
            </p>
          </div>

          {/* Descripción */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">Descripción</h3>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-purple-400 focus:outline-none resize-none"
              placeholder="Describe la propiedad, características especiales, ubicación, etc."
            />
          </div>

          {/* Estado */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">Estado</h3>
            <div className="flex gap-3">
              {[
                { value: 'available', label: 'Disponible', color: 'bg-green-100 border-green-300 text-green-700' },
                { value: 'occupied', label: 'Ocupado', color: 'bg-red-100 border-red-300 text-red-700' },
                { value: 'maintenance', label: 'Mantenimiento', color: 'bg-yellow-100 border-yellow-300 text-yellow-700' },
              ].map((status) => (
                <label
                  key={status.value}
                  className={`flex-1 p-3 rounded-xl border-2 cursor-pointer transition-all text-center font-medium ${formData.status === status.value ? status.color : 'border-border hover:border-purple-300'
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
          <div className="flex gap-4 pt-4 border-t-2 border-purple-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-border hover:bg-gray-50 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 font-medium transition-all shadow-lg"
            >
              {property ? 'Actualizar' : 'Crear'} Propiedad
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
