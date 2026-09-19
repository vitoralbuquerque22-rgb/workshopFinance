import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Building, FileText, CreditCard } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

export default function Configuracoes() {
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState({
    nome_fantasia: '', razao_social: '', cnpj: '', regime_tributario: 'Simples Nacional',
    aliquota_iss: 0, inscricao_municipal: '', plano: 'Pro', endereco: '', telefone: '', email: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadEmpresa(); }, []);

  const loadEmpresa = async () => {
    try {
      const data = await base44.entities.Empresa.list();
      if (data.length > 0) {
        setCurrent(data[0]);
        setForm({
          nome_fantasia: data[0].nome_fantasia || '',
          razao_social: data[0].razao_social || '',
          cnpj: data[0].cnpj || '',
          regime_tributario: data[0].regime_tributario || 'Simples Nacional',
          aliquota_iss: data[0].aliquota_iss || 0,
          inscricao_municipal: data[0].inscricao_municipal || '',
          plano: data[0].plano || 'Pro',
          endereco: data[0].endereco || '',
          telefone: data[0].telefone || '',
          email: data[0].email || '',
        });
      }
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (current) {
        await base44.entities.Empresa.update(current.id, form);
      } else {
        const created = await base44.entities.Empresa.create(form);
        setCurrent(created);
      }
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Configurações" description="Dados cadastrais da empresa" />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-semibold text-sm">Dados da Empresa</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Nome Fantasia *</Label>
              <Input value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} required />
            </div>
            <div>
              <Label>Razão Social</Label>
              <Input value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} />
            </div>
            <div>
              <Label>CNPJ *</Label>
              <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00" required />
            </div>
            <div>
              <Label>Regime Tributário</Label>
              <Select value={form.regime_tributario} onValueChange={(v) => setForm({ ...form, regime_tributario: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                  <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                  <SelectItem value="MEI">MEI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border">
            <div>
              <Label>Alíquota ISS Padrão (%)</Label>
              <Input type="number" step="0.01" min="0" max="100" value={form.aliquota_iss} onChange={(e) => setForm({ ...form, aliquota_iss: Number(e.target.value) })} placeholder="2 a 5" />
              <p className="text-xs text-muted-foreground mt-1">Usada como padrão para mão de obra sem alíquota própria</p>
            </div>
            <div>
              <Label>Inscrição Municipal</Label>
              <Input value={form.inscricao_municipal} onChange={(e) => setForm({ ...form, inscricao_municipal: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-semibold text-sm">Contato & Endereço</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Endereço</Label>
              <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-semibold text-sm">Plano</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {['Starter', 'Pro', 'Enterprise'].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setForm({ ...form, plano: p })}
                className={`p-4 rounded-lg border text-center transition-colors ${
                  form.plano === p ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
                }`}
              >
                <p className="font-semibold text-sm">{p}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
}