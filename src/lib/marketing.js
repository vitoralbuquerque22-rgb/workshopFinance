import { base44 } from '@/api/base44Client';

export const PLATAFORMAS = {
  meta_ads: { label: 'Meta Ads', color: '#1877F2' },
  google_ads: { label: 'Google Ads', color: '#EA4335' },
  instagram: { label: 'Instagram', color: '#E1306C' },
  whatsapp: { label: 'WhatsApp', color: '#25D366' },
  site: { label: 'Site', color: '#6366F1' },
  indicacao: { label: 'Indicação', color: '#10B981' },
  outro: { label: 'Outro', color: '#94A3B8' },
};

export const ORIGENS_LABEL = {
  gps_vendas: 'GPS de Vendas',
  manual: 'Manual',
  indicacao: 'Indicação',
  whatsapp: 'WhatsApp',
  telefone: 'Telefone',
  site: 'Site',
  passagem: 'Passagem',
  meta_ads: 'Meta Ads',
  google_ads: 'Google Ads',
  instagram: 'Instagram',
  formulario: 'Formulário',
  landing_page: 'Landing Page',
};

// Carrega dados brutos usados por todos os painéis de marketing.
export async function loadMarketingData() {
  const [campanhas, leads, ordens, receber] = await Promise.all([
    base44.entities.Campanha.list('-created_date', 500),
    base44.entities.Lead.list('-created_date', 1000),
    base44.entities.OrdemServico.list('-created_date', 1000),
    base44.entities.ContaReceber.list('-created_date', 1000),
  ]);
  return { campanhas, leads, ordens, receber };
}

const dentroPeriodo = (dateStr, inicio, fim) => {
  if (!inicio && !fim) return true;
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (inicio && d < new Date(inicio)) return false;
  if (fim && d > new Date(fim + 'T23:59:59')) return false;
  return true;
};

// Calcula métricas consolidadas e por campanha.
export function calcularMetricas({ campanhas, leads, ordens, receber }, filtros = {}) {
  const { inicio, fim, plataforma, consultor } = filtros;

  const leadsF = leads.filter((l) => {
    const dt = l.data_captura || l.created_date;
    if (!dentroPeriodo(dt, inicio, fim)) return false;
    if (plataforma && (l.plataforma || l.origem) !== plataforma) return false;
    if (consultor && l.consultor !== consultor) return false;
    return true;
  });

  const campanhasF = campanhas.filter((c) => !plataforma || c.plataforma === plataforma);

  // Receita realizada (contas a receber recebidas de OS)
  const receitaOs = (osId) => {
    const os = ordens.find((o) => o.id === osId);
    return os ? (os.valor_total || 0) : 0;
  };

  const investimentoTotal = campanhasF.reduce((s, c) => s + (c.investimento || 0), 0);
  const invMeta = campanhasF.filter((c) => c.plataforma === 'meta_ads').reduce((s, c) => s + (c.investimento || 0), 0);
  const invGoogle = campanhasF.filter((c) => c.plataforma === 'google_ads').reduce((s, c) => s + (c.investimento || 0), 0);

  const leadsGerados = leadsF.length;
  const leadsQualificados = leadsF.filter((l) => l.qualificado || ['negociacao', 'ganho'].includes(l.etapa)).length;
  const leadsConvertidos = leadsF.filter((l) => l.status === 'convertido' || l.etapa === 'ganho').length;

  const cpl = leadsGerados > 0 ? investimentoTotal / leadsGerados : 0;
  const taxaConversao = leadsGerados > 0 ? (leadsConvertidos / leadsGerados) * 100 : 0;
  const cac = leadsConvertidos > 0 ? investimentoTotal / leadsConvertidos : 0;

  // Tempo médio até primeiro atendimento (horas)
  const temposAtend = leadsF
    .filter((l) => l.primeiro_atendimento_em && (l.data_captura || l.created_date))
    .map((l) => (new Date(l.primeiro_atendimento_em) - new Date(l.data_captura || l.created_date)) / 36e5);
  const tempoMedioAtend = temposAtend.length ? temposAtend.reduce((a, b) => a + b, 0) / temposAtend.length : 0;

  // Receita/OS ligadas a leads convertidos
  const clienteIds = new Set(leadsF.map((l) => l.cliente_id).filter(Boolean));
  const ordensLigadas = ordens.filter((o) => clienteIds.has(o.cliente_id) && dentroPeriodo(o.data_abertura || o.created_date, inicio, fim));
  const osAbertas = ordensLigadas.length;
  const valorVendido = ordensLigadas.reduce((s, o) => s + (o.valor_total || 0), 0);
  const custoTotal = ordensLigadas.reduce((s, o) => s + (o.custo_total || 0), 0);
  const ticketMedio = osAbertas > 0 ? valorVendido / osAbertas : 0;
  const lucroBruto = valorVendido - custoTotal;
  const lucroLiquido = lucroBruto - investimentoTotal;

  const roi = investimentoTotal > 0 ? (lucroLiquido / investimentoTotal) * 100 : 0;
  const roas = investimentoTotal > 0 ? valorVendido / investimentoTotal : 0;
  const ltv = clienteIds.size > 0 ? valorVendido / clienteIds.size : 0;

  return {
    investimentoTotal, invMeta, invGoogle,
    leadsGerados, leadsQualificados, leadsConvertidos,
    cpl, taxaConversao, cac, tempoMedioAtend,
    osAbertas, valorVendido, ticketMedio,
    lucroBruto, lucroLiquido, roi, roas, ltv,
    leadsFiltrados: leadsF,
  };
}

// Métricas agrupadas por campanha (para tabela ROI).
export function metricasPorCampanha({ campanhas, leads, ordens }) {
  return campanhas.map((c) => {
    const leadsC = leads.filter((l) => l.campanha_id === c.id);
    const convertidos = leadsC.filter((l) => l.status === 'convertido' || l.etapa === 'ganho');
    const clienteIds = new Set(convertidos.map((l) => l.cliente_id).filter(Boolean));
    const ordensC = ordens.filter((o) => clienteIds.has(o.cliente_id));
    const receita = ordensC.reduce((s, o) => s + (o.valor_total || 0), 0);
    const custo = ordensC.reduce((s, o) => s + (o.custo_total || 0), 0);
    const investimento = c.investimento || 0;
    const lucro = receita - custo - investimento;
    return {
      campanha: c,
      investimento,
      leads: leadsC.length,
      clientes: clienteIds.size,
      ordens: ordensC.length,
      receita,
      lucro,
      roi: investimento > 0 ? (lucro / investimento) * 100 : 0,
      roas: investimento > 0 ? receita / investimento : 0,
      cpl: leadsC.length > 0 ? investimento / leadsC.length : 0,
    };
  });
}

// Distribuição de leads por origem.
export function leadsPorOrigem(leads) {
  const map = {};
  leads.forEach((l) => {
    const key = l.plataforma || l.origem || 'outro';
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map).map(([key, value]) => ({
    origem: ORIGENS_LABEL[key] || PLATAFORMAS[key]?.label || key,
    quantidade: value,
    color: PLATAFORMAS[key]?.color || '#94A3B8',
  }));
}