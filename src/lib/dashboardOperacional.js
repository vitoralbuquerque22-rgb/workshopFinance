// Fase 9 — Inteligência operacional: agrega indicadores de produção, atendimentos
// externos, ferramentas, auditorias, equipamentos e custos em um só lugar.
import { base44 } from '@/api/base44Client';
import { calcularCustosMissao, carregarConfigCusto } from '@/lib/custosOperacionais';

const media = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

// Carrega e consolida todos os indicadores operacionais.
export async function carregarIndicadores() {
  const [oss, missoes, patrimonios, auditorias, config] = await Promise.all([
    base44.entities.OrdemServico.list('-created_date', 1000).catch(() => []),
    base44.entities.MissaoOperacional.list('-created_date', 1000).catch(() => []),
    base44.entities.Patrimonio.list('-created_date', 2000).catch(() => []),
    base44.entities.Auditoria.list('-created_date', 1000).catch(() => []),
    carregarConfigCusto(),
  ]);

  // Produção (OS ativas em andamento / concluídas)
  const osAtivas = oss.filter((o) => ['aprovado', 'em_andamento'].includes(o.status));
  const osConcluidas = oss.filter((o) => o.status === 'concluido');

  // Atendimentos externos
  const aeAtivos = missoes.filter((m) => ['agendado', 'em_deslocamento', 'em_execucao'].includes(m.status));
  const aeConcluidos = missoes.filter((m) => m.status === 'concluido');

  // Ferramentas (Patrimonio tipo ferramenta)
  const ferramentas = patrimonios.filter((p) => p.tipo === 'ferramenta');
  const ferramentasEmUso = ferramentas.filter((p) => p.status === 'emprestado');
  // Pendentes de devolução: ferramentas ainda não devolvidas em missões concluídas
  const ferramentasPendentes = missoes
    .filter((m) => m.status === 'concluido')
    .reduce((s, m) => s + (m.ferramentas || []).filter((f) => !f.devolvida).length, 0);

  // Auditorias pendentes (não aprovadas/reprovadas)
  const auditoriasPendentes = auditorias.filter((a) =>
    ['aberta', 'em_conferencia', 'aguardando_aprovacao'].includes(a.status));

  // Equipamentos parados (em manutenção)
  const equipamentos = patrimonios.filter((p) => p.tipo === 'equipamento');
  const equipamentosParados = equipamentos.filter((p) => ['em_manutencao', 'baixado', 'extraviado'].includes(p.status));

  // Custos e lucratividade dos atendimentos externos concluídos
  let custoTotal = 0, receitaTotal = 0, rentTotal = 0;
  const rentabilidades = [];
  for (const m of aeConcluidos) {
    const c = m.custos?.calculado_em ? m.custos : calcularCustosMissao(m, config);
    custoTotal += c.custo_total || 0;
    receitaTotal += c.receita || 0;
    rentTotal += c.rentabilidade || 0;
    rentabilidades.push(c.rentabilidade || 0);
  }
  const lucroMedioAtendimento = aeConcluidos.length ? rentTotal / aeConcluidos.length : 0;

  // Tempos médios (atendimentos externos concluídos com marcos registrados)
  const temposAtendimento = aeConcluidos.map((m) => Number(m.tempo_atendimento_min) || 0).filter((v) => v > 0);
  const temposDeslocamento = aeConcluidos.map((m) => Number(m.tempo_deslocamento_min) || 0).filter((v) => v > 0);

  return {
    producao: { ativas: osAtivas.length, concluidas: osConcluidas.length, total: oss.length },
    atendimentosExternos: { ativos: aeAtivos.length, concluidos: aeConcluidos.length, total: missoes.length },
    ferramentasEmUso: ferramentasEmUso.length,
    ferramentasPendentes,
    auditoriasPendentes: auditoriasPendentes.length,
    equipamentosParados: equipamentosParados.length,
    custoTotal,
    receitaTotal,
    lucroMedioAtendimento,
    tempoMedioAtendimento: Math.round(media(temposAtendimento)),
    tempoMedioDeslocamento: Math.round(media(temposDeslocamento)),
    // listas auxiliares para os painéis detalhados
    listas: { osAtivas, aeAtivos, ferramentasEmUso, auditoriasPendentes, equipamentosParados },
  };
}

export function formatarMinutos(min) {
  const m = Number(min) || 0;
  if (m === 0) return '—';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}min` : `${h}h`;
}