import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import CodigoScanner from '@/components/estoque/CodigoScanner';
import NovaMarcaDialog from '@/components/comum/NovaMarcaDialog';
import NovoFornecedorDialog from '@/components/comum/NovoFornecedorDialog';
import { gerarCodigoPeca } from '@/lib/codigos';
import { ScanLine, Plus } from 'lucide-react';

const categorias = [
  { value: 'motor', label: 'Motor' },
  { value: 'freio', label: 'Freio' },
  { value: 'suspensao', label: 'Suspensão' },
  { value: 'eletrica', label: 'Elétrica' },
  { value: 'transmissao', label: 'Transmissão' },
  { value: 'carroceria', label: 'Carroceria' },
  { value: 'acessorios', label: 'Acessórios' },
  { value: 'fluidos', label: 'Fluidos' },
  { value: 'outros', label: 'Outros' },
];

const unidades = ['UN', 'CX', 'KG', 'L', 'MT', 'PCT'];

const origens = [
  { value: '0', label: '0 - Nacional' },
  { value: '1', label: '1 - Estr. Importação Direta' },
  { value: '2', label: '2 - Estr. Mercado Interno' },
  { value: '3', label: '3 - Nacional (>40% import.)' },
  { value: '4', label: '4 - Nacional (PPB)' },
  { value: '5', label: '5 - Nacional (<40% import.)' },
  { value: '6', label: '6 - Estr. s/ Similar (CAMEX)' },
  { value: '7', label: '7 - Estr. Mkt Int. s/ Similar' },
  { value: '8', label: '8 - Nacional (>70% import.)' },
];

const initialForm = {
  codigo: '', descricao: '', marca: '', categoria: 'outros', unidade: 'UN',
  codigo_barras: '', qr_code: '', controla_lote: false, curva_abc: '',
  fornecedor_principal_id: '',
  estoque_atual: 0, estoque_reservado: 0, estoque_consignado: 0,
  estoque_minimo: 0, estoque_maximo: 0, ponto_reposicao: 0, localizacao: '',
  valor_custo_medio: 0, valor_ultima_compra: 0, margem: 0, valor_venda: 0,
  ncm: '', cest: '', cfop: '', origem: '0',
  aliquota_icms: 0, aliquota_ipi: 0, aliquota_pis: 0, aliquota_cofins: 0,
  status: 'ativo',
};

// Preço de Venda = Custo × (1 + Margem%/100)
const calcVenda = (custo, margem) => (Number(custo) || 0) * (1 + (Number(margem) || 0) / 100);

