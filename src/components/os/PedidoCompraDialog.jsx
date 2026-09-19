import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PedidoCompraDialog({ open, onOpenChange, ordemServicoId, fornecedores, itensOs = [], onCreated }) {
  const [fornecedorId, setFornecedorId] = useState('');
  const [itens, setItens] = useState([{ descricao: '', quantidade: 1, valor_unitario: 0, valor_total: 0 }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && itensOs.length > 0) {
      setItens(itensOs.map(i => ({ descricao: i.descricao, quantidade: i.quantidade, valor_unitario: 0, valor_total: 0 })));
    }
  }, [open]);

  const updateItem = (idx, field, value) => {
    const updated = [...itens];
    updated[idx][field] = value;
    updated[idx].valor_total = (parseFloat(updated[idx].quantidade) || 0) * (parseFloat(updated[idx].valor_unitario) || 0);
    setItens(updated);
  };

  const valorTotal = itens.reduce((sum, i) => sum + (i.valor_total || 0), 0);

  const handleCreate = async () => {
    setLoading(true);
    try {
      await base44.functions.invoke('manageOs', {
        action: 'criar_pedido_compra',
        ordem_servico_id: ordemServicoId,
        fornecedor_id: fornecedorId,
        itens,
      });
      onCreated?.();
      onOpenChange(false);
      setFornecedorId('');
      setItens([{ descricao: '', quantidade: 1, valor_unitario: 0, valor_total: 0 }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pedido de Compra</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Fornecedor *</Label>
            <Select value={fornecedorId} onValueChange={setFornecedorId}>
              <SelectTrigger><SelectValue placeholder="Selecione o fornecedor" /></SelectTrigger>
              <SelectContent>
                {fornecedores.map(f => <SelectItem key={f.id} value={f.id}>{f.nome_fantasia}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Itens</Label>
            {itens.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5"><Input className="h-8 text-xs" placeholder="Descrição" value={item.descricao} onChange={(e) => updateItem(idx, 'descricao', e.target.value)} /></div>
                <div className="col-span-2"><Input className="h-8 text-xs" type="number" placeholder="Qtd" value={item.quantidade} onChange={(e) => updateItem(idx, 'quantidade', e.target.value)} /></div>
                <div className="col-span-3"><Input className="h-8 text-xs" type="number" step="0.01" placeholder="Valor Unit." value={item.valor_unitario} onChange={(e) => updateItem(idx, 'valor_unitario', e.target.value)} /></div>
                <div className="col-span-2 flex items-center justify-between">
                  <span className="text-xs font-medium">{item.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  {itens.length > 1 && <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setItens(itens.filter((_, i) => i !== idx))}><Trash2 className="w-3.5 h-3.5" /></Button>}
                </div>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => setItens([...itens, { descricao: '', quantidade: 1, valor_unitario: 0, valor_total: 0 }])}><Plus className="w-3.5 h-3.5" /> Item</Button>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg text-sm flex justify-between">
            <span className="text-muted-foreground">Valor Total:</span>
            <strong className="text-primary">{valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={loading || !fornecedorId || itens.length === 0}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Pedido'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}