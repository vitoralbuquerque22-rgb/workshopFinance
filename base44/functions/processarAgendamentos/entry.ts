import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ---------------------------------------------------------------------------
// FASE 1 — Despachador da fila de mensagens agendadas ("cérebro" do agendamento).
//
// Pega os registros MensagemAgendada com status 'pendente' cujo horário
// (agendado_para) já venceu, e dispara cada um pela Graph API (mesmos canais
// Meta do envio manual). Grava a Mensagem, atualiza a Conversa e marca o
// agendamento como 'enviada' ou 'falhou'.
//
// Acionado de duas formas:
//   - Workflow diário (sem sessão de usuário) -> usa service role.
//   - Manualmente por um admin (para testar) -> exige role admin.
//
// Executa via service role em ambos os casos, pois roda sem consultor logado.
// ---------------------------------------------------------------------------

const GRAPH_VERSION = 'v21.0';
const CANAIS_META = ['whatsapp', 'instagram', 'messenger'];
const TZ = 'America/Sao_Paulo';

// ---- Fase 8: ajustes finos (horário comercial, anti-spam, dedup) ----

// Retorna { hora, minuto, diaSemana } no fuso de São Paulo para um Date.
function partesSP(date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false,
  });
  const partes = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  const dias = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { hora: Number(partes.hour), minuto: Number(partes.minute), diaSemana: dias[partes.weekday] };
}

function hhmmParaMin(hhmm, fallback) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ''));
  if (!m) return fallback;
  return Number(m[1]) * 60 + Number(m[2]);
}

// Verifica se "agora" está dentro da janela comercial permitida pela config.
function dentroDoHorarioComercial(cfg, agora) {
  if (!cfg?.respeitar_horario_comercial) return true;
  const { hora, minuto, diaSemana } = partesSP(agora);
  if (!cfg.disparar_fim_de_semana && (diaSemana === 0 || diaSemana === 6)) return false;
  const min = hora * 60 + minuto;
  const inicio = hhmmParaMin(cfg.horario_inicio, 8 * 60);
  const fim = hhmmParaMin(cfg.horario_fim, 20 * 60);
  return min >= inicio && min < fim;
}

function dentroDaJanela24h(conversa) {
  if (!conversa?.ultima_mensagem_em) return false;
  const ultima = new Date(conversa.ultima_mensagem_em).getTime();
  return (Date.now() - ultima) < 24 * 60 * 60 * 1000;
}

async function acharCanalDaConversa(base44, conversa) {
  const filtro = { canal: conversa.canal };
  if (conversa.empresa_id) filtro.empresa_id = conversa.empresa_id;
  const canais = await base44.asServiceRole.entities.CanalConexao.filter(filtro, '-updated_date', 20);
  return (
    canais.find((c) => c.modo_conexao === 'oficial' && c.credenciais?.access_token) ||
    canais[0] ||
    null
  );
}

async function graphPost(url, token, payload) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    return { ok: false, erro: data?.error?.message || `Graph API HTTP ${resp.status}` };
  }
  return { ok: true, raw: data };
}

