import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// === Motor de rateio (espelho de src/lib/rateio.js, inlinado — backend não importa arquivos locais) ===
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const valorItem = (item) => Number(item?.valor_total) || 0;
const grupoDoItem = (item) => (item?.tipo === 'peca' ? 'pecas' : 'servicos');

function calcularRateio(os, filiais) {
  const itens = Array.isArray(os?.itens) ? os.itens : [];
  const dist = os?.distribuicao_faturamento || { modo: 'unico', cnpj_pecas: '', cnpj_servicos: '' };
  const modo = dist.modo === 'dividido' ? 'dividido' : 'unico';

  const infoFilial = (id) => {
    const f = filiais.find((x) => x.id === id);
    return { filial_id: id || '', nome: f?.nome || '', cnpj: f?.cnpj || '', recebedor: f?.recebedor || null };
  };

  const grupos = { pecas: [], servicos: [] };
  itens.forEach((it) => { grupos[grupoDoItem(it)].push(it); });

  const brutoPecas = round2(grupos.pecas.reduce((s, i) => s + valorItem(i), 0));
  const brutoServicos = round2(grupos.servicos.reduce((s, i) => s + valorItem(i), 0));
  const totalBruto = round2(brutoPecas + brutoServicos);
  const totalDesconto = round2(os?.valor_desconto || 0);
  const descontoDe = (bruto) => (totalBruto > 0 ? round2((bruto / totalBruto) * totalDesconto) : 0);

  const grupoBloco = (chave, itensGrupo, bruto, cnpjId) => {
    const desconto = descontoDe(bruto);
    return {
      chave, ...infoFilial(cnpjId), quantidade_itens: itensGrupo.length,
      valor_bruto: bruto, valor_desconto: desconto, valor_liquido: round2(bruto - desconto),
    };
  };

  let blocos;
  if (modo === 'unico') {
    const cnpj = dist.cnpj_pecas || dist.cnpj_servicos || '';
    const todos = [...grupos.pecas, ...grupos.servicos];
    blocos = [{
      chave: 'unico', ...infoFilial(cnpj), quantidade_itens: todos.length,
      valor_bruto: totalBruto, valor_desconto: totalDesconto, valor_liquido: round2(totalBruto - totalDesconto),
    }];
  } else {
    blocos = [
      grupoBloco('pecas', grupos.pecas, brutoPecas, dist.cnpj_pecas),
      grupoBloco('servicos', grupos.servicos, brutoServicos, dist.cnpj_servicos),
    ];
    const somaLiquido = round2(blocos.reduce((s, b) => s + b.valor_liquido, 0));
    const alvo = round2(totalBruto - totalDesconto);
    const dif = round2(alvo - somaLiquido);
    if (dif !== 0) {
      const maior = blocos.reduce((a, b) => (b.valor_bruto >= a.valor_bruto ? b : a), blocos[0]);
      maior.valor_liquido = round2(maior.valor_liquido + dif);
      maior.valor_desconto = round2(maior.valor_bruto - maior.valor_liquido);
    }
  }

  return { modo, blocos: blocos.filter((b) => b.valor_liquido > 0), total_liquido: round2(totalBruto - totalDesconto) };
}

