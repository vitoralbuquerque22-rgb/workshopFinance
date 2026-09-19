import { DollarSign, TrendingUp, Target, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

export default function PainelFinanceiro({ fin }) {
  const items = [
    { label: 'Faturamento do dia', value: formatCurrency(fin.faturamentoDia), icon: DollarSign, cls: 'text-primary bg-primary/10' },
    { label: 'Lucro realizado', value: formatCurrency(fin.lucroRealizado), icon: TrendingUp, cls: 'text-emerald-600 bg-emerald-50' },
    { label: 'Lucro previsto (backlog)', value: formatCurrency(fin.lucroPrevisto), icon: Target, cls: 'text-blue-600 bg-blue-50' },
    { label: 'Fluxo de caixa do dia', value: formatCurrency(fin.caixaSaldo), icon: Wallet, cls: fin.caixaSaldo >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50', extra: `+${formatCurrency(fin.caixaEntradas)} / -${formatCurrency(fin.caixaSaidas)}` },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map(({ label, value, icon: Icon, cls, extra }) => (
        <div key={label} className="bg-card rounded-xl border border-border p-4 card-hover">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${cls}`}><Icon className="w-4 h-4" /></span>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
          </div>
          <p className="text-xl font-bold font-heading">{value}</p>
          {extra && <p className="text-[11px] text-muted-foreground mt-1">{extra}</p>}
        </div>
      ))}
    </div>
  );
}