// Despacha pela Graph API conforme o canal. Retorna { ok, id_externo?, erro? }.
async function despacharParaMeta({ canalConexao, conversa, texto, midia_url, tipo }) {
  const cred = canalConexao?.credenciais || {};
  const token = cred.access_token;
  if (!token) return { ok: false, erro: 'Canal sem token de acesso configurado.' };

  const destino = conversa.contato_telefone || conversa.canal_externo_id || conversa.contato_identificador;
  if (!destino) return { ok: false, erro: 'Conversa sem identificador de destino.' };

  if (conversa.canal === 'whatsapp') {
    const phoneNumberId = cred.phone_number_id;
    if (!phoneNumberId) return { ok: false, erro: 'Canal WhatsApp sem phone_number_id.' };
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`;
    let payload;
    if (midia_url && tipo && tipo !== 'texto') {
      const mediaTipo = tipo === 'imagem' ? 'image' : tipo === 'audio' ? 'audio' : tipo === 'video' ? 'video' : 'document';
      payload = {
        messaging_product: 'whatsapp',
        to: destino,
        type: mediaTipo,
        [mediaTipo]: { link: midia_url, ...(texto ? { caption: texto } : {}) },
      };
    } else {
      payload = { messaging_product: 'whatsapp', to: destino, type: 'text', text: { body: texto || '' } };
    }
    const res = await graphPost(url, token, payload);
    return res.ok ? { ok: true, id_externo: res.raw?.messages?.[0]?.id || '' } : { ok: false, erro: res.erro };
  }

  if (conversa.canal === 'messenger' || conversa.canal === 'instagram') {
    const pageId = cred.page_id || cred.business_account_id;
    if (!pageId) return { ok: false, erro: 'Canal sem page_id/business_account_id.' };
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/messages`;
    const message = midia_url && tipo && tipo !== 'texto'
      ? { attachment: { type: tipo === 'imagem' ? 'image' : tipo === 'audio' ? 'audio' : tipo === 'video' ? 'video' : 'file', payload: { url: midia_url, is_reusable: true } } }
      : { text: texto || '' };
    const payload = { messaging_type: 'MESSAGE_TAG', tag: 'ACCOUNT_UPDATE', recipient: { id: destino }, message };
    const res = await graphPost(url, token, payload);
    return res.ok ? { ok: true, id_externo: res.raw?.message_id || '' } : { ok: false, erro: res.erro };
  }

  return { ok: false, erro: `Canal "${conversa.canal}" não suporta envio pela Meta.` };
}

// Anti-spam + dedup por contato antes de despachar. Retorna { adiar? , duplicada? }.
async function checarLimites(base44, cfg, conversa, ag) {
  const limiteDia = Number(cfg?.limite_por_contato_dia) || 0;
  const dedupHoras = Number(cfg?.dedup_horas) || 0;
  if (limiteDia <= 0 && dedupHoras <= 0) return {};

  const desde24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recentes = await base44.asServiceRole.entities.Mensagem.filter(
    { conversa_id: conversa.id, direcao: 'saida', autor_tipo: 'automacao' },
    '-enviada_em', 50,
  ).catch(() => []);
  const janela = recentes.filter((m) => (m.enviada_em || m.created_date || '') >= desde24h && m.status_entrega !== 'falhou');

  // Dedup: mesmo texto para o mesmo contato dentro da janela configurada.
  if (dedupHoras > 0 && ag.texto) {
    const desdeDedup = new Date(Date.now() - dedupHoras * 60 * 60 * 1000).toISOString();
    const igual = janela.find((m) => (m.enviada_em || m.created_date || '') >= desdeDedup && (m.texto || '').trim() === (ag.texto || '').trim());
    if (igual) return { duplicada: true };
  }

  // Anti-spam: excedeu o teto diário de mensagens automáticas.
  if (limiteDia > 0 && janela.length >= limiteDia) return { adiar: true };
  return {};
}

