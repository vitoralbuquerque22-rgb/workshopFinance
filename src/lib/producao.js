// Biblioteca de cálculos de produção da oficina.
// Baseia-se nas Ordens de Serviço (execucao_inicio, execucao_fim, horas_trabalhadas,
// data_prevista, tecnico_responsavel, timeline por etapa) e nos Elevadores.

import { sessaoHorasLiquidas } from '@/lib/apontamentoHoras';

// Jornada padrão de trabalho por técnico (horas/dia) usada para capacidade/ociosidade.
export const JORNADA_HORAS_DIA = 8;

const horas = (ini, fim) => {
  if (!ini || !fim) return 0;
  const a = new Date(ini).getTime();
  const b = new Date(fim).getTime();
  if (isNaN(a) || isNaN(b) || b <= a) return 0;
  return (b - a) / 3600000;
};

// Horas efetivamente trabalhadas numa OS (prioriza horas_trabalhadas, senão calcula pelo período)
export const horasOs = (os) => {
  const h = Number(os?.horas_trabalhadas) || 0;
  if (h > 0) return h;
  return horas(os?.execucao_inicio, os?.execucao_fim);
};

// Fila de veículos: OS aprovadas/em andamento ainda não concluídas
export const filaVeiculos = (ordens) =>
  (ordens || [])
    .filter((o) => o.status === 'aprovado' || o.status === 'em_andamento')
    .sort((a, b) => {
      // Em andamento primeiro, depois por data prevista (mais urgente primeiro)
      const rank = (o) => (o.status === 'em_andamento' ? 0 : 1);
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      const da = a.data_prevista ? new Date(a.data_prevista).getTime() : Infinity;
      const db = b.data_prevista ? new Date(b.data_prevista).getTime() : Infinity;
      return da - db;
    });

// Entrega prevista: dias restantes até data_prevista (negativo = atrasado)
export const diasParaEntrega = (os) => {
  if (!os?.data_prevista) return null;
  const alvo = new Date(os.data_prevista);
  if (isNaN(alvo.getTime())) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  alvo.setHours(0, 0, 0, 0);
  return Math.round((alvo - hoje) / 86400000);
};

// Produtividade por técnico: horas trabalhadas, OS concluídas, receita gerada
export const produtividadeTecnicos = (ordens, periodoDias = 30) => {
  const limite = Date.now() - periodoDias * 86400000;
  const mapa = {};
  (ordens || []).forEach((o) => {
    const tec = (o.tecnico_responsavel || '').trim();
    if (!tec) return;
    if (!mapa[tec]) mapa[tec] = { tecnico: tec, horas: 0, concluidas: 0, emAndamento: 0, receita: 0, retrabalho: 0 };
    if (o.status === 'em_andamento') mapa[tec].emAndamento += 1;
    const fim = o.execucao_fim ? new Date(o.execucao_fim).getTime() : (o.data_fechamento ? new Date(o.data_fechamento).getTime() : 0);
    if (o.status === 'concluido' && fim >= limite) {
      mapa[tec].concluidas += 1;
      mapa[tec].horas += horasOs(o);
      mapa[tec].receita += Number(o.valor_total) || 0;
      if (o.retrabalho) mapa[tec].retrabalho += 1;
    }
  });
  // Eficiência = horas trabalhadas / capacidade do período
  const capacidade = periodoDias * JORNADA_HORAS_DIA;
  return Object.values(mapa)
    .map((t) => ({
      ...t,
      horas: Math.round(t.horas * 10) / 10,
      eficiencia: capacidade > 0 ? Math.min(100, Math.round((t.horas / capacidade) * 100)) : 0,
      ociosidade: capacidade > 0 ? Math.max(0, Math.round(((capacidade - t.horas) / capacidade) * 100)) : 0,
      taxaRetrabalho: t.concluidas > 0 ? Math.round((t.retrabalho / t.concluidas) * 100) : 0,
    }))
    .sort((a, b) => b.horas - a.horas);
};

// Apontamento por técnico a partir das sessões de cronômetro dos itens das OS.
// Retorna, por técnico: horas líquidas executadas, nº de pausas e minutos de pausa por motivo.
export const apontamentoPorTecnico = (ordens) => {
  const mapa = {};
  (ordens || []).forEach((o) => {
    (o.itens || []).forEach((it) => {
      (it.sessoes || []).forEach((s) => {
        const nome = (s.colaborador_nome || '').trim();
        if (!nome) return;
        if (!mapa[nome]) mapa[nome] = { tecnico: nome, horasApontadas: 0, nPausas: 0, minutosPausa: 0, pausasPorMotivo: {} };
        mapa[nome].horasApontadas += sessaoHorasLiquidas(s);
        (s.pausas || []).forEach((p) => {
          const dur = p.inicio && p.fim ? Math.max(0, (new Date(p.fim) - new Date(p.inicio)) / 60000) : 0;
          mapa[nome].nPausas += 1;
          mapa[nome].minutosPausa += dur;
          mapa[nome].pausasPorMotivo[p.motivo] = (mapa[nome].pausasPorMotivo[p.motivo] || 0) + dur;
        });
      });
    });
  });
  Object.values(mapa).forEach((t) => {
    t.horasApontadas = Math.round(t.horasApontadas * 10) / 10;
    t.minutosPausa = Math.round(t.minutosPausa);
  });
  return mapa;
};

