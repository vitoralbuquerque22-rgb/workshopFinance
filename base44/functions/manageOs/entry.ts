import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const MOTIVO_LABELS = {
  preco: 'Preço',
  prazo: 'Prazo',
  concorrencia: 'Concorrência',
  vai_esperar: 'Vai esperar',
  desistiu: 'Desistiu',
  outro: 'Outro',
};

// ===== FINANCEIRO: gera o(s) título(s) de Contas a Receber ao finalizar a OS =====
// Espelha a lógica do Módulo Fiscal (parcelamento, baixa imediata, cadência de cobrança),
// mas nasce já na finalização. A NF-e depois REUTILIZA estes títulos (não duplica).
async function gerarContasReceberDaOs(base44, os, cliente, hoje) {
  const cond = os.condicao_pagamento || {};
  const forma = cond.forma || 'pix';
  const numeroParcelas = Number(cond.numero_parcelas) || 1;
  const primeiroVenc = cond.data_primeiro_vencimento || '';
  const contaBancariaId = cond.conta_bancaria_id || '';
  const contaBrutos = (Number(os.valor_pecas) || 0) + (Number(os.valor_servicos) || 0);
  const valorTotal = Number(os.valor_total) || Math.max(0, contaBrutos - (Number(os.valor_desconto) || 0));
  const clienteNome = cliente?.nome || cliente?.razao_social || '';
  const numeroOs = os.numero || os.id.slice(-6);
  const descBase = `OS ${numeroOs} - ${clienteNome}`;
  const baseVenc = primeiroVenc || hoje;
  const formasCobranca = ['boleto', 'promissoria'];

  const contasReceberIds = [];
  const contasParaCobrar = [];

  if (forma === 'parcelado') {
    const n = Math.max(1, numeroParcelas);
    const valorParcela = Math.round((valorTotal / n) * 100) / 100;
    for (let i = 0; i < n; i++) {
      const venc = new Date(`${baseVenc}T12:00:00`); venc.setMonth(venc.getMonth() + i);
      const cr = await base44.entities.ContaReceber.create({
        descricao: `${descBase} (${i + 1}/${n})`,
        cliente: clienteNome,
        cliente_id: os.cliente_id || '',
        ordem_servico_id: os.id,
        conta_bancaria_id: contaBancariaId || undefined,
        categoria: 'Ordem de Serviço',
        valor: i === n - 1 ? Math.round((valorTotal - valorParcela * (n - 1)) * 100) / 100 : valorParcela,
        data_vencimento: venc.toISOString().split('T')[0],
        status: 'pendente',
        forma_recebimento: 'boleto',
        origem: 'os',
        observacoes: numeroOs,
      });
      contasReceberIds.push(cr.id);
      contasParaCobrar.push(cr.id);
    }
  } else {
    const baixaImediata = ['pix', 'cartao', 'dinheiro'].includes(forma);
    const cr = await base44.entities.ContaReceber.create({
      descricao: descBase,
      cliente: clienteNome,
      cliente_id: os.cliente_id || '',
      ordem_servico_id: os.id,
      conta_bancaria_id: contaBancariaId || undefined,
      categoria: 'Ordem de Serviço',
      valor: valorTotal,
      data_vencimento: baixaImediata ? hoje : baseVenc,
      data_recebimento: baixaImediata ? hoje : undefined,
      status: baixaImediata ? 'recebido' : 'pendente',
      forma_recebimento: forma === 'transferencia' ? 'transferencia' : forma,
      origem: 'os',
      observacoes: numeroOs,
    });
    contasReceberIds.push(cr.id);
    if (!baixaImediata && formasCobranca.includes(cr.forma_recebimento)) contasParaCobrar.push(cr.id);
  }

  for (const crId of contasParaCobrar) {
    await base44.functions.invoke('cadenciaCobranca', { acao: 'agendar', conta_receber_id: crId }).catch(() => {});
  }

  return contasReceberIds;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, ordem_servico_id } = body;

    // Approve budget → start service execution
    if (action === 'aprovar_orcamento') {
      const os = await base44.entities.OrdemServico.get(ordem_servico_id);
      if (!os) return Response.json({ error: 'OS não encontrada' }, { status: 404 });
      if (os.status !== 'orcamento') return Response.json({ error: 'OS não está em orçamento' }, { status: 400 });

      const updated = await base44.entities.OrdemServico.update(ordem_servico_id, {
        status: 'aprovado',
        data_abertura: os.data_abertura || new Date().toISOString().split('T')[0],
      });

      // Motor Operacional (Fase 3): propaga o evento aos módulos + registra no log
      await base44.functions.invoke('motorOperacional', { evento: 'os_aprovada', ordem_servico_id, payload: { origem: 'ordem_servico' } }).catch(() => {});

      return Response.json({ status: 'sucesso', os: updated });
    }

    // Finalize OS → conclui a operação técnica e marca "Aguardando Faturamento".
    // O Contas a Receber NÃO é gerado aqui: a responsabilidade fiscal/financeira
    // é do Módulo Fiscal, que cria o título ao emitir a NF-e (evita duplicidade).
    if (action === 'finalizar_os') {
      const { condicao_pagamento, valor_desconto, valor_total } = body;
      const os = await base44.entities.OrdemServico.get(ordem_servico_id);
      if (!os) return Response.json({ error: 'OS não encontrada' }, { status: 404 });
      if (os.status !== 'aprovado' && os.status !== 'em_andamento') {
        return Response.json({ error: 'OS deve estar aprovada ou em andamento' }, { status: 400 });
      }

      // Recalcula custo_total a partir dos itens (salvaguarda para o BI: CMV/lucro)
      let custoTotal = Number(os.custo_total) || 0;
      if (!custoTotal && Array.isArray(os.itens)) {
        custoTotal = os.itens.reduce((sum, i) => sum + (Number(i.custo_unitario) || 0) * (Number(i.quantidade) || 0), 0);
      }

      // Desconto ajustado na finalização sobrepõe o da OS e recalcula o total líquido.
      const descontoFinal = valor_desconto != null ? Number(valor_desconto) || 0 : (Number(os.valor_desconto) || 0);
      const totalFinal = valor_total != null
        ? Number(valor_total) || 0
        : Math.max(0, ((Number(os.valor_pecas) || 0) + (Number(os.valor_servicos) || 0)) - descontoFinal);

      const updated = await base44.entities.OrdemServico.update(ordem_servico_id, {
        status: 'concluido',
        data_fechamento: new Date().toISOString().split('T')[0],
        custo_total: custoTotal,
        valor_desconto: descontoFinal,
        valor_total: totalFinal,
        // Condições de pagamento definidas na finalização sobrepõem as do início da OS.
        condicao_pagamento: condicao_pagamento || os.condicao_pagamento,
        execucao_fim: os.execucao_fim || new Date().toISOString(),
        qualidade_por_id: os.qualidade_por_id || user.id,
        qualidade_por_nome: os.qualidade_por_nome || user.full_name || user.email,
        etapa_fluxo: 'aguardando_faturamento',
        timeline: [...(os.timeline || []), { etapa: 'aguardando_faturamento', descricao: 'OS finalizada — pronta para faturamento', usuario: user.full_name || user.email, data: new Date().toISOString() }],
      });

      // Update vehicle mileage
      if (os.quilometragem_entrada) {
        await base44.entities.Veiculo.update(os.veiculo_id, {
          quilometragem: os.quilometragem_entrada,
        });
      }

      // ===== FINANCEIRO: gera o título de Contas a Receber já na finalização =====
      // A NF-e, quando emitida depois, reutiliza estes títulos (não duplica).
      let contasReceberIds = [];
      if (!os.conta_receber_id) {
        const cliente = os.cliente_id ? await base44.entities.Cliente.get(os.cliente_id).catch(() => null) : null;
        const osComTotais = { ...updated, id: ordem_servico_id };
        contasReceberIds = await gerarContasReceberDaOs(base44, osComTotais, cliente, new Date().toISOString().split('T')[0]);
        if (contasReceberIds.length > 0) {
          await base44.entities.OrdemServico.update(ordem_servico_id, {
            conta_receber_id: contasReceberIds[0],
            timeline: [...(updated.timeline || []), { etapa: 'aguardando_faturamento', descricao: `Título financeiro gerado (${contasReceberIds.length} conta(s) a receber)`, usuario: user.full_name || user.email, data: new Date().toISOString() }],
          });
        }
      }

      // Fase 4 — dispara a régua de pós-venda (satisfação + lembrete de retorno).
      await base44.functions.invoke('dispararReguas', { acao: 'evento', evento: 'os_finalizada', ordem_servico_id }).catch(() => {});

      // Motor Operacional (Fase 3): propaga o evento aos módulos + registra no log
      await base44.functions.invoke('motorOperacional', { evento: 'os_finalizada', ordem_servico_id, payload: { origem: 'ordem_servico', valor_total: totalFinal } }).catch(() => {});

      return Response.json({ status: 'sucesso', os: updated, contas_receber: contasReceberIds.length });
    }

    // Reprovar orçamento → cliente não fechou. Grava motivo e cancela a OS.
    // Se agendar_retorno=true, cria (ou reutiliza) um Lead no CRM + uma tarefa de retorno.
    if (action === 'reprovar_orcamento') {
      const { motivo_recusa, motivo_recusa_detalhe, agendar_retorno, data_retorno } = body;
      const os = await base44.entities.OrdemServico.get(ordem_servico_id);
      if (!os) return Response.json({ error: 'OS não encontrada' }, { status: 404 });
      if (os.status !== 'orcamento') return Response.json({ error: 'Só é possível reprovar uma OS em orçamento' }, { status: 400 });
      if (!motivo_recusa) return Response.json({ error: 'motivo_recusa é obrigatório' }, { status: 400 });

      const agora = new Date().toISOString();
      const updated = await base44.entities.OrdemServico.update(ordem_servico_id, {
        status: 'cancelado',
        motivo_recusa,
        motivo_recusa_detalhe: motivo_recusa_detalhe || '',
        data_recusa: agora,
        timeline: [...(os.timeline || []), { etapa: 'orcamento', descricao: `Orçamento reprovado — ${motivo_recusa}${motivo_recusa_detalhe ? ': ' + motivo_recusa_detalhe : ''}`, usuario: user.full_name || user.email, data: agora }],
      });

      let lead = null;
      let atividade = null;

      if (agendar_retorno && data_retorno) {
        // Reutiliza um lead aberto do mesmo cliente/veículo, senão cria um novo.
        const cliente = os.cliente_id ? await base44.entities.Cliente.get(os.cliente_id).catch(() => null) : null;
        const veiculo = os.veiculo_id ? await base44.entities.Veiculo.get(os.veiculo_id).catch(() => null) : null;
        const clienteNome = cliente?.nome || '';
        const placa = veiculo?.placa || '';

        let candidatos = [];
        if (os.cliente_id) {
          candidatos = await base44.entities.Lead.filter({ cliente_id: os.cliente_id });
        }
        const abertos = candidatos.filter((l) => !['ganho', 'perdido', 'convertido'].includes(l.etapa) && !['ganho', 'perdido', 'convertido'].includes(l.status));
        const existente = abertos.find((l) => !os.veiculo_id || l.veiculo_id === os.veiculo_id) || abertos[0] || null;

        const detalheMotivo = MOTIVO_LABELS[motivo_recusa] || motivo_recusa;
        const servicoInteresse = os.descricao_problema || '';

        if (existente) {
          lead = await base44.entities.Lead.update(existente.id, {
            etapa: 'negociacao',
            status: 'em_contato',
            proximo_followup: data_retorno,
            valor_estimado: os.valor_total || existente.valor_estimado || 0,
            observacoes: `${existente.observacoes ? existente.observacoes + '\n' : ''}Orçamento ${os.numero || ''} não fechou (${detalheMotivo}${motivo_recusa_detalhe ? ': ' + motivo_recusa_detalhe : ''}).`,
          });
        } else {
          lead = await base44.entities.Lead.create({
            cliente_id: os.cliente_id || '',
            cliente_nome: clienteNome,
            nome: clienteNome,
            veiculo_id: os.veiculo_id || '',
            placa,
            telefone: cliente?.celular || cliente?.telefone || '',
            email: cliente?.email || '',
            consultor: os.consultor || user.full_name || user.email,
            origem: 'manual',
            etapa: 'negociacao',
            status: 'em_contato',
            valor_estimado: os.valor_total || 0,
            servico_interesse: servicoInteresse,
            proximo_followup: data_retorno,
            data_captura: agora,
            observacoes: `Origem: orçamento ${os.numero || ''} não fechou (${detalheMotivo}${motivo_recusa_detalhe ? ': ' + motivo_recusa_detalhe : ''}).`,
          });
        }

        const tituloRetorno = `Retornar — ${detalheMotivo}${os.numero ? ' (' + os.numero + ')' : ''}`;
        atividade = await base44.entities.Atividade.create({
          lead_id: lead.id,
          tipo: 'tarefa',
          titulo: tituloRetorno,
          descricao: motivo_recusa_detalhe || `Cliente não fechou o orçamento ${os.numero || ''}. Motivo: ${detalheMotivo}.`,
          consultor: os.consultor || user.full_name || user.email,
          data_agendada: `${data_retorno}T09:00:00`,
          concluida: false,
        });
      }

      return Response.json({ status: 'sucesso', os: updated, lead, atividade });
    }

    // Excluir OS com justificativa obrigatória → registra auditoria e avisa admins.
    if (action === 'excluir_os') {
      const { motivo } = body;
      if (!motivo || String(motivo).trim().length < 5) {
        return Response.json({ error: 'Justificativa é obrigatória (mín. 5 caracteres)' }, { status: 400 });
      }
      const os = await base44.entities.OrdemServico.get(ordem_servico_id);
      if (!os) return Response.json({ error: 'OS não encontrada' }, { status: 404 });

      const cliente = os.cliente_id ? await base44.entities.Cliente.get(os.cliente_id).catch(() => null) : null;
      const veiculo = os.veiculo_id ? await base44.entities.Veiculo.get(os.veiculo_id).catch(() => null) : null;
      const agora = new Date().toISOString();

      // Registro de auditoria
      await base44.asServiceRole.entities.OsExcluida.create({
        os_numero: os.numero || '',
        os_id_original: os.id,
        cliente_nome: cliente?.nome || '',
        veiculo_placa: veiculo?.placa || '',
        valor_total: os.valor_total || 0,
        status_anterior: os.status,
        motivo: String(motivo).trim(),
        excluido_por_id: user.id,
        excluido_por_nome: user.full_name || user.email,
        data_exclusao: agora,
        snapshot: os,
      });

      // Notifica administradores por e-mail
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      const dataBr = new Date(agora).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const corpo = `Uma Ordem de Serviço foi excluída.\n\n` +
        `OS: ${os.numero || os.id}\n` +
        `Cliente: ${cliente?.nome || '—'}\n` +
        `Veículo: ${veiculo?.placa || '—'}\n` +
        `Valor: R$ ${(os.valor_total || 0).toFixed(2)}\n` +
        `Status anterior: ${os.status}\n` +
        `Excluída por: ${user.full_name || user.email}\n` +
        `Data: ${dataBr}\n\n` +
        `Justificativa: ${String(motivo).trim()}`;

      for (const admin of admins) {
        if (admin.email) {
          await base44.integrations.Core.SendEmail({
            to: admin.email,
            subject: `⚠️ OS ${os.numero || ''} excluída por ${user.full_name || user.email}`,
            body: corpo,
          }).catch(() => null);
        }
      }

      // Exclui a OS
      await base44.entities.OrdemServico.delete(ordem_servico_id);

      return Response.json({ status: 'sucesso' });
    }

    // Fase 4 — cria automaticamente um Atendimento Externo (MissaoOperacional) ao
    // marcar uma OS como "execução externa". Dispara o Motor Operacional, que
    // sincroniza Produção, Agenda e CRM.
    if (action === 'criar_atendimento_externo') {
      const os = await base44.entities.OrdemServico.get(ordem_servico_id);
      if (!os) return Response.json({ error: 'OS não encontrada' }, { status: 404 });

      // Idempotente: se já existe um atendimento externo para esta OS, reutiliza.
      const existentes = await base44.entities.MissaoOperacional.filter({ ordem_servico_id }).catch(() => []);
      if (existentes.length > 0) {
        return Response.json({ status: 'sucesso', missao: existentes[0], reutilizada: true });
      }

      const cliente = os.cliente_id ? await base44.entities.Cliente.get(os.cliente_id).catch(() => null) : null;
      const agora = new Date().toISOString();

      // Número sequencial AE-000000
      const registros = await base44.entities.MissaoOperacional.list('-created_date', 500).catch(() => []);
      let maior = 0;
      for (const r of registros) {
        const m = String(r.numero || '').match(/(\d+)\s*$/);
        if (m) maior = Math.max(maior, parseInt(m[1], 10));
      }
      const numero = `AE-${String(maior + 1).padStart(6, '0')}`;

      const missao = await base44.entities.MissaoOperacional.create({
        numero,
        titulo: `Execução externa — OS ${os.numero || ordem_servico_id.slice(-6)}`,
        ordem_servico_id,
        os_numero: os.numero || '',
        cliente_id: os.cliente_id || '',
        cliente_nome: cliente?.nome || '',
        veiculo_cliente_id: os.veiculo_id || '',
        descricao: os.descricao_problema || '',
        status: 'agendado',
        empresa_id: os.empresa_id || '',
        filial_id: os.filial_id || '',
        historico: [{ tipo: 'cadastro', descricao: `Atendimento externo criado a partir da OS ${os.numero || ''}`, usuario: user.full_name || user.email, data: agora }],
      });

      // Motor Operacional (Fase 3): atualiza Produção, Agenda e CRM
      await base44.functions.invoke('motorOperacional', {
        evento: 'atendimento_externo_criado',
        ordem_servico_id,
        referencia_id: missao.id,
        payload: { origem: 'ordem_servico', missao_numero: numero, empresa_id: os.empresa_id || '', filial_id: os.filial_id || '' },
      }).catch(() => {});

      return Response.json({ status: 'sucesso', missao });
    }

    // Create purchase order from OS items
    if (action === 'criar_pedido_compra') {
      const { fornecedor_id, itens } = body;
      if (!fornecedor_id || !itens || !Array.isArray(itens) || itens.length === 0) {
        return Response.json({ error: 'fornecedor_id e itens são obrigatórios' }, { status: 400 });
      }

      const os = await base44.entities.OrdemServico.get(ordem_servico_id);
      if (!os) return Response.json({ error: 'OS não encontrada' }, { status: 404 });

      const valorTotal = itens.reduce((sum, item) => sum + (item.valor_total || 0), 0);

      const pedido = await base44.entities.PedidoCompra.create({
        ordem_servico_id,
        fornecedor_id,
        itens,
        valor_total: valorTotal,
        data_emissao: new Date().toISOString().split('T')[0],
        status: 'aberto',
      });

      // Link pedido to OS
      const existingPedidos = os.pedidos_compra_ids || [];
      await base44.entities.OrdemServico.update(ordem_servico_id, {
        pedidos_compra_ids: [...existingPedidos, pedido.id],
      });

      return Response.json({ status: 'sucesso', pedido });
    }

    return Response.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});