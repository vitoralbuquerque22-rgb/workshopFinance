import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { corMargem } from '@/lib/custosOperacionais';

export default function CustosKPIs({ receita, custo, rentabilidade, margem }) {
  const cards = [
    { label: 'Receita', valor: formatCurrency(receita), icon: DollarSign, cls: 'text-blue-600' },
    { label: 'Custo operacional', valor: formatCurrency(custo), icon: TrendingDown, cls: 'text-red-600' },
    { label: 'Rentabilidade', valor: formatCurrency(rentabilidade), icon: TrendingUp, cls: rentabilidade >= 0 ? 'text-emerald-600' : 'text-red-600' },
    { label: 'Margem média', valor: `${(Number(margem) || 0).toFixed(1)}%`, icon: Percent, cls: corMargem(margem) },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((k) => (
        <Card key={k.label}>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className={`text-xl font-bold mt-1 ${k.label === 'Rentabilidade' || k.label === 'Margem média' ? k.cls : ''}`}>{k.valor}</p>
            </div>
            <k.icon className={`w-8 h-8 ${k.cls} opacity-80`} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}