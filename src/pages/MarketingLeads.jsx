import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import MarketingNav from '@/components/marketing/MarketingNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import PipelineBoard from '@/components/crm/PipelineBoard';
import CrmDashboard from '@/components/crm/CrmDashboard';
import LeadForm from '@/components/crm/LeadForm';
import LeadDetail from '@/components/crm/LeadDetail';
import PerdaDialog from '@/components/crm/PerdaDialog';
import TarefasPainel from '@/components/crm/TarefasPainel';
import { Plus, LayoutGrid, BarChart3, Loader2, Search, ListTodo } from 'lucide-react';

export default function MarketingLeads() {
  const { toast } = useToast();
  const [view, setView] = useState('pipeline');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [perdaOpen, setPerdaOpen] = useState(false);
  const [pendingPerda, setPendingPerda] = useState(null);

  const load = async () => {
    try {
      const data = await base44.entities.Lead.list('-created_date', 300);
      setLeads(data);
    } catch {
      toast({ title: 'Erro', description: 'Falha ao carregar leads.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const applyMove = async (leadId, novaEtapa, extra = {}) => {
    const patch = {
      etapa: novaEtapa,
      status: novaEtapa === 'ganho' ? 'convertido' : novaEtapa === 'perdido' ? 'perdido' : 'em_contato',
      ...extra,
    };
    if (novaEtapa === 'em_contato') {
      const lead = leads.find((l) => l.id === leadId);
      if (lead && !lead.primeiro_atendimento_em) patch.primeiro_atendimento_em = new Date().toISOString();
    }
    if (novaEtapa === 'ganho') patch.data_ganho = new Date().toISOString();
    if (novaEtapa === 'perdido') patch.data_perda = new Date().toISOString();
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, ...patch } : l)));
    await base44.entities.Lead.update(leadId, patch);
    load();
  };

  const handleMove = (leadId, novaEtapa) => {
    if (novaEtapa === 'perdido') {
      setPendingPerda({ leadId });
      setPerdaOpen(true);
      return;
    }
    applyMove(leadId, novaEtapa);
  };

  const confirmPerda = (dados) => {
    if (pendingPerda) applyMove(pendingPerda.leadId, 'perdido', dados);
    setPerdaOpen(false);
    setPendingPerda(null);
  };

  const openDetail = (lead) => { setDetailId(lead.id); setDetailOpen(true); };
  const openNew = () => { setEditingLead(null); setFormOpen(true); };
  const openEdit = (lead) => { setEditingLead(lead); setDetailOpen(false); setFormOpen(true); };

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    return !q ||
      (l.nome || l.cliente_nome || '').toLowerCase().includes(q) ||
      (l.placa || '').toLowerCase().includes(q) ||
      (l.campanha_nome || '').toLowerCase().includes(q) ||
      (l.consultor || '').toLowerCase().includes(q);
  });

  return (
    <div>
      <PageHeader title="Marketing & Growth" description="CRM de leads com rastreamento completo de origem" />
      <MarketingNav />

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex gap-2">
          <Button variant={view === 'pipeline' ? 'default' : 'outline'} size="sm" onClick={() => setView('pipeline')}>
            <LayoutGrid className="h-4 w-4" /> Pipeline
          </Button>
          <Button variant={view === 'tarefas' ? 'default' : 'outline'} size="sm" onClick={() => setView('tarefas')}>
            <ListTodo className="h-4 w-4" /> Tarefas
          </Button>
          <Button variant={view === 'indicadores' ? 'default' : 'outline'} size="sm" onClick={() => setView('indicadores')}>
            <BarChart3 className="h-4 w-4" /> Indicadores
          </Button>
        </div>
        {view === 'pipeline' && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, campanha, placa..." className="pl-9" />
          </div>
        )}
        <div className="sm:ml-auto">
          <Button onClick={openNew}><Plus className="h-4 w-4" /> Novo Lead</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : view === 'pipeline' ? (
        <PipelineBoard leads={filtered} onCardClick={openDetail} onMove={handleMove} />
      ) : view === 'tarefas' ? (
        <TarefasPainel leads={leads} onOpenLead={openDetail} />
      ) : (
        <CrmDashboard leads={leads} />
      )}

      <LeadForm open={formOpen} onOpenChange={setFormOpen} lead={editingLead} onSaved={load} />
      <LeadDetail leadId={detailId} open={detailOpen} onOpenChange={setDetailOpen} onEdit={openEdit} onChanged={load} />
      <PerdaDialog open={perdaOpen} onOpenChange={setPerdaOpen} onConfirm={confirmPerda} />
    </div>
  );
}