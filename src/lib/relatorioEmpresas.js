// Monta o relatório de faturamento (notas fiscais de saída) e recebimento
// (contas a receber baixadas) agregados por empresa/CNPJ (Filial), dentro de um período.

const num = (v) => Number(v) || 0;
const soNumeros = (s) => String(s || '').replace(/\D/g, '');

// Retorna true se a data (string YYYY-MM-DD) está dentro do intervalo [inicio, fim] inclusive.
function dentroPeriodo(dataStr, inicio, fim) {
  if (!dataStr) return false;
  const d = String(dataStr).slice(0, 10);
  return d >= inicio && d <= fim;
}

export function montarRelatorioEmpresas({ filiais, notas, recebiveis }, { inicio, fim }) {
  // Índice de filiais por CNPJ (só dígitos) para casar as notas de saída
  const filialPorCnpj = {};
  for (const f of filiais) {
    const cnpj = soNumeros(f.cnpj);
    if (cnpj) filialPorCnpj[cnpj] = f;
  }

  // Inicializa acumuladores por filial
  const linhas = {};
  const garantirLinha = (filial) => {
    const id = filial?.id || 'sem_cnpj';
    if (!linhas[id]) {
      linhas[id] = {
        filial_id: filial?.id || null,
        nome: filial?.nome || 'Sem CNPJ vinculado',
        cnpj: filial?.cnpj || '',
        tipo: filial?.tipo || '',
        faturado: 0,
        faturado_produtos: 0,
        faturado_servicos: 0,
        qtd_notas: 0,
        recebido: 0,
        qtd_recebimentos: 0,
        a_receber: 0,
        qtd_a_receber: 0,
      };
    }
    return linhas[id];
  };
  // Garante uma linha para cada filial mesmo sem movimento, para visão completa
  for (const f of filiais) garantirLinha(f);

  // FATURAMENTO: notas fiscais de saída autorizadas, casadas por CNPJ do emitente
  for (const nf of notas) {
    if (nf.tipo !== 'saida') continue;
    if (nf.status === 'cancelada' || nf.status === 'erro' || nf.status === 'duplicada') continue;
    if (!dentroPeriodo(nf.data_emissao, inicio, fim)) continue;
    const filial = filialPorCnpj[soNumeros(nf.emitente_cnpj)];
    const linha = garantirLinha(filial);
    linha.faturado += num(nf.valor_total);
    linha.faturado_produtos += num(nf.valor_produtos);
    linha.faturado_servicos += num(nf.valor_servicos);
    linha.qtd_notas += 1;
  }

  // RECEBIMENTO e SALDO A RECEBER: percorre as contas a receber vinculadas à filial.
  // - Recebido: contas baixadas (status 'recebido') pela data de recebimento no período.
  // - A receber: contas ainda pendentes pela data de vencimento no período.
  // Contas canceladas são ignoradas. Saldo a receber = pendentes reais (não faturado - recebido),
  // pois faturamento e recebimento podem cair em meses diferentes.
  for (const cr of recebiveis) {
    if (cr.status === 'cancelado') continue;
    if (cr.status === 'recebido') {
      const dataRef = cr.data_recebimento || cr.data_vencimento;
      if (!dentroPeriodo(dataRef, inicio, fim)) continue;
      const filial = cr.filial_id ? filiais.find((f) => f.id === cr.filial_id) : null;
      const linha = garantirLinha(filial);
      linha.recebido += num(cr.valor);
      linha.qtd_recebimentos += 1;
    } else if (cr.status === 'pendente') {
      if (!dentroPeriodo(cr.data_vencimento, inicio, fim)) continue;
      const filial = cr.filial_id ? filiais.find((f) => f.id === cr.filial_id) : null;
      const linha = garantirLinha(filial);
      linha.a_receber += num(cr.valor);
      linha.qtd_a_receber += 1;
    }
  }

  const linhasArr = Object.values(linhas)
    .map((l) => ({ ...l, a_receber: Math.round(l.a_receber * 100) / 100 }))
    .sort((a, b) => b.faturado - a.faturado);

  const totais = linhasArr.reduce(
    (acc, l) => ({
      faturado: acc.faturado + l.faturado,
      recebido: acc.recebido + l.recebido,
      a_receber: acc.a_receber + l.a_receber,
      qtd_notas: acc.qtd_notas + l.qtd_notas,
      qtd_recebimentos: acc.qtd_recebimentos + l.qtd_recebimentos,
    }),
    { faturado: 0, recebido: 0, a_receber: 0, qtd_notas: 0, qtd_recebimentos: 0 }
  );
  totais.a_receber = Math.round(totais.a_receber * 100) / 100;

  return { linhas: linhasArr, totais };
}