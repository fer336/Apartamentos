import { Edit, Trash2, Mail, Phone, MessageCircle, Globe2, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { KanagawaCard } from './ui/KanagawaCard';
import { getEntityColor } from '../utils/entityColor';

export interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  document_type?: string;
  document_id?: string;
  whatsapp?: string;
  notes?: string;
  rating?: number | null;
}

export interface ClientStats {
  bookingsCount: number;
  lastBookingDate: string | null;
}

interface ClientCardProps {
  client: Client;
  stats?: ClientStats;
  onEdit?: (client: Client) => void;
  onDelete?: (client: Client) => void;
}

const getInitials = (name: string) =>
  name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase();

const formatLastVisit = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');
};

export const ClientCard = ({ client, stats, onEdit, onDelete }: ClientCardProps) => {
  const color = getEntityColor(client.id);
  const initial = getInitials(client.full_name);

  const contactRows: { icon: LucideIcon; value: string }[] = [
    client.whatsapp && { icon: MessageCircle, value: client.whatsapp },
    client.phone && { icon: Phone, value: client.phone },
    client.email && { icon: Mail, value: client.email },
  ].filter((row): row is { icon: LucideIcon; value: string } => Boolean(row));

  const hasContact = contactRows.length > 0;
  const staysLabel = stats?.bookingsCount === 1 ? 'Estadía' : 'Estadías';
  const lastVisitText = stats?.lastBookingDate ? formatLastVisit(stats.lastBookingDate) : '—';

  return (
    <KanagawaCard tone="violet" padded={false} className="flex flex-col h-full overflow-hidden">
      <div className="p-[18px] flex-1 flex flex-col">
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-[11px] ${color.solid} flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0`}>
            {initial}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-extrabold text-ink-primary leading-tight truncate">
              {client.full_name}
            </h3>
            {hasContact ? (
              <div className="mt-1.5 space-y-1">
                {contactRows.map(({ icon: Icon, value }) => (
                  <p key={Icon.name} className="text-xs text-ink-secondary flex items-center gap-1.5 truncate">
                    <Icon className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" strokeWidth={1.7} />
                    <span className="truncate">{value}</span>
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-1.5 text-xs text-ink-muted">Sin contacto registrado</p>
            )}
          </div>

          {typeof client.rating === 'number' && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-violet text-primary text-xs font-bold flex-shrink-0">
              <Star className="w-3 h-3" strokeWidth={1.7} />
              {client.rating}
            </span>
          )}
        </div>

        {client.nationality && (
          <p className="mt-3 text-xs text-ink-secondary flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" strokeWidth={1.7} />
            {client.nationality}
          </p>
        )}

        <div className="mt-auto pt-4 flex items-stretch divide-x divide-border-subtle">
          <div className="flex-1 pr-4">
            <p className="font-display text-2xl font-extrabold text-ink-primary leading-none">
              {stats?.bookingsCount ?? 0}
            </p>
            <p className="text-[10px] text-ink-muted uppercase font-bold tracking-wide mt-1">{staysLabel}</p>
          </div>
          <div className="flex-1 pl-4">
            <p className="font-display text-sm font-extrabold text-ink-primary leading-tight">{lastVisitText}</p>
            <p className="text-[10px] text-ink-muted uppercase font-bold tracking-wide mt-1">Última visita</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-t border-border-subtle p-3">
        <button
          onClick={() => onEdit?.(client)}
          disabled={!onEdit}
          title="Editar"
          className="flex-1 px-3 py-2 bg-surface-violet hover:bg-surface-hover text-primary rounded-[10px] font-semibold text-sm transition-colors duration-fast ease-kanagawa flex items-center justify-center gap-1.5 disabled:opacity-40"
        >
          <Edit className="w-4 h-4" strokeWidth={1.7} />
          Editar
        </button>
        <button
          onClick={() => onDelete?.(client)}
          disabled={!onDelete}
          title="Eliminar"
          className="px-3 py-2 bg-[rgba(166,77,69,0.14)] hover:bg-[rgba(166,77,69,0.24)] text-state-red-strong rounded-[10px] transition-colors duration-fast ease-kanagawa flex items-center justify-center disabled:opacity-40"
        >
          <Trash2 className="w-4 h-4" strokeWidth={1.7} />
        </button>
      </div>
    </KanagawaCard>
  );
};