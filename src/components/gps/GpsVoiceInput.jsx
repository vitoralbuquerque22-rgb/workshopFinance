import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';

export default function GpsVoiceInput({ onTranscript }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const cbRef = useRef(onTranscript);
  cbRef.current = onTranscript;

  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'pt-BR';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      let text = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript + ' ';
      }
      cbRef.current(text.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    return () => { try { rec.abort(); } catch (e) {} };
  }, []);

  if (!SR) return null;

  const toggle = () => {
    if (!recRef.current) return;
    if (listening) {
      recRef.current.stop();
    } else {
      try { recRef.current.start(); setListening(true); } catch (e) {}
    }
  };

  return (
    <Button type="button" size="sm" variant={listening ? 'destructive' : 'outline'} onClick={toggle}>
      {listening ? <><MicOff className="h-4 w-4" /> Parar</> : <><Mic className="h-4 w-4" /> Falar</>}
    </Button>
  );
}