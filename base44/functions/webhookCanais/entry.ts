import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ---------------------------------------------------------------------------
// Webhook público dos canais Meta (WhatsApp / Instagram / Messenger).
//
// GET  -> Handshake de verificação (Fase 3): valida hub.verify_token contra o
//         CanalConexao dono e responde hub.challenge em texto puro.
//
// POST -> Recebimento real de mensagens (Fase 4): recebe o payload cru da Meta,
//         identifica a empresa pelo Page/IG/Phone ID, normaliza as três
//         variações e entrega ao núcleo 'processarMensagemRecebida'.
//
// Endpoint PÚBLICO — a Meta chama sem autenticação. Usa service role.
// ---------------------------------------------------------------------------

// Localiza o CanalConexao dono do evento pelo ID recebido no payload.
// Messenger/Instagram: entry.id = Page ID / IG Business ID (credenciais.page_id).
// WhatsApp: metadata.phone_number_id (credenciais.phone_number_id).
async function acharCanal(base44, { pageId, phoneNumberId }) {
  const todos = await base44.asServiceRole.entities.CanalConexao.list('-updated_date', 200);
  return todos.find((c) => {
    const cred = c.credenciais || {};
    if (phoneNumberId && cred.phone_number_id === phoneNumberId) return true;
    if (pageId && (cred.page_id === pageId || cred.business_account_id === pageId)) return true;
    return false;
  }) || null;
}

