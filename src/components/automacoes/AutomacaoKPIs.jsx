import { Card, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle2, XCircle, Ban, TrendingUp } from 'lucide-react';

// Cartões de resumo da operação automática (Fase 8).
export default function AutomacaoKPIs({ pendentes, enviadas, falhas, canceladas, taxaEntrega }) {
  const cards = [
    { label: 'Agendadas (pendentes)', valor: pendentes, icon: Clock, cor: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Enviadas', valor: enviadas, icon: CheckCircle2, cor: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Falharam', valor: falhas, icon: XCircle, cor: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Canceladas', valor: canceladas, icon: Ban, cor: 'text-slate-500', bg: 'bg-slate-100' },
    { label: 'Taxa de entrega', valor: `${taxaEntrega}%`, icon: TrendingUp, cor: 'text-primary', bg: 'bg-primary/10' },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4">
            <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${c.bg} mb-2`}>
              <c.icon className={`w-4 h-4 ${c.cor}`} />
            </div>
            <p className="text-2xl font-bold">{c.valor}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}