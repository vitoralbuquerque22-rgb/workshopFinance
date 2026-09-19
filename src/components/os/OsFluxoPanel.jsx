import { useMemo, useState } from 'react';
import FluxoTrilho from './FluxoTrilho';
import FluxoFunil from './FluxoFunil';
import { etapasFluxo, etapaFluxoLabel } from '@/lib/osFluxo';
import { formatCurrency } from '@/lib/format';
import { ChevronRight } from 'lucide-react';

// Etapas finais/encerradas — não representam carro "parado" na oficina.
const ENCERRADAS = ['pos_venda'];

const diasParado = (os) => {
  const ref = os.updated_date || os.data_abertura || os.created_date;
  if (!ref) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(ref).getTime()) / 86400000));
};

export default function OsFluxoPanel({ ordens, clienteNome, veiculoInfo, onOpen }) {
  const [etapaSelecionada, setEtapaSelecionada] = useState(null);

  // Considera apenas OS ativas na oficina (não canceladas / não pós-venda).
  const ativas = useMemo(
    () => ordens.filter(o => o.status !== 'cancelado' && !ENCERRADAS.includes(o.etapa_fluxo || 'recepcao')),
    [ordens]
  );

  const contagem = useMemo(() => {
    const acc = {};
    for (const o of ativas) {
      const et = etapasFluxo.some(e => e.key === o.etapa_fluxo) ? o.etapa_fluxo : 'recepcao';
      acc[et] = (acc[et] || 0) + 1;
    }
    return acc;
  }, [ativas]);

  const listaEtapa = useMemo(() => {
    if (!etapaSelecionada) return [];
    return ativas
      .filter(o => (etapasFluxo.some(e => e.key === o.etapa_fluxo) ? o.etapa_fluxo : 'recepcao') === etapaSelecionada)
      .sort((a, b) => diasParado(b) - diasParado(a));
  }, [ativas, etapaSelecionada]);

  const totalAtivas = ativas.length;

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Fluxo da oficina</h3>
          <span className="text-xs text-muted-foreground">{totalAtivas} OS ativas · clique numa etapa para ver a lista</span>
        </div>
        <FluxoTrilho contagem={contagem} etapaSelecionada={etapaSelecionada} onSelect={setEtapaSelecionada} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Funil por etapa</h3>
          <FluxoFunil contagem={contagem} etapaSelecionada={etapaSelecionada} onSelect={setEtapaSelecionada} />
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">
            {etapaSelecionada ? `OS em "${etapaFluxoLabel(etapaSelecionada)}"` : 'Detalhe da etapa'}
          </h3>
          {!etapaSelecionada ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Selecione uma etapa no trilho ou no funil para ver os veículos parados nela.</p>
          ) : listaEtapa.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma OS nesta etapa.</p>
          ) : (
            <div className="space-y-1.5 max-h-[360px] overflow-y-auto">
              {listaEtapa.map(os => {
                const dias = diasParado(os);
                const alerta = dias >= 5;
                const atencao = dias >= 2 && dias < 5;
                return (
                  <button
                    key={os.id}
                    onClick={() => onOpen(os)}
                    className="w-full flex items-center gap-3 rounded-md border border-border px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{os.numero || 'OS'}</span>
                        <span className="text-xs text-muted-foreground truncate">{clienteNome(os.cliente_id)}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground truncate block">{veiculoInfo(os.veiculo_id)}</span>
                    </div>
                    {os.valor_total ? <span className="text-xs tabular-nums text-muted-foreground shrink-0">{formatCurrency(os.valor_total)}</span> : null}
                    <span className={`text-[11px] font-medium tabular-nums shrink-0 w-16 text-right ${alerta ? 'text-destructive' : atencao ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      {dias === 0 ? 'hoje' : `${dias}d parado`}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}