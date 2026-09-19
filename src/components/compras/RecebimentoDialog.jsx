import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, PackageCheck } from 'lucide-react';

export default function RecebimentoDialog({ open, onClose, onDone, pedido }) {
  const { toast } = useToast();
  const [qtds, setQtds] = useState({});
  const [documento, setDocumento] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && pedido) {
      const init = {};
      (pedido.itens || []).forEach((i) => {
        init[i.descricao] = Math.max(0, (i.quantidade || 0) - (i.quantidade_recebida || 0));
      });
      setQtds(init);
      setDocumento('');
    }
  }, [open, pedido]);

  if (!pedido) return null;

  const submit = async () => {
    setSaving(true);
    try {
      const itens_recebidos = Object.entries(qtds)
        .map(([descricao, quantidade]) => ({ descricao, quantidade: Number(quantidade) || 0 }))
        .filter((i) => i.quantidade > 0);
      if (itens_recebidos.length === 0) {
        toast({ title: 'Informe ao menos uma quantidade', variant: 'destructive' });
        setSaving(false);
        return;
      }
      const res = await base44.functions.invoke('manageCompras', {
        action: 'receber_pedido', pedido_compra_id: pedido.id, itens_recebidos, documento,
      });
      toast({ title: res.data?.backorder ? 'Recebimento parcial registrado' : 'Recebimento total concluído', description: res.data?.backorder ? 'Saldo permanece em backorder.' : 'Estoque e conta a pagar atualizados.' });
      onDone();
    } catch (e) {
      toast({ title: 'Erro no recebimento', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><PackageCheck className="h-5 w-5" /> Recebimento — {pedido.numero || `PC-${pedido.id.slice(-6)}`}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1"><Label className="text-xs">Documento / NF (opcional)</Label><Input value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder="Nº da nota" /></div>
          <div className="space-y-2">
            {(pedido.itens || []).map((it, i) => {
              const pendente = (it.quantidade || 0) - (it.quantidade_recebida || 0);
              return (
                <div key={i} className="flex items-center gap-2 border rounded-lg p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{it.descricao}</p>
                    <p className="text-[11px] text-muted-foreground">Pedido: {it.quantidade} · Recebido: {it.quantidade_recebida || 0} · Pendente: {pendente}</p>
                  </div>
                  <Input type="number" step="0.01" min="0" max={pendente} className="w-24 h-8" value={qtds[it.descricao] ?? 0} onChange={(e) => setQtds((q) => ({ ...q, [it.descricao]: e.target.value }))} disabled={pendente <= 0} />
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">Receber menos que o pedido gera recebimento parcial (backorder). O saldo total dá entrada no estoque e gera a conta a pagar.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Confirmar Recebimento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}