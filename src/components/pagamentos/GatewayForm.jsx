import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, Landmark } from 'lucide-react';

const PROVEDORES = [
  { value: 'asaas', label: 'Asaas' },
  { value: 'mercado_pago', label: 'Mercado Pago (split/marketplace)' },
  { value: 'banco_inter', label: 'Banco Inter' },
  { value: 'gerencianet', label: 'Gerencianet (Efí)' },
  { value: 'outro', label: 'Outro' },
];

const emptySplit = {
  habilitado: false, modalidade: 'link', marketplace_id: '',
  taxa_marketplace_percentual: 0, point_device_id: '',
};

const emptyForm = {
  provedor: 'asaas', nome_exibicao: '', ambiente: 'homologacao', ativo: true,
  api_key: '', client_id: '', client_secret: '', carteira: '', conta_bancaria_id: '',
  juros_mes: 0, multa_percentual: 0, dias_vencimento_padrao: 3, observacoes: '',
  split: { ...emptySplit },
};

export default function GatewayForm({ gateway, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [contas, setContas] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.entities.ContaBancaria.list().then(setContas).catch(() => setContas([]));
  }, []);

  useEffect(() => {
    if (gateway) setForm({ ...emptyForm, ...gateway, split: { ...emptySplit, ...(gateway.split || {}) } });
  }, [gateway]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setSplit = (patch) => setForm((f) => ({ ...f, split: { ...f.split, ...patch } }));

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    const payload = {
      ...form,
      juros_mes: parseFloat(form.juros_mes) || 0,
      multa_percentual: parseFloat(form.multa_percentual) || 0,
      dias_vencimento_padrao: parseInt(form.dias_vencimento_padrao) || 3,
      split: {
        ...form.split,
        taxa_marketplace_percentual: parseFloat(form.split.taxa_marketplace_percentual) || 0,
      },
    };
    if (gateway?.id) await base44.entities.GatewayPagamento.update(gateway.id, payload);
    else await base44.entities.GatewayPagamento.create(payload);
    setSaving(false); setSaved(true);
    onSaved?.();
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Landmark className="w-5 h-5 text-primary" /> Gateway de Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Provedor</Label>
            <Select value={form.provedor} onValueChange={(v) => set('provedor', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROVEDORES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nome de Exibição</Label>
            <Input value={form.nome_exibicao} onChange={(e) => set('nome_exibicao', e.target.value)} placeholder="Ex: Asaas Matriz" />
          </div>
        </div>

        <div>
          <Label>{form.provedor === 'mercado_pago' ? 'Access Token do Marketplace' : 'Chave de API / Token'}</Label>
          <Input type="password" value={form.api_key} onChange={(e) => set('api_key', e.target.value)} placeholder={form.provedor === 'mercado_pago' ? 'APP_USR-... (Access Token do Mercado Pago)' : 'Token fornecido pelo provedor'} />
          <p className="text-[11px] text-muted-foreground mt-1">
            {form.provedor === 'mercado_pago'
              ? 'Access Token do marketplace (dono do split). Sem token, as cobranças são geradas em modo simulado para testes.'
              : 'Sem token, o sistema gera boletos em modo simulado (sandbox) para testes.'}
          </p>
        </div>

        {form.provedor === 'mercado_pago' && (
          <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Split entre CNPJs (marketplace)</p>
                <p className="text-xs text-muted-foreground">Uma cobrança única, dividida automaticamente entre os recebedores</p>
              </div>
              <Switch checked={form.split.habilitado} onCheckedChange={(v) => setSplit({ habilitado: v })} />
            </div>
            {form.split.habilitado && (
              <>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Modalidade de cobrança</Label>
                    <Select value={form.split.modalidade} onValueChange={(v) => setSplit({ modalidade: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="link">Link de pagamento (Checkout Pro)</SelectItem>
                        <SelectItem value="qr_checkout">QR dinâmico (Checkout)</SelectItem>
                        <SelectItem value="qr_point">QR na maquininha (Point)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground mt-1">A maquininha física comum não divide sozinha — o split mora na API.</p>
                  </div>
                  <div>
                    <Label>Application ID do marketplace</Label>
                    <Input value={form.split.marketplace_id} onChange={(e) => setSplit({ marketplace_id: e.target.value })} placeholder="ID do app no Mercado Pago" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Taxa do marketplace (%)</Label>
                    <Input type="number" step="0.01" value={form.split.taxa_marketplace_percentual} onChange={(e) => setSplit({ taxa_marketplace_percentual: e.target.value })} placeholder="0" />
                    <p className="text-[11px] text-muted-foreground mt-1">Comissão retida antes de dividir entre os CNPJs.</p>
                  </div>
                  {form.split.modalidade === 'qr_point' && (
                    <div>
                      <Label>ID do dispositivo Point</Label>
                      <Input value={form.split.point_device_id} onChange={(e) => setSplit({ point_device_id: e.target.value })} placeholder="Device ID da maquininha" />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {(form.provedor === 'banco_inter' || form.provedor === 'gerencianet') && (
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Client ID</Label>
              <Input value={form.client_id} onChange={(e) => set('client_id', e.target.value)} />
            </div>
            <div>
              <Label>Client Secret</Label>
              <Input type="password" value={form.client_secret} onChange={(e) => set('client_secret', e.target.value)} />
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Ambiente</Label>
            <Select value={form.ambiente} onValueChange={(v) => set('ambiente', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="homologacao">Homologação (sandbox)</SelectItem>
                <SelectItem value="producao">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Carteira / Convênio</Label>
            <Input value={form.carteira} onChange={(e) => set('carteira', e.target.value)} />
          </div>
        </div>

        <div>
          <Label>Conta Bancária de Conciliação</Label>
          <Select value={form.conta_bancaria_id || 'none'} onValueChange={(v) => set('conta_bancaria_id', v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {contas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome || c.banco || c.id}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <Label>Juros/mês (%)</Label>
            <Input type="number" step="0.01" value={form.juros_mes} onChange={(e) => set('juros_mes', e.target.value)} />
          </div>
          <div>
            <Label>Multa (%)</Label>
            <Input type="number" step="0.01" value={form.multa_percentual} onChange={(e) => set('multa_percentual', e.target.value)} />
          </div>
          <div>
            <Label>Venc. padrão (dias)</Label>
            <Input type="number" value={form.dias_vencimento_padrao} onChange={(e) => set('dias_vencimento_padrao', e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">Gateway ativo</p>
            <p className="text-xs text-muted-foreground">Usado para gerar novas cobranças</p>
          </div>
          <Switch checked={form.ativo} onCheckedChange={(v) => set('ativo', v)} />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : 'Salvar Configuração'}
          </Button>
          {saved && <span className="flex items-center gap-1.5 text-sm text-emerald-600"><CheckCircle className="w-4 h-4" /> Salvo</span>}
        </div>
      </CardContent>
    </Card>
  );
}