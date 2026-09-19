// Estoque disponível = atual - reservado (consignado não é próprio)
export const disponivel = (p) => (p.estoque_atual || 0) - (p.estoque_reservado || 0);

export const abaixoMinimo = (p) => disponivel(p) <= (p.estoque_minimo || 0);
export const precisaRepor = (p) => {
  const ref = (p.ponto_reposicao || 0) > 0 ? p.ponto_reposicao : p.estoque_minimo || 0;
  return disponivel(p) <= ref;
};

// Sugestão de compra: repõe até o máximo (ou até 2x o mínimo se sem máximo)
export const sugestaoCompra = (p) => {
  if (!precisaRepor(p)) return 0;
  const alvo = (p.estoque_maximo || 0) > 0 ? p.estoque_maximo : (p.estoque_minimo || 0) * 2;
  const qtd = alvo - disponivel(p);
  return qtd > 0 ? Math.ceil(qtd) : 0;
};

// Curva ABC por valor de consumo/estoque (Pareto 80/15/5)
export const calcularCurvaABC = (pecas) => {
  const comValor = pecas
    .map((p) => ({ id: p.id, valor: (p.estoque_atual || 0) * (p.valor_custo_medio || 0) }))
    .sort((a, b) => b.valor - a.valor);
  const total = comValor.reduce((s, x) => s + x.valor, 0);
  const mapa = {};
  let acumulado = 0;
  for (const item of comValor) {
    acumulado += item.valor;
    const pct = total > 0 ? acumulado / total : 0;
    mapa[item.id] = pct <= 0.8 ? 'A' : pct <= 0.95 ? 'B' : 'C';
  }
  return mapa;
};

export const curvaColor = {
  A: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  B: 'bg-amber-100 text-amber-700 border-amber-200',
  C: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const diasParaVencer = (dataValidade) => {
  if (!dataValidade) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const val = new Date(dataValidade);
  return Math.round((val - hoje) / 86400000);
};

export const tipoMovimentoLabel = {
  entrada: 'Entrada',
  saida: 'Saída',
  transferencia: 'Transferência',
  ajuste_inventario: 'Ajuste Inventário',
  reserva: 'Reserva',
  liberacao_reserva: 'Liberação Reserva',
};