import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import MarketingNav from '@/components/marketing/MarketingNav';
import KPICard from '@/components/KPICard';
import { loadMarketingData, calcularMetricas, leadsPorOrigem, metricasPorCampanha } from '@/lib/marketing';
import { formatCurrency, formatCompact } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DollarSign, Users, Target, TrendingUp, Percent, ShoppingCart,
  Wallet, Gauge, Loader2, Award, Clock,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function Marketing() {
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ inicio: '', fim: '' });

  useEffect(() => {
    loadMarketingData().then((d) => { setRaw(d); setLoading(false); });
  }, []);

  if (loading || !raw) {
    return (
      <div>
        <PageHeader title="Marketing & Growth" description="Aquisição, conversão e ROI em um só lugar" />
        <MarketingNav />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const m = calcularMetricas(raw, filtros);
  const origens = leadsPorOrigem(m.leadsFiltrados);
  const porCampanha = metricasPorCampanha(raw).sort((a, b) => b.receita - a.receita).slice(0, 5);

  return (
    <div>
      <PageHeader title="Marketing & Growth" description="Aquisição, conversão e ROI em um só lugar" />
      <MarketingNav />

      <div className="flex flex-wrap items-end gap-3 mb-6 p-4 bg-card border border-border rounded-xl">
        <div>
          <Label className="text-xs">De</Label>
          <Input type="date" value={filtros.inicio} onChange={(e) => setFiltros({ ...filtros, inicio: e.target.value })} className="w-40" />
        </div>
        <div>
          <Label className="text-xs">Até</Label>
          <Input type="date" value={filtros.fim} onChange={(e) => setFiltros({ ...filtros, fim: e.target.value })} className="w-40" />
        </div>
      </div>

      {/* Financeiro / ROI */}
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Retorno sobre Investimento</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Investimento Total" value={formatCurrency(m.investimentoTotal)} icon={DollarSign} />
        <KPICard title="Receita" value={formatCompact(m.valorVendido)} icon={Wallet} variant="primary" />
        <KPICard title="ROI" value={`${m.roi.toFixed(0)}%`} icon={TrendingUp} variant="success" />
        <KPICard title="ROAS" value={`${m.roas.toFixed(1)}x`} icon={Gauge} variant="success" />
      </div>

      {/* Leads */}
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Geração de Leads</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Leads Gerados" value={m.leadsGerados} icon={Users} />
        <KPICard title="Convertidos" value={m.leadsConvertidos} icon={Target} />
        <KPICard title="Taxa de Conversão" value={`${m.taxaConversao.toFixed(1)}%`} icon={Percent} />
        <KPICard title="Custo por Lead" value={formatCurrency(m.cpl)} icon={DollarSign} />
      </div>

      {/* Comercial + Financeiro */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard title="OS Abertas" value={m.osAbertas} icon={ShoppingCart} />
        <KPICard title="Ticket Médio" value={formatCurrency(m.ticketMedio)} icon={Award} />
        <KPICard title="CAC" value={formatCurrency(m.cac)} icon={DollarSign} />
        <KPICard title="LTV" value={formatCurrency(m.ltv)} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads por origem */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Leads por Origem</h3>
          {origens.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Sem leads no período.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={origens} dataKey="quantidade" nameKey="origem" cx="50%" cy="50%" outerRadius={90} label>
                  {origens.map((o, i) => <Cell key={i} fill={o.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top campanhas por receita */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4">Top Campanhas por Receita</h3>
          {porCampanha.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Nenhuma campanha cadastrada.</p>
          ) : (
            <div className="space-y-3">
              {porCampanha.map((c) => (
                <div key={c.campanha.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{c.campanha.nome}</p>
                    <p className="text-xs text-muted-foreground">{c.leads} leads · {c.clientes} clientes · ROI {c.roi.toFixed(0)}%</p>
                  </div>
                  <span className="font-semibold text-emerald-600">{formatCompact(c.receita)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" /> Tempo médio até 1º atendimento: {m.tempoMedioAtend > 0 ? `${m.tempoMedioAtend.toFixed(1)}h` : '—'}
      </p>
    </div>
  );
}