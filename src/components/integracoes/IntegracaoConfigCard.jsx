import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Loader2, CheckCircle } from 'lucide-react';

const empty = { ativo: true, nome_provedor: '', url: '', token: '', usuario: '', senha: '', timeout_ms: 10000, ambiente: 'producao', observacoes: '' };

// Card de configuração de um serviço de consulta (CPF, CNPJ ou Veículo).
export default function IntegracaoConfigCard({ servico, titulo, descricao, icon: Icon, config, publico, onSave }) {
  const [form, setForm] = useState(empty);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => { setForm(config ? { ...empty, ...config } : empty); }, [config]);

  const set = (f, v) => { setForm({ ...form, [f]: v }); setSalvo(false); };

  const salvar = async () => {
    setSalvando(true);
    await onSave(servico, { ...form, servico, timeout_ms: Number(form.timeout_ms) || 10000 });
    setSalvando(false);
    setSalvo(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base"><Icon className="w-5 h-5 text-primary" /> {titulo}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{form.ativo ? 'Ativo' : 'Inativo'}</span>
            <Switch checked={form.ativo} onCheckedChange={(v) => set('ativo', v)} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{descricao}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {publico && (
          <div className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded p-2">
            Consulta pública já funciona sem configuração. Preencha abaixo apenas se quiser usar um provedor próprio.
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Nome do Provedor</Label><Input value={form.nome_provedor} onChange={(e) => set('nome_provedor', e.target.value)} placeholder="Ex.: MinhaAPI" /></div>
          <div>
            <Label>Ambiente</Label>
            <Select value={form.ambiente} onValueChange={(v) => set('ambiente', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="homologacao">Homologação</SelectItem>
                <SelectItem value="producao">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>URL da API</Label>
          <Input value={form.url} onChange={(e) => set('url', e.target.value)} placeholder="https://api.provedor.com/consulta/{documento}" />
          <p className="text-[11px] text-muted-foreground mt-1">Use {'{documento}'}, {'{cpf}'}, {'{cnpj}'} ou {'{placa}'} como marcador substituído na consulta.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Token</Label><Input type="password" value={form.token} onChange={(e) => set('token', e.target.value)} /></div>
          <div><Label>Tempo limite (ms)</Label><Input type="number" value={form.timeout_ms} onChange={(e) => set('timeout_ms', e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Usuário</Label><Input value={form.usuario} onChange={(e) => set('usuario', e.target.value)} /></div>
          <div><Label>Senha</Label><Input type="password" value={form.senha} onChange={(e) => set('senha', e.target.value)} /></div>
        </div>
        <div className="flex justify-end">
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : salvo ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {salvo ? 'Salvo' : 'Salvar configuração'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}