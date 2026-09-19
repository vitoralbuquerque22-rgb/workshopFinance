import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, CalendarClock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Converte um Date para o valor de um <input type="datetime-local"> no fuso local.
function toLocalInput(date) {
  const d = new Date(date);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

// Dialog para criar/editar um agendamento pontual de mensagem para o contato.
export default function AgendarMensagemDialog({ open, onOpenChange, conversa, cliente, agendamento, onSalvo }) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('nenhum');
  const [texto, setTexto] = useState('');
  const [quando, setQuando] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;
    base44.entities.TemplateMensagem.list('-updated_date', 300).then((ts) => setTemplates(ts.filter((t) => t.ativo !== false))).catch(() => {});
    if (agendamento) {
      setTexto(agendamento.texto || '');
      setQuando(agendamento.agendado_para ? toLocalInput(agendamento.agendado_para) : '');
      setTemplateId('nenhum');
    } else {
      setTexto('');
      // padrão: daqui a 1 dia
      setQuando(toLocalInput(new Date(Date.now() + 24 * 60 * 60 * 1000)));
      setTemplateId('nenhum');
    }
  }, [open, agendamento]);

  const aplicarTemplate = (id) => {
    setTemplateId(id);
    if (id === 'nenhum') return;
    const t = templates.find((x) => x.id === id);
    if (t) setTexto(t.texto || '');
  };

  const podeSalvar = texto.trim() && quando;

  const salvar = async () => {
    setSalvando(true);
    try {
      const dados = {
        conversa_id: conversa.id,
        cliente_id: conversa.cliente_id || '',
        lead_id: conversa.lead_id || '',
        ordem_servico_id: conversa.ordem_servico_id || '',
        evento: 'manual',
        canal: conversa.canal || 'auto',
        texto: texto.trim(),
        agendado_para: new Date(quando).toISOString(),
        status: 'pendente',
      };
      if (agendamento) {
        await base44.entities.MensagemAgendada.update(agendamento.id, {
          texto: dados.texto,
          agendado_para: dados.agendado_para,
        });
        toast({ title: 'Agendamento atualizado' });
      } else {
        await base44.entities.MensagemAgendada.create(dados);
        toast({ title: 'Mensagem agendada', description: 'Ela será enviada na data/hora escolhida.' });
      }
      onOpenChange(false);
      onSalvo?.();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            {agendamento ? 'Editar agendamento' : 'Agendar mensagem'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Para <span className="font-medium text-foreground">{cliente?.nome || conversa?.contato_nome || 'este contato'}</span>
          </div>

          {!agendamento && templates.length > 0 && (
            <div>
              <Label>Usar um template (opcional)</Label>
              <Select value={templateId} onValueChange={aplicarTemplate}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Escrever do zero" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Escrever do zero</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Data e hora do envio</Label>
            <Input type="datetime-local" value={quando} onChange={(e) => setQuando(e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label>Mensagem</Label>
            <Textarea rows={4} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva a mensagem…" className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Variáveis como {'{cliente}'} não são substituídas em agendamentos manuais — escreva o texto final.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={salvar} disabled={!podeSalvar || salvando}>
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
            {agendamento ? 'Salvar' : 'Agendar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}