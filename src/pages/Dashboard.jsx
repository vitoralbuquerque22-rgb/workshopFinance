import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowDownCircle, ArrowUpCircle, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import KPICard from '@/components/KPICard';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatCompact, formatDate, monthNames } from '@/lib/format';

export default function Dashboard() {
  const [contasPagar, setContasPagar] = useState([]);
  const [contasReceber, setContasReceber] = useState([]);
  const [lancamentos, setLancamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pagar, receber, caixa] = await Promise.all([
        base44.entities.ContaPagar.list('-data_vencimento', 50),
        base44.entities.ContaReceber.list('-data_vencimento', 50),
        base44.entities.LancamentoCaixa.list('-data', 100),
      ]);
      setContasPagar(pagar);
      setContasReceber(receber);
      setLancamentos(caixa);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalPagar = contasPagar.filter(c => c.status === 'pendente').reduce((s, c) => s + (c.valor || 0), 0);
  const totalReceber = contasReceber.filter(c => c.status === 'pendente').reduce((s, c) => s + (c.valor || 0), 0);
  const saldoCaixa = lancamentos.reduce((s, l) => s + (l.tipo === 'entrada' ? (l.valor || 0) : -(l.valor || 0)), 0);

  const now = new Date();
  const mesAtual = now.getMonth();
  const anoAtual = now.getFullYear();
  const lancamentosMes = lancamentos.filter(l => {
    const d = new Date(l.data);
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  });
  const receitasMes = lancamentosMes.filter(l => l.tipo === 'entrada').reduce((s, l) => s + (l.valor || 0), 0);
  const despesasMes = lancamentosMes.filter(l => l.tipo === 'saida').reduce((s, l) => s + (l.valor || 0), 0);
  const resultadoMes = receitasMes - despesasMes;

  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(anoAtual, mesAtual - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const monthLanc = lancamentos.filter(l => {
      const ld = new Date(l.data);
      return ld.getMonth() === m && ld.getFullYear() === y;
    });
    chartData.push({
      month: monthNames[m],
      Entradas: monthLanc.filter(l => l.tipo === 'entrada').reduce((s, l) => s + (l.valor || 0), 0),
      Saídas: monthLanc.filter(l => l.tipo === 'saida').reduce((s, l) => s + (l.valor || 0), 0),
    });
  }

  const vencimentos = [
    ...contasPagar.filter(c => c.status === 'pendente').map(c => ({ ...c, tipo: 'pagar' })),
    ...contasReceber.filter(c => c.status === 'pendente').map(c => ({ ...c, tipo: 'receber' })),
  ].sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento)).slice(0, 6);

  return (
    <div>
      <PageHeader title="Dashboard" description="Visão geral financeira da sua oficina" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="A Pagar" value={formatCurrency(totalPagar)} icon={ArrowDownCircle} variant="danger" />
        <KPICard title="A Receber" value={formatCurrency(totalReceber)} icon={ArrowUpCircle} variant="success" />
        <KPICard title="Saldo em Caixa" value={formatCurrency(saldoCaixa)} icon={Wallet} variant="primary" />
        <KPICard
          title="Resultado do Mês"
          value={formatCurrency(resultadoMes)}
          icon={TrendingUp}
          variant={resultadoMes >= 0 ? 'success' : 'danger'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <h3 className="font-heading font-semibold text-sm mb-4">Entradas vs Saídas (6 meses)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompact(v)} />
              <Tooltip
                formatter={(v) => formatCurrency(v)}
                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Entradas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-heading font-semibold text-sm mb-4">Próximos Vencimentos</h3>
          <div className="space-y-3">
            {vencimentos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum vencimento pendente</p>
            ) : (
              vencimentos.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${
                      v.tipo === 'pagar' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {v.tipo === 'pagar' ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{v.descricao}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(v.data_vencimento)}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold shrink-0 ${v.tipo === 'pagar' ? 'text-red-600' : 'text-emerald-600'}`}>
                    {formatCurrency(v.valor)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-heading font-semibold text-sm mb-4">Resumo do Mês</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Receitas</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(receitasMes)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Despesas</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(despesasMes)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Resultado</p>
            <p className={`text-lg font-bold ${resultadoMes >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(resultadoMes)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Margem</p>
            <p className="text-lg font-bold text-foreground">
              {receitasMes > 0 ? ((resultadoMes / receitasMes) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}