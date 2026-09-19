// Motor de rateio (Fase 3) — o cérebro do corte.
// Lê os itens da OS + a regra de distribuição (Fase 2) e devolve "blocos por CNPJ".
// - Bloco de peças  → itens tipo 'peca'
// - Bloco de serviços → serviços, mão de obra e serviço composto
// - Desconto da OS é rateado proporcionalmente ao valor bruto de cada bloco.
// No modo "unico" os dois grupos caem no mesmo CNPJ e viram um único bloco.

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

function valorItem(item) {
  return Number(item?.valor_total) || 0;
}

// Classifica cada item em 'pecas' ou 'servicos'
function grupoDoItem(item) {
  return item?.tipo === 'peca' ? 'pecas' : 'servicos';
}

/**
 * Calcula os blocos de faturamento por CNPJ.
 * @param {object} os - Ordem de serviço (usa itens, valor_desconto, distribuicao_faturamento)
 * @param {Array} filiais - lista de Filial para resolver nome/cnpj do bloco (opcional)
 * @returns {{ modo, blocos: Array, total_bruto, total_desconto, total_liquido }}
 */
export function calcularRateio(os, filiais = []) {
  const itens = Array.isArray(os?.itens) ? os.itens : [];
  const dist = os?.distribuicao_faturamento || { modo: 'unico', cnpj_pecas: '', cnpj_servicos: '' };
  const modo = dist.modo === 'dividido' ? 'dividido' : 'unico';

  const infoFilial = (id) => {
    const f = filiais.find((x) => x.id === id);
    return { filial_id: id || '', nome: f?.nome || '', cnpj: f?.cnpj || '' };
  };

  // Agrupa itens por grupo (pecas/servicos)
  const grupos = { pecas: [], servicos: [] };
  itens.forEach((it) => { grupos[grupoDoItem(it)].push(it); });

  const brutoPecas = round2(grupos.pecas.reduce((s, i) => s + valorItem(i), 0));
  const brutoServicos = round2(grupos.servicos.reduce((s, i) => s + valorItem(i), 0));
  const totalBruto = round2(brutoPecas + brutoServicos);
  const totalDesconto = round2(os?.valor_desconto || 0);

  // Desconto proporcional ao peso de cada grupo no bruto
  const descontoDe = (bruto) => (totalBruto > 0 ? round2((bruto / totalBruto) * totalDesconto) : 0);

  const grupoBloco = (chave, itensGrupo, bruto, cnpjId) => {
    const desconto = descontoDe(bruto);
    return {
      chave,
      ...infoFilial(cnpjId),
      itens: itensGrupo,
      quantidade_itens: itensGrupo.length,
      valor_bruto: bruto,
      valor_desconto: desconto,
      valor_liquido: round2(bruto - desconto),
    };
  };

  let blocos;
  if (modo === 'unico') {
    const cnpj = dist.cnpj_pecas || dist.cnpj_servicos || '';
    const todos = [...grupos.pecas, ...grupos.servicos];
    blocos = [{
      chave: 'unico',
      ...infoFilial(cnpj),
      itens: todos,
      quantidade_itens: todos.length,
      valor_bruto: totalBruto,
      valor_desconto: totalDesconto,
      valor_liquido: round2(totalBruto - totalDesconto),
    }];
  } else {
    blocos = [
      grupoBloco('pecas', grupos.pecas, brutoPecas, dist.cnpj_pecas),
      grupoBloco('servicos', grupos.servicos, brutoServicos, dist.cnpj_servicos),
    ];
    // Ajuste de arredondamento: garante que a soma dos líquidos = total líquido
    const somaLiquido = round2(blocos.reduce((s, b) => s + b.valor_liquido, 0));
    const alvo = round2(totalBruto - totalDesconto);
    const dif = round2(alvo - somaLiquido);
    if (dif !== 0) {
      const maior = blocos.reduce((a, b) => (b.valor_bruto >= a.valor_bruto ? b : a), blocos[0]);
      maior.valor_liquido = round2(maior.valor_liquido + dif);
      maior.valor_desconto = round2(maior.valor_bruto - maior.valor_liquido);
    }
  }

  return {
    modo,
    blocos,
    total_bruto: totalBruto,
    total_desconto: totalDesconto,
    total_liquido: round2(totalBruto - totalDesconto),
  };
}

export const rotuloBloco = (chave) => {
  if (chave === 'pecas') return 'Peças';
  if (chave === 'servicos') return 'Serviços & Mão de Obra';
  return 'CNPJ único (peças + serviços)';
};