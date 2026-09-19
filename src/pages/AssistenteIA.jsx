import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Bot, Loader2, Plus, MessageSquare } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import MessageBubble from '@/components/ia/MessageBubble';
import SugestoesRapidas from '@/components/ia/SugestoesRapidas';
import ChatInput from '@/components/ia/ChatInput';
import { formatDateTime } from '@/lib/format';

const AGENT = 'mecanico_ia';

export default function AssistenteIA() {
  const [conversations, setConversations] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef();
  const unsubRef = useRef(null);

  useEffect(() => {
    (async () => {
      const list = await base44.agents.listConversations({ agent_name: AGENT });
      setConversations(list || []);
      setLoadingList(false);
    })();
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const subscribe = (convId) => {
    if (unsubRef.current) unsubRef.current();
    unsubRef.current = base44.agents.subscribeToConversation(convId, (data) => {
      setMessages(data.messages || []);
      const last = data.messages?.[data.messages.length - 1];
      if (last && last.role === 'assistant' && !last.tool_calls?.some((t) => ['pending', 'running', 'in_progress'].includes(t.status))) {
        setSending(false);
      }
    });
  };

  const abrirConversa = async (conv) => {
    const full = await base44.agents.getConversation(conv.id);
    setConversation(full);
    setMessages(full.messages || []);
    subscribe(conv.id);
  };

  const novaConversa = () => {
    if (unsubRef.current) unsubRef.current();
    setConversation(null);
    setMessages([]);
  };

  const enviar = async (text, fileUrls) => {
    setSending(true);
    let conv = conversation;
    if (!conv) {
      conv = await base44.agents.createConversation({
        agent_name: AGENT,
        metadata: { name: text.slice(0, 40) || 'Nova conversa', description: 'Conversa com Mecânico IA' },
      });
      setConversation(conv);
      setConversations((prev) => [conv, ...prev]);
      subscribe(conv.id);
    }
    await base44.agents.addMessage(conv, { role: 'user', content: text, ...(fileUrls?.length ? { file_urls: fileUrls } : {}) });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader title="Mecânico IA" description="Assistente especialista em oficinas — análises, orçamentos, previsões e comunicação">
        <Button variant="outline" onClick={novaConversa}><Plus className="w-4 h-4 mr-2" /> Nova conversa</Button>
      </PageHeader>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Histórico */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">Conversas</div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingList ? (
              <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
            ) : conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6 px-2">Nenhuma conversa ainda</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => abrirConversa(c)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${conversation?.id === c.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-sm font-medium truncate">{c.metadata?.name || 'Conversa'}</span>
                  </div>
                  <p className={`text-[10px] mt-0.5 ${conversation?.id === c.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{formatDateTime(c.created_date)}</p>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Chat */}
        <div className="flex-1 flex flex-col bg-card border border-border rounded-xl overflow-hidden min-w-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-6 py-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-3">
                    <Bot className="w-7 h-7" />
                  </div>
                  <h2 className="font-heading font-bold text-lg">Como posso ajudar sua oficina hoje?</h2>
                  <p className="text-sm text-muted-foreground mt-1">Escolha uma sugestão ou digite sua pergunta</p>
                </div>
                <SugestoesRapidas onSelect={(p) => enviar(p, [])} />
              </div>
            ) : (
              <>
                {messages.map((m, i) => <MessageBubble key={i} message={m} />)}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-card border border-border rounded-2xl px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <ChatInput onSend={enviar} disabled={sending} />
        </div>
      </div>
    </div>
  );
}