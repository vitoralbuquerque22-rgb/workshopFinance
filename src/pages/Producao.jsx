import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import ProducaoKPIs from '@/components/producao/ProducaoKPIs';
import FilaVeiculos from '@/components/producao/FilaVeiculos';
import TecnicosPainel from '@/components/producao/TecnicosPainel';
import GargalosPainel from '@/components/producao/GargalosPainel';
import ElevadoresPainel from '@/components/producao/ElevadoresPainel';
import ElevadorForm from '@/components/producao/ElevadorForm';
import { indicadoresProducao } from '@/lib/producao';

export default function Producao() {
  const [ordens, setOrdens] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [elevadores, setElevadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [formOpen, setFormOpen] = useState(false);
  const [editingEl, setEditingEl] = useState(null);

  const loadData = async () => {
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
  };

  useEffect(() => { loadData(); }, []);

  const clienteNome = (id) => clientes.find((c) => c.id === id)?.nome || '—';
  const veiculoInfo = (id) => {
    const v = veiculos.find((v) => v.id === id);
    return v ? `${v.placa} · ${v.marca} ${v.modelo}` : '—';
  };

  const handleIniciar = async (os) => {
    setActionLoading((a) => ({ ...a, [os.id + 'ini']: true }));
    try {
      await base44.entities.OrdemServico.update(os.id, { status: 'em_andamento', execucao_inicio: new Date().toISOString() });
      // Motor Operacional (Fase 3): registra e sincroniza o evento
      await base44.functions.invoke('motorOperacional', { evento: 'os_iniciada', ordem_servico_id: os.id, payload: { origem: 'producao' } }).catch(() => {});
      await loadData();
    } finally {
      setActionLoading((a) => ({ ...a, [os.id + 'ini']: false }));
    }
  };

  const handleFinalizar = async (os) => {
    setActionLoading((a) => ({ ...a, [os.id + 'fim']: true }));
    try {
      const fim = new Date().toISOString();
      let horas = Number(os.horas_trabalhadas) || 0;
      if (os.execucao_inicio) {
        const h = (new Date(fim) - new Date(os.execucao_inicio)) / 3600000;
        if (h > 0) horas = Math.round(h * 10) / 10;
      }
      await base44.functions.invoke('manageOs', { action: 'finalizar_os', ordem_servico_id: os.id });
      await base44.entities.OrdemServico.update(os.id, { execucao_fim: fim, horas_trabalhadas: horas });
      // Libera elevador vinculado
      const el = elevadores.find((e) => e.ordem_servico_id === os.id);
      if (el) await base44.entities.Elevador.update(el.id, { status: 'livre', ordem_servico_id: '', tecnico_atual: '', ocupado_desde: '' });
      await loadData();
    } finally {
      setActionLoading((a) => ({ ...a, [os.id + 'fim']: false }));
    }
  };

  const handleSaveEl = async (data) => {
    if (editingEl) await base44.entities.Elevador.update(editingEl.id, data);
    else await base44.entities.Elevador.create(data);
    setEditingEl(null);
    await loadData();
  };

  const handleStatusEl = async (el, status) => {
    const patch = { status };
    if (status === 'ocupado') patch.ocupado_desde = new Date().toISOString();
    if (status === 'livre') { patch.ordem_servico_id = ''; patch.tecnico_atual = ''; patch.ocupado_desde = ''; }
    await base44.entities.Elevador.update(el.id, patch);
    await loadData();
  };

  const handleDeleteEl = async (id) => {
    await base44.entities.Elevador.delete(id);
    await loadData();
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const ind = indicadoresProducao(ordens, elevadores, 30);

  return (
    <div className="space-y-6">
      <PageHeader title="Produção" description="Painel da oficina — fila, técnicos, tempo, produtividade e capacidade" />

      <ProducaoKPIs ind={ind} />

      <Tabs defaultValue="fila">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="fila">Fila de Veículos</TabsTrigger>
          <TabsTrigger value="tecnicos">Técnicos & Produtividade</TabsTrigger>
          <TabsTrigger value="gargalos">Gargalos & Eficiência</TabsTrigger>
          <TabsTrigger value="elevadores">Elevadores</TabsTrigger>
        </TabsList>

        <TabsContent value="fila" className="mt-4">
          <FilaVeiculos
            ordens={ordens}
            clienteNome={clienteNome}
            veiculoInfo={veiculoInfo}
            onIniciar={handleIniciar}
            onFinalizar={handleFinalizar}
            actionLoading={actionLoading}
          />
        </TabsContent>

        <TabsContent value="tecnicos" className="mt-4">
          <TecnicosPainel ordens={ordens} />
        </TabsContent>

        <TabsContent value="gargalos" className="mt-4">
          <GargalosPainel ordens={ordens} />
        </TabsContent>

        <TabsContent value="elevadores" className="mt-4">
          <ElevadoresPainel
            elevadores={elevadores}
            ordens={ordens}
            onNovo={() => { setEditingEl(null); setFormOpen(true); }}
            onEditar={(el) => { setEditingEl(el); setFormOpen(true); }}
            onExcluir={handleDeleteEl}
            onStatus={handleStatusEl}
          />
        </TabsContent>
      </Tabs>

      <ElevadorForm open={formOpen} onOpenChange={setFormOpen} onSave={handleSaveEl} editingItem={editingEl} />
    </div>
  );
}