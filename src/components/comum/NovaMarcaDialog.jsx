import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

// Cadastro rápido de Marca — abre sobre o formulário atual sem fechá-lo.
// onCreated(marca) recebe o registro criado para seleção automática.
export default function NovaMarcaDialog({ open, onClose, onCreated }) {
  const { toast } = useToast();
  const [nome, setNome] = useState('');
  const [saving, setSaving] = useState(false);

  const salvar = async () => {
    if (!nome.trim()) return;
    setSaving(true);
    try {
      const marca = await base44.entities.Marca.create({ nome: nome.trim(), status: 'ativo' });
      toast({ title: 'Marca cadastrada' });
      onCreated?.(marca);
      setNome('');
      onClose();
    } catch {
      toast({ title: 'Erro', description: 'Falha ao salvar marca.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setNome(''); onClose(); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Nova Marca</DialogTitle></DialogHeader>
        <div className="space-y-1">
          <Label className="text-xs">Nome da marca *</Label>
          <Input autoFocus value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Bosch" onKeyDown={(e) => e.key === 'Enter' && salvar()} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={salvar} disabled={saving || !nome.trim()}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}