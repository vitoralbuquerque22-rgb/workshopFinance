import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import FilaConversas from '@/components/conversas/FilaConversas';
import JanelaChat from '@/components/conversas/JanelaChat';
import PainelContexto from '@/components/conversas/PainelContexto';
import IaResultadoDialog from '@/components/conversas/IaResultadoDialog';
import TransferenciaDialog from '@/components/conversas/TransferenciaDialog';
import OsPainelLateral from '@/components/conversas/OsPainelLateral';
import AgendarMensagemDialog from '@/components/conversas/AgendarMensagemDialog';
import { formatDate } from '@/lib/format';
import { abrirWhatsApp } from '@/lib/whatsapp';
import { useToast } from '@/components/ui/use-toast';

export default function Conversas() {
  const [conversas, setConversas] = useState([]);
  const [consultores, setConsultores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecionada, setSelecionada] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [carregandoMsgs, setCarregandoMsgs] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todas');
  const navigate = useNavigate();
  const { toast } = useToast();
  const chatRef = useRef(null);
  const [iaCarregando, setIaCarregando] = useState(null);
  const [iaResultado, setIaResultado] = useState({ open: false, tipo: null, dados: null });
  const [transferOpen, setTransferOpen] = useState(false);
  const [aprovacaoCarregando, setAprovacaoCarregando] = useState(false);
  const [assumindo, setAssumindo] = useState(false);
  const [osPainelOpen, setOsPainelOpen] = useState(false);
  const [salvandoEtapa, setSalvandoEtapa] = useState(false);
  const [agendamentos, setAgendamentos] = useState([]);
  const [agendarOpen, setAgendarOpen] = useState(false);
  const [agendamentoEditando, setAgendamentoEditando] = useState(null);

  // contexto vinculado
  const [cliente, setCliente] = useState(null);
  const [veiculo, setVeiculo] = useState(null);
  const [ordemServico, setOrdemServico] = useState(null);
  const [lead, setLead] = useState(null);
  const [auditoria, setAuditoria] = useState([]);

  const carregarConversas = useCallback(async () => {
    const [conv, col] = await Promise.all([
      base44.entities.Conversa.list('-ultima_mensagem_em', 200),
      base44.entities.Colaborador.filter({ status: 'ativo' }),
    ]);
    setConversas(conv);
    setConsultores(col);
    setLoading(false);
    return conv;
  }, []);

  useEffect(() => { carregarConversas(); }, [carregarConversas]);

  // realtime: novas conversas / atualizações
  useEffect(() => {
    const unsub = base44.entities.Conversa.subscribe(() => carregarConversas());
    return unsub;
  }, [carregarConversas]);

  const carregarContexto = useCallback(async (conv) => {
    const [cl, ve, os, le] = await Promise.all([
      conv.cliente_id ? base44.entities.Cliente.get(conv.cliente_id).catch(() => null) : null,
      conv.veiculo_id ? base44.entities.Veiculo.get(conv.veiculo_id).catch(() => null) : null,
      conv.ordem_servico_id ? base44.entities.OrdemServico.get(conv.ordem_servico_id).catch(() => null) : null,
      conv.lead_id ? base44.entities.Lead.get(conv.lead_id).catch(() => null) : null,
    ]);
    setCliente(cl); setVeiculo(ve); setOrdemServico(os); setLead(le);
    const aud = await base44.entities.AuditoriaConversa.filter({ conversa_id: conv.id }, '-data_evento', 50).catch(() => []);
    setAuditoria(aud);
    const ags = await base44.entities.MensagemAgendada.filter({ conversa_id: conv.id }, '-agendado_para', 50).catch(() => []);
    setAgendamentos(ags);
  }, []);

  // Fase 6 — recarrega só a lista de agendamentos da conversa aberta.
  const recarregarAgendamentos = useCallback(async () => {
    if (!selecionada) return;
    const ags = await base44.entities.MensagemAgendada.filter({ conversa_id: selecionada.id }, '-agendado_para', 50).catch(() => []);
    setAgendamentos(ags);
  }, [selecionada]);

  const abrirAgendar = () => { setAgendamentoEditando(null); setAgendarOpen(true); };
  const editarAgendamento = (a) => { setAgendamentoEditando(a); setAgendarOpen(true); };
  const cancelarAgendamento = async (a) => {
    await base44.entities.MensagemAgendada.update(a.id, { status: 'cancelada' });
    toast({ title: 'Agendamento cancelado' });
    recarregarAgendamentos();
  };

  const carregarMensagens = useCallback(async (conversaId) => {
    setCarregandoMsgs(true);
    try {
      const msgs = await base44.entities.Mensagem.filter({ conversa_id: conversaId }, 'created_date', 500);
      setMensagens(msgs);
    } finally {
      setCarregandoMsgs(false);
    }
  }, []);

  const selecionar = async (conv) => {
    setSelecionada(conv);
    carregarContexto(conv);
    carregarMensagens(conv.id);
    if (conv.nao_lidas > 0) {
      await base44.entities.Conversa.update(conv.id, { nao_lidas: 0 });
      setConversas((prev) => prev.map((c) => (c.id === conv.id ? { ...c, nao_lidas: 0 } : c)));
    }
  };

  // realtime das mensagens da conversa aberta
  useEffect(() => {
    if (!selecionada) return;
    const unsub = base44.entities.Mensagem.subscribe((ev) => {
      if (ev?.data?.conversa_id === selecionada.id) carregarMensagens(selecionada.id);
    });
    return unsub;
  }, [selecionada, carregarMensagens]);

  const enviar = async (texto, midia) => {
    if (!selecionada) return;
    setEnviando(true);
    try {
      await base44.functions.invoke('enviarMensagem', {
        conversa_id: selecionada.id,
        texto,
        ...(midia ? { tipo: midia.tipo, midia_url: midia.url, midia_nome: midia.nome } : {}),
      });
      await carregarMensagens(selecionada.id);
      await carregarConversas();
    } finally {
      setEnviando(false);
    }
  };

  const atribuir = async (consultorId) => {
    if (!selecionada) return;
    const id = consultorId === 'nenhum' ? '' : consultorId;
    const nome = consultores.find((c) => c.id === id)?.nome || '';
    await base44.entities.Conversa.update(selecionada.id, { consultor_id: id, consultor_nome: nome });
    const atualizada = { ...selecionada, consultor_id: id, consultor_nome: nome };
    setSelecionada(atualizada);
    setConversas((prev) => prev.map((c) => (c.id === selecionada.id ? atualizada : c)));
  };

  const mudarStatus = async (status) => {
    if (!selecionada) return;
    await base44.entities.Conversa.update(selecionada.id, { status });
    const atualizada = { ...selecionada, status };
    setSelecionada(atualizada);
    setConversas((prev) => prev.map((c) => (c.id === selecionada.id ? atualizada : c)));
  };

  // registra a ação de clique (ligação / WhatsApp) como mensagem de sistema na conversa
  const registrarAcao = async (tipo, telefone) => {
    if (!selecionada) return;
    let usuario = '';
    try { usuario = (await base44.auth.me())?.full_name || ''; } catch { /* ignore */ }
    const texto = tipo === 'ligacao'
      ? `📞 Ligação iniciada${usuario ? ` por ${usuario}` : ''}${telefone ? ` para ${telefone}` : ''}`
      : `💬 WhatsApp aberto${usuario ? ` por ${usuario}` : ''}${telefone ? ` para ${telefone}` : ''}`;
    const agora = new Date().toISOString();
    await base44.entities.Mensagem.create({
      conversa_id: selecionada.id,
      canal: selecionada.canal,
      direcao: 'saida',
      tipo: 'sistema',
      texto,
      autor_tipo: 'consultor',
      autor_nome: usuario,
      enviada_em: agora,
    });
    await base44.entities.Conversa.update(selecionada.id, {
      ultima_mensagem_texto: texto,
      ultima_mensagem_em: agora,
      ultima_mensagem_direcao: 'saida',
    });
    await carregarMensagens(selecionada.id);
    await carregarConversas();
  };

  const ligar = async (telefone) => {
    await registrarAcao('ligacao', telefone);
    if (telefone) window.location.href = `tel:${telefone.replace(/[^\d+]/g, '')}`;
  };

  const whatsapp = async (telefone) => {
    await registrarAcao('whatsapp', telefone);
    abrirWhatsApp(telefone);
  };

  // ações de IA (sugerir resposta, resumir, gerar OS)
  const acaoIa = async (acao) => {
    if (!selecionada || iaCarregando) return;
    setIaCarregando(acao);
    try {
      const { data } = await base44.functions.invoke('iaConversa', { conversa_id: selecionada.id, acao });
      if (data?.error) throw new Error(data.error);
      const resultado = data.resultado;
      if (acao === 'sugerir') {
        chatRef.current?.inserirTexto(typeof resultado === 'string' ? resultado : '');
      } else {
        setIaResultado({ open: true, tipo: acao, dados: resultado });
      }
    } catch (e) {
      toast({ title: 'IA indisponível', description: e.message, variant: 'destructive' });
    } finally {
      setIaCarregando(null);
    }
  };

  const abrirOsSugerida = () => {
    const dados = iaResultado.dados || {};
    setIaResultado({ open: false, tipo: null, dados: null });
    const params = new URLSearchParams();
    if (selecionada?.cliente_id) params.set('cliente', selecionada.cliente_id);
    if (selecionada?.veiculo_id) params.set('veiculo', selecionada.veiculo_id);
    if (dados.descricao_problema) params.set('problema', dados.descricao_problema);
    navigate(`/ordens-servico?${params.toString()}`);
  };

  // Fase 6 — aprovação de orçamento pelo canal
  const enviarAprovacao = async () => {
    if (!selecionada?.ordem_servico_id) return;
    setAprovacaoCarregando(true);
    try {
      const { data } = await base44.functions.invoke('enviarAprovacao', {
        conversa_id: selecionada.id,
        ordem_servico_id: selecionada.ordem_servico_id,
        origin: window.location.origin,
      });
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Aprovação enviada', description: 'O cliente recebeu o link para aprovar e assinar o orçamento.' });
      await carregarMensagens(selecionada.id);
      carregarContexto(selecionada);
      await carregarConversas();
    } catch (e) {
      toast({ title: 'Não foi possível enviar', description: e.message, variant: 'destructive' });
    } finally {
      setAprovacaoCarregando(false);
    }
  };

  // Fase 6 — transferência formal / assumir atendimento
  const assumir = async () => {
    if (!selecionada) return;
    setAssumindo(true);
    try {
      const { data } = await base44.functions.invoke('transferirAtendimento', { conversa_id: selecionada.id, acao: 'assumir' });
      if (data?.error) throw new Error(data.error);
      const atualizada = data.conversa;
      setSelecionada(atualizada);
      setConversas((prev) => prev.map((c) => (c.id === atualizada.id ? atualizada : c)));
      carregarContexto(atualizada);
      await carregarMensagens(selecionada.id);
    } catch (e) {
      toast({ title: 'Erro ao assumir', description: e.message, variant: 'destructive' });
    } finally {
      setAssumindo(false);
    }
  };

  // Fase 3 — muda a etapa da OS direto na conversa e dispara a notificação (Fase 2).
  const mudarEtapaOs = async (novaEtapa) => {
    if (!ordemServico || novaEtapa === ordemServico.etapa_fluxo) return;
    setSalvandoEtapa(true);
    try {
      const evento = { etapa: novaEtapa, descricao: 'Etapa atualizada', usuario: '', data: new Date().toISOString() };
      await base44.entities.OrdemServico.update(ordemServico.id, {
        etapa_fluxo: novaEtapa,
        timeline: [...(ordemServico.timeline || []), evento],
      });
      setOrdemServico((os) => ({ ...os, etapa_fluxo: novaEtapa, timeline: [...(os.timeline || []), evento] }));
      base44.functions.invoke('notificarEtapaOs', { ordem_servico_id: ordemServico.id, etapa: novaEtapa }).catch(() => {});
      toast({ title: 'Etapa atualizada', description: `OS movida para ${novaEtapa}.` });
    } catch (e) {
      toast({ title: 'Erro ao mover etapa', description: e.message, variant: 'destructive' });
    } finally {
      setSalvandoEtapa(false);
    }
  };

  const transferir = async (paraConsultorId, motivo) => {
    const { data } = await base44.functions.invoke('transferirAtendimento', {
      conversa_id: selecionada.id, acao: 'transferir', para_consultor_id: paraConsultorId, motivo,
    });
    if (data?.error) { toast({ title: 'Erro ao transferir', description: data.error, variant: 'destructive' }); return; }
    const atualizada = data.conversa;
    setSelecionada(atualizada);
    setConversas((prev) => prev.map((c) => (c.id === atualizada.id ? atualizada : c)));
    carregarContexto(atualizada);
    await carregarMensagens(selecionada.id);
    toast({ title: 'Atendimento transferido' });
  };

  // filtro + busca
  const filtradas = conversas.filter((c) => {
    if (filtro === 'abertas' && !['aberta', 'aguardando_cliente', 'aguardando_consultor'].includes(c.status)) return false;
    if (filtro === 'nao_lidas' && !(c.nao_lidas > 0)) return false;
    if (busca) {
      const q = busca.toLowerCase();
      const alvo = `${c.contato_nome || ''} ${c.contato_telefone || ''} ${c.contato_identificador || ''} ${c.ultima_mensagem_texto || ''}`.toLowerCase();
      if (!alvo.includes(q)) return false;
    }
    return true;
  });

  // monta a timeline do contexto
  const timeline = [];
  if (selecionada) {
    timeline.push({ titulo: 'Conversa iniciada', descricao: null, data: selecionada.created_date });
    if (lead?.data_captura) timeline.push({ titulo: 'Lead capturado', descricao: lead.origem, data: lead.data_captura });
    if (ordemServico) timeline.push({ titulo: `OS ${ordemServico.numero || ''}`, descricao: `Aberta em ${formatDate(ordemServico.data_abertura)}`, data: ordemServico.data_abertura || ordemServico.created_date });
    auditoria.forEach((a) => timeline.push({ titulo: a.descricao || a.evento, descricao: a.ator_nome, data: a.data_evento }));
    if (selecionada.ultima_mensagem_em) timeline.push({ titulo: 'Última mensagem', descricao: selecionada.ultima_mensagem_direcao === 'saida' ? 'Enviada' : 'Recebida', data: selecionada.ultima_mensagem_em });
    timeline.sort((a, b) => new Date(a.data || 0) - new Date(b.data || 0));
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="-m-4 lg:-m-8">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_340px] h-[calc(100vh-3.5rem)] lg:h-screen">
        <div className="hidden lg:block h-full overflow-hidden">
          <FilaConversas
            conversas={filtradas}
            selecionadaId={selecionada?.id}
            onSelect={selecionar}
            busca={busca}
            onBusca={setBusca}
            filtro={filtro}
            onFiltro={setFiltro}
          />
        </div>

        {/* mobile: mostra fila OU chat */}
        <div className="lg:hidden h-full overflow-hidden">
          {!selecionada ? (
            <FilaConversas
              conversas={filtradas}
              selecionadaId={selecionada?.id}
              onSelect={selecionar}
              busca={busca}
              onBusca={setBusca}
              filtro={filtro}
              onFiltro={setFiltro}
            />
          ) : (
            <JanelaChat conversa={selecionada} mensagens={mensagens} onEnviar={enviar} enviando={enviando || carregandoMsgs} onSugerir={() => acaoIa('sugerir')} onResumir={() => acaoIa('resumir')} onGerarOs={() => acaoIa('gerar_os')} iaCarregando={iaCarregando} />
          )}
        </div>

        <div className="hidden lg:block h-full overflow-hidden">
          <JanelaChat ref={chatRef} conversa={selecionada} mensagens={mensagens} onEnviar={enviar} enviando={enviando || carregandoMsgs} onSugerir={() => acaoIa('sugerir')} onResumir={() => acaoIa('resumir')} onGerarOs={() => acaoIa('gerar_os')} iaCarregando={iaCarregando} />
        </div>

        <div className="hidden lg:block h-full overflow-hidden">
          <PainelContexto
            conversa={selecionada}
            cliente={cliente}
            veiculo={veiculo}
            ordemServico={ordemServico}
            lead={lead}
            consultores={consultores}
            timeline={timeline}
            onAtribuir={atribuir}
            onStatus={mudarStatus}
            onLigar={ligar}
            onWhatsApp={whatsapp}
            onEnviarAprovacao={enviarAprovacao}
            aprovacaoCarregando={aprovacaoCarregando}
            onAssumir={assumir}
            assumindo={assumindo}
            onTransferir={() => setTransferOpen(true)}
            onAbrirOs={ordemServico ? () => setOsPainelOpen(true) : undefined}
            agendamentos={agendamentos}
            onAgendar={abrirAgendar}
            onEditarAgendamento={editarAgendamento}
            onCancelarAgendamento={cancelarAgendamento}
          />
        </div>
      </div>

      {selecionada && (
        <AgendarMensagemDialog
          open={agendarOpen}
          onOpenChange={setAgendarOpen}
          conversa={selecionada}
          cliente={cliente}
          agendamento={agendamentoEditando}
          onSalvo={recarregarAgendamentos}
        />
      )}

      <OsPainelLateral
        open={osPainelOpen}
        onOpenChange={setOsPainelOpen}
        ordemServico={ordemServico}
        salvando={salvandoEtapa}
        onMudarEtapa={mudarEtapaOs}
      />

      <TransferenciaDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        consultores={consultores}
        atualId={selecionada?.consultor_id}
        onConfirm={transferir}
      />

      <IaResultadoDialog
        open={iaResultado.open}
        onOpenChange={(v) => setIaResultado((r) => ({ ...r, open: v }))}
        tipo={iaResultado.tipo}
        dados={iaResultado.dados}
        onGerarOs={abrirOsSugerida}
      />
    </div>
  );
}