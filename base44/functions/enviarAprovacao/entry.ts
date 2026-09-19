import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Envia um pedido de aprovação/assinatura de orçamento ao cliente pelo canal da conversa.
// Cria um registro AprovacaoOrcamento com token, posta uma mensagem com o link público
// e grava a auditoria.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { conversa_id, ordem_servico_id, origin: originBody } = body;
    if (!conversa_id || !ordem_servico_id) {
      return Response.json({ error: 'conversa_id e ordem_servico_id são obrigatórios' }, { status: 400 });
    }

    const conversa = await base44.entities.Conversa.get(conversa_id).catch(() => null);
    if (!conversa) return Response.json({ error: 'Conversa não encontrada' }, { status: 404 });

    const os = await base44.entities.OrdemServico.get(ordem_servico_id).catch(() => null);
    if (!os) return Response.json({ error: 'OS não encontrada' }, { status: 404 });
    if (os.status !== 'orcamento') {
      return Response.json({ error: 'A OS precisa estar em orçamento para solicitar aprovação' }, { status: 400 });
    }

    const cliente = os.cliente_id ? await base44.entities.Cliente.get(os.cliente_id).catch(() => null) : null;
    const veiculo = os.veiculo_id ? await base44.entities.Veiculo.get(os.veiculo_id).catch(() => null) : null;

    const token = crypto.randomUUID().replace(/-/g, '');
    const agora = new Date().toISOString();

    // Invalida aprovações pendentes anteriores da mesma OS (evita links antigos aprovando versão desatualizada).
    const pendentesAntigas = await base44.asServiceRole.entities.AprovacaoOrcamento.filter({ ordem_servico_id, status: 'pendente' });
    for (const p of pendentesAntigas) {
      await base44.asServiceRole.entities.AprovacaoOrcamento.update(p.id, { status: 'expirado' });
    }

    const aprovacao = await base44.asServiceRole.entities.AprovacaoOrcamento.create({
      ordem_servico_id,
      os_numero: os.numero || '',
      conversa_id,
      cliente_id: os.cliente_id || '',
      cliente_nome: cliente?.nome || conversa.contato_nome || '',
      veiculo_placa: veiculo?.placa || '',
      valor_total: os.valor_total || 0,
      token,
      canal: conversa.canal,
      status: 'pendente',
      enviado_por_id: user.id,
      enviado_por_nome: user.full_name || user.email,
      enviado_em: agora,
      snapshot_itens: os.itens || [],
    });

    const origin = originBody || req.headers.get('origin') || `https://${Deno.env.get('BASE44_APP_ID')}.base44.app`;
    const link = `${origin}/aprovar-orcamento?token=${token}`;
    const valorFmt = (os.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const texto = `📋 *Aprovação de Orçamento*\n${os.numero ? `OS ${os.numero}\n` : ''}${veiculo?.placa ? `Veículo: ${veiculo.placa}\n` : ''}Valor: ${valorFmt}\n\nRevise e aprove/assine seu orçamento pelo link seguro:\n${link}`;

    await base44.entities.Mensagem.create({
      conversa_id,
      canal: conversa.canal,
      direcao: 'saida',
      tipo: 'template',
      texto,
      autor_tipo: 'consultor',
      autor_id: user.id,
      autor_nome: user.full_name || user.email,
      enviada_em: agora,
      referencia: { tipo: 'orcamento', ordem_servico_id },
    });

    await base44.entities.Conversa.update(conversa_id, {
      ultima_mensagem_texto: `📋 Aprovação de orçamento enviada`,
      ultima_mensagem_em: agora,
      ultima_mensagem_direcao: 'saida',
    });

    await base44.asServiceRole.entities.AuditoriaConversa.create({
      conversa_id,
      evento: 'aprovacao_enviada',
      descricao: `Pedido de aprovação do orçamento ${os.numero || ''} enviado (${valorFmt})`,
      ordem_servico_id,
      ator_id: user.id,
      ator_nome: user.full_name || user.email,
      ator_tipo: 'consultor',
      metadados: { token, valor_total: os.valor_total || 0 },
      data_evento: agora,
    });

    // Fase 4 — dispara a régua "pediu orçamento" (follow-ups agendados).
    await base44.functions.invoke('dispararReguas', { acao: 'evento', evento: 'orcamento_enviado', ordem_servico_id }).catch(() => {});

    return Response.json({ status: 'sucesso', aprovacao, link });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});