import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Target, Pencil, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

// Meta mensal de faturamento, persistida em localStorage
export default function BiMeta({ meta, onSalvar, faturamentoMes }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(meta);

  const pct = meta > 0 ? Math.min(100, Math.round((faturamentoMes / meta) * 100)) : 0;
  const falta = Math.max(0, meta - faturamentoMes);

  const salvar = () => { onSalvar(Number(valor) || 0); setEditando(false); };

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-sm flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" /> Meta do Mês
        </h3>
        {editando ? (
          <button onClick={salvar} className="text-primary"><Check className="w-4 h-4" /></button>
        ) : (
          <button onClick={() => { setValor(meta); setEditando(true); }} className="text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
        )}
      </div>

      {editando ? (
        <Input type="number" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Meta em R$" className="mb-3" autoFocus />
      ) : (
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl font-bold font-heading">{formatCurrency(faturamentoMes)}</span>
          <span className="text-sm text-muted-foreground">de {formatCurrency(meta)}</span>
        </div>
      )}

      <Progress value={pct} className="h-2.5 mb-2" />
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold ${pct >= 100 ? 'text-emerald-600' : 'text-primary'}`}>{pct}% atingido</span>
        <span className="text-muted-foreground">{falta > 0 ? `Faltam ${formatCurrency(falta)}` : 'Meta batida! 🎉'}</span>
      </div>
    </div>
  );
}