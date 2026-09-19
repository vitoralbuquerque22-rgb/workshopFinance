import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import CamposCliente from './CamposCliente';
import ClienteReguaCobranca from '@/components/cobranca/ClienteReguaCobranca';

const initialForm = {
  tipo_pessoa: 'fisica', nome: '', tipo_cliente: 'particular',
  status: 'ativo', origem_dados: 'manual', socios: [],
};

const soDigitos = (v) => String(v || '').replace(/\D/g, '');

// Campos internos da oficina que NUNCA são sobrescritos pela consulta.
const CAMPOS_INTERNOS = ['observacoes', 'tipo_cliente', 'status'];

export default function ClienteForm({ open, onOpenChange, onSave, editingItem }) {
  const { toast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [atualizando, setAtualizando] = useState(false);

  useEffect(() => {
    setForm(editingItem ? { ...initialForm, ...editingItem } : initialForm);
  }, [editingItem, open]);

  const montarEndereco = (f) => [f.logradouro, f.numero, f.complemento, f.bairro, f.cidade, f.uf].filter(Boolean).join(', ');

  const handleSubmit = async () => {
    await onSave({ ...form, endereco: montarEndereco(form) });
    setForm(initialForm);
    onOpenChange(false);
  };

  // Atualizar dados pela API — só campos consultados, preservando os internos.
  const atualizarPelaApi = async () => {
    const isCnpj = form.tipo_pessoa === 'juridica';
    const doc = soDigitos(isCnpj ? form.cnpj : form.cpf);
    if ((isCnpj && doc.length !== 14) || (!isCnpj && doc.length !== 11)) {
      toast({ title: 'Documento inválido', description: `Informe um ${isCnpj ? 'CNPJ' : 'CPF'} válido antes de atualizar.`, variant: 'destructive' });
      return;
    }
    setAtualizando(true);
    try {
      const res = await base44.functions.invoke('consultarDocumento', {
        tipo: isCnpj ? 'cnpj' : 'cpf', documento: doc, cliente_id: editingItem?.id,
      });
      if (res.data?.dados) {
        const dados = { ...res.data.dados };
        CAMPOS_INTERNOS.forEach((c) => delete dados[c]);
        setForm((prev) => ({ ...prev, ...dados }));
        toast({ title: 'Dados atualizados pela consulta', description: 'Revise e salve para confirmar.' });
      } else {
        toast({ title: 'Nada encontrado', description: res.data?.error || 'Documento não retornou dados.', variant: 'default' });
      }
    } catch (err) {
      toast({ title: 'Consulta indisponível', description: err.response?.data?.error || 'Tente novamente mais tarde.', variant: 'destructive' });
    } finally {
      setAtualizando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setForm(initialForm); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle>{editingItem ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            {editingItem && (
              <Button variant="outline" size="sm" onClick={atualizarPelaApi} disabled={atualizando}>
                {atualizando ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Atualizar dados pela API
              </Button>
            )}
          </div>
        </DialogHeader>

        {form.origem_dados && form.origem_dados !== 'manual' && (
          <p className="text-xs text-emerald-600 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Origem: consulta automática ({form.origem_dados === 'consulta_cnpj' ? 'CNPJ' : 'CPF'})
          </p>
        )}

        <CamposCliente form={form} onChange={setForm} />

        <ClienteReguaCobranca clienteId={editingItem?.id} />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!form.nome}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}