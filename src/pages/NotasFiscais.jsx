import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import NfeConferenciaDialog from '@/components/nfe/NfeConferenciaDialog';
import { formatCurrency, formatDate } from '@/lib/format';

export default function NotasFiscais() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);

  const loadItems = async () => {
    try {
      const data = await base44.entities.NotaFiscal.list('-created_date');
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Notas Fiscais de Entrada" description="Importe o XML, confira divergências e atualize estoque, custo e financeiro num só fluxo">
        <Button onClick={() => setImportOpen(true)}>
          <Upload className="w-4 h-4" /> Importar XML
        </Button>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Nenhuma NF-e recebida ainda</p>
          <p className="text-xs text-muted-foreground mt-1">Importe um XML ou configure o webhook do seu provedor fiscal</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Número/Série</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Emitente</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">CNPJ</th>
                  <th className="text-right px-4 py-3 font-medium">Valor</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Emissão</th>
                  <th className="text-center px-4 py-3 font-medium hidden md:table-cell">Recebimento</th>
                  <th className="text-center px-4 py-3 font-medium">Contas a Pagar</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{item.numero}/{item.serie}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{item.emitente_nome || '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{item.emitente_cnpj || '-'}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.valor_total)}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{formatDate(item.data_emissao)}</td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      {item.itens?.length ? (
                        <span className={`text-xs px-2 py-0.5 rounded ${item.recebimento_completo === false ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {item.recebimento_completo === false ? 'Parcial' : 'Completo'}
                        </span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">{item.contas_pagar_ids?.length || 0}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={item.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <NfeConferenciaDialog open={importOpen} onOpenChange={setImportOpen} onImported={loadItems} />
    </div>
  );
}