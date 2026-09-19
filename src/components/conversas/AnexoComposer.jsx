import { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Paperclip, X, Loader2, ImageIcon, Video, FileText, Mic } from 'lucide-react';

// Deduz o tipo lógico de mídia a partir do MIME do arquivo.
function tipoDeArquivo(file) {
  if (file.type.startsWith('image/')) return 'imagem';
  if (file.type.startsWith('video/')) return 'video';
  return 'arquivo';
}

const ICONE = { imagem: ImageIcon, video: Video, arquivo: FileText, audio: Mic };

// Preview do anexo selecionado (fica acima da barra de digitação).
export function AnexoPreview({ anexo, onLimpar }) {
  if (!anexo) return null;
  const Icone = ICONE[anexo.tipo] || FileText;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs">
      {anexo.tipo === 'imagem' ? (
        <img src={anexo.url} alt={anexo.nome} className="w-9 h-9 rounded object-cover" />
      ) : (
        <span className="flex items-center justify-center w-9 h-9 rounded bg-muted"><Icone className="w-4 h-4 text-muted-foreground" /></span>
      )}
      {anexo.tipo === 'audio' ? (
        <audio src={anexo.url} controls className="flex-1 h-9" />
      ) : (
        <span className="flex-1 truncate">{anexo.nome}</span>
      )}
      <button type="button" onClick={onLimpar} className="text-muted-foreground hover:text-foreground shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Botão de anexo: abre o seletor, faz upload e devolve { tipo, url, nome }.
export default function AnexoComposer({ onSelecionado, disabled }) {
  const inputRef = useRef(null);
  const [enviandoArquivo, setEnviandoArquivo] = useState(false);

  const escolher = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setEnviandoArquivo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onSelecionado({ tipo: tipoDeArquivo(file), url: file_url, nome: file.name });
    } finally {
      setEnviandoArquivo(false);
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*,video/*,application/pdf" className="hidden" onChange={escolher} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-11 w-11 shrink-0"
        disabled={disabled || enviandoArquivo}
        onClick={() => inputRef.current?.click()}
        title="Anexar imagem, vídeo ou arquivo"
      >
        {enviandoArquivo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
      </Button>
    </>
  );
}