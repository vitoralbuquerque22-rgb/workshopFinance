import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import MarketingNav from '@/components/marketing/MarketingNav';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/lib/format';
import { ORIGENS_LABEL } from '@/lib/marketing';
import {
  Loader2, Search, MousePointerClick, FileText, UserPlus, LayoutGrid,
  Phone, Wrench, CheckCircle2, Receipt, DollarSign, Circle,
} from 'lucide-react';

export default function MarketingJornada() {
  const [leads, setLeads] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Lead.list('-created_date', 300),
      base44.entities.OrdemServico.list('-created_date', 500),
    ]).then(([l, o]) => { setLeads(l); setOrdens(o); setLoading(false); });
  }, []);

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    return !q || (l.nome || l.cliente_nome || '').toLowerCase().includes(q) || (l.campanha_nome || '').toLowerCase().includes(q);
  });

  const buildEtapas = (lead) => {
    const os = ordens.find((o) => o.cliente_id && o.cliente_id === lead.cliente_id);
    return [
      { label: 'Clique no anúncio', icon: MousePointerClick, data: lead.data_captura, done: !!(lead.utm_source || lead.gclid || lead.fbclid || lead.plataforma) },
      { label: 'Landing Page', icon: FileText, done: !!lead.landing_page, sub: lead.landing_page },
      { label: 'Lead capturado', icon: UserPlus, data: lead.data_captura || lead.created_date, done: true },
      { label: 'CRM', icon: LayoutGrid, done: true, sub: ORIGENS_LABEL[lead.origem] },
      { label: 'Primeiro atendimento', icon: Phone, data: lead.primeiro_atendimento_em, done: !!lead.primeiro_atendimento_em },
      { label: 'Ordem de Serviço', icon: Wrench, data: os?.data_abertura, done: !!os, sub: os ? `OS ${os.numero || ''}` : '' },
      { label: 'Conclusão', icon: CheckCircle2, data: os?.data_fechamento, done: os?.status === 'concluido' },
      { label: 'Nota Fiscal', icon: Receipt, done: !!os?.nota_fiscal_id },
      { label: 'Pagamento', icon: DollarSign, done: !!os?.conta_receber_id },
    ];
  };

  return (
    <div>
      <PageHeader title="Marketing & Growth" description="Jornada completa do cliente, do clique ao faturamento" />
      <MarketingNav />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar lead..." className="pl-9" />
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {filtered.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelected(l)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${selected?.id === l.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'}`}
                >
                  <p className="font-medium text-sm">{l.nome || l.cliente_nome || 'Lead sem nome'}</p>
                  <p className="text-xs text-muted-foreground">{l.campanha_nome || ORIGENS_LABEL[l.origem] || 'Origem manual'}</p>
                </button>
              ))}
              {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">Nenhum lead encontrado.</p>}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {!selected ? (
            <div className="flex items-center justify-center h-full min-h-[300px] bg-card border border-border rounded-xl text-sm text-muted-foreground">
              Selecione um lead para ver a jornada completa.
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-lg">{selected.nome || selected.cliente_nome}</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1 mb-6">
                {selected.plataforma && <span>Plataforma: {ORIGENS_LABEL[selected.plataforma] || selected.plataforma}</span>}
                {selected.campanha_nome && <span>Campanha: {selected.campanha_nome}</span>}
                {selected.utm_source && <span>UTM: {selected.utm_source}</span>}
                {selected.consultor && <span>Consultor: {selected.consultor}</span>}
              </div>

              <div className="relative pl-2">
                {buildEtapas(selected).map((et, i, arr) => (
                  <div key={i} className="flex gap-3 pb-5 last:pb-0 relative">
                    {i < arr.length - 1 && <span className={`absolute left-[15px] top-8 bottom-0 w-px ${et.done ? 'bg-primary/40' : 'bg-border'}`} />}
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${et.done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {et.done ? <et.icon className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                    </div>
                    <div className="pt-1">
                      <p className={`text-sm font-medium ${et.done ? '' : 'text-muted-foreground'}`}>{et.label}</p>
                      {et.sub && <p className="text-xs text-muted-foreground">{et.sub}</p>}
                      {et.data && <p className="text-xs text-muted-foreground">{formatDateTime(et.data)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}