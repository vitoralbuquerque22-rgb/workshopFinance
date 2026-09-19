import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { RefreshCw, Settings, AlertTriangle } from 'lucide-react';
import CustosKPIs from '@/components/custos/CustosKPIs';
import MissaoCustoRow from '@/components/custos/MissaoCustoRow';
import { carregarConfigCusto, calcularCustosMissao } from '@/lib/custosOperacionais';

export default function DashboardCustos() {
  const { toast } = useToast();
  const [missoes, setMissoes] = useState([]);
  const [config, setConfig] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [recalculando, setRecalculando] = useState(false);

  const carregar = async () => {
    const [lista, cfg] = await Promise.all([
      base44.entities.MissaoOperacional.filter({ status: 'concluido' }, '-created_date', 500).catch(() => []),
      carregarConfigCusto(),
    ]);
    setMissoes(lista);
    setConfig(cfg);
    setCarregando(false);
  };

  useEffect(() => { carregar(); }, []);

  // Totais: usa o custo já calculado quando existe, senão calcula ao vivo com a config.
  const totais = useMemo(() => {
    let receita = 0, custo = 0, rent = 0, comReceita = 0, somaMargem = 0;
    for (const m of missoes) {
      const c = m.custos?.calculado_em ? m.custos : calcularCustosMissao(m, config);
      receita += c.receita || 0;
      custo += c.custo_total || 0;
      rent += c.rentabilidade || 0;
      if ((c.receita || 0) > 0) { comReceita++; somaMargem += c.margem || 0; }
    }
    return { receita, custo, rent, margem: comReceita ? somaMargem / comReceita : 0 };
  }, [missoes, config]);

  const recalcularTodos = async () => {
    setRecalculando(true);
    try {
      const res = await base44.functions.invoke('manageCustos', { action: 'recalcular_todos' });
      toast({ title: 'Custos recalculados', description: `${res.data?.processadas || 0} atendimento(s) atualizado(s).` });
      await carregar();
    } catch {
      toast({ title: 'Erro ao recalcular', variant: 'destructive' });
    }
    setRecalculando(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard de Custos" description="Custos, rentabilidade e margem da operação externa.">
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/custos-config"><Settings className="w-4 h-4 mr-2" />Configurar</Link></Button>
          <Button onClick={recalcularTodos} disabled={recalculando}>
            <RefreshCw className={`w-4 h-4 mr-2 ${recalculando ? 'animate-spin' : ''}`} />
            {recalculando ? 'Recalculando...' : 'Recalcular todos'}
          </Button>
        </div>
      </PageHeader>

      {!carregando && !config && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">Nenhuma configuração de custos definida. <Link to="/custos-config" className="underline font-medium">Configure os valores</Link> para calcular os custos.</p>
          </CardContent>
        </Card>
      )}

      <CustosKPIs receita={totais.receita} custo={totais.custo} rentabilidade={totais.rent} margem={totais.margem} />

      {carregando ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-heading font-semibold mb-3">Atendimentos concluídos ({missoes.length})</h3>
            {missoes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Nenhum atendimento externo concluído ainda.</p>
            ) : (
              <div className="space-y-2">
                {missoes.map((m) => <MissaoCustoRow key={m.id} missao={m} config={config} onChanged={carregar} />)}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}