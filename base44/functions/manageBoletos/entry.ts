import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Gera dados de cobrança (boleto + PIX) de forma padronizada.
// Integração real com Asaas quando há api_key configurada; senão gera cobrança
// simulada (sandbox) para que o fluxo do sistema funcione ponta a ponta.
function gerarCobrancaSimulada(conta, gateway) {
  const nosso = String(Date.now()).slice(-11);
  const linha = `34191.79001 01043.510047 91020.150008 ${Math.floor(Math.random() * 9) + 1} ${nosso}`;
  return {
    id_externo: `sim_${nosso}`,
    linha_digitavel: linha,
    codigo_barras: `34199${nosso}000000${Math.round((conta.valor || 0) * 100)}`,
    url_boleto: `https://sandbox.pagamento.exemplo/boleto/${nosso}`,
    pix_copia_cola: `00020126580014BR.GOV.BCB.PIX0136${nosso}-simulado5204000053039865802BR6009SAO PAULO62070503***6304ABCD`,
    pix_qr_url: `https://sandbox.pagamento.exemplo/pix/${nosso}.png`,
    provedor: gateway?.provedor || 'simulado',
    status_externo: 'PENDING',
    gerado_em: new Date().toISOString(),
  };
}

async function gerarCobrancaAsaas(conta, gateway, cliente) {
  const baseUrl = gateway.ambiente === 'producao'
    ? 'https://api.asaas.com/v3'
    : 'https://sandbox.asaas.com/api/v3';

  // 1. Garante um cliente no Asaas (busca por CPF/CNPJ ou cria)
  const doc = (cliente?.cnpj || cliente?.cpf || '').replace(/\D/g, '');
  let customerId = null;
  if (doc) {
    const busca = await fetch(`${baseUrl}/customers?cpfCnpj=${doc}`, {
      headers: { access_token: gateway.api_key },
    });
    const bj = await busca.json();
    customerId = bj?.data?.[0]?.id || null;
  }
  if (!customerId) {
    const criaResp = await fetch(`${baseUrl}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', access_token: gateway.api_key },
      body: JSON.stringify({
        name: cliente?.nome || conta.cliente || 'Cliente',
        cpfCnpj: doc || undefined,
        email: cliente?.email || undefined,
        mobilePhone: (cliente?.celular || cliente?.telefone || '').replace(/\D/g, '') || undefined,
      }),
    });
    const cj = await criaResp.json();
    if (!criaResp.ok) throw new Error(cj?.errors?.[0]?.description || 'Falha ao criar cliente no Asaas');
    customerId = cj.id;
  }

  // 2. Cria a cobrança (BOLETO com PIX embutido)
  const payload = {
    customer: customerId,
    billingType: 'BOLETO',
    value: Number(conta.valor) || 0,
    dueDate: conta.data_vencimento,
    description: conta.descricao || 'Cobrança',
    externalReference: conta.id,
  };
  if (Number(gateway.juros_mes) > 0) payload.interest = { value: Number(gateway.juros_mes) };
  if (Number(gateway.multa_percentual) > 0) payload.fine = { value: Number(gateway.multa_percentual) };

  const cobResp = await fetch(`${baseUrl}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', access_token: gateway.api_key },
    body: JSON.stringify(payload),
  });
  const cob = await cobResp.json();
  if (!cobResp.ok) throw new Error(cob?.errors?.[0]?.description || 'Falha ao gerar cobrança no Asaas');

  // 3. Busca dados do PIX (copia e cola)
  let pixCopiaCola = '', pixQr = '';
  try {
    const pixResp = await fetch(`${baseUrl}/payments/${cob.id}/pixQrCode`, {
      headers: { access_token: gateway.api_key },
    });
    const pj = await pixResp.json();
    pixCopiaCola = pj?.payload || '';
    pixQr = pj?.encodedImage ? `data:image/png;base64,${pj.encodedImage}` : '';
  } catch (_) { /* pix opcional */ }

  return {
    id_externo: cob.id,
    linha_digitavel: cob.identificationField || '',
    codigo_barras: cob.nossoNumero || '',
    url_boleto: cob.bankSlipUrl || cob.invoiceUrl || '',
    pix_copia_cola: pixCopiaCola,
    pix_qr_url: pixQr,
    provedor: 'asaas',
    status_externo: cob.status || 'PENDING',
    gerado_em: new Date().toISOString(),
  };
}

