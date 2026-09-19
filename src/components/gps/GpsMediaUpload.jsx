import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Camera, Video, Upload, X, Loader2, Music, Image } from 'lucide-react';

export default function GpsMediaUpload({ type = 'foto', anexos = [], onChange }) {
  const inputRef = useRef(null);
  const cameraRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const accept = type === 'foto' ? 'image/*' : type === 'video' ? 'video/*' : type === 'audio' ? 'audio/*' : '*/*';
  const podeCapturar = type === 'foto' || type === 'video';
  const Icon = type === 'foto' ? Camera : type === 'video' ? Video : type === 'audio' ? Music : Upload;

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const f of files) {
        const res = await base44.integrations.Core.UploadFile({ file: f });
        urls.push(res.file_url);
      }
      onChange([...(anexos || []), ...urls]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
      if (cameraRef.current) cameraRef.current.value = '';
    }
  };

  const remove = (idx) => onChange((anexos || []).filter((_, j) => j !== idx));

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept={accept} multiple className="hidden" onChange={handleFiles} />
      <input ref={cameraRef} type="file" accept={accept} capture={type === 'video' ? 'user' : 'environment'} className="hidden" onChange={handleFiles} />
      <div className="flex flex-wrap gap-2">
        {podeCapturar && (
          <Button type="button" size="sm" onClick={() => cameraRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
            {type === 'video' ? 'Gravar vídeo' : 'Tirar foto'}
          </Button>
        )}
        <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : (podeCapturar ? <Image className="h-4 w-4" /> : <Upload className="h-4 w-4" />)}
          {podeCapturar ? 'Galeria' : 'Anexar'}
        </Button>
      </div>
      {(anexos || []).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {anexos.map((url, i) => (
            <div key={i} className="relative">
              {type === 'foto' ? (
                <img src={url} alt="" className="h-16 w-16 object-cover rounded-md border" />
              ) : type === 'video' ? (
                <video src={url} className="h-16 w-16 object-cover rounded-md border" />
              ) : (
                <audio src={url} controls className="h-10 w-32" />
              )}
              <button type="button" onClick={() => remove(i)} className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}