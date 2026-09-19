import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const marcas = ['Chevrolet', 'Fiat', 'Ford', 'Honda', 'Hyundai', 'Nissan', 'Renault', 'Toyota', 'Volkswagen', 'Jeep', 'Citroën', 'Peugeot', 'Outra'];

export default function CamposVeiculo({ form, onChange }) {
  const set = (field, value) => onChange({ ...form, [field]: value });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <Label>Marca</Label>
          <Select value={form.marca || ''} onValueChange={(v) => set('marca', v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{marcas.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="col-span-1 md:col-span-2"><Label>Modelo</Label><Input value={form.modelo || ''} onChange={(e) => set('modelo', e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="col-span-2 md:col-span-1"><Label>Versão</Label><Input value={form.versao || ''} onChange={(e) => set('versao', e.target.value)} /></div>
        <div><Label>Ano Fab.</Label><Input type="number" value={form.ano || ''} onChange={(e) => set('ano', e.target.value)} /></div>
        <div><Label>Ano Modelo</Label><Input type="number" value={form.ano_modelo || ''} onChange={(e) => set('ano_modelo', e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div><Label>Motorização</Label><Input value={form.motorizacao || ''} onChange={(e) => set('motorizacao', e.target.value)} placeholder="Ex: 1.0 12v" /></div>
        <div>
          <Label>Combustível</Label>
          <Select value={form.combustivel || 'flex'} onValueChange={(v) => set('combustivel', v)}>
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
        <div><Label>Cor</Label><Input value={form.cor || ''} onChange={(e) => set('cor', e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div><Label>RENAVAM</Label><Input value={form.renavam || ''} onChange={(e) => set('renavam', e.target.value)} /></div>
        <div className="col-span-1 md:col-span-2"><Label>Chassi</Label><Input value={form.chassi || ''} onChange={(e) => set('chassi', e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div><Label>Município</Label><Input value={form.municipio || ''} onChange={(e) => set('municipio', e.target.value)} /></div>
        <div><Label>UF</Label><Input value={form.uf || ''} onChange={(e) => set('uf', e.target.value.toUpperCase())} maxLength={2} /></div>
        <div><Label>Quilometragem</Label><Input type="number" value={form.quilometragem || ''} onChange={(e) => set('quilometragem', e.target.value)} /></div>
      </div>

      <div><Label>Observações</Label><Textarea rows={2} value={form.observacoes || ''} onChange={(e) => set('observacoes', e.target.value)} /></div>
    </div>
  );
}