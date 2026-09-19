import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import StatusBadge from '@/components/StatusBadge';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDate } from '@/lib/format';
import { totalRecebido, totalPedido, backorderItens } from '@/lib/compras';
import { ShoppingCart, PackageCheck, RotateCcw, Trash2, Loader2, Truck } from 'lucide-react';

export default function PedidosCompraTab({ pedidos, fornNome, depNome, onReceber, onChange }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState({});

  const backorder = async (id) => {
    setBusy((b) => ({ ...b, [id]: true }));
    try {
      await base44.functions.invoke('manageCompras', { action: 'gerar_backorder', pedido_compra_id: id });
      toast({ title: 'Backorder gerado', description: 'Novo pedido criado com o saldo pendente.' });
      onChange();
    } catch (e) { toast({ title: 'Erro', description: e.message, variant: 'destructive' }); }
    finally { setBusy((b) => ({ ...b, [id]: false })); }
  };

  const remover = async (id) => { await base44.entities.PedidoCompra.delete(id); onChange(); };

  if (pedidos.length === 0) {
    return <div className="flex flex-col items-center py-16 text-center"><ShoppingCart className="w-12 h-12 text-muted-foreground/40 mb-3" /><p className="text-muted-foreground">Nenhum pedido de compra</p><p className="text-xs text-muted-foreground mt-1">Gere pedidos a partir de cotações aprovadas.</p></div>;
  }

  return (
    <div className="space-y-3">
      {pedidos.map((p) => {
        const rec = totalRecebido(p), tot = totalPedido(p);
        const pct = tot > 0 ? Math.round((rec / tot) * 100) : 0;
        const pendentes = backorderItens(p);
        return (
          <Card key={p.id}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0"><ShoppingCart className="w-5 h-5" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{p.numero || `PC-${p.id.slice(-6)}`}</p>
                  <StatusBadge status={p.status} />
                  {p.conta_pagar_id && <span className="text-xs text-emerald-600">Conta a pagar gerada</span>}
                  {p.observacoes?.startsWith('Backorder') && <span className="text-[10px] px-2 py-0.5 rounded-full border bg-orange-50 text-orange-700 border-orange-200">Backorder</span>}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 mt-2 text-xs text-muted-foreground">
                  <div><span className="font-medium text-foreground">Fornecedor:</span> {fornNome(p.fornecedor_id)}</div>
                  <div><span className="font-medium text-foreground">Depósito:</span> {depNome(p.deposito_id)}</div>
                  <div><span className="font-medium text-foreground">Emissão:</span> {formatDate(p.data_emissao)}</div>
                  <div><span className="font-medium text-foreground">Prazo:</span> {p.prazo_entrega_dias || 0}d</div>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="text-muted-foreground flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Frete: {formatCurrency(p.valor_frete || 0)}</span>
                  {p.rateio?.length > 0 && <span className="text-muted-foreground">Rateio: {p.rateio.length} c. custo</span>}
                  <span className="font-medium">Total: <strong className="text-primary">{formatCurrency(p.valor_total)}</strong></span>
                </div>
                {tot > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-[11px] text-muted-foreground mb-0.5"><span>Recebido {rec} / {tot}</span><span>{pct}%</span></div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {['aberto', 'enviado', 'recebido_parcial', 'backorder'].includes(p.status) && (
                  <Button size="sm" onClick={() => onReceber(p)}><PackageCheck className="h-3.5 w-3.5" /> Receber</Button>
                )}
                {p.status === 'recebido_parcial' && pendentes.length > 0 && (
                  <Button size="sm" variant="outline" onClick={() => backorder(p.id)} disabled={busy[p.id]}>
                    {busy[p.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />} Backorder
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remover(p.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}