// Monta os disbursements de split do Mercado Pago a partir dos blocos do rateio
function montarSplit(blocos, taxaMarketplace) {
  return blocos.map((b) => {
    const recipient = b.recebedor?.recipient_id || '';
    const taxa = round2((b.valor_liquido * (Number(taxaMarketplace) || 0)) / 100);
    return {
      cnpj_nome: b.nome,
      cnpj: b.cnpj,
      grupo: b.chave,
      collector_id: recipient,
      amount: b.valor_liquido,
      marketplace_fee: taxa,
      recebedor_ativo: !!b.recebedor?.ativo,
    };
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, ordem_servico_id } = body;

    if (!ordem_servico_id) return Response.json({ error: 'ordem_servico_id é obrigatório' }, { status: 400 });

    const os = await base44.asServiceRole.entities.OrdemServico.get(ordem_servico_id);
    if (!os) return Response.json({ error: 'OS não encontrada' }, { status: 404 });

    const [filiais, gateways, clientes] = await Promise.all([
      base44.asServiceRole.entities.Filial.list(),
      base44.asServiceRole.entities.GatewayPagamento.filter({ ativo: true }),
      base44.asServiceRole.entities.Cliente.filter({ id: os.cliente_id }).catch(() => []),
    ]);

    const gateway = gateways.find((g) => g.provedor === 'mercado_pago' && g.split?.habilitado) || gateways.find((g) => g.provedor === 'mercado_pago');
    if (!gateway) return Response.json({ error: 'Nenhum gateway Mercado Pago com split habilitado foi configurado' }, { status: 400 });

    const rateio = calcularRateio(os, filiais);
    const split = montarSplit(rateio.blocos, gateway.split?.taxa_marketplace_percentual);
    const cliente = clientes[0] || null;

    // === action: preview — só devolve o split calculado, sem chamar o Mercado Pago ===
    if (action === 'preview') {
      return Response.json({
        modo: rateio.modo,
        total: rateio.total_liquido,
        modalidade: gateway.split?.modalidade || 'link',
        split,
      });
    }

    // === action: cobrar — monta a cobrança com split no Mercado Pago ===
    if (action === 'cobrar') {
      const semRecipient = split.filter((s) => !s.collector_id);
      if (semRecipient.length > 0) {
        return Response.json({
          error: `CNPJ sem recebedor cadastrado: ${semRecipient.map((s) => s.cnpj_nome || s.grupo).join(', ')}. Cadastre o Recipient ID na filial.`,
        }, { status: 400 });
      }

      const accessToken = gateway.api_key;
      const modalidade = gateway.split?.modalidade || 'link';
      const isSandbox = gateway.ambiente !== 'producao' || !accessToken;

      // Modo simulado — sem token, devolve uma cobrança fake para testar o fluxo/UI
      if (isSandbox) {
        const fakeId = `sim_${Date.now()}`;
        return Response.json({
          simulado: true,
          modalidade,
          cobranca: {
            id_externo: fakeId,
            init_point: `https://sandbox.mercadopago.com.br/checkout/${fakeId}`,
            qr_code: modalidade !== 'link' ? `00020126...SIMULADO...${fakeId}` : null,
            status_externo: 'pending',
          },
          total: rateio.total_liquido,
          split,
        });
      }

      // Cobrança real via Checkout Pro (link + QR) com split (marketplace_fee por item não é suportado
      // no preference; o split entre collectors é feito no payment. Aqui geramos a preference marketplace).
      const notificationUrl = gateway.webhook_url || undefined;
      const preference = {
        items: split.map((s) => ({
          title: `OS ${os.numero || ''} — ${s.grupo === 'pecas' ? 'Peças' : s.grupo === 'servicos' ? 'Serviços' : 'Total'} (${s.cnpj_nome})`,
          quantity: 1,
          unit_price: s.amount,
          currency_id: 'BRL',
        })),
        marketplace: gateway.split?.marketplace_id || undefined,
        marketplace_fee: round2(split.reduce((sum, s) => sum + (s.marketplace_fee || 0), 0)) || undefined,
        external_reference: `os:${os.id}`,
        payer: cliente ? { name: cliente.nome, email: cliente.email || undefined } : undefined,
        notification_url: notificationUrl,
        metadata: {
          ordem_servico_id: os.id,
          split: split.map((s) => ({ collector_id: s.collector_id, amount: s.amount, cnpj: s.cnpj })),
        },
      };

      const resp = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(preference),
      });
      const data = await resp.json();
      if (!resp.ok) {
        return Response.json({ error: data?.message || 'Erro ao criar cobrança no Mercado Pago', detalhe: data }, { status: 502 });
      }

      return Response.json({
        simulado: false,
        modalidade,
        cobranca: {
          id_externo: data.id,
          init_point: gateway.ambiente === 'producao' ? data.init_point : data.sandbox_init_point,
          qr_code: null,
          status_externo: 'pending',
        },
        total: rateio.total_liquido,
        split,
      });
    }

    return Response.json({ error: `Ação inválida: ${action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});