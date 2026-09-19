import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ---------------------------------------------------------------------------
// CADÊNCIA DE COBRANÇA — agenda/cancela as mensagens de cobrança de uma
// Conta a Receber, reaproveitando a fila MensagemAgendada + processarAgendamentos
// (que já respeitam horário comercial e anti-spam).
//
// Ações:
//   { acao: 'agendar', conta_receber_id }   -> enfileira a régua para a conta
//   { acao: 'cancelar', conta_receber_id }  -> cancela agendamentos pendentes (ex: cliente pagou)
//
// A régua usada é a personalizada do cliente (escopo=cliente) se existir e ativa;
// senão a padrão da oficina (escopo=padrao). Cada passo vira 1 agendamento com
// data relativa ao vencimento da conta.
// ---------------------------------------------------------------------------

const DIA_MS = 24 * 60 * 60 * 1000;

// Régua padrão embutida (usada se não houver ConfigCobranca padrão salva).
const REGUA_FALLBACK = {
  ativo: true,
  canal_padrao: 'whatsapp',
  formas_alvo: ['boleto', 'promissoria'],
  passos: [
    { ativo: true, momento: 'antes', dias: 1, canal: 'auto', texto: 'Olá {cliente}! Passando para lembrar que seu pagamento de {valor} (OS {os_numero}) vence amanhã, dia {vencimento}. Qualquer dúvida estou à disposição. 🙂' },
    { ativo: true, momento: 'no_dia', dias: 0, canal: 'auto', texto: 'Oi {cliente}! Seu pagamento de {valor} (OS {os_numero}) vence hoje, {vencimento}. Segue para facilitar. Obrigado!' },
    { ativo: true, momento: 'apos', dias: 3, canal: 'auto', texto: 'Olá {cliente}, notamos que o pagamento de {valor} (OS {os_numero}), vencido em {vencimento}, ainda consta em aberto. Pode nos ajudar a regularizar? Qualquer coisa, chame por aqui.' },
    { ativo: true, momento: 'apos', dias: 7, canal: 'auto', texto: 'Oi {cliente}! O valor de {valor} (OS {os_numero}) segue em aberto desde {vencimento}. Vamos resolver juntos? Estamos à disposição para negociar.' },
  ],
};

function renderTexto(texto, ctx) {
  return String(texto || '')
    .replaceAll('{cliente}', ctx.cliente || 'cliente')
    .replaceAll('{valor}', ctx.valor || '')
    .replaceAll('{vencimento}', ctx.vencimento || '')
    .replaceAll('{os_numero}', ctx.os_numero || '')
    .replaceAll('{oficina}', ctx.oficina || 'nossa oficina')
    .replaceAll('{linha_digitavel}', ctx.linha_digitavel || '')
    .replaceAll('{pix}', ctx.pix || '');
}

function formatBRL(v) {
  return `R$ ${(Number(v) || 0).toFixed(2).replace('.', ',')}`;
}

