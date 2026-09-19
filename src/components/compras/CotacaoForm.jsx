import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { formatCurrency } from '@/lib/format';
import { somaProposta, melhorProposta } from '@/lib/compras';
import { Plus, Trash2, Loader2, Trophy } from 'lucide-react';

function novaProposta(itens) {
  return {
    fornecedor_id: '', fornecedor_nome: '', frete: 0, prazo_entrega_dias: 0,
    condicao_pagamento: '', validade: '',
    itens: itens.map((i) => ({ descricao: i.descricao, quantidade: i.quantidade || 0, valor_unitario: 0, disponivel: true })),
  };
}

export default function CotacaoForm({ open, onClose, onSave, cotacao, requisicoes, fornecedores }) {
  const [reqId, setReqId] = useState('');
  const [itens, setItens] = useState([]);
  const [propostas, setPropostas] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (cotacao) {
      setReqId(cotacao.requisicao_id || '');
      setItens(cotacao.itens || []);
      setPropostas(cotacao.propostas || []);
    } else {
      setReqId(''); setItens([]); setPropostas([]);
    }
  }, [open, cotacao]);

  const loadReq = (id) => {
    setReqId(id);
    const r = requisicoes.find((x) => x.id === id);
    const its = (r?.itens || []).map((i) => ({ peca_id: i.peca_id, descricao: i.descricao, quantidade: i.quantidade, unidade: i.unidade }));
    setItens(its);
    setPropostas([novaProposta(its)]);
  };

  const setProp = (pi, k, v) => setPropostas((ps) => ps.map((p, idx) => idx === pi ? { ...p, [k]: v } : p));
  const setPropItem = (pi, ii, k, v) => setPropostas((ps) => ps.map((p, idx) => idx !== pi ? p : { ...p, itens: p.itens.map((it, j) => j === ii ? { ...it, [k]: v } : it) }));
  const addProp = () => setPropostas((ps) => [...ps, novaProposta(itens)]);
  const rmProp = (pi) => setPropostas((ps) => ps.filter((_, idx) => idx !== pi));

  const pickForn = (pi, id) => {
    const f = fornecedores.find((x) => x.id === id);
    setPropostas((ps) => ps.map((p, idx) => idx === pi ? { ...p, fornecedor_id: id, fornecedor_nome: f?.nome_fantasia || f?.razao_social || '' } : p));
  };

  const vencedora = melhorProposta(propostas);

  const submit = async () => {
    setSaving(true);
    try {
      const propostasCalc = propostas.map((p) => {
        const { subtotal, total } = somaProposta(p);
        return { ...p, subtotal, total, vencedora: vencedora && p.fornecedor_id === vencedora.fornecedor_id };
      });
      const respondida = propostasCalc.some((p) => p.total > 0);
      const payload = {
        requisicao_id: reqId, itens,
        propostas: propostasCalc,
        status: respondida ? 'respondida' : 'aberta',
      };
      if (cotacao?.id) await base44.entities.Cotacao.update(cotacao.id, payload);
      else await base44.entities.Cotacao.create(payload);
      if (reqId) await base44.entities.Requisicao.update(reqId, { status: 'em_cotacao' }).catch(() => {});
      onSave();
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{cotacao ? 'Editar' : 'Nova'} Cotação — Comparação de Fornecedores</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Solicitação de origem</Label>
            <Select value={reqId || 'none'} onValueChange={(v) => v !== 'none' && loadReq(v)} disabled={!!cotacao}>
              <SelectTrigger><SelectValue placeholder="Selecionar solicitação..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {requisicoes.filter((r) => ['solicitada', 'em_cotacao', 'cotada'].includes(r.status)).map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.numero || `REQ-${r.id.slice(-5)}`} · {r.itens?.length || 0} item(ns)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {itens.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Selecione uma solicitação para carregar os itens.</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Propostas ({propostas.length})</Label>
                <Button type="button" variant="outline" size="sm" onClick={addProp}><Plus className="h-4 w-4" /> Fornecedor</Button>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2">
                {propostas.map((p, pi) => {
                  const { subtotal, total } = somaProposta(p);
                  const isWin = vencedora && p.fornecedor_id && p.fornecedor_id === vencedora.fornecedor_id;
                  return (
                    <div key={pi} className={`min-w-[280px] flex-1 border rounded-lg p-3 space-y-2 ${isWin ? 'border-emerald-400 bg-emerald-50/40' : ''}`}>
                      <div className="flex items-center justify-between">
                        {isWin ? <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1"><Trophy className="h-3.5 w-3.5" /> Melhor</span> : <span className="text-xs text-muted-foreground">Proposta {pi + 1}</span>}
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => rmProp(pi)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                      <Select value={p.fornecedor_id || 'none'} onValueChange={(v) => v !== 'none' && pickForn(pi, v)}>
                        <SelectTrigger className="h-8"><SelectValue placeholder="Fornecedor..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {fornecedores.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome_fantasia || f.razao_social}</SelectItem>)}
                        </SelectContent>
                      </Select>

                      <div className="space-y-1.5">
                        {p.itens.map((it, ii) => (
                          <div key={ii} className="text-xs space-y-1 border-b pb-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate flex-1" title={it.descricao}>{it.descricao}</span>
                              <label className="flex items-center gap-1 shrink-0"><Checkbox className="h-3.5 w-3.5" checked={it.disponivel} onCheckedChange={(v) => setPropItem(pi, ii, 'disponivel', !!v)} /><span className="text-[10px] text-muted-foreground">disp.</span></label>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-muted-foreground w-8">x{it.quantidade}</span>
                              <Input type="number" step="0.01" className="h-7 text-xs" value={it.valor_unitario} onChange={(e) => setPropItem(pi, ii, 'valor_unitario', Number(e.target.value))} placeholder="R$ unit." disabled={!it.disponivel} />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <div><Label className="text-[10px] text-muted-foreground">Frete</Label><Input type="number" step="0.01" className="h-7 text-xs" value={p.frete} onChange={(e) => setProp(pi, 'frete', Number(e.target.value))} /></div>
                        <div><Label className="text-[10px] text-muted-foreground">Prazo (dias)</Label><Input type="number" className="h-7 text-xs" value={p.prazo_entrega_dias} onChange={(e) => setProp(pi, 'prazo_entrega_dias', Number(e.target.value))} /></div>
                      </div>
                      <div><Label className="text-[10px] text-muted-foreground">Cond. pagamento</Label><Input className="h-7 text-xs" value={p.condicao_pagamento} onChange={(e) => setProp(pi, 'condicao_pagamento', e.target.value)} placeholder="Ex: 30/60" /></div>

                      <div className="text-xs pt-1 border-t space-y-0.5">
                        <div className="flex justify-between text-muted-foreground"><span>Produtos</span><span>{formatCurrency(subtotal)}</span></div>
                        <div className="flex justify-between font-semibold"><span>Total</span><span className={isWin ? 'text-emerald-700' : ''}>{formatCurrency(total)}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={saving || itens.length === 0}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar Cotação</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}