import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ---------------------------------------------------------------------------
// FASE 4 — Réguas inteligentes por comportamento do cliente.
//
// Gera SEQUÊNCIAS de agendamentos (fila MensagemAgendada da Fase 1) conforme
// o comportamento do cliente. O disparo real fica por conta do agendador
// (processarAgendamentos). Cada gatilho tem uma sequência com atrasos.
//
// Dois modos de chamada:
//   { acao: 'evento', evento, ordem_servico_id }  -> pontual (orçamento/executou)
//   { acao: 'varrer' }                            -> varredura do "só perguntou"
//
// Cada template usado prioriza TemplateMensagem (evento + atraso) ativos;
// se não houver, cai em uma sequência padrão embutida.
//
// Interna. Roda via service role (varredura é acionada por workflow sem sessão).
// ---------------------------------------------------------------------------

const HORA_MS = 60 * 60 * 1000;
const DIA_MS = 24 * HORA_MS;

// Sequências padrão (usadas quando não há TemplateMensagem para o evento).
// atraso em ms a partir do gatilho.
const SEQUENCIAS_PADRAO = {
  orcamento_enviado: [
    { atraso: 1 * DIA_MS, texto: 'Olá {cliente}! Conseguiu analisar o orçamento do seu {veiculo}? Já consigo agendar o serviço se decidir. 😉' },
    { atraso: 3 * DIA_MS, texto: 'Oi {cliente}! Posso te ajudar com alguma dúvida sobre o orçamento do {veiculo}? Estou à disposição.' },
  ],
  so_perguntou: [
    { atraso: 0, texto: 'Oi {cliente}! Vi que você tinha interesse em um serviço. Ainda posso te ajudar com aquele orçamento? 🙂' },
  ],
  os_finalizada: [
    { atraso: 1 * DIA_MS, texto: 'Olá {cliente}! Como ficou o seu {veiculo} após o serviço? Ficou tudo certinho?' },
    { atraso: 7 * DIA_MS, texto: 'Oi {cliente}! Que nota de 0 a 10 você daria para o atendimento no seu {veiculo}? Sua opinião nos ajuda muito! ⭐' },
    { atraso: 30 * DIA_MS, texto: 'Olá {cliente}! Já faz um tempo do último serviço no seu {veiculo}. Que tal agendar uma revisão? Estamos aqui. 🔧' },
  ],
};

function atrasoMs(valor, unidade) {
  const v = Number(valor) || 0;
  if (unidade === 'minutos') return v * 60 * 1000;
  if (unidade === 'horas') return v * HORA_MS;
  return v * DIA_MS;
}

function renderTexto(texto, ctx) {
  return String(texto || '')
    .replaceAll('{cliente}', ctx.cliente || 'cliente')
    .replaceAll('{os_numero}', ctx.os_numero || '')
    .replaceAll('{veiculo}', ctx.veiculo || 'veículo')
    .replaceAll('{placa}', ctx.placa || '')
    .replaceAll('{valor}', ctx.valor || '')
    .replaceAll('{consultor}', ctx.consultor || '')
    .replaceAll('{oficina}', ctx.oficina || 'nossa oficina');
}

// Monta a sequência a enfileirar: templates ativos do evento, senão padrão.
function montarSequencia(templates, evento) {
  const doEvento = (templates || [])
    .filter((t) => t.evento === evento && t.ativo !== false)
    .map((t) => ({
      atraso: atrasoMs(t.atraso_valor, t.atraso_unidade),
      texto: t.texto,
      canal: t.canal && t.canal !== 'auto' ? t.canal : null,
      midia_url: t.midia_url || '',
      midia_tipo: t.midia_tipo || '',
      template_id: t.id,
    }));
  if (doEvento.length > 0) return doEvento;
  return (SEQUENCIAS_PADRAO[evento] || []).map((s) => ({ ...s, canal: null }));
}

