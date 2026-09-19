import React from 'react';
import { fluxoCompras } from '@/lib/compras';
import { ChevronRight } from 'lucide-react';

export default function FluxoCompras() {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-4">
      {fluxoCompras.map((etapa, i) => (
        <React.Fragment key={etapa}>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground whitespace-nowrap">{etapa}</span>
          {i < fluxoCompras.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
        </React.Fragment>
      ))}
    </div>
  );
}