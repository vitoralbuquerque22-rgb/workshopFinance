import { base44 } from '@/api/base44Client';

export const TIPO_CONTRATACAO = {
  clt: 'CLT',
  pj: 'PJ',
  comissionado: 'Comissionado',
  autonomo: 'Autônomo',
  horista: 'Horista',
};

export const MODELO_REMUNERACAO = {
  salario: 'Apenas salário',
  comissao: 'Apenas comissão',
  salario_comissao: 'Salário + comissão',
  salario_bonificacao: 'Salário + bonificação',
  comissao_bonificacao: 'Comissão + bonificação',
  personalizado: 'Personalizado',
};

export const BASE_CALCULO_HORAS = {
  horas_vendidas: 'Horas vendidas',
  horas_apontadas: 'Horas apontadas pelo técnico',
  horas_padrao: 'Horas padrão cadastradas',
  horas_trabalhadas: 'Horas efetivamente trabalhadas',
};

export const CRITERIO_BONUS = {
  horas_produzidas: 'Horas produzidas',
  faturamento: 'Faturamento',
  sem_retrabalho: 'Sem retrabalho/garantia',
  eficiencia: 'Eficiência',
  personalizado: 'Personalizado',
};

const DEFAULT_CONFIG = {
  base_calculo_horas: 'horas_apontadas',
  comissao_padrao_mao_obra: 50,
  comissao_padrao_peca: 0,
  peca_gera_comissao_padrao: false,
  servico_gera_comissao_padrao: true,
  descontar_retrabalho: true,
  descontar_retrabalho_interno: true,
  descontar_retorno_cliente: false,
  aprovacao_obrigatoria: true,
};

// Carrega toda a base necessária para o motor de remuneração.
export async function loadRemuneracaoData() {
  const [config, colaboradores, cargos, regras, bonificacoes] = await Promise.all([
    base44.entities.ConfigRemuneracao.list('-created_date', 1),
    base44.entities.Colaborador.list('-created_date', 500),
    base44.entities.Cargo.list('-created_date', 200),
    base44.entities.RegraComissao.filter({ status: 'ativo' }, '-prioridade', 300),
    base44.entities.Bonificacao.filter({ status: 'ativa' }, '-created_date', 200),
  ]);
  return {
    config: config[0] || DEFAULT_CONFIG,
    colaboradores,
    cargos,
    regras,
    bonificacoes,
  };
}

export function getConfig(config) {
  return { ...DEFAULT_CONFIG, ...(config || {}) };
}

// Resolve a regra de comissão aplicável a um colaborador/categoria.
function resolverRegra({ colaborador, categoria, regras }) {
  if (colaborador?.regra_comissao_id) {
    const r = regras.find((x) => x.id === colaborador.regra_comissao_id);
    if (r) return r;
  }
  const porColab = regras.find((r) => r.escopo === 'colaborador' && r.colaborador_id === colaborador?.id);
  if (porColab) return porColab;
  if (colaborador?.cargo_id) {
    const porCargo = regras.find((r) => r.escopo === 'cargo' && r.cargo_id === colaborador.cargo_id);
    if (porCargo) return porCargo;
  }
  if (categoria) {
    const porCat = regras.find((r) => r.escopo === 'categoria' && r.categoria === categoria);
    if (porCat) return porCat;
  }
  return regras.find((r) => r.escopo === 'global') || null;
}

// Horas de base conforme a política parametrizada da empresa.
function horasBase(item, config) {
  const modo = config.base_calculo_horas;
  if (modo === 'horas_vendidas') return Number(item.horas_vendidas) || 0;
  if (modo === 'horas_padrao') return Number(item.horas_tecnicas_previstas) || 0;
  if (modo === 'horas_trabalhadas') return Number(item.horas_apontadas) || 0;
  // horas_apontadas (padrão): usa apontadas, cai para previstas, depois vendidas
  return Number(item.horas_apontadas) || Number(item.horas_tecnicas_previstas) || Number(item.horas_vendidas) || 0;
}

