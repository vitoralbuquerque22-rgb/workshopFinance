import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MapPin, Search } from 'lucide-react';
import MapaRota from '@/components/rastreamento/MapaRota';
import TelemetriaCards from '@/components/rastreamento/TelemetriaCards';
import RotaHistoricoRow from '@/components/rastreamento/RotaHistoricoRow';
import RastreadorAoVivo from '@/components/rastreamento/RastreadorAoVivo';
import { formatarMinutos } from '@/lib/atendimentoExterno';

// Fase 10 — Rastreamento Avançado: histórico de trajetos das missões externas,
// mapa do percurso, telemetria derivada e captura ao vivo do deslocamento.
export default function Rastreamento() {
  const [missoes, setMissoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [selecionadaId, setSelecionadaId] = useState(null);

  const carregar = async () => {
    const dados = await base44.entities.MissaoOperacional.list('-created_date', 500).catch(() => []);
    setMissoes(dados);
    setLoading(false);
    setSelecionadaId((prev) => prev || dados[0]?.id || null);
  };

  useEffect(() => { carregar(); }, []);

  // Atualiza em tempo real quando pontos de trajeto são gravados.
  useEffect(() => {
    const unsub = base44.entities.MissaoOperacional.subscribe(() => carregar());
    return unsub;
  }, []);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return missoes;
    return missoes.filter((m) =>
      [m.numero, m.titulo, m.cliente_nome, m.endereco].some((v) => String(v || '').toLowerCase().includes(q))
    );
  }, [missoes, busca]);

  const selecionada = useMemo(() => missoes.find((m) => m.id === selecionadaId) || null, [missoes, selecionadaId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Rastreamento Avançado" description="Trajetos, telemetria e captura ao vivo do deslocamento das equipes externas." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Histórico de rotas */}
        <div className="lg:col-span-1 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar missão, cliente…" value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
          </div>
          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {filtradas.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />Nenhuma missão encontrada.
              </CardContent></Card>
            ) : (
              filtradas.map((m) => (
                <RotaHistoricoRow key={m.id} missao={m} selecionada={m.id === selecionadaId} onSelect={(mm) => setSelecionadaId(mm.id)} />
              ))
            )}
          </div>
        </div>

        {/* Detalhe da rota selecionada */}
        <div className="lg:col-span-2 space-y-4">
          {selecionada ? (
            <>
              <div>
                <p className="text-sm font-semibold">{selecionada.numero || selecionada.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {selecionada.cliente_nome || '—'} · {selecionada.endereco || 'Sem endereço'} · Deslocamento {formatarMinutos(selecionada.tempo_deslocamento_min)}
                </p>
              </div>
              <RastreadorAoVivo missao={selecionada} onUpdated={carregar} />
              <TelemetriaCards telemetria={selecionada.rastreamento?.telemetria} />
              <MapaRota missoes={[selecionada]} />
            </>
          ) : (
            <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />Selecione uma missão para ver o trajeto.
            </CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}