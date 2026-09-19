import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const bancos = [
  { codigo: '001', nome: 'Banco do Brasil' },
  { codigo: '237', nome: 'Bradesco' },
  { codigo: '341', nome: 'Itaú' },
  { codigo: '104', nome: 'Caixa Econômica' },
  { codigo: '033', nome: 'Santander' },
  { codigo: '077', nome: 'Banco Inter' },
  { codigo: '260', nome: 'Nu Pagamentos (Nubank)' },
  { codigo: '336', nome: 'Banco C6' },
  { codigo: '212', nome: 'Banco Original' },
  { codigo: '748', nome: 'Sicredi' },
  { codigo: '756', nome: 'Sicoob' },
];

const initialForm = { banco_codigo: '', banco_nome: '', agencia: '', conta: '', tipo_integracao: 'manual', status: 'ativa' };

export default function ContaBancariaForm({ open, onOpenChange, onSave, editingItem }) {
  const [form, setForm] = useState(editingItem || initialForm);
  const [saving, setSaving] = useState(false);

  const handleBancoChange = (codigo) => {
    const banco = bancos.find(b => b.codigo === codigo);
    setForm({ ...form, banco_codigo: codigo, banco_nome: banco?.nome || '' });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave(form);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Banco</Label>
            <Select value={form.banco_codigo} onValueChange={handleBancoChange}>
              <SelectTrigger><SelectValue placeholder="Selecione o banco" /></SelectTrigger>
              <SelectContent>
                {bancos.map(b => <SelectItem key={b.codigo} value={b.codigo}>{b.codigo} - {b.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Agência</Label>
              <Input value={form.agencia} onChange={(e) => setForm({ ...form, agencia: e.target.value })} />
            </div>
            <div>
              <Label>Conta</Label>
              <Input value={form.conta} onChange={(e) => setForm({ ...form, conta: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Tipo de Integração</Label>
            <Select value={form.tipo_integracao} onValueChange={(v) => setForm({ ...form, tipo_integracao: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual / CNAB (upload de arquivo)</SelectItem>
                <SelectItem value="cnab">CNAB Automático</SelectItem>
                <SelectItem value="open_banking">Open Banking (OAuth)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.banco_codigo || !form.agencia || !form.conta}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}