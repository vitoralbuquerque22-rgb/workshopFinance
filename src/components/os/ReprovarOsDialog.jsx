import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, XCircle } from 'lucide-react';

const MOTIVOS = [
  { value: 'preco', label: 'Preço' },
  { value: 'prazo', label: 'Prazo' },
  { value: 'concorrencia', label: 'Concorrência' },
  { value: 'vai_esperar', label: 'Vai esperar (cartão / salário)' },
  { value: 'desistiu', label: 'Desistiu' },
  { value: 'outro', label: 'Outro' },
];

export default function ReprovarOsDialog({ open, onOpenChange, os, onReproved }) {
  const [motivo, setMotivo] = useState('');
  const [detalhe, setDetalhe] = useState('');
  const [agendarRetorno, setAgendarRetorno] = useState(false);
  const [dataRetorno, setDataRetorno] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setMotivo('');
    setDetalhe('');
    setAgendarRetorno(false);
    setDataRetorno('');
  };

  const submit = async () => {
    if (!motivo) return;
    if (agendarRetorno && !dataRetorno) return;
    setSaving(true);
    try {
      await base44.functions.invoke('manageOs', {
        action: 'reprovar_orcamento',
        ordem_servico_id: os.id,
        motivo_recusa: motivo,
        motivo_recusa_detalhe: detalhe,
        agendar_retorno: agendarRetorno,
        data_retorno: agendarRetorno ? dataRetorno : undefined,
      });
      onReproved?.({ agendarRetorno, dataRetorno, motivo, detalhe });
      reset();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-destructive" /> Reprovar orçamento {os?.numero}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Motivo do não fechamento *</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
              <SelectContent>
                {MOTIVOS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Observação</Label>
            <Textarea value={detalhe} onChange={(e) => setDetalhe(e.target.value)} rows={3} placeholder="Detalhes do que o cliente falou..." />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="cursor-pointer">Agendar retorno?</Label>
              <p className="text-xs text-muted-foreground">Cria um card no CRM com a data do próximo contato</p>
            </div>
            <Switch checked={agendarRetorno} onCheckedChange={setAgendarRetorno} />
          </div>

          {agendarRetorno && (
            <div className="space-y-1.5">
              <Label>Data do próximo contato</Label>
              <Input type="date" value={dataRetorno} onChange={(e) => setDataRetorno(e.target.value)} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button variant="destructive" onClick={submit} disabled={saving || !motivo || (agendarRetorno && !dataRetorno)}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Confirmar reprovação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}