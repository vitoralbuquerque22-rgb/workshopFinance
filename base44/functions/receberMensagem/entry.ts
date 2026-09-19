import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Wrapper autenticado do recebimento de mensagens (uso interno / testes / canais internos).
// Exige usuário logado e delega toda a lógica ao núcleo compartilhado
// 'processarMensagemRecebida', que também é usado pelo webhook público da Meta.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const res = await base44.functions.invoke('processarMensagemRecebida', body);
    return Response.json(res.data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});