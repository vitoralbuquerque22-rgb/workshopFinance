import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, UserRound } from 'lucide-react';
import { PAPEIS_EQUIPE } from '@/lib/atendimentoExterno';

export default function EquipeSelector({ equipe = [], colaboradores = [], onChange }) {
  const add = () => {
    const disponivel = colaboradores.find((c) => !equipe.some((e) => e.colaborador_id === c.id));
    if (!disponivel) return;
    onChange([...equipe, { colaborador_id: disponivel.id, colaborador_nome: disponivel.nome, papel: 'responsavel' }]);
  };

  const update = (i, patch) => onChange(equipe.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  const remove = (i) => onChange(equipe.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {equipe.map((membro, i) => (
        <div key={i} className="flex items-center gap-2">
          <UserRound className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select
            value={membro.colaborador_id}
            onValueChange={(v) => {
              const c = colaboradores.find((x) => x.id === v);
              update(i, { colaborador_id: v, colaborador_nome: c?.nome || '' });
            }}
          >
            <SelectTrigger className="flex-1"><SelectValue placeholder="Colaborador" /></SelectTrigger>
            <SelectContent>
              {colaboradores.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={membro.papel} onValueChange={(v) => update(i, { papel: v })}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAPEIS_EQUIPE.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}><X className="w-4 h-4" /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} disabled={equipe.length >= colaboradores.length}>
        <Plus className="w-4 h-4 mr-1" /> Adicionar membro
      </Button>
    </div>
  );
}