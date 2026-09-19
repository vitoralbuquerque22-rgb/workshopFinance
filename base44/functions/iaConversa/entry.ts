import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Assistente de IA para a Central de Conversas.
// acao: 'sugerir' | 'resumir' | 'gerar_os'
// Usa o histórico de mensagens da conversa como contexto.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversa_id, acao } = await req.json();
    if (!conversa_id || !acao) {
      return Response.json({ error: 'conversa_id e acao são obrigatórios.' }, { status: 400 });
    }

    const conversa = await base44.entities.Conversa.get(conversa_id);
    if (!conversa) {
      return Response.json({ error: 'Conversa não encontrada.' }, { status: 404 });
    }

    const mensagens = await base44.entities.Mensagem.filter({ conversa_id }, 'created_date', 100);
    const historico = mensagens
      .filter((m) => m.tipo !== 'sistema' && m.texto)
      .map((m) => `${m.direcao === 'entrada' ? 'Cliente' : 'Oficina'}: ${m.texto}`)
      .join('\n');

    if (!historico) {
      return Response.json({ error: 'Não há mensagens para analisar.' }, { status: 400 });
    }

    // contexto do cliente/veículo, se houver
    let contexto = '';
    if (conversa.cliente_id) {
      const cliente = await base44.entities.Cliente.get(conversa.cliente_id).catch(() => null);
      if (cliente) contexto += `\nCliente: ${cliente.nome}`;
    }
    if (conversa.veiculo_id) {
      const veiculo = await base44.entities.Veiculo.get(conversa.veiculo_id).catch(() => null);
      if (veiculo) contexto += `\nVeículo: ${veiculo.marca || ''} ${veiculo.modelo || ''} ${veiculo.placa || ''}`.trimEnd();
    }

    let prompt = '';
    let response_json_schema = null;

    if (acao === 'sugerir') {
      prompt = `Você é um consultor de uma oficina mecânica no Brasil, atendendo um cliente por mensagem. Com base no histórico abaixo, escreva UMA sugestão de resposta profissional, cordial e objetiva em português brasileiro, pronta para enviar ao cliente. Retorne apenas o texto da mensagem, sem aspas.${contexto}\n\nHistórico:\n${historico}`;
    } else if (acao === 'resumir') {
      prompt = `Resuma em português brasileiro, em até 4 linhas, o essencial desta conversa entre uma oficina mecânica e um cliente: assunto, pedido do cliente e próximo passo pendente.${contexto}\n\nHistórico:\n${historico}`;
    } else if (acao === 'gerar_os') {
      prompt = `Com base na conversa entre a oficina e o cliente, extraia os dados para abrir uma ordem de serviço. Identifique o problema relatado e liste os serviços/peças mencionados.${contexto}\n\nHistórico:\n${historico}`;
      response_json_schema = {
        type: 'object',
        properties: {
          descricao_problema: { type: 'string', description: 'Resumo do problema relatado pelo cliente' },
          itens_sugeridos: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                descricao: { type: 'string' },
                tipo: { type: 'string', enum: ['servico', 'peca', 'mao_obra'] },
              },
            },
          },
        },
      };
    } else {
      return Response.json({ error: 'Ação inválida.' }, { status: 400 });
    }

    const resultado = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema,
    });

    return Response.json({ status: 'ok', acao, resultado });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});