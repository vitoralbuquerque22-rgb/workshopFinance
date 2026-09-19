import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Save, DollarSign, Gauge, Clock, Coins } from 'lucide-react';

export default function ConfigCustosOperacionais() {
  const { toast } = useToast();
  const [config, setConfig] = useState(null);
  const [centros, setCentros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    (async () => {
      const [lista, cc] = await Promise.all([
        base44.entities.ConfigCustoOperacional.list('-created_date', 1).catch(() => []),
        base44.entities.CentroCusto.filter({ tipo: 'despesa' }, 'nome', 200).catch(() => []),
      ]);
      setCentros(cc);
      setConfig(lista[0] || {
        ativo: true, valor_km: 0, valor_hora: 0, valor_pedagio: 0,
        valor_alimentacao: 0, valor_hospedagem: 0, gerar_conta_pagar: false, centro_custo_id: '', observacoes: '',
      });
      setCarregando(false);
    })();
  }, []);

  const set = (campo, valor) => setConfig((c) => ({ ...c, [campo]: valor }));
  const setNum = (campo, valor) => set(campo, parseFloat(valor) || 0);

  const salvar = async () => {
    setSalvando(true);
    try {
      const payload = {
        ativo: config.ativo !== false,
        valor_km: config.valor_km || 0,
        valor_hora: config.valor_hora || 0,
        valor_pedagio: config.valor_pedagio || 0,
        valor_alimentacao: config.valor_alimentacao || 0,
        valor_hospedagem: config.valor_hospedagem || 0,
        gerar_conta_pagar: !!config.gerar_conta_pagar,
        centro_custo_id: config.centro_custo_id || '',
        observacoes: config.observacoes || '',
      };
      if (config.id) await base44.entities.ConfigCustoOperacional.update(config.id, payload);
      else {
        const criada = await base44.entities.ConfigCustoOperacional.create(payload);
        setConfig(criada);
      }
      toast({ title: 'Configuração salva', description: 'Os custos operacionais foram atualizados.' });
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    }
    setSalvando(false);
  };

  if (carregando) {
    return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  const campoValor = (campo, label, icon, hint) => (
    <div>
      <Label className="flex items-center gap-1.5 text-sm">{icon}{label}</Label>
      <div className="relative mt-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
        <Input type="number" min="0" step="0.01" className="pl-9" value={config[campo] || ''} onChange={(e) => setNum(campo, e.target.value)} />
      </div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Configuração de Custos" description="Defina os valores usados para calcular o custo da operação externa.">
        <Button onClick={salvar} disabled={salvando}><Save className="w-4 h-4 mr-2" />{salvando ? 'Salvando...' : 'Salvar'}</Button>
      </PageHeader>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" />Valores base</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          {campoValor('valor_km', 'Valor por KM', <Gauge className="w-4 h-4 text-muted-foreground" />, 'Combustível + desgaste, por km rodado.')}
          {campoValor('valor_hora', 'Valor por Hora', <Clock className="w-4 h-4 text-muted-foreground" />, 'Custo/hora de cada pessoa da equipe em campo.')}
          {campoValor('valor_pedagio', 'Pedágio', <Coins className="w-4 h-4 text-muted-foreground" />, 'Valor padrão por atendimento.')}
          {campoValor('valor_alimentacao', 'Alimentação', <Coins className="w-4 h-4 text-muted-foreground" />, 'Valor padrão por atendimento.')}
          {campoValor('valor_hospedagem', 'Hospedagem', <Coins className="w-4 h-4 text-muted-foreground" />, 'Valor padrão quando há pernoite.')}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Integração financeira</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Gerar Conta a Pagar automática</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Ao calcular os custos de um atendimento, lança o custo total no financeiro.</p>
            </div>
            <Switch checked={!!config.gerar_conta_pagar} onCheckedChange={(v) => set('gerar_conta_pagar', v)} />
          </div>
          {config.gerar_conta_pagar && (
            <div>
              <Label>Centro de custo</Label>
              <Select value={config.centro_custo_id || 'nenhum'} onValueChange={(v) => set('centro_custo_id', v === 'nenhum' ? '' : v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Nenhum</SelectItem>
                  {centros.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}