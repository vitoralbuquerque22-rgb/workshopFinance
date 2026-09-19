import { RotateCcw } from 'lucide-react';
import { RETRABALHO_BADGE, tipoRetrabalho } from '@/lib/retrabalho';

export default function RetrabalhoBadge({ os }) {
  const tipo = tipoRetrabalho(os);
  const cfg = RETRABALHO_BADGE[tipo];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}>
      <RotateCcw className="w-3 h-3" /> {cfg.label}
    </span>
  );
}