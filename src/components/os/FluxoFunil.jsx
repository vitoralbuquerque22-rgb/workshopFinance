import { etapasFluxo } from '@/lib/osFluxo';

// Funil: uma barra por etapa, largura proporcional à quantidade de OS ativas nela.
export default function FluxoFunil({ contagem, etapaSelecionada, onSelect }) {
  const max = Math.max(1, ...etapasFluxo.map(e => contagem[e.key] || 0));

  return (
    <div className="space-y-1.5">
      {etapasFluxo.map((etapa) => {
        const qtd = contagem[etapa.key] || 0;
        const pct = Math.round((qtd / max) * 100);
        const active = etapaSelecionada === etapa.key;
        const Icon = etapa.icon;
        return (
          <button
            key={etapa.key}
            onClick={() => onSelect(active ? null : etapa.key)}
            className={`w-full flex items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors ${active ? 'bg-primary/5 ring-1 ring-primary/30' : 'hover:bg-muted/50'}`}
          >
            <div className="flex items-center gap-2 w-44 shrink-0">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium truncate">{etapa.label}</span>
            </div>
            <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
              <div
                className={`h-full rounded transition-all ${qtd === 0 ? '' : active ? 'bg-primary' : 'bg-primary/60'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-semibold w-8 text-right tabular-nums">{qtd}</span>
          </button>
        );
      })}
    </div>
  );
}