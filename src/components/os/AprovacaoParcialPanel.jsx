import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/format';
import { motivosPerda } from '@/lib/crmConfig';
import { Loader2, CheckCircle2, UserPlus, MessageCircle } from 'lucide-react';

// Painel de aprovação parcial: o consultor marca os itens NÃO aprovados,
// informa motivo + data de contato, e ao salvar os recusados saem da OS
// e viram uma oportunidade no CRM (com disparo de mensagem automática).
export default function AprovacaoParcialPanel({ os, onUpdate }) {
  const { toast } = useToast();
  const [decisoes, setDecisoes] = useState(() => {
    const map = {};
    (os.itens || []).forEach((it, idx) => {
      map[idx] = {
        aprovado: it.aprovado !== false,
        motivo_recusa: it.motivo_recusa || 'preco',
        motivo_recusa_detalhe: it.motivo_recusa_detalhe || '',
        data_contato_crm: it.data_contato_crm || '',
      };
    });
    return map;
  });
  const [salvando, setSalvando] = useState(false);

  const bloqueado = !!os.nota_fiscal_id;

  const setItem = (idx, patch) => setDecisoes((d) => ({ ...d, [idx]: { ...d[idx], ...patch } }));

  const { totalAprovado, totalRecusado, qtdRecusados } = useMemo(() => {
    let ap = 0, rec = 0, q = 0;
    (os.itens || []).forEach((it, idx) => {
      const aprovado = decisoes[idx]?.aprovado !== false;
      const v = Number(it.valor_total) || 0;
      if (aprovado) ap += v;
      else { rec += v; q += 1; }
    });
    return { totalAprovado: ap, totalRecusado: rec, qtdRecusados: q };
  }, [os.itens, decisoes]);

  const recusadosSemMotivo = (os.itens || []).some((_, idx) => {
    const d = decisoes[idx];
    return d?.aprovado === false && (!d.motivo_recusa || !d.data_contato_crm);
  });

  const salvar = async () => {
    setSalvando(true);
    try {
      const { data } = await base44.functions.invoke('registrarAprovacaoParcial', {
        ordem_servico_id: os.id,
        decisoes,
      });
      if (data?.error) throw new Error(data.error);
      toast({
        title: 'Aprovação registrada',
        description: data.recusados > 0
          ? `${data.recusados} item(ns) enviado(s) ao CRM${data.mensagem_agendada ? ' · follow-up agendado ao cliente' : ''}.`
          : 'Orçamento aprovado integralmente.',
      });
      onUpdate?.();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro', description: e.message });
    } finally {
      setSalvando(false);
    }
  };

  if (!os.itens || os.itens.length === 0) {
    return <p className="text-sm text-muted-foreground">Esta OS não possui itens.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Desmarque os itens que o cliente <strong>não aprovou</strong>. Eles saem da execução/faturamento e entram no CRM para prospecção.
      </p>

      <div className="space-y-2">
        {os.itens.map((it, idx) => {
          const d = decisoes[idx] || {};
          const recusado = d.aprovado === false;
          return (
            <div key={idx} className={`rounded-lg border p-3 ${recusado ? 'border-rose-200 bg-rose-50/50' : 'border-border'}`}>
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={d.aprovado !== false}
                  disabled={bloqueado}
                  onCheckedChange={(v) => setItem(idx, { aprovado: !!v })}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm truncate ${recusado ? 'line-through text-muted-foreground' : 'font-medium'}`}>
                      {it.descricao || 'Item'}{Number(it.quantidade) > 1 ? ` (${it.quantidade}x)` : ''}
                    </span>
                    <span className="text-sm font-medium shrink-0">{formatCurrency(it.valor_total)}</span>
                  </div>
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {it.tipo === 'peca' ? 'Peça' : it.tipo === 'mao_obra' ? 'Mão de obra' : 'Serviço'}
                  </span>

                  {recusado && (
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <div className="sm:col-span-1">
                        <label className="text-[11px] font-medium text-muted-foreground">Motivo</label>
                        <Select value={d.motivo_recusa || 'preco'} onValueChange={(v) => setItem(idx, { motivo_recusa: v })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(motivosPerda).map(([k, label]) => (
                              <SelectItem key={k} value={k}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-1">
                        <label className="text-[11px] font-medium text-muted-foreground">Data de contato</label>
                        <Input type="date" className="h-8 text-xs" value={d.data_contato_crm || ''} onChange={(e) => setItem(idx, { data_contato_crm: e.target.value })} />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="text-[11px] font-medium text-muted-foreground">Justificativa</label>
                        <Input className="h-8 text-xs" placeholder="Ex: faltou cartão" value={d.motivo_recusa_detalhe || ''} onChange={(e) => setItem(idx, { motivo_recusa_detalhe: e.target.value })} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3 text-sm">
        <div><span className="text-muted-foreground">Aprovado:</span> <strong className="text-emerald-600">{formatCurrency(totalAprovado)}</strong></div>
        <div><span className="text-muted-foreground">Não aprovado:</span> <strong className="text-rose-600">{formatCurrency(totalRecusado)}</strong></div>
      </div>

      {qtdRecusados > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1"><UserPlus className="w-3.5 h-3.5" /> {qtdRecusados} item(ns) irão para o CRM como oportunidade.</span>
            <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> Um follow-up será agendado ao cliente na data de contato informada.</span>
          </div>
        </div>
      )}

      {bloqueado ? (
        <p className="text-xs text-muted-foreground">A OS já foi faturada — a aprovação de itens está travada.</p>
      ) : (
        <Button onClick={salvar} disabled={salvando || recusadosSemMotivo} className="w-full sm:w-auto">
          {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Registrar aprovação
        </Button>
      )}
      {recusadosSemMotivo && <p className="text-xs text-rose-600">Informe motivo e data de contato para cada item não aprovado.</p>}
    </div>
  );
}