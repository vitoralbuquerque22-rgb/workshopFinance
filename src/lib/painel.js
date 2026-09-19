// Biblioteca de cálculos do Painel Principal (cockpit da oficina, foco no dia de hoje).
// Reaproveita conceitos de producao.js e bi.js, mas consolida tudo para "hoje".

const num = (v) => Number(v) || 0;

const inicioDoDia = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const fimDoDia = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d.getTime(); };

const ehHoje = (dateStr) => {
  if (!dateStr) return false;
  const t = new Date(dateStr).getTime();
  if (isNaN(t)) return false;
  return t >= inicioDoDia() && t <= fimDoDia();
};

// horas de uma OS: prioriza horas_trabalhadas, senão calcula pelo período de execução
const horasProduzidas = (os) => {
  const h = num(os?.horas_trabalhadas);
  if (h > 0) return h;
  if (os?.execucao_inicio && os?.execucao_fim) {
    const a = new Date(os.execucao_inicio).getTime();
    const b = new Date(os.execucao_fim).getTime();
    if (!isNaN(a) && !isNaN(b) && b > a) return (b - a) / 3600000;
  }
  return 0;
};

// horas vendidas de uma OS: soma dos itens de mão de obra (quantidade = horas quando cobrança por hora)
const horasVendidas = (os) =>
  (os?.itens || [])
    .filter((i) => i.tipo === 'mao_obra')
    .reduce((s, i) => s + num(i.quantidade), 0);

const valorMaoObra = (os) =>
  (os?.itens || [])
    .filter((i) => i.tipo === 'mao_obra')
    .reduce((s, i) => s + num(i.valor_total), 0);

// ── Bloco 1: fluxo de veículos hoje ──────────────────────────────────────────
export const fluxoDia = (ordens, pedidos) => {
  const abertas = (ordens || []).filter((o) => !['concluido', 'cancelado'].includes(o.status));

  const entraramHoje = (ordens || []).filter((o) => ehHoje(o.data_abertura || o.created_date)).length;
  const emProducao = (ordens || []).filter((o) => o.status === 'em_andamento').length;
  const aguardandoAprovacao = (ordens || []).filter((o) => o.status === 'orcamento').length;

  // Aguardando peças: OS com pedido de compra ainda em aberto (não recebido/cancelado)
  const pedidosAbertosPorOs = new Set(
    (pedidos || [])
      .filter((p) => ['aberto', 'enviado', 'recebido_parcial', 'backorder'].includes(p.status) && p.ordem_servico_id)
      .map((p) => p.ordem_servico_id)
  );
  const aguardandoPecas = abertas.filter((o) => pedidosAbertosPorOs.has(o.id)).length;

  const hoje = inicioDoDia();
  const atrasados = abertas.filter((o) => o.data_prevista && new Date(o.data_prevista).getTime() < hoje).length;

  return { entraramHoje, emProducao, aguardandoAprovacao, aguardandoPecas, atrasados };
};

// ── Bloco 2: financeiro do dia ───────────────────────────────────────────────
export const financeiroDia = (ordens, lancamentos) => {
  const concluidasHoje = (ordens || []).filter(
    (o) => o.status === 'concluido' && ehHoje(o.data_fechamento || o.execucao_fim || o.updated_date)
  );
  const faturamentoDia = concluidasHoje.reduce((s, o) => s + num(o.valor_total), 0);
  const custoDia = concluidasHoje.reduce((s, o) => s + num(o.custo_total), 0);
  const lucroRealizado = faturamentoDia - custoDia;

  // Lucro previsto: OS aprovadas/em andamento (backlog) — margem esperada
  const backlog = (ordens || []).filter((o) => ['aprovado', 'em_andamento'].includes(o.status));
  const lucroPrevisto = backlog.reduce((s, o) => s + (num(o.valor_total) - num(o.custo_total)), 0);

  // Fluxo de caixa do dia (LancamentoCaixa)
  const lancHoje = (lancamentos || []).filter((l) => ehHoje(l.data));
  const entradas = lancHoje.filter((l) => l.tipo === 'entrada').reduce((s, l) => s + num(l.valor), 0);
  const saidas = lancHoje.filter((l) => l.tipo === 'saida').reduce((s, l) => s + num(l.valor), 0);

  return { faturamentoDia, lucroRealizado, lucroPrevisto, caixaEntradas: entradas, caixaSaidas: saidas, caixaSaldo: entradas - saidas };
};

// ── Bloco 3: horas do dia ────────────────────────────────────────────────────
export const horasDia = (ordens) => {
  // Horas vendidas: OS abertas hoje (novas vendas de MO)
  const osHoje = (ordens || []).filter((o) => ehHoje(o.data_abertura || o.created_date));
  const hVendidas = osHoje.reduce((s, o) => s + horasVendidas(o), 0);
  const valorVendidas = osHoje.reduce((s, o) => s + valorMaoObra(o), 0);

  // Horas produzidas: OS finalizadas hoje
  const finalizadasHoje = (ordens || []).filter(
    (o) => o.status === 'concluido' && ehHoje(o.data_fechamento || o.execucao_fim || o.updated_date)
  );
  const hProduzidas = finalizadasHoje.reduce((s, o) => s + horasProduzidas(o), 0);
  const valorProduzidas = finalizadasHoje.reduce((s, o) => s + valorMaoObra(o), 0);

  return {
    horasVendidas: Math.round(hVendidas * 10) / 10,
    horasProduzidas: Math.round(hProduzidas * 10) / 10,
    valorHorasVendidas: valorVendidas,
    valorHorasProduzidas: valorProduzidas,
  };
};

