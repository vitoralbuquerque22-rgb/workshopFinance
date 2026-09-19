import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MODELO_REMUNERACAO } from '@/lib/remuneracao';

const empty = { nome: '', descricao: '', area: 'tecnica', modelo_remuneracao_padrao: 'salario', status: 'ativo' };

export default function CargoForm({ open, onOpenChange, onSave, editingItem }) {
  const [form, setForm] = useState(empty);
  useEffect(() => { setForm(editingItem ? { ...empty, ...editingItem } : empty); }, [editingItem, open]);
  const ch = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  const submit = async () => { await onSave(form); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editingItem ? 'Editar Cargo' : 'Novo Cargo'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={form.nome} onChange={(e) => ch('nome', e.target.value)} /></div>
          <div>
            <Label>Área</Label>
            <Select value={form.area} onValueChange={(v) => ch('area', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tecnica">Técnica</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
                <SelectItem value="administrativa">Administrativa</SelectItem>
                <SelectItem value="gestao">Gestão</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Modelo de remuneração padrão</Label>
            <Select value={form.modelo_remuneracao_padrao} onValueChange={(v) => ch('modelo_remuneracao_padrao', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(MODELO_REMUNERACAO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
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