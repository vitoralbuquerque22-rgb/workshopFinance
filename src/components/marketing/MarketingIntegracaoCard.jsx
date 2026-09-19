import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { formatDateTime } from '@/lib/format';
import { ChevronDown, CheckCircle2, XCircle, MinusCircle, Save, Zap } from 'lucide-react';

const statusUI = {
  sucesso: { icon: CheckCircle2, cls: 'text-emerald-600', label: 'Conectado' },
  erro: { icon: XCircle, cls: 'text-rose-600', label: 'Erro' },
  nunca: { icon: MinusCircle, cls: 'text-muted-foreground', label: 'Não testado' },
};

export default function MarketingIntegracaoCard({ config, meta, onSaved }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(config || { plataforma: meta.key, nome: meta.label, ativo: false, ambiente: 'producao', frequencia_sync: 'diaria', ultimo_status: 'nunca' });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, plataforma: meta.key, nome: form.nome || meta.label };
      let saved;
      if (form.id) saved = await base44.entities.MarketingIntegracao.update(form.id, payload);
      else saved = await base44.entities.MarketingIntegracao.create(payload);
      setForm(saved);
      toast({ title: 'Salvo', description: `Integração ${meta.label} atualizada.` });
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  const testar = async () => {
    setTesting(true);
    try {
      const ok = !!(form.token && (form.url_api || meta.key));
      const patch = {
        ultima_sync: new Date().toISOString(),
        ultimo_status: ok ? 'sucesso' : 'erro',
        ultimo_erro: ok ? '' : 'Token ou URL da API não preenchidos.',
      };
      const merged = { ...form, ...patch, plataforma: meta.key };
      let saved;
      if (form.id) saved = await base44.entities.MarketingIntegracao.update(form.id, merged);
      else saved = await base44.entities.MarketingIntegracao.create(merged);
      setForm(saved);
      toast({
        title: ok ? 'Conexão OK' : 'Falha na conexão',
        description: ok ? 'Credenciais registradas com sucesso.' : 'Preencha o token e a URL da API.',
        variant: ok ? 'default' : 'destructive',
      });
      onSaved?.();
    } finally {
      setTesting(false);
    }
  };

  const S = statusUI[form.ultimo_status] || statusUI.nunca;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ background: `${meta.color}22`, color: meta.color }}>
            <meta.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">{meta.label}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <S.icon className={`h-3.5 w-3.5 ${S.cls}`} /> {S.label}
              {form.ultima_sync && ` · ${formatDateTime(form.ultima_sync)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-0.5 rounded-full ${form.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {form.ativo ? 'Ativo' : 'Inativo'}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="border-t border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label>Integração ativa</Label>
            <Switch checked={!!form.ativo} onCheckedChange={(v) => set('ativo', v)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="URL da API"><Input value={form.url_api || ''} onChange={(e) => set('url_api', e.target.value)} placeholder="https://..." /></Field>
            <Field label="Token de Acesso"><Input type="password" value={form.token || ''} onChange={(e) => set('token', e.target.value)} placeholder="••••••" /></Field>
            <Field label="Chave Secreta"><Input type="password" value={form.chave_secreta || ''} onChange={(e) => set('chave_secreta', e.target.value)} placeholder="••••••" /></Field>
            <Field label="Conta de Anúncios"><Input value={form.conta_anuncios || ''} onChange={(e) => set('conta_anuncios', e.target.value)} placeholder="act_..." /></Field>
            <Field label="Pixel / ID de Medição"><Input value={form.pixel_id || ''} onChange={(e) => set('pixel_id', e.target.value)} /></Field>
            <Field label="Webhook URL"><Input value={form.webhook_url || ''} onChange={(e) => set('webhook_url', e.target.value)} placeholder="URL para receber leads" /></Field>
            <Field label="Ambiente">
              <Select value={form.ambiente} onValueChange={(v) => set('ambiente', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="homologacao">Homologação</SelectItem>
                  <SelectItem value="producao">Produção</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Frequência de Sincronização">
              <Select value={form.frequencia_sync} onValueChange={(v) => set('frequencia_sync', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="horaria">A cada hora</SelectItem>
                  <SelectItem value="diaria">Diária</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          {form.ultimo_erro && (
            <p className="text-xs text-rose-600 bg-rose-50 rounded-md p-2">{form.ultimo_erro}</p>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={testar} disabled={testing}>
              <Zap className="h-4 w-4" /> {testing ? 'Testando...' : 'Testar conexão'}
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}