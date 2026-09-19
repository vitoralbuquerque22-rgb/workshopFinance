import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { formatDateTime } from '@/lib/format';
import { Plus, ClipboardCheck, ChevronRight } from 'lucide-react';

const statusBadge = {
  aberto: <Badge variant="outline">Aberto</Badge>,
  em_contagem: <Badge className="bg-amber-100 text-amber-700 border-amber-200">Em contagem</Badge>,
  finalizado: <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Finalizado</Badge>,
  cancelado: <Badge variant="secondary">Cancelado</Badge>,
};

export default function InventarioTab({ inventarios, pecas, onChange }) {
  const { toast } = useToast();
  const [novoOpen, setNovoOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [ativo, setAtivo] = useState(null);

  const criar = async () => {
    if (!desc) return;
    const itens = pecas.map((p) => ({
      peca_id: p.id, peca_codigo: p.codigo, peca_descricao: p.descricao,
      saldo_sistema: p.estoque_atual || 0, saldo_contado: null, diferenca: 0, contado: false,
    }));
    await base44.entities.Inventario.create({ descricao: desc, status: 'em_contagem', itens, data_inicio: new Date().toISOString() });
    toast({ title: 'Inventário iniciado', description: `${itens.length} itens para contagem.` });
    setDesc(''); setNovoOpen(false); onChange();
  };

  const setContagem = (idx, valor) => {
    const itens = ativo.itens.map((it, i) => {
      if (i !== idx) return it;
      const contado = valor === '' ? null : Number(valor);
      return { ...it, saldo_contado: contado, diferenca: contado === null ? 0 : contado - it.saldo_sistema, contado: contado !== null };
    });
    setAtivo({ ...ativo, itens });
  };

  const salvarContagem = async () => {
    await base44.entities.Inventario.update(ativo.id, { itens: ativo.itens });
    toast({ title: 'Contagem salva' });
    onChange();
  };

  const finalizar = async () => {
    // Aplica ajustes: atualiza estoque das peças contadas + registra movimento
    for (const it of ativo.itens) {
      if (it.contado && it.diferenca !== 0) {
        await base44.entities.Peca.update(it.peca_id, { estoque_atual: it.saldo_contado });
        await base44.entities.MovimentoEstoque.create({
          peca_id: it.peca_id, peca_codigo: it.peca_codigo, peca_descricao: it.peca_descricao,
          tipo: 'ajuste_inventario', quantidade: Math.abs(it.diferenca),
          saldo_anterior: it.saldo_sistema, saldo_novo: it.saldo_contado,
          motivo: `Inventário: ${ativo.descricao}`, data: new Date().toISOString(),
        });
      }
    }
    await base44.entities.Inventario.update(ativo.id, { status: 'finalizado', data_finalizacao: new Date().toISOString() });
    toast({ title: 'Inventário finalizado', description: 'Saldos ajustados no estoque.' });
    setAtivo(null); onChange();
  };

  if (ativo) {
    const contados = ativo.itens.filter((i) => i.contado).length;
    const readonly = ativo.status === 'finalizado';
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <button onClick={() => setAtivo(null)} className="text-sm text-muted-foreground hover:text-foreground">← Voltar</button>
            <h3 className="font-semibold">{ativo.descricao}</h3>
            <p className="text-xs text-muted-foreground">{contados}/{ativo.itens.length} contados</p>
          </div>
          {!readonly && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={salvarContagem}>Salvar contagem</Button>
              <Button onClick={finalizar}><ClipboardCheck className="w-4 h-4" /> Finalizar e ajustar</Button>
            </div>
          )}
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Peça</TableHead>
                  <TableHead className="text-right">Sistema</TableHead>
                  <TableHead className="text-right w-32">Contado</TableHead>
                  <TableHead className="text-right">Diferença</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ativo.itens.map((it, idx) => (
                  <TableRow key={it.peca_id}>
                    <TableCell className="font-mono text-xs">{it.peca_codigo}</TableCell>
                    <TableCell className="text-sm">{it.peca_descricao}</TableCell>
                    <TableCell className="text-right">{it.saldo_sistema}</TableCell>
                    <TableCell className="text-right">
                      <Input type="number" className="h-8 text-right" disabled={readonly}
                        value={it.saldo_contado ?? ''} onChange={(e) => setContagem(idx, e.target.value)} />
                    </TableCell>
                    <TableCell className={`text-right font-medium ${it.diferenca > 0 ? 'text-emerald-600' : it.diferenca < 0 ? 'text-red-600' : ''}`}>
                      {it.contado ? (it.diferenca > 0 ? `+${it.diferenca}` : it.diferenca) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setNovoOpen(true)}><Plus className="h-4 w-4" /> Novo Inventário</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Itens</TableHead>
                <TableHead>Início</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventarios.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum inventário.</TableCell></TableRow>
              ) : inventarios.map((inv) => (
                <TableRow key={inv.id} className="cursor-pointer" onClick={() => setAtivo(inv)}>
                  <TableCell className="font-medium">{inv.descricao}</TableCell>
                  <TableCell className="text-center">{statusBadge[inv.status]}</TableCell>
                  <TableCell className="text-right">{(inv.itens || []).length}</TableCell>
                  <TableCell className="text-xs">{formatDateTime(inv.data_inicio)}</TableCell>
                  <TableCell><ChevronRight className="w-4 h-4 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={novoOpen} onOpenChange={setNovoOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Inventário</DialogTitle></DialogHeader>
          <div className="space-y-1">
            <Label className="text-xs">Descrição</Label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex.: Inventário Geral Jul/2026" />
            <p className="text-xs text-muted-foreground mt-2">Serão carregadas todas as {pecas.length} peças ativas para contagem.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovoOpen(false)}>Cancelar</Button>
            <Button onClick={criar} disabled={!desc}>Iniciar contagem</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}