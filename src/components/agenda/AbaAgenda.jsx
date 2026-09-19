import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CalendarDays } from 'lucide-react';
import CalendarioMes from './CalendarioMes';
import TarefaCard from './TarefaCard';
import { formatarDataISO } from '@/lib/agenda';

export default function AbaAgenda({ tarefas, onNova, onConcluir, onAbrir }) {
  const hoje = new Date();
  const [ref, setRef] = useState({ ano: hoje.getFullYear(), mes: hoje.getMonth() });
  const hojeISO = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  const [dia, setDia] = useState(hojeISO);

  const navegar = (delta) => {
    setRef((r) => {
      let m = r.mes + delta, a = r.ano;
      if (m < 0) { m = 11; a--; }
      if (m > 11) { m = 0; a++; }
      return { ano: a, mes: m };
    });
  };

  const doMes = useMemo(() => {
    const prefixo = `${ref.ano}-${String(ref.mes + 1).padStart(2, '0')}`;
    return tarefas.filter((t) => (t.data_prevista || '').startsWith(prefixo));
  }, [tarefas, ref]);

  const doDia = useMemo(() =>
    tarefas.filter((t) => t.data_prevista === dia).sort((a, b) => (a.hora_prevista || '').localeCompare(b.hora_prevista || '')),
  [tarefas, dia]);

  return (
    <div className="grid lg:grid-cols-5 gap-4">
      <Card className="lg:col-span-3">
        <CardContent className="pt-6">
          <CalendarioMes ano={ref.ano} mes={ref.mes} tarefas={doMes} diaSelecionado={dia} onSelecionarDia={setDia} onNavegar={navegar} />
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              <h3 className="font-heading font-semibold">{formatarDataISO(dia)}</h3>
            </div>
            <Button size="sm" onClick={() => onNova(dia)}><Plus className="w-4 h-4 mr-1" />Tarefa</Button>
          </div>
          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {doDia.map((t) => <TarefaCard key={t.id} tarefa={t} onConcluir={onConcluir} onEditar={onAbrir} />)}
            {doDia.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma tarefa neste dia.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}