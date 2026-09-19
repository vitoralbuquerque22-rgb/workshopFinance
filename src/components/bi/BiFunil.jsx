import { formatCurrency } from '@/lib/format';

const CORES = ['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-emerald-500', 'bg-red-400'];

export default function BiFunil({ funil }) {
  const max = Math.max(1, ...funil.map((f) => f.quantidade));
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-heading font-semibold text-sm mb-4">Funil Comercial</h3>
      <div className="space-y-3">
        {funil.every((f) => f.quantidade === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-8">Sem leads no período</p>
        ) : (
          funil.map((f, i) => (
            <div key={f.etapa}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium">{f.etapa}</span>
                <span className="text-muted-foreground">{f.quantidade} · {formatCurrency(f.valor)}</span>
              </div>
              <div className="h-6 rounded-md bg-muted overflow-hidden">
                <div className={`h-full ${CORES[i % CORES.length]} rounded-md transition-all flex items-center px-2`} style={{ width: `${Math.max(6, (f.quantidade / max) * 100)}%` }}>
                  <span className="text-[11px] font-semibold text-white">{f.quantidade}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}