import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronRight, Wrench, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

function FunctionDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const proj = toolCall.display_projection || {};
  const status = toolCall.status;
  const running = ['pending', 'running', 'in_progress'].includes(status);
  let failed = ['failed', 'error'].includes(status);

  let parsed = toolCall.results;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch { /* keep raw */ }
  }
  if (parsed && typeof parsed === 'object' && parsed.success === false) failed = true;
  if (typeof toolCall.results === 'string' && /error|failed/i.test(toolCall.results)) failed = true;

  const label = running ? (proj.active_label || 'Consultando dados...') : failed ? (proj.error_label || 'Falha na consulta') : (proj.label || 'Consulta concluída');

  if (proj.hide_details && proj.details_redacted) {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        {running ? <Loader2 className="w-3 h-3 animate-spin" /> : failed ? <XCircle className="w-3 h-3 text-red-500" /> : <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
        {label}
      </div>
    );
  }

  return (
    <div className="mt-2 text-xs border border-border rounded-lg overflow-hidden bg-muted/40">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-muted/60 transition-colors text-left">
        <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        {running ? <Loader2 className="w-3 h-3 animate-spin text-primary" /> : failed ? <XCircle className="w-3 h-3 text-red-500" /> : <Wrench className="w-3 h-3 text-primary" />}
        <span className="font-medium">{toolCall.name}</span>
        <span className={`ml-auto ${failed ? 'text-red-500' : 'text-muted-foreground'}`}>{running ? 'executando' : failed ? 'erro' : 'ok'}</span>
      </button>
      {expanded && (
        <div className="px-2.5 py-2 space-y-2 border-t border-border">
          {toolCall.arguments_string && (
            <div>
              <p className="text-muted-foreground mb-0.5">Parâmetros:</p>
              <pre className="whitespace-pre-wrap break-all text-[11px] bg-background rounded p-1.5">{prettify(toolCall.arguments_string)}</pre>
            </div>
          )}
          {parsed && (
            <div>
              <p className="text-muted-foreground mb-0.5">Resultado:</p>
              <pre className="whitespace-pre-wrap break-all text-[11px] bg-background rounded p-1.5 max-h-40 overflow-auto">{typeof parsed === 'object' ? JSON.stringify(parsed, null, 2) : String(parsed)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function prettify(str) {
  try { return JSON.stringify(JSON.parse(str), null, 2); } catch { return str; }
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'}`}>
        {message.file_urls?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.file_urls.map((url, i) => (
              /\.(png|jpe?g|webp|gif)$/i.test(url)
                ? <img key={i} src={url} alt="anexo" className="w-20 h-20 object-cover rounded-lg border border-border" />
                : <a key={i} href={url} target="_blank" rel="noreferrer" className="text-xs underline break-all">Anexo {i + 1}</a>
            ))}
          </div>
        )}
        {message.content && (
          isUser
            ? <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            : <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-headings:mt-3 prose-headings:mb-1.5 prose-ul:my-1.5 prose-table:text-xs"><ReactMarkdown>{message.content}</ReactMarkdown></div>
        )}
        {message.tool_calls?.map((tc, i) => <FunctionDisplay key={i} toolCall={tc} />)}
      </div>
    </div>
  );
}