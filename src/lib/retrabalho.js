// Classificação de retrabalho da OS — culpa interna vs. retorno do cliente.
export const TIPO_RETRABALHO = {
  nenhum: 'Não é retrabalho',
  interno: 'Retrabalho interno (falha nossa)',
  retorno_cliente: 'Retorno — item recusado pelo cliente',
};

// Config visual dos selos exibidos na lista/detalhe.
export const RETRABALHO_BADGE = {
  interno: { label: 'Retrabalho interno', className: 'bg-red-100 text-red-700 border-red-200' },
  retorno_cliente: { label: 'Retorno cliente', className: 'bg-amber-100 text-amber-700 border-amber-200' },
};

// Retorna o tipo efetivo, tratando o flag legado `retrabalho`.
export function tipoRetrabalho(os) {
  if (os?.tipo_retrabalho && os.tipo_retrabalho !== 'nenhum') return os.tipo_retrabalho;
  if (os?.retrabalho) return 'interno';
  return 'nenhum';
}