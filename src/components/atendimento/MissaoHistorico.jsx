import { formatDateTime } from '@/lib/format';
import { History } from 'lucide-react';

export default function MissaoHistorico({ historico = [] }) {
  const ordenado = [...historico].sort((a, b) => new Date(b.data) - new Date(a.data));

  if (!ordenado.length) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Nenhum evento registrado.</p>;
  }

  return (
    <div className="space-y-3">
      {ordenado.map((ev, i) => (
        <div key={i} className="flex gap-3">
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
            <History className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="flex-1 pb-2 border-b border-border/60">
            <p className="text-sm font-medium">{ev.descricao}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(ev.data)} · {ev.usuario || 'Sistema'}</p>
          </div>
        </div>
      ))}
    </div>
  );
}