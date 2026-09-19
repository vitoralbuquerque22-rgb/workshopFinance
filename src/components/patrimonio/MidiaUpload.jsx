import { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X, FileText, ImageIcon } from 'lucide-react';

// Upload reutilizável de fotos (array de urls) ou documentos (array de {nome,url})
export default function MidiaUpload({ modo = 'fotos', valor = [], onChange, label }) {
  const inputRef = useRef(null);
  const [enviando, setEnviando] = useState(false);

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setEnviando(true);
    try {
      const novos = [];
      for (const file of Array.from(files)) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        novos.push(modo === 'fotos' ? file_url : { nome: file.name, url: file_url });
      }
      onChange([...(valor || []), ...novos]);
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remover = (i) => onChange(valor.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {(valor || []).map((item, i) => (
          <div key={i} className="relative group">
            {modo === 'fotos' ? (
              <img src={item} alt="" className="w-16 h-16 rounded-md object-cover border border-border" />
            ) : (
              <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 h-16 px-3 rounded-md border border-border bg-muted/50 text-xs max-w-[180px]">
                <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{item.nome}</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => remover(i)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
          className="w-16 h-16 rounded-md border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
        >
          {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : modo === 'fotos' ? <ImageIcon className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={modo === 'fotos' ? 'image/*' : undefined}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}