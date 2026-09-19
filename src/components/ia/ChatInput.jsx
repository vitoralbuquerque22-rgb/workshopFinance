import { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, X, Loader2 } from 'lucide-react';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]); // {name, url, type}
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleFiles = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(selected.map(async (f) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
        return { name: f.name, url: file_url, type: f.type };
      }));
      setFiles((prev) => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = () => {
    if ((!text.trim() && files.length === 0) || disabled) return;
    onSend(text.trim(), files.map((f) => f.url));
    setText('');
    setFiles([]);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  return (
    <div className="border-t border-border bg-background p-3">
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-muted rounded-lg pl-2 pr-1 py-1 text-xs">
              <span className="truncate max-w-[140px]">{f.name}</span>
              <button onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <input ref={fileRef} type="file" multiple accept="image/*,video/*,audio/*" className="hidden" onChange={handleFiles} />
        <Button variant="outline" size="icon" onClick={() => fileRef.current?.click()} disabled={uploading || disabled} className="shrink-0">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
        </Button>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Pergunte ao Mecânico IA... (Enter envia, Shift+Enter quebra linha)"
          rows={1}
          className="resize-none min-h-[40px] max-h-32"
        />
        <Button size="icon" onClick={submit} disabled={disabled || (!text.trim() && files.length === 0)} className="shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}