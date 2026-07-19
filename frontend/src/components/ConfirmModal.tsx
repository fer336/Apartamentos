import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './ui/Button';

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
        return { icon: 'bg-state-red/16', iconColor: 'text-state-red', button: 'primary' as const };
      case 'warning':
        return { icon: 'bg-state-yellow/16', iconColor: 'text-state-yellow', button: 'primary' as const };
      case 'info':
        return { icon: 'bg-state-blue/16', iconColor: 'text-state-blue', button: 'primary' as const };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface border border-border rounded-3xl max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-border-subtle">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl ${styles.icon} flex items-center justify-center flex-shrink-0`}>
              <AlertTriangle className={`w-6 h-6 ${styles.iconColor}`} strokeWidth={1.7} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-xl font-bold text-ink-primary mb-2">{title}</h3>
              <p className="text-ink-secondary text-sm leading-relaxed">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-surface-hover flex items-center justify-center transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 text-ink-secondary" strokeWidth={1.7} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={type === 'danger' ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
