import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Repeat, Plus, User, ListChecks, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { labelFrequencia, TIPO_TAREFA, checklistProgresso } from '@/lib/agenda';

export default function AbaRotinas({ tarefas, onNova, onAbrir, onChanged }) {
  const rotinas = tarefas.filter((t) => t.recorrencia?.ativa);

  const excluir = async (rotina, e) => {
    e.stopPropagation();
    if (!confirm(`Excluir a rotina "${rotina.titulo}"? As tarefas já geradas serão mantidas.`)) return;
    await base44.entities.TarefaOperacional.update(rotina.id, { recorrencia: { ...rotina.recorrencia, ativa: false } });
    onChanged?.();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">Rotinas recorrentes que geram tarefas automaticamente.</p>
          <Button size="sm" onClick={onNova}><Plus className="w-4 h-4 mr-1" />Nova rotina</Button>
        </div>
        {rotinas.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">Nenhuma rotina cadastrada.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {rotinas.map((r) => {
              const tipo = TIPO_TAREFA.find((t) => t.value === r.tipo)?.label || r.tipo;
              const prog = checklistProgresso(r.checklist);
              return (
                <div key={r.id} className="rounded-lg border p-3 card-hover cursor-pointer" onClick={() => onAbrir(r)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Repeat className="w-4 h-4 text-primary shrink-0" />
                        <p className="font-medium text-sm truncate">{r.titulo}</p>
                      </div>
                      {r.descricao && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{r.descricao}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => excluir(r, e)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">{tipo}</Badge>
                    <Badge className="bg-primary/10 text-primary text-[10px]">{labelFrequencia(r.recorrencia)}</Badge>
                    {r.responsavel_nome && <span className="inline-flex items-center gap-1"><User className="w-3 h-3" />{r.responsavel_nome}</span>}
                    {prog.total > 0 && <span className="inline-flex items-center gap-1"><ListChecks className="w-3 h-3" />{prog.total} itens</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}