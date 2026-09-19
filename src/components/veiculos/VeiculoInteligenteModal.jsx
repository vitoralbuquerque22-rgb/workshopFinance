import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Sparkles, Car, ChevronLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { normalizarPlaca, placaValida, formatarPlaca } from '@/lib/placa';
import DuplicadoCard from './DuplicadoCard';
import CamposVeiculo from './CamposVeiculo';

// step: 'busca' | 'duplicado' | 'form'
const emptyForm = { placa: '', combustivel: 'flex', quilometragem: '', origem_dados: 'manual' };

export default function VeiculoInteligenteModal({ open, onOpenChange, clienteId, onSaved }) {
  const { toast } = useToast();
  const [step, setStep] = useState('busca');
  const [placaInput, setPlacaInput] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [vinculando, setVinculando] = useState(false);
  const [duplicado, setDuplicado] = useState(null);
  const [duplicadoInfo, setDuplicadoInfo] = useState({ clienteNome: '', ultimaOs: null });
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) {
      setStep('busca');
      setPlacaInput('');
      setDuplicado(null);
      setForm(emptyForm);
    }
  }, [open]);

  const buscarPlaca = async () => {
    const placa = normalizarPlaca(placaInput);
    if (!placaValida(placa)) {
      toast({ title: 'Placa inválida', description: 'Use o formato ABC1234 ou ABC1D23.', variant: 'destructive' });
      return;
    }
    setBuscando(true);

    // 1. Sempre pesquisar duplicado no banco antes de criar
    const existentes = await base44.entities.Veiculo.filter({ placa });
    if (existentes.length > 0) {
      const veic = existentes[0];
      setDuplicado(veic);
      let clienteNome = '';
      if (veic.cliente_id) {
        const cli = await base44.entities.Cliente.filter({ id: veic.cliente_id });
        clienteNome = cli[0]?.nome || '';
      }
      const oss = await base44.entities.OrdemServico.filter({ veiculo_id: veic.id }, '-created_date', 1);
      setDuplicadoInfo({ clienteNome, ultimaOs: oss[0] || null });
      setStep('duplicado');
      setBuscando(false);
      return;
    }

    // 2. Não existe → consultar integração de placa
    setBuscando(false);
    setConsultando(true);
    let dados = {};
    try {
      const res = await base44.functions.invoke('consultarPlaca', { placa });
      if (res.data && !res.data.error) {
        dados = res.data;
      } else if (res.data?.error) {
        toast({ title: 'Consulta indisponível', description: 'Preencha os dados manualmente.', variant: 'default' });
      }
    } catch {
      toast({ title: 'Consulta indisponível', description: 'Preencha os dados manualmente.' });
    }
    setConsultando(false);

    setForm({
      ...emptyForm,
      placa,
      marca: dados.marca || '',
      modelo: dados.modelo || '',
      versao: dados.versao || '',
      ano: dados.ano || '',
      ano_modelo: dados.ano_modelo || dados.ano || '',
      motorizacao: dados.motorizacao || '',
      cor: dados.cor || '',
      chassi: dados.chassi || '',
      renavam: dados.renavam || '',
      municipio: dados.municipio || '',
      uf: dados.uf || '',
      situacao: dados.situacao || '',
      proprietario_nome: dados.proprietario_nome || '',
      proprietario_documento: dados.proprietario_cpf_cnpj || '',
      origem_dados: dados.marca ? 'consulta_placa' : 'manual',
    });
    setStep('form');
  };

  const vincularExistente = async (veic) => {
    setVinculando(true);
    const historico = veic.historico_clientes || [];
    if (veic.cliente_id && veic.cliente_id !== clienteId) {
      historico.push({ cliente_id: veic.cliente_id, cliente_nome: duplicadoInfo.clienteNome, desvinculado_em: new Date().toISOString() });
    }
    await base44.entities.Veiculo.update(veic.id, { cliente_id: clienteId, historico_clientes: historico });
    setVinculando(false);
    toast({ title: 'Veículo vinculado ao cliente.' });
    onSaved?.({ ...veic, cliente_id: clienteId });
    onOpenChange(false);
  };

  const salvar = async () => {
    setSalvando(true);
    const payload = {
      ...form,
      placa: normalizarPlaca(form.placa),
      cliente_id: clienteId || undefined,
      ano: form.ano ? parseInt(form.ano) : undefined,
      ano_modelo: form.ano_modelo ? parseInt(form.ano_modelo) : undefined,
      quilometragem: form.quilometragem ? parseInt(form.quilometragem) : 0,
      historico_clientes: clienteId ? [{ cliente_id: clienteId, vinculado_em: new Date().toISOString() }] : [],
    };
    const novo = await base44.entities.Veiculo.create(payload);
    setSalvando(false);
    toast({ title: 'Veículo cadastrado com sucesso.' });
    onSaved?.(novo);
    onOpenChange(false);
  };

  const mesmoCliente = duplicado?.cliente_id === clienteId && !!clienteId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" /> Novo Veículo
          </DialogTitle>
        </DialogHeader>

        {step === 'busca' && (
          <div className="space-y-4 py-2">
            <div>
              <Label>Placa do veículo</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  autoFocus
                  value={placaInput}
                  onChange={(e) => setPlacaInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && buscarPlaca()}
                  placeholder="ABC1D23"
                  maxLength={8}
                  className="text-lg font-mono tracking-widest uppercase"
                />
                <Button onClick={buscarPlaca} disabled={buscando || consultando}>
                  {buscando || consultando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span className="ml-1">Buscar</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Digite a placa — buscamos duplicados e preenchemos os dados automaticamente.
              </p>
            </div>
            {consultando && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Consultando dados da placa...
              </p>
            )}
          </div>
        )}

        {step === 'duplicado' && duplicado && (
          <div className="space-y-3 py-2">
            <DuplicadoCard
              veiculo={duplicado}
              clienteNome={duplicadoInfo.clienteNome}
              ultimaOs={duplicadoInfo.ultimaOs}
              vinculando={vinculando}
              mesmoCliente={mesmoCliente}
              onVincular={clienteId ? vincularExistente : null}
              onUsar={onSaved ? (v) => { onSaved(v); onOpenChange(false); } : null}
            />
            <Button variant="ghost" size="sm" onClick={() => setStep('busca')}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Buscar outra placa
            </Button>
          </div>
        )}

        {step === 'form' && (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-bold tracking-widest bg-muted px-3 py-1 rounded">{formatarPlaca(form.placa)}</span>
              {form.origem_dados === 'consulta_placa' && (
                <span className="text-xs text-emerald-600 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Preenchido pela consulta</span>
              )}
            </div>
            <CamposVeiculo form={form} onChange={setForm} />
            {form.proprietario_nome && (
              <p className="text-xs text-muted-foreground">
                Proprietário legal (documento): {form.proprietario_nome} — pode ser diferente do cliente da oficina.
              </p>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep('busca')}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
              <Button onClick={salvar} disabled={salvando}>
                {salvando ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Confirmar cadastro
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}