// Percentual de comissão efetivo de um item, respeitando o override do item.
function percentualItem(item, regra, config) {
  const modo = item.comissao_modo || 'padrao';
  if (modo === 'nao') return 0;
  if (modo === 'personalizado') return Number(item.comissao_percentual) || 0;
  if (item.tipo === 'peca') {
    if (modo === 'sim') return Number(item.comissao_percentual) || regra?.comissao_peca_percentual || config.comissao_padrao_peca || 0;
    if (modo === 'padrao' && !config.peca_gera_comissao_padrao && !regra?.comissao_peca_percentual) return 0;
    return regra?.comissao_peca_percentual || config.comissao_padrao_peca || 0;
  }
  // mão de obra / serviço
  if (regra) {
    if (regra.regras_categoria?.length) {
      const cat = regra.regras_categoria.find((c) => c.categoria === item.categoria);
      if (cat) return Number(cat.percentual) || 0;
    }
    if (regra.comissao_mao_obra_percentual) return regra.comissao_mao_obra_percentual;
  }
  return config.comissao_padrao_mao_obra || 0;
}

// Decide se a comissão de uma OS deve ser descontada por ser retrabalho,
// conforme a política parametrizada na tela de Remuneração.
export function descontaComissaoPorRetrabalho(os, cfg) {
  const tipo = (os?.tipo_retrabalho && os.tipo_retrabalho !== 'nenhum')
    ? os.tipo_retrabalho
    : (os?.retrabalho ? 'interno' : 'nenhum');
  if (tipo === 'nenhum') return false;
  if (tipo === 'interno') return cfg.descontar_retrabalho_interno !== false && cfg.descontar_retrabalho !== false;
  if (tipo === 'retorno_cliente') return cfg.descontar_retorno_cliente === true;
  return false;
}

// Calcula a comissão de um colaborador para uma lista de OS.
export function calcularComissao({ colaborador, ordens, regras, config }) {
  const cfg = getConfig(config);
  const detalhamento = [];
  let total = 0;
  let horasProduzidas = 0;
  let horasVendidas = 0;
  let valorProduzido = 0;

  ordens.forEach((os) => {
    // OS classificada como retrabalho descontável não gera comissão.
    if (descontaComissaoPorRetrabalho(os, cfg)) return;
    (os.itens || []).forEach((item) => {
      const apts = item.apontamentos || [];
      // Sem apontamento: usa técnico responsável como fallback 100% se for este colaborador
      const participacoes = apts.length
        ? apts.filter((a) => a.colaborador_id === colaborador.id)
        : [];

      participacoes.forEach((ap) => {
        const share = (Number(ap.percentual) || 0) / 100;
        if (share <= 0) return;

        const regra = resolverRegra({ colaborador, categoria: item.categoria, regras });
        const pct = percentualItem(item, regra, cfg);

        let base;
        if (item.tipo === 'peca') {
          base = (Number(item.valor_total) || 0) * share;
        } else if (regra?.usar_margem) {
          const margem = calcularMargemItem(item);
          if (margem < (regra.margem_minima || 0)) { base = 0; }
          else { base = (Number(item.valor_total) || 0) * share; }
        } else if (cfg.base_calculo_horas === 'horas_vendidas' || item.tipo !== 'mao_obra') {
          base = (Number(item.valor_total) || 0) * share;
        } else {
          // base por horas: proporção horas de base / horas vendidas sobre o valor
          const hv = Number(item.horas_vendidas) || 0;
          const hb = horasBase(item, cfg);
          const fator = hv > 0 ? hb / hv : 1;
          base = (Number(item.valor_total) || 0) * fator * share;
        }

        const pctEfetivo = regra?.usar_margem ? (regra.comissao_por_margem_percentual || pct) : pct;
        const valor = base * (pctEfetivo / 100);
        total += valor;
        valorProduzido += (Number(item.valor_total) || 0) * share;
        if (item.tipo === 'mao_obra') {
          horasProduzidas += horasBase(item, cfg) * share;
          horasVendidas += (Number(item.horas_vendidas) || 0) * share;
        }

        detalhamento.push({
          ordem_servico_id: os.id,
          os_numero: os.numero || `OS-${os.id.slice(-6)}`,
          descricao: item.descricao,
          base_calculo: base,
          percentual: pctEfetivo,
          valor_comissao: valor,
        });
      });
    });
  });

  return { total, detalhamento, horasProduzidas, horasVendidas, valorProduzido };
}

