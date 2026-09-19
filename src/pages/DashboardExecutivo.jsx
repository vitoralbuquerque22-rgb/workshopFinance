import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Radio } from 'lucide-react';
import IndicadoresGrid from '@/components/executivo/IndicadoresGrid';
import AlertasOperacionais from '@/components/executivo/AlertasOperacionais';
import ResumoFinanceiroExterno from '@/components/executivo/ResumoFinanceiroExterno';
import { carregarIndicadores } from '@/lib/dashboardOperacional';

export default function DashboardExecutivo() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizadoEm, setAtualizadoEm] = useState(null);
  const timerRef = useRef(null);

  const carregar = async () => {
    const d = await carregarIndicadores();
    setDados(d);
    setAtualizadoEm(new Date());
    setCarregando(false);
  };

  useEffect(() => {
    carregar();
    // Tempo real: o Motor Operacional grava EventoOperacional a cada fato relevante.
    // Assinamos os eventos e recarregamos os indicadores quando algo muda.
    const unsub = base44.entities.EventoOperacional.subscribe(() => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(carregar, 800); // debounce de rajadas de eventos
    });
    return () => { unsub && unsub(); clearTimeout(timerRef.current); };
  }, []);

  if (carregando) {
    return <div className="flex justify-center py-24"><div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard Executivo" description="Inteligência operacional em tempo real da oficina.">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1.5">
            <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
            Tempo real
          </Badge>
          <Button variant="outline" size="sm" onClick={carregar}>
            <RefreshCw className="w-4 h-4 mr-2" />Atualizar
          </Button>
        </div>
      </PageHeader>

      <IndicadoresGrid dados={dados} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AlertasOperacionais dados={dados} />
        </div>
        <ResumoFinanceiroExterno dados={dados} />
      </div>

      {atualizadoEm && (
        <p className="text-xs text-muted-foreground text-right">
          Atualizado às {atualizadoEm.toLocaleTimeString('pt-BR')}
        </p>
      )}
    </div>
  );
}