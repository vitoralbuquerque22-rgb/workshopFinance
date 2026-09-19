import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Warehouse, Pencil } from 'lucide-react';

const tipos = [
  { value: 'principal', label: 'Principal' },
  { value: 'secundario', label: 'Secundário' },
  { value: 'consignado', label: 'Consignado' },
  { value: 'avariado', label: 'Avariado' },
  { value: 'transito', label: 'Em Trânsito' },
];
const empty = { nome: '', codigo: '', tipo: 'principal', endereco: '', responsavel: '', status: 'ativo' };

export default function DepositosTab({ depositos, onChange }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const abrir = (d) => { if (d) { setForm({ ...empty, ...d }); setEditId(d.id); } else { setForm(empty); setEditId(null); } setOpen(true); };

  const salvar = async () => {
    if (!form.nome) return;
    if (editId) await base44.entities.Deposito.update(editId, form);
    else await base44.entities.Deposito.create(form);
    toast({ title: editId ? 'Depósito atualizado' : 'Depósito criado' });
    setOpen(false);
    onChange();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => abrir(null)}><Plus className="h-4 w-4" /> Novo Depósito</Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {depositos.length === 0 && <p className="text-sm text-muted-foreground col-span-full text-center py-8">Nenhum depósito cadastrado.</p>}
        {depositos.map((d) => (
          <Card key={d.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{d.nome}</p>
                    {d.codigo && <p className="text-xs text-muted-foreground">{d.codigo}</p>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => abrir(d)}><Pencil className="h-4 w-4" /></Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{tipos.find((t) => t.value === d.tipo)?.label}</Badge>
                <Badge variant={d.status === 'ativo' ? 'default' : 'secondary'}>{d.status}</Badge>
              </div>
              {d.endereco && <p className="text-xs text-muted-foreground mt-2">{d.endereco}</p>}
              {d.responsavel && <p className="text-xs text-muted-foreground">Resp.: {d.responsavel}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? 'Editar Depósito' : 'Novo Depósito'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Nome *</Label><Input value={form.nome} onChange={(e) => set('nome', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Código</Label><Input value={form.codigo} onChange={(e) => set('codigo', e.target.value)} /></div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => set('tipo', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{tipos.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Endereço</Label><Input value={form.endereco} onChange={(e) => set('endereco', e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Responsável</Label><Input value={form.responsavel} onChange={(e) => set('responsavel', e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={!form.nome}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}