// Processa um único agendamento. Retorna { status, erro?, adiar? }.
async function processarUm(base44, ag, cfg) {
  const agora = new Date().toISOString();

  // Localiza a conversa destino
  let conversa = null;
  if (ag.conversa_id) {
    conversa = await base44.asServiceRole.entities.Conversa.get(ag.conversa_id).catch(() => null);
  }
  if (!conversa && ag.cliente_id) {
    const convs = await base44.asServiceRole.entities.Conversa.filter({ cliente_id: ag.cliente_id }, '-ultima_mensagem_em', 5);
    conversa = convs[0] || null;
  }
  if (!conversa && ag.lead_id) {
    const convs = await base44.asServiceRole.entities.Conversa.filter({ lead_id: ag.lead_id }, '-ultima_mensagem_em', 5);
    conversa = convs[0] || null;
  }

  if (!conversa) {
    return { status: 'falhou', erro: 'Nenhuma conversa localizada para o destino.' };
  }

  // Ajustes finos (Fase 8): dedup cancela; anti-spam adia para a próxima janela.
  const limites = await checarLimites(base44, cfg, conversa, ag);
  if (limites.duplicada) {
    return { status: 'cancelada', erro: 'Duplicada — mensagem idêntica já enviada recentemente.' };
  }
  if (limites.adiar) {
    return { adiar: true };
  }

  const canal = ag.canal && ag.canal !== 'auto' ? ag.canal : conversa.canal;
  const tipo = ag.midia_url ? (ag.midia_tipo || 'arquivo') : 'texto';

  let statusEntrega = 'enviada';
  let erroDetalhe = '';
  let idExterno = '';

  if (CANAIS_META.includes(canal)) {
    // Fora da janela de 24h, uma mensagem de sessão comum é bloqueada pela Meta.
    // O despachador ainda tenta (usa MESSAGE_TAG p/ Messenger/IG); se falhar,
    // marca 'falhou' com o motivo — nada é perdido, aparece no painel de Fase 8.
    const canalConexao = await acharCanalDaConversa(base44, { ...conversa, canal });
    if (!canalConexao) {
      return { status: 'falhou', erro: `Nenhum canal ${canal} conectado para esta empresa.` };
    }
    const resultado = await despacharParaMeta({ canalConexao, conversa: { ...conversa, canal }, texto: ag.texto, midia_url: ag.midia_url, tipo });
    if (resultado.ok) {
      idExterno = resultado.id_externo || '';
      await base44.asServiceRole.entities.CanalConexao.update(canalConexao.id, { ultimo_evento_em: agora }).catch(() => {});
    } else {
      statusEntrega = 'falhou';
      erroDetalhe = resultado.erro || 'Falha no envio.';
    }
  }

  // Grava a mensagem sempre (com status real), como automação.
  await base44.asServiceRole.entities.Mensagem.create({
    conversa_id: conversa.id,
    canal,
    direcao: 'saida',
    tipo,
    texto: ag.texto || '',
    midia_url: ag.midia_url || '',
    canal_externo_id: idExterno,
    autor_tipo: 'automacao',
    autor_nome: 'Automação',
    status_entrega: statusEntrega,
    erro_detalhe: erroDetalhe,
    enviada_em: agora,
  });

  if (statusEntrega === 'falhou') {
    return { status: 'falhou', erro: erroDetalhe };
  }

  await base44.asServiceRole.entities.Conversa.update(conversa.id, {
    ultima_mensagem_texto: ag.texto || (tipo !== 'texto' ? `[${tipo}]` : ''),
    ultima_mensagem_em: agora,
    ultima_mensagem_direcao: 'saida',
  }).catch(() => {});

  return { status: 'enviada' };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Se houver usuário logado, precisa ser admin (chamada manual de teste).
    // Sem usuário (workflow agendado), segue via service role.
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Apenas administradores podem disparar a fila manualmente.' }, { status: 403 });
    }

    const agora = new Date().toISOString();

    // Config de ajustes finos (Fase 8): horário comercial, anti-spam, dedup.
    const cfg = (await base44.asServiceRole.entities.ConfigAutomacao.list('-updated_date', 1))[0] || null;

    // Fora do horário comercial: não dispara nada agora (os pendentes esperam).
    if (!dentroDoHorarioComercial(cfg, new Date())) {
      return Response.json({ status: 'fora_horario', total: 0, enviadas: 0, falhas: 0, adiadas: 0 });
    }

    // Busca os pendentes vencidos (limite de lote por execução).
    const pendentes = await base44.asServiceRole.entities.MensagemAgendada.filter(
      { status: 'pendente', agendado_para: { $lte: agora } },
      'agendado_para',
      100,
    );

    let enviadas = 0;
    let falhas = 0;
    let adiadas = 0;

    for (const ag of pendentes) {
      let resultado;
      try {
        resultado = await processarUm(base44, ag, cfg);
      } catch (e) {
        resultado = { status: 'falhou', erro: e.message };
      }

      // Anti-spam: reagenda para +1h em vez de consumir a mensagem.
      if (resultado.adiar) {
        await base44.asServiceRole.entities.MensagemAgendada.update(ag.id, {
          agendado_para: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }).catch(() => {});
        adiadas++;
        continue;
      }

      await base44.asServiceRole.entities.MensagemAgendada.update(ag.id, {
        status: resultado.status,
        tentativas: (ag.tentativas || 0) + 1,
        enviado_em: resultado.status === 'enviada' ? new Date().toISOString() : ag.enviado_em,
        erro_detalhe: resultado.erro || '',
      }).catch(() => {});

      if (resultado.status === 'enviada') enviadas++;
      else falhas++;
    }

    return Response.json({ status: 'ok', total: pendentes.length, enviadas, falhas, adiadas });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});