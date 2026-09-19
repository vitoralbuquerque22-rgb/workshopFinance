import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';

const empty = {
  nome: '', descricao: '', escopo: 'global', colaborador_id: '', cargo_id: '', categoria: '',
  prioridade: 0, comissao_mao_obra_percentual: 0, comissao_peca_percentual: 0,
  comissao_servico_terceirizado_percentual: 0, usar_margem: false, margem_minima: 0,
  comissao_por_margem_percentual: 0, regras_categoria: [], status: 'ativo',
};

const CATEGORIAS = ['mecanica', 'eletrica', 'funilaria', 'pintura', 'alinhamento', 'diagnostico', 'hidraulica', 'motor', 'freio', 'suspensao', 'outros'];

export default function RegraComissaoForm({ open, onOpenChange, onSave, editingItem, colaboradores = [], cargos = [] }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    setForm(editingItem ? { ...empty, ...editingItem, regras_categoria: editingItem.regras_categoria || [] } : empty);
  }, [editingItem, open]);

  const ch = (f, v) => setForm((p) => ({ ...p, [f]: v }));
  const addCat = () => ch('regras_categoria', [...form.regras_categoria, { categoria: 'mecanica', percentual: 0 }]);
  const updCat = (i, f, v) => {
    const arr = [...form.regras_categoria];
    arr[i] = { ...arr[i], [f]: v };
    ch('regras_categoria', arr);
  };
  const rmCat = (i) => ch('regras_categoria', form.regras_categoria.filter((_, x) => x !== i));

  const submit = async () => {
    await onSave({
      ...form,
      prioridade: Number(form.prioridade) || 0,
      comissao_mao_obra_percentual: Number(form.comissao_mao_obra_percentual) || 0,
      comissao_peca_percentual: Number(form.comissao_peca_percentual) || 0,
      comissao_servico_terceirizado_percentual: Number(form.comissao_servico_terceirizado_percentual) || 0,
      margem_minima: Number(form.margem_minima) || 0,
      comissao_por_margem_percentual: Number(form.comissao_por_margem_percentual) || 0,
      regras_categoria: form.regras_categoria.map((c) => ({ categoria: c.categoria, percentual: Number(c.percentual) || 0 })),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editingItem ? 'Editar Regra de Comissão' : 'Nova Regra de Comissão'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nome *</Label><Input value={form.nome} onChange={(e) => ch('nome', e.target.value)} /></div>
            <div>
              <Label>Escopo</Label>
              <Select value={form.escopo} onValueChange={(v) => ch('escopo', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (todos)</SelectItem>
                  <SelectItem value="colaborador">Por colaborador</SelectItem>
                  <SelectItem value="cargo">Por cargo</SelectItem>
                  <SelectItem value="categoria">Por categoria</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.escopo === 'colaborador' && (
            <div>
              <Label>Colaborador</Label>
              <Select value={form.colaborador_id} onValueChange={(v) => ch('colaborador_id', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{colaboradores.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {form.escopo === 'cargo' && (
            <div>
              <Label>Cargo</Label>
              <Select value={form.cargo_id} onValueChange={(v) => ch('cargo_id', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{cargos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {form.escopo === 'categoria' && (
            <div>
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => ch('categoria', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div><Label>% Mão de obra</Label><Input type="number" value={form.comissao_mao_obra_percentual} onChange={(e) => ch('comissao_mao_obra_percentual', e.target.value)} /></div>
            <div><Label>% Peças</Label><Input type="number" value={form.comissao_peca_percentual} onChange={(e) => ch('comissao_peca_percentual', e.target.value)} /></div>
            <div><Label>% Terceirizado</Label><Input type="number" value={form.comissao_servico_terceirizado_percentual} onChange={(e) => ch('comissao_servico_terceirizado_percentual', e.target.value)} /></div>
          </div>

          <div className="p-3 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Comissão por margem</Label>
                <p className="text-xs text-muted-foreground">Ex.: se a margem da OS for maior que X%, aplicar Y%.</p>
              </div>
              <Switch checked={form.usar_margem} onCheckedChange={(v) => ch('usar_margem', v)} />
            </div>
            {form.usar_margem && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Margem mínima (%)</Label><Input type="number" value={form.margem_minima} onChange={(e) => ch('margem_minima', e.target.value)} /></div>
                <div><Label>% Comissão se atingir</Label><Input type="number" value={form.comissao_por_margem_percentual} onChange={(e) => ch('comissao_por_margem_percentual', e.target.value)} /></div>
              </div>
            )}
          </div>

          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Label>Regras por categoria (opcional)</Label>
              <Button size="sm" variant="outline" onClick={addCat}><Plus className="w-3.5 h-3.5" /> Categoria</Button>
            </div>
            <div className="space-y-2">
              {form.regras_categoria.map((rc, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Select value={rc.categoria} onValueChange={(v) => updCat(i, 'categoria', v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input className="h-8 text-xs w-24" type="number" placeholder="%" value={rc.percentual} onChange={(e) => updCat(i, 'percentual', e.target.value)} />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => rmCat(i)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              ))}
              {form.regras_categoria.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma regra específica de categoria.</p>}
            </div>
          </div>

          <div><Label>Descrição</Label><Textarea rows={2} value={form.descricao} onChange={(e) => ch('descricao', e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!form.nome}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}