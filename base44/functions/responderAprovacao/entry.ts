import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Endpoint público (sem login): o cliente consulta e responde a aprovação pelo token.
// GET-like: { token } → retorna dados do orçamento para exibição.
// Responder: { token, acao: 'aprovar'|'reprovar', assinatura_nome, motivo }.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { token, acao, assinatura_nome, motivo } = body;
    if (!token) return Response.json({ error: 'Token inválido' }, { status: 400 });

    const encontrados = await base44.asServiceRole.entities.AprovacaoOrcamento.filter({ token });
    const aprovacao = encontrados[0];
    if (!aprovacao) return Response.json({ error: 'Aprovação não encontrada' }, { status: 404 });

    // Apenas consulta (sem ação) → devolve o resumo para a página pública renderizar.
    if (!acao) {
      return Response.json({
        status: 'ok',
        aprovacao: {
          os_numero: aprovacao.os_numero,
          cliente_nome: aprovacao.cliente_nome,
          veiculo_placa: aprovacao.veiculo_placa,
          valor_total: aprovacao.valor_total,
          status: aprovacao.status,
          itens: aprovacao.snapshot_itens || [],
          respondido_em: aprovacao.respondido_em || null,
        },
      });
    }

    if (aprovacao.status !== 'pendente') {
      return Response.json({ error: 'Este orçamento já foi respondido.', ja_respondido: true, status_atual: aprovacao.status }, { status: 409 });
    }
    if (acao === 'aprovar' && !assinatura_nome) {
      return Response.json({ error: 'Informe seu nome para assinar a aprovação.' }, { status: 400 });
    }
    if (acao === 'reprovar' && !motivo) {
      return Response.json({ error: 'Informe o motivo da reprovação.' }, { status: 400 });
    }

    const agora = new Date().toISOString();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
    const ua = req.headers.get('user-agent') || '';
    const novoStatus = acao === 'aprovar' ? 'aprovado' : 'reprovado';

    await base44.asServiceRole.entities.AprovacaoOrcamento.update(aprovacao.id, {
      status: novoStatus,
      respondido_em: agora,
      assinatura_nome: acao === 'aprovar' ? assinatura_nome : '',
      assinatura_ip: ip,
      assinatura_user_agent: ua,
      motivo_reprovacao: acao === 'reprovar' ? motivo : '',
    });

    const os = await base44.asServiceRole.entities.OrdemServico.get(aprovacao.ordem_servico_id).catch(() => null);

    // Aprovado → move a OS para "aprovado" e registra a assinatura na timeline.
    if (acao === 'aprovar' && os && os.status === 'orcamento') {
      await base44.asServiceRole.entities.OrdemServico.update(os.id, {
        status: 'aprovado',
        timeline: [...(os.timeline || []), {
          etapa: 'aprovacao',
          descricao: `Orçamento aprovado e assinado pelo cliente (${assinatura_nome}) via ${aprovacao.canal}`,
          usuario: assinatura_nome,
          data: agora,
        }],
      });
    }
    // Reprovado → cancela a OS com o motivo informado pelo cliente.
    if (acao === 'reprovar' && os && os.status === 'orcamento') {
      await base44.asServiceRole.entities.OrdemServico.update(os.id, {
        status: 'cancelado',
        motivo_recusa: 'outro',
        motivo_recusa_detalhe: motivo,
        data_recusa: agora,
        timeline: [...(os.timeline || []), {
          etapa: 'orcamento',
          descricao: `Orçamento reprovado pelo cliente via ${aprovacao.canal}: ${motivo}`,
          usuario: aprovacao.cliente_nome || 'Cliente',
          data: agora,
        }],
      });
    }

    // Mensagem de entrada na conversa (registro do que o cliente fez).
    if (aprovacao.conversa_id) {
      const conversa = await base44.asServiceRole.entities.Conversa.get(aprovacao.conversa_id).catch(() => null);
      const texto = acao === 'aprovar'
        ? `✅ Orçamento ${aprovacao.os_numero || ''} APROVADO e assinado por ${assinatura_nome}.`
        : `❌ Orçamento ${aprovacao.os_numero || ''} reprovado. Motivo: ${motivo}`;
      await base44.asServiceRole.entities.Mensagem.create({
        conversa_id: aprovacao.conversa_id,
        canal: aprovacao.canal,
        direcao: 'entrada',
        tipo: 'sistema',
        texto,
        autor_tipo: 'cliente',
        autor_nome: aprovacao.cliente_nome || 'Cliente',
        enviada_em: agora,
        referencia: { tipo: 'orcamento', ordem_servico_id: aprovacao.ordem_servico_id },
      });
      if (conversa) {
        await base44.asServiceRole.entities.Conversa.update(aprovacao.conversa_id, {
          ultima_mensagem_texto: texto,
          ultima_mensagem_em: agora,
          ultima_mensagem_direcao: 'entrada',
          nao_lidas: (conversa.nao_lidas || 0) + 1,
        });
      }
    }

    await base44.asServiceRole.entities.AuditoriaConversa.create({
      conversa_id: aprovacao.conversa_id || '',
      evento: acao === 'aprovar' ? 'aprovacao_aprovada' : 'aprovacao_reprovada',
      descricao: acao === 'aprovar'
        ? `Cliente aprovou e assinou o orçamento ${aprovacao.os_numero || ''} (${assinatura_nome})`
        : `Cliente reprovou o orçamento ${aprovacao.os_numero || ''}: ${motivo}`,
      ordem_servico_id: aprovacao.ordem_servico_id,
      ator_nome: assinatura_nome || aprovacao.cliente_nome || 'Cliente',
      ator_tipo: 'cliente',
      metadados: { ip, user_agent: ua, motivo: motivo || '' },
      data_evento: agora,
    });

    return Response.json({ status: 'sucesso', resultado: novoStatus });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});