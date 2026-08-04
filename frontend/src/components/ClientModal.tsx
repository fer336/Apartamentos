import React, { useState, useEffect } from 'react';
import { X, LogOut, CalendarClock } from 'lucide-react';
import { Button } from './ui/Button';

interface ClientBooking {
  id: string;
  status: string;
  check_in: string;
  check_out: string;
  booking_number?: string;
  property_name?: string;
  checkout_notes?: string;
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: any) => void;
  client?: any;
  bookings?: ClientBooking[];
}

const formatDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  active: 'Activa',
  completed: 'Finalizada',
  cancelled: 'Cancelada',
};

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  client,
  bookings = [],
}) => {
  const [activeTab, setActiveTab] = useState<'data' | 'history'>('data');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    whatsapp: '',
    notes: '',
  });

  useEffect(() => {
    if (client) {
      setFormData({
        full_name: client.full_name || '',
        email: client.email || '',
        whatsapp: client.whatsapp || '',
        notes: client.notes || '',
      });
    } else {
      setFormData({
        full_name: '',
        email: '',
        whatsapp: '',
        notes: '',
      });
    }
    setActiveTab('data');
  }, [client, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  const stays = [...bookings].sort((a, b) => b.check_in.localeCompare(a.check_in));
  const staysWithNotes = stays.filter((b) => b.checkout_notes);

  return (
    <div className="fixed inset-x-0 top-0 bottom-28 lg:bottom-0 bg-black/50 flex items-end lg:items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-3xl max-w-2xl w-full max-h-[calc(100dvh-140px)] lg:max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border-subtle p-6 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="font-display text-2xl font-bold text-ink-primary">
            {client ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-surface-hover flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-ink-secondary" strokeWidth={1.7} />
          </button>
        </div>

        {client && (
          <div className="px-6 pt-4">
            <div className="inline-flex bg-surface-violet rounded-xl p-1">
              {([
                { id: 'data', label: 'Datos' },
                { id: 'history', label: `Historial${staysWithNotes.length > 0 ? ` · ${staysWithNotes.length}` : ''}` },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-fast ease-kanagawa ${
                    activeTab === tab.id ? 'bg-surface text-cta shadow-sm' : 'text-ink-muted hover:text-cta'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && client ? (
          <div className="p-6 space-y-3">
            {stays.length === 0 ? (
              <p className="text-sm text-ink-muted text-center py-8">Este cliente todavía no tiene estadías registradas.</p>
            ) : (
              stays.map((b) => (
                <div key={b.id} className="border border-border-subtle rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-ink-primary">
                      <CalendarClock className="w-4 h-4 text-ink-muted" strokeWidth={1.7} />
                      {formatDate(b.check_in)} → {formatDate(b.check_out)}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">{STATUS_LABELS[b.status] || b.status}</span>
                  </div>
                  <p className="text-xs text-ink-secondary mb-2">
                    {b.property_name}{b.booking_number ? ` · ${b.booking_number}` : ''}
                  </p>
                  {b.checkout_notes ? (
                    <div className="flex items-start gap-2 bg-surface-elevated border border-border-subtle rounded-lg p-3">
                      <LogOut className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" strokeWidth={1.7} />
                      <div>
                        <p className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">Observaciones de checkout</p>
                        <p className="text-sm text-ink-primary">{b.checkout_notes}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-ink-muted italic">Sin observaciones de checkout registradas.</p>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-primary mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="form-control w-full px-4 py-3 focus:outline-none"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-primary mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-control w-full px-4 py-3 focus:outline-none"
                    placeholder="juan@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-primary mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="form-control w-full px-4 py-3 focus:outline-none"
                    placeholder="+54 9 11 ..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-primary mb-2">
                  Notas
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="form-control w-full px-4 py-3 focus:outline-none resize-none"
                  placeholder="Preferencias, observaciones..."
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-border-subtle sticky bottom-0 bg-surface -mx-6 -mb-6 px-6 pb-6">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" variant="primary" className="flex-1">
                {client ? 'Actualizar' : 'Crear'} Cliente
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
