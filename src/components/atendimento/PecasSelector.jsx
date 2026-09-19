import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

export default function PecasSelector({ pecas = [], catalogo = [], onChange }) {
  const add = () => onChange([...pecas, { peca_id: '', descricao: '', quantidade: 1, valor_unitario: 0, custo_unitario: 0 }]);

  const update = (i, patch) => onChange(pecas.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const remove = (i) => onChange(pecas.filter((_, idx) => idx !== i));

  const selecionar = (i, id) => {
    const c = catalogo.find((x) => x.id === id);
    update(i, {
      peca_id: id,
      descricao: c?.descricao || c?.nome || '',
      valor_unitario: c?.preco_venda ?? c?.valor_venda ?? 0,
      custo_unitario: c?.custo ?? c?.preco_custo ?? 0,
    });
  };

  const total = pecas.reduce((s, p) => s + (Number(p.quantidade) || 0) * (Number(p.valor_unitario) || 0), 0);

  return (
    <div className="space-y-2">
      {pecas.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select value={p.peca_id} onValueChange={(v) => selecionar(i, v)}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Peça" /></SelectTrigger>
            <SelectContent>
              {catalogo.map((c) => <SelectItem key={c.id} value={c.id}>{c.descricao || c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            type="number" min="1" className="w-20"
            value={p.quantidade}
            onChange={(e) => update(i, { quantidade: parseFloat(e.target.value) || 0 })}
          />
          <Input
            type="number" min="0" step="0.01" className="w-28"
            value={p.valor_unitario}
            onChange={(e) => update(i, { valor_unitario: parseFloat(e.target.value) || 0 })}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}><X className="w-4 h-4" /></Button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="w-4 h-4 mr-1" /> Adicionar peça
        </Button>
        {pecas.length > 0 && <span className="text-sm font-medium">Total: {formatCurrency(total)}</span>}
      </div>
    </div>
  );
}