import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDate } from '@/lib/format';
import { diasParaVencer } from '@/lib/estoque';
import { Plus, Layers, AlertTriangle } from 'lucide-react';

const empty = { peca_id: '', numero_lote: '', quantidade: 0, consignado: false, data_fabricacao: '', data_validade: '', custo_unitario: 0, status: 'ativo' };

export default function LotesTab({ lotes, pecas, onChange }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const salvar = async () => {
    if (!form.peca_id || !form.numero_lote) return;
    const peca = pecas.find((p) => p.id === form.peca_id);
    await base44.entities.Lote.create({
      ...form,
      peca_codigo: peca?.codigo,
      peca_descricao: peca?.descricao,
    });
    toast({ title: 'Lote registrado' });
    setOpen(false);
    setForm(empty);
    onChange();
  };

  const ordered = [...lotes].sort((a, b) => {
    if (!a.data_validade) return 1;
    if (!b.data_validade) return -1;
    return new Date(a.data_validade) - new Date(b.data_validade);
  });

  const badgeValidade = (l) => {
    const dias = diasParaVencer(l.data_validade);
    if (dias === null) return null;
    if (dias < 0) return <Badge variant="destructive">Vencido</Badge>;
    if (dias <= 30) return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><AlertTriangle className="w-3 h-3" /> {dias}d</Badge>;
    return <Badge variant="outline">{dias}d</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setForm(empty); setOpen(true); }}><Plus className="h-4 w-4" /> Novo Lote</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead>
                <TableHead>Peça</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead>Fabricação</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead className="text-center">Situação</TableHead>
                <TableHead className="text-center">Consignado</TableHead>
                <TableHead className="text-right">Custo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum lote registrado.</TableCell></TableRow>
              ) : ordered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-xs flex items-center gap-1"><Layers className="w-3.5 h-3.5 text-muted-foreground" />{l.numero_lote}</TableCell>
                  <TableCell><div className="text-sm">{l.peca_descricao}</div><div className="text-xs text-muted-foreground">{l.peca_codigo}</div></TableCell>
                  <TableCell className="text-right">{l.quantidade}</TableCell>
                  <TableCell className="text-xs">{formatDate(l.data_fabricacao)}</TableCell>
                  <TableCell className="text-xs">{formatDate(l.data_validade)}</TableCell>
                  <TableCell className="text-center">{badgeValidade(l)}</TableCell>
                  <TableCell className="text-center">{l.consignado ? <Badge className="bg-blue-100 text-blue-700 border-blue-200">Sim</Badge> : '—'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(l.custo_unitario)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Lote</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Peça *</Label>
              <Select value={form.peca_id} onValueChange={(v) => set('peca_id', v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar peça..." /></SelectTrigger>
                <SelectContent>{pecas.map((p) => <SelectItem key={p.id} value={p.id}>{p.codigo} - {p.descricao}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Nº Lote *</Label><Input value={form.numero_lote} onChange={(e) => set('numero_lote', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Quantidade</Label><Input type="number" value={form.quantidade} onChange={(e) => set('quantidade', Number(e.target.value))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Fabricação</Label><Input type="date" value={form.data_fabricacao} onChange={(e) => set('data_fabricacao', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Validade</Label><Input type="date" value={form.data_validade} onChange={(e) => set('data_validade', e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs">Custo unitário</Label><Input type="number" step="0.01" value={form.custo_unitario} onChange={(e) => set('custo_unitario', Number(e.target.value))} /></div>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.consignado} onCheckedChange={(v) => set('consignado', !!v)} /> Lote consignado</label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={salvar} disabled={!form.peca_id || !form.numero_lote}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}