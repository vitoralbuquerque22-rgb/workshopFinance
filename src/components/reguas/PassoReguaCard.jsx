import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Clock } from 'lucide-react';
import { ATALHOS_ATRASO } from '@/lib/reguas';

// Editor de um passo da régua: atraso + texto (+ canal opcional).
export default function PassoReguaCard({ passo, indice, onChange, onRemover }) {
  const set = (campo, valor) => onChange({ ...passo, [campo]: valor });

  const atalhoAtivo = (a) =>
    Number(passo.atraso_valor) === a.valor && (passo.atraso_unidade || 'dias') === a.unidade;

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
            {indice + 1}
          </div>
          <span className="text-sm font-medium">Passo {indice + 1}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onRemover}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Atalhos de atraso */}
      <div>
        <Label className="text-xs flex items-center gap-1.5 mb-2"><Clock className="w-3.5 h-3.5" /> Quando enviar (após o gatilho)</Label>
        <div className="flex flex-wrap gap-2">
          {ATALHOS_ATRASO.map((a) => (
            <button
              key={`${a.valor}-${a.unidade}`}
              type="button"
              onClick={() => onChange({ ...passo, atraso_valor: a.valor, atraso_unidade: a.unidade })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                atalhoAtivo(a) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
        {/* Atraso personalizado */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground">ou personalizado:</span>
          <Input
            type="number"
            min={0}
            value={passo.atraso_valor ?? 0}
            onChange={(e) => set('atraso_valor', Number(e.target.value))}
            className="h-8 w-20"
          />
          <Select value={passo.atraso_unidade || 'dias'} onValueChange={(v) => set('atraso_unidade', v)}>
            <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="minutos">minutos</SelectItem>
              <SelectItem value="horas">horas</SelectItem>
              <SelectItem value="dias">dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Texto */}
      <div>
        <Label className="text-xs mb-1 block">Mensagem</Label>
        <Textarea
          rows={3}
          value={passo.texto || ''}
          onChange={(e) => set('texto', e.target.value)}
          placeholder="Ex: Olá {cliente}! Conseguiu analisar o orçamento do seu {veiculo}?"
        />
      </div>
    </div>
  );
}