async function acharOuAbrirConversa(base44, { cliente, lead, veiculo, os, canal }) {
  const telefone = cliente?.celular || cliente?.telefone || lead?.telefone || '';
  if (cliente?.id) {
    const convs = await base44.asServiceRole.entities.Conversa.filter({ cliente_id: cliente.id }, '-ultima_mensagem_em', 20);
    const c = convs.find((x) => x.canal === canal) || convs[0];
    if (c) return c;
  }
  if (lead?.id) {
    const convs = await base44.asServiceRole.entities.Conversa.filter({ lead_id: lead.id }, '-ultima_mensagem_em', 20);
    const c = convs.find((x) => x.canal === canal) || convs[0];
    if (c) return c;
  }
  if (!telefone && !lead) return null;
  return base44.asServiceRole.entities.Conversa.create({
    canal,
    canal_externo_id: telefone,
    contato_nome: cliente?.nome || lead?.nome || 'Contato',
    contato_telefone: telefone,
    contato_email: cliente?.email || lead?.email || '',
    cliente_id: cliente?.id || '',
    veiculo_id: veiculo?.id || '',
    ordem_servico_id: os?.id || '',
    lead_id: lead?.id || '',
    identificacao_status: cliente ? 'identificado' : 'lead_criado',
    status: 'aberta',
    nao_lidas: 0,
  });
}

// Enfileira a sequência (com dedupe por evento+alvo+índice).
async function enfileirarSequencia(base44, { evento, sequencia, conversa, cliente, lead, os, ctx, chaveBase }) {
  let criados = 0;
  for (let i = 0; i < sequencia.length; i++) {
    const passo = sequencia[i];
    const chaveDedupe = `${chaveBase}:${i}`;
    const existe = await base44.asServiceRole.entities.MensagemAgendada.filter({ chave_dedupe: chaveDedupe });
    if (existe.length > 0) continue;
    await base44.asServiceRole.entities.MensagemAgendada.create({
      conversa_id: conversa?.id || '',
      cliente_id: cliente?.id || '',
      lead_id: lead?.id || '',
      ordem_servico_id: os?.id || '',
      template_id: passo.template_id || '',
      evento,
      canal: passo.canal || 'auto',
      texto: renderTexto(passo.texto, ctx),
      midia_url: passo.midia_url || '',
      midia_tipo: passo.midia_tipo || undefined,
      agendado_para: new Date(Date.now() + passo.atraso).toISOString(),
      status: 'pendente',
      chave_dedupe: chaveDedupe,
      empresa_id: os?.empresa_id || '',
      filial_id: os?.filial_id || '',
    });
    criados++;
  }
  return criados;
}

// Gatilhos pontuais ligados a uma OS (orçamento enviado / serviço finalizado).
async function tratarEventoOs(base44, evento, ordemServicoId, templates, empresa) {
  const os = await base44.asServiceRole.entities.OrdemServico.get(ordemServicoId).catch(() => null);
  if (!os) return { status: 'ignorado', motivo: 'os_nao_encontrada' };

  const cliente = os.cliente_id ? await base44.asServiceRole.entities.Cliente.get(os.cliente_id).catch(() => null) : null;
  if (!cliente) return { status: 'ignorado', motivo: 'sem_cliente' };
  if (cliente.aceita_notificacoes === false) return { status: 'ignorado', motivo: 'cliente_optout' };

  const veiculo = os.veiculo_id ? await base44.asServiceRole.entities.Veiculo.get(os.veiculo_id).catch(() => null) : null;
  const canal = 'whatsapp';
  const conversa = await acharOuAbrirConversa(base44, { cliente, veiculo, os, canal });
  if (!conversa) return { status: 'ignorado', motivo: 'sem_conversa' };

  const sequencia = montarSequencia(templates, evento);
  if (sequencia.length === 0) return { status: 'ignorado', motivo: 'sem_sequencia' };

  const ctx = {
    cliente: cliente.nome,
    os_numero: os.numero || '',
    veiculo: veiculo ? `${veiculo.marca || ''} ${veiculo.modelo || ''}`.trim() : '',
    placa: veiculo?.placa || '',
    valor: os.valor_total ? `R$ ${Number(os.valor_total).toFixed(2)}` : '',
    consultor: os.consultor || '',
    oficina: empresa?.nome_fantasia || 'nossa oficina',
  };

  const criados = await enfileirarSequencia(base44, {
    evento, sequencia, conversa, cliente, os, ctx,
    chaveBase: `${evento}:${os.id}`,
  });
  return { status: 'ok', agendamentos: criados };
}

