import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, RefreshCw, Gauge, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { formatarMinutos } from '@/lib/atendimentoExterno';
import { calcularCustosMissao, bgMargem } from '@/lib/custosOperacionais';

// Uma linha do dashboard: mostra receita/custo/margem e permite editar KM e despesas
// variáveis, recalculando (o backend atualiza o financeiro).
export default function MissaoCustoRow({ missao, config, onChanged }) {
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [km, setKm] = useState(missao.km_percorrido || 0);
  const [pedagio, setPedagio] = useState(missao.custos?.pedagio ?? config?.valor_pedagio ?? 0);
  const [alimentacao, setAlimentacao] = useState(missao.custos?.alimentacao ?? config?.valor_alimentacao ?? 0);
  const [hospedagem, setHospedagem] = useState(missao.custos?.hospedagem ?? config?.valor_hospedagem ?? 0);

  const c = missao.custos || {};
  // Prévia ao vivo enquanto edita
  const previa = calcularCustosMissao(
    { ...missao, km_percorrido: km, custos: { pedagio, alimentacao, hospedagem } },
    config
  );

  const recalcular = async () => {
    setSalvando(true);
    // Persiste os campos editados na missão e dispara o cálculo no backend (financeiro).
    await base44.entities.MissaoOperacional.update(missao.id, {
      km_percorrido: Number(km) || 0,
      custos: { ...(missao.custos || {}), pedagio: Number(pedagio) || 0, alimentacao: Number(alimentacao) || 0, hospedagem: Number(hospedagem) || 0 },
    });
    await base44.functions.invoke('manageCustos', { action: 'calcular', missao_id: missao.id });
    setSalvando(false);
    onChanged?.();
  };

  return (
    <div className="rounded-lg border">
      <button className="w-full flex items-center gap-3 p-3 text-left" onClick={() => setAberto((a) => !a)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{missao.numero || missao.titulo}</span>
            {c.calculado_em && <Badge className={`text-[10px] ${bgMargem(c.margem)}`}>{(Number(c.margem) || 0).toFixed(0)}%</Badge>}
          </div>
          <p className="text-xs text-muted-foreground truncate">{missao.cliente_nome || missao.titulo}</p>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-right shrink-0">
          <div><p className="text-[10px] text-muted-foreground">Receita</p><p className="text-sm font-semibold">{formatCurrency(c.receita || 0)}</p></div>
          <div><p className="text-[10px] text-muted-foreground">Custo</p><p className="text-sm font-semibold text-red-600">{formatCurrency(c.custo_total || 0)}</p></div>
          <div><p className="text-[10px] text-muted-foreground">Lucro</p><p className={`text-sm font-semibold ${(c.rentabilidade || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(c.rentabilidade || 0)}</p></div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <div className="border-t p-3 space-y-3 bg-muted/20">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs flex items-center gap-1"><Gauge className="w-3 h-3" />KM percorrido</Label>
              <Input type="number" min="0" step="1" className="mt-1 h-8" value={km} onChange={(e) => setKm(e.target.value)} />
            </div>
            <div><Label className="text-xs">Pedágio (R$)</Label><Input type="number" min="0" step="0.01" className="mt-1 h-8" value={pedagio} onChange={(e) => setPedagio(e.target.value)} /></div>
            <div><Label className="text-xs">Alimentação (R$)</Label><Input type="number" min="0" step="0.01" className="mt-1 h-8" value={alimentacao} onChange={(e) => setAlimentacao(e.target.value)} /></div>
            <div><Label className="text-xs">Hospedagem (R$)</Label><Input type="number" min="0" step="0.01" className="mt-1 h-8" value={hospedagem} onChange={(e) => setHospedagem(e.target.value)} /></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <Detalhe label={<span className="inline-flex items-center gap-1"><Gauge className="w-3 h-3" />Custo KM</span>} valor={previa.custo_km} />
            <Detalhe label={<span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />Custo horas ({formatarMinutos(missao.tempo_atendimento_min)})</span>} valor={previa.custo_horas} />
            <Detalhe label="Custo peças" valor={previa.custo_pecas} />
            <Detalhe label="Custo total" valor={previa.custo_total} forte />
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted-foreground">
              Margem prévia: <span className="font-semibold">{previa.margem.toFixed(1)}%</span> · Lucro {formatCurrency(previa.rentabilidade)}
            </p>
            <Button size="sm" onClick={recalcular} disabled={salvando}>
              <RefreshCw className={`w-4 h-4 mr-1 ${salvando ? 'animate-spin' : ''}`} />
              {salvando ? 'Calculando...' : 'Recalcular e lançar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Detalhe({ label, valor, forte }) {
  return (
    <div className={`rounded border p-2 ${forte ? 'bg-background' : ''}`}>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`mt-0.5 ${forte ? 'font-bold' : 'font-medium'}`}>{formatCurrency(valor)}</p>
    </div>
  );
}