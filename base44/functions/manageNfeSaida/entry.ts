import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Gera dados simulados de autorização SEFAZ (chave 44 dígitos, protocolo, número)
function gerarAutorizacao(cnpjEmit, serie) {
  const now = new Date();
  const ano = String(now.getFullYear()).slice(-2);
  const mes = String(now.getMonth() + 1).padStart(2, '0');
  const cnpj = (cnpjEmit || '00000000000000').replace(/\D/g, '').padStart(14, '0').slice(0, 14);
  const rand = String(Math.floor(Math.random() * 1e9)).padStart(9, '0');
  const numero = String(Math.floor(Math.random() * 999999) + 1);
  const serieUsada = serie || '1';
  const chaveBase = `35${ano}${mes}${cnpj}55${serieUsada.padStart(3, '0')}${numero.padStart(9, '0')}1${rand}`.slice(0, 43);
  const dv = String(chaveBase.split('').reduce((s, d) => s + Number(d), 0) % 10);
  return {
    chave: (chaveBase + dv).slice(0, 44),
    protocolo: `135${ano}${mes}${rand}`,
    numero,
    serie: serieUsada,
  };
}

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Resolve o emitente (CNPJ/nome/série) de um bloco a partir da Filial escolhida,
// caindo para a Empresa quando a filial não tem dados fiscais.
function resolverEmitente(filial, empresa, ehServico) {
  const fiscal = filial?.fiscal || {};
  const serie = ehServico ? (fiscal.serie_nfse || fiscal.serie_nfe || '1') : (fiscal.serie_nfe || '1');
  return {
    cnpj: filial?.cnpj || empresa.cnpj || '',
    nome: fiscal.razao_social || filial?.nome || empresa.razao_social || empresa.nome_fantasia || '',
    serie,
  };
}

