import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// =====================================================================
// FASE 6 — AUDITORIAS
// Controle de materiais utilizados. Ações:
//  - criar: cria auditoria manual OU a partir de um atendimento externo
//  - aprovar: aprova a conferência → atualiza estoque + patrimônio,
//             notifica o responsável e dispara o Motor Operacional
//  - reprovar: registra motivo e mantém pendências abertas
// =====================================================================

const TIPO_LABEL = {
  ferramentas: 'Ferramentas',
  pecas: 'Peças',
  patrimonio: 'Patrimônio',
  epis: 'EPIs',
  equipamentos: 'Equipamentos',
};

async function gerarNumero(base44) {
  const registros = await base44.entities.Auditoria.list('-created_date', 500).catch(() => []);
  let maior = 0;
  for (const r of registros) {
    const m = String(r.numero || '').match(/(\d+)\s*$/);
    if (m) maior = Math.max(maior, parseInt(m[1], 10));
  }
  return `AUD-${String(maior + 1).padStart(6, '0')}`;
}

// Baixa no estoque das peças conferidas (uma auditoria de peças confirma o consumo).
async function atualizarEstoque(base44, auditoria, usuario, erros) {
  for (const item of auditoria.itens || []) {
    if (!item.referencia_id) continue;
    const qtd = Number(item.quantidade_conferida) || 0;
    if (qtd <= 0) continue;
    try {
      const saldos = await base44.entities.EstoqueSaldo.filter({ peca_id: item.referencia_id });
      const saldo = saldos.sort((a, b) => (Number(b.quantidade) || 0) - (Number(a.quantidade) || 0))[0];
      if (!saldo) continue;
      const anterior = Number(saldo.quantidade) || 0;
      const novo = Math.max(0, anterior - qtd);
      await base44.entities.EstoqueSaldo.update(saldo.id, { quantidade: novo });
      await base44.entities.MovimentoEstoque.create({
        peca_id: item.referencia_id,
        peca_codigo: item.codigo || '',
        peca_descricao: item.descricao || '',
        tipo: 'saida',
        quantidade: qtd,
        deposito_origem_id: saldo.deposito_id,
        motivo: `Auditoria ${auditoria.numero || ''} aprovada`,
        documento: auditoria.numero || '',
        usuario,
        saldo_anterior: anterior,
        saldo_novo: novo,
        data: new Date().toISOString(),
      });
    } catch (e) {
      erros.push(`estoque(${item.descricao}): ${e.message}`);
    }
  }
}

