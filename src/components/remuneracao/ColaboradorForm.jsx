import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TIPO_CONTRATACAO, MODELO_REMUNERACAO } from '@/lib/remuneracao';

const empty = {
  nome: '', cpf: '', email: '', telefone: '', funcao: 'tecnico', cargo_id: '',
  tipo_contratacao: 'clt', modelo_remuneracao: 'salario', salario_base: 0, valor_hora: 0,
  meta_horas_mensal: 0, meta_faturamento_mensal: 0, regra_comissao_id: '',
  comissao_percentual_padrao: 0, descontos_fixos: 0, data_admissao: '', observacoes: '', status: 'ativo',
};

export default function ColaboradorForm({ open, onOpenChange, onSave, editingItem, cargos = [], regras = [] }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    setForm(editingItem ? { ...empty, ...editingItem } : empty);
  }, [editingItem, open]);

  const ch = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  const submit = async () => {
    await onSave({
      ...form,
      salario_base: Number(form.salario_base) || 0,
      valor_hora: Number(form.valor_hora) || 0,
      meta_horas_mensal: Number(form.meta_horas_mensal) || 0,
      meta_faturamento_mensal: Number(form.meta_faturamento_mensal) || 0,
      comissao_percentual_padrao: Number(form.comissao_percentual_padrao) || 0,
      descontos_fixos: Number(form.descontos_fixos) || 0,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editingItem ? 'Editar Colaborador' : 'Novo Colaborador'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nome *</Label><Input value={form.nome} onChange={(e) => ch('nome', e.target.value)} /></div>
            <div><Label>CPF</Label><Input value={form.cpf} onChange={(e) => ch('cpf', e.target.value)} /></div>
            <div><Label>E-mail</Label><Input value={form.email} onChange={(e) => ch('email', e.target.value)} /></div>
            <div><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => ch('telefone', e.target.value)} /></div>
            <div>
              <Label>Função</Label>
              <Select value={form.funcao} onValueChange={(v) => ch('funcao', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="consultor">Consultor</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="administrativo">Administrativo</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cargo</Label>
              <Select value={form.cargo_id || 'none'} onValueChange={(v) => ch('cargo_id', v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {cargos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm font-semibold mb-2">Dados Financeiros</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de contratação</Label>
                <Select value={form.tipo_contratacao} onValueChange={(v) => ch('tipo_contratacao', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_CONTRATACAO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Modelo de remuneração</Label>
                <Select value={form.modelo_remuneracao} onValueChange={(v) => ch('modelo_remuneracao', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(MODELO_REMUNERACAO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Salário base (R$)</Label><Input type="number" value={form.salario_base} onChange={(e) => ch('salario_base', e.target.value)} /></div>
              <div><Label>Valor hora (R$)</Label><Input type="number" value={form.valor_hora} onChange={(e) => ch('valor_hora', e.target.value)} /></div>
              <div>
                <Label>Regra de comissão</Label>
                <Select value={form.regra_comissao_id || 'none'} onValueChange={(v) => ch('regra_comissao_id', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Automática" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Automática (por escopo)</SelectItem>
                    {regras.map((r) => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Descontos fixos (R$)</Label><Input type="number" value={form.descontos_fixos} onChange={(e) => ch('descontos_fixos', e.target.value)} /></div>
              <div><Label>Meta horas/mês</Label><Input type="number" value={form.meta_horas_mensal} onChange={(e) => ch('meta_horas_mensal', e.target.value)} /></div>
              <div><Label>Meta faturamento/mês (R$)</Label><Input type="number" value={form.meta_faturamento_mensal} onChange={(e) => ch('meta_faturamento_mensal', e.target.value)} /></div>
              <div><Label>Data de admissão</Label><Input type="date" value={form.data_admissao} onChange={(e) => ch('data_admissao', e.target.value)} /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => ch('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div><Label>Observações</Label><Textarea rows={2} value={form.observacoes} onChange={(e) => ch('observacoes', e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!form.nome}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}