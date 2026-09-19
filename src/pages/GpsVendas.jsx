import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { formatDateTime } from '@/lib/format';
import StatusBadge from '@/components/StatusBadge';
import GpsStart from '@/components/gps/GpsStart';
import GpsStepper from '@/components/gps/GpsStepper';
import GpsStepDados from '@/components/gps/GpsStepDados';
import GpsStepPerguntas from '@/components/gps/GpsStepPerguntas';
import GpsStepChecklist from '@/components/gps/GpsStepChecklist';
import GpsStepResumo from '@/components/gps/GpsStepResumo';
import { Navigation, List, ChevronLeft, ChevronRight, Loader2, Car, Sparkles, RotateCcw, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const steps = [
  { key: 'dados', label: 'Dados' },
  { key: 'pre_diagnostico', label: 'Pré-Diag.' },
  { key: 'ppv', label: 'PPV' },
  { key: 'checklist', label: 'Checklist' },
  { key: 'resumo', label: 'Resumo IA' },
];

export default function GpsVendas() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [view, setView] = useState('inicio');
  const [osVinculada, setOsVinculada] = useState(null);
  const [modelos, setModelos] = useState([]);
  const [items, setItems] = useState([]);
  const [atendimento, setAtendimento] = useState(null);
  const [dados, setDados] = useState({});
  const [respostas, setRespostas] = useState({});
  const [step, setStep] = useState(0);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detalheId, setDetalheId] = useState(null);

  useEffect(() => { loadInitial(); }, []);

  const loadInitial = async () => {
    try {
      const [mods, hist] = await Promise.all([
        base44.entities.GpsModelo.filter({ status: 'ativo' }),
        base44.entities.GpsAtendimento.list('-created_date', 30),
      ]);
      setModelos(mods);
      setHistorico(hist);
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao carregar dados.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleStarted = async ({ atendimento: atd, os }) => {
    setAtendimento(atd);
    if (os) setOsVinculada(os);
    try {
      const its = await base44.entities.GpsItemConfig.filter({ modelo_id: atd.modelo_id, ativo: true });
      setItems(its);
    } catch {
      setItems([]);
    }
    setRespostas({});
    setDados({});
    setStep(0);
    setView('fluxo');
  };

  // Início vinculado a partir da OS / cliente / veículo (via parâmetros de URL).
  // Não cria OS nova — usa o cliente e veículo existentes e amarra o atendimento.
  const iniciarVinculado = async ({ osId, clienteId, veiculoId, placa }) => {
    const modelo = modelos.find((m) => m.is_default) || modelos[0];
    if (!modelo) {
      toast({ title: 'Erro', description: 'Nenhum modelo de GPS configurado.', variant: 'destructive' });
      return;
    }
    let os = null;
    let cliente = clienteId;
    let veiculo = veiculoId;
    let placaFinal = placa;
    try {
      if (osId) {
        os = await base44.entities.OrdemServico.get(osId);
        cliente = os.cliente_id;
        veiculo = os.veiculo_id;
      }
      if (veiculo && !placaFinal) {
        const v = await base44.entities.Veiculo.get(veiculo).catch(() => null);
        placaFinal = v?.placa || '';
      }
      const atendimento = await base44.entities.GpsAtendimento.create({
        modelo_id: modelo.id,
        modelo_nome: modelo.nome,
        modelo_versao: modelo.versao || 1,
        os_id: os?.id,
        cliente_id: cliente,
        veiculo_id: veiculo,
        consultor: '',
        placa: placaFinal || '',
        status: 'em_andamento',
        data_inicio: new Date().toISOString(),
        respostas: [],
        codigos_falha: [],
      });
      await handleStarted({ atendimento, os });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível iniciar o GPS vinculado.', variant: 'destructive' });
    }
  };

  // Detecta parâmetros de URL e inicia direto (uma única vez, após modelos carregarem).
  useEffect(() => {
    if (loading || atendimento) return;
    const p = new URLSearchParams(window.location.search);
    const osId = p.get('os');
    const clienteId = p.get('cliente');
    const veiculoId = p.get('veiculo');
    const placa = p.get('placa');
    if (osId || clienteId || veiculoId) {
      // limpa a query para não reiniciar em re-render
      window.history.replaceState({}, '', '/gps-vendas');
      iniciarVinculado({ osId, clienteId, veiculoId, placa });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const handleRespostaChange = (itemId, resposta) => {
    setRespostas(prev => ({ ...prev, [itemId]: resposta }));
  };

  const persistAtendimento = async (extra = {}) => {
    if (!atendimento) return;
    setSaving(true);
    try {
      const respostasArray = Object.entries(respostas).map(([itemId, r]) => {
        const item = items.find(i => i.id === itemId);
        return {
          item_id: itemId,
          tipo: item?.tipo,
          categoria: item?.categoria,
          pergunta: item?.titulo,
          resposta: r.resposta || '',
          anexos: r.anexos || [],
          status: r.status || undefined,
          observacao: r.observacao || '',
          valor_estimado: r.valor_estimado || 0,
          prioridade: r.prioridade || undefined,
        };
      });
      const updated = await base44.entities.GpsAtendimento.update(atendimento.id, {
        combustivel_nivel: dados.combustivel_nivel,
        quilometragem: dados.quilometragem,
        codigos_falha: dados.codigos_falha || [],
        observacoes_gerais: dados.observacoes_gerais || '',
        respostas: respostasArray,
        ...extra,
      });
      setAtendimento(prev => ({ ...prev, ...updated }));
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    await persistAtendimento();
    setStep(s => Math.min(s + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setStep(s => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalizar = async (analise) => {
    await persistAtendimento({
      ai_analise: analise,
      status: 'concluido',
      data_conclusao: new Date().toISOString(),
    });
    // Amarra o atendimento à OS de origem e volta para ela.
    const osId = osVinculada?.id || atendimento?.os_id;
    if (osId && atendimento?.id) {
      await base44.entities.OrdemServico.update(osId, { gps_atendimento_id: atendimento.id });
      toast({ title: 'GPS concluído!', description: 'Conferência anexada à OS.' });
      setOsVinculada(null);
      navigate(`/ordens-servico/${osId}`);
      return;
    }
    toast({ title: 'Atendimento finalizado!', description: 'GPS de Venda concluído com sucesso.' });
    setView('historico');
    loadInitial();
  };

  const handleSalvarSair = async () => {
    await persistAtendimento();
    toast({ title: 'Progresso salvo', description: 'Você pode continuar este atendimento pelo histórico.' });
    setAtendimento(null);
    setView('historico');
    loadInitial();
  };

  const handleCancelar = async () => {
    if (atendimento) {
      await base44.entities.GpsAtendimento.update(atendimento.id, { status: 'cancelado' });
    }
    setAtendimento(null);
    setView('inicio');
    loadInitial();
  };

  const handleResume = async (atd) => {
    setAtendimento(atd);
    try {
      const its = await base44.entities.GpsItemConfig.filter({ modelo_id: atd.modelo_id, ativo: true });
      setItems(its);
    } catch {
      setItems([]);
    }
    const rMap = {};
    (atd.respostas || []).forEach(r => { rMap[r.item_id] = r; });
    setRespostas(rMap);
    setDados({
      combustivel_nivel: atd.combustivel_nivel,
      quilometragem: atd.quilometragem,
      codigos_falha: atd.codigos_falha || [],
      observacoes_gerais: atd.observacoes_gerais || '',
    });
    setStep(atd.status === 'concluido' ? steps.length - 1 : 0);
    setView('fluxo');
  };

  const stepItems = (tipo) => items.filter(i => i.tipo === tipo);
  const detalhe = historico.find(h => h.id === detalheId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="GPS de Vendas" description="Inspeção inteligente: atendimento, diagnóstico e venda consultiva" />

      {view !== 'fluxo' && (
        <div className="flex gap-2 mb-6">
          <Button variant={view === 'inicio' ? 'default' : 'outline'} size="sm" onClick={() => setView('inicio')}>
            <Navigation className="h-4 w-4" /> Iniciar
          </Button>
          <Button variant={view === 'historico' ? 'default' : 'outline'} size="sm" onClick={() => setView('historico')}>
            <List className="h-4 w-4" /> Histórico ({historico.length})
          </Button>
        </div>
      )}

      {view === 'inicio' && (
        <GpsStart modelos={modelos} onStarted={handleStarted} />
      )}

      {view === 'fluxo' && atendimento && (
        <div className="max-w-2xl mx-auto space-y-4">
          <Button variant="ghost" size="sm" onClick={handleSalvarSair} className="-ml-2">
            <ChevronLeft className="h-4 w-4" /> Voltar ao GPS de Vendas
          </Button>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{atendimento.modelo_nome}</p>
                  <p className="text-xs text-muted-foreground">Placa: {atendimento.placa || 'N/A'}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCancelar}>
                <RotateCcw className="h-4 w-4" /> Cancelar
              </Button>
            </CardContent>
          </Card>

          <GpsStepper steps={steps} current={step} onStep={setStep} />

          <div className="min-h-[200px]">
            {step === 0 && <GpsStepDados dados={dados} onChange={setDados} />}
            {step === 1 && <GpsStepPerguntas items={stepItems('pre_diagnostico')} respostas={respostas} onChange={handleRespostaChange} />}
            {step === 2 && <GpsStepPerguntas items={stepItems('ppv')} respostas={respostas} onChange={handleRespostaChange} />}
            {step === 3 && <GpsStepChecklist items={stepItems('checklist')} respostas={respostas} onChange={handleRespostaChange} />}
            {step === 4 && <GpsStepResumo atendimento={atendimento} items={items} respostas={respostas} onFinalizar={handleFinalizar} />}
          </div>

          <div className="flex items-center justify-between pt-2 gap-2">
            <Button variant="outline" onClick={handleBack} disabled={step === 0}>
              <ChevronLeft className="h-4 w-4" /> Voltar
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleSalvarSair} disabled={saving}>
                <Save className="h-4 w-4" /> Salvar e sair
              </Button>
              {step < steps.length - 1 ? (
                <Button onClick={handleNext} disabled={saving}>
                  {saving ? 'Salvando...' : 'Avançar'} <ChevronRight className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {view === 'historico' && (
        <div className="space-y-3">
          {historico.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Nenhum atendimento registrado ainda.
              </CardContent>
            </Card>
          ) : (
            historico.map((atd) => (
              <Card key={atd.id} className="card-hover">
                <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="font-mono">{atd.placa || 'N/A'}</Badge>
                      <StatusBadge status={atd.status} />
                      <span className="text-xs text-muted-foreground">{formatDateTime(atd.created_date)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Modelo: {atd.modelo_nome || 'N/A'} • Consultor: {atd.consultor || '-'}
                    </p>
                    {(atd.respostas || []).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">{atd.respostas.length} itens inspecionados</p>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    {atd.ai_analise && (
                      <Button size="sm" variant="outline" onClick={() => setDetalheId(atd.id)}>
                        <Sparkles className="h-4 w-4" /> Ver Análise
                      </Button>
                    )}
                    {atd.status === 'em_andamento' && (
                      <Button size="sm" onClick={() => handleResume(atd)}>
                        <RotateCcw className="h-4 w-4" /> Continuar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {detalhe && (
        <Card className="fixed inset-4 lg:inset-8 z-50 overflow-y-auto bg-background shadow-xl">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Análise — {detalhe.placa}</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setDetalheId(null)}>Fechar</Button>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{detalhe.ai_analise}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}