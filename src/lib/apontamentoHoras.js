// Cálculos de apontamento de horas por técnico/item com pausas justificadas,
// e comparativo de horas vendidas × executadas por OS.

export const MOTIVOS_PAUSA = [
  { key: 'almoco', label: 'Almoço' },
  { key: 'aguardando_pecas', label: 'Aguardando peças' },
  { key: 'servico_terceiro', label: 'Serviço terceiro' },
  { key: 'retifica', label: 'Retífica' },
  { key: 'outro', label: 'Outro' },
];

export const ETAPAS_APONTAVEIS = [
  { key: 'diagnostico', label: 'Diagnóstico' },
  { key: 'orcamento', label: 'Orçamento' },
  { key: 'aprovacao', label: 'Aprovação' },
  { key: 'execucao', label: 'Execução' },
  { key: 'qualidade', label: 'Qualidade' },
  { key: 'aguardando_faturamento', label: 'Aguardando faturamento' },
];

export const motivoPausaLabel = (key) => MOTIVOS_PAUSA.find((m) => m.key === key)?.label || 'Outro';
export const etapaApontavelLabel = (key) => ETAPAS_APONTAVEIS.find((e) => e.key === key)?.label || key;

const ms = (a, b) => {
  if (!a || !b) return 0;
  const x = new Date(a).getTime();
  const y = new Date(b).getTime();
  if (isNaN(x) || isNaN(y) || y <= x) return 0;
  return y - x;
};

// Milissegundos de pausa acumulados (conta pausas já encerradas; pausa em aberto conta até agora)
export const pausaMs = (pausas = []) =>
  pausas.reduce((s, p) => s + ms(p.inicio, p.fim || new Date().toISOString()), 0);

// Horas líquidas (brutas − pausas) de uma sessão, mesmo em andamento (usa "agora" como fim)
export const sessaoHorasLiquidas = (sessao) => {
  const fim = sessao.fim || new Date().toISOString();
  const bruto = ms(sessao.inicio, fim);
  const pausado = pausaMs(sessao.pausas);
  const liquido = Math.max(0, bruto - pausado);
  return Math.round((liquido / 3600000) * 100) / 100;
};

// Total de horas executadas (líquidas) somando todas as sessões de todos os itens
export const horasExecutadasItens = (os) =>
  Math.round(
    (os?.itens || []).reduce(
      (s, it) => s + (it.sessoes || []).reduce((a, ses) => a + sessaoHorasLiquidas(ses), 0),
      0
    ) * 100
  ) / 100;

// Esforço total (líquido) das sessões da OS inteira — soma o tempo de todos os
// técnicos que trabalharam no veículo (ex.: técnico A 2h + técnico B 2h = 4h).
export const horasExecutadasProducao = (os) =>
  Math.round(
    (os?.sessoes_producao || []).reduce((a, ses) => a + sessaoHorasLiquidas(ses), 0) * 100
  ) / 100;

// Total de horas executadas: sessões por item + sessões da OS inteira
export const horasExecutadasOs = (os) =>
  Math.round((horasExecutadasItens(os) + horasExecutadasProducao(os)) * 100) / 100;

// Pausas das sessões da OS inteira, achatadas (para o histórico do painel)
export const pausasProducao = (os) => {
  const out = [];
  (os?.sessoes_producao || []).forEach((ses) => {
    (ses.pausas || []).forEach((p) => {
      out.push({
        item: 'OS (produção)',
        colaborador: ses.colaborador_nome,
        motivo: p.motivo,
        observacao: p.observacao,
        inicio: p.inicio,
        fim: p.fim,
        minutos: Math.round(ms(p.inicio, p.fim || new Date().toISOString()) / 60000),
      });
    });
  });
  return out;
};

// Total de horas vendidas somando itens de serviço/mão de obra
export const horasVendidasOs = (os) =>
  Math.round(
    (os?.itens || []).reduce((s, it) => s + (Number(it.horas_vendidas) || 0) * (Number(it.quantidade) || 1), 0) * 100
  ) / 100;

// Comparativo por OS: vendidas × executadas, eficiência e desvio
export const comparativoHoras = (os) => {
  const vendidas = horasVendidasOs(os);
  const executadas = horasExecutadasOs(os);
  const desvio = Math.round((executadas - vendidas) * 100) / 100;
  const eficiencia = executadas > 0 ? Math.round((vendidas / executadas) * 100) : 0;
  return { vendidas, executadas, desvio, eficiencia };
};

// Todas as pausas da OS achatadas (para exibir justificativas no painel)
export const pausasOs = (os) => {
  const out = [];
  (os?.itens || []).forEach((it) => {
    (it.sessoes || []).forEach((ses) => {
      (ses.pausas || []).forEach((p) => {
        out.push({
          item: it.descricao,
          colaborador: ses.colaborador_nome,
          motivo: p.motivo,
          observacao: p.observacao,
          inicio: p.inicio,
          fim: p.fim,
          minutos: Math.round(ms(p.inicio, p.fim || new Date().toISOString()) / 60000),
        });
      });
    });
  });
  return out;
};

// Visão unificada por ETAPA do fluxo: cruza a timeline (quando a etapa ocorreu)
// com as sessões de cronômetro aplicadas naquela etapa (quem, quanto tempo, pausas).
// Só as etapas apontáveis têm cronômetro; as demais aparecem apenas com o marco da timeline.
export const linhaTempoUnificada = (os) => {
  // Sessões agrupadas por etapa
  const sessoesPorEtapa = {};
  (os?.itens || []).forEach((it) => {
    (it.sessoes || []).forEach((s) => {
      const et = s.etapa || 'execucao';
      if (!sessoesPorEtapa[et]) sessoesPorEtapa[et] = [];
      sessoesPorEtapa[et].push({ ...s, item: it.descricao });
    });
  });

  // Último marco da timeline por etapa
  const marcoPorEtapa = {};
  (os?.timeline || []).forEach((ev) => {
    const at = marcoPorEtapa[ev.etapa];
    if (!at || new Date(ev.data) > new Date(at.data)) marcoPorEtapa[ev.etapa] = ev;
  });

  // Une as chaves de etapa vindas de ambas as fontes, na ordem do fluxo
  const chaves = [...new Set([...Object.keys(marcoPorEtapa), ...Object.keys(sessoesPorEtapa)])];

  return chaves.map((etapa) => {
    const sessoes = sessoesPorEtapa[etapa] || [];
    const horas = Math.round(sessoes.reduce((a, s) => a + sessaoHorasLiquidas(s), 0) * 100) / 100;
    const nPausas = sessoes.reduce((a, s) => a + (s.pausas || []).length, 0);
    const minutosPausa = Math.round(sessoes.reduce((a, s) => a + pausaMs(s.pausas), 0) / 60000);
    const tecnicos = [...new Set(sessoes.map((s) => s.colaborador_nome).filter(Boolean))];
    return {
      etapa,
      marco: marcoPorEtapa[etapa] || null,
      sessoes,
      horas,
      nPausas,
      minutosPausa,
      tecnicos,
      temApontamento: sessoes.length > 0,
    };
  });
};

// Valor real da hora da oficina numa OS = receita de serviços / horas executadas
export const valorRealHora = (os) => {
  const executadas = horasExecutadasOs(os);
  if (executadas <= 0) return 0;
  const receitaServicos = Number(os?.valor_servicos) || 0;
  return Math.round((receitaServicos / executadas) * 100) / 100;
};