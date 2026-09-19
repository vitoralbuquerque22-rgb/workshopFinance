import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { formatDateTime } from '@/lib/format';
import { tipoMovimentoLabel } from '@/lib/estoque';
import { ArrowRightLeft, Send } from 'lucide-react';

export default function TransferenciaTab({ pecas, depositos, movimentos, onChange }) {
  const { toast } = useToast();
  const [pecaId, setPecaId] = useState('');
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [qtd, setQtd] = useState('');
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);

  const depNome = (id) => depositos.find((d) => d.id === id)?.nome || '—';

  const transferir = async () => {
    if (!pecaId || !origem || !destino || origem === destino || !Number(qtd)) {
      toast({ title: 'Dados incompletos', description: 'Selecione peça, depósitos distintos e quantidade.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const peca = pecas.find((p) => p.id === pecaId);
      await base44.entities.MovimentoEstoque.create({
        peca_id: pecaId, peca_codigo: peca?.codigo, peca_descricao: peca?.descricao,
        tipo: 'transferencia', quantidade: Number(qtd),
        deposito_origem_id: origem, deposito_destino_id: destino,
        motivo, data: new Date().toISOString(),
      });
      toast({ title: 'Transferência registrada' });
      setPecaId(''); setOrigem(''); setDestino(''); setQtd(''); setMotivo('');
      onChange();
    } finally {
      setSaving(false);
    }
  };

  const transf = movimentos.filter((m) => m.tipo === 'transferencia').sort((a, b) => new Date(b.data) - new Date(a.data));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ArrowRightLeft className="w-4 h-4" /> Nova Transferência</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Peça</Label>
            <Select value={pecaId} onValueChange={setPecaId}>
              <SelectTrigger><SelectValue placeholder="Selecionar peça..." /></SelectTrigger>
              <SelectContent>{pecas.map((p) => <SelectItem key={p.id} value={p.id}>{p.codigo} - {p.descricao}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Depósito origem</Label>
              <Select value={origem} onValueChange={setOrigem}>
                <SelectTrigger><SelectValue placeholder="Origem..." /></SelectTrigger>
                <SelectContent>{depositos.map((d) => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Depósito destino</Label>
              <Select value={destino} onValueChange={setDestino}>
                <SelectTrigger><SelectValue placeholder="Destino..." /></SelectTrigger>
                <SelectContent>{depositos.map((d) => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-xs">Quantidade</Label><Input type="number" value={qtd} onChange={(e) => setQtd(e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Motivo</Label><Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Opcional" /></div>
          </div>
          <Button onClick={transferir} disabled={saving}><Send className="w-4 h-4" /> Transferir</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Histórico de transferências</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Peça</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead>Origem → Destino</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transf.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma transferência.</TableCell></TableRow>
              ) : transf.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-xs">{formatDateTime(m.data)}</TableCell>
                  <TableCell><div className="text-sm">{m.peca_descricao}</div><div className="text-xs text-muted-foreground">{m.peca_codigo}</div></TableCell>
                  <TableCell className="text-right font-medium">{m.quantidade}</TableCell>
                  <TableCell className="text-xs">{depNome(m.deposito_origem_id)} <ArrowRightLeft className="inline w-3 h-3 mx-1 text-muted-foreground" /> {depNome(m.deposito_destino_id)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.motivo || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}