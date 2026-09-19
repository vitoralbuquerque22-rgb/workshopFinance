import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import RemuneracaoGuard from '@/components/remuneracao/RemuneracaoGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { BASE_CALCULO_HORAS, getConfig } from '@/lib/remuneracao';
import { Loader2, Save } from 'lucide-react';

export default function RemuneracaoRegras() {
  const { toast } = useToast();
  const [config, setConfig] = useState(getConfig(null));
  const [id, setId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const list = await base44.entities.ConfigRemuneracao.list('-created_date', 1);
      if (list[0]) { setId(list[0].id); setConfig(getConfig(list[0])); }
      setLoading(false);
    })();
  }, []);

  const ch = (f, v) => setConfig((p) => ({ ...p, [f]: v }));

  const salvar = async () => {
    setSaving(true);
    const payload = {
      base_calculo_horas: config.base_calculo_horas,
      comissao_padrao_mao_obra: Number(config.comissao_padrao_mao_obra) || 0,
      comissao_padrao_peca: Number(config.comissao_padrao_peca) || 0,
      peca_gera_comissao_padrao: !!config.peca_gera_comissao_padrao,
      servico_gera_comissao_padrao: !!config.servico_gera_comissao_padrao,
      descontar_retrabalho: !!config.descontar_retrabalho,
      aprovacao_obrigatoria: !!config.aprovacao_obrigatoria,
      observacoes: config.observacoes || '',
    };
    if (id) await base44.entities.ConfigRemuneracao.update(id, payload);
    else { const c = await base44.entities.ConfigRemuneracao.create(payload); setId(c.id); }
    setSaving(false);
    toast({ title: 'Regras salvas', description: 'A política de pagamento foi atualizada.' });
  };

  return (
    <RemuneracaoGuard>
      <PageHeader title="Regras de Pagamento" description="Política global do motor de remuneração — sem alterar código">
        <Button onClick={salvar} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar</Button>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-4 max-w-2xl">
          <Card>
            <CardHeader><CardTitle className="text-sm">Base de cálculo</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Horas usadas no cálculo de comissão</Label>
                <Select value={config.base_calculo_horas} onValueChange={(v) => ch('base_calculo_horas', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(BASE_CALCULO_HORAS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Percentuais padrão</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div><Label>Comissão padrão mão de obra (%)</Label><Input type="number" value={config.comissao_padrao_mao_obra} onChange={(e) => ch('comissao_padrao_mao_obra', e.target.value)} /></div>
              <div><Label>Comissão padrão peça (%)</Label><Input type="number" value={config.comissao_padrao_peca} onChange={(e) => ch('comissao_padrao_peca', e.target.value)} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Comportamento</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-normal">Serviços geram comissão por padrão</Label>
                <Switch checked={config.servico_gera_comissao_padrao} onCheckedChange={(v) => ch('servico_gera_comissao_padrao', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Peças geram comissão por padrão</Label>
                <Switch checked={config.peca_gera_comissao_padrao} onCheckedChange={(v) => ch('peca_gera_comissao_padrao', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Descontar comissão em retrabalho/garantia</Label>
                <Switch checked={config.descontar_retrabalho} onCheckedChange={(v) => ch('descontar_retrabalho', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="font-normal">Exigir aprovação antes do pagamento</Label>
                <Switch checked={config.aprovacao_obrigatoria} onCheckedChange={(v) => ch('aprovacao_obrigatoria', v)} />
              </div>
            </CardContent>
          </Card>

          <div><Label>Observações</Label><Textarea rows={2} value={config.observacoes || ''} onChange={(e) => ch('observacoes', e.target.value)} /></div>
        </div>
      )}
    </RemuneracaoGuard>
  );
}