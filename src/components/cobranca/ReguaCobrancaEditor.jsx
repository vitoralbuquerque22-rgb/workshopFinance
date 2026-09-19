import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Info } from 'lucide-react';
import PassoCobrancaCard from './PassoCobrancaCard';
import { CANAIS_COBRANCA, FORMAS_COBRANCA, VARIAVEIS_COBRANCA } from '@/lib/cobranca';

// Editor da régua de cobrança — usado na tela do Financeiro (padrão) e no cliente.
// `mostrarFormas` liga a seção de "formas que disparam a cadência" (só na padrão faz sentido detalhar).
export default function ReguaCobrancaEditor({ regua, onChange, mostrarFormas = true }) {
  const set = (campo, valor) => onChange({ ...regua, [campo]: valor });

  const setPasso = (idx, novo) => {
    const passos = [...(regua.passos || [])];
    passos[idx] = novo;
    set('passos', passos);
  };
  const removerPasso = (idx) => set('passos', (regua.passos || []).filter((_, i) => i !== idx));
  const adicionarPasso = () => set('passos', [...(regua.passos || []), { ativo: true, momento: 'apos', dias: 1, canal: 'auto', texto: '' }]);

  const toggleForma = (forma) => {
    const atual = regua.formas_alvo || [];
    set('formas_alvo', atual.includes(forma) ? atual.filter((f) => f !== forma) : [...atual, forma]);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch checked={regua.ativo !== false} onCheckedChange={(v) => set('ativo', v)} />
          <Label className="text-sm">Cadência ativa</Label>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Canal padrão</Label>
          <Select value={regua.canal_padrao || 'whatsapp'} onValueChange={(v) => set('canal_padrao', v)}>
            <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CANAIS_COBRANCA.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {mostrarFormas && (
        <div className="space-y-2">
          <Label className="text-sm">Formas que disparam a cobrança</Label>
          <div className="flex flex-wrap gap-2">
            {FORMAS_COBRANCA.map((f) => {
              const on = (regua.formas_alvo || []).includes(f.value);
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => toggleForma(f.value)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${on ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground hover:bg-accent'}`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Régua de disparos</Label>
          <Button variant="outline" size="sm" onClick={adicionarPasso}><Plus className="w-4 h-4" /> Passo</Button>
        </div>
        {(regua.passos || []).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg">Nenhum disparo configurado. Adicione passos para a cadência.</p>
        ) : (
          <div className="space-y-2">
            {(regua.passos || []).map((p, i) => (
              <PassoCobrancaCard key={i} passo={p} onChange={(novo) => setPasso(i, novo)} onRemove={() => removerPasso(i)} />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <span className="font-medium">Variáveis disponíveis:</span> {VARIAVEIS_COBRANCA.join('  ')}
        </div>
      </div>
    </div>
  );
}