import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './ui/Button';
import { ENTITY_COLORS } from '../utils/entityColor';
import type { PropertyPayload } from '../services/api';

const DEFAULT_COLOR_KEY = ENTITY_COLORS[0].key;

interface Property {
  id: string;
  name?: string;
  capacity?: number;
  status?: string;
  color?: string;
  check_in_day?: number;
  check_out_day?: number;
  rental_unit?: string;
}

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (propertyData: PropertyPayload) => void;
  property?: Property;
}

export const PropertyModal: React.FC<PropertyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  property,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    capacity: 4,
    status: 'available',
    color: DEFAULT_COLOR_KEY as string,
    check_in_day: 5, // Sábado
    check_out_day: 5, // Sábado
    rental_unit: 'days',
  });

  useEffect(() => {
    if (property) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- pre-existing modal-open form reset, tracked as follow-up
      setFormData({
        name: property.name || '',
        capacity: property.capacity || 4,
        status: property.status || 'available',
        color: property.color || DEFAULT_COLOR_KEY,
        check_in_day: property.check_in_day !== undefined ? property.check_in_day : 5,
        check_out_day: property.check_out_day !== undefined ? property.check_out_day : 5,
        rental_unit: property.rental_unit || 'days',
      });
    } else {
      // Reset form for new property
      setFormData({
        name: '',
        capacity: 4,
        status: 'available',
        color: DEFAULT_COLOR_KEY,
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

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
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
                Color
              </label>
              <div className="flex flex-wrap gap-3">
                {ENTITY_COLORS.map((color) => (
                  <button
                    key={color.key}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.key })}
                    className={`w-9 h-9 rounded-full ${color.solid} transition-all ${
                      formData.color === color.key
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface'
                        : 'hover:scale-110'
                    }`}
                    aria-label={`Color ${color.key}`}
                  />
                ))}
              </div>
            </div>

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
          </div>

          {/* Configuración de Alquiler */}
          <div className="space-y-3 p-5 bg-surface-violet rounded-2xl border border-border">
            <h3 className="font-display font-semibold text-lg text-ink-primary">Configuración de Alquiler</h3>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                  Check-in
                </label>
                <select
                  value={formData.check_in_day}
                  onChange={(e) => setFormData({ ...formData, check_in_day: parseInt(e.target.value) })}
                  className="form-control w-full px-2 py-2 text-sm focus:outline-none"
                >
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day, i) => (
                    <option key={i} value={i}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                  Check-out
                </label>
                <select
                  value={formData.check_out_day}
                  onChange={(e) => setFormData({ ...formData, check_out_day: parseInt(e.target.value) })}
                  className="form-control w-full px-2 py-2 text-sm focus:outline-none"
                >
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day, i) => (
                    <option key={i} value={i}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1.5">
                  Unidad
                </label>
                <select
                  value={formData.rental_unit}
                  onChange={(e) => setFormData({ ...formData, rental_unit: e.target.value })}
                  className="form-control w-full px-2 py-2 text-sm focus:outline-none"
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

          {/* Estado */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-lg text-ink-primary">Estado</h3>
            <div className="flex gap-3">
              {[
                { value: 'available', label: 'Disponible', color: 'bg-state-green/16 border-state-green/32 text-state-green-strong' },
                { value: 'occupied', label: 'Ocupado', color: 'bg-state-red/16 border-state-red/32 text-state-red' },
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
          <div className="flex gap-4 pt-4 border-t border-border-subtle sticky bottom-0 bg-surface -mx-6 -mb-6 px-6 pb-6">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              {property ? 'Actualizar' : 'Crear'} Propiedad
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
