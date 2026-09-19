// Cálculos e helpers do módulo de Compras

export const somaProposta = (proposta) => {
  const subtotal = (proposta.itens || []).reduce(
    (s, i) => s + (i.disponivel === false ? 0 : (i.quantidade || 0) * (i.valor_unitario || 0)),
    0
  );
  const total = subtotal + (proposta.frete || 0);
  return { subtotal, total };
};

// Melhor proposta considerando total (produtos + frete). Empate → menor prazo.
export const melhorProposta = (propostas = []) => {
  const validas = propostas.filter((p) => (p.itens || []).length > 0);
  if (validas.length === 0) return null;
  return validas.reduce((best, p) => {
    const t = somaProposta(p).total;
    const bt = somaProposta(best).total;
    if (t < bt) return p;
    if (t === bt && (p.prazo_entrega_dias || 0) < (best.prazo_entrega_dias || 0)) return p;
    return best;
  });
};

export const backorderItens = (pedido) =>
  (pedido.itens || [])
    .map((i) => ({ ...i, pendente: (i.quantidade || 0) - (i.quantidade_recebida || 0) }))
    .filter((i) => i.pendente > 0.0001);

export const totalRecebido = (pedido) =>
  (pedido.itens || []).reduce((s, i) => s + (i.quantidade_recebida || 0), 0);

export const totalPedido = (pedido) =>
  (pedido.itens || []).reduce((s, i) => s + (i.quantidade || 0), 0);

export const prioridadeConfig = {
  baixa: { label: 'Baixa', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  media: { label: 'Média', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  alta: { label: 'Alta', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  urgente: { label: 'Urgente', className: 'bg-red-50 text-red-700 border-red-200' },
};

export const fluxoCompras = [
  'Solicitação', 'Cotação', 'Aprovação', 'Pedido', 'Recebimento', 'Nota Fiscal', 'Estoque', 'Financeiro',
];