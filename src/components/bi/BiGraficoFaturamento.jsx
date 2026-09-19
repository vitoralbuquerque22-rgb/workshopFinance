import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency, formatCompact } from '@/lib/format';

export default function BiGraficoFaturamento({ data }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-heading font-semibold text-sm mb-4">Faturamento & Lucro (6 meses)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompact(v)} />
          <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="Faturamento" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Custo" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
          <Line type="monotone" dataKey="Lucro" stroke="hsl(var(--chart-2))" strokeWidth={2.5} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}