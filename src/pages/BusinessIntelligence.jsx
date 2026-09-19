import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import BiFiltros from '@/components/bi/BiFiltros';
import BiKPIs from '@/components/bi/BiKPIs';
import BiMeta from '@/components/bi/BiMeta';
import BiGraficoFaturamento from '@/components/bi/BiGraficoFaturamento';
import BiFunil from '@/components/bi/BiFunil';
import BiRankingTabela from '@/components/bi/BiRankingTabela';
import {
  rangePeriodo, kpisExecutivos, faturamentoMensal, rankingTecnicos,
  rankingConsultores, topClientes, funilComercial, comparativoPeriodo,
} from '@/lib/bi';
import { formatCurrency } from '@/lib/format';

const META_KEY = 'bi_meta_mensal';

export default function BusinessIntelligence() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState('30');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [meta, setMeta] = useState(() => Number(localStorage.getItem(META_KEY)) || 50000);

  useEffect(() => {
    (async () => {
      const [ordens, contasReceber, contasPagar, leads, pecas, clientes] = await Promise.all([
        base44.entities.OrdemServico.list('-created_date', 1000),
        base44.entities.ContaReceber.list('-created_date', 1000),
        base44.entities.ContaPagar.list('-created_date', 1000),
        base44.entities.Lead.list('-created_date', 1000),
        base44.entities.Peca.list('-created_date', 2000),
        base44.entities.Cliente.list('-created_date', 2000),
      ]);
      setDados({ ordens, contasReceber, contasPagar, leads, pecas, clientes });
      setLoading(false);
    })();
  }, []);

  const salvarMeta = (v) => { setMeta(v); localStorage.setItem(META_KEY, String(v)); };

  if (loading || !dados) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const dias = preset === 'custom' ? null : Number(preset);
  const range = rangePeriodo(dias, dataInicio, dataFim);

  const kpis = kpisExecutivos(dados, range);
  const comp = comparativoPeriodo(dados, range);
  const grafico = faturamentoMensal(dados.ordens, 6);
  const tecnicos = rankingTecnicos(dados.ordens, range);
  const consultores = rankingConsultores(dados.ordens, range);
  const clientesTop = topClientes(dados.ordens, dados.clientes, range);
  const funil = funilComercial(dados.leads, range);

  // Faturamento do mês corrente para a meta
  const now = new Date();
  const rangeMes = rangePeriodo(null,
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10));
  const faturamentoMes = kpisExecutivos(dados, rangeMes).faturamento;

  const exportarCSV = () => {
    const linhas = [
      ['Indicador', 'Valor'],
      ['Faturamento', kpis.faturamento.toFixed(2)],
      ['Lucro', kpis.lucro.toFixed(2)],
      ['CMV', kpis.cmv.toFixed(2)],
      ['Markup (%)', kpis.markup.toFixed(1)],
      ['Margem (%)', kpis.margem.toFixed(1)],
      ['Ticket Médio', kpis.ticketMedio.toFixed(2)],
      ['Conversão OS (%)', kpis.conversao.toFixed(1)],
      ['OS Concluídas', kpis.osConcluidas],
      ['OS Abertas', kpis.osAbertas],
      ['OS Atrasadas', kpis.osAtrasadas],
      ['Peças Vendidas', kpis.valorPecas.toFixed(2)],
      ['Serviços Vendidos', kpis.valorServicos.toFixed(2)],
      ['Valor em Estoque', kpis.valorEstoque.toFixed(2)],
      ['A Receber', kpis.aReceber.toFixed(2)],
      ['A Pagar', kpis.aPagar.toFixed(2)],
      ['Saldo Financeiro', kpis.saldoFinanceiro.toFixed(2)],
      ['Clientes Ativos', kpis.clientesAtivos],
      ['Leads', kpis.leadsTotal],
      ['Leads Ganhos', kpis.leadsGanhos],
      ['Conversão Leads (%)', kpis.conversaoLeads.toFixed(1)],
      [],
      ['Técnico', 'OS', 'Faturamento', 'Lucro'],
      ...tecnicos.map((t) => [t.nome, t.os, t.faturamento.toFixed(2), t.lucro.toFixed(2)]),
      [],
      ['Consultor', 'OS', 'Faturamento', 'Conversão (%)'],
      ...consultores.map((c) => [c.nome, c.os, c.faturamento.toFixed(2), c.conversao]),
    ];
    const csv = linhas.map((l) => l.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bi-dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Business Intelligence" description="Dashboard executivo — desempenho consolidado da oficina" />

      <BiFiltros
        preset={preset} onPreset={setPreset}
        dataInicio={dataInicio} dataFim={dataFim}
        onDataInicio={setDataInicio} onDataFim={setDataFim}
        onExportar={exportarCSV}
      />

      <BiKPIs kpis={kpis} comp={comp} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><BiGraficoFaturamento data={grafico} /></div>
        <BiMeta meta={meta} onSalvar={salvarMeta} faturamentoMes={faturamentoMes} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BiRankingTabela
          titulo="Ranking de Técnicos"
          dados={tecnicos}
          colunas={[
            { key: 'nome', label: 'Técnico', strong: true },
            { key: 'os', label: 'OS', align: 'right' },
            { key: 'faturamento', label: 'Faturamento', align: 'right', currency: true },
            { key: 'lucro', label: 'Lucro', align: 'right', currency: true },
          ]}
        />
        <BiRankingTabela
          titulo="Ranking de Consultores"
          dados={consultores}
          colunas={[
            { key: 'nome', label: 'Consultor', strong: true },
            { key: 'os', label: 'OS', align: 'right' },
            { key: 'faturamento', label: 'Faturamento', align: 'right', currency: true },
            { key: 'conversao', label: 'Conversão', align: 'right', suffix: '%' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BiRankingTabela
            titulo="Top Clientes"
            dados={clientesTop}
            colunas={[
              { key: 'nome', label: 'Cliente', strong: true },
              { key: 'os', label: 'OS', align: 'right' },
              { key: 'faturamento', label: 'Faturamento', align: 'right', currency: true },
            ]}
          />
        </div>
        <BiFunil funil={funil} />
      </div>
    </div>
  );
}