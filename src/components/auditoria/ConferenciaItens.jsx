import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { SITUACAO_ITEM } from '@/lib/auditoria';

// Painel de conferência dos itens da auditoria (editável enquanto não aprovada).
export default function ConferenciaItens({ itens, onChange, readOnly, mostrarQuantidade = true }) {
  const setItem = (i, patch) => onChange(itens.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const remover = (i) => onChange(itens.filter((_, idx) => idx !== i));
  const adicionar = () => onChange([...itens, { descricao: '', codigo: '', quantidade_esperada: 1, quantidade_conferida: 0, situacao: 'pendente', observacao: '' }]);

  if (readOnly) {
    return (
      <div className="space-y-2">
        {(itens || []).length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Nenhum item.</p>}
        {(itens || []).map((it, i) => {
          const sit = SITUACAO_ITEM[it.situacao] || SITUACAO_ITEM.pendente;
          return (
            <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg border">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{it.descricao}{it.codigo ? ` (${it.codigo})` : ''}</p>
                {it.observacao && <p className="text-xs text-muted-foreground">{it.observacao}</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {mostrarQuantidade && <span className="text-xs text-muted-foreground">{it.quantidade_conferida}/{it.quantidade_esperada}</span>}
                <span className={`text-xs px-2 py-0.5 rounded-full ${sit.cls}`}>{sit.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(itens || []).map((it, i) => (
        <div key={i} className="p-3 rounded-lg border space-y-2">
          <div className="flex gap-2">
            <Input className="flex-1" value={it.descricao} onChange={(e) => setItem(i, { descricao: e.target.value })} placeholder="Descrição do item" />
            <Input className="w-32" value={it.codigo || ''} onChange={(e) => setItem(i, { codigo: e.target.value })} placeholder="Código" />
            <Button variant="ghost" size="icon" onClick={() => remover(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {mostrarQuantidade && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground">Esperada</label>
                  <Input type="number" value={it.quantidade_esperada} onChange={(e) => setItem(i, { quantidade_esperada: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Conferida</label>
                  <Input type="number" value={it.quantidade_conferida} onChange={(e) => setItem(i, { quantidade_conferida: Number(e.target.value) })} />
                </div>
              </>
            )}
            <div className={mostrarQuantidade ? '' : 'col-span-2'}>
              <label className="text-xs text-muted-foreground">Situação</label>
              <Select value={it.situacao} onValueChange={(v) => setItem(i, { situacao: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SITUACAO_ITEM).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className={mostrarQuantidade ? '' : 'col-span-2'}>
              <label className="text-xs text-muted-foreground">Observação</label>
              <Input value={it.observacao || ''} onChange={(e) => setItem(i, { observacao: e.target.value })} />
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={adicionar}><Plus className="w-4 h-4 mr-1" /> Adicionar item</Button>
    </div>
  );
}