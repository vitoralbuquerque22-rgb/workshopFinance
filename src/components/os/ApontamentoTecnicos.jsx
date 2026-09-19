import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Users } from 'lucide-react';

// Apontamento de técnicos por serviço/item da OS.
// Permite adicionar 1+ técnicos com percentual de participação (base para comissão/produtividade).
export default function ApontamentoTecnicos({ apontamentos = [], colaboradores = [], onChange }) {
  const add = () => onChange([...apontamentos, { colaborador_id: '', colaborador_nome: '', percentual: 100 }]);
  const remove = (i) => onChange(apontamentos.filter((_, x) => x !== i));
  const upd = (i, field, value) => {
    const arr = [...apontamentos];
    arr[i] = { ...arr[i], [field]: value };
    if (field === 'colaborador_id') {
      arr[i].colaborador_nome = colaboradores.find((c) => c.id === value)?.nome || '';
    }
    onChange(arr);
  };

  const totalPct = apontamentos.reduce((s, a) => s + (Number(a.percentual) || 0), 0);
  const pctInvalido = apontamentos.length > 0 && totalPct !== 100;

  return (
    <div className="mt-2 pl-2 border-l-2 border-primary/20 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
          <Users className="w-3 h-3" /> Técnicos deste item
        </span>
        <Button size="sm" variant="ghost" className="h-6 text-[11px] px-2" onClick={add}>
          <Plus className="w-3 h-3" /> Técnico
        </Button>
      </div>
      {apontamentos.map((a, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Select value={a.colaborador_id || ''} onValueChange={(v) => upd(i, 'colaborador_id', v)}>
            <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Técnico..." /></SelectTrigger>
            <SelectContent>
              {colaboradores.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative w-20">
            <Input
              className="h-7 text-xs pr-5"
              type="number"
              value={a.percentual}
              onChange={(e) => upd(i, 'percentual', Number(e.target.value))}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
          </div>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(i)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ))}
      {pctInvalido && (
        <p className="text-[10px] text-amber-600">A soma dos percentuais é {totalPct}% (ideal: 100%).</p>
      )}
    </div>
  );
}