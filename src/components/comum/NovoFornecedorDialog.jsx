import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

// Cadastro rápido de Fornecedor — abre sobre o formulário atual sem fechá-lo.
export default function NovoFornecedorDialog({ open, onClose, onCreated }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ nome_fantasia: '', cnpj: '', categoria: 'pecas', telefone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const reset = () => setForm({ nome_fantasia: '', cnpj: '', categoria: 'pecas', telefone: '', email: '' });

  const salvar = async () => {
    if (!form.nome_fantasia.trim()) return;
    setSaving(true);
    try {
      const forn = await base44.entities.Fornecedor.create({ ...form, status: 'ativo' });
      toast({ title: 'Fornecedor cadastrado' });
      onCreated?.(forn);
      reset();
      onClose();
    } catch {
      toast({ title: 'Erro', description: 'Falha ao salvar fornecedor.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Novo Fornecedor</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Nome fantasia *</Label>
            <Input autoFocus value={form.nome_fantasia} onChange={(e) => set('nome_fantasia', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">CNPJ</Label>
              <Input value={form.cnpj} onChange={(e) => set('cnpj', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => set('categoria', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pecas">Peças</SelectItem>
                  <SelectItem value="servicos">Serviços</SelectItem>
                  <SelectItem value="utilidades">Utilidades</SelectItem>
                  <SelectItem value="equipamentos">Equipamentos</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Telefone</Label>
              <Input value={form.telefone} onChange={(e) => set('telefone', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">E-mail</Label>
              <Input value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={salvar} disabled={saving || !form.nome_fantasia.trim()}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}