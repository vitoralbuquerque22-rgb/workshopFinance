import { formatCurrency } from '@/lib/format';

// colunas: [{ key, label, format }]
export default function BiRankingTabela({ titulo, dados, colunas, vazio = 'Sem dados no período' }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-heading font-semibold text-sm mb-4">{titulo}</h3>
      {dados.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">{vazio}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 font-medium text-muted-foreground text-xs w-8">#</th>
                {colunas.map((c) => (
                  <th key={c.key} className={`pb-2 font-medium text-muted-foreground text-xs ${c.align === 'right' ? 'text-right' : ''}`}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dados.map((row, i) => (
                <tr key={row.id || row.nome || i} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 text-muted-foreground text-xs">{i + 1}</td>
                  {colunas.map((c) => (
                    <td key={c.key} className={`py-2.5 ${c.align === 'right' ? 'text-right font-medium tabular-nums' : ''} ${c.strong ? 'font-medium' : ''}`}>
                      {c.currency ? formatCurrency(row[c.key]) : c.suffix ? `${row[c.key]}${c.suffix}` : row[c.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}