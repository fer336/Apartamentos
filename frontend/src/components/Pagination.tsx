import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border-subtle bg-surface-elevated">
      <span className="text-xs font-medium text-ink-secondary">
        Página {currentPage} de {totalPages}
      </span>
      <div className="flex items-center rounded-[10px] border border-border bg-surface overflow-hidden">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 hover:bg-surface-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <ChevronLeft className="w-4 h-4 text-primary" strokeWidth={1.7} />
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 hover:bg-surface-hover transition-colors border-l border-border disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <ChevronRight className="w-4 h-4 text-primary" strokeWidth={1.7} />
        </button>
      </div>
    </div>
  );
};