const STATUS_PAGO = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    const gateways = await base44.entities.GatewayPagamento.filter({ ativo: true });
    const gateway = gateways[0];

    // === Gerar boleto/PIX para uma Conta a Receber ===
    if (action === 'gerar') {
      const conta = await base44.entities.ContaReceber.get(body.conta_receber_id);
      if (!conta) return Response.json({ error: 'Conta a receber não encontrada' }, { status: 404 });
      if (conta.boleto?.id_externo) return Response.json({ error: 'Esta conta já possui boleto gerado' }, { status: 400 });

      let cliente = null;
      if (conta.cliente_id) cliente = await base44.entities.Cliente.get(conta.cliente_id).catch(() => null);

      let boleto;
      const usarAsaas = gateway && gateway.provedor === 'asaas' && gateway.api_key;
      if (usarAsaas) {
        boleto = await gerarCobrancaAsaas(conta, gateway, cliente);
      } else {
        boleto = gerarCobrancaSimulada(conta, gateway);
      }

      await base44.entities.ContaReceber.update(conta.id, {
        forma_recebimento: 'boleto',
        conta_bancaria_id: gateway?.conta_bancaria_id || conta.conta_bancaria_id,
        boleto,
      });

      return Response.json({ ok: true, boleto, simulado: !usarAsaas });
    }

    // === Sincronizar status de uma conta (consulta no provedor) ===
    if (action === 'sincronizar') {
      const conta = await base44.entities.ContaReceber.get(body.conta_receber_id);
      if (!conta?.boleto?.id_externo) return Response.json({ error: 'Conta sem boleto para sincronizar' }, { status: 400 });

      const usarAsaas = gateway && gateway.provedor === 'asaas' && gateway.api_key && !String(conta.boleto.id_externo).startsWith('sim_');
      if (!usarAsaas) {
        return Response.json({ ok: true, status_externo: conta.boleto.status_externo, atualizado: false, simulado: true });
      }

      const baseUrl = gateway.ambiente === 'producao' ? 'https://api.asaas.com/v3' : 'https://sandbox.asaas.com/api/v3';
      const resp = await fetch(`${baseUrl}/payments/${conta.boleto.id_externo}`, { headers: { access_token: gateway.api_key } });
      const pj = await resp.json();
      if (!resp.ok) return Response.json({ error: pj?.errors?.[0]?.description || 'Falha ao consultar cobrança' }, { status: 400 });

      const pago = STATUS_PAGO.includes(pj.status);
      const update = { boleto: { ...conta.boleto, status_externo: pj.status } };
      if (pago && conta.status !== 'recebido') {
        update.status = 'recebido';
        update.data_recebimento = (pj.paymentDate || pj.clientPaymentDate || new Date().toISOString()).split('T')[0];
      }
      await base44.entities.ContaReceber.update(conta.id, update);

      return Response.json({ ok: true, status_externo: pj.status, pago, atualizado: true });
    }

    // === Cancelar boleto ===
    if (action === 'cancelar') {
      const conta = await base44.entities.ContaReceber.get(body.conta_receber_id);
      if (!conta?.boleto?.id_externo) return Response.json({ error: 'Conta sem boleto para cancelar' }, { status: 400 });

      const usarAsaas = gateway && gateway.provedor === 'asaas' && gateway.api_key && !String(conta.boleto.id_externo).startsWith('sim_');
      if (usarAsaas) {
        const baseUrl = gateway.ambiente === 'producao' ? 'https://api.asaas.com/v3' : 'https://sandbox.asaas.com/api/v3';
        const resp = await fetch(`${baseUrl}/payments/${conta.boleto.id_externo}`, {
          method: 'DELETE', headers: { access_token: gateway.api_key },
        });
        if (!resp.ok) {
          const ej = await resp.json().catch(() => ({}));
          return Response.json({ error: ej?.errors?.[0]?.description || 'Falha ao cancelar cobrança' }, { status: 400 });
        }
      }

      await base44.entities.ContaReceber.update(conta.id, {
        boleto: { ...conta.boleto, status_externo: 'CANCELLED' },
      });

      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});