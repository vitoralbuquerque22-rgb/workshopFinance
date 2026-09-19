import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motivosPerda } from '@/lib/crmConfig';

export default function PerdaDialog({ open, onOpenChange, onConfirm }) {
  const [motivo, setMotivo] = useState('preco');
  const [detalhe, setDetalhe] = useState('');

  const handleConfirm = () => {
    onConfirm({ motivo_perda: motivo, motivo_perda_detalhe: detalhe });
    setMotivo('preco');
    setDetalhe('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Marcar como Perdido</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Motivo da perda</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(motivosPerda).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Detalhes (opcional)</Label>
            <Textarea value={detalhe} onChange={(e) => setDetalhe(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleConfirm}>Confirmar Perda</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}