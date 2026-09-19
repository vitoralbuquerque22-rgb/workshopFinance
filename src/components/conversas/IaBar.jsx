import { Button } from '@/components/ui/button';
import { Sparkles, FileText, Wrench, Loader2 } from 'lucide-react';

// Barra de ações de IA no topo do composer.
export default function IaBar({ onSugerir, onResumir, onGerarOs, carregando }) {
  const acaoAtiva = carregando;
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Button variant="outline" size="sm" className="h-7 text-xs" disabled={!!acaoAtiva} onClick={onSugerir}>
        {acaoAtiva === 'sugerir' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-primary" />}
        Sugerir resposta
      </Button>
      <Button variant="outline" size="sm" className="h-7 text-xs" disabled={!!acaoAtiva} onClick={onResumir}>
        {acaoAtiva === 'resumir' ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3 text-primary" />}
        Resumir
      </Button>
      <Button variant="outline" size="sm" className="h-7 text-xs" disabled={!!acaoAtiva} onClick={onGerarOs}>
        {acaoAtiva === 'gerar_os' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wrench className="w-3 h-3 text-primary" />}
        Gerar OS
      </Button>
    </div>
  );
}