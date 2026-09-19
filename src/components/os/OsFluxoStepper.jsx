import React from 'react';
import { etapasFluxo, etapaIndex } from '@/lib/osFluxo';
import { Check } from 'lucide-react';

export default function OsFluxoStepper({ etapaAtual, onSelect }) {
  const currentIdx = etapaIndex(etapaAtual || 'recepcao');

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-center min-w-max">
        {etapasFluxo.map((etapa, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          const Icon = etapa.icon;
          return (
            <React.Fragment key={etapa.key}>
              <button
                onClick={() => onSelect?.(etapa.key)}
                className="flex flex-col items-center gap-1.5 px-1 group"
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  active ? 'bg-primary border-primary text-primary-foreground' :
                  done ? 'bg-emerald-500 border-emerald-500 text-white' :
                  'bg-muted border-border text-muted-foreground group-hover:border-primary/50'
                }`}>
                  {done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-[11px] font-medium text-center leading-tight w-16 ${active ? 'text-primary' : done ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                  {etapa.label}
                </span>
              </button>
              {idx < etapasFluxo.length - 1 && (
                <div className={`h-0.5 w-6 shrink-0 -mt-5 ${idx < currentIdx ? 'bg-emerald-500' : 'bg-border'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}