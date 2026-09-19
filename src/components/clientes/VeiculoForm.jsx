import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const marcas = ['Chevrolet', 'Fiat', 'Ford', 'Honda', 'Hyundai', 'Nissan', 'Renault', 'Toyota', 'Volkswagen', 'Jeep', 'Citroën', 'Peugeot', 'Outra'];

const initialForm = {
  placa: '',
  renavam: '',
  marca: '',
  modelo: '',
  ano: '',
  cor: '',
  chassi: '',
  combustivel: 'flex',
  quilometragem: '',
  observacoes: '',
  status: 'ativo',
};

export default function VeiculoForm({ open, onOpenChange, onSave, editingItem, clienteId }) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    setForm(editingItem || { ...initialForm, cliente_id: clienteId });
  }, [editingItem, open, clienteId]);

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleSubmit = async () => {
    await onSave({
      ...form,
      ano: form.ano ? parseInt(form.ano) : undefined,
      quilometragem: form.quilometragem ? parseInt(form.quilometragem) : 0,
    });
    setForm(initialForm);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setForm(initialForm); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Editar Veículo' : 'Novo Veículo'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Placa *</Label><Input value={form.placa} onChange={(e) => handleChange('placa', e.target.value.toUpperCase())} maxLength={8} /></div>
            <div><Label>RENAVAM</Label><Input value={form.renavam} onChange={(e) => handleChange('renavam', e.target.value)} /></div>
            <div><Label>Ano</Label><Input type="number" value={form.ano} onChange={(e) => handleChange('ano', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Marca</Label>
              <Select value={form.marca} onValueChange={(v) => handleChange('marca', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {marcas.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Modelo</Label><Input value={form.modelo} onChange={(e) => handleChange('modelo', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Cor</Label><Input value={form.cor} onChange={(e) => handleChange('cor', e.target.value)} /></div>
            <div><Label>Chassi</Label><Input value={form.chassi} onChange={(e) => handleChange('chassi', e.target.value)} /></div>
            <div>
              <Label>Combustível</Label>
              <Select value={form.combustivel} onValueChange={(v) => handleChange('combustivel', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasolina">Gasolina</SelectItem>
                  <SelectItem value="etanol">Etanol</SelectItem>
                  <SelectItem value="flex">Flex</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="eletrico">Elétrico</SelectItem>
                  <SelectItem value="hibrido">Híbrido</SelectItem>
                  <SelectItem value="gnv">GNV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Quilometragem Atual</Label><Input type="number" value={form.quilometragem} onChange={(e) => handleChange('quilometragem', e.target.value)} /></div>
          <div><Label>Observações</Label><Textarea rows={2} value={form.observacoes} onChange={(e) => handleChange('observacoes', e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!form.placa}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}