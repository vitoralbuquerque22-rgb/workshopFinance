import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import PainelFluxo from '@/components/painel/PainelFluxo';
import PainelFinanceiro from '@/components/painel/PainelFinanceiro';
import PainelHoras from '@/components/painel/PainelHoras';
import PainelTecnicos from '@/components/painel/PainelTecnicos';
import PainelRankings from '@/components/painel/PainelRankings';
import PainelAcoes from '@/components/painel/PainelAcoes';
import {
  fluxoDia, financeiroDia, horasDia, cargaTecnicos, rankingDia,
  proximasRevisoes, followUpsHoje, alertasImportantes,
} from '@/lib/painel';

export default function Painel() {
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const [ordens, pedidos, lancamentos, pecas, contasPagar, contasReceber, leads, clientes, veiculos] = await Promise.all([
      base44.entities.OrdemServico.list('-created_date', 500),
      base44.entities.PedidoCompra.list('-created_date', 500),
      base44.entities.LancamentoCaixa.list('-data', 500),
      base44.entities.Peca.list('-created_date', 1000),
      base44.entities.ContaPagar.list('-created_date', 500),
      base44.entities.ContaReceber.list('-created_date', 500),
      base44.entities.Lead.list('-created_date', 300),
      base44.entities.Cliente.list('-created_date', 1000),
      base44.entities.Veiculo.list('-created_date', 1000),
    ]);
    setDados({ ordens, pedidos, lancamentos, pecas, contasPagar, contasReceber, leads, clientes, veiculos });
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  if (loading || !dados) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const { ordens, pedidos, lancamentos, pecas, contasPagar, contasReceber, leads, clientes, veiculos } = dados;

  const clienteNome = (id) => clientes.find((c) => c.id === id)?.nome || '—';
  const veiculoInfo = (id) => {
    const v = veiculos.find((x) => x.id === id);
    return v ? `${v.placa} · ${v.marca} ${v.modelo}` : '—';
  };

  const fluxo = fluxoDia(ordens, pedidos);
  const fin = financeiroDia(ordens, lancamentos);
  const horas = horasDia(ordens);
  const carga = cargaTecnicos(ordens);
  const rkConsultores = rankingDia(ordens, 'consultor');
  const rkTecnicos = rankingDia(ordens, 'tecnico_responsavel');
  const revisoes = proximasRevisoes(ordens);
  const followUps = followUpsHoje(leads);
  const alertas = alertasImportantes({ ordens, pecas, contasPagar, contasReceber, leads });

  return (
    <div className="space-y-5">
      <PageHeader title="Painel Principal" description="Visão do dia em tempo real — sem navegar por vários módulos">
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
        </Button>
      </PageHeader>

      <PainelFluxo fluxo={fluxo} />
      <PainelFinanceiro fin={fin} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PainelHoras horas={horas} />
        <PainelTecnicos carga={carga} />
      </div>

      <PainelRankings consultores={rkConsultores} tecnicos={rkTecnicos} />

      <PainelAcoes
        alertas={alertas}
        revisoes={revisoes}
        followUps={followUps}
        clienteNome={clienteNome}
        veiculoInfo={veiculoInfo}
      />
    </div>
  );
}