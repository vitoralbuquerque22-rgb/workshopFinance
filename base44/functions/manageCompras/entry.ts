import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const nowIso = () => new Date().toISOString();
const today = () => new Date().toISOString().split('T')[0];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // Converte a proposta vencedora de uma cotação em Pedido de Compra
    if (action === 'gerar_pedido_cotacao') {
      const { cotacao_id, fornecedor_id, deposito_id, rateio } = body;
      const cot = await base44.entities.Cotacao.get(cotacao_id);
      if (!cot) return Response.json({ error: 'Cotação não encontrada' }, { status: 404 });

      const proposta = (cot.propostas || []).find((p) => p.fornecedor_id === fornecedor_id);
      if (!proposta) return Response.json({ error: 'Proposta do fornecedor não encontrada' }, { status: 400 });

      const itens = (proposta.itens || [])
        .filter((i) => i.disponivel !== false)
        .map((i, idx) => {
          const base = (cot.itens || [])[idx] || {};
          return {
            peca_id: base.peca_id || '',
            descricao: i.descricao,
            quantidade: i.quantidade || 0,
            quantidade_recebida: 0,
            valor_unitario: i.valor_unitario || 0,
            valor_total: (i.quantidade || 0) * (i.valor_unitario || 0),
          };
        });

      const valorProdutos = itens.reduce((s, i) => s + i.valor_total, 0);
      const valorFrete = proposta.frete || 0;
      const valorTotal = valorProdutos + valorFrete;

      const pedido = await base44.entities.PedidoCompra.create({
        requisicao_id: cot.requisicao_id || '',
        cotacao_id,
        fornecedor_id,
        deposito_id: deposito_id || '',
        itens,
        valor_produtos: valorProdutos,
        valor_frete: valorFrete,
        valor_total: valorTotal,
        condicao_pagamento: proposta.condicao_pagamento || '',
        prazo_entrega_dias: proposta.prazo_entrega_dias || 0,
        rateio: rateio || [],
        data_emissao: today(),
        status: 'aberto',
      });

      await base44.entities.Cotacao.update(cotacao_id, {
        status: 'convertida',
        fornecedor_vencedor_id: fornecedor_id,
      });
      if (cot.requisicao_id) {
        await base44.entities.Requisicao.update(cot.requisicao_id, { status: 'convertida' }).catch(() => {});
      }

      return Response.json({ status: 'sucesso', pedido });
    }

    // Recebimento (parcial ou total) → estoque + histórico + conta a pagar quando finalizado
    if (action === 'receber_pedido') {
      const { pedido_compra_id, itens_recebidos, documento } = body;
      const pedido = await base44.entities.PedidoCompra.get(pedido_compra_id);
      if (!pedido) return Response.json({ error: 'Pedido não encontrado' }, { status: 404 });
      if (pedido.status === 'recebido' || pedido.status === 'cancelado') {
        return Response.json({ error: 'Pedido já finalizado' }, { status: 400 });
      }

      const fornecedor = await base44.entities.Fornecedor.get(pedido.fornecedor_id).catch(() => null);
      const recebidosMap = {};
      (itens_recebidos || []).forEach((r) => { recebidosMap[r.descricao] = r.quantidade || 0; });

      const itensAtualizados = [];
      const itensRecebimento = [];

      for (const item of (pedido.itens || [])) {
        const qtdRecebendo = recebidosMap[item.descricao] || 0;
        const novaRecebida = (item.quantidade_recebida || 0) + qtdRecebendo;

        if (qtdRecebendo > 0) {
          itensRecebimento.push({ descricao: item.descricao, quantidade: qtdRecebendo });

          if (item.peca_id) {
            const peca = await base44.entities.Peca.get(item.peca_id).catch(() => null);
            if (peca) {
              const saldoAnterior = peca.estoque_atual || 0;
              const saldoNovo = saldoAnterior + qtdRecebendo;
              await base44.entities.Peca.update(item.peca_id, {
                estoque_atual: saldoNovo,
                valor_ultima_compra: item.valor_unitario || peca.valor_ultima_compra,
              });
              await base44.entities.MovimentoEstoque.create({
                peca_id: item.peca_id,
                peca_codigo: peca.codigo,
                peca_descricao: peca.descricao,
                tipo: 'entrada',
                quantidade: qtdRecebendo,
                deposito_destino_id: pedido.deposito_id || '',
                custo_unitario: item.valor_unitario || 0,
                documento: documento || `PC ${pedido.numero || pedido_compra_id.slice(-6)}`,
                motivo: 'Recebimento de compra',
                usuario: user.full_name || user.email,
                saldo_anterior: saldoAnterior,
                saldo_novo: saldoNovo,
                data: nowIso(),
              });
              await base44.entities.HistoricoPreco.create({
                peca_id: item.peca_id,
                peca_codigo: peca.codigo,
                peca_descricao: peca.descricao,
                fornecedor_id: pedido.fornecedor_id,
                fornecedor_nome: fornecedor?.nome_fantasia || '',
                valor_unitario: item.valor_unitario || 0,
                quantidade: qtdRecebendo,
                origem: 'recebimento',
                documento: pedido.numero || pedido_compra_id.slice(-6),
                data: nowIso(),
              });
            }
          }
        }
        itensAtualizados.push({ ...item, quantidade_recebida: novaRecebida });
      }

      const temPendente = itensAtualizados.some((i) => (i.quantidade_recebida || 0) < (i.quantidade || 0) - 0.0001);
      const novoStatus = temPendente ? 'recebido_parcial' : 'recebido';

      const recebimentos = [
        ...(pedido.recebimentos || []),
        { data: nowIso(), usuario: user.full_name || user.email, documento: documento || '', itens: itensRecebimento },
      ];

      const update = {
        itens: itensAtualizados,
        recebimentos,
        status: novoStatus,
      };

      let contaPagar = null;
      if (!temPendente) {
        update.data_recebimento = today();
        if (!pedido.conta_pagar_id) {
          contaPagar = await base44.entities.ContaPagar.create({
            descricao: `PC ${pedido.numero || pedido_compra_id.slice(-6)} - ${fornecedor?.nome_fantasia || ''}`,
            fornecedor_id: pedido.fornecedor_id,
            categoria: 'Pedido de Compra',
            valor: pedido.valor_total,
            data_vencimento: today(),
            status: 'pendente',
            origem: 'manual',
            observacoes: `Gerado do Pedido de Compra ${pedido.numero || pedido_compra_id}`,
          });
          update.conta_pagar_id = contaPagar.id;
        }
      }

      const updated = await base44.entities.PedidoCompra.update(pedido_compra_id, update);
      return Response.json({ status: 'sucesso', pedido: updated, conta_pagar: contaPagar, backorder: temPendente });
    }

    // Gera um pedido de backorder com o saldo pendente
    if (action === 'gerar_backorder') {
      const { pedido_compra_id } = body;
      const pedido = await base44.entities.PedidoCompra.get(pedido_compra_id);
      if (!pedido) return Response.json({ error: 'Pedido não encontrado' }, { status: 404 });

      const pendentes = (pedido.itens || [])
        .map((i) => ({ ...i, pendente: (i.quantidade || 0) - (i.quantidade_recebida || 0) }))
        .filter((i) => i.pendente > 0.0001);

      if (pendentes.length === 0) return Response.json({ error: 'Sem itens pendentes' }, { status: 400 });

      const itens = pendentes.map((i) => ({
        peca_id: i.peca_id,
        descricao: i.descricao,
        quantidade: i.pendente,
        quantidade_recebida: 0,
        valor_unitario: i.valor_unitario,
        valor_total: i.pendente * (i.valor_unitario || 0),
      }));
      const valorProdutos = itens.reduce((s, i) => s + i.valor_total, 0);

      const novo = await base44.entities.PedidoCompra.create({
        fornecedor_id: pedido.fornecedor_id,
        deposito_id: pedido.deposito_id || '',
        cotacao_id: pedido.cotacao_id || '',
        itens,
        valor_produtos: valorProdutos,
        valor_frete: 0,
        valor_total: valorProdutos,
        condicao_pagamento: pedido.condicao_pagamento || '',
        prazo_entrega_dias: pedido.prazo_entrega_dias || 0,
        data_emissao: today(),
        status: 'aberto',
        observacoes: `Backorder do pedido ${pedido.numero || pedido_compra_id.slice(-6)}`,
      });

      return Response.json({ status: 'sucesso', pedido: novo });
    }

    return Response.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});