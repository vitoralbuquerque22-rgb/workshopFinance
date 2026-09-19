import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Loader2, Save, Info } from 'lucide-react';
import { GATILHOS, atrasoEmMinutos } from '@/lib/reguas';
import { etapasFluxo } from '@/lib/osFluxo';
import PassoReguaCard from './PassoReguaCard';

const passoVazio = () => ({ atraso_valor: 1, atraso_unidade: 'dias', texto: '' });

// Editor completo de uma régua (gatilho + N passos). Salva cada passo como um TemplateMensagem.
export default function ReguaEditor({ open, onOpenChange, regua, onSalvar, saving }) {
  const [nome, setNome] = useState('');
  const [evento, setEvento] = useState('orcamento_enviado');
  const [etapaOs, setEtapaOs] = useState('');
  const [canal, setCanal] = useState('auto');
  const [passos, setPassos] = useState([passoVazio()]);

  useEffect(() => {
    if (!open) return;
    if (regua) {
      setNome(regua.nome || '');
      setEvento(regua.evento || 'orcamento_enviado');
      setEtapaOs(regua.etapa_os || '');
      setCanal(regua.canal || 'auto');
      setPassos(regua.passos?.length ? regua.passos.map((p) => ({ ...p })) : [passoVazio()]);
    } else {
      setNome('');
      setEvento('orcamento_enviado');
      setEtapaOs('');
      setCanal('auto');
      setPassos([passoVazio()]);
    }
  }, [open, regua]);

  const setPasso = (i, novo) => setPassos((prev) => prev.map((p, idx) => (idx === i ? novo : p)));
  const removerPasso = (i) => setPassos((prev) => prev.filter((_, idx) => idx !== i));
  const addPasso = () => setPassos((prev) => [...prev, passoVazio()]);

  const podeSalvar = nome.trim() && passos.some((p) => (p.texto || '').trim());

  const handleSalvar = () => {
    const passosOrdenados = [...passos]
      .filter((p) => (p.texto || '').trim())
      .sort((a, b) => atrasoEmMinutos(a.atraso_valor, a.atraso_unidade) - atrasoEmMinutos(b.atraso_valor, b.atraso_unidade));
    onSalvar({
      nome: nome.trim(),
      evento,
      etapa_os: evento === 'os_etapa' ? etapaOs : '',
      canal,
      passos: passosOrdenados,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{regua ? 'Editar régua' : 'Nova régua'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nome da régua</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Follow-up de orçamento" className="mt-1" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Gatilho</Label>
              <Select value={evento} onValueChange={setEvento}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GATILHOS.map((g) => (
                    <SelectItem key={g.evento} value={g.evento}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {evento === 'os_etapa' ? (
              <div>
                <Label>Etapa da OS</Label>
                <Select value={etapaOs} onValueChange={setEtapaOs}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Escolha a etapa" /></SelectTrigger>
                  <SelectContent>
                    {etapasFluxo.map((e) => (
                      <SelectItem key={e.key} value={e.key}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label>Canal</Label>
                <Select value={canal} onValueChange={setCanal}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automático (canal da conversa)</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="messenger">Messenger</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {evento === 'os_etapa' && (
            <div>
              <Label>Canal</Label>
              <Select value={canal} onValueChange={setCanal}>
                <SelectTrigger className="mt-1 max-w-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automático (canal da conversa)</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="messenger">Messenger</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Variáveis: <code className="text-foreground">{'{cliente}'}</code>, <code className="text-foreground">{'{veiculo}'}</code>, <code className="text-foreground">{'{placa}'}</code>, <code className="text-foreground">{'{os_numero}'}</code>, <code className="text-foreground">{'{valor}'}</code>, <code className="text-foreground">{'{consultor}'}</code>, <code className="text-foreground">{'{oficina}'}</code>.
            </p>
          </div>

          {/* Passos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Passos da sequência</Label>
              <span className="text-xs text-muted-foreground">{passos.length} passo(s)</span>
            </div>
            {passos.map((p, i) => (
              <PassoReguaCard key={i} passo={p} indice={i} onChange={(novo) => setPasso(i, novo)} onRemover={() => removerPasso(i)} />
            ))}
            <Button variant="outline" onClick={addPasso} className="w-full border-dashed">
              <Plus className="w-4 h-4" /> Adicionar passo
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSalvar} disabled={!podeSalvar || saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar régua
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}