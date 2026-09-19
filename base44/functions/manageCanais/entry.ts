import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ---------------------------------------------------------------------------
// Gerenciador das conexões de canal (multiempresa).
// Ações:
//   - salvar_oficial : cria/atualiza um canal no modo API oficial (Meta).
//                      Gera verify_token automático se ainda não existir.
//   - gerar_qr       : prepara o canal para conexão via QR Code (não-oficial).
//                      Marca status=aguardando_qr. O QR real só é preenchido
//                      por um provedor externo 24h (integração futura).
//   - desconectar    : zera credenciais/estado e volta para desconectado.
// ---------------------------------------------------------------------------
function genToken() {
  return 'vt_' + crypto.randomUUID().replace(/-/g, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, canal_id, canal, modo_conexao, empresa_id, filial_id, nome_exibicao, credenciais } = body;

    if (!action) {
      return Response.json({ error: 'action é obrigatório.' }, { status: 400 });
    }

    // Carrega canal existente quando informado
    let existente = null;
    if (canal_id) {
      existente = await base44.asServiceRole.entities.CanalConexao.get(canal_id).catch(() => null);
      if (!existente) {
        return Response.json({ error: 'Canal não encontrado.' }, { status: 404 });
      }
    }

    if (action === 'salvar_oficial') {
      if (!canal) {
        return Response.json({ error: 'canal é obrigatório.' }, { status: 400 });
      }
      const verify_token = existente?.verify_token || genToken();
      const dados = {
        canal,
        modo_conexao: 'oficial',
        empresa_id: empresa_id || existente?.empresa_id || '',
        filial_id: filial_id || existente?.filial_id || '',
        nome_exibicao: nome_exibicao ?? existente?.nome_exibicao ?? '',
        credenciais: credenciais || existente?.credenciais || {},
        verify_token,
        status: 'desconectado',
        erro_detalhe: '',
      };
      const canalSalvo = existente
        ? await base44.asServiceRole.entities.CanalConexao.update(existente.id, dados)
        : await base44.asServiceRole.entities.CanalConexao.create(dados);
      return Response.json({ status: 'ok', canal: canalSalvo });
    }

    if (action === 'gerar_qr') {
      if (!canal) {
        return Response.json({ error: 'canal é obrigatório.' }, { status: 400 });
      }
      const dados = {
        canal,
        modo_conexao: 'qrcode',
        empresa_id: empresa_id || existente?.empresa_id || '',
        filial_id: filial_id || existente?.filial_id || '',
        nome_exibicao: nome_exibicao ?? existente?.nome_exibicao ?? '',
        status: 'aguardando_qr',
        qrcode: {
          sessao_id: 'sess_' + crypto.randomUUID().slice(0, 8),
          gerado_em: new Date().toISOString(),
        },
        erro_detalhe: '',
      };
      const canalSalvo = existente
        ? await base44.asServiceRole.entities.CanalConexao.update(existente.id, dados)
        : await base44.asServiceRole.entities.CanalConexao.create(dados);
      // O QR real depende de um provedor externo 24h — ainda não disponível.
      return Response.json({
        status: 'aguardando_provedor',
        canal: canalSalvo,
        aviso: 'Sessão preparada. O QR Code só será gerado quando houver um provedor externo 24h conectado.',
      });
    }

    if (action === 'desconectar') {
      if (!existente) {
        return Response.json({ error: 'canal_id é obrigatório.' }, { status: 400 });
      }
      const canalSalvo = await base44.asServiceRole.entities.CanalConexao.update(existente.id, {
        status: 'desconectado',
        webhook_verificado: false,
        qrcode: {},
        erro_detalhe: '',
      });
      return Response.json({ status: 'ok', canal: canalSalvo });
    }

    return Response.json({ error: 'Ação desconhecida.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});