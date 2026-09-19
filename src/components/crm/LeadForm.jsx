import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { origens } from '@/lib/crmConfig';

const empty = {
  cliente_nome: '',
  nome: '',
  telefone: '',
  email: '',
  placa: '',
  consultor: '',
  origem: 'manual',
  campanha_nome: '',
  utm_source: '',
  utm_campaign: '',
  etapa: 'novo',
  valor_estimado: 0,
  servico_interesse: '',
  proximo_followup: '',
  observacoes: '',
};

export default function LeadForm({ open, onOpenChange, lead, onSaved }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lead) {
      setForm({ ...empty, ...lead });
    } else {
      setForm(empty);
    }
  }, [lead, open]);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        valor_estimado: Number(form.valor_estimado) || 0,
        placa: (form.placa || '').toUpperCase(),
        data_captura: form.data_captura || new Date().toISOString(),
        status: form.etapa === 'ganho' ? 'convertido' : form.etapa === 'perdido' ? 'perdido' : 'novo',
      };
      if (lead?.id) {
        await base44.entities.Lead.update(lead.id, payload);
      } else {
        await base44.entities.Lead.create(payload);
      }
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
          <DialogTitle>{lead?.id ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={form.nome || form.cliente_nome} onChange={(e) => set('nome', e.target.value)} placeholder="Nome do lead" />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.telefone || ''} onChange={(e) => set('telefone', e.target.value)} placeholder="(11) 99999-9999" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input value={form.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Placa</Label>
              <Input value={form.placa} onChange={(e) => set('placa', e.target.value)} placeholder="ABC1D23" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Campanha</Label>
              <Input value={form.campanha_nome || ''} onChange={(e) => set('campanha_nome', e.target.value)} placeholder="Nome da campanha" />
            </div>
            <div className="space-y-1.5">
              <Label>UTM Campaign</Label>
              <Input value={form.utm_campaign || ''} onChange={(e) => set('utm_campaign', e.target.value)} placeholder="utm_campaign" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Consultor</Label>
              <Input value={form.consultor} onChange={(e) => set('consultor', e.target.value)} placeholder="Responsável" />
            </div>
            <div className="space-y-1.5">
              <Label>Valor estimado (R$)</Label>
              <Input type="number" step="0.01" value={form.valor_estimado} onChange={(e) => set('valor_estimado', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Origem</Label>
              <Select value={form.origem} onValueChange={(v) => set('origem', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(origens).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Próximo follow-up</Label>
              <Input type="date" value={form.proximo_followup || ''} onChange={(e) => set('proximo_followup', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Serviço de interesse</Label>
            <Input value={form.servico_interesse} onChange={(e) => set('servico_interesse', e.target.value)} placeholder="Ex: Revisão completa, troca de embreagem..." />
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