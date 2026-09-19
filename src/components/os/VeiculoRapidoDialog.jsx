import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Car } from 'lucide-react';
import CamposVeiculo from '@/components/veiculos/CamposVeiculo';
import { normalizarPlaca, placaValida, formatarPlaca } from '@/lib/placa';

const initial = { placa: '', combustivel: 'flex', status: 'ativo' };

// Cadastro rápido de veículo diretamente dentro da Nova OS.
// Consulta a placa (preenchimento automático) OU permite cadastro manual,
// salva e retorna o veículo criado para a OS — sem sair da tela.
export default function VeiculoRapidoDialog({ open, onOpenChange, clienteId, onCreated }) {
  const [form, setForm] = useState(initial);
  const [consultando, setConsultando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const reset = () => { setForm(initial); setErro(''); };

  const consultarPlaca = async () => {
    const placa = normalizarPlaca(form.placa);
    if (!placaValida(placa)) { setErro('Placa inválida.'); return; }
    setErro('');
    setConsultando(true);
    try {
      const res = await base44.functions.invoke('consultarPlaca', { placa });
      const d = res.data || {};
      if (d.error) { setErro(d.error); return; }
      const v = d.veiculo || d;
      setForm((p) => ({
        ...p,
        placa,
        marca: v.marca || p.marca,
        modelo: v.modelo || p.modelo,
        versao: v.versao || p.versao,
        ano: v.ano || p.ano,
        ano_modelo: v.ano_modelo || p.ano_modelo,
        motorizacao: v.motorizacao || p.motorizacao,
        cor: v.cor || p.cor,
        chassi: v.chassi || p.chassi,
        renavam: v.renavam || p.renavam,
        municipio: v.municipio || p.municipio,
        uf: v.uf || p.uf,
        combustivel: v.combustivel || p.combustivel,
        origem_dados: 'consulta_placa',
      }));
    } catch (e) {
      setErro('Não foi possível consultar a placa.');
    } finally {
      setConsultando(false);
    }
  };

  const salvar = async () => {
    if (!placaValida(form.placa)) { setErro('Informe uma placa válida.'); return; }
    setSalvando(true);
    try {
      const veiculo = await base44.entities.Veiculo.create({
        ...form,
        placa: normalizarPlaca(form.placa),
        cliente_id: clienteId,
        ano: form.ano ? parseInt(form.ano) : undefined,
        ano_modelo: form.ano_modelo ? parseInt(form.ano_modelo) : undefined,
        quilometragem: form.quilometragem ? parseInt(form.quilometragem) : 0,
      });
      onCreated(veiculo);
      reset();
      onOpenChange(false);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Car className="w-5 h-5 text-primary" /> Novo Veículo</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label>Placa *</Label>
              <Input
                value={formatarPlaca(form.placa)}
                onChange={(e) => { setForm({ ...form, placa: normalizarPlaca(e.target.value) }); setErro(''); }}
                placeholder="ABC1D23"
                maxLength={8}
              />
            </div>
            <Button variant="outline" onClick={consultarPlaca} disabled={consultando}>
              {consultando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Ler placa
            </Button>
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}

          <CamposVeiculo form={form} onChange={setForm} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando || !form.placa}>
            {salvando && <Loader2 className="w-4 h-4 animate-spin" />} Salvar e usar na OS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}