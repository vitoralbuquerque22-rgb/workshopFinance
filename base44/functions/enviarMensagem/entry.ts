import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const GRAPH_VERSION = 'v21.0';
const CANAIS_META = ['whatsapp', 'instagram', 'messenger'];

// A conversa está dentro da janela de 24h da Meta se a última mensagem
// ocorreu há menos de 24 horas (mensagens de sessão só podem sair nesse período).
function dentroDaJanela24h(conversa) {
  if (!conversa.ultima_mensagem_em) return false;
  const ultima = new Date(conversa.ultima_mensagem_em).getTime();
  return (Date.now() - ultima) < 24 * 60 * 60 * 1000;
}

// Localiza o CanalConexao da empresa para o canal da conversa.
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

  // ----- WhatsApp Cloud API -----
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

  // ----- Messenger / Instagram (Send API) -----
  if (conversa.canal === 'messenger' || conversa.canal === 'instagram') {
    const pageId = cred.page_id || cred.business_account_id;
    if (!pageId) return { ok: false, erro: 'Canal sem page_id/business_account_id.' };
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/messages`;
    const message = midia_url && tipo && tipo !== 'texto'
      ? { attachment: { type: tipo === 'imagem' ? 'image' : tipo === 'audio' ? 'audio' : tipo === 'video' ? 'video' : 'file', payload: { url: midia_url, is_reusable: true } } }
      : { text: texto || '' };
    const payload = { messaging_type: 'RESPONSE', recipient: { id: destino }, message };
    const res = await graphPost(url, token, payload);
    return res.ok ? { ok: true, id_externo: res.raw?.message_id || '' } : { ok: false, erro: res.erro };
  }

  return { ok: false, erro: `Canal "${conversa.canal}" não suporta envio pela Meta.` };
}

// Envia uma mensagem de saída (consultor -> cliente) e atualiza a conversa.
// Canais internos (email/site) são apenas registrados.
// Canais Meta são despachados pela Graph API usando o token da empresa,
// respeitando a janela de 24h. A mensagem é sempre gravada, com status real.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { conversa_id, texto, tipo = 'texto', midia_url, midia_nome } = body;

    if (!conversa_id) {
      return Response.json({ error: 'conversa_id é obrigatório.' }, { status: 400 });
    }
    if (!texto && !midia_url) {
      return Response.json({ error: 'Informe um texto ou mídia.' }, { status: 400 });
    }

    const conversa = await base44.entities.Conversa.get(conversa_id);
    if (!conversa) {
      return Response.json({ error: 'Conversa não encontrada.' }, { status: 404 });
    }

    const agora = new Date().toISOString();

    let statusEntrega = 'enviada';
    let erroDetalhe = '';
    let idExterno = '';

    // ---- Despacho pela Graph API (canais Meta) ----
    if (CANAIS_META.includes(conversa.canal)) {
      if (!dentroDaJanela24h(conversa)) {
        return Response.json({
          error: 'Fora da janela de 24h da Meta. Só é possível enviar mensagens de sessão até 24h após a última mensagem do cliente. Use um template aprovado para reabrir a conversa.',
          fora_da_janela: true,
        }, { status: 422 });
      }

      const canalConexao = await acharCanalDaConversa(base44, conversa);
      if (!canalConexao) {
        return Response.json({ error: `Nenhum canal ${conversa.canal} conectado para esta empresa.` }, { status: 400 });
      }

      const resultado = await despacharParaMeta({ canalConexao, conversa, texto, midia_url, tipo });
      if (resultado.ok) {
        idExterno = resultado.id_externo || '';
        await base44.asServiceRole.entities.CanalConexao.update(canalConexao.id, {
          ultimo_evento_em: agora,
          // Envio bem-sucedido reabilita um canal que estava em erro.
          ...(canalConexao.status === 'erro' || canalConexao.status === 'expirado'
            ? { status: 'conectado', erro_detalhe: '' }
            : {}),
        }).catch(() => {});
      } else {
        statusEntrega = 'falhou';
        erroDetalhe = resultado.erro || 'Falha no envio.';
        // Erro de token/credencial -> marca o canal como "erro"/"expirado" (visível no card).
        const tokenInvalido = /token|oauth|expired|session|permission/i.test(erroDetalhe);
        if (tokenInvalido) {
          const novoStatus = /expir/i.test(erroDetalhe) ? 'expirado' : 'erro';
          await base44.asServiceRole.entities.CanalConexao.update(canalConexao.id, {
            status: novoStatus,
            erro_detalhe: erroDetalhe,
            ultimo_evento_em: agora,
          }).catch(() => {});
        }
      }
    }

    // ---- Grava a mensagem (sempre, com status real) ----
    const mensagem = await base44.entities.Mensagem.create({
      conversa_id,
      canal: conversa.canal,
      direcao: 'saida',
      tipo,
      texto: texto || '',
      midia_url: midia_url || '',
      midia_nome: midia_nome || '',
      canal_externo_id: idExterno,
      autor_tipo: 'consultor',
      autor_id: user.id,
      autor_nome: user.full_name || 'Consultor',
      status_entrega: statusEntrega,
      erro_detalhe: erroDetalhe,
      enviada_em: agora,
    });

    // Falha no despacho: mantém a mensagem registrada com o motivo e sinaliza erro.
    if (statusEntrega === 'falhou') {
      return Response.json({ error: erroDetalhe, mensagem, status: 'falhou' }, { status: 502 });
    }

    await base44.entities.Conversa.update(conversa_id, {
      ultima_mensagem_texto: texto || (tipo !== 'texto' ? `[${tipo}]` : ''),
      ultima_mensagem_em: agora,
      ultima_mensagem_direcao: 'saida',
      status: 'aguardando_cliente',
      nao_lidas: 0,
    });

    return Response.json({ status: 'ok', mensagem });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});