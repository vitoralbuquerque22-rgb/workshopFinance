import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function normalizeCnpj(cnpj) {
  return (cnpj || '').replace(/\D/g, '');
}

function num(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

// Basic CNAB 240 parser — extracts boletos from Segmento A (Pagamentos).
// Positions follow FEBRABAN standard; may need adjustment per bank layout.
function parseCnab240(content) {
  const lines = content.split('\n').filter(l => l.trim().length >= 240);
  const boletos = [];

  for (const line of lines) {
    const tipoRegistro = line.substring(7, 8);
    const codigoSegmento = line.substring(13, 14);

    if (tipoRegistro === '3' && codigoSegmento === 'A') {
      const cnpjBeneficiario = line.substring(19, 33).trim();
      const nomeBeneficiario = line.substring(43, 73).trim();
      const dataVencimento = line.substring(97, 105).trim();
      const valorStr = line.substring(119, 134).trim();
      const nossoNumero = line.substring(40, 52).trim();

      let vencimento = null;
      if (dataVencimento.length === 8) {
        vencimento = `${dataVencimento.substring(4, 8)}-${dataVencimento.substring(2, 4)}-${dataVencimento.substring(0, 2)}`;
      }

      const valorNum = num(valorStr) / 100;

      if (valorNum > 0) {
        boletos.push({
          valor: valorNum,
          vencimento,
          pagador_nome: nomeBeneficiario,
          pagador_cnpj: normalizeCnpj(cnpjBeneficiario),
          nosso_numero: nossoNumero,
        });
      }
    }
  }

  return boletos;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { conta_bancaria_id, boletos: inputBoletos, cnab_content } = body;

    let boletos = [];
    if (cnab_content) {
      boletos = parseCnab240(cnab_content);
    } else if (inputBoletos && Array.isArray(inputBoletos)) {
      boletos = inputBoletos;
    }
    // If no input provided, this is an automated daily sync.
    // Open Banking fetch would go here when an OB connector is configured.
    // For now, returns 0 boletos — logs the sync attempt for auditing.

    // Get existing pending ContaPagar for matching
    const existingContas = await base44.asServiceRole.entities.ContaPagar.filter({ status: 'pendente' });

    // Get all fornecedores for CNPJ matching
    const fornecedores = await base44.asServiceRole.entities.Fornecedor.list();

    let criados = 0;
    let matched = 0;

    for (const boleto of boletos) {
      if (!boleto.valor || !boleto.vencimento) continue;

      // Match: same valor + same vencimento
      const match = existingContas.find(cp => {
        const valorMatch = Math.abs((cp.valor || 0) - boleto.valor) < 0.01;
        const vencMatch = cp.data_vencimento === boleto.vencimento;
        return valorMatch && vencMatch;
      });

      if (match) {
        await base44.asServiceRole.entities.ContaPagar.update(match.id, {
          dda_confirmado: true,
          forma_pagamento: 'boleto',
        });
        matched++;
      } else {
        let fornecedorId = undefined;
        if (boleto.pagador_cnpj) {
          const forn = fornecedores.find(f => normalizeCnpj(f.cnpj) === boleto.pagador_cnpj);
          if (forn) fornecedorId = forn.id;
        }

        await base44.asServiceRole.entities.ContaPagar.create({
          descricao: `DDA - ${boleto.pagador_nome || 'Boleto'}${boleto.nosso_numero ? ` (Nosso Nº: ${boleto.nosso_numero})` : ''}`,
          fornecedor_id: fornecedorId,
          categoria: 'DDA',
          valor: boleto.valor,
          data_vencimento: boleto.vencimento,
          status: 'pendente',
          forma_pagamento: 'boleto',
          origem: 'dda',
          dda_confirmado: true,
          observacoes: `Auto-gerado via DDA${boleto.pagador_cnpj ? `. CNPJ: ${boleto.pagador_cnpj}` : ''}`,
        });
        criados++;
      }
    }

    // Update bank account last sync
    if (conta_bancaria_id) {
      await base44.asServiceRole.entities.ContaBancaria.update(conta_bancaria_id, {
        ultimo_sync: new Date().toISOString(),
      });
    }

    // Create IntegracaoLog
    const log = await base44.asServiceRole.entities.IntegracaoLog.create({
      conta_bancaria_id: conta_bancaria_id || undefined,
      tipo_integracao: cnab_content ? 'cnab' : (inputBoletos ? 'manual' : 'open_banking'),
      status: 'sucesso',
      boletos_encontrados: boletos.length,
      boletos_criados: criados,
      boletos_match: matched,
      data_sync: new Date().toISOString(),
    });

    return Response.json({
      status: 'sucesso',
      boletos_encontrados: boletos.length,
      boletos_criados: criados,
      boletos_match: matched,
      log_id: log.id,
    });
  } catch (error) {
    // Log error
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.IntegracaoLog.create({
        tipo_integracao: 'manual',
        status: 'erro',
        erro_detalhe: error.message,
        data_sync: new Date().toISOString(),
      });
    } catch (_) {}
    return Response.json({ error: error.message }, { status: 500 });
  }
});