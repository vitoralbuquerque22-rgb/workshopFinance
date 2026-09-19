import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { motivosPerda } from '@/lib/crmConfig';
import { TrendingUp, DollarSign, Clock, XCircle } from 'lucide-react';

const daysBetween = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));

export default function CrmDashboard({ leads }) {
  const stats = useMemo(() => {
    const ganhos = leads.filter((l) => l.etapa === 'ganho');
    const perdidos = leads.filter((l) => l.etapa === 'perdido');
    const fechados = ganhos.length + perdidos.length;
    const taxaAprovacao = fechados ? (ganhos.length / fechados) * 100 : 0;
    const ticketMedio = ganhos.length ? ganhos.reduce((s, l) => s + (l.valor_estimado || 0), 0) / ganhos.length : 0;

    const temposAprovacao = ganhos.filter((l) => l.data_ganho).map((l) => daysBetween(l.created_date, l.data_ganho));
    const tempoMedio = temposAprovacao.length ? temposAprovacao.reduce((a, b) => a + b, 0) / temposAprovacao.length : 0;

    const perdasPorMotivo = {};
    perdidos.forEach((l) => {
      const m = l.motivo_perda || 'outro';
      perdasPorMotivo[m] = (perdasPorMotivo[m] || 0) + 1;
    });

    const porConsultor = {};
    leads.forEach((l) => {
      const c = l.consultor || 'Sem consultor';
      if (!porConsultor[c]) porConsultor[c] = { total: 0, ganhos: 0, valor: 0 };
      porConsultor[c].total += 1;
      if (l.etapa === 'ganho') {
        porConsultor[c].ganhos += 1;
        porConsultor[c].valor += l.valor_estimado || 0;
      }
    });

    return { taxaAprovacao, ticketMedio, tempoMedio, perdasPorMotivo, porConsultor, totalGanhos: ganhos.length, totalPerdidos: perdidos.length };
  }, [leads]);

  const kpis = [
    { label: 'Taxa de Aprovação', value: `${stats.taxaAprovacao.toFixed(0)}%`, icon: TrendingUp, color: 'text-emerald-600' },
    { label: 'Ticket Médio', value: formatCurrency(stats.ticketMedio), icon: DollarSign, color: 'text-blue-600' },
    { label: 'Tempo Médio Aprovação', value: `${stats.tempoMedio.toFixed(0)} dias`, icon: Clock, color: 'text-amber-600' },
    { label: 'Perdas', value: stats.totalPerdidos, icon: XCircle, color: 'text-rose-600' },
  ];

  const consultores = Object.entries(stats.porConsultor).sort((a, b) => b[1].valor - a[1].valor);
  const perdas = Object.entries(stats.perdasPorMotivo).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <k.icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <p className="text-2xl font-bold mt-1">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Desempenho por Consultor</CardTitle></CardHeader>
          <CardContent>
            {consultores.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados.</p>
            ) : (
              <div className="space-y-2">
                {consultores.map(([nome, d]) => (
                  <div key={nome} className="flex items-center justify-between text-sm border-b pb-1.5 last:border-0">
                    <span className="font-medium">{nome}</span>
                    <span className="text-muted-foreground">{d.ganhos}/{d.total} • {formatCurrency(d.valor)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Motivos de Perda</CardTitle></CardHeader>
          <CardContent>
            {perdas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma perda registrada.</p>
            ) : (
              <div className="space-y-2">
                {perdas.map(([motivo, count]) => (
                  <div key={motivo} className="flex items-center justify-between text-sm border-b pb-1.5 last:border-0">
                    <span>{motivosPerda[motivo] || motivo}</span>
                    <span className="font-semibold text-rose-600">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}