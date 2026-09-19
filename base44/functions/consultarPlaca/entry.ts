import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { placa } = body;

    if (!placa) {
      return Response.json({ error: 'Placa é obrigatória' }, { status: 400 });
    }

    // Normalize: uppercase, remove non-alphanumeric
    const placaNormalizada = placa.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Validate: Mercosul (ABC1D23) or old format (ABC1234)
    const regex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
    if (!regex.test(placaNormalizada)) {
      return Response.json({ error: 'Formato de placa inválido. Use ABC1234 ou ABC1D23.' }, { status: 400 });
    }

    const apiKey = Deno.env.get("PLACA_API_KEY");
    const apiUrl = Deno.env.get("PLACA_API_URL");

    if (!apiKey || !apiUrl) {
      return Response.json({
        error: 'Consulta de placa não configurada. Defina PLACA_API_KEY e PLACA_API_URL nas variáveis de ambiente do app.',
        placa: placaNormalizada,
      }, { status: 503 });
    }

    // Call provider API
    const url = apiUrl.replace("{placa}", placaNormalizada);
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "X-API-Key": apiKey,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json({
        error: `Provedor retornou erro ${response.status}`,
        details: errorText.slice(0, 500),
      }, { status: 502 });
    }

    const data = await response.json();

    // Normalize response — handle common field names from different providers
    const resultado = {
      placa: placaNormalizada,
      marca: data.marca || data.MARCA || data.brand || data.fipe?.marca || '',
      modelo: data.modelo || data.MODELO || data.model || data.fipe?.modelo || '',
      ano: data.ano || data.ANO || data.anoFabricacao || data.ano_modelo || data.anoModelo || null,
      cor: data.cor || data.COR || data.color || '',
      chassi: data.chassi || data.CHASSI || data.vin || '',
      renavam: data.renavam || data.RENAVAM || data.cod_renavam || '',
      proprietario_nome: data.proprietario?.nome || data.nome_proprietario || data.owner?.name || data.proprietario || data.nome || '',
      proprietario_cpf_cnpj: data.proprietario?.cpf || data.proprietario?.cnpj || data.proprietario?.doc || data.cpf_cnpj || data.cnpj_cpf || data.cpf || data.cnpj || '',
      proprietario_telefone: data.proprietario?.telefone || data.telefone || data.telefone_proprietario || '',
      municipio: data.municipio || data.cidade || data.city || '',
      uf: data.uf || data.estado || data.state || '',
      situacao: data.situacao || data.status || data.situacao_cadastral || '',
      restricoes: data.restricoes || data.observacoes || data.alertas || '',
    };

    return Response.json(resultado);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});