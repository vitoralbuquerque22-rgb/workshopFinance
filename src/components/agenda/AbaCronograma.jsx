import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import TarefaCard from './TarefaCard';
import { formatarDataISO, hojeISO } from '@/lib/agenda';

export default function AbaCronograma({ tarefas, onConcluir, onAbrir }) {
  const hoje = hojeISO();

  const grupos = useMemo(() => {
    const ativas = tarefas
      .filter((t) => t.data_prevista && t.status !== 'concluida' && t.status !== 'cancelada')
      .sort((a, b) => (a.data_prevista || '').localeCompare(b.data_prevista || '') || (a.hora_prevista || '').localeCompare(b.hora_prevista || ''));
    const map = {};
    for (const t of ativas) (map[t.data_prevista] = map[t.data_prevista] || []).push(t);
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [tarefas]);

  const rotulo = (iso) => {
    if (iso === hoje) return 'Hoje';
    if (iso < hoje) return `Atrasada — ${formatarDataISO(iso)}`;
    return formatarDataISO(iso);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {grupos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">Nenhuma tarefa pendente no cronograma.</p>
        ) : (
          <div className="space-y-6">
            {grupos.map(([iso, itens]) => (
              <div key={iso}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${iso < hoje ? 'bg-red-500' : iso === hoje ? 'bg-primary' : 'bg-muted-foreground'}`} />
                  <h4 className={`text-sm font-semibold ${iso < hoje ? 'text-red-600' : ''}`}>{rotulo(iso)}</h4>
                  <span className="text-xs text-muted-foreground">({itens.length})</span>
                </div>
                <div className="ml-4 pl-4 border-l space-y-2">
                  {itens.map((t) => <TarefaCard key={t.id} tarefa={t} onConcluir={onConcluir} onEditar={onAbrir} showData={false} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}