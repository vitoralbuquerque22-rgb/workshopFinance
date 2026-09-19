import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';
import { gerarCodigoMaoObra } from '@/lib/codigos';
import { Clock, DollarSign, Info, FileText } from 'lucide-react';

const categorias = [
  { value: 'mecanica', label: 'Mecânica' },
  { value: 'eletrica', label: 'Elétrica' },
  { value: 'funilaria', label: 'Funilaria' },
  { value: 'pintura', label: 'Pintura' },
  { value: 'alinhamento', label: 'Alinhamento/Balanceamento' },
  { value: 'diagnostico', label: 'Diagnóstico' },
  { value: 'hidraulica', label: 'Hidráulica' },
  { value: 'outros', label: 'Outros' },
];

const initialForm = {
  codigo: '', descricao: '', categoria: 'mecanica',
  tempo_estimado_min: 0, tipo_cobranca: 'fixo',
  valor: 0, valor_hora: 0, centro_custo_id: '', status: 'ativo',
  aliquota_iss: 0, item_lista_servicos: '',
};

export default function MaoObraForm({ open, onClose, onSave, item, centrosCusto, maoObras = [] }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({ ...initialForm, ...item });
    } else {
      // Novo item: gera o código pela categoria inicial (ex: MEC-0001).
      setForm({ ...initialForm, codigo: gerarCodigoMaoObra(maoObras, initialForm.categoria) });
    }
  }, [item, open]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  // Ao trocar a categoria de um item novo, regenera o código com o novo prefixo.
  const setCategoria = (categoria) => setForm(f => ({
    ...f,
    categoria,
    codigo: item ? f.codigo : gerarCodigoMaoObra(maoObras, categoria),
  }));

  const valorCalculado = () => {
    if (form.tipo_cobranca === 'hora') {
      const horas = (Number(form.tempo_estimado_min) || 0) / 60;
      return horas * (Number(form.valor_hora) || 0);
    }
    return Number(form.valor) || 0;
  };

  const handleSubmit = async () => {
    if (!form.codigo || !form.descricao) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar Mão de Obra' : 'Nova Mão de Obra'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Código</Label>
              <Input value={form.codigo} onChange={(e) => set('codigo', e.target.value)} placeholder="MEC-0001" className="font-mono" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Categoria</Label>
              <Select value={form.categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categorias.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Descrição *</Label>
            <Input value={form.descricao} onChange={(e) => set('descricao', e.target.value)} placeholder="Troca de óleo" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Tempo Estimado (minutos)</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" type="number" min="0" value={form.tempo_estimado_min} onChange={(e) => set('tempo_estimado_min', Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Tipo de Cobrança</Label>
            <Select value={form.tipo_cobranca} onValueChange={(v) => set('tipo_cobranca', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fixo">Preço Fixo (flat rate)</SelectItem>
                <SelectItem value="hora">Por Hora (tempo × valor/hora)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.tipo_cobranca === 'fixo' ? (
            <div className="space-y-1">
              <Label className="text-xs">Valor (R$)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" type="number" step="0.01" min="0" value={form.valor} onChange={(e) => set('valor', Number(e.target.value))} />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <Label className="text-xs">Valor/Hora (R$)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" type="number" step="0.01" min="0" value={form.valor_hora} onChange={(e) => set('valor_hora', Number(e.target.value))} />
              </div>
            </div>
          )}

          {form.tempo_estimado_min > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-primary/5 border border-primary/20">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <div className="text-sm">
                <span className="text-muted-foreground">Valor calculado: </span>
                <Badge variant="secondary" className="ml-1 font-bold">{formatCurrency(valorCalculado())}</Badge>
                {form.tipo_cobranca === 'hora' && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({form.tempo_estimado_min}min × {formatCurrency(form.valor_hora || 0)}/h)
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="border-t border-border pt-3 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> Dados Fiscais — ISS (NF de Serviço)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Alíquota ISS (%)</Label>
                <Input type="number" step="0.01" min="0" max="100" value={form.aliquota_iss} onChange={(e) => set('aliquota_iss', Number(e.target.value))} placeholder="2 a 5" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Item Lista de Serviços (LC 116/2003)</Label>
                <Input value={form.item_lista_servicos} onChange={(e) => set('item_lista_servicos', e.target.value)} placeholder="14.01" />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Centro de Custo</Label>
            <Select value={form.centro_custo_id || 'none'} onValueChange={(v) => set('centro_custo_id', v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {centrosCusto.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
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