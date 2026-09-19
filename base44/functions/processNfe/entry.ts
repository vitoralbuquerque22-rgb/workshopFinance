import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { XMLParser } from 'npm:fast-xml-parser@4.4.1';

function normalizeCnpj(cnpj) {
  return (cnpj || '').replace(/\D/g, '');
}

function num(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

// Parse an NF-e XML string into a normalized structured object (no DB writes).
function parseNfe(xmlContent) {
  const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, parseTagValue: true });
  const parsed = parser.parse(xmlContent);
  const root = parsed.nfeProc || parsed.NFe || parsed;
  const nfe = root.NFe || root;
  const infNFe = nfe.infNFe;
  if (!infNFe) throw new Error('XML inválido: infNFe não encontrada');

  const ide = infNFe.ide || {};
  const emit = infNFe.emit || {};
  const dest = infNFe.dest || {};
  const icmsTot = (infNFe.total || {}).ICMSTot || {};
  const cobr = infNFe.cobr || {};

  const chaveAcesso = (infNFe['@_Id'] || '').replace('NFe', '');
  if (!chaveAcesso) throw new Error('Chave de acesso não encontrada no XML');

  const enderEmit = emit.enderEmit || {};
  const dataEmissao = ide.dhEmi
    ? String(ide.dhEmi).substring(0, 10)
    : (ide.dEmi ? String(ide.dEmi).substring(0, 10) : new Date().toISOString().substring(0, 10));

  let duplicatas = [];
  if (cobr.dup) {
    const dupArray = Array.isArray(cobr.dup) ? cobr.dup : [cobr.dup];
    duplicatas = dupArray.map((d, i) => ({
      numero: String(d.nDup || String(i + 1).padStart(3, '0')),
      vencimento: d.dVenc ? String(d.dVenc).substring(0, 10) : dataEmissao,
      valor: num(d.vDup),
    }));
  }
  const valorTotal = num(icmsTot.vNF);
  if (duplicatas.length === 0) duplicatas = [{ numero: '001', vencimento: dataEmissao, valor: valorTotal }];

  let detItems = [];
  if (infNFe.det) detItems = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];

  const itens = detItems.map((det) => {
    const prod = det.prod || {};
    const imposto = det.imposto || {};
    const icmsGroup = imposto.ICMS || {};
    let pICMS = 0;
    for (const key of Object.keys(icmsGroup)) {
      if (icmsGroup[key] && icmsGroup[key].pICMS != null) { pICMS = num(icmsGroup[key].pICMS); break; }
    }
    const pIPI = num((imposto.IPI?.IPITrib || {}).pIPI);
    const pPIS = num((imposto.PIS?.PISAliq || {}).pPIS);
    const pCOFINS = num((imposto.COFINS?.COFINSAliq || {}).pCOFINS);
    return {
      codigo: String(prod.cProd || ''),
      descricao: String(prod.xProd || ''),
      quantidade: num(prod.qCom),
      unidade: String(prod.uCom || 'UN'),
      valor_unitario: num(prod.vUnCom),
      valor_total: num(prod.vProd),
      ncm: String(prod.NCM || ''),
      cest: String(prod.CEST || ''),
      cfop: String(prod.CFOP || ''),
      aliquota_icms: pICMS,
      aliquota_ipi: pIPI,
      aliquota_pis: pPIS,
      aliquota_cofins: pCOFINS,
    };
  }).filter((i) => i.codigo || i.descricao);

  return {
    chaveAcesso,
    numero: String(ide.nNF || ''),
    serie: String(ide.serie || ''),
    dataEmissao,
    valorTotal,
    emitenteCnpj: normalizeCnpj(emit.CNPJ || emit.CPF),
    emitenteNome: emit.xNome || '',
    emitenteFantasia: emit.xFant || '',
    enderEmit,
    destinatarioCnpj: normalizeCnpj(dest.CNPJ || dest.CPF),
    duplicatas,
    itens,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const webhookSecret = Deno.env.get("NFE_WEBHOOK_SECRET");
    const providedSecret = req.headers.get("X-Webhook-Secret");
    const isWebhook = !!(providedSecret && webhookSecret && providedSecret === webhookSecret);

    if (!isWebhook) {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body = {};
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      body = { xml: await req.text() };
    }

    // Webhook always auto-confirms (no human in the loop); UI defaults to "analisar" then "confirmar".
    const action = body.action || (isWebhook ? 'confirmar' : 'analisar');

    // ============ ANALISAR: parse + casa pedido + compara, sem gravar ============
    if (action === 'analisar') {
      const xmlContent = body.xml || body.xml_content || '';
      if (!xmlContent.trim()) return Response.json({ error: 'Conteúdo XML não fornecido' }, { status: 400 });

      const nf = parseNfe(xmlContent);

      const existing = await base44.asServiceRole.entities.NotaFiscal.filter({ chave_acesso: nf.chaveAcesso });
      if (existing.length > 0) {
        return Response.json({ status: 'duplicada', message: 'NF-e já processada anteriormente', nota_fiscal_id: existing[0].id });
      }

      // Fornecedor (não cria ainda — só sinaliza)
      let fornecedor = null;
      if (nf.emitenteCnpj) {
        const allForns = await base44.asServiceRole.entities.Fornecedor.list();
        fornecedor = allForns.find((f) => normalizeCnpj(f.cnpj) === nf.emitenteCnpj) || null;
      }

      // Casa com Pedido de Compra em aberto do mesmo fornecedor
      let pedido = null;
      if (fornecedor) {
        const pedidos = await base44.asServiceRole.entities.PedidoCompra.filter({ fornecedor_id: fornecedor.id });
        pedido = pedidos
          .filter((p) => ['aberto', 'enviado', 'recebido_parcial', 'backorder'].includes(p.status))
          .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0] || null;
      }

      // Enriquecer itens com dados da peça atual + comparação com o pedido
      const itensConferencia = [];
      for (const item of nf.itens) {
        let peca = null;
        if (item.codigo) {
          const ps = await base44.asServiceRole.entities.Peca.filter({ codigo: item.codigo });
          peca = ps[0] || null;
        }
        // Item correspondente no pedido (por peca_id ou descrição aproximada)
        let itemPedido = null;
        if (pedido) {
          itemPedido = (pedido.itens || []).find((ip) =>
            (peca && ip.peca_id === peca.id) ||
            (ip.descricao && item.descricao && ip.descricao.toLowerCase().trim() === item.descricao.toLowerCase().trim())
          ) || null;
        }
        const alertas = [];
        if (itemPedido) {
          const pendente = (itemPedido.quantidade || 0) - (itemPedido.quantidade_recebida || 0);
          if (item.quantidade > pendente + 0.001) alertas.push({ tipo: 'quantidade', msg: `Quantidade acima do pendente (pedido: ${pendente}, nota: ${item.quantidade}).` });
          if (item.quantidade < pendente - 0.001) alertas.push({ tipo: 'quantidade', msg: `Recebimento parcial (pedido: ${pendente}, nota: ${item.quantidade}).` });
          if (item.valor_unitario > (itemPedido.valor_unitario || 0) + 0.01) alertas.push({ tipo: 'preco', msg: `Preço superior ao negociado (pedido: R$ ${(itemPedido.valor_unitario || 0).toFixed(2)}, nota: R$ ${item.valor_unitario.toFixed(2)}).` });
        } else if (pedido) {
          alertas.push({ tipo: 'item', msg: 'Item não encontrado no pedido de compra.' });
        }
        itensConferencia.push({
          ...item,
          peca_id: peca?.id || null,
          peca_existe: !!peca,
          custo_medio_atual: peca?.valor_custo_medio || 0,
          ultima_compra_atual: peca?.valor_ultima_compra || 0,
          estoque_atual: peca?.estoque_atual || 0,
          pedido_valor_unitario: itemPedido?.valor_unitario ?? null,
          pedido_pendente: itemPedido ? (itemPedido.quantidade || 0) - (itemPedido.quantidade_recebida || 0) : null,
          quantidade_conferida: item.quantidade,
          alertas,
        });
      }

      return Response.json({
        status: 'analisada',
        nota: {
          chave_acesso: nf.chaveAcesso, numero: nf.numero, serie: nf.serie,
          data_emissao: nf.dataEmissao, valor_total: nf.valorTotal,
          emitente_cnpj: nf.emitenteCnpj, emitente_nome: nf.emitenteNome, emitente_fantasia: nf.emitenteFantasia,
          destinatario_cnpj: nf.destinatarioCnpj, duplicatas: nf.duplicatas,
        },
        fornecedor: fornecedor ? { id: fornecedor.id, nome: fornecedor.nome_fantasia || fornecedor.razao_social } : null,
        fornecedor_existe: !!fornecedor,
        pedido: pedido ? { id: pedido.id, numero: pedido.numero, status: pedido.status } : null,
        itens: itensConferencia,
        xml: xmlContent,
      });
    }

    // ============ CONFIRMAR: grava tudo ============
    const xmlContent = body.xml || body.xml_content || '';
    if (!xmlContent.trim()) return Response.json({ error: 'Conteúdo XML não fornecido' }, { status: 400 });
    const nf = parseNfe(xmlContent);
    // Quantidades conferidas enviadas pela UI: { [codigo]: quantidade }. Sem isso (webhook) usa a nota.
    const conferidas = body.quantidades_conferidas || {};

    const existing = await base44.asServiceRole.entities.NotaFiscal.filter({ chave_acesso: nf.chaveAcesso });
    if (existing.length > 0) {
      return Response.json({ status: 'duplicada', message: 'NF-e já processada anteriormente', nota_fiscal_id: existing[0].id });
    }

    // Fornecedor: cria se não existir
    let fornecedor = null;
    let fornecedorCriado = false;
    if (nf.emitenteCnpj) {
      const allForns = await base44.asServiceRole.entities.Fornecedor.list();
      fornecedor = allForns.find((f) => normalizeCnpj(f.cnpj) === nf.emitenteCnpj) || null;
      if (!fornecedor && (body.criar_fornecedor !== false)) {
        const e = nf.enderEmit;
        const endereco = e.xLgr ? [e.xLgr, e.nro ? String(e.nro) : '', e.xBairro, e.xMun, e.UF].filter(Boolean).join(', ') : undefined;
        fornecedor = await base44.asServiceRole.entities.Fornecedor.create({
          nome_fantasia: nf.emitenteFantasia || nf.emitenteNome,
          razao_social: nf.emitenteNome, cnpj: nf.emitenteCnpj, categoria: 'pecas',
          endereco, status: 'ativo',
        });
        fornecedorCriado = true;
      }
    }

    // Pedido vinculado (opcional, informado pela UI)
    let pedido = null;
    if (body.pedido_compra_id) {
      const ps = await base44.asServiceRole.entities.PedidoCompra.filter({ id: body.pedido_compra_id });
      pedido = ps[0] || null;
    }

    const itensNota = [];
    let recebimentoCompleto = true;

    for (const item of nf.itens) {
      const qtdConferida = conferidas[item.codigo] != null ? num(conferidas[item.codigo]) : item.quantidade;
      if (qtdConferida < item.quantidade - 0.001) recebimentoCompleto = false;
      itensNota.push({ ...item, quantidade_recebida: qtdConferida });
      if (qtdConferida <= 0) continue;

      // Peça: cria ou atualiza custo médio + estoque
      let peca = null;
      if (item.codigo) {
        const ps = await base44.asServiceRole.entities.Peca.filter({ codigo: item.codigo });
        peca = ps[0] || null;
      }

      if (peca) {
        const estoqueAntigo = peca.estoque_atual || 0;
        const custoAntigo = peca.valor_custo_medio || 0;
        const novoEstoque = estoqueAntigo + qtdConferida;
        const novoCustoMedio = novoEstoque > 0 ? (estoqueAntigo * custoAntigo + qtdConferida * item.valor_unitario) / novoEstoque : item.valor_unitario;
        await base44.asServiceRole.entities.Peca.update(peca.id, {
          estoque_atual: novoEstoque,
          valor_ultima_compra: item.valor_unitario,
          valor_custo_medio: novoCustoMedio,
          ncm: item.ncm || peca.ncm, cest: item.cest || peca.cest, cfop: item.cfop || peca.cfop,
          aliquota_icms: item.aliquota_icms || peca.aliquota_icms,
          aliquota_ipi: item.aliquota_ipi || peca.aliquota_ipi,
          aliquota_pis: item.aliquota_pis || peca.aliquota_pis,
          aliquota_cofins: item.aliquota_cofins || peca.aliquota_cofins,
          fornecedor_principal_id: fornecedor?.id || peca.fornecedor_principal_id,
        });
      } else {
        peca = await base44.asServiceRole.entities.Peca.create({
          codigo: item.codigo || item.descricao.slice(0, 20), descricao: item.descricao, marca: '',
          unidade: item.unidade, fornecedor_principal_id: fornecedor?.id,
          estoque_atual: qtdConferida, estoque_minimo: 0,
          valor_custo_medio: item.valor_unitario, valor_ultima_compra: item.valor_unitario,
          margem: 0, valor_venda: 0, ncm: item.ncm, cest: item.cest, cfop: item.cfop, origem: '0',
          aliquota_icms: item.aliquota_icms, aliquota_ipi: item.aliquota_ipi,
          aliquota_pis: item.aliquota_pis, aliquota_cofins: item.aliquota_cofins, status: 'ativo',
        });
      }

      // Movimento de estoque (entrada)
      await base44.asServiceRole.entities.MovimentoEstoque.create({
        peca_id: peca.id, peca_codigo: peca.codigo, peca_descricao: peca.descricao,
        tipo: 'entrada', quantidade: qtdConferida, custo_unitario: item.valor_unitario,
        documento: `NF-e ${nf.numero}/${nf.serie}`, motivo: 'Recebimento NF-e entrada',
        data: new Date().toISOString(),
      });

      // Histórico de preço
      await base44.asServiceRole.entities.HistoricoPreco.create({
        peca_id: peca.id, peca_codigo: peca.codigo, peca_descricao: peca.descricao,
        fornecedor_id: fornecedor?.id, fornecedor_nome: fornecedor?.nome_fantasia || nf.emitenteNome,
        valor_unitario: item.valor_unitario, quantidade: qtdConferida,
        origem: 'nfe', documento: `NF-e ${nf.numero}/${nf.serie}`, data: new Date().toISOString(),
      });

      // Atualiza recebimento no pedido, se houver item correspondente
      if (pedido) {
        const idx = (pedido.itens || []).findIndex((ip) =>
          ip.peca_id === peca.id ||
          (ip.descricao && ip.descricao.toLowerCase().trim() === item.descricao.toLowerCase().trim())
        );
        if (idx >= 0) pedido.itens[idx].quantidade_recebida = (pedido.itens[idx].quantidade_recebida || 0) + qtdConferida;
      }
    }

    // Persiste avanço do pedido
    if (pedido) {
      const totalPed = (pedido.itens || []).reduce((s, i) => s + (i.quantidade || 0), 0);
      const totalRec = (pedido.itens || []).reduce((s, i) => s + (i.quantidade_recebida || 0), 0);
      const novoStatus = totalRec >= totalPed - 0.001 ? 'recebido' : 'recebido_parcial';
      await base44.asServiceRole.entities.PedidoCompra.update(pedido.id, {
        itens: pedido.itens, status: novoStatus, data_recebimento: nf.dataEmissao,
      });
    }

    // Filial pelo destinatário
    let filialId = undefined;
    if (nf.destinatarioCnpj) {
      const filiais = await base44.asServiceRole.entities.Filial.list();
      const filial = filiais.find((f) => normalizeCnpj(f.cnpj) === nf.destinatarioCnpj);
      if (filial) filialId = filial.id;
    }

    // Contas a pagar (uma por duplicata)
    const contasPagarIds = [];
    for (let i = 0; i < nf.duplicatas.length; i++) {
      const dup = nf.duplicatas[i];
      const conta = await base44.asServiceRole.entities.ContaPagar.create({
        filial_id: filialId,
        descricao: `NF-e ${nf.numero}/${nf.serie} - ${nf.emitenteNome}${nf.duplicatas.length > 1 ? ` (Parcela ${i + 1}/${nf.duplicatas.length})` : ''}`,
        fornecedor_id: fornecedor?.id, categoria: 'NF-e Entrada',
        valor: dup.valor, data_vencimento: dup.vencimento, status: 'pendente',
        parcela_atual: i + 1, total_parcelas: nf.duplicatas.length,
        observacoes: `Auto-gerado via NF-e. Chave: ${nf.chaveAcesso}`,
      });
      contasPagarIds.push(conta.id);
    }

    const notaFiscal = await base44.asServiceRole.entities.NotaFiscal.create({
      chave_acesso: nf.chaveAcesso, numero: nf.numero, serie: nf.serie, tipo: 'entrada',
      emitente_cnpj: nf.emitenteCnpj, emitente_nome: nf.emitenteNome, destinatario_cnpj: nf.destinatarioCnpj,
      valor_total: nf.valorTotal, data_emissao: nf.dataEmissao, xml_original: xmlContent,
      itens: itensNota, pedido_compra_id: pedido?.id, contas_pagar_ids: contasPagarIds,
      fornecedor_id: fornecedor?.id, status: 'processada', recebimento_completo: recebimentoCompleto,
      origem: isWebhook ? 'webhook' : 'manual',
    });

    return Response.json({
      status: 'processada', nota_fiscal_id: notaFiscal.id, chave_acesso: nf.chaveAcesso,
      numero: nf.numero, serie: nf.serie, emitente: nf.emitenteNome,
      fornecedor_id: fornecedor?.id, fornecedor_criado: fornecedorCriado,
      pedido_vinculado: pedido?.numero || null, recebimento_completo: recebimentoCompleto,
      contas_pagar_criadas: contasPagarIds.length, valor_total: nf.valorTotal,
      pecas_processadas: itensNota.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});