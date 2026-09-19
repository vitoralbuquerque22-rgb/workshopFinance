import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Transferência formal de atendimento entre consultores.
// Registra em conversa.atendimentos, atualiza o responsável e grava auditoria.
// Também suporta "assumir" (o próprio usuário se torna o responsável).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { conversa_id, acao, para_consultor_id, motivo } = body;
    if (!conversa_id) return Response.json({ error: 'conversa_id é obrigatório' }, { status: 400 });

    const conversa = await base44.entities.Conversa.get(conversa_id).catch(() => null);
    if (!conversa) return Response.json({ error: 'Conversa não encontrada' }, { status: 404 });

    const agora = new Date().toISOString();
    const atorNome = user.full_name || user.email;

    // "assumir": o usuário atual passa a ser o responsável.
    if (acao === 'assumir') {
      const colab = (await base44.entities.Colaborador.filter({ user_id: user.id }))[0];
      const consultorId = colab?.id || user.id;
      const consultorNome = colab?.nome || atorNome;

      const atualizada = await base44.entities.Conversa.update(conversa_id, {
        consultor_id: consultorId,
        consultor_nome: consultorNome,
        atendimentos: [...(conversa.atendimentos || []), { consultor_id: consultorId, consultor_nome: consultorNome, acao: 'assumiu', data: agora }],
      });

      await base44.asServiceRole.entities.AuditoriaConversa.create({
        conversa_id,
        evento: 'assumiu',
        descricao: `${consultorNome} assumiu o atendimento`,
        ator_id: user.id,
        ator_nome: atorNome,
        ator_tipo: 'consultor',
        para_consultor_id: consultorId,
        para_consultor_nome: consultorNome,
        data_evento: agora,
      });

      return Response.json({ status: 'sucesso', conversa: atualizada });
    }

    // "transferir": passa para outro consultor, com motivo obrigatório.
    if (acao === 'transferir') {
      if (!para_consultor_id) return Response.json({ error: 'Selecione o consultor de destino' }, { status: 400 });
      if (!motivo || String(motivo).trim().length < 3) {
        return Response.json({ error: 'Informe o motivo da transferência' }, { status: 400 });
      }

      const destino = await base44.entities.Colaborador.get(para_consultor_id).catch(() => null);
      if (!destino) return Response.json({ error: 'Consultor de destino não encontrado' }, { status: 404 });

      const deId = conversa.consultor_id || '';
      const deNome = conversa.consultor_nome || '';

      const atualizada = await base44.entities.Conversa.update(conversa_id, {
        consultor_id: destino.id,
        consultor_nome: destino.nome,
        status: 'aguardando_consultor',
        atendimentos: [...(conversa.atendimentos || []), { consultor_id: destino.id, consultor_nome: destino.nome, acao: 'transferido', data: agora }],
      });

      // Mensagem interna de sistema documentando a transferência na timeline do chat.
      await base44.entities.Mensagem.create({
        conversa_id,
        canal: conversa.canal,
        direcao: 'saida',
        tipo: 'sistema',
        texto: `🔀 Atendimento transferido${deNome ? ` de ${deNome}` : ''} para ${destino.nome} por ${atorNome}. Motivo: ${String(motivo).trim()}`,
        autor_tipo: 'sistema',
        autor_id: user.id,
        autor_nome: atorNome,
        enviada_em: agora,
      });

      await base44.asServiceRole.entities.AuditoriaConversa.create({
        conversa_id,
        evento: 'transferencia',
        descricao: `Atendimento transferido${deNome ? ` de ${deNome}` : ''} para ${destino.nome}: ${String(motivo).trim()}`,
        ator_id: user.id,
        ator_nome: atorNome,
        ator_tipo: 'consultor',
        de_consultor_id: deId,
        de_consultor_nome: deNome,
        para_consultor_id: destino.id,
        para_consultor_nome: destino.nome,
        metadados: { motivo: String(motivo).trim() },
        data_evento: agora,
      });

      return Response.json({ status: 'sucesso', conversa: atualizada });
    }

    return Response.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});