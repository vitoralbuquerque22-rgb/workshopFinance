import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/format';

// Calcula o valor do desconto em reais a partir do modo (valor fixo ou %) e do bruto.
export function calcularDesconto({ modo = 'valor', valor = 0, bruto = 0 }) {
  const v = Number(valor) || 0;
  if (modo === 'percentual') return Math.min(bruto, Math.round((bruto * v / 100) * 100) / 100);
  return Math.min(bruto, Math.round(v * 100) / 100);
}

// Campo de desconto reutilizável — funciona em qualquer etapa (OS, finalização).
// value = { modo, valor } ; bruto = subtotal antes do desconto.
export default function DescontoField({ value, onChange, bruto = 0 }) {
  const desc = { modo: 'valor', valor: 0, ...(value || {}) };
  const set = (campo, v) => onChange({ ...desc, [campo]: v });
  const descontoReais = calcularDesconto({ ...desc, bruto });
  const liquido = Math.max(0, bruto - descontoReais);

  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <div className="grid grid-cols-[1fr_1.4fr] gap-3 items-end">
        <div>
          <Label>Tipo de Desconto</Label>
          <Select value={desc.modo} onValueChange={(v) => set('modo', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="valor">Valor (R$)</SelectItem>
              <SelectItem value="percentual">Percentual (%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{desc.modo === 'percentual' ? 'Desconto (%)' : 'Desconto (R$)'}</Label>
          <Input
            type="number" min={0} step="0.01"
            value={desc.valor}
            onChange={(e) => set('valor', parseFloat(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
      </div>
      <div className="flex items-center justify-between text-sm pt-1">
        <span className="text-muted-foreground">Subtotal <strong className="text-foreground">{formatCurrency(bruto)}</strong></span>
        {descontoReais > 0 && <span className="text-destructive">− {formatCurrency(descontoReais)}</span>}
        <span className="text-muted-foreground">Total <strong className="text-primary">{formatCurrency(liquido)}</strong></span>
      </div>
    </div>
  );
}