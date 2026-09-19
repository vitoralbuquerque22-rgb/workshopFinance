import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import MarketingNav from '@/components/marketing/MarketingNav';
import CampanhaForm from '@/components/marketing/CampanhaForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { loadMarketingData, metricasPorCampanha, PLATAFORMAS } from '@/lib/marketing';
import { formatCurrency } from '@/lib/format';
import { Plus, Loader2, Pencil, Megaphone } from 'lucide-react';

const statusColor = {
  ativa: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pausada: 'bg-amber-50 text-amber-700 border-amber-200',
  encerrada: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function MarketingCampanhas() {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    try {
      const data = await loadMarketingData();
      setRows(metricasPorCampanha(data).sort((a, b) => (b.campanha.created_date || '').localeCompare(a.campanha.created_date || '')));
    } catch {
      toast({ title: 'Erro', description: 'Falha ao carregar campanhas.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (c) => { setEditing(c); setFormOpen(true); };

  return (
    <div>
      <PageHeader title="Marketing & Growth" description="Campanhas de anúncios e retorno por campanha" />
      <MarketingNav />

      <div className="flex justify-end mb-4">
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Nova Campanha</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-xl">
          <Megaphone className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma campanha cadastrada.</p>
          <Button className="mt-4" onClick={openNew}><Plus className="h-4 w-4" /> Criar primeira campanha</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.campanha.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: PLATAFORMAS[r.campanha.plataforma]?.color }} />
                  <div>
                    <p className="font-semibold">{r.campanha.nome}</p>
                    <p className="text-xs text-muted-foreground">{PLATAFORMAS[r.campanha.plataforma]?.label} · {r.campanha.objetivo}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor[r.campanha.status] || ''}`}>{r.campanha.status}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => openEdit(r.campanha)}><Pencil className="h-4 w-4" /></Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-4 text-sm">
                <Metric label="Investimento" value={formatCurrency(r.investimento)} />
                <Metric label="Leads" value={r.leads} />
                <Metric label="Clientes" value={r.clientes} />
                <Metric label="OS" value={r.ordens} />
                <Metric label="Receita" value={formatCurrency(r.receita)} accent="text-emerald-600" />
                <Metric label="ROI" value={`${r.roi.toFixed(0)}%`} accent={r.roi >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
                <Metric label="ROAS" value={`${r.roas.toFixed(1)}x`} />
              </div>
            </div>
          ))}
        </div>
      )}

      <CampanhaForm open={formOpen} onOpenChange={setFormOpen} campanha={editing} onSaved={load} />
    </div>
  );
}

function Metric({ label, value, accent }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`font-semibold ${accent || ''}`}>{value}</p>
    </div>
  );
}