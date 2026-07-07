import React, { useState } from 'react';
import { X, LogOut, MessageSquare, AlertTriangle, CheckCircle, ThumbsDown, ThumbsUp } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (checkoutData: any) => void;
  booking: any;
}

const TAGS = [
  { id: 'clean', label: 'Limpio', icon: ThumbsUp, color: 'bg-green-100 text-green-700' },
  { id: 'dirty', label: 'Sucio', icon: ThumbsDown, color: 'bg-amber-100 text-amber-700' },
  { id: 'noisy', label: 'Ruidoso', icon: AlertTriangle, color: 'bg-red-100 text-red-700' },
  { id: 'broken', label: 'Roturas', icon: X, color: 'bg-red-100 text-red-700' },
  { id: 'perfect', label: 'Impecable', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700' },
  { id: 'heavy', label: 'Pesado', icon: ThumbsDown, color: 'bg-orange-100 text-orange-700' },
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
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-white/20 rounded-xl">
              <LogOut className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">Finalizar Estadía</h2>
          </div>
          <p className="text-violet-50 opacity-90">
            Checkout de {booking.client_name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Alerta de Depósito */}
          {booking.deposit_ars > 0 && (
            <div className={`border-2 rounded-2xl p-4 flex items-center gap-4 transition-all ${depositReturned ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${depositReturned ? 'bg-green-100' : 'bg-amber-100'}`}>
                💰
              </div>
              <div className="flex-1">
                <h4 className={`font-bold ${depositReturned ? 'text-green-800' : 'text-amber-800'}`}>
                  Depósito: ${booking.deposit_ars?.toLocaleString()} ARS
                </h4>
                <label className="flex items-center gap-2 mt-1 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={depositReturned}
                    onChange={(e) => setDepositReturned(e.target.checked)}
                    className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
                  />
                  <span className="text-sm text-gray-600 font-medium">Marcar como devuelto</span>
                </label>
              </div>
            </div>
          )}

          {/* Tags de Comportamiento */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">
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
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all border-2 ${
                      isSelected 
                        ? `${tag.color} border-current` 
                        : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notas Adicionales */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Notas / Observaciones
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-violet-400 focus:bg-white transition-all text-gray-700 font-medium"
              rows={3}
              placeholder="Detalles sobre roturas, limpieza, o comentarios positivos..."
            />
          </div>

          <button
            type="submit"
            disabled={booking.deposit_ars > 0 && !depositReturned}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                booking.deposit_ars > 0 && !depositReturned
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-200'
            }`}
          >
            Confirmar Checkout <CheckCircle className="w-5 h-5" />
          </button>

        </form>
      </div>
    </div>
  );
};

