import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Pencil, CheckCircle2, Calendar, Clock, User } from 'lucide-react';
import { STATUS_TAREFA, PRIORIDADE_TAREFA, TIPO_TAREFA, checklistProgresso, formatarDataISO } from '@/lib/agenda';
import TarefaForm from './TarefaForm';

export default function TarefaDetalheDialog({ tarefa, open, onOpenChange, onChanged }) {
  const [editando, setEditando] = useState(false);
  const [checklist, setChecklist] = useState(tarefa?.checklist || []);

  useEffect(() => { setChecklist(tarefa?.checklist || []); setEditando(false); }, [tarefa]);

  if (!tarefa) return null;
  const status = STATUS_TAREFA[tarefa.status] || STATUS_TAREFA.pendente;
  const prio = PRIORIDADE_TAREFA[tarefa.prioridade] || PRIORIDADE_TAREFA.media;
  const tipo = TIPO_TAREFA.find((t) => t.value === tarefa.tipo)?.label || tarefa.tipo;
  const prog = checklistProgresso(checklist);

  const toggleItem = async (i) => {
    const novo = checklist.map((c, idx) => (idx === i ? { ...c, concluido: !c.concluido } : c));
    setChecklist(novo);
    await base44.entities.TarefaOperacional.update(tarefa.id, { checklist: novo });
    onChanged?.();
  };

  const concluir = async () => {
    await base44.functions.invoke('manageAgenda', { action: 'concluir', tarefa_id: tarefa.id });
    onChanged?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar tarefa' : tarefa.titulo}</DialogTitle>
        </DialogHeader>
        {editando ? (
          <TarefaForm tarefa={tarefa} onSaved={() => { setEditando(false); onChanged?.(); onOpenChange(false); }} onCancel={() => setEditando(false)} />
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">{tipo}</Badge>
              <Badge className={prio.cls}>{prio.label}</Badge>
              <Badge className={status.cls}>{status.label}</Badge>
            </div>
            {tarefa.descricao && <p className="text-sm text-muted-foreground">{tarefa.descricao}</p>}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {tarefa.data_prevista && <div className="inline-flex items-center gap-1.5"><Calendar className="w-4 h-4 text-muted-foreground" />{formatarDataISO(tarefa.data_prevista)}</div>}
              {tarefa.hora_prevista && <div className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-muted-foreground" />{tarefa.hora_prevista}</div>}
              {tarefa.responsavel_nome && <div className="inline-flex items-center gap-1.5"><User className="w-4 h-4 text-muted-foreground" />{tarefa.responsavel_nome}</div>}
            </div>

            {checklist.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Checklist</p>
                  <span className="text-xs text-muted-foreground">{prog.feitos}/{prog.total} ({prog.pct}%)</span>
                </div>
                <div className="space-y-2">
                  {checklist.map((c, i) => (
                    <label key={i} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={c.concluido} onCheckedChange={() => toggleItem(i)} />
                      <span className={c.concluido ? 'line-through text-muted-foreground' : ''}>{c.descricao}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditando(true)}><Pencil className="w-4 h-4 mr-1" />Editar</Button>
              {tarefa.status !== 'concluida' && (
                <Button onClick={concluir}><CheckCircle2 className="w-4 h-4 mr-1" />Concluir</Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}