// Geração automática de códigos (SKU / código) para Peças, Mão de Obra e Serviços Compostos.
// Usa o padrão PREFIXO-0000, calculando o próximo número a partir dos registros existentes.

// Extrai o maior número usado num conjunto de códigos com um dado prefixo.
function proximoNumero(codigos, prefixo) {
  const regex = new RegExp(`^${prefixo}-(\\d+)$`, 'i');
  let maior = 0;
  for (const c of codigos) {
    const m = regex.exec(String(c || '').trim());
    if (m) maior = Math.max(maior, parseInt(m[1], 10));
  }
  return maior + 1;
}

function formatar(prefixo, numero, digitos = 4) {
  return `${prefixo}-${String(numero).padStart(digitos, '0')}`;
}

// Peça (SKU): padrão PEC-0000
export function gerarCodigoPeca(pecas = []) {
  const n = proximoNumero(pecas.map((p) => p.codigo), 'PEC');
  return formatar('PEC', n);
}

// Prefixo da mão de obra conforme a categoria selecionada.
export const PREFIXO_MAO_OBRA = {
  mecanica: 'MEC',
  eletrica: 'ELE',
  funilaria: 'FUN',
  pintura: 'PIN',
  alinhamento: 'ALI',
  diagnostico: 'DIA',
  hidraulica: 'HID',
  outros: 'MO',
};

// Mão de obra: prefixo pela categoria (ELÉTRICA → ELE-0001, MECÂNICA → MEC-0001...)
export function gerarCodigoMaoObra(maoObras = [], categoria = 'outros') {
  const prefixo = PREFIXO_MAO_OBRA[categoria] || 'MO';
  const mesmoPrefixo = maoObras.map((m) => m.codigo).filter((c) => new RegExp(`^${prefixo}-`, 'i').test(String(c || '')));
  const n = proximoNumero(mesmoPrefixo, prefixo);
  return formatar(prefixo, n);
}

// Serviço composto: padrão SC-0000
export function gerarCodigoServicoComposto(servicos = []) {
  const n = proximoNumero(servicos.map((s) => s.codigo), 'SC');
  return formatar('SC', n);
}