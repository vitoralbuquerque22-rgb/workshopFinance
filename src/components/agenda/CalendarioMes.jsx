import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PRIORIDADE_TAREFA } from '@/lib/agenda';

const NOMES_MES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function CalendarioMes({ ano, mes, tarefas, diaSelecionado, onSelecionarDia, onNavegar }) {
  const isoDia = (d) => `${ano}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const porDia = useMemo(() => {
    const map = {};
    for (const t of tarefas) {
      if (!t.data_prevista) continue;
      (map[t.data_prevista] = map[t.data_prevista] || []).push(t);
    }
    return map;
  }, [tarefas]);

  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const hoje = new Date();
  const hojeISO = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

  const celulas = [];
  for (let i = 0; i < primeiroDiaSemana; i++) celulas.push(null);
  for (let d = 1; d <= diasNoMes; d++) celulas.push(d);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-semibold text-lg">{NOMES_MES[mes]} {ano}</h3>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onNavegar(-1)}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onNavegar(1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {DIAS.map((d) => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>)}
        {celulas.map((d, i) => {
          if (d === null) return <div key={`v-${i}`} />;
          const iso = isoDia(d);
          const doDia = porDia[iso] || [];
          const pendentes = doDia.filter((t) => t.status !== 'concluida' && t.status !== 'cancelada');
          const temAlta = pendentes.some((t) => t.prioridade === 'alta');
          const selecionado = iso === diaSelecionado;
          const eHoje = iso === hojeISO;
          return (
            <button key={iso} onClick={() => onSelecionarDia(iso)}
              className={`aspect-square rounded-lg border p-1 flex flex-col items-center justify-start text-xs transition-colors ${selecionado ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-accent'} ${eHoje ? 'font-bold' : ''}`}>
              <span className={eHoje ? 'text-primary' : ''}>{d}</span>
              {doDia.length > 0 && (
                <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                  {pendentes.length > 0 && (
                    <span className={`w-1.5 h-1.5 rounded-full ${temAlta ? 'bg-red-500' : 'bg-primary'}`} />
                  )}
                  {pendentes.length > 1 && <span className="text-[9px] text-muted-foreground leading-none">{pendentes.length}</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary" />Pendente</span>
        <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Prioridade alta</span>
      </div>
    </div>
  );
}