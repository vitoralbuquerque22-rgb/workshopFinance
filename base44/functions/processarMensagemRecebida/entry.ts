import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ---------------------------------------------------------------------------
// Núcleo de recebimento de mensagens (append-only).
// Faz identificação automática do contato, cria/atualiza a Conversa e grava a
// Mensagem. Usa SEMPRE service role, pois é chamada tanto por usuários logados
// (via receberMensagem) quanto pelo webhook público da Meta (via webhookCanais).
//
// Esta função é interna: deve ser chamada por outras funções através de
// base44.functions.invoke('processarMensagemRecebida', payload).
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const {
      canal = 'whatsapp',
      canal_externo_id,
      contato_nome,
      contato_telefone,
      contato_email,
      contato_identificador,
      texto,
      tipo = 'texto',
      midia_url,
      midia_nome,
      mensagem_externa_id,
      empresa_id,
    } = body;

    if (!contato_telefone && !contato_email && !contato_identificador && !canal_externo_id) {
      return Response.json({ error: 'Informe ao menos um identificador do contato (telefone, email, identificador ou canal_externo_id).' }, { status: 400 });
    }

    // Dedupe: se a mensagem externa já foi processada, não regrava.
    if (mensagem_externa_id) {
      const jaExiste = await base44.asServiceRole.entities.Mensagem.filter({ canal_externo_id: mensagem_externa_id });
      if (jaExiste.length > 0) {
        return Response.json({ status: 'duplicada', mensagem: jaExiste[0] });
      }
    }

    // 1) Localizar conversa existente (por canal + id externo do contato)
    let conversa = null;
    const chaveExterna = canal_externo_id || contato_identificador;
    if (chaveExterna) {
      const existentes = await base44.asServiceRole.entities.Conversa.filter({ canal, canal_externo_id: chaveExterna });
      if (existentes.length > 0) conversa = existentes[0];
    }

    // 2) Identificação automática: telefone -> cliente -> veiculo -> OS -> lead
    let cliente = null;
    let veiculo = null;
    let ordemServico = null;
    let lead = null;

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

    // 3) Se não existe cadastro -> criar Lead automaticamente (entra no CRM)
    if (!cliente && !lead) {
      lead = await base44.asServiceRole.entities.Lead.create({
        nome: contato_nome || contato_telefone || contato_identificador || 'Contato sem nome',
        telefone: contato_telefone || '',
        email: contato_email || '',
        origem: canal === 'whatsapp' ? 'whatsapp' : (canal === 'instagram' ? 'instagram' : 'manual'),
        plataforma: canal === 'whatsapp' ? 'whatsapp' : (canal === 'instagram' ? 'instagram' : undefined),
        status: 'novo',
        etapa: 'novo',
        data_captura: new Date().toISOString(),
        observacoes: `Lead criado automaticamente pela Central de Conversas (${canal}).`,
      });
      identificacaoStatus = 'lead_criado';
    }

    const agora = new Date().toISOString();

    // 4) Criar ou atualizar a Conversa com todos os vínculos
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
        ...vinculos,
        status: 'aberta',
        nao_lidas: (conversa.nao_lidas || 0) + 1,
      });
    } else {
      conversa = await base44.asServiceRole.entities.Conversa.create({
        canal,
        canal_externo_id: chaveExterna || '',
        status: 'aberta',
        nao_lidas: 1,
        ...vinculos,
      });
    }

    // 5) Gravar a Mensagem (append-only)
    const mensagem = await base44.asServiceRole.entities.Mensagem.create({
      conversa_id: conversa.id,
      canal,
      direcao: 'entrada',
      tipo,
      texto: texto || '',
      midia_url: midia_url || '',
      midia_nome: midia_nome || '',
      canal_externo_id: mensagem_externa_id || '',
      autor_tipo: 'cliente',
      autor_nome: contato_nome || cliente?.nome || contato_telefone || 'Cliente',
      enviada_em: agora,
    });

    return Response.json({
      status: 'ok',
      conversa,
      mensagem,
      identificacao: {
        status: identificacaoStatus,
        cliente_id: cliente?.id || null,
        veiculo_id: veiculo?.id || null,
        ordem_servico_id: ordemServico?.id || null,
        lead_id: lead?.id || null,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});