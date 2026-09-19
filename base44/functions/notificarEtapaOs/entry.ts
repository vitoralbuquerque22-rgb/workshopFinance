import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ---------------------------------------------------------------------------
// FASE 2 — Notificação automática por mudança de etapa da OS.
//
// Chamada quando a OS muda de etapa_fluxo. Verifica a ConfigNotificacao:
//   - notificações ligadas?
//   - a etapa está na lista de etapas notificáveis?
//   - o cliente aceita notificações (opt-out respeitado)?
// Se tudo ok, monta o texto (template da etapa com variáveis substituídas),
// localiza/abre a conversa do cliente e ENFILEIRA em MensagemAgendada para
// disparo imediato — reaproveitando o despachador da Fase 1.
//
// Função interna: chamada via base44.functions.invoke('notificarEtapaOs', ...).
// Usa service role (roda a partir de uma ação de consultor, mas mexe em
// conversa/config globalmente).
// ---------------------------------------------------------------------------

// Texto padrão por etapa quando a config não tem um template próprio.
const TEXTO_PADRAO = {
  recepcao: 'Olá {cliente}! Recebemos seu veículo {veiculo} ({placa}) na {oficina}. Já vamos cuidar de tudo. 🚗',
  diagnostico: 'Olá {cliente}! Iniciamos o diagnóstico do seu {veiculo} ({placa}). Em breve traremos novidades.',
  orcamento: 'Olá {cliente}! O orçamento do seu {veiculo} ({placa}) está pronto. Qualquer dúvida, é só chamar!',
  aprovacao: 'Olá {cliente}! Aguardamos a sua aprovação para dar sequência no serviço do {veiculo} ({placa}).',
  compra: 'Olá {cliente}! Estamos providenciando as peças necessárias para o seu {veiculo} ({placa}).',
  execucao: 'Olá {cliente}! O serviço no seu {veiculo} ({placa}) já está em execução. 🔧',
  qualidade: 'Olá {cliente}! Seu {veiculo} ({placa}) está passando pelo nosso controle de qualidade.',
  aguardando_faturamento: 'Olá {cliente}! O serviço no seu {veiculo} ({placa}) foi concluído e está em faturamento.',
  nota_emitida: 'Olá {cliente}! A nota fiscal do serviço do seu {veiculo} ({placa}) foi emitida.',
  pagamento: 'Olá {cliente}! Consta um valor de {valor} referente ao serviço do seu {veiculo} ({placa}).',
  entrega: 'Olá {cliente}! Seu {veiculo} ({placa}) está pronto para retirada. Esperamos por você! ✅',
  pos_venda: 'Olá {cliente}! Tudo certo com o seu {veiculo} ({placa}) após o serviço? Sua opinião é muito importante.',
};

