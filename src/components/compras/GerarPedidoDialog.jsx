import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/format';
import { somaProposta, melhorProposta } from '@/lib/compras';
import { Plus, Trash2, Loader2, FileCheck } from 'lucide-react';

export default function GerarPedidoDialog({ open, onClose, onDone, cotacao, depositos, centrosCusto }) {
  const { toast } = useToast();
  const [fornId, setFornId] = useState('');
  const [depId, setDepId] = useState('');
  const [rateio, setRateio] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && cotacao) {
      const win = melhorProposta(cotacao.propostas || []);
      setFornId(win?.fornecedor_id || (cotacao.propostas?.[0]?.fornecedor_id) || '');
      setDepId('');
      setRateio([]);
    }
  }, [open, cotacao]);

  if (!cotacao) return null;

  const proposta = (cotacao.propostas || []).find((p) => p.fornecedor_id === fornId);
  const total = proposta ? somaProposta(proposta).total : 0;

  const addRateio = () => setRateio((r) => [...r, { centro_custo_id: '', percentual: 0, valor: 0 }]);
  const setR = (i, k, v) => setRateio((r) => r.map((x, idx) => {
    if (idx !== i) return x;
    const upd = { ...x, [k]: v };
    if (k === 'percentual') upd.valor = Math.round(total * (Number(v) / 100) * 100) / 100;
    return upd;
  }));
  const somaPct = rateio.reduce((s, r) => s + (Number(r.percentual) || 0), 0);

  const submit = async () => {
    if (!fornId) { toast({ title: 'Escolha o fornecedor vencedor', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await base44.functions.invoke('manageCompras', {
        action: 'gerar_pedido_cotacao', cotacao_id: cotacao.id, fornecedor_id: fornId,
        deposito_id: depId, rateio: rateio.filter((r) => r.centro_custo_id),
      });
      toast({ title: 'Pedido de compra gerado', description: 'Cotação aprovada e convertida em pedido.' });
      onDone();
    } catch (e) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><FileCheck className="h-5 w-5" /> Aprovar & Gerar Pedido</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Fornecedor vencedor</Label>
            <Select value={fornId} onValueChange={setFornId}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                {(cotacao.propostas || []).filter((p) => p.fornecedor_id).map((p) => (
                  <SelectItem key={p.fornecedor_id} value={p.fornecedor_id}>{p.fornecedor_nome} — {formatCurrency(somaProposta(p).total)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Depósito de entrada</Label>
            <Select value={depId || 'none'} onValueChange={(v) => setDepId(v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {depositos.map((d) => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-1">
            <Label className="text-sm font-medium">Rateio por centro de custo</Label>
            <Button type="button" variant="outline" size="sm" onClick={addRateio}><Plus className="h-4 w-4" /> Linha</Button>
          </div>
          {rateio.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <Select value={r.centro_custo_id || 'none'} onValueChange={(v) => setR(i, 'centro_custo_id', v === 'none' ? '' : v)}>
                <SelectTrigger className="flex-1 h-8"><SelectValue placeholder="Centro de custo..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {(centrosCusto || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" className="w-20 h-8" value={r.percentual} onChange={(e) => setR(i, 'percentual', Number(e.target.value))} placeholder="%" />
              <span className="text-xs text-muted-foreground w-20 text-right">{formatCurrency(r.valor)}</span>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setRateio((x) => x.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          {rateio.length > 0 && <p className={`text-xs text-right ${somaPct === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>Rateado: {somaPct}%</p>}

          <div className="border-t pt-2 flex justify-between font-semibold"><span>Total do pedido</span><span className="text-primary">{formatCurrency(total)}</span></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Gerar Pedido</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}