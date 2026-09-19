import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const empty = { nome: '', codigo: '', tipo: 'elevador', especialidade: 'geral', capacidade_kg: '', status: 'livre' };

export default function ElevadorForm({ open, onOpenChange, onSave, editingItem }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    setForm(editingItem ? { ...empty, ...editingItem } : empty);
  }, [editingItem, open]);

  const change = (f, v) => setForm({ ...form, [f]: v });

  const submit = async () => {
    await onSave({
      ...form,
      capacidade_kg: form.capacidade_kg ? Number(form.capacidade_kg) : 0,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Editar Posto de Trabalho' : 'Novo Posto de Trabalho'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nome *</Label><Input value={form.nome} onChange={(e) => change('nome', e.target.value)} placeholder="Elevador 1" /></div>
            <div><Label>Código</Label><Input value={form.codigo} onChange={(e) => change('codigo', e.target.value)} placeholder="EL-01" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => change('tipo', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="elevador">Elevador</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="rampa">Rampa</SelectItem>
                  <SelectItem value="fosso">Fosso</SelectItem>
                  <SelectItem value="area_externa">Área Externa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Especialidade</Label>
              <Select value={form.especialidade} onValueChange={(v) => change('especialidade', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Geral</SelectItem>
                  <SelectItem value="mecanica">Mecânica</SelectItem>
                  <SelectItem value="eletrica">Elétrica</SelectItem>
                  <SelectItem value="alinhamento">Alinhamento</SelectItem>
                  <SelectItem value="funilaria">Funilaria</SelectItem>
                  <SelectItem value="pintura">Pintura</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Capacidade (kg)</Label><Input type="number" value={form.capacidade_kg} onChange={(e) => change('capacidade_kg', e.target.value)} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => change('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="livre">Livre</SelectItem>
                  <SelectItem value="ocupado">Ocupado</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!form.nome}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}