function renderTexto(texto, ctx) {
  return String(texto || '')
    .replaceAll('{cliente}', ctx.cliente || 'cliente')
    .replaceAll('{os_numero}', ctx.os_numero || '')
    .replaceAll('{veiculo}', ctx.veiculo || 'veículo')
    .replaceAll('{placa}', ctx.placa || '')
    .replaceAll('{valor}', ctx.valor || '')
    .replaceAll('{consultor}', ctx.consultor || '')
    .replaceAll('{oficina}', ctx.oficina || 'oficina');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { ordem_servico_id, etapa } = await req.json();
    if (!ordem_servico_id || !etapa) {
      return Response.json({ error: 'ordem_servico_id e etapa são obrigatórios.' }, { status: 400 });
    }

    const os = await base44.asServiceRole.entities.OrdemServico.get(ordem_servico_id).catch(() => null);
    if (!os) return Response.json({ error: 'OS não encontrada.' }, { status: 404 });

    // 1) Config de notificações (global ou da filial da OS)
    const configs = await base44.asServiceRole.entities.ConfigNotificacao.list('-updated_date', 50);
    const config =
      configs.find((c) => os.filial_id && c.filial_id === os.filial_id) ||
      configs.find((c) => !c.filial_id) ||
      null;

    if (!config || !config.notificacoes_ativas) {
      return Response.json({ status: 'ignorado', motivo: 'notificacoes_desligadas' });
    }
    const etapasNotificaveis = config.etapas_notificaveis || [];
    if (!etapasNotificaveis.includes(etapa)) {
      return Response.json({ status: 'ignorado', motivo: 'etapa_nao_notificavel' });
    }

    // 2) Cliente + opt-out
    const cliente = os.cliente_id
      ? await base44.asServiceRole.entities.Cliente.get(os.cliente_id).catch(() => null)
      : null;
    if (!cliente) {
      return Response.json({ status: 'ignorado', motivo: 'sem_cliente' });
    }
    if (cliente.aceita_notificacoes === false) {
      return Response.json({ status: 'ignorado', motivo: 'cliente_optout' });
    }

    const veiculo = os.veiculo_id
      ? await base44.asServiceRole.entities.Veiculo.get(os.veiculo_id).catch(() => null)
      : null;

    // 3) Texto da mensagem (template da etapa na config, senão padrão)
    const templateEtapa = (config.templates_etapa || []).find((t) => t.etapa === etapa);
    const modelo = templateEtapa?.mensagem || TEXTO_PADRAO[etapa] || 'Atualização sobre o seu serviço.';

    const empresa = (await base44.asServiceRole.entities.Empresa.list('-created_date', 1))[0] || null;
    const texto = renderTexto(modelo, {
      cliente: cliente.nome,
      os_numero: os.numero || '',
      veiculo: veiculo ? `${veiculo.marca || ''} ${veiculo.modelo || ''}`.trim() : '',
      placa: veiculo?.placa || '',
      valor: os.valor_total ? `R$ ${Number(os.valor_total).toFixed(2)}` : '',
      consultor: os.consultor || '',
      oficina: empresa?.nome_fantasia || 'nossa oficina',
    });

    const canal = config.canal_padrao || 'whatsapp';
    const telefone = cliente.celular || cliente.telefone || '';

    // 4) Localizar/abrir a conversa do cliente no canal configurado
    let conversa = null;
    const doCliente = await base44.asServiceRole.entities.Conversa.filter(
      { cliente_id: cliente.id }, '-ultima_mensagem_em', 20,
    );
    conversa = doCliente.find((c) => c.canal === canal) || doCliente[0] || null;

    if (!conversa) {
      conversa = await base44.asServiceRole.entities.Conversa.create({
        canal,
        canal_externo_id: telefone,
        contato_nome: cliente.nome,
        contato_telefone: telefone,
        contato_email: cliente.email || '',
        cliente_id: cliente.id,
        veiculo_id: veiculo?.id || '',
        ordem_servico_id: os.id,
        identificacao_status: 'identificado',
        status: 'aberta',
        nao_lidas: 0,
      });
    }

    // 5) Enfileira para disparo imediato (dedupe por etapa+OS)
    const chaveDedupe = `os_etapa:${os.id}:${etapa}`;
    const jaEnfileirado = await base44.asServiceRole.entities.MensagemAgendada.filter({ chave_dedupe: chaveDedupe });
    if (jaEnfileirado.length > 0) {
      return Response.json({ status: 'ignorado', motivo: 'ja_enfileirado' });
    }

    const agendamento = await base44.asServiceRole.entities.MensagemAgendada.create({
      conversa_id: conversa.id,
      cliente_id: cliente.id,
      ordem_servico_id: os.id,
      evento: 'os_etapa',
      canal,
      texto,
      agendado_para: new Date().toISOString(),
      status: 'pendente',
      chave_dedupe: chaveDedupe,
      empresa_id: os.empresa_id || '',
      filial_id: os.filial_id || '',
    });

    // Dispara já (não espera o ciclo do workflow) — melhor experiência.
    await base44.functions.invoke('processarAgendamentos', {}).catch(() => {});

    return Response.json({ status: 'ok', agendamento_id: agendamento.id, canal });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});