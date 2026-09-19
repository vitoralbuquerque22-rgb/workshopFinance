import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import GpsItemForm from '@/components/gps/GpsItemForm';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Copy, Star, Settings2, Loader2 } from 'lucide-react';

const tipoLabels = {
  pre_diagnostico: 'Pré-Diagnóstico',
  ppv: 'PPV',
  checklist: 'Checklist',
};

export default function GpsConfig() {
  const { toast } = useToast();
  const [modelos, setModelos] = useState([]);
  const [modeloSel, setModeloSel] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [novoModeloNome, setNovoModeloNome] = useState('');

  useEffect(() => { loadModelos(); }, []);

  const loadModelos = async () => {
    try {
      const data = await base44.entities.GpsModelo.list();
      setModelos(data);
      if (data.length > 0 && !modeloSel) {
        setModeloSel(data.find(m => m.is_default) || data[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (modeloSel) loadItems(modeloSel.id);
  }, [modeloSel?.id]);

  const loadItems = async (modeloId) => {
    try {
      const data = await base44.entities.GpsItemConfig.filter({ modelo_id: modeloId });
      setItems(data);
    } catch {
      setItems([]);
    }
  };

  const handleSaveItem = async (formData) => {
    try {
      if (editingItem) {
        await base44.entities.GpsItemConfig.update(editingItem.id, formData);
      } else {
        await base44.entities.GpsItemConfig.create(formData);
      }
      await loadItems(modeloSel.id);
      toast({ title: 'Item salvo!' });
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao salvar item.', variant: 'destructive' });
    }
  };

  const handleDeleteItem = async (id) => {
    if (!confirm('Excluir este item?')) return;
    try {
      await base44.entities.GpsItemConfig.delete(id);
      await loadItems(modeloSel.id);
      toast({ title: 'Item excluído.' });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao excluir.', variant: 'destructive' });
    }
  };

  const handleReorder = async (item, direction) => {
    const tipoItems = items.filter(i => i.tipo === item.tipo).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    const idx = tipoItems.findIndex(i => i.id === item.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= tipoItems.length) return;
    const swapItem = tipoItems[swapIdx];
    await Promise.all([
      base44.entities.GpsItemConfig.update(item.id, { ordem: swapItem.ordem }),
      base44.entities.GpsItemConfig.update(swapItem.id, { ordem: item.ordem }),
    ]);
    await loadItems(modeloSel.id);
  };

  const handleToggleAtivo = async (item) => {
    await base44.entities.GpsItemConfig.update(item.id, { ativo: !item.ativo });
    await loadItems(modeloSel.id);
  };

  const handleCreateModelo = async () => {
    if (!novoModeloNome) return;
    try {
      const created = await base44.entities.GpsModelo.create({ nome: novoModeloNome, tipo_oficina: 'linha_leve', versao: 1, status: 'ativo' });
      setNovoModeloNome('');
      await loadModelos();
      setModeloSel(created);
      toast({ title: 'Modelo criado!' });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao criar modelo.', variant: 'destructive' });
    }
  };

  const handleDuplicateModelo = async (modelo) => {
    try {
      const created = await base44.entities.GpsModelo.create({
        nome: `${modelo.nome} (cópia)`,
        descricao: modelo.descricao,
        tipo_oficina: modelo.tipo_oficina,
        versao: 1,
        status: 'ativo',
      });
      const modeloItems = await base44.entities.GpsItemConfig.filter({ modelo_id: modelo.id });
      if (modeloItems.length > 0) {
        await base44.entities.GpsItemConfig.bulkCreate(modeloItems.map(i => ({
          modelo_id: created.id, tipo: i.tipo, categoria: i.categoria, titulo: i.titulo,
          descricao: i.descricao, ordem: i.ordem, obrigatorio: i.obrigatorio, ativo: i.ativo,
          tipo_resposta: i.tipo_resposta, opcoes: i.opcoes || [], justificativa: i.justificativa,
          objetivo_comercial: i.objetivo_comercial, peso: i.peso, tempo_estimado_min: i.tempo_estimado_min,
          responsavel: i.responsavel,
        })));
      }
      await loadModelos();
      toast({ title: 'Modelo duplicado!', description: `${modeloItems.length} itens copiados.` });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao duplicar.', variant: 'destructive' });
    }
  };

  const handleSetDefault = async (modelo) => {
    await Promise.all(
      modelos.map(m => base44.entities.GpsModelo.update(m.id, { is_default: m.id === modelo.id }))
    );
    await loadModelos();
    toast({ title: 'Modelo padrão definido!' });
  };

  const sortedItems = (tipo) => items.filter(i => i.tipo === tipo).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

  const renderItemRow = (item, tipoItems) => (
    <div key={item.id} className={`flex items-center gap-2 p-2 rounded-md border ${item.ativo ? '' : 'opacity-50'}`}>
      <div className="flex flex-col">
        <button onClick={() => handleReorder(item, 'up')} disabled={tipoItems[0].id === item.id} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
        <button onClick={() => handleReorder(item, 'down')} disabled={tipoItems[tipoItems.length - 1].id === item.id} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.titulo}</p>
        <div className="flex items-center gap-1 flex-wrap">
          {item.categoria && <Badge variant="outline" className="text-xs">{item.categoria}</Badge>}
          <Badge variant="secondary" className="text-xs">{item.tipo_resposta.replace('_', '/')}</Badge>
          {item.obrigatorio && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
        </div>
      </div>
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleToggleAtivo(item)}>
        <Star className={`h-3.5 w-3.5 ${item.ativo ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingItem(item); setFormOpen(true); }}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteItem(item.id)}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Configuração do GPS" description="Construtor de modelos de inspeção" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <p className="font-medium text-sm">Modelos de Inspeção</p>
            </div>
            <div className="space-y-1">
              {modelos.map(m => (
                <button
                  key={m.id}
                  onClick={() => setModeloSel(m)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                    modeloSel?.id === m.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{m.nome}</span>
                    {m.is_default && <Star className="h-3.5 w-3.5 fill-primary text-primary shrink-0" />}
                  </div>
                  <span className="text-xs text-muted-foreground">{m.tipo_oficina} • v{m.versao}</span>
                </button>
              ))}
            </div>
            <div className="pt-2 border-t space-y-2">
              <Label className="text-xs">Novo modelo</Label>
              <div className="flex gap-2">
                <Input value={novoModeloNome} onChange={e => setNovoModeloNome(e.target.value)} placeholder="Nome do modelo" onKeyDown={e => e.key === 'Enter' && handleCreateModelo()} />
                <Button size="icon" onClick={handleCreateModelo}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
            {modeloSel && (
              <div className="pt-2 border-t flex gap-1">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDuplicateModelo(modeloSel)}>
                  <Copy className="h-3.5 w-3.5" /> Duplicar
                </Button>
                {!modeloSel.is_default && (
                  <Button size="sm" variant="outline" onClick={() => handleSetDefault(modeloSel)}>
                    <Star className="h-3.5 w-3.5" /> Padrão
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {modeloSel && (
          <Card className="lg:col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">{modeloSel.nome}</p>
                  <p className="text-xs text-muted-foreground">{items.length} itens configurados</p>
                </div>
                <Button size="sm" onClick={() => { setEditingItem(null); setFormOpen(true); }}>
                  <Plus className="h-4 w-4" /> Novo Item
                </Button>
              </div>

              <Tabs defaultValue="pre_diagnostico">
                <TabsList className="w-full">
                  <TabsTrigger value="pre_diagnostico" className="flex-1">Pré-Diag. ({sortedItems('pre_diagnostico').length})</TabsTrigger>
                  <TabsTrigger value="ppv" className="flex-1">PPV ({sortedItems('ppv').length})</TabsTrigger>
                  <TabsTrigger value="checklist" className="flex-1">Checklist ({sortedItems('checklist').length})</TabsTrigger>
                </TabsList>

                {['pre_diagnostico', 'ppv', 'checklist'].map(tipo => {
                  const tipoItems = sortedItems(tipo);
                  return (
                    <TabsContent key={tipo} value={tipo} className="space-y-2 mt-3">
                      {tipoItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">Nenhum item. Clique em "Novo Item".</p>
                      ) : (
                        tipoItems.map(item => renderItemRow(item, tipoItems))
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>

      <GpsItemForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingItem(null); }}
        onSave={handleSaveItem}
        item={editingItem}
        modeloId={modeloSel?.id}
      />
    </div>
  );
}