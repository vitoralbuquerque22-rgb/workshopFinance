import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// =====================================================================
// FASE 7 — AGENDA OPERACIONAL
// Ações:
//  - gerar: varre as rotinas ativas e cria as ocorrências (tarefas) devidas;
//           varre patrimônio/frota e cria tarefas de vencimento;
//           envia alertas por e-mail dos responsáveis. Idempotente.
//  - concluir: marca uma tarefa como concluída
// Chamado manualmente (botão "Gerar agenda") e por scheduler diário.
// =====================================================================

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDiasISO(iso, dias) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + dias);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function addMesesISO(iso, meses) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1 + meses, d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function proximaData(baseISO, rec) {
  const intervalo = Math.max(1, Number(rec?.intervalo) || 1);
  switch (rec?.frequencia) {
    case 'diaria': return addDiasISO(baseISO, intervalo);
    case 'semanal': return addDiasISO(baseISO, 7 * intervalo);
    case 'quinzenal': return addDiasISO(baseISO, 14 * intervalo);
    case 'mensal': return addMesesISO(baseISO, intervalo);
    default: return addDiasISO(baseISO, 7);
  }
}

// Gera ocorrências das rotinas recorrentes ativas cuja próxima geração já venceu.
async function gerarRecorrentes(base44, hoje, usuario, resumo) {
  const modelos = await base44.entities.TarefaOperacional.list('-created_date', 500).catch(() => []);
  for (const modelo of modelos) {
    const rec = modelo.recorrencia;
    if (!rec?.ativa) continue;
    // Loop de recuperação: gera todas as datas pendentes até hoje (com trava)
    let proxima = rec.proxima_geracao || modelo.data_prevista || hoje;
    let seguranca = 0;
    while (proxima <= hoje && seguranca < 60) {
      seguranca++;
      // Idempotência: não duplica uma ocorrência do mesmo modelo na mesma data
      const jaExiste = await base44.entities.TarefaOperacional
        .filter({ modelo_id: modelo.id, data_prevista: proxima }).catch(() => []);
      if (jaExiste.length === 0) {
        await base44.entities.TarefaOperacional.create({
          titulo: modelo.titulo,
          descricao: modelo.descricao || '',
          tipo: modelo.tipo || 'tarefa',
          prioridade: modelo.prioridade || 'media',
          data_prevista: proxima,
          hora_prevista: modelo.hora_prevista || '',
          responsavel_id: modelo.responsavel_id || '',
          responsavel_nome: modelo.responsavel_nome || '',
          checklist: (modelo.checklist || []).map((c) => ({ descricao: c.descricao, concluido: false })),
          modelo_id: modelo.id,
          status: 'pendente',
          filial_id: modelo.filial_id || '',
          empresa_id: modelo.empresa_id || '',
        });
        resumo.tarefasGeradas++;
      }
      proxima = proximaData(proxima, rec);
    }
    // Atualiza a próxima geração do modelo
    if (proxima !== rec.proxima_geracao) {
      await base44.entities.TarefaOperacional.update(modelo.id, {
        recorrencia: { ...rec, proxima_geracao: proxima },
      });
    }
  }
}

