import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CRITERIO_BONUS } from '@/lib/remuneracao';

const empty = {
  nome: '', descricao: '', abrangencia: 'individual', colaborador_id: '', filial_id: '',
  criterio: 'horas_produzidas', meta_valor: 0, valor_bonus: 0, periodo: 'mensal',
  data_inicio: '', data_fim: '', status: 'ativa',
};

export default function BonificacaoForm({ open, onOpenChange, onSave, editingItem, colaboradores = [], filiais = [] }) {
  const [form, setForm] = useState(empty);

  useEffect(() => { setForm(editingItem ? { ...empty, ...editingItem } : empty); }, [editingItem, open]);
  const ch = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  const submit = async () => {
    await onSave({ ...form, meta_valor: Number(form.meta_valor) || 0, valor_bonus: Number(form.valor_bonus) || 0 });
    onOpenChange(false);
  };

  const metaLabel = form.criterio === 'faturamento' ? 'Meta de faturamento (R$)'
    : form.criterio === 'horas_produzidas' ? 'Meta de horas'
    : form.criterio === 'eficiencia' ? 'Eficiência mínima (%)' : 'Meta';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editingItem ? 'Editar Bonificação' : 'Nova Bonificação'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={form.nome} onChange={(e) => ch('nome', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Abrangência</Label>
              <Select value={form.abrangencia} onValueChange={(v) => ch('abrangencia', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="equipe">Por equipe</SelectItem>
                  <SelectItem value="filial">Por filial</SelectItem>
                  <SelectItem value="global">Global</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Critério</Label>
              <Select value={form.criterio} onValueChange={(v) => ch('criterio', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(CRITERIO_BONUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {form.abrangencia === 'individual' && (
            <div>
              <Label>Colaborador</Label>
              <Select value={form.colaborador_id} onValueChange={(v) => ch('colaborador_id', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{colaboradores.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {form.abrangencia === 'filial' && (
            <div>
              <Label>Filial</Label>
              <Select value={form.filial_id} onValueChange={(v) => ch('filial_id', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{filiais.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {form.criterio !== 'sem_retrabalho' && (
              <div><Label>{metaLabel}</Label><Input type="number" value={form.meta_valor} onChange={(e) => ch('meta_valor', e.target.value)} /></div>
            )}
            <div><Label>Valor do bônus (R$)</Label><Input type="number" value={form.valor_bonus} onChange={(e) => ch('valor_bonus', e.target.value)} /></div>
            <div>
              <Label>Período</Label>
              <Select value={form.periodo} onValueChange={(v) => ch('periodo', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="mensal">Mensal</SelectItem><SelectItem value="trimestral">Trimestral</SelectItem><SelectItem value="campanha">Campanha</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => ch('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ativa">Ativa</SelectItem><SelectItem value="pausada">Pausada</SelectItem><SelectItem value="encerrada">Encerrada</SelectItem></SelectContent>
              </Select>
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