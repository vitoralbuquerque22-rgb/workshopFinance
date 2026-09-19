import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

// Resumo financeiro da operação externa (receita x custo x rentabilidade).
export default function ResumoFinanceiroExterno({ dados }) {
  const rent = dados.receitaTotal - dados.custoTotal;
  const margem = dados.receitaTotal > 0 ? (rent / dados.receitaTotal) * 100 : 0;
  const custoPct = dados.receitaTotal > 0 ? Math.min(100, (dados.custoTotal / dados.receitaTotal) * 100) : 0;

  const linhas = [
    { label: 'Receita gerada', valor: formatCurrency(dados.receitaTotal), cls: 'text-blue-600' },
    { label: 'Custo operacional', valor: formatCurrency(dados.custoTotal), cls: 'text-red-600' },
    { label: 'Rentabilidade', valor: formatCurrency(rent), cls: rent >= 0 ? 'text-emerald-600' : 'text-red-600' },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Operação externa</CardTitle>
        <Link to="/custos" className="text-xs text-primary hover:underline flex items-center gap-1">Detalhes <ArrowRight className="w-3 h-3" /></Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {linhas.map((l) => (
          <div key={l.label} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{l.label}</span>
            <span className={`font-bold ${l.cls}`}>{l.valor}</span>
          </div>
        ))}
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Custo sobre receita</span>
            <span>Margem {margem.toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-red-400" style={{ width: `${custoPct}%` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}