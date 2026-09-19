import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Radio, Square, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { calcularTelemetria } from '@/lib/rastreamento';

// Captura contínua de GPS durante o deslocamento. Grava pontos (lat/lng/velocidade)
// no array rastreamento.trajeto e recalcula a telemetria ao encerrar.
export default function RastreadorAoVivo({ missao, onUpdated }) {
  const [ativo, setAtivo] = useState(!!missao.rastreamento?.ativo);
  const [salvando, setSalvando] = useState(false);
  const [ultimo, setUltimo] = useState(null);
  const watchId = useRef(null);
  const buffer = useRef([]);
  const flushTimer = useRef(null);

  // Grava os pontos acumulados no buffer na entidade (a cada ~10s).
  const flush = async () => {
    if (buffer.current.length === 0) return;
    const atual = await base44.entities.MissaoOperacional.get(missao.id).catch(() => null);
    const trajeto = [...(atual?.rastreamento?.trajeto || []), ...buffer.current];
    buffer.current = [];
    await base44.entities.MissaoOperacional.update(missao.id, {
      rastreamento: { ...(atual?.rastreamento || {}), ativo: true, trajeto },
    });
  };

  const iniciar = async () => {
    if (!navigator.geolocation) return;
    await base44.entities.MissaoOperacional.update(missao.id, {
      rastreamento: { ...(missao.rastreamento || {}), ativo: true, trajeto: missao.rastreamento?.trajeto || [] },
    });
    setAtivo(true);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const ponto = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          velocidade: pos.coords.speed != null ? Math.max(0, pos.coords.speed * 3.6) : 0, // m/s -> km/h
          precisao: pos.coords.accuracy,
          registrado_em: new Date().toISOString(),
        };
        buffer.current.push(ponto);
        setUltimo(ponto);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
    flushTimer.current = setInterval(flush, 10000);
  };

  const parar = async () => {
    setSalvando(true);
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    clearInterval(flushTimer.current);
    await flush();
    const atual = await base44.entities.MissaoOperacional.get(missao.id).catch(() => null);
    const trajeto = atual?.rastreamento?.trajeto || [];
    const telemetria = calcularTelemetria(trajeto);
    await base44.entities.MissaoOperacional.update(missao.id, {
      rastreamento: { ...(atual?.rastreamento || {}), ativo: false, trajeto, telemetria },
      // Alimenta a Fase 8 (custos por km) com a distância medida por GPS.
      km_percorrido: telemetria.distancia_km || atual?.km_percorrido || 0,
    });
    setAtivo(false);
    setSalvando(false);
    onUpdated?.();
  };

  // Limpeza ao desmontar
  useEffect(() => () => {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    clearInterval(flushTimer.current);
  }, []);

  const finalizado = missao.status === 'concluido' || missao.status === 'cancelado';

  return (
    <Card>
      <CardContent className="pt-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium flex items-center gap-2">
            {ativo && <Radio className="w-4 h-4 text-red-500 animate-pulse" />}
            {ativo ? 'Rastreando deslocamento…' : 'Rastreamento parado'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {ativo && ultimo
              ? `Último ponto: ${ultimo.lat.toFixed(5)}, ${ultimo.lng.toFixed(5)} · ${ultimo.velocidade.toFixed(0)} km/h`
              : `${missao.rastreamento?.trajeto?.length || 0} ponto(s) registrado(s)`}
          </p>
        </div>
        {ativo ? (
          <Button variant="destructive" onClick={parar} disabled={salvando}>
            {salvando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Square className="w-4 h-4 mr-2" />}
            Encerrar rastreamento
          </Button>
        ) : (
          <Button onClick={iniciar} disabled={finalizado}>
            <Radio className="w-4 h-4 mr-2" />Iniciar rastreamento
          </Button>
        )}
      </CardContent>
    </Card>
  );
}