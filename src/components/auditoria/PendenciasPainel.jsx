import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

// Lista de pendências abertas na conferência.
export default function PendenciasPainel({ pendencias, onChange, readOnly }) {
  const [nova, setNova] = useState('');

  const adicionar = () => {
    if (!nova.trim()) return;
    onChange([...(pendencias || []), { descricao: nova.trim(), resolvida: false, criada_em: new Date().toISOString() }]);
    setNova('');
  };
  const toggle = (i) => onChange(pendencias.map((p, idx) => (idx === i ? { ...p, resolvida: !p.resolvida } : p)));
  const remover = (i) => onChange(pendencias.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      {(pendencias || []).length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma pendência registrada.</p>
      )}
      {(pendencias || []).map((p, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
          <Checkbox checked={p.resolvida} onCheckedChange={() => !readOnly && toggle(i)} disabled={readOnly} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${p.resolvida ? 'line-through text-muted-foreground' : ''}`}>{p.descricao}</p>
          </div>
          {!p.resolvida && !readOnly && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
          {!readOnly && <Button variant="ghost" size="icon" onClick={() => remover(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
        </div>
      ))}
      {!readOnly && (
        <div className="flex gap-2">
          <Input value={nova} onChange={(e) => setNova(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && adicionar()} placeholder="Descreva a pendência..." />
          <Button variant="outline" onClick={adicionar}><Plus className="w-4 h-4" /></Button>
        </div>
      )}
    </div>
  );
}