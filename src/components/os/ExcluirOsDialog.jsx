import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';

export default function ExcluirOsDialog({ open, onOpenChange, os, onDeleted }) {
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => setMotivo('');

  const submit = async () => {
    if (motivo.trim().length < 5) return;
    setSaving(true);
    try {
      await base44.functions.invoke('manageOs', {
        action: 'excluir_os',
        ordem_servico_id: os.id,
        motivo: motivo.trim(),
      });
      onDeleted?.();
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
            <Trash2 className="w-5 h-5 text-destructive" /> Excluir OS {os?.numero}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-muted-foreground">Esta ação é permanente e será registrada. O administrador será notificado por e-mail.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Justificativa da exclusão *</Label>
            <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} placeholder="Explique por que esta OS está sendo excluída..." />
            <p className="text-xs text-muted-foreground">Mínimo de 5 caracteres.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button variant="destructive" onClick={submit} disabled={saving || motivo.trim().length < 5}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Excluir OS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}