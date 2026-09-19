import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Formulário completo de campos do cliente (PF e PJ), usado após a consulta.
export default function CamposCliente({ form, onChange }) {
  const set = (field, value) => onChange({ ...form, [field]: value });
  const isPF = form.tipo_pessoa === 'fisica';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Tipo de Pessoa</Label>
          <Select value={form.tipo_pessoa} onValueChange={(v) => set('tipo_pessoa', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fisica">Pessoa Física</SelectItem>
              <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tipo de Cliente</Label>
          <Select value={form.tipo_cliente} onValueChange={(v) => set('tipo_cliente', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="particular">Particular</SelectItem>
              <SelectItem value="frotista">Frotista</SelectItem>
              <SelectItem value="empresa">Empresa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isPF ? (
        <>
          <div><Label>Nome Completo *</Label><Input value={form.nome || ''} onChange={(e) => set('nome', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>CPF</Label><Input value={form.cpf || ''} onChange={(e) => set('cpf', e.target.value)} /></div>
            <div><Label>Data de Nascimento</Label><Input value={form.data_nascimento || ''} onChange={(e) => set('data_nascimento', e.target.value)} placeholder="DD/MM/AAAA" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nome da Mãe</Label><Input value={form.nome_mae || ''} onChange={(e) => set('nome_mae', e.target.value)} /></div>
            <div><Label>Situação Cadastral</Label><Input value={form.situacao_cadastral || ''} onChange={(e) => set('situacao_cadastral', e.target.value)} /></div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nome Fantasia *</Label><Input value={form.nome || ''} onChange={(e) => set('nome', e.target.value)} /></div>
            <div><Label>Razão Social</Label><Input value={form.razao_social || ''} onChange={(e) => set('razao_social', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>CNPJ</Label><Input value={form.cnpj || ''} onChange={(e) => set('cnpj', e.target.value)} /></div>
            <div><Label>Inscrição Estadual</Label><Input value={form.inscricao_estadual || ''} onChange={(e) => set('inscricao_estadual', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Situação Cadastral</Label><Input value={form.situacao_cadastral || ''} onChange={(e) => set('situacao_cadastral', e.target.value)} /></div>
            <div><Label>CNAE Principal</Label><Input value={form.cnae_principal || ''} onChange={(e) => set('cnae_principal', e.target.value)} /></div>
          </div>
          {(form.socios?.length > 0) && (
            <div>
              <Label>Sócios</Label>
              <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 max-h-24 overflow-y-auto space-y-0.5">
                {form.socios.map((s, i) => <div key={i}>{s.nome}{s.qualificacao ? ` — ${s.qualificacao}` : ''}</div>)}
              </div>
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div><Label>Telefone</Label><Input value={form.telefone || ''} onChange={(e) => set('telefone', e.target.value)} /></div>
        <div><Label>Celular</Label><Input value={form.celular || ''} onChange={(e) => set('celular', e.target.value)} /></div>
        <div><Label>Email</Label><Input type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div><Label>CEP</Label><Input value={form.cep || ''} onChange={(e) => set('cep', e.target.value)} /></div>
        <div className="col-span-2"><Label>Logradouro</Label><Input value={form.logradouro || ''} onChange={(e) => set('logradouro', e.target.value)} /></div>
        <div><Label>Número</Label><Input value={form.numero || ''} onChange={(e) => set('numero', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div><Label>Complemento</Label><Input value={form.complemento || ''} onChange={(e) => set('complemento', e.target.value)} /></div>
        <div><Label>Bairro</Label><Input value={form.bairro || ''} onChange={(e) => set('bairro', e.target.value)} /></div>
        <div><Label>Cidade</Label><Input value={form.cidade || ''} onChange={(e) => set('cidade', e.target.value)} /></div>
        <div><Label>UF</Label><Input value={form.uf || ''} maxLength={2} onChange={(e) => set('uf', e.target.value.toUpperCase())} /></div>
      </div>

      <div><Label>Observações internas</Label><Textarea rows={2} value={form.observacoes || ''} onChange={(e) => set('observacoes', e.target.value)} /></div>
    </div>
  );
}