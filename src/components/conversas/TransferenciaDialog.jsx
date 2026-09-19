import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function TransferenciaDialog({ open, onOpenChange, consultores, atualId, onConfirm }) {
  const [destino, setDestino] = useState('');
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (open) { setDestino(''); setMotivo(''); }
  }, [open]);

  const disponiveis = consultores.filter((c) => c.id !== atualId);

  const confirmar = async () => {
    setEnviando(true);
    try {
      await onConfirm(destino, motivo.trim());
      onOpenChange(false);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transferir atendimento</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <label className="text-sm font-medium">Transferir para</label>
            <Select value={destino} onValueChange={setDestino}>
              <SelectTrigger><SelectValue placeholder="Selecione o consultor" /></SelectTrigger>
              <SelectContent>
                {disponiveis.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Motivo da transferência</label>
            <Textarea placeholder="Ex: cliente da carteira do consultor X, especialidade..." value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={enviando}>Cancelar</Button>
          <Button onClick={confirmar} disabled={enviando || !destino || motivo.trim().length < 3}>
            {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Transferir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}