import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Building2, MapPin, Phone, FileCheck, Landmark } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import FilialForm from '@/components/filiais/FilialForm';

export default function Filiais() {
  const [items, setItems] = useState([]);
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    try {
      const [data, cts] = await Promise.all([
        base44.entities.Filial.list('-created_date'),
        base44.entities.ContaBancaria.list().catch(() => []),
      ]);
      setItems(data);
      setContas(cts);
    } finally { setLoading(false); }
  };

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (item) => { setEditing(item); setModalOpen(true); };

  const handleSaved = () => { setModalOpen(false); loadItems(); };

  const handleDelete = async (id) => {
    await base44.entities.Filial.delete(id);
    loadItems();
  };

  const toggleStatus = async (item) => {
    await base44.entities.Filial.update(item.id, { status: item.status === 'ativa' ? 'inativa' : 'ativa' });
    loadItems();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Filiais" description="Gerencie suas unidades e filiais">
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Nova Filial
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.length === 0 ? (
          <div className="col-span-full bg-card rounded-xl border border-border p-12 text-center">
            <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma filial cadastrada</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="bg-card rounded-xl border border-border p-5 card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                    item.tipo === 'matriz' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-sm">{item.nome}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{item.tipo}</p>
                  </div>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {item.cnpj && <p><span className="font-medium text-foreground">CNPJ:</span> {item.cnpj}</p>}
                {item.endereco && (
                  <p className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {item.endereco}
                  </p>
                )}
                {item.telefone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    {item.telefone}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(item.fiscal?.emite_nfe || item.fiscal?.emite_nfse) && (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium">
                    <FileCheck className="w-3 h-3" />
                    {item.fiscal?.emite_nfe && item.fiscal?.emite_nfse ? 'NF-e + NFS-e' : item.fiscal?.emite_nfe ? 'NF-e' : 'NFS-e'}
                  </span>
                )}
                {item.recebedor?.ativo && (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium">
                    <Landmark className="w-3 h-3" /> Recebedor
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                <Button size="sm" variant="outline" onClick={() => openEdit(item)} className="flex-1">
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggleStatus(item)}>
                  {item.status === 'ativa' ? 'Desativar' : 'Ativar'}
                </Button>
                <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Filial' : 'Nova Filial'}</DialogTitle>
          </DialogHeader>
          {modalOpen && (
            <FilialForm
              editing={editing}
              contas={contas}
              onSaved={handleSaved}
              onCancel={() => setModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}