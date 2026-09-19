import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, SplitSquareHorizontal } from 'lucide-react';

// Bloco "Faturamento": o consultor decide na abertura da OS como distribuir
// entre CNPJs (Filiais). Regra de rateio editável até o faturamento.
export default function FaturamentoDistribuicao({ value, filiais = [], onChange, disabled = false }) {
  const dist = value || { modo: 'unico', cnpj_pecas: '', cnpj_servicos: '' };
  const filiaisAtivas = filiais.filter((f) => f.status !== 'inativa');

  const setModo = (modo) => {
    if (modo === 'unico') {
      // No modo único, tudo sai pelo mesmo CNPJ (usa o de peças como referência)
      const cnpj = dist.cnpj_pecas || dist.cnpj_servicos || '';
      onChange({ modo: 'unico', cnpj_pecas: cnpj, cnpj_servicos: cnpj });
    } else {
      onChange({ ...dist, modo: 'dividido' });
    }
  };

  const setUnico = (id) => onChange({ modo: 'unico', cnpj_pecas: id, cnpj_servicos: id });
  const setCampo = (campo, id) => onChange({ ...dist, [campo]: id });

  const FilialSelect = ({ val, onSet, placeholder }) => (
    <Select value={val || ''} onValueChange={onSet} disabled={disabled}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {filiaisAtivas.length === 0 && <SelectItem value="__none" disabled>Nenhuma filial cadastrada</SelectItem>}
        {filiaisAtivas.map((f) => (
          <SelectItem key={f.id} value={f.id}>
            {f.nome}{f.cnpj ? ` · ${f.cnpj}` : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="rounded-lg border border-border p-3 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Faturamento</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setModo('unico')}
          className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors ${
            dist.modo === 'unico' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-accent'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <Building2 className="w-4 h-4 shrink-0" />
          <span>
            <span className="block font-medium">CNPJ único</span>
            <span className="block text-[11px] text-muted-foreground">Peças e serviços no mesmo CNPJ</span>
          </span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setModo('dividido')}
          className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors ${
            dist.modo === 'dividido' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-accent'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <SplitSquareHorizontal className="w-4 h-4 shrink-0" />
          <span>
            <span className="block font-medium">Dividido por tipo</span>
            <span className="block text-[11px] text-muted-foreground">CNPJ separado p/ peças e serviços</span>
          </span>
        </button>
      </div>

      {dist.modo === 'dividido' ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">CNPJ das Peças</Label>
            <FilialSelect val={dist.cnpj_pecas} onSet={(id) => setCampo('cnpj_pecas', id)} placeholder="Selecione" />
          </div>
          <div>
            <Label className="text-xs">CNPJ dos Serviços</Label>
            <FilialSelect val={dist.cnpj_servicos} onSet={(id) => setCampo('cnpj_servicos', id)} placeholder="Selecione" />
          </div>
        </div>
      ) : (
        <div>
          <Label className="text-xs">CNPJ (peças e serviços)</Label>
          <FilialSelect val={dist.cnpj_pecas} onSet={setUnico} placeholder="Selecione" />
        </div>
      )}
    </div>
  );
}