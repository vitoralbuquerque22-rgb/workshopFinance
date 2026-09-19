import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { TIPOS_AUDITORIA } from '@/lib/auditoria';
import { base44 } from '@/api/base44Client';

export default function NovaAuditoriaDialog({ open, onOpenChange, tipoInicial, onCreated }) {
  const [tipo, setTipo] = useState(tipoInicial || 'ferramentas');
  const [titulo, setTitulo] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  const [colaboradores, setColaboradores] = useState([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (open) {
      setTipo(tipoInicial || 'ferramentas');
      setTitulo('');
      setResponsavelId('');
      base44.entities.Colaborador.filter({ status: 'ativo' }, 'nome', 500).then(setColaboradores).catch(() => setColaboradores([]));
    }
  }, [open, tipoInicial]);

  const salvar = async () => {
    setSalvando(true);
    try {
      const colab = colaboradores.find((c) => c.id === responsavelId);
      const resp = await base44.functions.invoke('manageAuditoria', {
        action: 'criar',
        tipo,
        titulo: titulo || undefined,
        responsavel_id: responsavelId || undefined,
        responsavel_nome: colab?.nome || undefined,
        responsavel_email: colab?.email || undefined,
      });
      onCreated?.(resp.data?.auditoria);
      onOpenChange(false);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova auditoria</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS_AUDITORIA.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Título (opcional)</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Conferência mensal de ferramentas" />
          </div>
          <div>
            <Label>Responsável</Label>
            <Select value={responsavelId} onValueChange={setResponsavelId}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {colaboradores.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}