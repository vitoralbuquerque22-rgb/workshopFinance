import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import CamposCliente from '@/components/clientes/CamposCliente';

const initialForm = {
  tipo_pessoa: 'fisica', nome: '', tipo_cliente: 'particular',
  status: 'ativo', origem_dados: 'manual', socios: [],
};

// Cadastro rápido de cliente sobreposto à OS — não fecha a OS. Ao salvar,
// devolve o cliente criado para ser selecionado automaticamente.
export default function ClienteRapidoDialog({ open, onOpenChange, onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setForm(initialForm); }, [open]);

  const montarEndereco = (f) => [f.logradouro, f.numero, f.complemento, f.bairro, f.cidade, f.uf].filter(Boolean).join(', ');

  const handleSubmit = async () => {
    if (!form.nome) return;
    setSaving(true);
    try {
      const novo = await base44.entities.Cliente.create({ ...form, endereco: montarEndereco(form) });
      onCreated(novo);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
        <CamposCliente form={form} onChange={setForm} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.nome}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Salvar cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}