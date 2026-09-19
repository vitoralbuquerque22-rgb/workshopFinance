import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function normalizeDoc(doc) {
  return (doc || '').replace(/\D/g, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      placa, marca, modelo, ano, cor, chassi, renavam,
      proprietario_nome, proprietario_cpf_cnpj, proprietario_telefone,
      motorista_nome, motorista_cpf, motorista_telefone,
      observacoes,
    } = body;

    if (!placa) {
      return Response.json({ error: 'Placa é obrigatória' }, { status: 400 });
    }

    const placaNormalizada = placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const docNormalizado = normalizeDoc(proprietario_cpf_cnpj);
    const isPessoaJuridica = docNormalizado.length > 11;

    // Check if cliente exists by CPF/CNPJ
    let cliente = null;
    let clienteCriado = false;
    if (docNormalizado) {
      const field = isPessoaJuridica ? 'cnpj' : 'cpf';
      const existing = await base44.entities.Cliente.filter({ [field]: docNormalizado });
      if (existing.length > 0) cliente = existing[0];
    }

    // Create cliente if not found
    if (!cliente && proprietario_nome) {
      cliente = await base44.entities.Cliente.create({
        tipo_pessoa: isPessoaJuridica ? 'juridica' : 'fisica',
        nome: proprietario_nome,
        cpf: isPessoaJuridica ? '' : docNormalizado,
        cnpj: isPessoaJuridica ? docNormalizado : '',
        telefone: proprietario_telefone || '',
        status: 'ativo',
      });
      clienteCriado = true;
    }

    // Check if veiculo exists by placa
    const existingVeiculos = await base44.entities.Veiculo.filter({ placa: placaNormalizada });
    let veiculo = existingVeiculos.length > 0 ? existingVeiculos[0] : null;
    let veiculoCriado = false;

    // Create veiculo if not found
    if (!veiculo && cliente) {
      veiculo = await base44.entities.Veiculo.create({
        cliente_id: cliente.id,
        placa: placaNormalizada,
        marca: marca || '',
        modelo: modelo || '',
        ano: ano ? parseInt(String(ano).slice(0, 4)) : undefined,
        cor: cor || '',
        chassi: chassi || '',
        renavam: renavam || '',
        status: 'ativo',
      });
      veiculoCriado = true;
    } else if (veiculo && cliente) {
      // Update veiculo's cliente_id if it was orphaned
      if (!veiculo.cliente_id) {
        await base44.entities.Veiculo.update(veiculo.id, { cliente_id: cliente.id });
      }
    }

    // Create motorista if different from owner
    let motorista = null;
    if (motorista_nome) {
      motorista = await base44.entities.Motorista.create({
        nome: motorista_nome,
        cpf: normalizeDoc(motorista_cpf),
        telefone: motorista_telefone || '',
        cliente_id: cliente?.id,
      });
    }

    // Create lead
    const lead = await base44.entities.Lead.create({
      cliente_id: cliente?.id,
      veiculo_id: veiculo?.id,
      motorista_id: motorista?.id,
      placa: placaNormalizada,
      consultor: user.full_name || user.email || '',
      origem: 'gps_vendas',
      status: 'novo',
      observacoes: observacoes || '',
    });

    return Response.json({
      status: 'sucesso',
      cliente_criado: clienteCriado,
      veiculo_criado: veiculoCriado,
      lead,
      cliente,
      veiculo,
      motorista,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});