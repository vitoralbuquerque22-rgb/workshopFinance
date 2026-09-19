import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { format, isToday, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, CheckCircle2, ExternalLink, CalendarClock, AlertTriangle, CalendarCheck, Calendar } from 'lucide-react';

const GRUPOS = [
  { key: 'atrasadas', label: 'Atrasadas', icon: AlertTriangle, color: 'text-destructive', badge: 'bg-destructive/10 text-destructive' },
  { key: 'hoje', label: 'Hoje', icon: CalendarCheck, color: 'text-primary', badge: 'bg-primary/10 text-primary' },
  { key: 'proximas', label: 'Próximas', icon: Calendar, color: 'text-muted-foreground', badge: 'bg-muted text-muted-foreground' },
];

export default function TarefasPainel({ leads, onOpenLead }) {
  const { toast } = useToast();
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [concluindo, setConcluindo] = useState({});

  const leadMap = React.useMemo(() => {
    const m = {};
    (leads || []).forEach((l) => { m[l.id] = l; });
    return m;
  }, [leads]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Atividade.filter({ concluida: false }, 'data_agendada', 300);
      setTarefas(data.filter((a) => a.data_agendada));
    } catch {
      toast({ title: 'Erro', description: 'Falha ao carregar tarefas.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const concluir = async (t) => {
    setConcluindo((p) => ({ ...p, [t.id]: true }));
    try {
      await base44.entities.Atividade.update(t.id, { concluida: true, data_conclusao: new Date().toISOString() });
      setTarefas((prev) => prev.filter((x) => x.id !== t.id));
    } finally {
      setConcluindo((p) => ({ ...p, [t.id]: false }));
    }
  };

  const grupos = { atrasadas: [], hoje: [], proximas: [] };
  tarefas.forEach((t) => {
    const d = parseISO(t.data_agendada);
    if (isToday(d)) grupos.hoje.push(t);
    else if (isPast(d)) grupos.atrasadas.push(t);
    else grupos.proximas.push(t);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tarefas.length === 0) {
    return (
      <Card className="p-12 text-center">
        <CalendarClock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="font-medium">Nenhuma tarefa pendente</p>
        <p className="text-sm text-muted-foreground mt-1">Retornos agendados aparecem aqui automaticamente.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {GRUPOS.map(({ key, label, icon: Icon, color, badge }) => {
        const itens = grupos[key];
        if (itens.length === 0) return null;
        return (
          <div key={key}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <h3 className="font-semibold font-heading">{label}</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge}`}>{itens.length}</span>
            </div>
            <div className="space-y-2">
              {itens.map((t) => {
                const lead = leadMap[t.lead_id];
                const cliente = lead?.nome || lead?.cliente_nome || 'Cliente';
                return (
                  <Card key={t.id} className="p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{cliente}</span>
                        {lead?.placa && <span className="text-xs text-muted-foreground">{lead.placa}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{t.titulo}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" />
                          {format(parseISO(t.data_agendada), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {t.consultor && <span>· {t.consultor}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {lead && (
                        <Button variant="outline" size="sm" onClick={() => onOpenLead(lead)}>
                          <ExternalLink className="h-3.5 w-3.5" /> Abrir lead
                        </Button>
                      )}
                      <Button size="sm" onClick={() => concluir(t)} disabled={concluindo[t.id]}>
                        {concluindo[t.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Concluir
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}