import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Bell, Loader2, Info } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EtapaNotificacaoCard from '@/components/notificacoes/EtapaNotificacaoCard';
import { etapasFluxo } from '@/lib/osFluxo';
import { useToast } from '@/components/ui/use-toast';

// Placeholder padrão sugerido por etapa (mostrado quando o texto está vazio).
const PLACEHOLDERS = {
  recepcao: 'Olá {cliente}! Recebemos seu {veiculo} ({placa}).',
  diagnostico: 'Olá {cliente}! Iniciamos o diagnóstico do seu {veiculo}.',
  execucao: 'Olá {cliente}! O serviço no seu {veiculo} já está em execução.',
  entrega: 'Olá {cliente}! Seu {veiculo} está pronto para retirada!',
};

export default function ConfigNotificacoes() {
  const { toast } = useToast();
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [ativas, setAtivas] = useState(false);
  const [canal, setCanal] = useState('whatsapp');
  const [etapasAtivas, setEtapasAtivas] = useState([]);
  const [textos, setTextos] = useState({}); // { etapa: mensagem }

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    try {
      const lista = await base44.entities.ConfigNotificacao.list('-updated_date', 10);
      const cfg = lista.find((c) => !c.filial_id) || lista[0] || null;
      if (cfg) {
        setCurrent(cfg);
        setAtivas(!!cfg.notificacoes_ativas);
        setCanal(cfg.canal_padrao || 'whatsapp');
        setEtapasAtivas(cfg.etapas_notificaveis || []);
        const mapa = {};
        (cfg.templates_etapa || []).forEach((t) => { mapa[t.etapa] = t.mensagem; });
        setTextos(mapa);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleEtapa = (key, ligar) => {
    setEtapasAtivas((prev) => (ligar ? [...new Set([...prev, key])] : prev.filter((e) => e !== key)));
  };

  const setTexto = (key, valor) => setTextos((prev) => ({ ...prev, [key]: valor }));

  const salvar = async () => {
    setSaving(true);
    try {
      const templates_etapa = etapasAtivas
        .filter((e) => (textos[e] || '').trim())
        .map((e) => ({ etapa: e, mensagem: textos[e].trim() }));
      const dados = {
        notificacoes_ativas: ativas,
        etapas_notificaveis: etapasAtivas,
        canal_padrao: canal,
        templates_etapa,
      };
      if (current) {
        const upd = await base44.entities.ConfigNotificacao.update(current.id, dados);
        setCurrent(upd);
      } else {
        const nova = await base44.entities.ConfigNotificacao.create(dados);
        setCurrent(nova);
      }
      toast({ title: 'Configuração salva', description: 'As notificações automáticas foram atualizadas.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Notificações Automáticas" description="Avise o cliente automaticamente quando a OS muda de etapa" />

      <div className="space-y-6 max-w-3xl">
        {/* Liga/desliga geral + canal */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-sm">Notificações automáticas</h3>
                <p className="text-xs text-muted-foreground">Quando ligado, o cliente recebe uma mensagem a cada etapa marcada abaixo.</p>
              </div>
            </div>
            <Switch checked={ativas} onCheckedChange={setAtivas} />
          </div>

          <div className="mt-4 pt-4 border-t border-border max-w-xs">
            <Label>Canal de envio</Label>
            <Select value={canal} onValueChange={setCanal}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Variáveis disponíveis */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2.5">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Use variáveis no texto: <code className="text-foreground">{'{cliente}'}</code>, <code className="text-foreground">{'{veiculo}'}</code>, <code className="text-foreground">{'{placa}'}</code>, <code className="text-foreground">{'{os_numero}'}</code>, <code className="text-foreground">{'{valor}'}</code>, <code className="text-foreground">{'{oficina}'}</code>. Elas são substituídas automaticamente no envio.
          </p>
        </div>

        {/* Etapas */}
        <div className={`bg-card rounded-xl border border-border p-5 space-y-3 transition-opacity ${ativas ? '' : 'opacity-60'}`}>
          <h3 className="font-heading font-semibold text-sm">Etapas que notificam o cliente</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {etapasFluxo.map((etapa) => (
              <EtapaNotificacaoCard
                key={etapa.key}
                etapa={etapa}
                ativa={etapasAtivas.includes(etapa.key)}
                mensagem={textos[etapa.key] || ''}
                placeholder={PLACEHOLDERS[etapa.key] || 'Deixe em branco para usar a mensagem padrão desta etapa.'}
                onToggle={(v) => toggleEtapa(etapa.key, v)}
                onMensagem={(v) => setTexto(etapa.key, v)}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={salvar} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {saving ? 'Salvando...' : 'Salvar Configuração'}
          </Button>
        </div>
      </div>
    </div>
  );
}