import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, Save, ShieldCheck } from 'lucide-react';

// Formulário do modo API Oficial da Meta: credenciais + dados do webhook.
export default function CanalOficialForm({ canal, canalTipo, empresaId, onSaved }) {
  const [cred, setCred] = useState(canal?.credenciais || {});
  const [nome, setNome] = useState(canal?.nome_exibicao || '');
  const [saving, setSaving] = useState(false);
  const [copiado, setCopiado] = useState('');

  const webhookUrl = `${window.location.origin.replace(/\/$/, '')}/functions/webhookCanais`;

  const copiar = (texto, chave) => {
    navigator.clipboard.writeText(texto);
    setCopiado(chave);
    setTimeout(() => setCopiado(''), 1500);
  };

  const salvar = async () => {
    setSaving(true);
    try {
      const res = await base44.functions.invoke('manageCanais', {
        action: 'salvar_oficial',
        canal_id: canal?.id,
        canal: canalTipo,
        empresa_id: empresaId,
        nome_exibicao: nome,
        credenciais: cred,
      });
      onSaved?.(res.data.canal);
    } finally {
      setSaving(false);
    }
  };

  const CopyField = ({ label, value, chave }) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <Input readOnly value={value} className="font-mono text-xs" />
        <Button type="button" variant="outline" size="icon" onClick={() => copiar(value, chave)}>
          {copiado === chave ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <Label>Nome de exibição</Label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: WhatsApp Oficina Centro" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {canalTipo === 'whatsapp' && (
          <div>
            <Label>Phone Number ID</Label>
            <Input value={cred.phone_number_id || ''} onChange={(e) => setCred({ ...cred, phone_number_id: e.target.value })} />
          </div>
        )}
        {canalTipo !== 'whatsapp' && (
          <div>
            <Label>Page ID / IG Business ID</Label>
            <Input value={cred.page_id || ''} onChange={(e) => setCred({ ...cred, page_id: e.target.value })} />
          </div>
        )}
        <div>
          <Label>{canalTipo === 'whatsapp' ? 'WABA ID' : 'Business Account ID'}</Label>
          <Input value={cred.business_account_id || ''} onChange={(e) => setCred({ ...cred, business_account_id: e.target.value })} />
        </div>
        <div>
          <Label>App ID</Label>
          <Input value={cred.app_id || ''} onChange={(e) => setCred({ ...cred, app_id: e.target.value })} />
        </div>
        <div>
          <Label>Access Token</Label>
          <Input type="password" value={cred.access_token || ''} onChange={(e) => setCred({ ...cred, access_token: e.target.value })} />
        </div>
        <div>
          <Label>App Secret</Label>
          <Input type="password" value={cred.app_secret || ''} onChange={(e) => setCred({ ...cred, app_secret: e.target.value })} placeholder="Valida a assinatura do webhook" />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-semibold">Configuração do Webhook (Meta)</h4>
          {canal?.webhook_verificado && (
            <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Verificado</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Cole estes valores no painel de webhooks do seu app na Meta. A verificação é concluída automaticamente quando a Meta valida o token.
        </p>
        <CopyField label="Callback URL" value={webhookUrl} chave="url" />
        {canal?.verify_token
          ? <CopyField label="Verify Token" value={canal.verify_token} chave="token" />
          : <p className="text-xs text-amber-600">Salve o canal para gerar o Verify Token.</p>}
      </div>

      <div className="flex justify-end">
        <Button onClick={salvar} disabled={saving || !canalTipo}>
          <Save className="w-4 h-4 mr-1" /> {saving ? 'Salvando...' : 'Salvar credenciais'}
        </Button>
      </div>
    </div>
  );
}