export function calcularMargemItem(item) {
  const receita = Number(item.valor_total) || 0;
  const custo = (Number(item.custo_unitario) || 0) * (Number(item.quantidade) || 1);
  if (receita <= 0) return 0;
  return ((receita - custo) / receita) * 100;
}

// Avalia bonificações atingidas para o colaborador no período.
export function calcularBonificacoes({ colaborador, bonificacoes, metricas }) {
  let total = 0;
  const detalhes = [];
  bonificacoes.forEach((b) => {
    const aplicavel =
      b.abrangencia === 'global' ||
      (b.abrangencia === 'individual' && b.colaborador_id === colaborador.id) ||
      (b.abrangencia === 'filial' && b.filial_id === colaborador.filial_id) ||
      b.abrangencia === 'equipe';
    if (!aplicavel) return;

    let atingiu = false;
    if (b.criterio === 'horas_produzidas') atingiu = metricas.horasProduzidas >= (b.meta_valor || 0);
    else if (b.criterio === 'faturamento') atingiu = metricas.valorProduzido >= (b.meta_valor || 0);
    else if (b.criterio === 'sem_retrabalho') atingiu = metricas.retrabalhos === 0;
    else if (b.criterio === 'eficiencia') atingiu = metricas.eficiencia >= (b.meta_valor || 0);

    if (atingiu) {
      total += Number(b.valor_bonus) || 0;
      detalhes.push({ nome: b.nome, valor: Number(b.valor_bonus) || 0 });
    }
  });
  return { total, detalhes };
}

// Fecha o resultado de um colaborador para um período.
export function simularColaborador({ colaborador, ordens, regras, bonificacoes, config }) {
  const com = calcularComissao({ colaborador, ordens, regras, config });
  const retrabalhos = ordens.filter((o) =>
    o.retrabalho && (o.itens || []).some((i) => (i.apontamentos || []).some((a) => a.colaborador_id === colaborador.id))
  ).length;
  const eficiencia = com.horasVendidas > 0 ? (com.horasProduzidas / com.horasVendidas) * 100 : 0;
  const metricas = {
    horasProduzidas: com.horasProduzidas,
    horasVendidas: com.horasVendidas,
    valorProduzido: com.valorProduzido,
    retrabalhos,
    eficiencia,
  };
  const bon = calcularBonificacoes({ colaborador, bonificacoes, metricas });

  const modelo = colaborador.modelo_remuneracao || 'salario';
  const usaSalario = ['salario', 'salario_comissao', 'salario_bonificacao', 'personalizado'].includes(modelo);
  const usaComissao = ['comissao', 'salario_comissao', 'comissao_bonificacao', 'personalizado'].includes(modelo);
  const usaBonus = ['salario_bonificacao', 'comissao_bonificacao', 'personalizado'].includes(modelo);

  const salario = usaSalario ? (Number(colaborador.salario_base) || 0) : 0;
  const comissao = usaComissao ? com.total : 0;
  const bonificacao = usaBonus ? bon.total : 0;
  const descontos = Number(colaborador.descontos_fixos) || 0;
  const totalLiquido = salario + comissao + bonificacao - descontos;

  return {
    salario,
    comissao,
    bonificacao,
    descontos,
    totalLiquido,
    detalhamento: com.detalhamento,
    bonusDetalhes: bon.detalhes,
    ...metricas,
    eficiencia,
  };
}

const parsePeriodo = (d) => (d ? new Date(d) : null);

// Filtra OS concluídas no período (competência).
export function ordensDoPeriodo(ordens, inicio, fim) {
  const di = parsePeriodo(inicio);
  const df = fim ? new Date(fim + 'T23:59:59') : null;
  return ordens.filter((o) => {
    if (!['concluido', 'aprovado', 'em_andamento'].includes(o.status)) return false;
    const dt = o.data_fechamento || o.data_abertura || o.created_date;
    if (!dt) return true;
    const d = new Date(dt);
    if (di && d < di) return false;
    if (df && d > df) return false;
    return true;
  });
}