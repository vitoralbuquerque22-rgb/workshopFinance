import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const MOTIVO_LABEL = {
  preco: 'Preço',
  prazo: 'Prazo',
  concorrencia: 'Concorrência',
  desistiu: 'Desistiu',
  sem_retorno: 'Sem retorno',
  outro: 'Outro',
};

const num = (v) => Number(v) || 0;
const brl = (v) => num(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Recalcula os totais da OS considerando apenas os itens aprovados.
function recalcularTotais(itens, valorDesconto) {
  let pecas = 0, servicos = 0, custo = 0;
  for (const it of itens) {
    if (it.aprovado === false) continue;
    if (it.tipo === 'peca') pecas += num(it.valor_total);
    else servicos += num(it.valor_total);
    custo += num(it.custo_unitario) * num(it.quantidade);
  }
  const bruto = pecas + servicos;
  const total = Math.max(0, bruto - num(valorDesconto));
  return { pecas, servicos, custo, total };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    // decisoes: { [index]: { aprovado, motivo_recusa, motivo_recusa_detalhe, data_contato_crm } }
    const { ordem_servico_id, decisoes } = body;
    if (!ordem_servico_id || !decisoes) {
      return Response.json({ error: 'ordem_servico_id e decisoes são obrigatórios.' }, { status: 400 });
    }

    const os = await base44.entities.OrdemServico.get(ordem_servico_id);
    if (!os) return Response.json({ error: 'OS não encontrada.' }, { status: 404 });

    const agora = new Date().toISOString();

    // Aplica as decisões item a item.
    const itens = (os.itens || []).map((it, idx) => {
      const d = decisoes[idx] || decisoes[String(idx)];
      if (!d) return { ...it, aprovado: it.aprovado !== false };
      if (d.aprovado === false) {
        return {
          ...it,
          aprovado: false,
          motivo_recusa: d.motivo_recusa || 'outro',
          motivo_recusa_detalhe: d.motivo_recusa_detalhe || '',
          data_contato_crm: d.data_contato_crm || '',
        };
      }
      return { ...it, aprovado: true, motivo_recusa: undefined, motivo_recusa_detalhe: '', data_contato_crm: '' };
    });

    const recusados = itens.filter((it) => it.aprovado === false);
    const totais = recalcularTotais(itens, os.valor_desconto);
    const valorRecusado = recusados.reduce((s, it) => s + num(it.valor_total), 0);

    // Cria a oportunidade no CRM apenas quando há itens recusados.
    let leadId = os.aprovacao_parcial?.lead_id || '';
    if (recusados.length > 0) {
      const cliente = os.cliente_id ? await base44.entities.Cliente.get(os.cliente_id).catch(() => null) : null;
      const veiculo = os.veiculo_id ? await base44.entities.Veiculo.get(os.veiculo_id).catch(() => null) : null;

      const listaItens = recusados
        .map((it) => `• ${it.descricao || 'Item'} (${brl(it.valor_total)}) — ${MOTIVO_LABEL[it.motivo_recusa] || 'Outro'}${it.motivo_recusa_detalhe ? `: ${it.motivo_recusa_detalhe}` : ''}`)
        .join('\n');
      const proximoContato = recusados.map((it) => it.data_contato_crm).filter(Boolean).sort()[0] || '';
      const motivoPrincipal = recusados[0]?.motivo_recusa || 'outro';

      const leadData = {
        cliente_id: os.cliente_id || undefined,
        cliente_nome: cliente?.nome || '',
        veiculo_id: os.veiculo_id || undefined,
        placa: veiculo?.placa || '',
        nome: cliente?.nome || '',
        telefone: cliente?.telefone || '',
        email: cliente?.email || '',
        consultor: os.consultor || '',
        origem: 'manual',
        etapa: 'novo',
        status: 'novo',
        qualificado: true,
        valor_estimado: valorRecusado,
        servico_interesse: recusados.map((it) => it.descricao).filter(Boolean).join(', ').slice(0, 500),
        motivo_perda: motivoPrincipal,
        proximo_followup: proximoContato || undefined,
        data_contato: proximoContato || undefined,
        data_captura: agora,
        observacoes: `Itens NÃO aprovados na OS ${os.numero || ordem_servico_id}:\n${listaItens}`,
        empresa_id: os.empresa_id || undefined,
      };

      if (leadId) {
        await base44.asServiceRole.entities.Lead.update(leadId, leadData).catch(async () => {
          const novo = await base44.asServiceRole.entities.Lead.create(leadData);
          leadId = novo.id;
        });
      } else {
        const novo = await base44.asServiceRole.entities.Lead.create(leadData);
        leadId = novo.id;
      }
    }

    // Persiste a OS com itens marcados e totais recalculados.
    const timeline = [...(os.timeline || []), {
      etapa: os.etapa_fluxo || 'aprovacao',
      descricao: recusados.length > 0
        ? `Aprovação parcial registrada — ${recusados.length} item(ns) recusado(s) (${brl(valorRecusado)}) enviado(s) ao CRM`
        : 'Orçamento aprovado integralmente',
      usuario: user.full_name || user.email || '',
      data: agora,
    }];

    await base44.entities.OrdemServico.update(ordem_servico_id, {
      itens,
      valor_pecas: totais.pecas,
      valor_servicos: totais.servicos,
      valor_total: totais.total,
      custo_total: totais.custo,
      timeline,
      aprovacao_parcial: {
        registrada: true,
        registrada_em: agora,
        registrada_por_nome: user.full_name || user.email || '',
        lead_id: leadId || undefined,
        valor_recusado: valorRecusado,
      },
    });

    // Agenda o follow-up ao cliente na data de contato do CRM. Usa MensagemAgendada
    // (mecanismo próprio do app) em vez de envio imediato — respeita a janela de 24h
    // e o despachador oficial. Dedupe evita agendar 2x o mesmo follow-up.
    let mensagemAgendada = false;
    if (recusados.length > 0 && os.cliente_id) {
      const proximoContato = recusados.map((it) => it.data_contato_crm).filter(Boolean).sort()[0] || '';
      const agendadoPara = proximoContato ? `${proximoContato}T12:00:00.000Z` : agora;
      const chaveDedupe = `aprovacao_parcial:${ordem_servico_id}`;

      const existentes = await base44.asServiceRole.entities.MensagemAgendada
        .filter({ chave_dedupe: chaveDedupe }, '-created_date', 1).catch(() => []);

      const texto = `Olá! Registramos os itens do seu orçamento (OS ${os.numero || ''}) que ficaram para um próximo momento. Quando quiser retomar, é só nos avisar que preparamos tudo pra você. 🙂`;
      const dados = {
        cliente_id: os.cliente_id,
        lead_id: leadId || undefined,
        ordem_servico_id,
        evento: 'aprovacao_parcial',
        canal: 'auto',
        texto,
        agendado_para: agendadoPara,
        status: 'pendente',
        chave_dedupe: chaveDedupe,
        criado_por_id: user.id,
        criado_por_nome: user.full_name || user.email || '',
        empresa_id: os.empresa_id || undefined,
      };

      if (existentes?.[0]) {
        await base44.asServiceRole.entities.MensagemAgendada.update(existentes[0].id, dados).catch(() => {});
      } else {
        await base44.asServiceRole.entities.MensagemAgendada.create(dados).catch(() => {});
      }
      mensagemAgendada = true;
    }

    return Response.json({
      ok: true,
      recusados: recusados.length,
      valor_recusado: valorRecusado,
      valor_total: totais.total,
      lead_id: leadId || null,
      mensagem_agendada: mensagemAgendada,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});