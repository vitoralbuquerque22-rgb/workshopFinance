// Biblioteca de cálculos de Business Intelligence (Dashboard Executivo).
// Consolida OS, financeiro, estoque, CRM, técnicos e consultores num único conjunto de indicadores.

const num = (v) => Number(v) || 0;

const dentroPeriodo = (dateStr, ini, fim) => {
  if (!dateStr) return false;
  const d = new Date(dateStr).getTime();
  if (isNaN(d)) return false;
  return d >= ini && d <= fim;
};

// Retorna {ini, fim} em ms para os últimos N dias, ou período customizado
export const rangePeriodo = (dias, dataInicio, dataFim) => {
  if (dataInicio && dataFim) {
    const ini = new Date(dataInicio); ini.setHours(0, 0, 0, 0);
    const fim = new Date(dataFim); fim.setHours(23, 59, 59, 999);
    return { ini: ini.getTime(), fim: fim.getTime() };
  }
  const fim = Date.now();
  const ini = fim - (dias || 30) * 86400000;
  return { ini, fim };
};

// Data de referência de uma OS para agrupamento temporal
const dataOs = (os) => os.data_fechamento || os.execucao_fim || os.data_abertura || os.created_date;

// ── KPIs executivos principais ──────────────────────────────────────────────
export const kpisExecutivos = (dados, range) => {
  const { ordens = [], contasReceber = [], contasPagar = [], leads = [], pecas = [], clientes = [] } = dados;
  const { ini, fim } = range;

  const osPeriodo = ordens.filter((o) => dentroPeriodo(dataOs(o), ini, fim));
  const concluidas = osPeriodo.filter((o) => o.status === 'concluido');

  const faturamento = concluidas.reduce((s, o) => s + num(o.valor_total), 0);
  const cmv = concluidas.reduce((s, o) => s + num(o.custo_total), 0);
  const lucro = faturamento - cmv;
  const markup = cmv > 0 ? ((faturamento - cmv) / cmv) * 100 : 0;
  const margem = faturamento > 0 ? (lucro / faturamento) * 100 : 0;
  const ticketMedio = concluidas.length > 0 ? faturamento / concluidas.length : 0;

  // Conversão de OS (orçamento -> aprovado/em_andamento/concluido)
  const totalOrcadas = osPeriodo.length;
  const efetivadas = osPeriodo.filter((o) => o.status !== 'orcamento' && o.status !== 'cancelado').length;
  const conversao = totalOrcadas > 0 ? (efetivadas / totalOrcadas) * 100 : 0;

  // OS abertas / atrasadas (estado atual, não por período)
  const abertas = ordens.filter((o) => ['orcamento', 'aprovado', 'em_andamento'].includes(o.status));
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const atrasadas = abertas.filter((o) => o.data_prevista && new Date(o.data_prevista) < hoje);

  // Peças vendidas (valor) no período
  const valorPecas = concluidas.reduce(
    (s, o) => s + (o.itens || []).filter((i) => i.tipo === 'peca').reduce((a, i) => a + num(i.valor_total), 0),
    0
  );
  const valorServicos = concluidas.reduce(
    (s, o) => s + (o.itens || []).filter((i) => i.tipo !== 'peca').reduce((a, i) => a + num(i.valor_total), 0),
    0
  );

  // Estoque (posição atual)
  const valorEstoque = pecas.reduce((s, p) => s + num(p.estoque_atual) * num(p.valor_custo_medio), 0);
  const pecasAbaixoMinimo = pecas.filter((p) => num(p.estoque_atual) <= num(p.estoque_minimo) && num(p.estoque_minimo) > 0).length;

  // Financeiro (posição atual, pendentes)
  const aReceber = contasReceber.filter((c) => c.status === 'pendente').reduce((s, c) => s + num(c.valor), 0);
  const aPagar = contasPagar.filter((c) => c.status === 'pendente').reduce((s, c) => s + num(c.valor), 0);
  const saldoFinanceiro = aReceber - aPagar;

  // CRM
  const leadsPeriodo = leads.filter((l) => dentroPeriodo(l.created_date, ini, fim));
  const leadsGanhos = leadsPeriodo.filter((l) => l.etapa === 'ganho' || l.status === 'convertido').length;
  const conversaoLeads = leadsPeriodo.length > 0 ? (leadsGanhos / leadsPeriodo.length) * 100 : 0;

  // Clientes ativos (com OS no período)
  const clientesAtivos = new Set(osPeriodo.map((o) => o.cliente_id).filter(Boolean)).size;

  return {
    faturamento, cmv, lucro, markup, margem, ticketMedio, conversao,
    osAbertas: abertas.length, osAtrasadas: atrasadas.length, osConcluidas: concluidas.length,
    valorPecas, valorServicos, valorEstoque, pecasAbaixoMinimo,
    aReceber, aPagar, saldoFinanceiro,
    leadsTotal: leadsPeriodo.length, leadsGanhos, conversaoLeads,
    clientesAtivos, clientesTotal: clientes.length,
  };
};

