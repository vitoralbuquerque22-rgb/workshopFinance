import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// =====================================================================
// FASE 8 — CUSTOS OPERACIONAIS
// Ações:
//  - calcular: recalcula os custos/rentabilidade/margem de UMA missão e,
//              se a config pedir, gera/atualiza a Conta a Pagar (financeiro).
//  - recalcular_todos: recalcula todas as missões concluídas (dashboard).
// =====================================================================

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

async function carregarConfig(base44, filialId) {
  const todas = await base44.asServiceRole.entities.ConfigCustoOperacional.list('-created_date', 50).catch(() => []);
  if (filialId) {
    const daFilial = todas.find((c) => c.filial_id === filialId && c.ativo !== false);
    if (daFilial) return daFilial;
  }
  return todas.find((c) => !c.filial_id && c.ativo !== false) || todas[0] || null;
}

function calcularCustos(missao, cfg) {
  const c = cfg || {};
  const km = Number(missao.km_percorrido) || 0;
  const horas = (Number(missao.tempo_atendimento_min) || 0) / 60;
  const pessoas = Math.max(1, (missao.equipe || []).length);

  const custo_km = round2(km * (Number(c.valor_km) || 0));
  const custo_horas = round2(horas * (Number(c.valor_hora) || 0) * pessoas);
  const custo_pecas = round2((missao.pecas || []).reduce(
    (s, p) => s + (Number(p.custo_unitario) || 0) * (Number(p.quantidade) || 0), 0));
  const pedagio = Number(missao.custos?.pedagio ?? c.valor_pedagio) || 0;
  const alimentacao = Number(missao.custos?.alimentacao ?? c.valor_alimentacao) || 0;
  const hospedagem = Number(missao.custos?.hospedagem ?? c.valor_hospedagem) || 0;

  const custo_total = round2(custo_km + custo_horas + custo_pecas + pedagio + alimentacao + hospedagem);
  const receita_pecas = (missao.pecas || []).reduce(
    (s, p) => s + (Number(p.valor_unitario) || 0) * (Number(p.quantidade) || 0), 0);
  const receita = round2((Number(missao.valor_servico) || 0) + receita_pecas);
  const rentabilidade = round2(receita - custo_total);
  const margem = receita > 0 ? round2((rentabilidade / receita) * 100) : 0;

  return { custo_km, custo_horas, custo_pecas, pedagio, alimentacao, hospedagem, custo_total, receita, rentabilidade, margem };
}

// Gera/atualiza a Conta a Pagar do custo operacional da missão (atualiza o Financeiro).
async function sincronizarFinanceiro(base44, missao, custos, cfg, usuario) {
  if (!cfg?.gerar_conta_pagar || custos.custo_total <= 0) return null;

  const descricao = `Custo operacional — Atendimento ${missao.numero || missao.titulo || ''}`.trim();
  const dados = {
    descricao,
    categoria: 'Custo Operacional Externo',
    centro_custo_id: cfg.centro_custo_id || '',
    valor: custos.custo_total,
    data_vencimento: (new Date().toISOString().slice(0, 10)),
    status: 'pendente',
    origem: 'manual',
    filial_id: missao.filial_id || '',
    observacoes: `Gerado automaticamente pelo controle de custos operacionais (${usuario}).`,
  };

  const existenteId = missao.custos?.conta_pagar_id;
  if (existenteId) {
    const existente = await base44.asServiceRole.entities.ContaPagar.get(existenteId).catch(() => null);
    if (existente && existente.status !== 'pago') {
      await base44.asServiceRole.entities.ContaPagar.update(existenteId, { valor: custos.custo_total });
      return existenteId;
    }
    if (existente) return existenteId; // já pago, não mexe
  }
  const criada = await base44.asServiceRole.entities.ContaPagar.create(dados);
  return criada.id;
}

async function processarMissao(base44, missaoId, usuario) {
  const missao = await base44.asServiceRole.entities.MissaoOperacional.get(missaoId).catch(() => null);
  if (!missao) return null;
  const cfg = await carregarConfig(base44, missao.filial_id);
  const custos = calcularCustos(missao, cfg);
  const conta_pagar_id = await sincronizarFinanceiro(base44, missao, custos, cfg, usuario);
  const bloco = {
    ...custos,
    conta_pagar_id: conta_pagar_id || missao.custos?.conta_pagar_id || '',
    calculado_em: new Date().toISOString(),
  };
  await base44.asServiceRole.entities.MissaoOperacional.update(missaoId, { custos: bloco });
  return bloco;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const usuario = user.full_name || user.email;

    const body = await req.json();
    const { action } = body;

    if (action === 'calcular') {
      if (!body.missao_id) return Response.json({ error: 'missao_id obrigatório' }, { status: 400 });
      const custos = await processarMissao(base44, body.missao_id, usuario);
      if (!custos) return Response.json({ error: 'Missão não encontrada' }, { status: 404 });
      return Response.json({ status: 'sucesso', custos });
    }

    if (action === 'recalcular_todos') {
      const missoes = await base44.asServiceRole.entities.MissaoOperacional
        .filter({ status: 'concluido' }, '-created_date', 1000).catch(() => []);
      let processadas = 0;
      for (const m of missoes) {
        await processarMissao(base44, m.id, usuario);
        processadas++;
      }
      return Response.json({ status: 'sucesso', processadas });
    }

    return Response.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});