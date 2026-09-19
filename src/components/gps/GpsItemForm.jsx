import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { X, Plus } from 'lucide-react';

const tipoRespostaLabels = {
  texto: 'Texto',
  sim_nao: 'Sim/Não',
  multipla_escolha: 'Múltipla Escolha',
  numero: 'Número',
  foto: 'Foto',
  video: 'Vídeo',
  audio: 'Áudio',
};

const initialForm = {
  tipo: 'pre_diagnostico', categoria: '', titulo: '', descricao: '', ordem: 0,
  obrigatorio: false, ativo: true, tipo_resposta: 'texto', opcoes: [],
  justificativa: '', objetivo_comercial: '', peso: 0,
  tempo_estimado_min: 0, responsavel: '',
};

export default function GpsItemForm({ open, onClose, onSave, item, modeloId }) {
  const [form, setForm] = useState(initialForm);
  const [novaOpcao, setNovaOpcao] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({ ...initialForm, ...item, opcoes: item.opcoes || [] });
    } else {
      setForm({ ...initialForm, modelo_id: modeloId });
    }
  }, [item, open, modeloId]);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const addOpcao = () => {
    if (!novaOpcao) return;
    set('opcoes', [...(form.opcoes || []), novaOpcao]);
    setNovaOpcao('');
  };

  const removeOpcao = (idx) => set('opcoes', (form.opcoes || []).filter((_, j) => j !== idx));

  const handleSubmit = async () => {
    if (!form.titulo) return;
    setSaving(true);
    try {
      await onSave({ ...form, modelo_id: modeloId });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar Item' : 'Novo Item'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Etapa</Label>
              <Select value={form.tipo} onValueChange={v => set('tipo', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre_diagnostico">Pré-Diagnóstico</SelectItem>
                  <SelectItem value="ppv">PPV</SelectItem>
                  <SelectItem value="checklist">Checklist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Categoria</Label>
              <Input value={form.categoria || ''} onChange={e => set('categoria', e.target.value)} placeholder="Motor, Freios..." />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Título *</Label>
            <Input value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Pastilhas dianteiras" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Descrição</Label>
            <Textarea value={form.descricao || ''} onChange={e => set('descricao', e.target.value)} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tipo de Resposta</Label>
              <Select value={form.tipo_resposta} onValueChange={v => set('tipo_resposta', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(tipoRespostaLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ordem</Label>
              <Input type="number" value={form.ordem || 0} onChange={e => set('ordem', Number(e.target.value))} />
            </div>
          </div>

          {form.tipo_resposta === 'multipla_escolha' && (
            <div className="space-y-2">
              <Label className="text-xs">Opções</Label>
              <div className="flex gap-2">
                <Input value={novaOpcao} onChange={e => setNovaOpcao(e.target.value)} placeholder="Nova opção" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOpcao())} />
                <Button type="button" size="icon" onClick={addOpcao}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {(form.opcoes || []).map((opt, i) => (
                  <span key={i} className="flex items-center gap-1 bg-secondary text-secondary-foreground rounded px-2 py-1 text-xs">
                    {opt}
                    <button onClick={() => removeOpcao(i)}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {form.tipo === 'ppv' && (
            <div className="space-y-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs font-semibold text-amber-800">Campos PPV</p>
              <div className="space-y-1">
                <Label className="text-xs">Justificativa</Label>
                <Textarea value={form.justificativa || ''} onChange={e => set('justificativa', e.target.value)} rows={2} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Objetivo Comercial</Label>
                <Textarea value={form.objetivo_comercial || ''} onChange={e => set('objetivo_comercial', e.target.value)} rows={2} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Peso</Label>
                <Input type="number" value={form.peso || 0} onChange={e => set('peso', Number(e.target.value))} />
              </div>
            </div>
          )}

          {form.tipo === 'checklist' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tempo estimado (min)</Label>
                <Input type="number" value={form.tempo_estimado_min || 0} onChange={e => set('tempo_estimado_min', Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Responsável</Label>
                <Input value={form.responsavel || ''} onChange={e => set('responsavel', e.target.value)} placeholder="Técnico" />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.obrigatorio} onCheckedChange={v => set('obrigatorio', v)} />
              Obrigatório
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.ativo} onCheckedChange={v => set('ativo', v)} />
              Ativo
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.titulo}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}