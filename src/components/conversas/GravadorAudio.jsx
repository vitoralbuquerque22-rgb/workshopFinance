import { useRef, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';

function formatarTempo(seg) {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Grava áudio do microfone (notebook/celular), faz upload e devolve { tipo:'audio', url, nome }.
export default function GravadorAudio({ onGravado, disabled }) {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const [gravando, setGravando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [enviando, setEnviando] = useState(false);

  const pararStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    clearInterval(timerRef.current);
  };

  useEffect(() => () => pararStream(), []);

  const iniciar = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Seu dispositivo não permite gravar áudio neste navegador.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = enviarAudio;
      mediaRecorderRef.current = recorder;
      recorder.start();
      setGravando(true);
      setSegundos(0);
      timerRef.current = setInterval(() => setSegundos((s) => s + 1), 1000);
    } catch {
      alert('Não foi possível acessar o microfone. Verifique a permissão do navegador.');
    }
  };

  const parar = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    setGravando(false);
    clearInterval(timerRef.current);
  };

  const enviarAudio = async () => {
    pararStream();
    const tipoMime = mediaRecorderRef.current?.mimeType || 'audio/webm';
    const blob = new Blob(chunksRef.current, { type: tipoMime });
    if (!blob.size) return;
    const ext = tipoMime.includes('mp4') ? 'm4a' : tipoMime.includes('ogg') ? 'ogg' : 'webm';
    const file = new File([blob], `audio-${Date.now()}.${ext}`, { type: tipoMime });
    setEnviando(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onGravado({ tipo: 'audio', url: file_url, nome: file.name });
    } finally {
      setEnviando(false);
    }
  };

  if (gravando) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <span className="flex items-center gap-1.5 text-xs text-red-600 font-medium tabular-nums">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          {formatarTempo(segundos)}
        </span>
        <Button type="button" variant="destructive" size="icon" className="h-11 w-11" onClick={parar} title="Parar e enviar gravação">
          <Square className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-11 w-11 shrink-0"
      disabled={disabled || enviando}
      onClick={iniciar}
      title="Gravar áudio do microfone"
    >
      {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
    </Button>
  );
}