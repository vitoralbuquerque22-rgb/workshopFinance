import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Sparkles, User, ChevronLeft, AlertCircle, Building2, Car } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import CamposCliente from './CamposCliente';
import DuplicadoClienteCard from './DuplicadoClienteCard';
import VeiculoInteligenteModal from '@/components/veiculos/VeiculoInteligenteModal';

const soDigitos = (v) => String(v || '').replace(/\D/g, '');
const emptyForm = { tipo_pessoa: 'fisica', tipo_cliente: 'particular', status: 'ativo', origem_dados: 'manual', socios: [] };

// Fluxo inteligente: escolha PF/PJ → documento → duplicados → consulta API → edição → salvar → veículo.
export default function ClienteInteligenteModal({ open, onOpenChange, onSaved, ofertarVeiculo = true }) {
  const { toast } = useToast();
  const [step, setStep] = useState('tipo'); // tipo | busca | duplicado | form
  const [tipoPessoa, setTipoPessoa] = useState('fisica');
  const [docInput, setDocInput] = useState('');
  const [consultando, setConsultando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [usando, setUsando] = useState(false);
  const [duplicado, setDuplicado] = useState(null);
  const [duplicadoInfo, setDuplicadoInfo] = useState({ ultimaOs: null, ultimoVeiculo: null });
  const [form, setForm] = useState(emptyForm);
  const [erro, setErro] = useState('');
  const [preenchidoApi, setPreenchidoApi] = useState(false);
  const [veiculoModal, setVeiculoModal] = useState({ open: false, clienteId: null });

  useEffect(() => {
    if (open) {
      setStep('tipo'); setTipoPessoa('fisica'); setDocInput('');
      setDuplicado(null); setForm(emptyForm); setErro(''); setPreenchidoApi(false);
    }
  }, [open]);

  const escolherTipo = (tp) => {
    setTipoPessoa(tp);
    setForm({ ...emptyForm, tipo_pessoa: tp, tipo_cliente: tp === 'juridica' ? 'empresa' : 'particular' });
    setStep('busca');
  };

  const carregarInfoDuplicado = async (cliente) => {
    const [veics, oss] = await Promise.all([
      base44.entities.Veiculo.filter({ cliente_id: cliente.id }, '-created_date', 1),
      base44.entities.OrdemServico.filter({ cliente_id: cliente.id }, '-created_date', 1),
    ]);
    setDuplicadoInfo({ ultimaOs: oss[0] || null, ultimoVeiculo: veics[0] || null });
  };

  const buscar = async () => {
    setErro('');
    const doc = soDigitos(docInput);
    const isCnpj = tipoPessoa === 'juridica';
    if ((isCnpj && doc.length !== 14) || (!isCnpj && doc.length !== 11)) {
      setErro(isCnpj ? 'Informe um CNPJ com 14 dígitos.' : 'Informe um CPF com 11 dígitos.');
      return;
    }
    setConsultando(true);

    // 1. Sempre verificar duplicidade antes de qualquer coisa
    const campo = isCnpj ? 'cnpj' : 'cpf';
    const existentes = await base44.entities.Cliente.filter({ [campo]: doc }).catch(() => []);
    if (existentes.length > 0) {
      setDuplicado(existentes[0]);
      await carregarInfoDuplicado(existentes[0]);
      setConsultando(false);
      setStep('duplicado');
      return;
    }

    // 2. Consultar a API de cadastro automático
    let dados = null;
    try {
      const res = await base44.functions.invoke('consultarDocumento', { tipo: campo, documento: doc });
      if (res.data?.dados) { dados = res.data.dados; }
      else if (res.data?.error) {
        setErro(res.data.error);
        toast({ title: 'Consulta automática indisponível', description: 'Preencha os dados manualmente.', variant: 'default' });
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'A consulta automática não pôde ser realizada.';
      setErro(msg);
      toast({ title: 'Consulta automática indisponível', description: 'Preencha os dados manualmente.', variant: 'default' });
    }
    setConsultando(false);

    setPreenchidoApi(!!dados);
    setForm({
      ...emptyForm,
      tipo_pessoa: tipoPessoa,
      tipo_cliente: isCnpj ? 'empresa' : 'particular',
      [campo]: doc,
      ...(dados || {}),
    });
    setStep('form');
  };

  const usarExistente = async (cliente) => {
    setUsando(true);
    onSaved?.(cliente);
    setUsando(false);
    onOpenChange(false);
    if (ofertarVeiculo) setVeiculoModal({ open: true, clienteId: cliente.id });
  };

  const montarEndereco = (f) => [f.logradouro, f.numero, f.complemento, f.bairro, f.cidade, f.uf].filter(Boolean).join(', ');

  const salvar = async () => {
    if (!form.nome) { setErro('Informe ao menos o nome.'); return; }
    setSalvando(true);
    const payload = { ...form, endereco: montarEndereco(form), ultima_consulta_em: preenchidoApi ? new Date().toISOString() : undefined };
    const novo = await base44.entities.Cliente.create(payload);
    setSalvando(false);
    toast({ title: 'Cliente cadastrado com sucesso.' });
    onSaved?.(novo);
    onOpenChange(false);
    if (ofertarVeiculo) setVeiculoModal({ open: true, clienteId: novo.id });
  };

  const isCnpj = tipoPessoa === 'juridica';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Novo Cliente</DialogTitle>
          </DialogHeader>

          {step === 'tipo' && (
            <div className="grid grid-cols-2 gap-3 py-4">
              <button onClick={() => escolherTipo('fisica')} className="flex flex-col items-center gap-2 p-6 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
                <User className="w-8 h-8 text-primary" />
                <span className="font-medium">Pessoa Física</span>
                <span className="text-xs text-muted-foreground">Consulta por CPF</span>
              </button>
              <button onClick={() => escolherTipo('juridica')} className="flex flex-col items-center gap-2 p-6 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
                <Building2 className="w-8 h-8 text-primary" />
                <span className="font-medium">Pessoa Jurídica</span>
                <span className="text-xs text-muted-foreground">Consulta por CNPJ</span>
              </button>
            </div>
          )}

          {step === 'busca' && (
            <div className="space-y-4 py-2">
              <div>
                <Label>{isCnpj ? 'CNPJ' : 'CPF'}</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    autoFocus
                    value={docInput}
                    onChange={(e) => setDocInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && buscar()}
                    onBlur={() => { if (soDigitos(docInput).length === (isCnpj ? 14 : 11)) buscar(); }}
                    placeholder={isCnpj ? '00.000.000/0000-00' : '000.000.000-00'}
                    className="text-lg font-mono tracking-wide"
                  />
                  <Button onClick={buscar} disabled={consultando}>
                    {consultando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span className="ml-1">Buscar</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Digite o documento — verificamos duplicados e preenchemos o cadastro automaticamente.
                </p>
              </div>
              {erro && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-4 h-4" />{erro}</p>}
              {consultando && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Consultando dados...</p>}
              <Button variant="ghost" size="sm" onClick={() => setStep('tipo')}><ChevronLeft className="w-4 h-4 mr-1" /> Trocar tipo</Button>
            </div>
          )}

          {step === 'duplicado' && duplicado && (
            <div className="space-y-3 py-2">
              <DuplicadoClienteCard cliente={duplicado} info={duplicadoInfo} usando={usando} onUsar={usarExistente} />
              <Button variant="ghost" size="sm" onClick={() => setStep('busca')}><ChevronLeft className="w-4 h-4 mr-1" /> Buscar outro</Button>
            </div>
          )}

          {step === 'form' && (
            <div className="space-y-3 py-2">
              {preenchidoApi ? (
                <p className="text-xs text-emerald-600 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Dados preenchidos pela consulta — revise e edite se necessário.</p>
              ) : (
                <p className="text-xs text-amber-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Consulta indisponível — preencha manualmente.</p>
              )}
              <CamposCliente form={form} onChange={setForm} />
              {erro && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-4 h-4" />{erro}</p>}
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setStep('busca')}><ChevronLeft className="w-4 h-4 mr-1" /> Voltar</Button>
                <Button onClick={salvar} disabled={salvando || !form.nome}>
                  {salvando ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Salvar {ofertarVeiculo ? 'e adicionar veículo' : 'cliente'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <VeiculoInteligenteModal
        open={veiculoModal.open}
        onOpenChange={(v) => setVeiculoModal({ ...veiculoModal, open: v })}
        clienteId={veiculoModal.clienteId}
        onSaved={() => onSaved?.()}
      />
    </>
  );
}