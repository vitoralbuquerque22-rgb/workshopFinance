import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, FileCheck } from 'lucide-react';

const emptyFiscal = {
  razao_social: '', inscricao_estadual: '', inscricao_municipal: '', regime_tributario: 'simples_nacional',
  cnae_principal: '', serie_nfe: '', proximo_numero_nfe: 1, serie_nfse: '', proximo_numero_nfse: 1,
  certificado_url: '', certificado_validade: '', emite_nfe: true, emite_nfse: true,
};
const emptyRecebedor = {
  provedor: 'mercado_pago', recipient_id: '', conta_bancaria_id: '', ativo: false, observacoes: '',
};

export default function FilialForm({ editing, contas = [], onSaved, onCancel }) {
  const [form, setForm] = useState(() => ({
    nome: editing?.nome || '', cnpj: editing?.cnpj || '', tipo: editing?.tipo || 'filial',
    endereco: editing?.endereco || '', telefone: editing?.telefone || '', email: editing?.email || '',
    status: editing?.status || 'ativa',
    fiscal: { ...emptyFiscal, ...(editing?.fiscal || {}) },
    recebedor: { ...emptyRecebedor, ...(editing?.recebedor || {}) },
  }));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const setFiscal = (patch) => setForm((f) => ({ ...f, fiscal: { ...f.fiscal, ...patch } }));
  const setRecebedor = (patch) => setForm((f) => ({ ...f, recebedor: { ...f.recebedor, ...patch } }));

  const uploadCertificado = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFiscal({ certificado_url: file_url });
    } finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await base44.entities.Filial.update(editing.id, form);
      else await base44.entities.Filial.create(form);
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs defaultValue="geral">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="geral">Dados Gerais</TabsTrigger>
          <TabsTrigger value="fiscal">Fiscal &amp; Recebimento</TabsTrigger>
        </TabsList>

        {/* --- Dados Gerais --- */}
        <TabsContent value="geral" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="matriz">Matriz</SelectItem>
                  <SelectItem value="filial">Filial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>CNPJ</Label>
            <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
          </div>
          <div>
            <Label>Endereço</Label>
            <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
        </TabsContent>

        {/* --- Fiscal & Recebimento --- */}
        <TabsContent value="fiscal" className="space-y-5 mt-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dados fiscais (emissão de nota)</p>
            <div>
              <Label>Razão social</Label>
              <Input value={form.fiscal.razao_social} onChange={(e) => setFiscal({ razao_social: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Inscrição estadual</Label>
                <Input value={form.fiscal.inscricao_estadual} onChange={(e) => setFiscal({ inscricao_estadual: e.target.value })} />
              </div>
              <div>
                <Label>Inscrição municipal</Label>
                <Input value={form.fiscal.inscricao_municipal} onChange={(e) => setFiscal({ inscricao_municipal: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Regime tributário</Label>
                <Select value={form.fiscal.regime_tributario} onValueChange={(v) => setFiscal({ regime_tributario: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                    <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                    <SelectItem value="lucro_real">Lucro Real</SelectItem>
                    <SelectItem value="mei">MEI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>CNAE principal</Label>
                <Input value={form.fiscal.cnae_principal} onChange={(e) => setFiscal({ cnae_principal: e.target.value })} placeholder="0000-0/00" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="col-span-2 flex items-center justify-between">
                <Label className="text-sm">Emite NF-e (peças/produtos)</Label>
                <Switch checked={form.fiscal.emite_nfe} onCheckedChange={(v) => setFiscal({ emite_nfe: v })} />
              </div>
              {form.fiscal.emite_nfe && (
                <>
                  <div>
                    <Label className="text-xs">Série NF-e</Label>
                    <Input value={form.fiscal.serie_nfe} onChange={(e) => setFiscal({ serie_nfe: e.target.value })} placeholder="1" />
                  </div>
                  <div>
                    <Label className="text-xs">Próximo nº NF-e</Label>
                    <Input type="number" value={form.fiscal.proximo_numero_nfe} onChange={(e) => setFiscal({ proximo_numero_nfe: Number(e.target.value) })} />
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="col-span-2 flex items-center justify-between">
                <Label className="text-sm">Emite NFS-e (serviços)</Label>
                <Switch checked={form.fiscal.emite_nfse} onCheckedChange={(v) => setFiscal({ emite_nfse: v })} />
              </div>
              {form.fiscal.emite_nfse && (
                <>
                  <div>
                    <Label className="text-xs">Série NFS-e</Label>
                    <Input value={form.fiscal.serie_nfse} onChange={(e) => setFiscal({ serie_nfse: e.target.value })} placeholder="1" />
                  </div>
                  <div>
                    <Label className="text-xs">Próximo nº NFS-e</Label>
                    <Input type="number" value={form.fiscal.proximo_numero_nfse} onChange={(e) => setFiscal({ proximo_numero_nfse: Number(e.target.value) })} />
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Certificado digital (A1 .pfx)</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" asChild disabled={uploading}>
                    <label className="cursor-pointer">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : form.fiscal.certificado_url ? <FileCheck className="w-4 h-4 text-emerald-600" /> : <Upload className="w-4 h-4" />}
                      {form.fiscal.certificado_url ? 'Trocar' : 'Enviar'}
                      <input type="file" accept=".pfx,.p12" className="hidden" onChange={(e) => uploadCertificado(e.target.files?.[0])} />
                    </label>
                  </Button>
                  {form.fiscal.certificado_url && <span className="text-xs text-emerald-600">Enviado</span>}
                </div>
              </div>
              <div>
                <Label>Validade do certificado</Label>
                <Input type="date" value={form.fiscal.certificado_validade} onChange={(e) => setFiscal({ certificado_validade: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recebedor (split de pagamento)</p>
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div>
                <Label className="text-sm">CNPJ apto a receber via split</Label>
                <p className="text-xs text-muted-foreground">Liga este CNPJ como recebedor no gateway</p>
              </div>
              <Switch checked={form.recebedor.ativo} onCheckedChange={(v) => setRecebedor({ ativo: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Provedor</Label>
                <Select value={form.recebedor.provedor} onValueChange={(v) => setRecebedor({ provedor: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mercado_pago">Mercado Pago</SelectItem>
                    <SelectItem value="asaas">Asaas</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Conta de destino</Label>
                <Select value={form.recebedor.conta_bancaria_id || 'none'} onValueChange={(v) => setRecebedor({ conta_bancaria_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {contas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome || c.banco || c.id.slice(-6)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Recipient ID (gateway)</Label>
              <Input value={form.recebedor.recipient_id} onChange={(e) => setRecebedor({ recipient_id: e.target.value })} placeholder="ID do recebedor no Mercado Pago" />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea rows={2} value={form.recebedor.observacoes} onChange={(e) => setRecebedor({ observacoes: e.target.value })} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}</Button>
      </div>
    </form>
  );
}