// Valida a assinatura X-Hub-Signature-256 (HMAC SHA-256 do corpo cru com o App Secret).
// Só valida canais que têm app_secret configurado — se nenhum canal envolvido tiver
// secret, o evento passa (retrocompatível com canais ainda não blindados).
async function assinaturaValida(rawBody, signatureHeader, appSecret) {
  if (!appSecret) return true; // canal sem secret configurado: não bloqueia
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;
  const esperado = signatureHeader.slice('sha256='.length);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const calculado = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
  // Comparação em tempo constante
  if (calculado.length !== esperado.length) return false;
  let diff = 0;
  for (let i = 0; i < calculado.length; i++) diff |= calculado.charCodeAt(i) ^ esperado.charCodeAt(i);
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Persistência do recebimento (service role). Idêntica em contrato ao núcleo
// 'processarMensagemRecebida', porém executada inline: um endpoint público
// (webhook da Meta) não pode invocar outra função — precisa persistir direto.
// ---------------------------------------------------------------------------
function normalizePhone(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  return digits.length > 11 ? digits.slice(-11) : digits;
}
function phoneMatches(a, b) {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  if (!na || !nb) return false;
  return na.slice(-8) === nb.slice(-8);
}

async function persistirMensagem(base44, norm) {
  const {
    canal = 'whatsapp', canal_externo_id, contato_nome, contato_telefone,
    contato_email, contato_identificador, texto, tipo = 'texto',
    midia_url, midia_nome, mensagem_externa_id,
  } = norm;

  // Dedupe por id externo da mensagem
  if (mensagem_externa_id) {
    const jaExiste = await base44.asServiceRole.entities.Mensagem.filter({ canal_externo_id: mensagem_externa_id });
    if (jaExiste.length > 0) return 'duplicada';
  }

  // Localizar conversa existente
  let conversa = null;
  const chaveExterna = canal_externo_id || contato_identificador;
  if (chaveExterna) {
    const existentes = await base44.asServiceRole.entities.Conversa.filter({ canal, canal_externo_id: chaveExterna });
    if (existentes.length > 0) conversa = existentes[0];
  }

  // Identificação automática: telefone/email -> cliente -> veiculo -> OS -> lead
  let cliente = null, veiculo = null, ordemServico = null, lead = null;
  if (contato_telefone) {
    const todos = await base44.asServiceRole.entities.Cliente.list('-created_date', 500);
    cliente = todos.find((c) => phoneMatches(c.celular, contato_telefone) || phoneMatches(c.telefone, contato_telefone)) || null;
  }
  if (!cliente && contato_email) {
    const porEmail = await base44.asServiceRole.entities.Cliente.filter({ email: contato_email });
    if (porEmail.length > 0) cliente = porEmail[0];
  }
  if (cliente) {
    const veiculos = await base44.asServiceRole.entities.Veiculo.filter({ cliente_id: cliente.id }, '-created_date', 50);
    if (veiculos.length > 0) veiculo = veiculos[0];
    const oss = await base44.asServiceRole.entities.OrdemServico.filter({ cliente_id: cliente.id }, '-created_date', 50);
    const abertas = oss.filter((o) => ['orcamento', 'aprovado', 'em_andamento'].includes(o.status));
    ordemServico = abertas[0] || oss[0] || null;
    if (!veiculo && ordemServico?.veiculo_id) {
      veiculo = await base44.asServiceRole.entities.Veiculo.get(ordemServico.veiculo_id).catch(() => null);
    }
    const leads = await base44.asServiceRole.entities.Lead.filter({ cliente_id: cliente.id }, '-created_date', 20);
    lead = leads[0] || null;
  }

  let identificacaoStatus = cliente ? 'identificado' : 'nao_identificado';
  if (!cliente && !lead) {
    lead = await base44.asServiceRole.entities.Lead.create({
      nome: contato_nome || contato_telefone || contato_identificador || 'Contato sem nome',
      telefone: contato_telefone || '',
      email: contato_email || '',
      origem: canal === 'whatsapp' ? 'whatsapp' : (canal === 'instagram' ? 'instagram' : 'manual'),
      plataforma: canal === 'whatsapp' ? 'whatsapp' : (canal === 'instagram' ? 'instagram' : undefined),
      status: 'novo', etapa: 'novo',
      data_captura: new Date().toISOString(),
      observacoes: `Lead criado automaticamente pela Central de Conversas (${canal}).`,
    });
    identificacaoStatus = 'lead_criado';
  }

  const agora = new Date().toISOString();
  const vinculos = {
    contato_nome: contato_nome || cliente?.nome || conversa?.contato_nome || '',
    contato_telefone: contato_telefone || conversa?.contato_telefone || '',
    contato_email: contato_email || conversa?.contato_email || '',
    contato_identificador: contato_identificador || conversa?.contato_identificador || '',
    cliente_id: cliente?.id || conversa?.cliente_id || '',
    veiculo_id: veiculo?.id || conversa?.veiculo_id || '',
    ordem_servico_id: ordemServico?.id || conversa?.ordem_servico_id || '',
    lead_id: lead?.id || conversa?.lead_id || '',
    identificacao_status: identificacaoStatus,
    ultima_mensagem_texto: texto || (tipo !== 'texto' ? `[${tipo}]` : ''),
    ultima_mensagem_em: agora,
    ultima_mensagem_direcao: 'entrada',
  };

  if (conversa) {
    conversa = await base44.asServiceRole.entities.Conversa.update(conversa.id, {
      ...vinculos, status: 'aberta', nao_lidas: (conversa.nao_lidas || 0) + 1,
    });
  } else {
    conversa = await base44.asServiceRole.entities.Conversa.create({
      canal, canal_externo_id: chaveExterna || '', status: 'aberta', nao_lidas: 1, ...vinculos,
    });
  }

  await base44.asServiceRole.entities.Mensagem.create({
    conversa_id: conversa.id, canal, direcao: 'entrada', tipo,
    texto: texto || '', midia_url: midia_url || '', midia_nome: midia_nome || '',
    canal_externo_id: mensagem_externa_id || '', autor_tipo: 'cliente',
    autor_nome: contato_nome || cliente?.nome || contato_telefone || 'Cliente',
    enviada_em: agora,
  });

  return 'ok';
}

// Traduz o objeto de mensagem Messenger/Instagram para o formato do núcleo.
function normalizarMessaging(evt, canal, empresaId) {
  const senderId = evt.sender?.id;
  const msg = evt.message || {};
  if (!senderId || msg.is_echo) return null; // ignora ecos das próprias respostas

  let texto = msg.text || '';
  let tipo = 'texto';
  let midia_url = '';
  const anexo = Array.isArray(msg.attachments) ? msg.attachments[0] : null;
  if (anexo) {
    midia_url = anexo.payload?.url || '';
    const t = anexo.type;
    tipo = t === 'image' ? 'imagem' : t === 'audio' ? 'audio' : t === 'video' ? 'video' : 'arquivo';
  }
  if (!texto && !midia_url) return null;

  return {
    canal,
    empresa_id: empresaId,
    canal_externo_id: senderId,
    contato_identificador: senderId,
    texto,
    tipo,
    midia_url,
    mensagem_externa_id: msg.mid || '',
  };
}

// Traduz o objeto de mensagem WhatsApp Cloud API para o formato do núcleo.
function normalizarWhatsapp(msg, contatoNome, empresaId) {
  let texto = '';
  let tipo = 'texto';
  let midia_url = '';
  if (msg.type === 'text') {
    texto = msg.text?.body || '';
  } else if (['image', 'audio', 'video', 'document'].includes(msg.type)) {
    tipo = msg.type === 'image' ? 'imagem' : msg.type === 'document' ? 'arquivo' : msg.type;
    // A URL final exige um segundo request autenticado à Graph API (fora do escopo aqui);
    // registramos a mensagem com a legenda/tipo para aparecer na Central de Conversas.
    texto = msg[msg.type]?.caption || '';
  } else {
    texto = `[${msg.type}]`;
  }

  return {
    canal: 'whatsapp',
    empresa_id: empresaId,
    contato_telefone: msg.from || '',
    canal_externo_id: msg.from || '',
    contato_nome: contatoNome || '',
    texto,
    tipo,
    midia_url,
    mensagem_externa_id: msg.id || '',
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);

    // ---------------- Handshake (GET) ----------------
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const verifyToken = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode !== 'subscribe' || !verifyToken || !challenge) {
        return new Response('Bad Request', { status: 400 });
      }

      const canais = await base44.asServiceRole.entities.CanalConexao.filter({ verify_token: verifyToken });
      if (canais.length === 0) {
        return new Response('Forbidden', { status: 403 });
      }

      await base44.asServiceRole.entities.CanalConexao.update(canais[0].id, {
        webhook_verificado: true,
        status: canais[0].status === 'desconectado' ? 'conectado' : canais[0].status,
      });

      return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    // ---------------- Recebimento (POST) ----------------
    if (req.method === 'POST') {
      // Corpo cru é necessário para validar a assinatura HMAC da Meta.
      const rawBody = await req.text();
      const payload = (() => { try { return JSON.parse(rawBody); } catch { return null; } })();
      const entries = payload?.entry;
      if (!Array.isArray(entries)) {
        return new Response('EVENT_RECEIVED', { status: 200 });
      }

      const objectType = payload.object; // 'page' | 'instagram' | 'whatsapp_business_account'

      // Identifica o canal do primeiro evento para obter o App Secret e validar a assinatura.
      const primeiro = entries[0] || {};
      let canalAssinatura = null;
      if (Array.isArray(primeiro.changes)) {
        const pnid = primeiro.changes[0]?.value?.metadata?.phone_number_id;
        canalAssinatura = await acharCanal(base44, { phoneNumberId: pnid });
      } else if (Array.isArray(primeiro.messaging)) {
        canalAssinatura = await acharCanal(base44, { pageId: primeiro.id });
      }

      const appSecret = canalAssinatura?.credenciais?.app_secret;
      const signature = req.headers.get('x-hub-signature-256');
      if (!(await assinaturaValida(rawBody, signature, appSecret))) {
        return new Response('Invalid signature', { status: 401 });
      }

      const resultados = [];

      for (const entry of entries) {
        // --- WhatsApp Cloud API: entry.changes[].value.messages[] ---
        if (Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            const value = change.value || {};
            const phoneNumberId = value.metadata?.phone_number_id;
            const mensagens = value.messages;
            if (!Array.isArray(mensagens) || mensagens.length === 0) continue;

            const canal = await acharCanal(base44, { phoneNumberId });
            const empresaId = canal?.empresa_id || '';
            const nomePorWaId = {};
            (value.contacts || []).forEach((c) => { nomePorWaId[c.wa_id] = c.profile?.name; });

            for (const msg of mensagens) {
              const norm = normalizarWhatsapp(msg, nomePorWaId[msg.from], empresaId);
              const st = await persistirMensagem(base44, norm);
              resultados.push(st);
            }
          }
        }

        // --- Messenger / Instagram: entry.messaging[] ---
        if (Array.isArray(entry.messaging)) {
          const canalTipo = objectType === 'instagram' ? 'instagram' : 'messenger';
          const canal = await acharCanal(base44, { pageId: entry.id });
          const empresaId = canal?.empresa_id || '';

          for (const evt of entry.messaging) {
            const norm = normalizarMessaging(evt, canalTipo, empresaId);
            if (!norm) continue;
            const st = await persistirMensagem(base44, norm);
            resultados.push(st);
          }
        }

        // Marca atividade no canal identificado, se houver
        // (não bloqueia o retorno rápido exigido pela Meta)
      }

      return new Response('EVENT_RECEIVED', { status: 200 });
    }

    return new Response('Method Not Allowed', { status: 405 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});