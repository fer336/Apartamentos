import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'bg-red-100',
          iconColor: 'text-red-600',
          button: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600',
        };
      case 'warning':
        return {
          icon: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          button: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600',
        };
      case 'info':
        return {
          icon: 'bg-blue-100',
          iconColor: 'text-blue-600',
          button: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b-2 border-gray-100">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl ${styles.icon} flex items-center justify-center flex-shrink-0`}>
              <AlertTriangle className={`w-6 h-6 ${styles.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl border-2 border-border hover:bg-gray-50 font-medium transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-6 py-3 rounded-xl ${styles.button} text-white font-medium transition-all shadow-lg`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

