import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageCircle, Send } from 'lucide-react';
import { abrirWhatsApp, MODELOS_WHATSAPP } from '@/lib/whatsapp';

export default function WhatsAppButton({ clienteNome, telefone, osNumero, veiculo, valor }) {
  const [open, setOpen] = useState(false);
  const [tel, setTel] = useState(telefone || '');
  const [mensagem, setMensagem] = useState('');

  const ctx = { clienteNome, osNumero, veiculo, valor };

  const aplicarModelo = (modelo) => setMensagem(modelo.build(ctx));

  const enviar = () => {
    abrirWhatsApp(tel, mensagem);
    setOpen(false);
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => { setTel(telefone || ''); setMensagem(''); setOpen(true); }} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">
        <MessageCircle className="w-4 h-4" /> WhatsApp
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar mensagem por WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Telefone do cliente</Label>
              <Input value={tel} onChange={(e) => setTel(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Modelos rápidos</Label>
              <div className="flex flex-wrap gap-1.5">
                {MODELOS_WHATSAPP.map((m) => (
                  <button key={m.key} onClick={() => aplicarModelo(m)} className="text-xs px-2.5 py-1 rounded-full border border-border hover:bg-accent transition-colors">
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Mensagem</Label>
              <Textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={6} placeholder="Escreva ou escolha um modelo acima..." className="resize-none" />
            </div>
            <Button onClick={enviar} className="w-full bg-emerald-600 hover:bg-emerald-700">
              <Send className="w-4 h-4" /> Abrir WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}