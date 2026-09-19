import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Loader2, Factory, Clock, AlertTriangle, CheckCircle2, Wrench, Layers, ArrowRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { indicadoresProducao, filaVeiculos, diasParaEntrega } from '@/lib/producao';

const StatCard = ({ icon: Icon, label, value, sub, tone = 'default' }) => {
  const tones = {
    default: 'text-foreground',
    primary: 'text-primary',
    warning: 'text-amber-600',
    danger: 'text-destructive',
    success: 'text-emerald-600',
  };
  return (
    <Card className="card-hover">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon className={`w-4 h-4 ${tones[tone]}`} />
        </div>
        <p className={`mt-2 text-2xl font-bold ${tones[tone]}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
};

export default function DashboardOperacional() {
  const [ordens, setOrdens] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [elevadores, setElevadores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [o, c, v, e] = await Promise.all([
        base44.entities.OrdemServico.list('-created_date', 500),
        base44.entities.Cliente.list('-created_date', 1000),
        base44.entities.Veiculo.list('-created_date', 1000),
        base44.entities.Elevador.list('-created_date', 200),
      ]);
      setOrdens(o);
      setClientes(c);
      setVeiculos(v);
      setElevadores(e);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const ind = indicadoresProducao(ordens, elevadores, 30);
  const clienteNome = (id) => clientes.find((c) => c.id === id)?.nome || '—';
  const veiculoInfo = (id) => {
    const v = veiculos.find((v) => v.id === id);
    return v ? `${v.placa} · ${v.marca} ${v.modelo}` : '—';
  };
  const fila = filaVeiculos(ordens).slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Operacional"
        description="Visão consolidada do pátio — carga de trabalho, capacidade e status da oficina"
      >
        <Button asChild variant="outline">
          <Link to="/producao">Abrir Produção <ArrowRight className="w-4 h-4" /></Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Factory} label="Na fila" value={ind.filaTotal} sub="Aguardando ou em execução" tone="primary" />
        <StatCard icon={Wrench} label="Em execução" value={ind.emExecucao} sub={`${ind.nTecnicos} técnico(s) ativo(s)`} />
        <StatCard icon={AlertTriangle} label="Atrasadas" value={ind.atrasadas} sub="Passaram da entrega prevista" tone={ind.atrasadas > 0 ? 'danger' : 'success'} />
        <StatCard icon={CheckCircle2} label="Concluídas (30d)" value={ind.concluidasPeriodo} sub={`Tempo médio ${ind.tempoMedioHoras}h`} tone="success" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Clock} label="Eficiência global" value={`${ind.eficienciaGlobal}%`} sub={`Ociosidade ${ind.ociosidadeGlobal}%`} />
        <StatCard icon={AlertTriangle} label="Taxa de retrabalho" value={`${ind.taxaRetrabalho}%`} tone={ind.taxaRetrabalho > 10 ? 'warning' : 'default'} />
        <StatCard icon={Layers} label="Elevadores livres" value={`${ind.elevadoresLivres}/${ind.totalElevadores}`} sub={`Ocupação ${ind.ocupacaoElevadores}%`} />
        <StatCard icon={Layers} label="Elevadores ocupados" value={ind.elevadoresOcupados} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Fila de veículos</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to="/producao">Ver tudo</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {fila.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhum veículo na fila.</p>
          ) : (
            <div className="divide-y divide-border">
              {fila.map((os) => {
                const dias = diasParaEntrega(os);
                const atrasado = dias !== null && dias < 0;
                return (
                  <Link
                    key={os.id}
                    to={`/ordens-servico/${os.id}`}
                    className="flex items-center justify-between py-3 hover:bg-accent/50 -mx-2 px-2 rounded-md transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{veiculoInfo(os.veiculo_id)}</p>
                      <p className="text-xs text-muted-foreground truncate">{clienteNome(os.cliente_id)} · OS {os.numero || '—'}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${os.status === 'em_andamento' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {os.status === 'em_andamento' ? 'Em execução' : 'Aprovado'}
                      </span>
                      {dias !== null && (
                        <span className={`text-xs ${atrasado ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          {atrasado ? `${Math.abs(dias)}d atrasado` : `${dias}d p/ entrega`}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}