// ── Bloco 4: técnicos ociosos / sobrecarregados (carga do dia atual) ─────────
// Considera OS em andamento por técnico e horas vendidas em aberto vs jornada.
const JORNADA = 8;
export const cargaTecnicos = (ordens) => {
  const mapa = {};
  (ordens || []).forEach((o) => {
    const tec = (o.tecnico_responsavel || '').trim();
    if (!tec) return;
    if (!mapa[tec]) mapa[tec] = { nome: tec, emAndamento: 0, horasPrevistas: 0 };
    if (['aprovado', 'em_andamento'].includes(o.status)) {
      if (o.status === 'em_andamento') mapa[tec].emAndamento += 1;
      mapa[tec].horasPrevistas += horasVendidas(o);
    }
  });
  const lista = Object.values(mapa).map((t) => ({
    ...t,
    horasPrevistas: Math.round(t.horasPrevistas * 10) / 10,
    carga: JORNADA > 0 ? Math.round((t.horasPrevistas / JORNADA) * 100) : 0,
  }));
  const ociosos = lista.filter((t) => t.horasPrevistas < JORNADA * 0.5);
  const sobrecarregados = lista.filter((t) => t.horasPrevistas > JORNADA);
  return { lista, ociosos, sobrecarregados };
};

// ── Ranking do dia: consultores e técnicos (por faturamento de OS concluídas hoje) ──
export const rankingDia = (ordens, campo) => {
  const mapa = {};
  (ordens || []).forEach((o) => {
    if (o.status !== 'concluido' || !ehHoje(o.data_fechamento || o.execucao_fim || o.updated_date)) return;
    const chave = (o[campo] || '').trim();
    if (!chave) return;
    if (!mapa[chave]) mapa[chave] = { nome: chave, os: 0, faturamento: 0 };
    mapa[chave].os += 1;
    mapa[chave].faturamento += num(o.valor_total);
  });
  return Object.values(mapa).sort((a, b) => b.faturamento - a.faturamento).slice(0, 5);
};

// ── Próximas revisões programadas (OS abertas com data_prevista futura) ───────
export const proximasRevisoes = (ordens, limite = 6) => {
  const hoje = inicioDoDia();
  return (ordens || [])
    .filter((o) => !['concluido', 'cancelado'].includes(o.status) && o.data_prevista && new Date(o.data_prevista).getTime() >= hoje)
    .sort((a, b) => new Date(a.data_prevista) - new Date(b.data_prevista))
    .slice(0, limite);
};

// ── Clientes para follow-up (leads com proximo_followup <= hoje, não fechados) ─
export const followUpsHoje = (leads, limite = 8) => {
  const fim = fimDoDia();
  return (leads || [])
    .filter((l) => !['ganho', 'perdido'].includes(l.etapa) && l.proximo_followup && new Date(l.proximo_followup).getTime() <= fim)
    .sort((a, b) => new Date(a.proximo_followup) - new Date(b.proximo_followup))
    .slice(0, limite);
};

// ── Alertas importantes (consolidado) ────────────────────────────────────────
export const alertasImportantes = (ctx) => {
  const { ordens = [], pecas = [], contasPagar = [], contasReceber = [], leads = [] } = ctx;
  const alertas = [];
  const hoje = inicioDoDia();
  const fim = fimDoDia();

  const atrasadas = (ordens || []).filter(
    (o) => !['concluido', 'cancelado'].includes(o.status) && o.data_prevista && new Date(o.data_prevista).getTime() < hoje
  ).length;
  if (atrasadas > 0) alertas.push({ tipo: 'danger', texto: `${atrasadas} OS atrasada(s) em relação ao prazo` });

  const estoqueBaixo = (pecas || []).filter((p) => num(p.estoque_atual) <= num(p.estoque_minimo) && num(p.estoque_minimo) > 0).length;
  if (estoqueBaixo > 0) alertas.push({ tipo: 'warning', texto: `${estoqueBaixo} peça(s) abaixo do estoque mínimo` });

  const pagarVence = (contasPagar || []).filter(
    (c) => c.status === 'pendente' && c.data_vencimento && new Date(c.data_vencimento).getTime() <= fim
  ).length;
  if (pagarVence > 0) alertas.push({ tipo: 'warning', texto: `${pagarVence} conta(s) a pagar vencendo hoje ou vencida(s)` });

  const receberVence = (contasReceber || []).filter(
    (c) => c.status === 'pendente' && c.data_vencimento && new Date(c.data_vencimento).getTime() < hoje
  ).length;
  if (receberVence > 0) alertas.push({ tipo: 'danger', texto: `${receberVence} conta(s) a receber em atraso` });

  const followUps = followUpsHoje(leads).length;
  if (followUps > 0) alertas.push({ tipo: 'info', texto: `${followUps} cliente(s) para follow-up hoje` });

  return alertas;
};