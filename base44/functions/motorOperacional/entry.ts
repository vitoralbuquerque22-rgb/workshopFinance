import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// =====================================================================
// MOTOR OPERACIONAL — Fase 3
// Núcleo de sincronização do ERP. Serviço interno, sem tela.
// Recebe um evento operacional, propaga as automações para os módulos
// afetados (Produção, CRM, Agenda, Financeiro, Estoque, BI, Dashboard)
// e registra tudo em EventoOperacional (log central p/ BI e Dashboard).
//
// Chamado por outras backend functions via base44.functions.invoke(
//   'motorOperacional', { evento, ordem_servico_id, ativo_id, payload }
// ). Idempotente por design: as automações verificam estado antes de agir.
// =====================================================================

const EVENTOS = new Set([
  'os_criada',
  'os_aprovada',
  'os_iniciada',
  'os_finalizada',
  'atendimento_externo_criado',
  'ferramenta_retirada',
  'ferramenta_devolvida',
  'auditoria_criada',
  'auditoria_finalizada',
]);

// Mapa evento → módulos que devem ser sincronizados
const MODULOS_POR_EVENTO = {
  os_criada: ['producao', 'crm', 'bi', 'dashboard'],
  os_aprovada: ['producao', 'financeiro', 'agenda', 'bi', 'dashboard'],
  os_iniciada: ['producao', 'agenda', 'bi', 'dashboard'],
  os_finalizada: ['producao', 'financeiro', 'estoque', 'crm', 'bi', 'dashboard'],
  atendimento_externo_criado: ['producao', 'agenda', 'crm', 'bi', 'dashboard'],
  ferramenta_retirada: ['producao', 'estoque', 'bi', 'dashboard'],
  ferramenta_devolvida: ['producao', 'estoque', 'bi', 'dashboard'],
  auditoria_criada: ['estoque', 'bi', 'dashboard'],
  auditoria_finalizada: ['estoque', 'financeiro', 'bi', 'dashboard'],
};

// ---- Automações por evento --------------------------------------------------
// Cada handler retorna { descricao, erros[] }. As chamadas a outros serviços
// são tolerantes a falha (.catch) para não travar o fluxo principal.

async function onOsAprovada(base44, os) {
  const erros = [];
  // Produção: coloca a OS na fila de execução (etapa recepção) se ainda não estiver.
  if (os && !os.etapa_fluxo) {
    await base44.entities.OrdemServico.update(os.id, { etapa_fluxo: 'recepcao' }).catch((e) => erros.push(`producao: ${e.message}`));
  }
  return { descricao: `OS ${os?.numero || ''} aprovada — liberada para produção e previsão financeira`, erros };
}

async function onOsIniciada(base44, os, user) {
  const erros = [];
  // Produção: marca início de execução e move etapa para "execucao".
  if (os && os.status !== 'concluido' && os.status !== 'cancelado') {
    const patch = {
      status: os.status === 'aprovado' ? 'em_andamento' : os.status,
      etapa_fluxo: 'execucao',
      execucao_inicio: os.execucao_inicio || new Date().toISOString(),
      timeline: [...(os.timeline || []), { etapa: 'execucao', descricao: 'Execução iniciada', usuario: user?.full_name || 'Sistema', data: new Date().toISOString() }],
    };
    await base44.entities.OrdemServico.update(os.id, patch).catch((e) => erros.push(`producao: ${e.message}`));
  }
  return { descricao: `OS ${os?.numero || ''} em execução`, erros };
}

async function onFerramentaMovimento(base44, ativo, evento, user) {
  const erros = [];
  if (ativo) {
    const novoStatus = evento === 'ferramenta_retirada' ? 'emprestado' : 'ativo';
    const desc = evento === 'ferramenta_retirada' ? 'Ferramenta retirada' : 'Ferramenta devolvida';
    const historico = [...(ativo.historico || []), { tipo: 'movimentacao', descricao: desc, usuario: user?.full_name || 'Sistema', data: new Date().toISOString() }];
    await base44.entities.Patrimonio.update(ativo.id, { status: novoStatus, historico }).catch((e) => erros.push(`estoque: ${e.message}`));
  }
  return { descricao: evento === 'ferramenta_retirada' ? `Ferramenta ${ativo?.nome || ''} retirada` : `Ferramenta ${ativo?.nome || ''} devolvida`, erros };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { evento, ordem_servico_id, ativo_id, referencia_id, payload = {}, descricao } = body;

    if (!evento || !EVENTOS.has(evento)) {
      return Response.json({ error: 'Evento inválido' }, { status: 400 });
    }

    const modulos = MODULOS_POR_EVENTO[evento] || ['bi', 'dashboard'];
    const erros = [];
    let descFinal = descricao || '';

    // Carrega o alvo do evento uma vez
    const os = ordem_servico_id ? await base44.entities.OrdemServico.get(ordem_servico_id).catch(() => null) : null;
    const ativo = ativo_id ? await base44.entities.Patrimonio.get(ativo_id).catch(() => null) : null;

    // Dispara a automação específica do evento
    if (evento === 'os_aprovada') {
      const r = await onOsAprovada(base44, os); descFinal = descFinal || r.descricao; erros.push(...r.erros);
    } else if (evento === 'os_iniciada') {
      const r = await onOsIniciada(base44, os, user); descFinal = descFinal || r.descricao; erros.push(...r.erros);
    } else if (evento === 'ferramenta_retirada' || evento === 'ferramenta_devolvida') {
      const r = await onFerramentaMovimento(base44, ativo, evento, user); descFinal = descFinal || r.descricao; erros.push(...r.erros);
    } else if (evento === 'os_criada') {
      descFinal = descFinal || `OS ${os?.numero || ''} criada`;
    } else if (evento === 'os_finalizada') {
      descFinal = descFinal || `OS ${os?.numero || ''} finalizada`;
    } else if (evento === 'atendimento_externo_criado') {
      descFinal = descFinal || 'Atendimento externo criado';
    } else if (evento === 'auditoria_criada') {
      descFinal = descFinal || 'Auditoria criada';
    } else if (evento === 'auditoria_finalizada') {
      descFinal = descFinal || 'Auditoria finalizada';
    }

    // Registra o evento no log central (BI / Dashboard / auditoria)
    const registro = await base44.asServiceRole.entities.EventoOperacional.create({
      evento,
      origem: payload.origem || 'motor',
      ordem_servico_id: ordem_servico_id || '',
      ativo_id: ativo_id || '',
      referencia_id: referencia_id || '',
      descricao: descFinal,
      payload,
      modulos_atualizados: modulos,
      status: erros.length === 0 ? 'processado' : 'parcial',
      erros,
      ator_id: user.id,
      ator_nome: user.full_name || user.email,
      empresa_id: payload.empresa_id || (os?.empresa_id || ''),
      filial_id: payload.filial_id || (os?.filial_id || ''),
    }).catch(() => null);

    return Response.json({
      status: erros.length === 0 ? 'sucesso' : 'parcial',
      evento,
      modulos_atualizados: modulos,
      evento_id: registro?.id || null,
      erros,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});