// ===== Emite UMA nota para um "bloco" (itens filtrados + emitente + desconto rateado) =====
// bloco: { itensOs, valorDesconto, filial, ehServico }
async function emitirNotaBloco(base44, user, os, cliente, empresa, bloco, cond, nowIso, hoje) {
  const { itensOs, valorDesconto, filial, ehServico } = bloco;
  const emitente = resolverEmitente(filial, empresa, ehServico);

  const forma_pagamento = cond.forma || 'pix';
  const numero_parcelas = cond.numero_parcelas || 1;
  const primeiroVenc = cond.data_primeiro_vencimento || '';
  const contaBancariaId = cond.conta_bancaria_id || '';

  let valorProdutos = 0;
  let valorServicos = 0;
  const itensNota = itensOs.map((it) => {
    const total = Number(it.valor_total) || (Number(it.valor_unitario) || 0) * (Number(it.quantidade) || 0);
    const isPeca = it.tipo === 'peca';
    if (isPeca) valorProdutos += total; else valorServicos += total;
    return {
      codigo: it.peca_id || '',
      descricao: it.descricao || '',
      tipo: isPeca ? 'peca' : 'servico',
      peca_id: isPeca ? it.peca_id : undefined,
      quantidade: Number(it.quantidade) || 1,
      unidade: 'UN',
      valor_unitario: Number(it.valor_unitario) || 0,
      valor_total: total,
      custo_unitario: Number(it.custo_unitario) || 0,
    };
  });
  valorProdutos = round2(valorProdutos);
  valorServicos = round2(valorServicos);

  const desconto = round2(valorDesconto || 0);
  const valorTotal = round2(valorProdutos + valorServicos - desconto);

  const aliqIss = Number(empresa.aliquota_iss) || 5;
  const iss = valorServicos * (aliqIss / 100);
  const icms = valorProdutos * 0.18;
  const pis = valorTotal * 0.0065;
  const cofins = valorTotal * 0.03;
  const valorTributos = iss + icms + pis + cofins;

  const cfop = valorProdutos > 0 ? '5102' : '5933';
  const natureza = valorProdutos > 0 && valorServicos > 0
    ? 'Venda de mercadoria e prestação de serviço'
    : valorProdutos > 0 ? 'Venda de mercadoria' : 'Prestação de serviço';

  const auth = gerarAutorizacao(emitente.cnpj, emitente.serie);
  const danfeUrl = `https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?chave=${auth.chave}`;
  const clienteNome = cliente?.nome || cliente?.razao_social || '';

  const nota = await base44.entities.NotaFiscal.create({
    tipo: 'saida',
    origem: 'os',
    status: 'autorizada',
    chave_acesso: auth.chave,
    numero: auth.numero,
    serie: auth.serie,
    protocolo: auth.protocolo,
    pdf_url: danfeUrl,
    emitente_cnpj: emitente.cnpj,
    emitente_nome: emitente.nome,
    destinatario_cnpj: cliente?.cnpj || cliente?.cpf || '',
    destinatario_nome: clienteNome,
    destinatario_endereco: cliente?.endereco || '',
    cliente_id: os.cliente_id,
    veiculo_id: os.veiculo_id,
    ordem_servico_id: os.id,
    natureza_operacao: natureza,
    cfop,
    valor_produtos: valorProdutos,
    valor_servicos: valorServicos,
    valor_desconto: desconto,
    valor_total: valorTotal,
    valor_tributos: valorTributos,
    tributos_detalhe: { icms, iss, pis, cofins, ipi: 0 },
    data_emissao: hoje,
    itens: itensNota,
    forma_pagamento,
    numero_parcelas,
    historico: [{ acao: 'emissao', descricao: `${ehServico ? 'NFS-e' : 'NF-e'} nº ${auth.numero} autorizada (emitente ${emitente.nome})`, usuario: user.full_name || user.email, data: nowIso }],
  });

  // ===== FINANCEIRO: cria Contas a Receber deste bloco =====
  const contasReceberIds = [];
  const contasParaCobrar = [];
  const forma = forma_pagamento;
  const descBase = `NF-e ${auth.numero} - OS ${os.numero || os.id.slice(-6)} - ${clienteNome}`;
  const numeroOs = os.numero || os.id.slice(-6);
  const formasCobranca = ['boleto', 'promissoria'];
  const baseVenc = primeiroVenc || hoje;

  if (forma === 'parcelado') {
    const n = Math.max(1, numero_parcelas || 1);
    const valorParcela = round2(valorTotal / n);
    for (let i = 0; i < n; i++) {
      const venc = new Date(`${baseVenc}T12:00:00`); venc.setMonth(venc.getMonth() + i);
      const cr = await base44.entities.ContaReceber.create({
        descricao: `${descBase} (${i + 1}/${n})`,
        cliente: clienteNome,
        cliente_id: os.cliente_id || '',
        filial_id: filial?.id || undefined,
        ordem_servico_id: os.id,
        nota_fiscal_id: nota.id,
        conta_bancaria_id: contaBancariaId || undefined,
        categoria: 'Ordem de Serviço',
        valor: i === n - 1 ? round2(valorTotal - valorParcela * (n - 1)) : valorParcela,
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
      filial_id: filial?.id || undefined,
      ordem_servico_id: os.id,
      nota_fiscal_id: nota.id,
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

  // ===== ESTOQUE: baixa das peças deste bloco =====
  let pecasBaixadas = 0;
  for (const it of itensNota) {
    if (it.tipo !== 'peca' || !it.peca_id) continue;
    const peca = await base44.entities.Peca.get(it.peca_id).catch(() => null);
    if (!peca) continue;
    const qtd = Number(it.quantidade) || 0;
    const saldoAnterior = Number(peca.estoque_atual) || 0;
    const saldoNovo = saldoAnterior - qtd;
    const custoMedio = Number(peca.valor_custo_medio) || 0;
    const margem = it.valor_unitario > 0 ? ((it.valor_unitario - custoMedio) / it.valor_unitario) * 100 : 0;
    await base44.entities.Peca.update(it.peca_id, { estoque_atual: saldoNovo, margem: Math.round(margem * 100) / 100 });
    await base44.entities.MovimentoEstoque.create({
      peca_id: it.peca_id, peca_codigo: peca.codigo, peca_descricao: peca.descricao,
      tipo: 'saida', quantidade: qtd, custo_unitario: custoMedio,
      documento: `NF-e ${auth.numero}`, motivo: `Venda OS ${os.numero || os.id.slice(-6)}`,
      usuario: user.full_name || user.email, saldo_anterior: saldoAnterior, saldo_novo: saldoNovo, data: nowIso,
    });
    pecasBaixadas++;
  }

  await base44.entities.NotaFiscal.update(nota.id, { contas_receber_ids: contasReceberIds });

  return {
    nota, numero: auth.numero, chave: auth.chave, protocolo: auth.protocolo, serie: auth.serie,
    emitente_cnpj: emitente.cnpj, emitente_nome: emitente.nome, tipo_nota: ehServico ? 'NFS-e' : 'NF-e',
    pecas_baixadas: pecasBaixadas, contas_receber_ids: contasReceberIds, valor_total: valorTotal, valor_tributos: valorTributos,
  };
}

// ===== FATURAR OS: emite 1 nota (modo único) ou 2 notas (modo dividido) =====
async function faturarOs(base44, user, ordem_servico_id, formaOverride, parcelasOverride, nowIso, hoje) {
  const os = await base44.entities.OrdemServico.get(ordem_servico_id).catch(() => null);
  if (!os) return { error: 'OS não encontrada', statusCode: 404 };

  if (os.nota_fiscal_id) {
    const existente = await base44.entities.NotaFiscal.get(os.nota_fiscal_id).catch(() => null);
    if (existente && existente.status !== 'cancelada') {
      return { error: 'Esta OS já possui nota fiscal autorizada', statusCode: 400 };
    }
  }

  const itensOs = Array.isArray(os.itens) ? os.itens : [];
  if (itensOs.length === 0) return { error: 'OS sem itens para faturar', statusCode: 400 };

  const [cliente, veiculo, empresas, filiais] = await Promise.all([
    os.cliente_id ? base44.entities.Cliente.get(os.cliente_id).catch(() => null) : null,
    os.veiculo_id ? base44.entities.Veiculo.get(os.veiculo_id).catch(() => null) : null,
    base44.entities.Empresa.list().catch(() => []),
    base44.entities.Filial.list().catch(() => []),
  ]);
  const empresa = empresas[0] || {};
  const acharFilial = (id) => filiais.find((f) => f.id === id) || null;

  // Condições de pagamento: request tem prioridade, senão o negociado na OS.
  const condOs = os.condicao_pagamento || {};
  const cond = {
    forma: formaOverride || condOs.forma || 'pix',
    numero_parcelas: parcelasOverride || condOs.numero_parcelas || 1,
    data_primeiro_vencimento: condOs.data_primeiro_vencimento || '',
    conta_bancaria_id: condOs.conta_bancaria_id || '',
  };

  const dist = os.distribuicao_faturamento || {};
  const modo = dist.modo === 'dividido' ? 'dividido' : 'unico';
  const desconto = round2(os.valor_desconto || 0);

  const pecas = itensOs.filter((it) => it.tipo === 'peca');
  const servicos = itensOs.filter((it) => it.tipo !== 'peca');
  const brutoPecas = round2(pecas.reduce((s, i) => s + (Number(i.valor_total) || 0), 0));
  const brutoServicos = round2(servicos.reduce((s, i) => s + (Number(i.valor_total) || 0), 0));
  const totalBruto = round2(brutoPecas + brutoServicos);
  const descontoDe = (bruto) => (totalBruto > 0 ? round2((bruto / totalBruto) * desconto) : 0);

  const notasEmitidas = [];

  if (modo === 'unico') {
    const filialId = dist.cnpj_pecas || dist.cnpj_servicos || os.filial_id || '';
    const filial = acharFilial(filialId);
    const r = await emitirNotaBloco(base44, user, os, cliente, empresa, {
      itensOs, valorDesconto: desconto, filial, ehServico: pecas.length === 0,
    }, cond, nowIso, hoje);
    notasEmitidas.push(r);
  } else {
    // Bloco A — peças (NF-e de produto no CNPJ A)
    if (pecas.length > 0) {
      const filialPecas = acharFilial(dist.cnpj_pecas);
      const r = await emitirNotaBloco(base44, user, os, cliente, empresa, {
        itensOs: pecas, valorDesconto: descontoDe(brutoPecas), filial: filialPecas, ehServico: false,
      }, cond, nowIso, hoje);
      notasEmitidas.push(r);
    }
    // Bloco B — serviços/mão de obra (NFS-e no CNPJ B)
    if (servicos.length > 0) {
      const filialServicos = acharFilial(dist.cnpj_servicos);
      const r = await emitirNotaBloco(base44, user, os, cliente, empresa, {
        itensOs: servicos, valorDesconto: descontoDe(brutoServicos), filial: filialServicos, ehServico: true,
      }, cond, nowIso, hoje);
      notasEmitidas.push(r);
    }
  }

  // Vincula a OS à(s) nota(s), marca "Nota Emitida" e registra no histórico
  const todasContas = notasEmitidas.flatMap((n) => n.contas_receber_ids);
  const descTimeline = notasEmitidas.map((n) => `${n.tipo_nota} ${n.numero} (${n.emitente_nome || n.emitente_cnpj})`).join(' + ');
  await base44.entities.OrdemServico.update(ordem_servico_id, {
    nota_fiscal_id: notasEmitidas[0]?.nota?.id || null,
    conta_receber_id: todasContas[0] || os.conta_receber_id,
    etapa_fluxo: 'nota_emitida',
    timeline: [...(os.timeline || []), { etapa: 'nota_emitida', descricao: `Faturado: ${descTimeline}`, usuario: user.full_name || user.email, data: nowIso }],
  });

  return {
    status: 'sucesso',
    modo,
    total_notas: notasEmitidas.length,
    notas: notasEmitidas.map((n) => ({
      nota_id: n.nota.id, tipo: n.tipo_nota, numero: n.numero, chave: n.chave,
      emitente_cnpj: n.emitente_cnpj, emitente_nome: n.emitente_nome,
      valor_total: n.valor_total, pecas_baixadas: n.pecas_baixadas,
    })),
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;
    const nowIso = new Date().toISOString();
    const hoje = nowIso.split('T')[0];

    // ============ ASSISTENTE FISCAL: VALIDAR ANTES DA EMISSÃO ============
    if (action === 'validar') {
      const { ordem_servico_id } = body;
      const os = await base44.entities.OrdemServico.get(ordem_servico_id);
      if (!os) return Response.json({ error: 'OS não encontrada' }, { status: 404 });

      const [cliente, veiculo, empresas] = await Promise.all([
        os.cliente_id ? base44.entities.Cliente.get(os.cliente_id).catch(() => null) : null,
        os.veiculo_id ? base44.entities.Veiculo.get(os.veiculo_id).catch(() => null) : null,
        base44.entities.Empresa.list().catch(() => []),
      ]);
      const empresa = empresas[0] || {};
      const itensOs = Array.isArray(os.itens) ? os.itens : [];

      const itensFiscais = [];
      for (const it of itensOs) {
        let dadosPeca = null;
        if (it.tipo === 'peca' && it.peca_id) {
          const p = await base44.entities.Peca.get(it.peca_id).catch(() => null);
          if (p) dadosPeca = { ncm: p.ncm, cfop: p.cfop, cest: p.cest, origem: p.origem, aliquota_icms: p.aliquota_icms, aliquota_pis: p.aliquota_pis, aliquota_cofins: p.aliquota_cofins, aliquota_ipi: p.aliquota_ipi };
        }
        itensFiscais.push({
          descricao: it.descricao, tipo: it.tipo, quantidade: it.quantidade,
          valor_unitario: it.valor_unitario, valor_total: it.valor_total, dados_fiscais: dadosPeca,
        });
      }

      let valorProdutos = 0, valorServicos = 0;
      for (const it of itensOs) {
        const total = Number(it.valor_total) || (Number(it.valor_unitario) || 0) * (Number(it.quantidade) || 0);
        if (it.tipo === 'peca') valorProdutos += total; else valorServicos += total;
      }
      const cfopPrevisto = valorProdutos > 0 ? '5102' : '5933';

      const contexto = {
        empresa: { razao_social: empresa.razao_social, cnpj: empresa.cnpj, regime_tributario: empresa.regime_tributario, aliquota_iss: empresa.aliquota_iss, inscricao_municipal: empresa.inscricao_municipal },
        cliente: cliente ? { nome: cliente.nome || cliente.razao_social, cpf: cliente.cpf, cnpj: cliente.cnpj, endereco: cliente.endereco, tipo: cliente.tipo } : null,
        veiculo: veiculo ? { placa: veiculo.placa, marca: veiculo.marca, modelo: veiculo.modelo } : null,
        operacao: { valor_produtos: valorProdutos, valor_servicos: valorServicos, valor_total: os.valor_total, cfop_previsto: cfopPrevisto },
        itens: itensFiscais,
      };

      const resultado = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um auditor fiscal brasileiro especialista em NF-e/NFS-e. Analise os dados abaixo de uma nota fiscal de SAÍDA que será emitida a partir de uma Ordem de Serviço de uma oficina mecânica, ANTES da transmissão à SEFAZ. Identifique problemas fiscais e cadastrais.

Verifique rigorosamente:
1. Campos obrigatórios preenchidos (emitente CNPJ, destinatário nome, itens com descrição e valor).
2. Dados cadastrais inconsistentes (endereço faltando, nomes vazios).
3. Cliente sem CPF ou CNPJ (obrigatório para NF-e; para NFS-e simples pode ser aviso).
4. CFOP incorreto para a operação (produto = 5102, serviço = 5933; verifique o cfop_previsto e o cfop de cada peça).
5. CST/CSOSN inadequado para o regime tributário informado.
6. Alíquotas incompatíveis (ICMS, ISS, PIS, COFINS, IPI) com o regime e com o NCM da peça.
7. Tributação incorreta (ex.: serviço tributado por ICMS, mercadoria por ISS, NCM ausente em peça).

Para cada problema retorne um alerta com severidade: "erro" (impede emissão segura) ou "aviso" (recomendável corrigir). Se nada estiver errado, retorne lista vazia e apto=true.

DADOS:\n${JSON.stringify(contexto, null, 2)}`,
        response_json_schema: {
          type: 'object',
          properties: {
            apto: { type: 'boolean', description: 'true se não há erros que impeçam a emissão' },
            resumo: { type: 'string', description: 'resumo curto da análise (1 frase)' },
            alertas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  severidade: { type: 'string', enum: ['erro', 'aviso'] },
                  campo: { type: 'string', description: 'categoria: campo_obrigatorio, cadastro, cpf_cnpj, cfop, cst, aliquota, tributacao' },
                  titulo: { type: 'string' },
                  descricao: { type: 'string' },
                  sugestao: { type: 'string' },
                },
              },
            },
          },
        },
      });

      const alertas = Array.isArray(resultado?.alertas) ? resultado.alertas : [];
      const temErro = alertas.some((a) => a.severidade === 'erro');
      return Response.json({
        status: 'sucesso',
        apto: resultado?.apto !== false && !temErro,
        tem_erro: temErro,
        resumo: resultado?.resumo || '',
        alertas,
      });
    }

    // ============ FATURAR OS: emite 1 ou 2 notas conforme a distribuição (Fase 4) ============
    if (action === 'faturar' || action === 'emitir') {
      const { ordem_servico_id, forma_pagamento, numero_parcelas } = body;
      const resultado = await faturarOs(base44, user, ordem_servico_id, forma_pagamento, numero_parcelas, nowIso, hoje);
      if (resultado.error) return Response.json({ error: resultado.error }, { status: resultado.statusCode || 400 });
      return Response.json(resultado);
    }

    // ============ EMITIR EM MASSA (exclusivo do Módulo Fiscal) ============
    if (action === 'emitir_lote') {
      const { ordens_servico_ids, forma_pagamento } = body;
      if (!Array.isArray(ordens_servico_ids) || ordens_servico_ids.length === 0) {
        return Response.json({ error: 'Nenhuma OS selecionada' }, { status: 400 });
      }
      const resultados = [];
      for (const osId of ordens_servico_ids) {
        const r = await faturarOs(base44, user, osId, forma_pagamento || 'pix', 1, new Date().toISOString(), new Date().toISOString().split('T')[0]);
        resultados.push({ ordem_servico_id: osId, sucesso: !r.error, total_notas: r.total_notas || 0, error: r.error || null });
      }
      const emitidas = resultados.filter((r) => r.sucesso).length;
      return Response.json({ status: 'sucesso', total: resultados.length, emitidas, falhas: resultados.length - emitidas, resultados });
    }

    // ============ REENVIAR DANFE por e-mail ============
    if (action === 'reenviar_danfe') {
      const { nota_fiscal_id, email } = body;
      const nota = await base44.entities.NotaFiscal.get(nota_fiscal_id);
      if (!nota) return Response.json({ error: 'Nota não encontrada' }, { status: 404 });
      if (nota.status === 'cancelada') return Response.json({ error: 'Nota cancelada não pode ter DANFE reenviada' }, { status: 400 });
      let destino = email;
      if (!destino && nota.cliente_id) {
        const c = await base44.entities.Cliente.get(nota.cliente_id).catch(() => null);
        destino = c?.email;
      }
      if (!destino) return Response.json({ error: 'Cliente sem e-mail cadastrado. Informe um e-mail para envio.' }, { status: 400 });
      await base44.integrations.Core.SendEmail({
        to: destino,
        subject: `DANFE - NF-e ${nota.numero}/${nota.serie}`,
        body: `Olá,\n\nSegue a nota fiscal referente à sua ordem de serviço.\n\nNF-e nº ${nota.numero} / Série ${nota.serie}\nChave de acesso: ${nota.chave_acesso}\nProtocolo: ${nota.protocolo}\nValor total: R$ ${(Number(nota.valor_total) || 0).toFixed(2)}\nConsulta/DANFE: ${nota.pdf_url || 'disponível no portal da SEFAZ'}\n\nAtenciosamente,\n${nota.emitente_nome || 'Oficina'}`,
      });
      const historico = [...(nota.historico || []), { acao: 'reenvio_danfe', descricao: `DANFE reenviada para ${destino}`, usuario: user.full_name || user.email, data: nowIso }];
      await base44.entities.NotaFiscal.update(nota_fiscal_id, { historico });
      return Response.json({ status: 'sucesso', email: destino });
    }

    // ============ CANCELAR NOTA (com estorno) ============
    if (action === 'cancelar') {
      const { nota_fiscal_id, motivo } = body;
      if (!motivo || motivo.trim().length < 15) {
        return Response.json({ error: 'Motivo do cancelamento deve ter ao menos 15 caracteres (exigência SEFAZ)' }, { status: 400 });
      }
      const nota = await base44.entities.NotaFiscal.get(nota_fiscal_id);
      if (!nota) return Response.json({ error: 'Nota não encontrada' }, { status: 404 });
      if (nota.status === 'cancelada') return Response.json({ error: 'Nota já está cancelada' }, { status: 400 });

      let pecasEstornadas = 0;
      for (const it of (nota.itens || [])) {
        if (it.tipo !== 'peca' || !it.peca_id) continue;
        const peca = await base44.entities.Peca.get(it.peca_id).catch(() => null);
        if (!peca) continue;
        const qtd = Number(it.quantidade) || 0;
        const saldoAnterior = Number(peca.estoque_atual) || 0;
        const saldoNovo = saldoAnterior + qtd;
        await base44.entities.Peca.update(it.peca_id, { estoque_atual: saldoNovo });
        await base44.entities.MovimentoEstoque.create({
          peca_id: it.peca_id,
          peca_codigo: peca.codigo,
          peca_descricao: peca.descricao,
          tipo: 'entrada',
          quantidade: qtd,
          custo_unitario: Number(it.custo_unitario) || 0,
          documento: `Estorno NF-e ${nota.numero}`,
          motivo: `Cancelamento da NF-e ${nota.numero}`,
          usuario: user.full_name || user.email,
          saldo_anterior: saldoAnterior,
          saldo_novo: saldoNovo,
          data: nowIso,
        });
        pecasEstornadas++;
      }

      let contasCanceladas = 0;
      for (const crId of (nota.contas_receber_ids || [])) {
        const cr = await base44.entities.ContaReceber.get(crId).catch(() => null);
        if (!cr || cr.status === 'cancelado') continue;
        await base44.entities.ContaReceber.update(crId, {
          status: 'cancelado',
          observacoes: `${cr.observacoes || ''} | Cancelado por estorno da NF-e ${nota.numero}`,
        });
        contasCanceladas++;
      }

      const notaAtualizada = await base44.entities.NotaFiscal.update(nota_fiscal_id, {
        status: 'cancelada',
        motivo_cancelamento: motivo,
        data_cancelamento: nowIso,
        historico: [...(nota.historico || []), { acao: 'cancelamento', descricao: `Cancelada na SEFAZ. Motivo: ${motivo}`, usuario: user.full_name || user.email, data: nowIso }],
      });

      // Reverte etapa da OS para "Aguardando Faturamento"
      if (nota.ordem_servico_id) {
        const os = await base44.entities.OrdemServico.get(nota.ordem_servico_id).catch(() => null);
        if (os) {
          await base44.entities.OrdemServico.update(nota.ordem_servico_id, {
            etapa_fluxo: 'aguardando_faturamento',
            nota_fiscal_id: null,
            timeline: [...(os.timeline || []), { etapa: 'nota_emitida', descricao: `NF-e ${nota.numero} cancelada`, usuario: user.full_name || user.email, data: nowIso }],
          });
        }
      }

      return Response.json({
        status: 'sucesso',
        nota: notaAtualizada,
        pecas_estornadas: pecasEstornadas,
        contas_canceladas: contasCanceladas,
      });
    }

    return Response.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});