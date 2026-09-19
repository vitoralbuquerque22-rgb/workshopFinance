import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ReguaCobrancaEditor from './ReguaCobrancaEditor';
import { PASSOS_PADRAO } from '@/lib/cobranca';

// Régua de cobrança personalizada de UM cliente — sobrepõe a padrão da oficina.
// Usa a entidade ConfigCobranca (escopo=cliente). Fica dentro do cadastro do cliente.
export default function ClienteReguaCobranca({ clienteId }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [personalizar, setPersonalizar] = useState(false);
  const [regua, setRegua] = useState(null);

  useEffect(() => {
    if (!clienteId) { setLoading(false); return; }
    (async () => {
      const encontradas = await base44.entities.ConfigCobranca.filter({ escopo: 'cliente', cliente_id: clienteId }).catch(() => []);
      if (encontradas[0]) { setRegua(encontradas[0]); setPersonalizar(true); }
      setLoading(false);
    })();
  }, [clienteId]);

  const ativarPersonalizacao = () => {
    setPersonalizar(true);
    setRegua({ escopo: 'cliente', cliente_id: clienteId, ativo: true, canal_padrao: 'whatsapp', formas_alvo: ['boleto', 'promissoria'], passos: PASSOS_PADRAO });
  };

  const salvar = async () => {
    setSalvando(true);
    try {
      const dados = { ...regua, escopo: 'cliente', cliente_id: clienteId };
      if (regua.id) await base44.entities.ConfigCobranca.update(regua.id, dados);
      else { const c = await base44.entities.ConfigCobranca.create(dados); setRegua((r) => ({ ...r, id: c.id })); }
      toast({ title: 'Régua personalizada salva' });
    } catch (e) {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    } finally { setSalvando(false); }
  };

  const remover = async () => {
    if (regua?.id) await base44.entities.ConfigCobranca.delete(regua.id);
    setRegua(null); setPersonalizar(false);
    toast({ title: 'Régua removida', description: 'O cliente volta a usar a régua padrão.' });
  };

  if (!clienteId) {
    return <p className="text-xs text-muted-foreground">Salve o cliente primeiro para configurar uma régua de cobrança personalizada.</p>;
  }
  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Label className="text-sm">Régua de cobrança personalizada</Label>
          <p className="text-xs text-muted-foreground">Sobrepõe a régua padrão da oficina para este cliente.</p>
        </div>
        {!personalizar ? (
          <Button type="button" variant="outline" size="sm" onClick={ativarPersonalizacao}>Personalizar</Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={remover}><Trash2 className="w-4 h-4" /></Button>
            <Button type="button" size="sm" onClick={salvar} disabled={salvando}>
              {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar régua
            </Button>
          </div>
        )}
      </div>

      {personalizar && regua && (
        <ReguaCobrancaEditor regua={regua} onChange={setRegua} mostrarFormas={false} />
      )}
    </div>
  );
}