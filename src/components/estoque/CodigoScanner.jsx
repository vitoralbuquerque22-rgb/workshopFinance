import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Camera, ScanLine, AlertCircle } from 'lucide-react';

// Usa a API nativa BarcodeDetector quando disponível; senão, entrada manual.
export default function CodigoScanner({ open, onClose, onDetect }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [erro, setErro] = useState('');
  const [manual, setManual] = useState('');
  const [suportado, setSuportado] = useState(true);

  useEffect(() => {
    if (!open) return;
    let cancelado = false;

    const iniciar = async () => {
      if (!('BarcodeDetector' in window)) {
        setSuportado(false);
        return;
      }
      try {
        const detector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e'],
        });
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelado) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const tick = async () => {
          if (cancelado || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              onDetect(codes[0].rawValue);
              parar();
              onClose();
              return;
            }
          } catch { /* frame sem leitura */ }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        setErro('Não foi possível acessar a câmera. Use a entrada manual.');
      }
    };

    iniciar();
    return () => { cancelado = true; parar(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const parar = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const confirmarManual = () => {
    if (manual.trim()) { onDetect(manual.trim()); setManual(''); onClose(); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { parar(); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ScanLine className="w-5 h-5" /> Leitor de Código</DialogTitle>
        </DialogHeader>

        {suportado && !erro ? (
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/4 h-1/3 border-2 border-primary rounded-lg" />
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/40 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{erro || 'Leitura por câmera não suportada neste dispositivo. Digite o código manualmente.'}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1"><Camera className="w-3.5 h-3.5" /> Entrada manual</Label>
          <div className="flex gap-2">
            <Input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Código de barras / QR" onKeyDown={(e) => e.key === 'Enter' && confirmarManual()} />
            <Button onClick={confirmarManual} disabled={!manual.trim()}>OK</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}