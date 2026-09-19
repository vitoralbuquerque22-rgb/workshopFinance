// Calcula o retorno (rentabilidade) da OS:
// margem = valor de venda total - custo total (margem da peça + mão de obra)
// retorno % = margem / valor de venda total
// >= 70% considerado saudável (verde), abaixo disso alerta (vermelho)
export const LIMITE_SAUDAVEL = 70;

export function calcularRentabilidade(os) {
  const venda = os?.valor_total || 0;
  const custo = os?.custo_total || 0;
  if (venda <= 0) return { percentual: null, saudavel: false };
  const percentual = ((venda - custo) / venda) * 100;
  return { percentual, saudavel: percentual >= LIMITE_SAUDAVEL };
}