// ── Faturamento mensal (últimos N meses) para gráfico comparativo ────────────
export const faturamentoMensal = (ordens, meses = 6) => {
  const now = new Date();
  const out = [];
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const mesOs = (ordens || []).filter((o) => {
      if (o.status !== 'concluido') return false;
      const od = new Date(dataOs(o));
      return !isNaN(od.getTime()) && od.getMonth() === m && od.getFullYear() === y;
    });
    const faturamento = mesOs.reduce((s, o) => s + num(o.valor_total), 0);
    const custo = mesOs.reduce((s, o) => s + num(o.custo_total), 0);
    const meses_ = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    out.push({ mes: meses_[m], Faturamento: Math.round(faturamento), Lucro: Math.round(faturamento - custo), Custo: Math.round(custo) });
  }
  return out;
};

// ── Ranking por técnico (faturamento / OS concluídas) ────────────────────────
export const rankingTecnicos = (ordens, range) => {
  const { ini, fim } = range;
  const mapa = {};
  (ordens || []).forEach((o) => {
    if (o.status !== 'concluido' || !dentroPeriodo(dataOs(o), ini, fim)) return;
    const tec = (o.tecnico_responsavel || '').trim();
    if (!tec) return;
    if (!mapa[tec]) mapa[tec] = { nome: tec, os: 0, faturamento: 0, lucro: 0 };
    mapa[tec].os += 1;
    mapa[tec].faturamento += num(o.valor_total);
    mapa[tec].lucro += num(o.valor_total) - num(o.custo_total);
  });
  return Object.values(mapa).sort((a, b) => b.faturamento - a.faturamento);
};

// ── Ranking por consultor ────────────────────────────────────────────────────
export const rankingConsultores = (ordens, range) => {
  const { ini, fim } = range;
  const mapa = {};
  (ordens || []).forEach((o) => {
    if (!dentroPeriodo(dataOs(o), ini, fim)) return;
    const c = (o.consultor || '').trim();
    if (!c) return;
    if (!mapa[c]) mapa[c] = { nome: c, os: 0, faturamento: 0, convertidas: 0 };
    mapa[c].os += 1;
    if (o.status === 'concluido') {
      mapa[c].faturamento += num(o.valor_total);
      mapa[c].convertidas += 1;
    }
  });
  return Object.values(mapa)
    .map((c) => ({ ...c, conversao: c.os > 0 ? Math.round((c.convertidas / c.os) * 100) : 0 }))
    .sort((a, b) => b.faturamento - a.faturamento);
};

// ── Top clientes por faturamento ─────────────────────────────────────────────
export const topClientes = (ordens, clientes, range, limite = 8) => {
  const { ini, fim } = range;
  const nomes = {};
  (clientes || []).forEach((c) => { nomes[c.id] = c.nome; });
  const mapa = {};
  (ordens || []).forEach((o) => {
    if (o.status !== 'concluido' || !dentroPeriodo(dataOs(o), ini, fim) || !o.cliente_id) return;
    if (!mapa[o.cliente_id]) mapa[o.cliente_id] = { id: o.cliente_id, nome: nomes[o.cliente_id] || '—', os: 0, faturamento: 0 };
    mapa[o.cliente_id].os += 1;
    mapa[o.cliente_id].faturamento += num(o.valor_total);
  });
  return Object.values(mapa).sort((a, b) => b.faturamento - a.faturamento).slice(0, limite);
};

// ── Funil comercial (leads por etapa) ────────────────────────────────────────
export const funilComercial = (leads, range) => {
  const { ini, fim } = range;
  const etapas = [
    { key: 'novo', label: 'Novo' },
    { key: 'em_contato', label: 'Em Contato' },
    { key: 'negociacao', label: 'Negociação' },
    { key: 'ganho', label: 'Ganho' },
    { key: 'perdido', label: 'Perdido' },
  ];
  const periodo = (leads || []).filter((l) => dentroPeriodo(l.created_date, ini, fim));
  return etapas.map((e) => ({
    etapa: e.label,
    quantidade: periodo.filter((l) => l.etapa === e.key).length,
    valor: periodo.filter((l) => l.etapa === e.key).reduce((s, l) => s + num(l.valor_estimado), 0),
  }));
};

// ── Comparativo período atual vs anterior ────────────────────────────────────
export const comparativoPeriodo = (dados, range) => {
  const { ini, fim } = range;
  const duracao = fim - ini;
  const rangeAnterior = { ini: ini - duracao, fim: ini };
  const atual = kpisExecutivos(dados, range);
  const anterior = kpisExecutivos(dados, rangeAnterior);
  const variacao = (a, b) => (b > 0 ? Math.round(((a - b) / b) * 100) : (a > 0 ? 100 : 0));
  return {
    faturamento: variacao(atual.faturamento, anterior.faturamento),
    lucro: variacao(atual.lucro, anterior.lucro),
    ticketMedio: variacao(atual.ticketMedio, anterior.ticketMedio),
    osConcluidas: variacao(atual.osConcluidas, anterior.osConcluidas),
    conversao: variacao(atual.conversao, anterior.conversao),
    anterior,
  };
};