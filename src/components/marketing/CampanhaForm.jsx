import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PLATAFORMAS } from '@/lib/marketing';

const empty = {
  nome: '', plataforma: 'meta_ads', objetivo: 'leads', id_externo: '',
  utm_campaign: '', investimento: 0, data_inicio: '', data_fim: '', status: 'ativa', observacoes: '',
};

export default function CampanhaForm({ open, onOpenChange, campanha, onSaved }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(campanha ? { ...empty, ...campanha } : empty);
  }, [campanha, open]);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, investimento: Number(form.investimento) || 0 };
      if (campanha?.id) await base44.entities.Campanha.update(campanha.id, payload);
      else await base44.entities.Campanha.create(payload);
      onSaved?.();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{campanha?.id ? 'Editar Campanha' : 'Nova Campanha'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={(e) => set('nome', e.target.value)} required placeholder="Ex: Revisão de Verão - Meta" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Plataforma</Label>
              <Select value={form.plataforma} onValueChange={(v) => set('plataforma', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PLATAFORMAS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Objetivo</Label>
              <Select value={form.objetivo} onValueChange={(v) => set('objetivo', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="leads">Leads</SelectItem>
                  <SelectItem value="conversao">Conversão</SelectItem>
                  <SelectItem value="trafego">Tráfego</SelectItem>
                  <SelectItem value="alcance">Alcance</SelectItem>
                  <SelectItem value="engajamento">Engajamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Investimento (R$)</Label>
              <Input type="number" step="0.01" value={form.investimento} onChange={(e) => set('investimento', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>UTM Campaign</Label>
              <Input value={form.utm_campaign} onChange={(e) => set('utm_campaign', e.target.value)} placeholder="revisao_verao" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Início</Label>
              <Input type="date" value={form.data_inicio || ''} onChange={(e) => set('data_inicio', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Fim</Label>
              <Input type="date" value={form.data_fim || ''} onChange={(e) => set('data_fim', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="pausada">Pausada</SelectItem>
                  <SelectItem value="encerrada">Encerrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>ID Externo</Label>
              <Input value={form.id_externo} onChange={(e) => set('id_externo', e.target.value)} placeholder="ID na plataforma" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => set('observacoes', e.target.value)} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}