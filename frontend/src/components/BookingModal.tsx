import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, User, Home, DollarSign, Users } from 'lucide-react';
import { getClients, getProperties } from '../services/api';
import { Button } from './ui/Button';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookingData: any) => void;
  booking?: any;
  errorMessage?: string | null;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  booking,
  errorMessage,
}) => {
  const [formData, setFormData] = useState({
    property_id: '',
    client_id: '',
    check_in: '',
    check_out: '',
    guests_count: 1,
    adults: 1,
    children: 0,
    pets: false,
    total_price_usd: 0,
    total_price_currency: 'USD',
    advance_payment_usd: 0,
    advance_payment_currency: 'USD',
    deposit_ars: 0,
    deposit_currency: 'ARS',
    exchange_rate: 1200,
    status: 'pending',
    payment_status: 'pending',
    service_status: 'NO SERVICIOS',
  });

  const [clients, setClients] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [dateError, setDateError] = useState<string | null>(null);
  // const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        // setLoading(true);
        try {
          const [clientsData, propertiesData] = await Promise.all([
            getClients(),
            getProperties()
          ]);
          setClients(clientsData);
          setProperties(propertiesData);
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          // setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    setDateError(null);
    if (booking) {
      setFormData({
        property_id: booking.property_id || '',
        client_id: booking.client_id || '',
        check_in: booking.check_in || '',
        check_out: booking.check_out || '',
        guests_count: booking.guests_count || 1,
        adults: booking.adults || 1,
        children: booking.children || 0,
        pets: booking.pets || false,
        total_price_usd: booking.total_price_usd || 0,
        total_price_currency: booking.total_price_currency || 'USD',
        advance_payment_usd: booking.advance_payment_usd || 0,
        advance_payment_currency: booking.advance_payment_currency || 'USD',
        deposit_ars: booking.deposit_ars || 0,
        deposit_currency: booking.deposit_currency || 'ARS',
        exchange_rate: booking.exchange_rate || 1200,
        status: booking.status || 'pending',
        payment_status: booking.payment_status || 'pending',
        service_status: booking.service_status || 'NO SERVICIOS',
      });
    } else {
      setFormData({
        property_id: '',
        client_id: '',
        check_in: '',
        check_out: '',
        guests_count: 1,
        adults: 1,
        children: 0,
        pets: false,
        total_price_usd: 0,
        total_price_currency: 'USD',
        advance_payment_usd: 0,
        advance_payment_currency: 'USD',
        deposit_ars: 0,
        deposit_currency: 'ARS',
        exchange_rate: 1200,
        status: 'pending',
        payment_status: 'pending',
        service_status: 'NO SERVICIOS',
      });
    }
  }, [booking, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que check_out sea después de check_in
    if (formData.check_in && formData.check_out) {
      const checkIn = new Date(formData.check_in);
      const checkOut = new Date(formData.check_out);

      if (checkOut <= checkIn) {
        setDateError('La fecha de salida debe ser al menos 1 día después de la fecha de entrada');
        return;
      }
    }

    setDateError(null);
    onSave(formData);
  };

  const handleNumberChange = (field: string, value: string) => {
    // Si el campo está vacío, usar 0
    if (value === '' || value === null || value === undefined) {
      setFormData(prev => ({
        ...prev,
        [field]: 0
      }));
      return;
    }

    const numValue = parseFloat(value);
    setFormData(prev => ({
      ...prev,
      [field]: isNaN(numValue) ? 0 : numValue
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-in zoom-in duration-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-surface border-b border-border-subtle p-6 flex items-center justify-between flex-none z-10">
          <h2 className="font-display text-2xl font-bold text-foreground">
            {booking ? 'Editar Reserva' : 'Nueva Reserva'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-surface-hover flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6" strokeWidth={1.7} />
          </button>
        </div>

        {/* Form Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {errorMessage && (
              <div className="bg-state-red/10 border-2 border-state-red/30 rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-state-red/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-state-red font-bold">!</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-state-red mb-1">Error</h4>
                  <p className="text-sm text-state-red">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Selección Principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground flex items-center gap-2">
                  <Home className="w-4 h-4 text-primary" strokeWidth={1.7} />
                  Propiedad *
                </label>
                <select
                  required
                  value={formData.property_id}
                  onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                  className="form-control w-full px-4 py-3 focus:outline-none"
                >
                  <option value="">Seleccionar Propiedad</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-state-blue" strokeWidth={1.7} />
                  Cliente *
                </label>
                <select
                  required
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="form-control w-full px-4 py-3 focus:outline-none"
                >
                  <option value="">Seleccionar Cliente</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fechas y Huéspedes */}
            <div className="p-6 bg-surface-violet rounded-2xl border border-border space-y-6">
              <h3 className="font-display text-lg font-semibold text-ink-violet flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" strokeWidth={1.7} />
                Estadía
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-secondary mb-2">Check-in *</label>
                  <input
                    type="date"
                    required
                    value={formData.check_in}
                    onChange={(e) => {
                      setDateError(null);
                      const newCheckIn = e.target.value;
                      const currentCheckOut = formData.check_out;

                      // Si check_out ya está definido y es igual o anterior a check_in, ajustarlo
                      if (currentCheckOut && newCheckIn >= currentCheckOut) {
                        const nextDay = new Date(newCheckIn);
                        nextDay.setDate(nextDay.getDate() + 1);
                        setFormData({
                          ...formData,
                          check_in: newCheckIn,
                          check_out: nextDay.toISOString().split('T')[0]
                        });
                      } else {
                        setFormData({ ...formData, check_in: newCheckIn });
                      }
                    }}
                    className={`form-control w-full px-4 py-3 focus:outline-none ${formData.check_in && formData.property_id &&
                      new Date(formData.check_in + 'T00:00:00').getDay() !== ((properties.find(p => p.id === formData.property_id)?.check_in_day + 1) % 7)
                      ? 'border-state-yellow bg-state-yellow/10' : ''
                      }`}
                  />
                  {formData.check_in && formData.property_id && (
                    <p className="text-[10px] mt-1 font-bold text-ink-violet uppercase">
                      {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date(formData.check_in + 'T00:00:00').getDay()]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-secondary mb-2">Check-out *</label>
                  <input
                    type="date"
                    required
                    value={formData.check_out}
                    min={formData.check_in ? new Date(new Date(formData.check_in).getTime() + 86400000).toISOString().split('T')[0] : undefined}
                    onChange={(e) => {
                      setDateError(null);
                      setFormData({ ...formData, check_out: e.target.value });
                    }}
                    className={`form-control w-full px-4 py-3 focus:outline-none ${formData.check_out && formData.property_id &&
                      new Date(formData.check_out + 'T00:00:00').getDay() !== ((properties.find(p => p.id === formData.property_id)?.check_out_day + 1) % 7)
                      ? 'border-state-yellow bg-state-yellow/10' : ''
                      }`}
                  />
                  {formData.check_out && formData.property_id && (
                    <p className="text-[10px] mt-1 font-bold text-ink-violet uppercase">
                      {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date(formData.check_out + 'T00:00:00').getDay()]}
                    </p>
                  )}
                  {dateError && (
                    <p className="text-xs mt-1 font-medium text-state-red">{dateError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-secondary mb-2">Total Huéspedes</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={formData.guests_count || ''}
                      onChange={(e) => {
                        const total = parseInt(e.target.value) || 1;
                        setFormData(prev => ({
                          ...prev,
                          guests_count: total
                        }));
                      }}
                      className="form-control w-full px-4 py-3 focus:outline-none pl-10"
                      readOnly
                    />
                    <Users className="w-5 h-5 text-ink-violet absolute left-3 top-3.5" strokeWidth={1.7} />
                  </div>
                </div>
              </div>

              {/* Detalle de Huéspedes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-ink-secondary mb-2">👨‍👩‍👧 Adultos *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.adults === 0 ? '' : formData.adults}
                    onChange={(e) => {
                      const adults = parseInt(e.target.value) || 0;
                      setFormData(prev => ({
                        ...prev,
                        adults: adults,
                        guests_count: adults + prev.children
                      }));
                    }}
                    className="form-control w-full px-4 py-3 focus:outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-secondary mb-2">👶 Niños</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.children === 0 ? '' : formData.children}
                    onChange={(e) => {
                      const children = parseInt(e.target.value) || 0;
                      setFormData(prev => ({
                        ...prev,
                        children: children,
                        guests_count: prev.adults + children
                      }));
                    }}
                    className="form-control w-full px-4 py-3 focus:outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-secondary mb-2">🐾 Mascotas</label>
                  <div className="flex items-center h-[50px]">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.pets}
                        onChange={(e) => setFormData(prev => ({ ...prev, pets: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-surface-hover peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-soft/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-surface-elevated after:border-border after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                      <span className="ml-3 text-sm font-medium text-ink-secondary">{formData.pets ? 'Sí' : 'No'}</span>
                    </label>
                  </div>
                </div>
              </div>

              {formData.property_id && (
                <div className="bg-state-yellow/15 p-3 rounded-xl border border-state-yellow/30 flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  <p className="text-xs text-state-yellow font-medium">
                    Esta propiedad prefiere check-in los <b>{['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][properties.find(p => p.id === formData.property_id)?.check_in_day]}</b> y check-out los <b>{['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][properties.find(p => p.id === formData.property_id)?.check_out_day]}</b>.
                  </p>
                </div>
              )}
            </div>

            {/* Precios */}
            <div className="p-6 bg-state-green/10 rounded-2xl border border-state-green/25 space-y-6">
              <h3 className="font-display text-lg font-semibold text-state-green-strong flex items-center gap-2">
                <DollarSign className="w-5 h-5" strokeWidth={1.7} />
                Pagos y Valores
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-secondary mb-2">Precio Total *</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.total_price_usd === 0 ? '' : formData.total_price_usd}
                      onChange={(e) => handleNumberChange('total_price_usd', e.target.value)}
                      className="form-control w-full px-4 py-3 focus:outline-none"
                      placeholder="0"
                    />
                    <select
                      value={formData.total_price_currency}
                      onChange={(e) => setFormData({ ...formData, total_price_currency: e.target.value })}
                      className="form-control px-2 py-3 focus:outline-none text-sm font-bold text-state-green-strong"
                    >
                      <option value="USD">USD</option>
                      <option value="ARS">ARS</option>
                      <option value="EUR">EUR</option>
                      <option value="BRL">BRL</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-secondary mb-2">Anticipo</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.advance_payment_usd === 0 ? '' : formData.advance_payment_usd}
                      onChange={(e) => handleNumberChange('advance_payment_usd', e.target.value)}
                      className="form-control w-full px-4 py-3 focus:outline-none"
                      placeholder="0"
                    />
                    <select
                      value={formData.advance_payment_currency}
                      onChange={(e) => setFormData({ ...formData, advance_payment_currency: e.target.value })}
                      className="form-control px-2 py-3 focus:outline-none text-sm font-bold text-state-green-strong"
                    >
                      <option value="USD">USD</option>
                      <option value="ARS">ARS</option>
                      <option value="EUR">EUR</option>
                      <option value="BRL">BRL</option>
                    </select>
                  </div>
                </div>

                {/* Tipo de Cambio (Condicional) */}
                {(formData.total_price_currency !== formData.advance_payment_currency) && (
                  <div>
                    <label className="block text-sm font-medium text-state-blue mb-2 flex items-center gap-1">
                      <DollarSign className="w-4 h-4" strokeWidth={1.7} />
                      Tipo de Cambio
                      <span className="text-xs font-normal text-state-blue/80 ml-1">
                        (1 {formData.total_price_currency} = X {formData.advance_payment_currency})
                      </span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.exchange_rate === 0 ? '' : formData.exchange_rate}
                      onChange={(e) => handleNumberChange('exchange_rate', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-state-blue/30 focus:border-state-blue focus:outline-none bg-state-blue/10"
                      placeholder="Ej: 1200"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-ink-secondary mb-2">Depósito</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.deposit_ars === 0 ? '' : formData.deposit_ars}
                      onChange={(e) => handleNumberChange('deposit_ars', e.target.value)}
                      className="form-control w-full px-4 py-3 focus:outline-none"
                      placeholder="0"
                    />
                    <select
                      value={formData.deposit_currency}
                      onChange={(e) => setFormData({ ...formData, deposit_currency: e.target.value })}
                      className="form-control px-2 py-3 focus:outline-none text-sm font-bold text-state-green-strong"
                    >
                      <option value="ARS">ARS</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="BRL">BRL</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Estados */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Estado Reserva</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="form-control w-full px-4 py-3 focus:outline-none"
                >
                  <option value="pending">Pendiente</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="active">En curso</option>
                  <option value="completed">Finalizada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Estado Pago</label>
                <select
                  value={formData.payment_status}
                  onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                  className="form-control w-full px-4 py-3 focus:outline-none"
                >
                  <option value="pending">Pendiente</option>
                  <option value="advance_paid">Anticipo Pagado</option>
                  <option value="fully_paid">Totalmente Pagado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Servicios</label>
                <select
                  value={formData.service_status}
                  onChange={(e) => setFormData({ ...formData, service_status: e.target.value })}
                  className="form-control w-full px-4 py-3 focus:outline-none"
                >
                  <option value="SERVICIOS">SERVICIOS</option>
                  <option value="NO SERVICIOS">NO SERVICIOS</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fixed Footer with Buttons */}
          <div className="flex gap-4 p-6 border-t border-border-subtle bg-surface flex-none z-10">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
            >
              {booking ? 'Actualizar' : 'Crear'} Reserva
            </Button>
          </div>
        </form>
      </div >
    </div >
  );
};
