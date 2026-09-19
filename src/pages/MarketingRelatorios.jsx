import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import MarketingNav from '@/components/marketing/MarketingNav';
import { loadMarketingData, metricasPorCampanha, PLATAFORMAS } from '@/lib/marketing';
import { formatCompact } from '@/lib/format';
import { Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

export default function MarketingRelatorios() {
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMarketingData().then((d) => { setRaw(d); setLoading(false); }); }, []);

  if (loading || !raw) {
    return (
      <div>
        <PageHeader title="Marketing & Growth" description="Relatórios de desempenho" />
        <MarketingNav />
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  const porCampanha = metricasPorCampanha(raw);

  // Receita por plataforma
  const porPlataforma = {};
  porCampanha.forEach((c) => {
    const p = c.campanha.plataforma;
    if (!porPlataforma[p]) porPlataforma[p] = { plataforma: PLATAFORMAS[p]?.label || p, receita: 0, investimento: 0, color: PLATAFORMAS[p]?.color };
    porPlataforma[p].receita += c.receita;
    porPlataforma[p].investimento += c.investimento;
  });
  const canais = Object.values(porPlataforma);

  const roiData = porCampanha
    .filter((c) => c.investimento > 0)
    .sort((a, b) => b.roi - a.roi)
    .slice(0, 8)
    .map((c) => ({ nome: c.campanha.nome, roi: Number(c.roi.toFixed(0)) }));

  return (
    <div>
      <PageHeader title="Marketing & Growth" description="Relatórios de desempenho por campanha e canal" />
      <MarketingNav />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Receita por Canal">
          {canais.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={canais}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="plataforma" fontSize={11} />
                <YAxis tickFormatter={formatCompact} fontSize={11} />
                <Tooltip formatter={(v) => formatCompact(v)} />
                <Bar dataKey="receita" radius={[4, 4, 0, 0]}>
                  {canais.map((c, i) => <Cell key={i} fill={c.color || '#6366F1'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Investimento por Canal">
          {canais.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={canais}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="plataforma" fontSize={11} />
                <YAxis tickFormatter={formatCompact} fontSize={11} />
                <Tooltip formatter={(v) => formatCompact(v)} />
                <Bar dataKey="investimento" radius={[4, 4, 0, 0]} fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="ROI por Campanha (%)" full>
          {roiData.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={roiData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" fontSize={11} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="nome" width={140} fontSize={11} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="roi" radius={[0, 4, 4, 0]}>
                  {roiData.map((c, i) => <Cell key={i} fill={c.roi >= 0 ? '#10B981' : '#EF4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children, full }) {
  return (
    <div className={`bg-card border border-border rounded-xl p-5 ${full ? 'lg:col-span-2' : ''}`}>
      <h3 className="font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground py-16 text-center">Sem dados de campanhas ainda.</p>;
}