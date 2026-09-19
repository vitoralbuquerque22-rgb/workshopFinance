import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import CronometroItem from '@/components/os/CronometroItem';
import { comparativoHoras, pausasOs, pausasProducao, valorRealHora, motivoPausaLabel } from '@/lib/apontamentoHoras';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { Timer, TrendingUp, Pause, Wrench } from 'lucide-react';

// Itens que consomem mão de obra (têm horas vendidas / cronômetro faz sentido)
const itemApontavel = (it) => it.tipo === 'servico' || it.tipo === 'mao_obra' || it.tipo === 'servico_composto';

export default function ApontamentoHorasPanel({ os, colaboradores = [], onUpdate }) {
  const comp = comparativoHoras(os);
  const pausas = [...pausasProducao(os), ...pausasOs(os)];
  const vHora = valorRealHora(os);

  const updateItemSessoes = (itemIndex, sessoes) => {
    const itens = (os.itens || []).map((it, i) => (i === itemIndex ? { ...it, sessoes } : it));
    onUpdate({ itens });
  };

  const itensMO = (os.itens || []).map((it, i) => ({ it, i })).filter(({ it }) => itemApontavel(it));

  return (
    <div className="space-y-4">
      {/* Comparativo horas vendidas × executadas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="py-3"><p className="text-[11px] text-muted-foreground flex items-center gap-1"><Timer className="w-3 h-3" /> Horas vendidas</p><p className="text-xl font-bold">{comp.vendidas.toFixed(2)}h</p></CardContent></Card>
        <Card><CardContent className="py-3"><p className="text-[11px] text-muted-foreground flex items-center gap-1"><Wrench className="w-3 h-3" /> Horas executadas</p><p className="text-xl font-bold">{comp.executadas.toFixed(2)}h</p></CardContent></Card>
        <Card><CardContent className="py-3"><p className="text-[11px] text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Desvio</p><p className={`text-xl font-bold ${comp.desvio > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{comp.desvio > 0 ? '+' : ''}{comp.desvio.toFixed(2)}h</p><p className="text-[10px] text-muted-foreground">Eficiência {comp.eficiencia}%</p></CardContent></Card>
        <Card><CardContent className="py-3"><p className="text-[11px] text-muted-foreground">Valor real da hora</p><p className="text-xl font-bold text-primary">{formatCurrency(vHora)}</p><p className="text-[10px] text-muted-foreground">serviços ÷ h executadas</p></CardContent></Card>
      </div>

      {/* Cronômetro por item de mão de obra */}
      <div>
        <p className="text-sm font-medium mb-2">Apontamento por item</p>
        {itensMO.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum item de serviço/mão de obra nesta OS para apontar horas.</p>
        ) : (
          <div className="space-y-3">
            {itensMO.map(({ it, i }) => (
              <Card key={i}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{it.descricao || 'Item'}</p>
                    <span className="text-[11px] text-muted-foreground shrink-0">vendidas: {((Number(it.horas_vendidas) || 0) * (Number(it.quantidade) || 1)).toFixed(2)}h</span>
                  </div>
                  <CronometroItem item={it} itemIndex={i} colaboradores={colaboradores} onChange={updateItemSessoes} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pausas justificadas */}
      {pausas.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2 flex items-center gap-1"><Pause className="w-3.5 h-3.5" /> Pausas registradas</p>
          <div className="space-y-1.5">
            {pausas.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-xs rounded-md border bg-amber-50/50 px-2.5 py-1.5">
                <span className="font-medium text-amber-700">{motivoPausaLabel(p.motivo)}</span>
                {p.observacao && <span className="text-muted-foreground">— {p.observacao}</span>}
                <span className="text-muted-foreground">· {p.colaborador || '—'} · {p.item}</span>
                <span className="ml-auto text-muted-foreground">{p.minutos} min</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}