// Varredura "só perguntou e não comprou": conversas abertas, sem OS/venda,
// paradas há mais de LIMITE_HORAS, ainda sem régua de reengajamento.
async function varrerSoPerguntou(base44, templates, empresa) {
  const LIMITE_HORAS = 24;
  const limite = Date.now() - LIMITE_HORAS * HORA_MS;

  const abertas = await base44.asServiceRole.entities.Conversa.filter(
    { status: 'aberta' }, '-ultima_mensagem_em', 200,
  );

  const sequencia = montarSequencia(templates, 'so_perguntou');
  if (sequencia.length === 0) return { status: 'ok', agendamentos: 0, avaliadas: abertas.length };

  let criados = 0;
  for (const conversa of abertas) {
    // Só reengaja quem ainda não virou OS nem venda.
    if (conversa.ordem_servico_id) continue;
    // Precisa estar parada (última mensagem antiga) e ter partido do cliente.
    const ultima = conversa.ultima_mensagem_em ? new Date(conversa.ultima_mensagem_em).getTime() : 0;
    if (!ultima || ultima > limite) continue;
    if (conversa.ultima_mensagem_direcao !== 'entrada') continue;

    const cliente = conversa.cliente_id ? await base44.asServiceRole.entities.Cliente.get(conversa.cliente_id).catch(() => null) : null;
    if (cliente?.aceita_notificacoes === false) continue;
    const lead = conversa.lead_id ? await base44.asServiceRole.entities.Lead.get(conversa.lead_id).catch(() => null) : null;

    const ctx = {
      cliente: cliente?.nome || conversa.contato_nome || 'cliente',
      oficina: empresa?.nome_fantasia || 'nossa oficina',
    };

    const c = await enfileirarSequencia(base44, {
      evento: 'so_perguntou', sequencia, conversa, cliente, lead, ctx,
      chaveBase: `so_perguntou:${conversa.id}`,
    });
    criados += c;
  }
  return { status: 'ok', agendamentos: criados, avaliadas: abertas.length };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Varredura roda por workflow (sem sessão). Evento pontual vem de ação
    // do usuário/manageOs. Se houver usuário, não exige admin (é interno).
    const body = await req.json().catch(() => ({}));
    const acao = body.acao || 'evento';

    const templates = await base44.asServiceRole.entities.TemplateMensagem.list('-updated_date', 200).catch(() => []);
    const empresa = (await base44.asServiceRole.entities.Empresa.list('-created_date', 1))[0] || null;

    if (acao === 'varrer') {
      const r = await varrerSoPerguntou(base44, templates, empresa);
      await base44.functions.invoke('processarAgendamentos', {}).catch(() => {});
      return Response.json(r);
    }

    // acao === 'evento'
    const { evento, ordem_servico_id } = body;
    if (!evento || !ordem_servico_id) {
      return Response.json({ error: 'evento e ordem_servico_id são obrigatórios.' }, { status: 400 });
    }
    if (!['orcamento_enviado', 'os_finalizada'].includes(evento)) {
      return Response.json({ error: `Evento "${evento}" não suportado neste modo.` }, { status: 400 });
    }

    const r = await tratarEventoOs(base44, evento, ordem_servico_id, templates, empresa);
    // Agendamentos futuros; só dispara já os que já venceram (atraso 0).
    await base44.functions.invoke('processarAgendamentos', {}).catch(() => {});
    return Response.json(r);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});