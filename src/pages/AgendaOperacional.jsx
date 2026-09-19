import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { RefreshCw, CalendarClock, AlertTriangle, Repeat, ListTodo } from 'lucide-react';
import AbaAgenda from '@/components/agenda/AbaAgenda';
import AbaCronograma from '@/components/agenda/AbaCronograma';
import AbaRotinas from '@/components/agenda/AbaRotinas';
import AbaOcorrencias from '@/components/agenda/AbaOcorrencias';
import TarefaForm from '@/components/agenda/TarefaForm';
import OcorrenciaForm from '@/components/agenda/OcorrenciaForm';
import TarefaDetalheDialog from '@/components/agenda/TarefaDetalheDialog';
import { hojeISO } from '@/lib/agenda';

export default function AgendaOperacional() {
  const { toast } = useToast();
  const [tarefas, setTarefas] = useState([]);
  const [ocorrencias, setOcorrencias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);

  const [novaTarefa, setNovaTarefa] = useState(null); // { data, rotina }
  const [novaOcorrencia, setNovaOcorrencia] = useState(false);
  const [ocEditando, setOcEditando] = useState(null);
  const [tarefaAberta, setTarefaAberta] = useState(null);

  const carregar = async () => {
    const [t, o] = await Promise.all([
      base44.entities.TarefaOperacional.list('-created_date', 1000).catch(() => []),
      base44.entities.Ocorrencia.list('-created_date', 500).catch(() => []),
    ]);
    setTarefas(t);
    setOcorrencias(o);
    setCarregando(false);
  };

  useEffect(() => { carregar(); }, []);

  const kpis = useMemo(() => {
    const hoje = hojeISO();
    const ativas = tarefas.filter((t) => t.status !== 'concluida' && t.status !== 'cancelada');
    return {
      hoje: ativas.filter((t) => t.data_prevista === hoje).length,
      atrasadas: ativas.filter((t) => t.data_prevista && t.data_prevista < hoje).length,
      rotinas: tarefas.filter((t) => t.recorrencia?.ativa).length,
      ocorrencias: ocorrencias.filter((o) => o.status === 'aberta' || o.status === 'em_tratamento').length,
    };
  }, [tarefas, ocorrencias]);

  const gerarAgenda = async () => {
    setGerando(true);
    try {
      const res = await base44.functions.invoke('manageAgenda', { action: 'gerar' });
      const r = res.data?.resumo || {};
      toast({ title: 'Agenda atualizada', description: `${r.tarefasGeradas || 0} tarefa(s), ${r.vencimentosGerados || 0} vencimento(s), ${r.alertasEnviados || 0} alerta(s).` });
      await carregar();
    } catch {
      toast({ title: 'Erro ao gerar agenda', variant: 'destructive' });
    }
    setGerando(false);
  };

  const concluirTarefa = async (t) => {
    await base44.functions.invoke('manageAgenda', { action: 'concluir', tarefa_id: t.id });
    await carregar();
  };

  const resolverOcorrencia = async (o) => {
    await base44.entities.Ocorrencia.update(o.id, { status: 'resolvida', resolvida_em: new Date().toISOString() });
    await carregar();
  };

  const kpiCards = [
    { label: 'Hoje', valor: kpis.hoje, icon: ListTodo, cls: 'text-blue-600' },
    { label: 'Atrasadas', valor: kpis.atrasadas, icon: CalendarClock, cls: 'text-red-600' },
    { label: 'Rotinas ativas', valor: kpis.rotinas, icon: Repeat, cls: 'text-primary' },
    { label: 'Ocorrências abertas', valor: kpis.ocorrencias, icon: AlertTriangle, cls: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Agenda Operacional" description="Organize a rotina da oficina: calendário, cronograma, rotinas e ocorrências.">
        <Button onClick={gerarAgenda} disabled={gerando}>
          <RefreshCw className={`w-4 h-4 mr-2 ${gerando ? 'animate-spin' : ''}`} />
          {gerando ? 'Gerando...' : 'Gerar agenda'}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-2xl font-bold mt-1">{k.valor}</p>
              </div>
              <k.icon className={`w-8 h-8 ${k.cls} opacity-80`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {carregando ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>
      ) : (
        <Tabs defaultValue="agenda">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
            <TabsTrigger value="rotinas">Rotinas</TabsTrigger>
            <TabsTrigger value="ocorrencias">Ocorrências</TabsTrigger>
          </TabsList>

          <TabsContent value="agenda" className="mt-4">
            <AbaAgenda tarefas={tarefas} onNova={(data) => setNovaTarefa({ data })} onConcluir={concluirTarefa} onAbrir={setTarefaAberta} />
          </TabsContent>
          <TabsContent value="cronograma" className="mt-4">
            <AbaCronograma tarefas={tarefas} onConcluir={concluirTarefa} onAbrir={setTarefaAberta} />
          </TabsContent>
          <TabsContent value="rotinas" className="mt-4">
            <AbaRotinas tarefas={tarefas} onNova={() => setNovaTarefa({ rotina: true })} onAbrir={setTarefaAberta} onChanged={carregar} />
          </TabsContent>
          <TabsContent value="ocorrencias" className="mt-4">
            <AbaOcorrencias ocorrencias={ocorrencias} onNova={() => setNovaOcorrencia(true)} onResolver={resolverOcorrencia} onAbrir={setOcEditando} />
          </TabsContent>
        </Tabs>
      )}

      {/* Nova tarefa / nova rotina */}
      <Dialog open={!!novaTarefa} onOpenChange={(v) => !v && setNovaTarefa(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{novaTarefa?.rotina ? 'Nova rotina' : 'Nova tarefa'}</DialogTitle></DialogHeader>
          {novaTarefa && (
            <TarefaForm
              isRotina={novaTarefa.rotina}
              tarefa={novaTarefa.data ? { data_prevista: novaTarefa.data } : null}
              onSaved={() => { setNovaTarefa(null); carregar(); }}
              onCancel={() => setNovaTarefa(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Nova / editar ocorrência */}
      <Dialog open={novaOcorrencia || !!ocEditando} onOpenChange={(v) => { if (!v) { setNovaOcorrencia(false); setOcEditando(null); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{ocEditando ? 'Ocorrência' : 'Nova ocorrência'}</DialogTitle></DialogHeader>
          <OcorrenciaForm
            ocorrencia={ocEditando}
            onSaved={() => { setNovaOcorrencia(false); setOcEditando(null); carregar(); }}
            onCancel={() => { setNovaOcorrencia(false); setOcEditando(null); }}
          />
        </DialogContent>
      </Dialog>

      <TarefaDetalheDialog tarefa={tarefaAberta} open={!!tarefaAberta} onOpenChange={(v) => !v && setTarefaAberta(null)} onChanged={carregar} />
    </div>
  );
}