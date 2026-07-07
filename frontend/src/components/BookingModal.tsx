import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, User, Home, DollarSign, Users } from 'lucide-react';
import { getClients, getProperties } from '../services/api';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookingData: any) => void;
  booking?: any;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  booking,
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
        alert('⚠️ La fecha de salida debe ser al menos 1 día después de la fecha de entrada');
        return;
      }
    }
    
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
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-in zoom-in duration-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-pink-100 p-6 flex items-center justify-between flex-none z-10">
          <h2 className="text-2xl font-bold text-foreground">
            {booking ? 'Editar Reserva' : 'Nueva Reserva'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Selección Principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground flex items-center gap-2">
                  <Home className="w-4 h-4 text-purple-500" />
                  Propiedad *
                </label>
                <select
                  required
                  value={formData.property_id}
                  onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-purple-400 focus:outline-none bg-white"
                >
                  <option value="">Seleccionar Propiedad</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  Cliente *
                </label>
                <select
                  required
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-purple-400 focus:outline-none bg-white"
                >
                  <option value="">Seleccionar Cliente</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fechas y Huéspedes */}
            <div className="p-6 bg-pink-50 rounded-2xl border border-pink-100 space-y-6">
              <h3 className="font-semibold text-pink-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Estadía
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-pink-800 mb-2">Check-in *</label>
                  <input
                    type="date"
                    required
                    value={formData.check_in}
                    onChange={(e) => {
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
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none ${formData.check_in && formData.property_id &&
                      new Date(formData.check_in + 'T00:00:00').getDay() !== ((properties.find(p => p.id === formData.property_id)?.check_in_day + 1) % 7)
                      ? 'border-amber-400 bg-amber-50' : 'border-pink-200 focus:border-pink-400'
                      }`}
                  />
                  {formData.check_in && formData.property_id && (
                    <p className="text-[10px] mt-1 font-bold text-pink-600 uppercase">
                      {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date(formData.check_in + 'T00:00:00').getDay()]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-pink-800 mb-2">Check-out *</label>
                  <input
                    type="date"
                    required
                    value={formData.check_out}
                    min={formData.check_in ? new Date(new Date(formData.check_in).getTime() + 86400000).toISOString().split('T')[0] : undefined}
                    onChange={(e) => setFormData({ ...formData, check_out: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none ${formData.check_out && formData.property_id &&
                      new Date(formData.check_out + 'T00:00:00').getDay() !== ((properties.find(p => p.id === formData.property_id)?.check_out_day + 1) % 7)
                      ? 'border-amber-400 bg-amber-50' : 'border-pink-200 focus:border-pink-400'
                      }`}
                  />
                  {formData.check_out && formData.property_id && (
                    <p className="text-[10px] mt-1 font-bold text-pink-600 uppercase">
                      {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date(formData.check_out + 'T00:00:00').getDay()]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-pink-800 mb-2">Total Huéspedes</label>
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
                      className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none pl-10"
                      readOnly
                    />
                    <Users className="w-5 h-5 text-pink-400 absolute left-3 top-3.5" />
                  </div>
                </div>
              </div>

              {/* Detalle de Huéspedes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-pink-800 mb-2">👨‍👩‍👧 Adultos *</label>
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
                    className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-pink-800 mb-2">👶 Niños</label>
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
                    className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-pink-800 mb-2">🐾 Mascotas</label>
                  <div className="flex items-center h-[50px]">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.pets}
                        onChange={(e) => setFormData(prev => ({ ...prev, pets: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-pink-500"></div>
                      <span className="ml-3 text-sm font-medium text-gray-700">{formData.pets ? 'Sí' : 'No'}</span>
                    </label>
                  </div>
                </div>
              </div>

              {formData.property_id && (
                <div className="bg-amber-100/50 p-3 rounded-xl border border-amber-200 flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  <p className="text-xs text-amber-800 font-medium">
                    Esta propiedad prefiere check-in los <b>{['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][properties.find(p => p.id === formData.property_id)?.check_in_day]}</b> y check-out los <b>{['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][properties.find(p => p.id === formData.property_id)?.check_out_day]}</b>.
                  </p>
                </div>
              )}
            </div>

            {/* Precios */}
            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-6">
              <h3 className="font-semibold text-emerald-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pagos y Valores
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-800 mb-2">Precio Total *</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.total_price_usd === 0 ? '' : formData.total_price_usd}
                      onChange={(e) => handleNumberChange('total_price_usd', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200 focus:border-emerald-400 focus:outline-none"
                      placeholder="0"
                    />
                    <select
                      value={formData.total_price_currency}
                      onChange={(e) => setFormData({ ...formData, total_price_currency: e.target.value })}
                      className="px-2 py-3 rounded-xl border-2 border-emerald-200 focus:border-emerald-400 focus:outline-none bg-white text-sm font-bold text-emerald-700"
                    >
                      <option value="USD">USD</option>
                      <option value="ARS">ARS</option>
                      <option value="EUR">EUR</option>
                      <option value="BRL">BRL</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-emerald-800 mb-2">Anticipo</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.advance_payment_usd === 0 ? '' : formData.advance_payment_usd}
                      onChange={(e) => handleNumberChange('advance_payment_usd', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200 focus:border-emerald-400 focus:outline-none"
                      placeholder="0"
                    />
                    <select
                      value={formData.advance_payment_currency}
                      onChange={(e) => setFormData({ ...formData, advance_payment_currency: e.target.value })}
                      className="px-2 py-3 rounded-xl border-2 border-emerald-200 focus:border-emerald-400 focus:outline-none bg-white text-sm font-bold text-emerald-700"
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
                    <label className="block text-sm font-medium text-blue-800 mb-2 flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      Tipo de Cambio
                      <span className="text-xs font-normal text-blue-600 ml-1">
                        (1 {formData.total_price_currency} = X {formData.advance_payment_currency})
                      </span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.exchange_rate === 0 ? '' : formData.exchange_rate}
                      onChange={(e) => handleNumberChange('exchange_rate', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-400 focus:outline-none bg-blue-50/50"
                      placeholder="Ej: 1200"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-emerald-800 mb-2">Depósito</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.deposit_ars === 0 ? '' : formData.deposit_ars}
                      onChange={(e) => handleNumberChange('deposit_ars', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-emerald-200 focus:border-emerald-400 focus:outline-none"
                      placeholder="0"
                    />
                    <select
                      value={formData.deposit_currency}
                      onChange={(e) => setFormData({ ...formData, deposit_currency: e.target.value })}
                      className="px-2 py-3 rounded-xl border-2 border-emerald-200 focus:border-emerald-400 focus:outline-none bg-white text-sm font-bold text-emerald-700"
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-purple-400 focus:outline-none bg-white"
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-purple-400 focus:outline-none bg-white"
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-border focus:border-purple-400 focus:outline-none bg-white"
                >
                  <option value="SERVICIOS">SERVICIOS</option>
                  <option value="NO SERVICIOS">NO SERVICIOS</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fixed Footer with Buttons */}
          <div className="flex gap-4 p-6 border-t border-gray-100 bg-white flex-none z-10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-border hover:bg-gray-50 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 font-medium transition-all shadow-lg"
            >
              {booking ? 'Actualizar' : 'Crear'} Reserva
            </button>
          </div>
        </form>
      </div >
    </div >
  );
};
