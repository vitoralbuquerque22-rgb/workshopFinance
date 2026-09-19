import React from 'react';
import { formatDateTime } from '@/lib/format';
import { etapaFluxoLabel } from '@/lib/osFluxo';
import { Circle } from 'lucide-react';

export default function OsTimeline({ timeline = [] }) {
  const ordered = [...timeline].sort((a, b) => new Date(b.data) - new Date(a.data));
  if (ordered.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>;
  }
  return (
    <div className="space-y-0">
      {ordered.map((ev, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <Circle className="w-3 h-3 fill-primary text-primary mt-1.5" />
            {i < ordered.length - 1 && <div className="w-0.5 flex-1 bg-border my-1" />}
          </div>
          <div className="pb-4 flex-1">
            <p className="text-sm font-medium">{etapaFluxoLabel(ev.etapa)}</p>
            {ev.descricao && <p className="text-sm text-muted-foreground">{ev.descricao}</p>}
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {formatDateTime(ev.data)} {ev.usuario ? `• ${ev.usuario}` : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}