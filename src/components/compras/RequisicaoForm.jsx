import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Plus, Trash2, Loader2 } from 'lucide-react';

const emptyItem = { peca_id: '', descricao: '', quantidade: 1, unidade: 'UN' };
const initial = { solicitante: '', solicitante_id: '', ordem_servico_id: '', os_numero: '', cliente_id: '', cliente_nome: '', prioridade: 'media', justificativa: '', data_necessidade: '', itens: [{ ...emptyItem }] };

export default function RequisicaoForm({ open, onClose, onSave, requisicao, pecas, usuarios = [], ordens = [], clientes = [] }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(requisicao ? { ...initial, ...requisicao, itens: requisicao.itens?.length ? requisicao.itens : [{ ...emptyItem }] } : initial);
  }, [open, requisicao]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Vincula solicitante (usuário do sistema) preenchendo id + nome.
  const pickSolicitante = (id) => {
    const u = usuarios.find((x) => x.id === id);
    setForm((f) => ({ ...f, solicitante_id: id, solicitante: u?.full_name || u?.email || f.solicitante }));
  };
  // Vincula OS preenchendo id + número.
  const pickOs = (id) => {
    const os = ordens.find((x) => x.id === id);
    setForm((f) => ({ ...f, ordem_servico_id: id, os_numero: os?.numero || '' }));
  };
  // Vincula cliente preenchendo id + nome.
  const pickCliente = (id) => {
    const c = clientes.find((x) => x.id === id);
    setForm((f) => ({ ...f, cliente_id: id, cliente_nome: c?.nome || '' }));
  };
  const clienteNomeById = (id) => clientes.find((c) => c.id === id)?.nome || id;
  const setItem = (i, k, v) => setForm((f) => ({ ...f, itens: f.itens.map((it, idx) => idx === i ? { ...it, [k]: v } : it) }));
  const addItem = () => setForm((f) => ({ ...f, itens: [...f.itens, { ...emptyItem }] }));
  const rmItem = (i) => setForm((f) => ({ ...f, itens: f.itens.filter((_, idx) => idx !== i) }));

  const pickPeca = (i, id) => {
    const p = pecas.find((x) => x.id === id);
    setForm((f) => ({ ...f, itens: f.itens.map((it, idx) => idx === i ? { ...it, peca_id: id, descricao: p?.descricao || it.descricao, unidade: p?.unidade || it.unidade } : it) }));
  };

  const submit = async () => {
    setSaving(true);
    try {
      const payload = { ...form, itens: form.itens.filter((i) => i.descricao) };
      if (requisicao?.id) await base44.entities.Requisicao.update(requisicao.id, payload);
      else await base44.entities.Requisicao.create({ ...payload, status: 'solicitada' });
      onSave();
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{requisicao ? 'Editar' : 'Nova'} Solicitação de Compra</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Solicitante</Label>
              <Select value={form.solicitante_id || 'none'} onValueChange={(v) => v === 'none' ? setForm((f) => ({ ...f, solicitante_id: '', solicitante: '' })) : pickSolicitante(v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar usuário..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não informado</SelectItem>
                  {usuarios.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Prioridade</Label>
              <Select value={form.prioridade} onValueChange={(v) => set('prioridade', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Vincular Ordem de Serviço</Label>
              <Select value={form.ordem_servico_id || 'none'} onValueChange={(v) => v === 'none' ? setForm((f) => ({ ...f, ordem_servico_id: '', os_numero: '' })) : pickOs(v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar OS..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {ordens.map((os) => <SelectItem key={os.id} value={os.id}>{os.numero || os.id.slice(-5)} · {clienteNomeById(os.cliente_id)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Vincular Cliente</Label>
              <Select value={form.cliente_id || 'none'} onValueChange={(v) => v === 'none' ? setForm((f) => ({ ...f, cliente_id: '', cliente_nome: '' })) : pickCliente(v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar cliente..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1"><Label className="text-xs">Data de Necessidade</Label><Input type="date" value={form.data_necessidade || ''} onChange={(e) => set('data_necessidade', e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">Justificativa</Label><Textarea rows={2} value={form.justificativa} onChange={(e) => set('justificativa', e.target.value)} /></div>

          <div className="flex items-center justify-between pt-2">
            <Label className="text-sm font-medium">Itens</Label>
            <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4" /> Item</Button>
          </div>
          {form.itens.map((it, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end border rounded-lg p-2">
              <div className="col-span-5 space-y-1">
                <Label className="text-[10px] text-muted-foreground">Peça (catálogo) ou descrição livre</Label>
                <Select value={it.peca_id || 'none'} onValueChange={(v) => v === 'none' ? setItem(i, 'peca_id', '') : pickPeca(i, v)}>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Livre</SelectItem>
                    {pecas.map((p) => <SelectItem key={p.id} value={p.id}>{p.codigo} - {p.descricao}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-4 space-y-1"><Input value={it.descricao} onChange={(e) => setItem(i, 'descricao', e.target.value)} placeholder="Descrição" /></div>
              <div className="col-span-2 space-y-1"><Input type="number" step="0.01" value={it.quantidade} onChange={(e) => setItem(i, 'quantidade', Number(e.target.value))} placeholder="Qtd" /></div>
              <div className="col-span-1"><Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => rmItem(i)}><Trash2 className="h-4 w-4" /></Button></div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}