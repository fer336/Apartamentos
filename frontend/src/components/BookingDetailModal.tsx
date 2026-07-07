import { X, LogOut, DollarSign, Edit, Trash2 } from 'lucide-react';

interface DetailBooking {
  id: string;
  booking_number: string;
  check_in: string;
  check_out: string;
  status: string;
  guests_count: number;
  total_price_usd: number;
  advance_payment_usd?: number;
  left_to_pay_usd?: number;
  property_name?: string;
  client_name?: string;
}

interface BookingDetailModalProps {
  isOpen: boolean;
  booking: DetailBooking | null;
  onClose: () => void;
  onCheckout: (booking: DetailBooking) => void;
  onSettle: (booking: DetailBooking) => void;
  onEdit: (booking: DetailBooking) => void;
  onDelete: (booking: DetailBooking) => void;
  getStatusColor: (status: string) => string;
}

const formatDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  isOpen,
  booking,
  onClose,
  onCheckout,
  onSettle,
  onEdit,
  onDelete,
  getStatusColor,
}) => {
  if (!isOpen || !booking) return null;

  const leftToPay = booking.left_to_pay_usd || 0;
  const isFullyPaid = leftToPay <= 0;
  const isCompleted = booking.status === 'completed';
  const canCheckout = !isCompleted && booking.status !== 'cancelled';
  const canSettle = !isFullyPaid && !isCompleted;

  return (
    <div
      className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[100] flex items-start justify-center overflow-y-auto p-6 md:p-11 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[20px] max-w-[500px] w-full shadow-[0_30px_80px_rgba(18,19,37,0.4)] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header oscuro */}
        <div className="relative bg-gradient-to-br from-[#3a2459] to-[#26173e] p-6 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <p className="font-mono text-xs text-[#c3abdf] mb-2 relative z-10">{booking.booking_number}</p>
          <h3 className="font-display text-2xl font-extrabold text-white mb-1 pr-10 relative z-10">{booking.client_name}</h3>
          <p className="text-sm text-[#c9bce0] mb-3 relative z-10">
            {booking.property_name} · {booking.guests_count} huésped{booking.guests_count === 1 ? '' : 'es'}
          </p>
          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border relative z-10 ${getStatusColor(booking.status)}`}>
            {booking.status}
          </span>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#faf8fd] border border-[#eee5f6] rounded-xl p-3">
              <p className="text-[10px] font-bold text-[#9583b3] uppercase tracking-wider mb-1">Check-in</p>
              <p className="font-display text-sm font-bold text-[#121325]">{formatDate(booking.check_in)}</p>
            </div>
            <div className="bg-[#faf8fd] border border-[#eee5f6] rounded-xl p-3">
              <p className="text-[10px] font-bold text-[#9583b3] uppercase tracking-wider mb-1">Check-out</p>
              <p className="font-display text-sm font-bold text-[#121325]">{formatDate(booking.check_out)}</p>
            </div>
          </div>

          <div className="border border-[#eee5f6] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#eee5f6]">
              <span className="text-sm text-[#7b6b95]">Precio total</span>
              <span className="font-display font-bold text-[#121325]">U$D {booking.total_price_usd.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#eee5f6]">
              <span className="text-sm text-[#7b6b95]">Anticipo pagado</span>
              <span className="font-display font-bold text-[#2f8f4e]">U$D {(booking.advance_payment_usd || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[#7b6b95]">Saldo pendiente</span>
              {isFullyPaid ? (
                <span className="font-display font-bold text-[#7b6b95]">Pagado</span>
              ) : (
                <span className="font-display font-bold text-[#c2410c]">U$D {leftToPay.toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap gap-2 px-6 py-4 bg-[#faf8fd] border-t border-[#eee5f6]">
          {canCheckout && (
            <button
              onClick={() => onCheckout(booking)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[11px] border border-[#e0d7ef] bg-white text-violet-600 font-semibold text-sm hover:bg-violet-50 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Checkout
            </button>
          )}
          {canSettle && (
            <button
              onClick={() => onSettle(booking)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[11px] border border-[#e0d7ef] bg-white text-emerald-600 font-semibold text-sm hover:bg-emerald-50 transition-colors"
            >
              <DollarSign className="w-4 h-4" /> Cobrar saldo
            </button>
          )}
          <button
            onClick={() => onEdit(booking)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[11px] border border-[#e0d7ef] bg-white text-blue-600 font-semibold text-sm hover:bg-blue-50 transition-colors"
          >
            <Edit className="w-4 h-4" /> Editar
          </button>
          <button
            onClick={() => onDelete(booking)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[11px] border border-[#e0d7ef] bg-white text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors ml-auto"
          >
            <Trash2 className="w-4 h-4" /> Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};