// Cria tarefas de vencimento a partir da manutenção preventiva de patrimônio e frota.
async function gerarVencimentos(base44, hoje, resumo) {
  const limite = addDiasISO(hoje, 15); // janela de antecedência

  const patrimonios = await base44.entities.Patrimonio.list('-created_date', 500).catch(() => []);
  for (const p of patrimonios) {
    const prox = p.manutencao_preventiva?.proxima_em;
    if (!p.manutencao_preventiva?.ativa || !prox || prox > limite) continue;
    const jaExiste = await base44.entities.TarefaOperacional
      .filter({ tipo: 'vencimento', 'referencia.referencia_id': p.id, data_prevista: prox }).catch(() => []);
    if (jaExiste.length > 0) continue;
    await base44.entities.TarefaOperacional.create({
      titulo: `Manutenção preventiva — ${p.nome}`,
      descricao: `Manutenção preventiva do patrimônio ${p.codigo_patrimonial || ''} (${p.nome}).`,
      tipo: 'vencimento',
      prioridade: prox <= hoje ? 'alta' : 'media',
      data_prevista: prox,
      responsavel_id: p.responsavel_id || '',
      responsavel_nome: p.responsavel_nome || '',
      referencia: { tipo: 'patrimonio', referencia_id: p.id, descricao: p.nome },
      status: 'pendente',
      filial_id: p.filial_id || '',
    });
    resumo.vencimentosGerados++;
  }

  const frota = await base44.entities.AtivoOperacional.list('-created_date', 500).catch(() => []);
  for (const a of frota) {
    const candidatos = [];
    if (a.manutencao_preventiva?.ativa && a.manutencao_preventiva?.proxima_em) {
      candidatos.push({ data: a.manutencao_preventiva.proxima_em, motivo: 'Manutenção preventiva' });
    }
    if (a.documentacao?.licenciamento_vence_em) candidatos.push({ data: a.documentacao.licenciamento_vence_em, motivo: 'Licenciamento' });
    if (a.documentacao?.seguro_vence_em) candidatos.push({ data: a.documentacao.seguro_vence_em, motivo: 'Seguro' });
    for (const c of candidatos) {
      if (!c.data || c.data > limite) continue;
      const jaExiste = await base44.entities.TarefaOperacional
        .filter({ tipo: 'vencimento', 'referencia.referencia_id': a.id, data_prevista: c.data }).catch(() => []);
      if (jaExiste.length > 0) continue;
      await base44.entities.TarefaOperacional.create({
        titulo: `${c.motivo} — ${a.nome}`,
        descricao: `${c.motivo} do ativo de frota ${a.placa || a.nome}.`,
        tipo: 'vencimento',
        prioridade: c.data <= hoje ? 'alta' : 'media',
        data_prevista: c.data,
        responsavel_id: a.responsavel_id || '',
        responsavel_nome: a.responsavel_nome || '',
        referencia: { tipo: 'frota', referencia_id: a.id, descricao: a.nome },
        status: 'pendente',
        filial_id: a.filial_id || '',
      });
      resumo.vencimentosGerados++;
    }
  }
}

// Envia alerta por e-mail das tarefas pendentes de hoje agrupadas por responsável.
async function enviarAlertas(base44, hoje, resumo) {
  const pendentes = await base44.entities.TarefaOperacional
    .filter({ data_prevista: hoje, status: 'pendente' }).catch(() => []);
  const porResponsavel = {};
  for (const t of pendentes) {
    if (!t.responsavel_id) continue;
    (porResponsavel[t.responsavel_id] = porResponsavel[t.responsavel_id] || []).push(t);
  }
  for (const [colabId, tarefas] of Object.entries(porResponsavel)) {
    const colab = await base44.entities.Colaborador.get(colabId).catch(() => null);
    if (!colab?.email) continue;
    const linhas = tarefas.map((t) => `• ${t.titulo}${t.hora_prevista ? ' (' + t.hora_prevista + ')' : ''}`).join('\n');
    await base44.integrations.Core.SendEmail({
      to: colab.email,
      subject: `Agenda do dia — ${tarefas.length} tarefa(s) para hoje`,
      body: `Olá ${colab.nome || ''},\n\nVocê tem ${tarefas.length} tarefa(s) agendada(s) para hoje:\n\n${linhas}\n\nAcesse o sistema para conferir os detalhes.`,
    }).catch(() => null);
    resumo.alertasEnviados++;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;
    const hoje = hojeISO();
    const usuario = user.full_name || user.email;

    if (action === 'gerar') {
      const resumo = { tarefasGeradas: 0, vencimentosGerados: 0, alertasEnviados: 0 };
      await gerarRecorrentes(base44, hoje, usuario, resumo);
      await gerarVencimentos(base44, hoje, resumo);
      if (body.enviarAlertas !== false) await enviarAlertas(base44, hoje, resumo);
      return Response.json({ status: 'sucesso', resumo });
    }

    if (action === 'concluir') {
      const { tarefa_id } = body;
      const tarefa = await base44.entities.TarefaOperacional.get(tarefa_id).catch(() => null);
      if (!tarefa) return Response.json({ error: 'Tarefa não encontrada' }, { status: 404 });
      const updated = await base44.entities.TarefaOperacional.update(tarefa_id, {
        status: 'concluida',
        concluida_em: new Date().toISOString(),
        concluida_por_nome: usuario,
      });
      return Response.json({ status: 'sucesso', tarefa: updated });
    }

    return Response.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});