import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, CheckCircle2, Calendar, Repeat, ListChecks } from 'lucide-react';
import { STATUS_TAREFA, PRIORIDADE_TAREFA, TIPO_TAREFA, checklistProgresso, formatarDataISO } from '@/lib/agenda';

export default function TarefaCard({ tarefa, onConcluir, onEditar, showData }) {
  const status = STATUS_TAREFA[tarefa.status] || STATUS_TAREFA.pendente;
  const prio = PRIORIDADE_TAREFA[tarefa.prioridade] || PRIORIDADE_TAREFA.media;
  const tipo = TIPO_TAREFA.find((t) => t.value === tarefa.tipo)?.label || tarefa.tipo;
  const prog = checklistProgresso(tarefa.checklist);
  const concluida = tarefa.status === 'concluida';

  return (
    <div className={`rounded-lg border p-3 ${concluida ? 'opacity-70' : ''} card-hover`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onEditar?.(tarefa)}>
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-medium text-sm truncate ${concluida ? 'line-through' : ''}`}>{tarefa.titulo}</p>
            {tarefa.recorrencia?.ativa && <Repeat className="w-3.5 h-3.5 text-primary shrink-0" />}
          </div>
          {tarefa.descricao && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{tarefa.descricao}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1"><Badge variant="outline" className="text-[10px]">{tipo}</Badge></span>
            {showData && tarefa.data_prevista && (
              <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{formatarDataISO(tarefa.data_prevista)}</span>
            )}
            {tarefa.hora_prevista && <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{tarefa.hora_prevista}</span>}
            {tarefa.responsavel_nome && <span className="inline-flex items-center gap-1"><User className="w-3 h-3" />{tarefa.responsavel_nome}</span>}
            {prog.total > 0 && <span className="inline-flex items-center gap-1"><ListChecks className="w-3 h-3" />{prog.feitos}/{prog.total}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex gap-1.5">
            <Badge className={`${prio.cls} text-[10px]`}>{prio.label}</Badge>
            <Badge className={`${status.cls} text-[10px]`}>{status.label}</Badge>
          </div>
          {!concluida && onConcluir && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600" onClick={() => onConcluir(tarefa)}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Concluir
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}