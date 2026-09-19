import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, GripVertical } from 'lucide-react';
import { MOMENTOS, CANAIS_COBRANCA, rotuloPasso } from '@/lib/cobranca';

export default function PassoCobrancaCard({ passo, onChange, onRemove }) {
  const set = (campo, valor) => onChange({ ...passo, [campo]: valor });

  return (
    <div className={`rounded-lg border p-3 space-y-3 ${passo.ativo === false ? 'opacity-60 bg-muted/30' : 'bg-card'}`}>
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium flex-1">{rotuloPasso(passo)}</span>
        <Switch checked={passo.ativo !== false} onCheckedChange={(v) => set('ativo', v)} />
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onRemove}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Select value={passo.momento || 'antes'} onValueChange={(v) => set('momento', v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MOMENTOS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {passo.momento !== 'no_dia' && (
          <div className="flex items-center gap-1">
            <Input type="number" min="0" className="h-8 text-xs" value={passo.dias ?? 1} onChange={(e) => set('dias', Number(e.target.value))} />
            <span className="text-xs text-muted-foreground">dias</span>
          </div>
        )}
        <Select value={passo.canal || 'auto'} onValueChange={(v) => set('canal', v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Canal padrão</SelectItem>
            {CANAIS_COBRANCA.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Textarea
        rows={2}
        className="text-xs"
        placeholder="Mensagem de cobrança..."
        value={passo.texto || ''}
        onChange={(e) => set('texto', e.target.value)}
      />
    </div>
  );
}