import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Play, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import AutomacaoKPIs from '@/components/automacoes/AutomacaoKPIs';
import AjustesFinosCard from '@/components/automacoes/AjustesFinosCard';
import AgendamentoRow from '@/components/automacoes/AgendamentoRow';
import { useToast } from '@/components/ui/use-toast';

const CONFIG_PADRAO = {
  respeitar_horario_comercial: true,
  horario_inicio: '08:00',
  horario_fim: '20:00',
  disparar_fim_de_semana: false,
  limite_por_contato_dia: 3,
  dedup_horas: 24,
};

const FILTROS = [
  { id: 'todas', label: 'Todas' },
  { id: 'pendente', label: 'Agendadas' },
  { id: 'enviada', label: 'Enviadas' },
  { id: 'falhou', label: 'Falhas' },
  { id: 'cancelada', label: 'Canceladas' },
];

export default function PainelAutomacoes() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [agendamentos, setAgendamentos] = useState([]);
  const [config, setConfig] = useState(CONFIG_PADRAO);
  const [configId, setConfigId] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [disparando, setDisparando] = useState(false);
  const [filtro, setFiltro] = useState('todas');

  const carregar = useCallback(async () => {
    const [ags, cfgs] = await Promise.all([
      base44.entities.MensagemAgendada.list('-agendado_para', 300),
      base44.entities.ConfigAutomacao.list('-updated_date', 1),
    ]);
    setAgendamentos(ags);
    if (cfgs[0]) { setConfig({ ...CONFIG_PADRAO, ...cfgs[0] }); setConfigId(cfgs[0].id); }
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const salvarConfig = async () => {
    setSalvando(true);
    try {
      const dados = {
        respeitar_horario_comercial: config.respeitar_horario_comercial,
        horario_inicio: config.horario_inicio,
        horario_fim: config.horario_fim,
        disparar_fim_de_semana: config.disparar_fim_de_semana,
        limite_por_contato_dia: config.limite_por_contato_dia,
        dedup_horas: config.dedup_horas,
      };
      if (configId) await base44.entities.ConfigAutomacao.update(configId, dados);
      else { const novo = await base44.entities.ConfigAutomacao.create(dados); setConfigId(novo.id); }
      toast({ title: 'Ajustes salvos' });
    } finally {
      setSalvando(false);
    }
  };

  const cancelar = async (ag) => {
    await base44.entities.MensagemAgendada.update(ag.id, { status: 'cancelada' });
    setAgendamentos((prev) => prev.map((a) => (a.id === ag.id ? { ...a, status: 'cancelada' } : a)));
    toast({ title: 'Agendamento cancelado' });
  };

  const dispararAgora = async () => {
    setDisparando(true);
    try {
      const { data } = await base44.functions.invoke('processarAgendamentos', {});
      if (data?.error) throw new Error(data.error);
      if (data?.status === 'fora_horario') {
        toast({ title: 'Fora do horário comercial', description: 'Nada foi disparado agora — os pendentes aguardam a janela.' });
      } else {
        toast({ title: 'Fila processada', description: `${data?.enviadas || 0} enviada(s), ${data?.falhas || 0} falha(s), ${data?.adiadas || 0} adiada(s).` });
      }
      await carregar();
    } catch (e) {
      toast({ title: 'Erro ao processar', description: e.message, variant: 'destructive' });
    } finally {
      setDisparando(false);
    }
  };

  const pendentes = agendamentos.filter((a) => a.status === 'pendente').length;
  const enviadas = agendamentos.filter((a) => a.status === 'enviada').length;
  const falhas = agendamentos.filter((a) => a.status === 'falhou').length;
  const canceladas = agendamentos.filter((a) => a.status === 'cancelada').length;
  const concluidas = enviadas + falhas;
  const taxaEntrega = concluidas > 0 ? Math.round((enviadas / concluidas) * 100) : 0;

  const lista = filtro === 'todas' ? agendamentos : agendamentos.filter((a) => a.status === filtro);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Painel de Automações" description="Acompanhe os disparos automáticos e ajuste os limites da operação.">
        <Button variant="outline" onClick={carregar}><RefreshCw className="w-4 h-4" /> Atualizar</Button>
        <Button onClick={dispararAgora} disabled={disparando}>
          {disparando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Processar fila agora
        </Button>
      </PageHeader>

      <AutomacaoKPIs pendentes={pendentes} enviadas={enviadas} falhas={falhas} canceladas={canceladas} taxaEntrega={taxaEntrega} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">Disparos</CardTitle>
            <div className="flex flex-wrap gap-1">
              {FILTROS.map((f) => (
                <Button key={f.id} variant={filtro === f.id ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setFiltro(f.id)}>
                  {f.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {lista.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-10">Nenhum disparo nesta visão.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] uppercase text-muted-foreground">
                      <th className="py-2 px-3 font-medium">Status</th>
                      <th className="py-2 px-3 font-medium">Gatilho</th>
                      <th className="py-2 px-3 font-medium">Mensagem</th>
                      <th className="py-2 px-3 font-medium">Quando</th>
                      <th className="py-2 px-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((ag) => <AgendamentoRow key={ag.id} ag={ag} onCancelar={cancelar} />)}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <AjustesFinosCard config={config} onChange={setConfig} onSalvar={salvarConfig} salvando={salvando} />
      </div>
    </div>
  );
}