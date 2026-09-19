import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import PageHeader from '@/components/PageHeader';
import { formatCurrency, formatCompact, monthNamesFull } from '@/lib/format';

const dreGroups = [
  { key: 'receita_bruta', label: 'Receita Bruta de Vendas', type: 'positive' },
  { key: 'deducoes', label: '(-) Deduções', type: 'negative' },
  { key: 'custo_mercadorias', label: '(-) Custo de Mercadorias Vendidas', type: 'negative' },
  { key: 'despesas_operacionais', label: '(-) Despesas Operacionais', type: 'negative' },
  { key: 'despesas_administrativas', label: '(-) Despesas Administrativas', type: 'negative' },
  { key: 'despesas_comerciais', label: '(-) Despesas Comerciais', type: 'negative' },
  { key: 'resultado_financeiro', label: '(+/-) Resultado Financeiro', type: 'both' },
];

const dfcGroups = [
  { key: 'operacional', label: 'Fluxo de Caixa Operacional' },
  { key: 'investimento', label: 'Fluxo de Caixa de Investimento' },
  { key: 'financiamento', label: 'Fluxo de Caixa de Financiamento' },
];

export default function DRE() {
  const [movimentos, setMovimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [mes, setMes] = useState((now.getMonth() + 1).toString());
  const [ano, setAno] = useState(now.getFullYear().toString());

  useEffect(() => { loadMovimentos(); }, []);

  const loadMovimentos = async () => {
    try {
      const data = await base44.entities.MovimentoFinanceiro.list('-data', 500);
      setMovimentos(data);
    } finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const periodMovs = movimentos.filter(m => {
    const d = new Date(m.data);
    return (d.getMonth() + 1).toString() === mes && d.getFullYear().toString() === ano;
  });

  const getGroupTotal = (grupo) => {
    return periodMovs
      .filter(m => m.dre_grupo === grupo)
      .reduce((s, m) => s + (m.tipo === 'receita' ? (m.valor || 0) : -(m.valor || 0)), 0);
  };

  const receitaBruta = getGroupTotal('receita_bruta');
  const deducoes = getGroupTotal('deducoes');
  const receitaLiquida = receitaBruta + deducoes;
  const cmv = getGroupTotal('custo_mercadorias');
  const lucroBruto = receitaLiquida + cmv;
  const despOper = getGroupTotal('despesas_operacionais');
  const despAdmin = getGroupTotal('despesas_administrativas');
  const despComerc = getGroupTotal('despesas_comerciais');
  const resultadoOp = lucroBruto + despOper + despAdmin + despComerc;
  const resultadoFin = getGroupTotal('resultado_financeiro');
  const lucroLiquido = resultadoOp + resultadoFin;

  const dreRows = [
    { label: 'Receita Bruta de Vendas', value: receitaBruta, bold: false },
    { label: '(-) Deduções', value: deducoes, bold: false },
    { label: '= Receita Líquida', value: receitaLiquida, bold: true, subtotal: true },
    { label: '(-) Custo de Mercadorias Vendidas', value: cmv, bold: false },
    { label: '= Lucro Bruto', value: lucroBruto, bold: true, subtotal: true },
    { label: '(-) Despesas Operacionais', value: despOper, bold: false },
    { label: '(-) Despesas Administrativas', value: despAdmin, bold: false },
    { label: '(-) Despesas Comerciais', value: despComerc, bold: false },
    { label: '= Resultado Operacional', value: resultadoOp, bold: true, subtotal: true },
    { label: '(+/-) Resultado Financeiro', value: resultadoFin, bold: false },
    { label: '= Lucro Líquido do Exercício', value: lucroLiquido, bold: true, total: true },
  ];

  // DFC
  const getDfcTotal = (grupo) => {
    return periodMovs
      .filter(m => m.dfc_grupo === grupo)
      .reduce((s, m) => s + (m.tipo === 'receita' ? (m.valor || 0) : -(m.valor || 0)), 0);
  };

  const dfcOper = getDfcTotal('operacional');
  const dfcInv = getDfcTotal('investimento');
  const dfcFin = getDfcTotal('financiamento');
  const variacaoCaixa = dfcOper + dfcInv + dfcFin;

  const dfcRows = [
    { label: 'Fluxo de Caixa das Atividades Operacionais', value: dfcOper },
    { label: 'Fluxo de Caixa das Atividades de Investimento', value: dfcInv },
    { label: 'Fluxo de Caixa das Atividades de Financiamento', value: dfcFin },
    { label: 'Variação Líquida de Caixa', value: variacaoCaixa, total: true },
  ];

  const chartData = dreGroups
    .map(g => ({ name: g.label.replace(/\(-\)|\(\+\/-\)/g, '').trim().substring(0, 20), value: getGroupTotal(g.key) }))
    .filter(d => d.value !== 0);

  return (
    <div>
      <PageHeader title="DRE & DFC" description="Demonstrações financeiras do período" />

      <div className="flex items-center gap-3 mb-6">
        <Select value={mes} onValueChange={setMes}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {monthNamesFull.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={ano} onValueChange={setAno}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2].map(y => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="dre">
        <TabsList className="mb-4">
          <TabsTrigger value="dre">DRE</TabsTrigger>
          <TabsTrigger value="dfc">DFC</TabsTrigger>
          <TabsTrigger value="grafico">Gráfico</TabsTrigger>
        </TabsList>

        <TabsContent value="dre">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-heading font-semibold">Demonstração de Resultado do Exercício</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{monthNamesFull[parseInt(mes) - 1]} / {ano}</p>
            </div>
            <div className="divide-y divide-border">
              {dreRows.map((row, i) => (
                <div key={i} className={`flex items-center justify-between px-5 py-3 ${
                  row.total ? 'bg-primary/5' : row.subtotal ? 'bg-muted/50' : ''
                }`}>
                  <span className={`text-sm ${row.bold ? 'font-semibold' : 'font-medium'} ${row.total ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {row.label}
                  </span>
                  <span className={`text-sm font-semibold ${row.total ? 'text-primary text-base' : row.value < 0 ? 'text-red-600' : 'text-foreground'}`}>
                    {formatCurrency(row.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="dfc">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-heading font-semibold">Demonstração de Fluxo de Caixa</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{monthNamesFull[parseInt(mes) - 1]} / {ano}</p>
            </div>
            <div className="divide-y divide-border">
              {dfcRows.map((row, i) => (
                <div key={i} className={`flex items-center justify-between px-5 py-3 ${row.total ? 'bg-primary/5' : ''}`}>
                  <span className={`text-sm ${row.total ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}`}>
                    {row.label}
                  </span>
                  <span className={`text-sm font-semibold ${row.total ? 'text-primary text-base' : row.value < 0 ? 'text-red-600' : 'text-foreground'}`}>
                    {formatCurrency(row.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="grafico">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-heading font-semibold text-sm mb-4">Composição do Resultado</h3>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Sem dados para o período selecionado</p>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompact(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.value < 0 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}