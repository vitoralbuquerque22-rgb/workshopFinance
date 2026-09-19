import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';
import { gerarCodigoServicoComposto } from '@/lib/codigos';
import { Plus, Trash2, Clock, Package, Wrench, Calculator } from 'lucide-react';

function calcularValorMaoObra(item) {
  if (!item) return 0;
  if (item.tipo_cobranca === 'hora') {
    return ((Number(item.tempo_estimado_min) || 0) / 60) * (Number(item.valor_hora) || 0);
  }
  return Number(item.valor) || 0;
}

export default function ServicoCompostoForm({ open, onClose, onSave, item, maoObraList, pecasList, servicos = [] }) {
  const [form, setForm] = useState({
    codigo: '', descricao: '', tipo_valor: 'calculado', valor_total: 0,
    itens_mao_obra: [], itens_pecas_sugeridas: [], status: 'ativo',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        codigo: '', descricao: '', tipo_valor: 'calculado', valor_total: 0,
        itens_mao_obra: [], itens_pecas_sugeridas: [], status: 'ativo',
        ...item,
      });
    } else {
      // Novo serviço: gera o código automaticamente (SC-0000).
      setForm({ codigo: gerarCodigoServicoComposto(servicos), descricao: '', tipo_valor: 'calculado', valor_total: 0, itens_mao_obra: [], itens_pecas_sugeridas: [], status: 'ativo' });
    }
  }, [item, open]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const valorCalculado = () => {
    const moTotal = form.itens_mao_obra.reduce((sum, i) => {
      const mo = maoObraList.find(m => m.id === i.mao_obra_id);
      return sum + (mo ? calcularValorMaoObra(mo) * (Number(i.quantidade) || 1) : 0);
    }, 0);
    const pecasTotal = form.itens_pecas_sugeridas.reduce((sum, i) => {
      const p = pecasList.find(p => p.id === i.peca_id);
      return sum + (p ? (Number(p.valor_venda) || 0) * (Number(i.quantidade) || 1) : 0);
    }, 0);
    return moTotal + pecasTotal;
  };

  const valorExibido = form.tipo_valor === 'manual' ? (Number(form.valor_total) || 0) : valorCalculado();

  const addMaoObra = () => setForm(f => ({ ...f, itens_mao_obra: [...f.itens_mao_obra, { mao_obra_id: '', quantidade: 1 }] }));
  const removeMaoObra = (idx) => setForm(f => ({ ...f, itens_mao_obra: f.itens_mao_obra.filter((_, i) => i !== idx) }));
  const updateMaoObra = (idx, field, value) => {
    const itens = [...form.itens_mao_obra];
    itens[idx][field] = value;
    setForm(f => ({ ...f, itens_mao_obra: itens }));
  };

  const addPeca = () => setForm(f => ({ ...f, itens_pecas_sugeridas: [...f.itens_pecas_sugeridas, { peca_id: '', quantidade: 1 }] }));
  const removePeca = (idx) => setForm(f => ({ ...f, itens_pecas_sugeridas: f.itens_pecas_sugeridas.filter((_, i) => i !== idx) }));
  const updatePeca = (idx, field, value) => {
    const itens = [...form.itens_pecas_sugeridas];
    itens[idx][field] = value;
    setForm(f => ({ ...f, itens_pecas_sugeridas: itens }));
  };

  const handleSubmit = async () => {
    if (!form.codigo || !form.descricao) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (form.tipo_valor === 'calculado') {
        payload.valor_total = valorCalculado();
      }
      await onSave(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar Serviço Composto' : 'Novo Serviço Composto'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Código</Label>
              <Input value={form.codigo} onChange={(e) => set('codigo', e.target.value)} placeholder="SC-0001" className="font-mono" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tipo de Valor</Label>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant={form.tipo_valor === 'calculado' ? 'default' : 'outline'} onClick={() => set('tipo_valor', 'calculado')} className="flex-1">
                  <Calculator className="h-3.5 w-3.5" /> Calculado
                </Button>
                <Button type="button" size="sm" variant={form.tipo_valor === 'manual' ? 'default' : 'outline'} onClick={() => set('tipo_valor', 'manual')} className="flex-1">
                  Manual (pacote)
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Descrição *</Label>
            <Input value={form.descricao} onChange={(e) => set('descricao', e.target.value)} placeholder="Revisão completa 10.000 km" />
          </div>

          {/* Mão de Obra */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs flex items-center gap-1"><Wrench className="h-3.5 w-3.5" /> Mão de Obra</Label>
              <Button size="sm" variant="outline" onClick={addMaoObra}><Plus className="h-3.5 w-3.5" /> Item</Button>
            </div>
            <div className="space-y-2">
              {form.itens_mao_obra.length === 0 && <p className="text-xs text-muted-foreground py-2">Nenhum item adicionado.</p>}
              {form.itens_mao_obra.map((item, idx) => {
                const mo = maoObraList.find(m => m.id === item.mao_obra_id);
                const valor = mo ? calcularValorMaoObra(mo) * (Number(item.quantidade) || 1) : 0;
                return (
                  <div key={idx} className="flex items-center gap-2 p-2 border border-border rounded-lg">
                    <select className="flex-1 h-8 text-xs rounded-md border border-input bg-transparent px-2" value={item.mao_obra_id} onChange={(e) => updateMaoObra(idx, 'mao_obra_id', e.target.value)}>
                      <option value="">Selecione...</option>
                      {maoObraList.map(m => <option key={m.id} value={m.id}>{m.codigo} - {m.descricao}</option>)}
                    </select>
                    <Input className="w-16 h-8 text-xs" type="number" min="1" value={item.quantidade} onChange={(e) => updateMaoObra(idx, 'quantidade', Number(e.target.value))} />
                    <span className="text-xs font-medium w-20 text-right">{formatCurrency(valor)}</span>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeMaoObra(idx)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Peças Sugeridas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs flex items-center gap-1"><Package className="h-3.5 w-3.5" /> Peças Sugeridas</Label>
              <Button size="sm" variant="outline" onClick={addPeca}><Plus className="h-3.5 w-3.5" /> Item</Button>
            </div>
            <div className="space-y-2">
              {form.itens_pecas_sugeridas.length === 0 && <p className="text-xs text-muted-foreground py-2">Nenhuma peça sugerida.</p>}
              {form.itens_pecas_sugeridas.map((item, idx) => {
                const p = pecasList.find(p => p.id === item.peca_id);
                const valor = p ? (Number(p.valor_venda) || 0) * (Number(item.quantidade) || 1) : 0;
                return (
                  <div key={idx} className="flex items-center gap-2 p-2 border border-border rounded-lg">
                    <select className="flex-1 h-8 text-xs rounded-md border border-input bg-transparent px-2" value={item.peca_id} onChange={(e) => updatePeca(idx, 'peca_id', e.target.value)}>
                      <option value="">Selecione...</option>
                      {pecasList.map(p => <option key={p.id} value={p.id}>{p.codigo} - {p.descricao}</option>)}
                    </select>
                    <Input className="w-16 h-8 text-xs" type="number" min="1" value={item.quantidade} onChange={(e) => updatePeca(idx, 'quantidade', Number(e.target.value))} />
                    <span className="text-xs font-medium w-20 text-right">{formatCurrency(valor)}</span>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removePeca(idx)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2">
              {form.tipo_valor === 'manual' ? (
                <Input type="number" step="0.01" className="w-32" value={form.valor_total} onChange={(e) => set('valor_total', Number(e.target.value))} />
              ) : (
                <Badge variant="secondary" className="text-sm">
                  Calculado: {formatCurrency(valorCalculado())}
                </Badge>
              )}
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Valor Total: </span>
              <strong className="text-primary text-lg">{formatCurrency(valorExibido)}</strong>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.codigo || !form.descricao}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}