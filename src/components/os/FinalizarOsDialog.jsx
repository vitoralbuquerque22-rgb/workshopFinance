import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import CondicaoPagamentoFields, { condicaoVazia } from '@/components/os/CondicaoPagamentoFields';
import DescontoField, { calcularDesconto } from '@/components/os/DescontoField';

// Card que abre ao clicar em "Finalizar" numa OS: confirma/atualiza o desconto
// e as condições de pagamento antes de enviar a OS ao faturamento.
export default function FinalizarOsDialog({ open, onOpenChange, os, onFinalized }) {
  const [cond, setCond] = useState(condicaoVazia);
  const [desconto, setDesconto] = useState({ modo: 'valor', valor: 0 });
  const [contasBancarias, setContasBancarias] = useState([]);
  const [saving, setSaving] = useState(false);

  // Bruto = total já registrado na OS somado de volta o desconto que estava salvo.
  const bruto = (Number(os?.valor_total) || 0) + (Number(os?.valor_desconto) || 0);
  const valorDesconto = calcularDesconto({ ...desconto, bruto });
  const valorTotal = Math.max(0, bruto - valorDesconto);

  useEffect(() => {
    if (!open) return;
    setCond({ ...condicaoVazia, ...(os?.condicao_pagamento || {}) });
    setDesconto({ modo: 'valor', valor: Number(os?.valor_desconto) || 0 });
    base44.entities.ContaBancaria.list().then(setContasBancarias).catch(() => setContasBancarias([]));
  }, [open, os]);

  const handleFinalizar = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke('manageOs', {
        action: 'finalizar_os',
        ordem_servico_id: os.id,
        condicao_pagamento: cond,
        valor_desconto: valorDesconto,
        valor_total: valorTotal,
      });
      onOpenChange(false);
      await onFinalized?.();
    } finally {
      setSaving(false);
    }
  };

  if (!os) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Finalizar {os.numero || 'OS'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Desconto</p>
            <DescontoField value={desconto} onChange={setDesconto} bruto={bruto} />
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Condições de Pagamento</p>
            <CondicaoPagamentoFields
              value={cond}
              onChange={setCond}
              contasBancarias={contasBancarias}
              valorTotal={valorTotal}
            />
          </div>

          <p className="text-[11px] text-muted-foreground">
            Ao finalizar, a OS vai para <strong>Aguardando Faturamento</strong> com estas condições já definidas para a emissão da nota.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleFinalizar} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Finalizar OS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}