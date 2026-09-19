import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MidiaUpload from './MidiaUpload';
import { TIPOS_FROTA, STATUS_FROTA, proximaManutencao } from '@/lib/patrimonio';

const vazio = {
  nome: '', tipo: 'veiculo', placa: '', marca: '', modelo: '', ano: '', cor: '', renavam: '', chassi: '',
  categoria: '', responsavel_id: '', localizacao: '', quilometragem: 0, valor_compra: 0, data_compra: '',
  status: 'disponivel', observacoes: '',
  documentacao: { licenciamento_vence_em: '', seguro_vence_em: '', seguradora: '' },
  manutencao_preventiva: { ativa: false, intervalo_dias: 0, intervalo_km: 0, ultima_em: '', ultima_km: 0, proxima_em: '', proxima_km: 0 },
  fotos: [], documentos: [],
};

export default function FrotaForm({ open, onOpenChange, onSave, editing, colaboradores = [] }) {
  const [form, setForm] = useState(vazio);

  useEffect(() => {
    if (open) {
      setForm(editing
        ? { ...vazio, ...editing, documentacao: { ...vazio.documentacao, ...(editing.documentacao || {}) }, manutencao_preventiva: { ...vazio.manutencao_preventiva, ...(editing.manutencao_preventiva || {}) } }
        : vazio);
    }
  }, [open, editing]);

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));
  const setDoc = (campo, valor) => setForm((f) => ({ ...f, documentacao: { ...f.documentacao, [campo]: valor } }));
  const setMp = (campo, valor) => setForm((f) => ({ ...f, manutencao_preventiva: { ...f.manutencao_preventiva, [campo]: valor } }));

  const submit = () => {
    const mp = { ...form.manutencao_preventiva };
    mp.proxima_em = proximaManutencao(mp) || '';
    if (mp.ativa && mp.intervalo_km && mp.ultima_km != null) mp.proxima_km = Number(mp.ultima_km) + Number(mp.intervalo_km);
    const resp = colaboradores.find((c) => c.id === form.responsavel_id);
    onSave({ ...form, manutencao_preventiva: mp, responsavel_nome: resp?.nome || '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar' : 'Novo'} ativo da frota</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Nome / identificação *</Label>
            <Input value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Ex: Guincho 01" />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={(v) => set('tipo', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS_FROTA.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Placa</Label>
            <Input value={form.placa} onChange={(e) => set('placa', e.target.value.toUpperCase())} />
          </div>
          <div>
            <Label>Categoria</Label>
            <Input value={form.categoria} onChange={(e) => set('categoria', e.target.value)} placeholder="Ex: Apoio" />
          </div>

          <div>
            <Label>Marca</Label>
            <Input value={form.marca} onChange={(e) => set('marca', e.target.value)} />
          </div>
          <div>
            <Label>Modelo</Label>
            <Input value={form.modelo} onChange={(e) => set('modelo', e.target.value)} />
          </div>

          <div>
            <Label>Ano</Label>
            <Input value={form.ano} onChange={(e) => set('ano', e.target.value)} />
          </div>
          <div>
            <Label>Cor</Label>
            <Input value={form.cor} onChange={(e) => set('cor', e.target.value)} />
          </div>

          <div>
            <Label>Renavam</Label>
            <Input value={form.renavam} onChange={(e) => set('renavam', e.target.value)} />
          </div>
          <div>
            <Label>Chassi</Label>
            <Input value={form.chassi} onChange={(e) => set('chassi', e.target.value)} />
          </div>

          <div>
            <Label>Quilometragem</Label>
            <Input type="number" value={form.quilometragem} onChange={(e) => set('quilometragem', Number(e.target.value))} />
          </div>
          <div>
            <Label>Localização (base)</Label>
            <Input value={form.localizacao} onChange={(e) => set('localizacao', e.target.value)} />
          </div>

          <div>
            <Label>Responsável</Label>
            <Select value={form.responsavel_id || 'nenhum'} onValueChange={(v) => set('responsavel_id', v === 'nenhum' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhum">— Nenhum —</SelectItem>
                {colaboradores.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_FROTA).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Valor de compra (R$)</Label>
            <Input type="number" value={form.valor_compra} onChange={(e) => set('valor_compra', Number(e.target.value))} />
          </div>
          <div>
            <Label>Data de compra</Label>
            <Input type="date" value={form.data_compra || ''} onChange={(e) => set('data_compra', e.target.value)} />
          </div>

          <div className="col-span-2 grid grid-cols-3 gap-3 rounded-lg border border-border p-3">
            <div>
              <Label className="text-xs">Licenciamento vence</Label>
              <Input type="date" value={form.documentacao.licenciamento_vence_em || ''} onChange={(e) => setDoc('licenciamento_vence_em', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Seguro vence</Label>
              <Input type="date" value={form.documentacao.seguro_vence_em || ''} onChange={(e) => setDoc('seguro_vence_em', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Seguradora</Label>
              <Input value={form.documentacao.seguradora} onChange={(e) => setDoc('seguradora', e.target.value)} />
            </div>
          </div>

          <div className="col-span-2 rounded-lg border border-border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="mb-0">Manutenção preventiva</Label>
              <Switch checked={form.manutencao_preventiva.ativa} onCheckedChange={(v) => setMp('ativa', v)} />
            </div>
            {form.manutencao_preventiva.ativa && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Intervalo (dias)</Label>
                  <Input type="number" value={form.manutencao_preventiva.intervalo_dias} onChange={(e) => setMp('intervalo_dias', Number(e.target.value))} />
                </div>
                <div>
                  <Label className="text-xs">Intervalo (km)</Label>
                  <Input type="number" value={form.manutencao_preventiva.intervalo_km} onChange={(e) => setMp('intervalo_km', Number(e.target.value))} />
                </div>
                <div>
                  <Label className="text-xs">Última manutenção</Label>
                  <Input type="date" value={form.manutencao_preventiva.ultima_em || ''} onChange={(e) => setMp('ultima_em', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Km da última</Label>
                  <Input type="number" value={form.manutencao_preventiva.ultima_km} onChange={(e) => setMp('ultima_km', Number(e.target.value))} />
                </div>
              </div>
            )}
          </div>

          <div className="col-span-2">
            <MidiaUpload modo="fotos" label="Fotos" valor={form.fotos} onChange={(v) => set('fotos', v)} />
          </div>
          <div className="col-span-2">
            <MidiaUpload modo="documentos" label="Documentos" valor={form.documentos} onChange={(v) => set('documentos', v)} />
          </div>

          <div className="col-span-2">
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => set('observacoes', e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!form.nome}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}