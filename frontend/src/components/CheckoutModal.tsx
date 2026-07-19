import React, { useState } from 'react';
import { X, LogOut, MessageSquare, AlertTriangle, CheckCircle, ThumbsDown, ThumbsUp } from 'lucide-react';
import { Button } from './ui/Button';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (checkoutData: any) => void;
  booking: any;
}

const TAGS = [
  { id: 'clean', label: 'Limpio', icon: ThumbsUp, color: 'bg-state-green/16 text-state-green-strong' },
  { id: 'dirty', label: 'Sucio', icon: ThumbsDown, color: 'bg-state-yellow/16 text-state-yellow' },
  { id: 'noisy', label: 'Ruidoso', icon: AlertTriangle, color: 'bg-state-red/16 text-state-red' },
  { id: 'broken', label: 'Roturas', icon: X, color: 'bg-state-red/16 text-state-red' },
  { id: 'perfect', label: 'Impecable', icon: CheckCircle, color: 'bg-state-green/16 text-state-green-strong' },
  { id: 'heavy', label: 'Pesado', icon: ThumbsDown, color: 'bg-state-orange/16 text-state-orange' },
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  booking,
}) => {
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [depositReturned, setDepositReturned] = useState(false);

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Construir la nota final con los labels en español
    const tagsLabels = selectedTags
      .map(tagId => TAGS.find(t => t.id === tagId)?.label)
      .filter(Boolean)
      .join(', ');

    const finalNotes = tagsLabels && notes
      ? `${tagsLabels}: ${notes}`.trim()
      : (tagsLabels || notes).trim();

    onConfirm({
      status: 'completed',
      checkout_notes: finalNotes
    });
  };

  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface border border-border rounded-3xl max-w-lg w-full shadow-2xl animate-in zoom-in duration-200 overflow-hidden">

        {/* Header */}
        <div
          className="p-6 text-white relative"
          style={{ background: 'linear-gradient(145deg, var(--primary-hover), var(--primary))' }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.7} />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-white/20 rounded-xl">
              <LogOut className="w-6 h-6" strokeWidth={1.7} />
            </div>
            <h2 className="font-display text-2xl font-bold">Finalizar Estadía</h2>
          </div>
          <p className="text-white/80">
            Checkout de {booking.client_name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Alerta de Depósito */}
          {booking.deposit_ars > 0 && (
            <div className={`border rounded-2xl p-4 flex items-center gap-4 transition-all ${depositReturned ? 'bg-state-green/12 border-state-green/28' : 'bg-state-yellow/12 border-state-yellow/28'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${depositReturned ? 'bg-state-green/16' : 'bg-state-yellow/16'}`}>
                💰
              </div>
              <div className="flex-1">
                <h4 className={`font-bold ${depositReturned ? 'text-state-green-strong' : 'text-state-yellow'}`}>
                  Depósito: ${booking.deposit_ars?.toLocaleString()} ARS
                </h4>
                <label className="flex items-center gap-2 mt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={depositReturned}
                    onChange={(e) => setDepositReturned(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <span className="text-sm text-ink-secondary font-medium">Marcar como devuelto</span>
                </label>
              </div>
            </div>
          )}

          {/* Tags de Comportamiento */}
          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase mb-3">
              ¿Cómo dejaron el departamento?
            </label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag.id);
                const Icon = tag.icon;
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all border ${
                      isSelected
                        ? `${tag.color} border-current`
                        : 'bg-surface-elevated text-ink-muted border-transparent hover:bg-surface-hover'
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.7} />
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notas Adicionales */}
          <div>
            <label className="block text-xs font-bold text-ink-muted uppercase mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" strokeWidth={1.7} /> Notas / Observaciones
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-control w-full p-4 focus:outline-none"
              rows={3}
              placeholder="Detalles sobre roturas, limpieza, o comentarios positivos..."
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={booking.deposit_ars > 0 && !depositReturned}
            className="w-full py-3.5 text-base"
          >
            Confirmar Checkout <CheckCircle className="w-5 h-5" strokeWidth={1.7} />
          </Button>

        </form>
      </div>
    </div>
  );
};