// Atualiza o status/histórico dos patrimônios conferidos conforme a situação.
async function atualizarPatrimonio(base44, auditoria, usuario, erros) {
  for (const item of auditoria.itens || []) {
    if (!item.referencia_id) continue;
    try {
      const pat = await base44.entities.Patrimonio.get(item.referencia_id).catch(() => null);
      if (!pat) continue;
      let novoStatus = pat.status;
      if (item.situacao === 'danificado') novoStatus = 'em_manutencao';
      else if (item.situacao === 'faltante') novoStatus = 'extraviado';
      else if (item.situacao === 'ok') novoStatus = 'ativo';
      const historico = [...(pat.historico || []), {
        tipo: 'auditoria',
        descricao: `Auditoria ${auditoria.numero || ''}: ${item.situacao}${item.observacao ? ' — ' + item.observacao : ''}`,
        usuario,
        data: new Date().toISOString(),
      }];
      await base44.entities.Patrimonio.update(pat.id, { status: novoStatus, historico });
    } catch (e) {
      erros.push(`patrimonio(${item.descricao}): ${e.message}`);
    }
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ---- Criar auditoria (manual ou a partir de atendimento externo) ----
    if (action === 'criar') {
      const { tipo, missao_operacional_id, origem } = body;
      if (!tipo) return Response.json({ error: 'tipo é obrigatório' }, { status: 400 });

      // Idempotente: uma missão gera no máximo uma auditoria por tipo.
      if (missao_operacional_id) {
        const existentes = await base44.entities.Auditoria.filter({ missao_operacional_id, tipo }).catch(() => []);
        if (existentes.length > 0) {
          return Response.json({ status: 'sucesso', auditoria: existentes[0], reutilizada: true });
        }
      }

      const numero = await gerarNumero(base44);
      const agora = new Date().toISOString();

      let dados = {
        numero,
        tipo,
        titulo: body.titulo || `Auditoria de ${TIPO_LABEL[tipo] || tipo}`,
        origem: origem || (missao_operacional_id ? 'atendimento_externo' : 'manual'),
        itens: Array.isArray(body.itens) ? body.itens : [],
        responsavel_id: body.responsavel_id || '',
        responsavel_nome: body.responsavel_nome || '',
        responsavel_email: body.responsavel_email || '',
        status: 'aberta',
        empresa_id: body.empresa_id || '',
        filial_id: body.filial_id || '',
        historico: [{ tipo: 'criacao', descricao: 'Auditoria criada', usuario: user.full_name || user.email, data: agora }],
      };

      // Enriquecimento automático a partir do atendimento externo
      if (missao_operacional_id) {
        const missao = await base44.entities.MissaoOperacional.get(missao_operacional_id).catch(() => null);
        if (missao) {
          dados.missao_operacional_id = missao_operacional_id;
          dados.ordem_servico_id = missao.ordem_servico_id || '';
          dados.referencia_numero = missao.numero || '';
          dados.empresa_id = dados.empresa_id || missao.empresa_id || '';
          dados.filial_id = dados.filial_id || missao.filial_id || '';
          // Responsável = responsável da equipe da missão
          const resp = (missao.equipe || []).find((m) => m.papel === 'responsavel') || (missao.equipe || [])[0];
          if (resp && !dados.responsavel_id) {
            dados.responsavel_id = resp.colaborador_id || '';
            dados.responsavel_nome = resp.colaborador_nome || '';
            const colab = resp.colaborador_id ? await base44.entities.Colaborador.get(resp.colaborador_id).catch(() => null) : null;
            dados.responsavel_email = colab?.email || '';
          }
          // Itens a conferir conforme o tipo
          if (tipo === 'ferramentas' || tipo === 'patrimonio' || tipo === 'equipamentos' || tipo === 'epis') {
            dados.itens = (missao.ferramentas || []).map((f) => ({
              referencia_id: f.patrimonio_id || '',
              descricao: f.nome || '',
              codigo: f.codigo_patrimonial || '',
              quantidade_esperada: 1,
              quantidade_conferida: 0,
              situacao: 'pendente',
              observacao: '',
            }));
          } else if (tipo === 'pecas') {
            dados.itens = (missao.pecas || []).map((p) => ({
              referencia_id: p.peca_id || '',
              descricao: p.descricao || '',
              codigo: '',
              quantidade_esperada: Number(p.quantidade) || 0,
              quantidade_conferida: 0,
              situacao: 'pendente',
              observacao: '',
            }));
          }
        }
      }

      const auditoria = await base44.entities.Auditoria.create(dados);

      // Notifica o responsável (Fase 6 — automação)
      if (auditoria.responsavel_email) {
        await base44.integrations.Core.SendEmail({
          to: auditoria.responsavel_email,
          subject: `Nova auditoria ${auditoria.numero} — ${TIPO_LABEL[tipo] || tipo}`,
          body: `Olá ${auditoria.responsavel_nome || ''},\n\nUma auditoria de ${TIPO_LABEL[tipo] || tipo} foi criada e aguarda sua conferência.\n\nAuditoria: ${auditoria.numero}\n${auditoria.referencia_numero ? 'Origem: ' + auditoria.referencia_numero + '\n' : ''}Itens a conferir: ${(auditoria.itens || []).length}\n\nAcesse o sistema para realizar a conferência.`,
        }).catch(() => null);
      }

      // Motor Operacional
      await base44.functions.invoke('motorOperacional', {
        evento: 'auditoria_criada',
        ordem_servico_id: auditoria.ordem_servico_id || '',
        referencia_id: auditoria.id,
        payload: { origem: 'auditoria', tipo, missao_operacional_id: missao_operacional_id || '', empresa_id: auditoria.empresa_id || '', filial_id: auditoria.filial_id || '' },
      }).catch(() => {});

      return Response.json({ status: 'sucesso', auditoria });
    }

    // ---- Aprovar auditoria → atualiza estoque + patrimônio ----
    if (action === 'aprovar') {
      const { auditoria_id } = body;
      const auditoria = await base44.entities.Auditoria.get(auditoria_id).catch(() => null);
      if (!auditoria) return Response.json({ error: 'Auditoria não encontrada' }, { status: 404 });
      if (auditoria.status === 'aprovada') return Response.json({ error: 'Auditoria já aprovada' }, { status: 400 });

      const usuario = user.full_name || user.email;
      const agora = new Date().toISOString();
      const erros = [];

      // Atualiza estoque (peças) e patrimônio conforme o tipo
      if (auditoria.tipo === 'pecas' && !auditoria.estoque_atualizado) {
        await atualizarEstoque(base44, auditoria, usuario, erros);
      } else if (!auditoria.patrimonio_atualizado) {
        await atualizarPatrimonio(base44, auditoria, usuario, erros);
      }

      const updated = await base44.entities.Auditoria.update(auditoria_id, {
        status: 'aprovada',
        aprovada_por_id: user.id,
        aprovada_por_nome: usuario,
        aprovada_em: agora,
        estoque_atualizado: auditoria.tipo === 'pecas' ? true : auditoria.estoque_atualizado,
        patrimonio_atualizado: auditoria.tipo !== 'pecas' ? true : auditoria.patrimonio_atualizado,
        historico: [...(auditoria.historico || []), { tipo: 'aprovacao', descricao: `Auditoria aprovada${erros.length ? ' (com avisos)' : ''}`, usuario, data: agora }],
      });

      // Notifica o responsável da aprovação
      if (auditoria.responsavel_email) {
        await base44.integrations.Core.SendEmail({
          to: auditoria.responsavel_email,
          subject: `Auditoria ${auditoria.numero} aprovada`,
          body: `A auditoria ${auditoria.numero} (${TIPO_LABEL[auditoria.tipo] || auditoria.tipo}) foi aprovada por ${usuario}.`,
        }).catch(() => null);
      }

      // Motor Operacional
      await base44.functions.invoke('motorOperacional', {
        evento: 'auditoria_finalizada',
        ordem_servico_id: auditoria.ordem_servico_id || '',
        referencia_id: auditoria.id,
        payload: { origem: 'auditoria', tipo: auditoria.tipo, empresa_id: auditoria.empresa_id || '', filial_id: auditoria.filial_id || '' },
      }).catch(() => {});

      return Response.json({ status: 'sucesso', auditoria: updated, erros });
    }

    // ---- Reprovar auditoria ----
    if (action === 'reprovar') {
      const { auditoria_id, motivo } = body;
      const auditoria = await base44.entities.Auditoria.get(auditoria_id).catch(() => null);
      if (!auditoria) return Response.json({ error: 'Auditoria não encontrada' }, { status: 404 });
      const usuario = user.full_name || user.email;
      const agora = new Date().toISOString();

      const updated = await base44.entities.Auditoria.update(auditoria_id, {
        status: 'reprovada',
        motivo_reprovacao: motivo || '',
        historico: [...(auditoria.historico || []), { tipo: 'reprovacao', descricao: `Auditoria reprovada${motivo ? ' — ' + motivo : ''}`, usuario, data: agora }],
      });

      if (auditoria.responsavel_email) {
        await base44.integrations.Core.SendEmail({
          to: auditoria.responsavel_email,
          subject: `Auditoria ${auditoria.numero} reprovada`,
          body: `A auditoria ${auditoria.numero} foi reprovada por ${usuario}.${motivo ? '\n\nMotivo: ' + motivo : ''}\n\nRevise as pendências e reenvie para aprovação.`,
        }).catch(() => null);
      }

      return Response.json({ status: 'sucesso', auditoria: updated });
    }

    return Response.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});