function formatData(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

// Data/hora do disparo a partir do vencimento e do passo (às 09:00 local).
function dataDoPasso(vencimentoIso, passo) {
  const base = new Date(`${String(vencimentoIso).split('T')[0]}T09:00:00-03:00`);
  const dias = Number(passo.dias) || 0;
  if (passo.momento === 'antes') base.setTime(base.getTime() - dias * DIA_MS);
  else if (passo.momento === 'apos') base.setTime(base.getTime() + dias * DIA_MS);
  return base;
}

async function acharConversa(base44, clienteId, canal) {
  if (!clienteId) return null;
  const convs = await base44.asServiceRole.entities.Conversa.filter({ cliente_id: clienteId }, '-ultima_mensagem_em', 20).catch(() => []);
  return convs.find((x) => x.canal === canal) || convs[0] || null;
}

async function agendar(base44, contaReceberId) {
  const conta = await base44.asServiceRole.entities.ContaReceber.get(contaReceberId).catch(() => null);
  if (!conta) return { status: 'ignorado', motivo: 'conta_nao_encontrada' };
  if (conta.status !== 'pendente') return { status: 'ignorado', motivo: 'conta_nao_pendente' };
  if (!conta.data_vencimento) return { status: 'ignorado', motivo: 'sem_vencimento' };

  // Régua: personalizada do cliente (ativa) sobrepõe a padrão.
  let regua = null;
  if (conta.cliente_id) {
    const personalizadas = await base44.asServiceRole.entities.ConfigCobranca.filter({ escopo: 'cliente', cliente_id: conta.cliente_id }).catch(() => []);
    regua = personalizadas.find((r) => r.ativo !== false) || null;
  }
  if (!regua) {
    const padroes = await base44.asServiceRole.entities.ConfigCobranca.filter({ escopo: 'padrao' }).catch(() => []);
    regua = padroes[0] || REGUA_FALLBACK;
  }
  if (regua.ativo === false) return { status: 'ignorado', motivo: 'regua_desativada' };

  const formasAlvo = regua.formas_alvo || REGUA_FALLBACK.formas_alvo;
  if (conta.forma_recebimento && formasAlvo.length > 0 && !formasAlvo.includes(conta.forma_recebimento)) {
    return { status: 'ignorado', motivo: 'forma_fora_da_regua' };
  }

  const cliente = conta.cliente_id ? await base44.asServiceRole.entities.Cliente.get(conta.cliente_id).catch(() => null) : null;
  if (cliente?.aceita_notificacoes === false) return { status: 'ignorado', motivo: 'cliente_optout' };

  const empresa = (await base44.asServiceRole.entities.Empresa.list('-created_date', 1))[0] || null;
  const canalPadrao = regua.canal_padrao || 'whatsapp';
  const conversa = await acharConversa(base44, conta.cliente_id, canalPadrao);

  const ctx = {
    cliente: cliente?.nome || conta.cliente || 'cliente',
    valor: formatBRL(conta.valor),
    vencimento: formatData(conta.data_vencimento),
    os_numero: conta.observacoes || '',
    oficina: empresa?.nome_fantasia || 'nossa oficina',
    linha_digitavel: conta.boleto?.linha_digitavel || '',
    pix: conta.boleto?.pix_copia_cola || '',
  };

  const agora = Date.now();
  let criados = 0;
  const passos = (regua.passos || []).filter((p) => p.ativo !== false && p.texto);
  for (let i = 0; i < passos.length; i++) {
    const passo = passos[i];
    const quando = dataDoPasso(conta.data_vencimento, passo);
    if (quando.getTime() < agora - DIA_MS) continue; // não agenda passo muito no passado

    const chaveDedupe = `cobranca:${conta.id}:${i}`;
    const existe = await base44.asServiceRole.entities.MensagemAgendada.filter({ chave_dedupe: chaveDedupe });
    if (existe.length > 0) continue;

    await base44.asServiceRole.entities.MensagemAgendada.create({
      conversa_id: conversa?.id || '',
      cliente_id: conta.cliente_id || '',
      evento: 'cobranca',
      canal: passo.canal && passo.canal !== 'auto' ? passo.canal : canalPadrao,
      texto: renderTexto(passo.texto, ctx),
      agendado_para: quando.toISOString(),
      status: 'pendente',
      chave_dedupe: chaveDedupe,
      empresa_id: empresa?.id || '',
    });
    criados++;
  }

  await base44.asServiceRole.entities.ContaReceber.update(conta.id, { cobranca_agendada: true });
  return { status: 'ok', agendamentos: criados };
}

async function cancelar(base44, contaReceberId) {
  const pendentes = await base44.asServiceRole.entities.MensagemAgendada.filter({
    evento: 'cobranca',
    status: 'pendente',
  }, '-agendado_para', 500).catch(() => []);
  const alvo = pendentes.filter((m) => (m.chave_dedupe || '').startsWith(`cobranca:${contaReceberId}:`));
  let cancelados = 0;
  for (const m of alvo) {
    await base44.asServiceRole.entities.MensagemAgendada.update(m.id, { status: 'cancelada' });
    cancelados++;
  }
  return { status: 'ok', cancelados };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { acao, conta_receber_id } = body;

    if (!conta_receber_id) return Response.json({ error: 'conta_receber_id é obrigatório' }, { status: 400 });

    if (acao === 'agendar') {
      const r = await agendar(base44, conta_receber_id);
      await base44.functions.invoke('processarAgendamentos', {}).catch(() => {});
      return Response.json(r);
    }
    if (acao === 'cancelar') {
      const r = await cancelar(base44, conta_receber_id);
      return Response.json(r);
    }
    return Response.json({ error: 'Ação inválida (use agendar ou cancelar)' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});