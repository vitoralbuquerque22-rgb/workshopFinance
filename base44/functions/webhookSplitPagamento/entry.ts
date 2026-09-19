import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Mapeia a categoria da conta a receber para o grupo do DRE.
// Recebimento de OS entra como Receita Bruta / Fluxo Operacional.
const DRE_GRUPO = 'receita_bruta';
const DFC_GRUPO = 'operacional';

// Extrai o id da OS do external_reference "os:<id>"
function osIdDeReferencia(ref) {
  if (!ref || typeof ref !== 'string') return '';
  return ref.startsWith('os:') ? ref.slice(3) : '';
}

// Consulta o pagamento no Mercado Pago para confirmar status + external_reference.
async function buscarPagamento(paymentId, accessToken) {
  const resp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) return null;
  return await resp.json();
}

// === Reconciliação: baixa as ContasReceber da OS (cada uma no seu CNPJ) e
// lança um MovimentoFinanceiro de receita por CNPJ para o DRE/fluxo. ===
async function reconciliarOs(base44, osId, pagamento, hoje, nowIso) {
  const contas = await base44.asServiceRole.entities.ContaReceber.filter({ ordem_servico_id: osId });
  const pendentes = (contas || []).filter((c) => c.status === 'pendente');
  if (pendentes.length === 0) {
    return { baixadas: 0, ja_reconciliado: (contas || []).some((c) => c.status === 'recebido'), lancamentos: 0 };
  }

  let baixadas = 0;
  let lancamentos = 0;
  // Agrupa por CNPJ (filial) para lançar uma receita por CNPJ no DRE
  const porFilial = {};

  for (const cr of pendentes) {
    await base44.asServiceRole.entities.ContaReceber.update(cr.id, {
      status: 'recebido',
      data_recebimento: hoje,
      forma_recebimento: cr.forma_recebimento || 'pix',
      observacoes: `${cr.observacoes || ''} | Pago via split Mercado Pago (pgto ${pagamento?.id || ''})`.trim(),
    });
    baixadas++;

    const fid = cr.filial_id || '';
    if (!porFilial[fid]) porFilial[fid] = { valor: 0, descricoes: [] };
    porFilial[fid].valor = round2(porFilial[fid].valor + (Number(cr.valor) || 0));
    porFilial[fid].descricoes.push(cr.descricao || '');
  }

  for (const [fid, dados] of Object.entries(porFilial)) {
    await base44.asServiceRole.entities.MovimentoFinanceiro.create({
      filial_id: fid || undefined,
      descricao: `Recebimento split OS ${dados.descricoes[0]?.match(/OS [^\s]+/)?.[0] || osId.slice(-6)}`,
      tipo: 'receita',
      categoria: 'Ordem de Serviço',
      dre_grupo: DRE_GRUPO,
      dfc_grupo: DFC_GRUPO,
      valor: dados.valor,
      data: hoje,
    });
    lancamentos++;
  }

  // Marca a OS como paga na etapa de fluxo
  const os = await base44.asServiceRole.entities.OrdemServico.get(osId).catch(() => null);
  if (os) {
    await base44.asServiceRole.entities.OrdemServico.update(osId, {
      etapa_fluxo: 'pagamento',
      timeline: [...(os.timeline || []), { etapa: 'pagamento', descricao: `Pagamento confirmado (split Mercado Pago) — ${baixadas} recebimento(s) baixado(s)`, usuario: 'Mercado Pago', data: nowIso }],
    });
  }

  return { baixadas, lancamentos, ja_reconciliado: false };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const nowIso = new Date().toISOString();
    const hoje = nowIso.split('T')[0];

    const body = await req.json().catch(() => ({}));
    // O secret pode chegar pela query (?secret=), por header ou pelo corpo (teste manual).
    const secret = url.searchParams.get('secret')
      || req.headers.get('x-webhook-secret')
      || body.secret
      || '';

    // Localiza o gateway Mercado Pago com split e valida o secret do webhook
    const gateways = await base44.asServiceRole.entities.GatewayPagamento.filter({ ativo: true });
    const gateway = gateways.find((g) => g.provedor === 'mercado_pago' && g.split?.habilitado)
      || gateways.find((g) => g.provedor === 'mercado_pago');
    if (!gateway) return Response.json({ error: 'Gateway Mercado Pago não configurado' }, { status: 400 });

    if (!gateway.webhook_secret || secret !== gateway.webhook_secret) {
      return Response.json({ error: 'Webhook não autorizado' }, { status: 401 });
    }

    // Suporta teste manual: { simular: true, ordem_servico_id, payment_id }
    if (body.simular && body.ordem_servico_id) {
      const r = await reconciliarOs(base44, body.ordem_servico_id, { id: body.payment_id || 'simulado' }, hoje, nowIso);
      return Response.json({ ok: true, simulado: true, ...r });
    }

    // Notificação real do Mercado Pago: type=payment, data.id = paymentId
    const tipo = body.type || body.topic || '';
    const paymentId = body.data?.id || body.resource || url.searchParams.get('data.id') || url.searchParams.get('id');
    if (tipo && tipo !== 'payment') {
      return Response.json({ ok: true, ignorado: `evento ${tipo}` });
    }
    if (!paymentId) return Response.json({ error: 'payment id ausente' }, { status: 400 });

    const accessToken = gateway.api_key;
    if (!accessToken) return Response.json({ error: 'Gateway sem token para consultar o pagamento' }, { status: 400 });

    const pagamento = await buscarPagamento(paymentId, accessToken);
    if (!pagamento) return Response.json({ error: 'Pagamento não encontrado no Mercado Pago' }, { status: 404 });

    // Só reconcilia quando o pagamento está aprovado
    if (pagamento.status !== 'approved') {
      return Response.json({ ok: true, status: pagamento.status, reconciliado: false });
    }

    const osId = osIdDeReferencia(pagamento.external_reference);
    if (!osId) return Response.json({ error: 'Pagamento sem external_reference de OS' }, { status: 400 });

    const r = await reconciliarOs(base44, osId, pagamento, hoje, nowIso);
    return Response.json({ ok: true, status: 'approved', ordem_servico_id: osId, ...r });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});