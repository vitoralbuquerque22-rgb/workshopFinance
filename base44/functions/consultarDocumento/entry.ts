import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ===== Validadores =====
function limparDoc(v) { return String(v || '').replace(/\D/g, ''); }

function validarCPF(cpf) {
  cpf = limparDoc(cpf);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(cpf[i]) * (10 - i);
  let d1 = (soma * 10) % 11; if (d1 === 10) d1 = 0;
  if (d1 !== Number(cpf[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(cpf[i]) * (11 - i);
  let d2 = (soma * 10) % 11; if (d2 === 10) d2 = 0;
  return d2 === Number(cpf[10]);
}

function validarCNPJ(cnpj) {
  cnpj = limparDoc(cnpj);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const calc = (base) => {
    let soma = 0, pos = base.length - 7;
    for (let i = base.length; i >= 1; i--) {
      soma += Number(base[base.length - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = calc(cnpj.slice(0, 12));
  const d2 = calc(cnpj.slice(0, 12) + d1);
  return d1 === Number(cnpj[12]) && d2 === Number(cnpj[13]);
}

// ===== Consulta CNPJ via BrasilAPI (pública) ou provedor configurado =====
async function consultarCnpj(cnpj, config) {
  if (config?.url && config?.ativo) {
    const url = config.url.replace('{cnpj}', cnpj).replace('{documento}', cnpj);
    const headers = { Accept: 'application/json' };
    if (config.token) { headers['Authorization'] = `Bearer ${config.token}`; headers['X-API-Key'] = config.token; }
    const resp = await fetch(url, { headers });
    if (!resp.ok) throw new Error(`Provedor retornou ${resp.status}`);
    const d = await resp.json();
    return normalizarCnpj(d, cnpj);
  }
  // Fallback público: BrasilAPI
  const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, { headers: { Accept: 'application/json' } });
  if (resp.status === 404) return null;
  if (!resp.ok) throw new Error(`Consulta pública retornou ${resp.status}`);
  return normalizarCnpj(await resp.json(), cnpj);
}

function normalizarCnpj(d, cnpj) {
  const socios = (d.qsa || d.socios || []).map((s) => ({
    nome: s.nome_socio || s.nome || '',
    qualificacao: s.qualificacao_socio || s.qual || s.qualificacao || '',
  })).filter((s) => s.nome);
  const cnaesSec = (d.cnaes_secundarios || []).map((c) => `${c.codigo} - ${c.descricao}`).filter(Boolean);
  return {
    tipo_pessoa: 'juridica',
    cnpj,
    razao_social: d.razao_social || d.nome || '',
    nome_fantasia: d.nome_fantasia || d.fantasia || '',
    nome: d.nome_fantasia || d.fantasia || d.razao_social || d.nome || '',
    situacao_cadastral: d.descricao_situacao_cadastral || d.situacao || '',
    cnae_principal: d.cnae_fiscal ? `${d.cnae_fiscal} - ${d.cnae_fiscal_descricao || ''}`.trim() : (d.atividade_principal?.[0] ? `${d.atividade_principal[0].code} - ${d.atividade_principal[0].text}` : ''),
    cnaes_secundarios: cnaesSec,
    socios,
    telefone: d.ddd_telefone_1 || d.telefone || '',
    celular: d.ddd_telefone_2 || '',
    email: d.email || '',
    cep: limparDoc(d.cep),
    logradouro: [d.descricao_tipo_de_logradouro, d.logradouro].filter(Boolean).join(' ') || d.logradouro || '',
    numero: d.numero || '',
    complemento: d.complemento || '',
    bairro: d.bairro || '',
    cidade: d.municipio || d.cidade || '',
    uf: d.uf || d.estado || '',
  };
}

// ===== Consulta CPF (requer provedor configurado — não há API pública gratuita) =====
async function consultarCpf(cpf, config) {
  if (!config?.url || !config?.ativo) return { needsConfig: true };
  const url = config.url.replace('{cpf}', cpf).replace('{documento}', cpf);
  const headers = { Accept: 'application/json' };
  if (config.token) { headers['Authorization'] = `Bearer ${config.token}`; headers['X-API-Key'] = config.token; }
  const resp = await fetch(url, { headers });
  if (resp.status === 404) return null;
  if (!resp.ok) throw new Error(`Provedor retornou ${resp.status}`);
  const d = await resp.json();
  return {
    tipo_pessoa: 'fisica',
    cpf,
    nome: d.nome || d.nome_completo || d.name || '',
    data_nascimento: d.data_nascimento || d.nascimento || d.birthdate || '',
    nome_mae: d.nome_mae || d.mae || '',
    situacao_cadastral: d.situacao || d.situacao_cadastral || '',
    telefone: d.telefone || d.fone || '',
    celular: d.celular || d.mobile || '',
    email: d.email || '',
    cep: limparDoc(d.cep),
    logradouro: d.logradouro || d.endereco || '',
    numero: d.numero || '',
    complemento: d.complemento || '',
    bairro: d.bairro || '',
    cidade: d.cidade || d.municipio || '',
    uf: d.uf || d.estado || '',
  };
}

Deno.serve(async (req) => {
  const inicio = Date.now();
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { tipo, documento, cliente_id } = await req.json();
    const doc = limparDoc(documento);
    const usuario = user.full_name || user.email;

    const logErro = async (msg, status = 'erro') => {
      await base44.entities.ConsultaLog.create({
        servico: tipo, documento: doc, provedor: 'sistema', usuario, status,
        tempo_resposta_ms: Date.now() - inicio, erro_detalhe: msg, cliente_id: cliente_id || undefined,
      }).catch(() => {});
    };

    if (tipo === 'cpf' && !validarCPF(doc)) { await logErro('CPF inválido'); return Response.json({ error: 'CPF inválido' }, { status: 400 }); }
    if (tipo === 'cnpj' && !validarCNPJ(doc)) { await logErro('CNPJ inválido'); return Response.json({ error: 'CNPJ inválido' }, { status: 400 }); }

    // Config do provedor
    const configs = await base44.entities.IntegracaoConfig.filter({ servico: tipo }).catch(() => []);
    const config = configs[0] || null;
    const provedor = config?.nome_provedor || (tipo === 'cnpj' ? 'BrasilAPI (público)' : 'Provedor CPF');

    let dados = null;
    try {
      if (tipo === 'cnpj') dados = await consultarCnpj(doc, config);
      else if (tipo === 'cpf') dados = await consultarCpf(doc, config);
      else return Response.json({ error: 'Tipo de consulta inválido' }, { status: 400 });
    } catch (apiErr) {
      await logErro(apiErr.message);
      return Response.json({ error: `A consulta automática não pôde ser realizada (${apiErr.message}). Você pode preencher os dados manualmente.` }, { status: 502 });
    }

    if (dados?.needsConfig) {
      await logErro('Provedor de CPF não configurado', 'erro');
      return Response.json({ error: 'Consulta de CPF não configurada. Configure um provedor em Integrações → Serviços de Consulta, ou preencha os dados manualmente.', needsConfig: true }, { status: 503 });
    }

    if (!dados) {
      await base44.entities.ConsultaLog.create({ servico: tipo, documento: doc, provedor, usuario, status: 'nao_encontrado', tempo_resposta_ms: Date.now() - inicio, cliente_id: cliente_id || undefined }).catch(() => {});
      return Response.json({ error: 'Documento não encontrado na base de dados consultada.', naoEncontrado: true }, { status: 404 });
    }

    dados.origem_dados = tipo === 'cnpj' ? 'consulta_cnpj' : 'consulta_cpf';
    dados.ultima_consulta_em = new Date().toISOString();

    await base44.entities.ConsultaLog.create({ servico: tipo, documento: doc, provedor, usuario, status: 'sucesso', tempo_resposta_ms: Date.now() - inicio, cliente_id: cliente_id || undefined }).catch(() => {});

    return Response.json({ status: 'sucesso', provedor, dados });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});