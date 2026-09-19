import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Bell, User, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/PageHeader';
import ReguaCobrancaEditor from '@/components/cobranca/ReguaCobrancaEditor';
import { PASSOS_PADRAO } from '@/lib/cobranca';

const REGUA_INICIAL = {
  escopo: 'padrao',
  ativo: true,
  canal_padrao: 'whatsapp',
  formas_alvo: ['boleto', 'promissoria'],
  passos: PASSOS_PADRAO,
};

export default function CobrancaAutomatica() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [regua, setRegua] = useState(REGUA_INICIAL);
  const [personalizadas, setPersonalizadas] = useState([]);
  const [clientes, setClientes] = useState({});

  const load = async () => {
    setLoading(true);
    const padroes = await base44.entities.ConfigCobranca.filter({ escopo: 'padrao' }).catch(() => []);
    setRegua(padroes[0] ? { ...REGUA_INICIAL, ...padroes[0] } : REGUA_INICIAL);

    const pers = await base44.entities.ConfigCobranca.filter({ escopo: 'cliente' }).catch(() => []);
    setPersonalizadas(pers);
    const ids = [...new Set(pers.map((p) => p.cliente_id).filter(Boolean))];
    const mapa = {};
    for (const id of ids) {
      const c = await base44.entities.Cliente.get(id).catch(() => null);
      if (c) mapa[id] = c;
    }
    setClientes(mapa);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const salvar = async () => {
    setSalvando(true);
    try {
      const dados = { ...regua, escopo: 'padrao', cliente_id: '' };
      if (regua.id) await base44.entities.ConfigCobranca.update(regua.id, dados);
      else {
        const criada = await base44.entities.ConfigCobranca.create(dados);
        setRegua((r) => ({ ...r, id: criada.id }));
      }
      toast({ title: 'Cadência salva', description: 'A régua padrão de cobrança foi atualizada.' });
    } catch (e) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const removerPersonalizada = async (p) => {
    await base44.entities.ConfigCobranca.delete(p.id);
    toast({ title: 'Régua personalizada removida', description: 'O cliente volta a usar a régua padrão.' });
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cobrança Automática"
        description="Régua de mensagens de cobrança disparadas automaticamente para boletos e promissórias — antes, no dia e após o vencimento."
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-sm flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /> Régua Padrão da Oficina</CardTitle>
          <Button size="sm" onClick={salvar} disabled={salvando}>
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
          </Button>
        </CardHeader>
        <CardContent>
          <ReguaCobrancaEditor regua={regua} onChange={setRegua} mostrarFormas />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /> Réguas Personalizadas por Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          {personalizadas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Nenhum cliente com régua personalizada. Você pode definir uma régua específica no cadastro de cada cliente — ela sobrepõe a padrão.</p>
          ) : (
            <div className="space-y-2">
              {personalizadas.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{clientes[p.cliente_id]?.nome || 'Cliente'}</p>
                    <p className="text-xs text-muted-foreground">
                      {(p.passos || []).filter((s) => s.ativo !== false).length} disparo(s) • {p.ativo === false ? 'inativa' : 'ativa'}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removerPersonalizada(p)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}