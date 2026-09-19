import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

const initialForm = {
  nome_fantasia: '', razao_social: '', cnpj: '', categoria: 'pecas',
  contato_nome: '', telefone: '', email: '',
};

const categoriaLabels = {
  pecas: 'Peças', servicos: 'Serviços', utilidades: 'Utilidades',
  equipamentos: 'Equipamentos', outros: 'Outros',
};

export default function FornecedorSelect({ fornecedores, value, onChange, onCreated }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await base44.entities.Fornecedor.create(form);
      setModalOpen(false);
      setForm(initialForm);
      await onCreated();
      onChange(created.id);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <Select value={value || '_none'} onValueChange={(v) => onChange(v === '_none' ? '' : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um fornecedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">— Sem fornecedor —</SelectItem>
            {fornecedores.map(f => (
              <SelectItem key={f.id} value={f.id}>{f.nome_fantasia}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="button" variant="outline" size="icon" onClick={() => setModalOpen(true)} title="Cadastrar novo fornecedor" className="shrink-0">
        <Plus className="w-4 h-4" />
      </Button>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Cadastrar Fornecedor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Nome Fantasia *</Label>
              <Input value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} required autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>CNPJ</Label>
                <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoriaLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Razão Social</Label>
              <Input value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Contato</Label>
                <Input value={form.contato_nome} onChange={(e) => setForm({ ...form, contato_nome: e.target.value })} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Cadastrar'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}