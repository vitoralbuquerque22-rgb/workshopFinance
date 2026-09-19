import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, MessageSquareDashed, FileText } from 'lucide-react';
import { canalInfo, horaCurta } from '@/lib/conversas';
import IaBar from './IaBar';
import AnexoComposer, { AnexoPreview } from './AnexoComposer';
import GravadorAudio from './GravadorAudio';

const JanelaChat = forwardRef(function JanelaChat({ conversa, mensagens, onEnviar, enviando, onSugerir, onResumir, onGerarOs, iaCarregando }, ref) {
  const [texto, setTexto] = useState('');
  const [anexo, setAnexo] = useState(null);
  const fimRef = useRef(null);

  useImperativeHandle(ref, () => ({
    inserirTexto: (t) => setTexto(t),
  }));

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  if (!conversa) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground bg-muted/20">
        <MessageSquareDashed className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">Selecione uma conversa para começar</p>
      </div>
    );
  }

  const ci = canalInfo(conversa.canal);
  const Icone = ci.icon;

  const enviar = () => {
    const t = texto.trim();
    if ((!t && !anexo) || enviando) return;
    onEnviar(t, anexo);
    setTexto('');
    setAnexo(null);
  };

  return (
    <div className="flex h-full flex-col bg-muted/20">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border bg-card shrink-0">
        <div className={`flex items-center justify-center w-9 h-9 rounded-full ${ci.bg}`}>
          <Icone className={`w-4 h-4 ${ci.color}`} />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{conversa.contato_nome || conversa.contato_telefone || 'Contato'}</p>
          <p className="text-xs text-muted-foreground">{ci.label}{conversa.contato_telefone ? ` · ${conversa.contato_telefone}` : ''}</p>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mensagens.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhuma mensagem ainda</p>
        ) : (
          mensagens.map((m) => {
            const saida = m.direcao === 'saida';
            if (m.tipo === 'sistema') {
              return (
                <div key={m.id} className="flex justify-center">
                  <span className="text-[11px] text-muted-foreground bg-muted px-3 py-1 rounded-full">{m.texto}</span>
                </div>
              );
            }
            return (
              <div key={m.id} className={`flex ${saida ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${saida ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border rounded-bl-sm'}`}>
                  {m.midia_url && m.tipo === 'imagem' && (
                    <a href={m.midia_url} target="_blank" rel="noreferrer" className="block mb-1">
                      <img src={m.midia_url} alt={m.midia_nome || 'Imagem'} className="rounded-lg max-h-64 w-auto" />
                    </a>
                  )}
                  {m.midia_url && m.tipo === 'video' && (
                    <video src={m.midia_url} controls className="rounded-lg max-h-64 w-full mb-1" />
                  )}
                  {m.midia_url && m.tipo === 'audio' && (
                    <audio src={m.midia_url} controls className="mb-1 w-56 max-w-full h-10" />
                  )}
                  {m.midia_url && m.tipo !== 'imagem' && m.tipo !== 'video' && m.tipo !== 'audio' && (
                    <a href={m.midia_url} target="_blank" rel="noreferrer" className={`flex items-center gap-1.5 text-xs underline mb-1 ${saida ? 'text-primary-foreground' : ''}`}>
                      <FileText className="w-3.5 h-3.5 shrink-0" /> {m.midia_nome || 'Anexo'}
                    </a>
                  )}
                  {m.texto && <p className="text-sm whitespace-pre-wrap break-words">{m.texto}</p>}
                  <p className={`text-[10px] mt-1 ${saida ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {saida && m.autor_nome ? `${m.autor_nome} · ` : ''}{horaCurta(m.enviada_em || m.created_date)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={fimRef} />
      </div>

      {/* Composer */}
      <div className="p-3 border-t border-border bg-card shrink-0 space-y-2">
        <IaBar onSugerir={onSugerir} onResumir={onResumir} onGerarOs={onGerarOs} carregando={iaCarregando} />
        <AnexoPreview anexo={anexo} onLimpar={() => setAnexo(null)} />
        <div className="flex items-end gap-2">
          <AnexoComposer onSelecionado={setAnexo} disabled={enviando} />
          <GravadorAudio onGravado={setAnexo} disabled={enviando} />
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } }}
            placeholder="Escreva uma mensagem..."
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button onClick={enviar} disabled={enviando || (!texto.trim() && !anexo)} size="icon" className="h-11 w-11 shrink-0">
            {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
});

export default JanelaChat;