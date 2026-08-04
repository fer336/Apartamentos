import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { getEntityColor } from '../utils/entityColor';

interface ClientPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (client: any) => void;
  clients: any[];
}

const getInitials = (name: string) =>
  name.split(' ').map((word: string) => word[0]).slice(0, 2).join('').toUpperCase();

export const ClientPickerModal = ({ isOpen, onClose, onSelect, clients }: ClientPickerModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      const timer = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      (c.full_name || '').toLowerCase().includes(q) ||
      (c.whatsapp || '').toLowerCase().includes(q)
    );
  }, [clients, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-3xl max-w-lg w-full max-h-[80vh] flex flex-col animate-in zoom-in duration-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-surface border-b border-border-subtle p-6 flex items-center justify-between flex-none">
          <h2 className="font-display text-2xl font-bold text-ink-primary">Seleccionar Cliente</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-surface-hover flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-ink-secondary" strokeWidth={1.7} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 pb-2 flex-none">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" strokeWidth={1.7} />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o WhatsApp…"
              className="form-control w-full pl-10 pr-4 py-3 focus:outline-none"
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2 space-y-2 max-h-[50vh]">
          {clients.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-8">
              No hay clientes registrados. Cargá un cliente primero.
            </p>
          ) : filteredClients.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-8">Sin resultados</p>
          ) : (
            filteredClients.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => onSelect(client)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-hover transition-colors duration-fast ease-kanagawa text-left"
              >
                <div
                  className={`w-10 h-10 rounded-[11px] ${getEntityColor(client.id).solid} flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0`}
                >
                  {getInitials(client.full_name || '')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-primary truncate">{client.full_name}</p>
                  {client.whatsapp && (
                    <p className="text-xs text-ink-secondary truncate">
                      {client.whatsapp}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
