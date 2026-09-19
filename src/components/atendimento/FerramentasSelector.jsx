import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Hammer } from 'lucide-react';

export default function FerramentasSelector({ ferramentas = [], patrimonios = [], onChange }) {
  const add = () => {
    const disp = patrimonios.find((p) => !ferramentas.some((f) => f.patrimonio_id === p.id));
    if (!disp) return;
    onChange([...ferramentas, { patrimonio_id: disp.id, nome: disp.nome, codigo_patrimonial: disp.codigo_patrimonial || '', devolvida: false }]);
  };

  const update = (i, id) => {
    const p = patrimonios.find((x) => x.id === id);
    onChange(ferramentas.map((f, idx) => (idx === i ? { ...f, patrimonio_id: id, nome: p?.nome || '', codigo_patrimonial: p?.codigo_patrimonial || '' } : f)));
  };
  const remove = (i) => onChange(ferramentas.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {ferramentas.map((f, i) => (
        <div key={i} className="flex items-center gap-2">
          <Hammer className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select value={f.patrimonio_id} onValueChange={(v) => update(i, v)}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Ferramenta" /></SelectTrigger>
            <SelectContent>
              {patrimonios.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.nome}{p.codigo_patrimonial ? ` (${p.codigo_patrimonial})` : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}><X className="w-4 h-4" /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} disabled={ferramentas.length >= patrimonios.length}>
        <Plus className="w-4 h-4 mr-1" /> Adicionar ferramenta
      </Button>
    </div>
  );
}