export default function PecaForm({ open, onClose, onSave, peca, fornecedores, pecas = [], marcas = [], onMarcaCreated, onFornecedorCreated }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [scanFor, setScanFor] = useState(null);
  const [novaMarca, setNovaMarca] = useState(false);
  const [novoForn, setNovoForn] = useState(false);

  useEffect(() => {
    if (peca) {
      setForm({ ...initialForm, ...peca });
    } else {
      // Nova peça: gera o SKU automaticamente.
      setForm({ ...initialForm, codigo: gerarCodigoPeca(pecas) });
    }
  }, [peca, open]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  // Recalcula o preço de venda automaticamente ao alterar custo ou margem.
  const setCusto = (v) => setForm(f => ({ ...f, valor_custo_medio: v, valor_venda: calcVenda(v, f.margem) }));
  const setMargem = (v) => setForm(f => ({ ...f, margem: v, valor_venda: calcVenda(f.valor_custo_medio, v) }));

  const handleSubmit = async () => {
    if (!form.codigo || !form.descricao) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{peca ? 'Editar Peça' : 'Nova Peça'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basico">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="basico">Básico</TabsTrigger>
            <TabsTrigger value="estoque">Estoque</TabsTrigger>
            <TabsTrigger value="preco">Preço</TabsTrigger>
            <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
          </TabsList>

          <TabsContent value="basico" className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Código (SKU)</Label>
                <Input value={form.codigo} onChange={(e) => set('codigo', e.target.value)} placeholder="PEC-0001" className="font-mono" />
                <p className="text-[10px] text-muted-foreground">Gerado automaticamente — pode ajustar se necessário.</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Marca</Label>
                <div className="flex gap-1">
                  <Select value={form.marca || 'none'} onValueChange={(v) => set('marca', v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {/* Inclui a marca atual mesmo se não estiver na lista (peças antigas com texto livre) */}
                      {form.marca && !marcas.some((m) => m.nome === form.marca) && <SelectItem value={form.marca}>{form.marca}</SelectItem>}
                      {marcas.map((m) => <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setNovaMarca(true)} title="Nova marca"><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Descrição *</Label>
              <Input value={form.descricao} onChange={(e) => set('descricao', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => set('categoria', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categorias.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Unidade</Label>
                <Select value={form.unidade} onValueChange={(v) => set('unidade', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{unidades.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fornecedor Principal</Label>
              <div className="flex gap-1">
                <Select value={form.fornecedor_principal_id || 'none'} onValueChange={(v) => set('fornecedor_principal_id', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {fornecedores.map(f => <SelectItem key={f.id} value={f.id}>{f.nome_fantasia || f.razao_social}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon" onClick={() => setNovoForn(true)} title="Novo fornecedor"><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Código de Barras</Label>
                <div className="flex gap-1">
                  <Input value={form.codigo_barras} onChange={(e) => set('codigo_barras', e.target.value)} placeholder="EAN/UPC" />
                  <Button type="button" variant="outline" size="icon" onClick={() => setScanFor('codigo_barras')}><ScanLine className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">QR Code</Label>
                <div className="flex gap-1">
                  <Input value={form.qr_code} onChange={(e) => set('qr_code', e.target.value)} />
                  <Button type="button" variant="outline" size="icon" onClick={() => setScanFor('qr_code')}><ScanLine className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="estoque" className="space-y-3 mt-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Estoque Atual</Label>
                <Input type="number" step="0.01" value={form.estoque_atual} onChange={(e) => set('estoque_atual', Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Reservado</Label>
                <Input type="number" step="0.01" value={form.estoque_reservado} onChange={(e) => set('estoque_reservado', Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Consignado</Label>
                <Input type="number" step="0.01" value={form.estoque_consignado} onChange={(e) => set('estoque_consignado', Number(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Estoque Mínimo</Label>
                <Input type="number" step="0.01" value={form.estoque_minimo} onChange={(e) => set('estoque_minimo', Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Estoque Máximo</Label>
                <Input type="number" step="0.01" value={form.estoque_maximo} onChange={(e) => set('estoque_maximo', Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ponto Reposição</Label>
                <Input type="number" step="0.01" value={form.ponto_reposicao} onChange={(e) => set('ponto_reposicao', Number(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Localização (prateleira)</Label>
                <Input value={form.localizacao} onChange={(e) => set('localizacao', e.target.value)} placeholder="A-12-03" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Curva ABC</Label>
                <Select value={form.curva_abc || 'auto'} onValueChange={(v) => set('curva_abc', v === 'auto' ? '' : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automático</SelectItem>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.controla_lote} onCheckedChange={(v) => set('controla_lote', !!v)} /> Controlar por lote/validade</label>
          </TabsContent>

          <TabsContent value="preco" className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Custo Médio</Label>
                <Input type="number" step="0.01" value={form.valor_custo_medio} onChange={(e) => setCusto(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Última Compra</Label>
                <Input type="number" step="0.01" value={form.valor_ultima_compra} onChange={(e) => set('valor_ultima_compra', Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Margem (%)</Label>
                <Input type="number" step="0.01" value={form.margem} onChange={(e) => setMargem(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valor Venda</Label>
                <Input type="number" step="0.01" value={form.valor_venda} onChange={(e) => set('valor_venda', Number(e.target.value))} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Preço de venda calculado automaticamente: <strong>Custo × (1 + Margem%)</strong>. Você pode editar o valor final manualmente.</p>
          </TabsContent>

          <TabsContent value="fiscal" className="space-y-3 mt-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">NCM</Label>
                <Input value={form.ncm} onChange={(e) => set('ncm', e.target.value)} placeholder="12345678" maxLength={8} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">CEST</Label>
                <Input value={form.cest} onChange={(e) => set('cest', e.target.value)} maxLength={7} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">CFOP</Label>
                <Input value={form.cfop} onChange={(e) => set('cfop', e.target.value)} placeholder="5102" maxLength={4} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Origem</Label>
              <Select value={form.origem} onValueChange={(v) => set('origem', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{origens.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">ICMS (%)</Label>
                <Input type="number" step="0.01" value={form.aliquota_icms} onChange={(e) => set('aliquota_icms', Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">IPI (%)</Label>
                <Input type="number" step="0.01" value={form.aliquota_ipi} onChange={(e) => set('aliquota_ipi', Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">PIS (%)</Label>
                <Input type="number" step="0.01" value={form.aliquota_pis} onChange={(e) => set('aliquota_pis', Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">COFINS (%)</Label>
                <Input type="number" step="0.01" value={form.aliquota_cofins} onChange={(e) => set('aliquota_cofins', Number(e.target.value))} />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.codigo || !form.descricao}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>

        <CodigoScanner open={!!scanFor} onClose={() => setScanFor(null)} onDetect={(code) => { if (scanFor) set(scanFor, code); }} />
        <NovaMarcaDialog open={novaMarca} onClose={() => setNovaMarca(false)} onCreated={(m) => { onMarcaCreated?.(m); set('marca', m.nome); }} />
        <NovoFornecedorDialog open={novoForn} onClose={() => setNovoForn(false)} onCreated={(f) => { onFornecedorCreated?.(f); set('fornecedor_principal_id', f.id); }} />
      </DialogContent>
    </Dialog>
  );
}