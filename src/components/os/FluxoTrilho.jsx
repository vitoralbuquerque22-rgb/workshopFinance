import { Fragment } from 'react';
import { etapasFluxo } from '@/lib/osFluxo';

// Trilho horizontal: ícone de cada etapa com badge de quantas OS estão paradas nela.
export default function FluxoTrilho({ contagem, etapaSelecionada, onSelect }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-center min-w-max">
        {etapasFluxo.map((etapa, idx) => {
          const qtd = contagem[etapa.key] || 0;
          const active = etapaSelecionada === etapa.key;
          const Icon = etapa.icon;
          return (
            <Fragment key={etapa.key}>
              <button
                onClick={() => onSelect(active ? null : etapa.key)}
                className="flex flex-col items-center gap-1.5 px-1 group"
              >
                <div className="relative">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    active ? 'bg-primary border-primary text-primary-foreground' :
                    qtd > 0 ? 'bg-primary/10 border-primary/30 text-primary group-hover:border-primary/60' :
                    'bg-muted border-border text-muted-foreground group-hover:border-primary/40'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {qtd > 0 && (
                    <span className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold ${active ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground'}`}>
                      {qtd}
                    </span>
                  )}
                </div>
                <span className={`text-[11px] font-medium text-center leading-tight w-16 ${active ? 'text-primary' : qtd > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {etapa.label}
                </span>
              </button>
              {idx < etapasFluxo.length - 1 && (
                <div className="h-0.5 w-6 shrink-0 -mt-5 bg-border" />
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}