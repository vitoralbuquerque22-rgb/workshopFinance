import { Timer, Hammer } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

export default function PainelHoras({ horas }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-heading font-semibold text-sm mb-4">Horas & Produtividade (hoje)</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary shrink-0"><Timer className="w-5 h-5" /></span>
          <div>
            <p className="text-2xl font-bold font-heading">{horas.horasVendidas}h</p>
            <p className="text-xs text-muted-foreground">Horas vendidas</p>
            <p className="text-xs font-medium text-primary mt-0.5">{formatCurrency(horas.valorHorasVendidas)}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 shrink-0"><Hammer className="w-5 h-5" /></span>
          <div>
            <p className="text-2xl font-bold font-heading">{horas.horasProduzidas}h</p>
            <p className="text-xs text-muted-foreground">Horas produzidas</p>
            <p className="text-xs font-medium text-emerald-600 mt-0.5">{formatCurrency(horas.valorHorasProduzidas)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}