// Gargalos: tempo médio (em horas) que as OS passam em cada etapa do fluxo,
// calculado a partir dos registros de timeline.
export const gargalosPorEtapa = (ordens, etapas) => {
  const acumulado = {};
  etapas.forEach((e) => { acumulado[e.key] = { etapa: e.key, label: e.label, totalHoras: 0, amostras: 0, emCurso: 0 }; });

  (ordens || []).forEach((o) => {
    const tl = [...(o.timeline || [])].filter((t) => t.data).sort((a, b) => new Date(a.data) - new Date(b.data));
    for (let i = 0; i < tl.length; i++) {
      const etapa = tl[i].etapa;
      if (!acumulado[etapa]) continue;
      const inicio = new Date(tl[i].data);
      const fim = tl[i + 1] ? new Date(tl[i + 1].data) : null;
      if (fim) {
        acumulado[etapa].totalHoras += horas(inicio, fim);
        acumulado[etapa].amostras += 1;
      } else if (o.status !== 'concluido' && o.status !== 'cancelado') {
        acumulado[etapa].emCurso += 1;
      }
    }
  });

  // Mantém todas as etapas na ordem do fluxo (entrada -> saída), mesmo sem amostras.
  return etapas.map((e) => {
    const a = acumulado[e.key];
    return { ...a, mediaHoras: a.amostras > 0 ? Math.round((a.totalHoras / a.amostras) * 10) / 10 : 0 };
  });
};

// Indicadores gerais do painel
export const indicadoresProducao = (ordens, elevadores, periodoDias = 30) => {
  const limite = Date.now() - periodoDias * 86400000;
  const concluidasPeriodo = (ordens || []).filter((o) => {
    if (o.status !== 'concluido') return false;
    const fim = o.execucao_fim ? new Date(o.execucao_fim).getTime() : (o.data_fechamento ? new Date(o.data_fechamento).getTime() : 0);
    return fim >= limite;
  });
  const emExecucao = (ordens || []).filter((o) => o.status === 'em_andamento');
  const fila = filaVeiculos(ordens);
  const atrasadas = fila.filter((o) => { const d = diasParaEntrega(o); return d !== null && d < 0; });

  const tecnicos = new Set((ordens || []).map((o) => (o.tecnico_responsavel || '').trim()).filter(Boolean));
  const nTecnicos = tecnicos.size || 1;
  const capacidadeHoras = nTecnicos * periodoDias * JORNADA_HORAS_DIA;
  const horasUsadas = concluidasPeriodo.reduce((s, o) => s + horasOs(o), 0);
  const eficienciaGlobal = capacidadeHoras > 0 ? Math.min(100, Math.round((horasUsadas / capacidadeHoras) * 100)) : 0;

  const retrabalhos = concluidasPeriodo.filter((o) => o.retrabalho).length;
  const taxaRetrabalho = concluidasPeriodo.length > 0 ? Math.round((retrabalhos / concluidasPeriodo.length) * 100) : 0;

  const elevadoresLivres = (elevadores || []).filter((e) => e.status === 'livre').length;
  const elevadoresOcupados = (elevadores || []).filter((e) => e.status === 'ocupado').length;
  const totalElevadores = (elevadores || []).filter((e) => e.status !== 'inativo').length;
  const ocupacaoElevadores = totalElevadores > 0 ? Math.round((elevadoresOcupados / totalElevadores) * 100) : 0;

  return {
    filaTotal: fila.length,
    emExecucao: emExecucao.length,
    concluidasPeriodo: concluidasPeriodo.length,
    atrasadas: atrasadas.length,
    tempoMedioHoras: concluidasPeriodo.length > 0 ? Math.round((horasUsadas / concluidasPeriodo.length) * 10) / 10 : 0,
    eficienciaGlobal,
    ociosidadeGlobal: 100 - eficienciaGlobal,
    taxaRetrabalho,
    nTecnicos: tecnicos.size,
    elevadoresLivres,
    elevadoresOcupados,
    totalElevadores,
    ocupacaoElevadores,
  };
};