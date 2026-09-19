import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Layers, Car, Megaphone, RotateCcw, UserPlus, History, Mic, MicOff } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { TIPO_RETRABALHO } from '@/lib/retrabalho';
import VeiculoRapidoDialog from '@/components/os/VeiculoRapidoDialog';
import ApontamentoTecnicos from '@/components/os/ApontamentoTecnicos';
import CondicaoPagamentoFields, { condicaoVazia } from '@/components/os/CondicaoPagamentoFields';
import DescontoField, { calcularDesconto } from '@/components/os/DescontoField';
import ClienteRapidoDialog from '@/components/os/ClienteRapidoDialog';
import HistoricoOsPanel from '@/components/os/HistoricoOsPanel';
import PecaSearchSelect from '@/components/os/PecaSearchSelect';
import FaturamentoDistribuicao from '@/components/os/FaturamentoDistribuicao';
import { consultoresElegiveis, tecnicosElegiveis } from '@/lib/colaboradoresOs';

const initialItem = { tipo: 'servico', descricao: '', quantidade: 1, valor_unitario: 0, valor_total: 0, apontamentos: [] };

// Deriva o estado do campo de desconto a partir do valor_desconto (R$) salvo na OS.
function descontoFromOs(item) {
  return { modo: 'valor', valor: Number(item?.valor_desconto) || 0 };
}

function calcularValorMaoObra(item) {
  if (!item) return 0;
  if (item.tipo_cobranca === 'hora') {
    return ((Number(item.tempo_estimado_min) || 0) / 60) * (Number(item.valor_hora) || 0);
  }
  return Number(item.valor) || 0;
}

function calcularServicoComposto(sc, maoObraList, pecasList) {
  if (!sc) return 0;
  if (sc.tipo_valor === 'manual') return Number(sc.valor_total) || 0;
  const moTotal = (sc.itens_mao_obra || []).reduce((sum, i) => {
    const mo = maoObraList.find(m => m.id === i.mao_obra_id);
    return sum + (mo ? calcularValorMaoObra(mo) * (Number(i.quantidade) || 1) : 0);
  }, 0);
  const pecasTotal = (sc.itens_pecas_sugeridas || []).reduce((sum, i) => {
    const p = pecasList.find(p => p.id === i.peca_id);
    return sum + (p ? (Number(p.valor_venda) || 0) * (Number(i.quantidade) || 1) : 0);
  }, 0);
  return moTotal + pecasTotal;
}

export default function OsForm({ open, onOpenChange, onSave, editingItem, retrabalhoOrigem, clientes, veiculos, pecas, maoObra, servicosCompostos, colaboradores = [], cargos = [], fornecedores = [], onVeiculoCreated, onClienteCreated }) {
  const [form, setForm] = useState({
    cliente_id: '',
    veiculo_id: '',
    descricao_problema: '',
    itens: [{ ...initialItem }],
    tecnico_responsavel: '',
    consultor: '',
    data_prevista: '',
    quilometragem_entrada: '',
    observacoes: '',
    tipo_retrabalho: 'nenhum',
    motivo_retrabalho: '',
    os_origem_id: '',
    os_origem_numero: '',
    condicao_pagamento: { ...condicaoVazia },
    desconto: { modo: 'valor', valor: 0 },
    distribuicao_faturamento: { modo: 'unico', cnpj_pecas: '', cnpj_servicos: '' },
  });
  const [filiais, setFiliais] = useState([]);
  const [scSelectorOpen, setScSelectorOpen] = useState(false);
  const [veiculoDialogOpen, setVeiculoDialogOpen] = useState(false);
  const [clienteDialogOpen, setClienteDialogOpen] = useState(false);
  const [historicoOpen, setHistoricoOpen] = useState(false);
  const [ouvindo, setOuvindo] = useState(false);
  const recRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [origemMarketing, setOrigemMarketing] = useState(null);
  const [contasBancarias, setContasBancarias] = useState([]);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setCurrentUser(u);
      setIsAdmin(u?.role === 'admin');
    }).catch(() => {});
    base44.entities.ContaBancaria.list().then(setContasBancarias).catch(() => setContasBancarias([]));
    base44.entities.Filial.list().then(setFiliais).catch(() => setFiliais([]));
  }, []);

  // CNPJ padrão para pré-selecionar em novas OS (matriz, ou a 1ª filial ativa)
  const filialPadraoId = (filiais.find((f) => f.tipo === 'matriz') || filiais.find((f) => f.status !== 'inativa'))?.id || '';

  useEffect(() => {
    if (editingItem) {
      setForm({
        cliente_id: editingItem.cliente_id || '',
        veiculo_id: editingItem.veiculo_id || '',
        descricao_problema: editingItem.descricao_problema || '',
        itens: (editingItem.itens && editingItem.itens.length > 0) ? editingItem.itens.map(i => ({ ...i, apontamentos: i.apontamentos || [] })) : [{ ...initialItem }],
        tecnico_responsavel: editingItem.tecnico_responsavel || '',
        consultor: editingItem.consultor || '',
        data_prevista: editingItem.data_prevista || '',
        quilometragem_entrada: editingItem.quilometragem_entrada ?? '',
        observacoes: editingItem.observacoes || '',
        tipo_retrabalho: editingItem.tipo_retrabalho || (editingItem.retrabalho ? 'interno' : 'nenhum'),
        motivo_retrabalho: editingItem.motivo_retrabalho || '',
        os_origem_id: editingItem.os_origem_id || '',
        os_origem_numero: editingItem.os_origem_numero || '',
        condicao_pagamento: { ...condicaoVazia, ...(editingItem.condicao_pagamento || {}) },
        desconto: descontoFromOs(editingItem),
        distribuicao_faturamento: {
          modo: editingItem.distribuicao_faturamento?.modo || 'unico',
          cnpj_pecas: editingItem.distribuicao_faturamento?.cnpj_pecas || '',
          cnpj_servicos: editingItem.distribuicao_faturamento?.cnpj_servicos || '',
        },
      });
      setOrigemMarketing(editingItem.origem_marketing || null);
    } else {
      setForm({
        cliente_id: retrabalhoOrigem?.cliente_id || '', veiculo_id: retrabalhoOrigem?.veiculo_id || '',
        descricao_problema: '', itens: [{ ...initialItem }], tecnico_responsavel: retrabalhoOrigem?.tecnico_responsavel || '',
        consultor: currentUser?.full_name || '', data_prevista: '', quilometragem_entrada: '', observacoes: '',
        tipo_retrabalho: retrabalhoOrigem ? 'interno' : 'nenhum', motivo_retrabalho: '',
        os_origem_id: retrabalhoOrigem?.id || '', os_origem_numero: retrabalhoOrigem?.numero || '',
        condicao_pagamento: { ...condicaoVazia },
        desconto: { modo: 'valor', valor: 0 },
        distribuicao_faturamento: { modo: 'unico', cnpj_pecas: filialPadraoId, cnpj_servicos: filialPadraoId },
      });
      setOrigemMarketing(null);
    }
  }, [editingItem, retrabalhoOrigem, open, currentUser, filialPadraoId]);

  const handleChange = (field, value) => setForm({ ...form, [field]: value });
  // Regra de rateio é editável até o faturamento — trava quando a OS já emitiu nota.
  const ETAPAS_POS_FATURAMENTO = ['nota_emitida', 'pagamento', 'entrega', 'pos_venda'];
  const faturamentoBloqueado = !!editingItem?.nota_fiscal_id || ETAPAS_POS_FATURAMENTO.includes(editingItem?.etapa_fluxo);
  const veiculosCliente = form.cliente_id ? veiculos.filter(v => v.cliente_id === form.cliente_id) : [];
  const consultores = consultoresElegiveis(colaboradores, cargos);
  const tecnicos = tecnicosElegiveis(colaboradores, cargos);

  // Cliente recém-criado no cadastro rápido: seleciona automaticamente na OS.
  const handleClienteCriado = (cliente) => {
    onClienteCreated?.(cliente);
    handleClienteChange(cliente.id);
  };

  // Captura por voz (SpeechRecognition) — anexa a transcrição à descrição do problema.
  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const toggleVoz = () => {
    if (!SR) return;
    if (ouvindo) { recRef.current?.stop(); return; }
    const rec = new SR();
    rec.lang = 'pt-BR';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      let texto = '';
      for (let i = e.resultIndex; i < e.results.length; i++) texto += e.results[i][0].transcript + ' ';
      setForm((f) => ({ ...f, descricao_problema: (f.descricao_problema ? f.descricao_problema + ' ' : '') + texto.trim() }));
    };
    rec.onend = () => setOuvindo(false);
    rec.onerror = () => setOuvindo(false);
    recRef.current = rec;
    try { rec.start(); setOuvindo(true); } catch { /* já iniciado */ }
  };

  // Ao escolher o cliente, busca o lead mais recente para herdar a origem de marketing
  const handleClienteChange = async (clienteId) => {
    setForm({ ...form, cliente_id: clienteId, veiculo_id: '' });
    setOrigemMarketing(null);
    if (!clienteId || editingItem) return;
    try {
      const leads = await base44.entities.Lead.filter({ cliente_id: clienteId }, '-created_date', 1);
      const lead = leads?.[0];
      if (lead && (lead.origem || lead.plataforma || lead.campanha_nome)) {
        setOrigemMarketing({
          lead_id: lead.id,
          origem: lead.origem || '',
          plataforma: lead.plataforma || '',
          campanha_id: lead.campanha_id || '',
          campanha_nome: lead.campanha_nome || '',
          anuncio: lead.anuncio || '',
          utm_source: lead.utm_source || '',
          utm_medium: lead.utm_medium || '',
          utm_campaign: lead.utm_campaign || '',
          utm_content: lead.utm_content || '',
        });
      }
    } catch { /* sem lead vinculado */ }
  };

  const handleVeiculoCriado = (veiculo) => {
    onVeiculoCreated?.(veiculo);
    setForm((p) => ({ ...p, veiculo_id: veiculo.id }));
  };

  const updateItem = (idx, field, value) => {
    const itens = [...form.itens];
    itens[idx] = { ...itens[idx], [field]: value };
    itens[idx].valor_total = (parseFloat(itens[idx].quantidade) || 0) * (parseFloat(itens[idx].valor_unitario) || 0);
    setForm({ ...form, itens });
  };

  const updateApontamentos = (idx, apontamentos) => {
    const itens = [...form.itens];
    itens[idx] = { ...itens[idx], apontamentos };
    setForm({ ...form, itens });
  };

  const handlePecaSelect = (idx, pecaId) => {
    const peca = pecas.find(p => p.id === pecaId);
    if (!peca) return;
    const itens = [...form.itens];
    itens[idx] = {
      ...itens[idx],
      tipo: 'peca',
      peca_id: pecaId,
      descricao: `${peca.codigo} - ${peca.descricao}`,
      valor_unitario: Number(peca.valor_venda) || 0,
      custo_unitario: Number(peca.valor_custo_medio) || 0,
      valor_total: (parseFloat(itens[idx].quantidade) || 1) * (Number(peca.valor_venda) || 0),
    };
    setForm({ ...form, itens });
  };

  const handleMaoObraSelect = (idx, moId) => {
    const mo = maoObra.find(m => m.id === moId);
    if (!mo) return;
    const valor = calcularValorMaoObra(mo);
    const itens = [...form.itens];
    itens[idx] = {
      ...itens[idx],
      tipo: 'mao_obra',
      mao_obra_id: moId,
      descricao: `${mo.codigo} - ${mo.descricao}`,
      valor_unitario: valor,
      valor_total: (parseFloat(itens[idx].quantidade) || 1) * valor,
    };
    setForm({ ...form, itens });
  };

  const handleTipoChange = (idx, tipo) => {
    const itens = [...form.itens];
    itens[idx] = { tipo, descricao: '', quantidade: 1, valor_unitario: 0, valor_total: 0, apontamentos: [] };
    setForm({ ...form, itens });
  };

  const addItem = (tipo = 'servico') => setForm({ ...form, itens: [...form.itens, { ...initialItem, tipo }] });
  const removeItem = (idx) => setForm({ ...form, itens: form.itens.filter((_, i) => i !== idx) });

  const expandirServicoComposto = (scId) => {
    const sc = servicosCompostos.find(s => s.id === scId);
    if (!sc) return;
    const novosItens = [];
    (sc.itens_mao_obra || []).forEach(i => {
      const mo = maoObra.find(m => m.id === i.mao_obra_id);
      if (mo) {
        const valor = calcularValorMaoObra(mo);
        novosItens.push({
          tipo: 'mao_obra',
          mao_obra_id: mo.id,
          servico_composto_id: scId,
          descricao: `${mo.codigo} - ${mo.descricao}`,
          quantidade: Number(i.quantidade) || 1,
          valor_unitario: valor,
          valor_total: valor * (Number(i.quantidade) || 1),
          apontamentos: [],
        });
      }
    });
    (sc.itens_pecas_sugeridas || []).forEach(i => {
      const p = pecas.find(p => p.id === i.peca_id);
      if (p) {
        novosItens.push({
          tipo: 'peca',
          peca_id: p.id,
          servico_composto_id: scId,
          descricao: `${p.codigo} - ${p.descricao}`,
          quantidade: Number(i.quantidade) || 1,
          valor_unitario: Number(p.valor_venda) || 0,
          custo_unitario: Number(p.valor_custo_medio) || 0,
          valor_total: (Number(p.valor_venda) || 0) * (Number(i.quantidade) || 1),
          apontamentos: [],
        });
      }
    });
    const itensSemVazios = form.itens.filter(i => i.descricao || i.peca_id || i.mao_obra_id);
    setForm({ ...form, itens: [...itensSemVazios, ...novosItens] });
    setScSelectorOpen(false);
  };

  const totals = form.itens.reduce((acc, item) => {
    if (item.tipo === 'peca') acc.pecas += item.valor_total || 0;
    else acc.servicos += item.valor_total || 0;
    acc.custo += (parseFloat(item.custo_unitario) || 0) * (parseFloat(item.quantidade) || 0);
    return acc;
  }, { pecas: 0, servicos: 0, custo: 0 });
  const valorBruto = totals.pecas + totals.servicos;
  const valorDesconto = calcularDesconto({ ...form.desconto, bruto: valorBruto });
  const valorTotal = Math.max(0, valorBruto - valorDesconto);

  const handleSubmit = async () => {
    const { desconto, ...formLimpo } = form;
    const payload = {
      ...formLimpo,
      quilometragem_entrada: form.quilometragem_entrada ? parseInt(form.quilometragem_entrada) : undefined,
      valor_pecas: totals.pecas,
      valor_servicos: totals.servicos,
      valor_desconto: valorDesconto,
      valor_total: valorTotal,
      custo_total: totals.custo,
      status: editingItem?.status || 'orcamento',
      tipo_retrabalho: form.tipo_retrabalho || 'nenhum',
      retrabalho: (form.tipo_retrabalho && form.tipo_retrabalho !== 'nenhum'),
      motivo_retrabalho: form.motivo_retrabalho || '',
      os_origem_id: form.os_origem_id || undefined,
      os_origem_numero: form.os_origem_numero || undefined,
      condicao_pagamento: form.condicao_pagamento,
      distribuicao_faturamento: form.distribuicao_faturamento,
    };
    if (origemMarketing) payload.origem_marketing = origemMarketing;
    // Rastreabilidade — gravada apenas na criação
    if (!editingItem && currentUser) {
      payload.criado_por_id = currentUser.id;
      payload.criado_por_nome = currentUser.full_name || currentUser.email;
      payload.consultor_id = currentUser.id;
      payload.filial_id = currentUser.filial_id || undefined;
      payload.empresa_id = currentUser.empresa_id || undefined;
    }
    await onSave(payload);
    onOpenChange(false);
  };

  const itensPecas = form.itens.map((it, idx) => ({ it, idx })).filter(({ it }) => it.tipo === 'peca');
  const itensServico = form.itens.map((it, idx) => ({ it, idx })).filter(({ it }) => it.tipo !== 'peca');

  const renderItemRow = ({ it: item, idx }) => (
    <div key={idx} className="p-2 border border-border rounded-lg">
      <div className="grid grid-cols-12 gap-2 items-end">
        <div className="col-span-2">
          <Select value={item.tipo} onValueChange={(v) => handleTipoChange(idx, v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="servico">Serviço</SelectItem>
              <SelectItem value="peca">Peça</SelectItem>
              <SelectItem value="mao_obra">Mão de Obra</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-4">
          {item.tipo === 'peca' ? (
            <PecaSearchSelect pecas={pecas} fornecedores={fornecedores} value={item.peca_id || ''} onSelect={(id) => id ? handlePecaSelect(idx, id) : updateItem(idx, 'peca_id', '')} />
          ) : item.tipo === 'mao_obra' ? (
            <select className="h-8 w-full text-xs rounded-md border border-input bg-transparent px-2" value={item.mao_obra_id || ''} onChange={(e) => handleMaoObraSelect(idx, e.target.value)}>
              <option value="">Selecione mão de obra...</option>
              {maoObra.map(m => <option key={m.id} value={m.id}>{m.codigo} - {m.descricao}</option>)}
            </select>
          ) : (
            <Input className="h-8 text-xs" placeholder="Descrição" value={item.descricao} onChange={(e) => updateItem(idx, 'descricao', e.target.value)} />
          )}
        </div>
        <div className="col-span-2"><Input className="h-8 text-xs" type="number" placeholder="Qtd" value={item.quantidade} onChange={(e) => updateItem(idx, 'quantidade', e.target.value)} /></div>
        <div className="col-span-2"><Input className="h-8 text-xs" type="number" step="0.01" placeholder="Valor Unit." value={item.valor_unitario} onChange={(e) => updateItem(idx, 'valor_unitario', e.target.value)} /></div>
        <div className="col-span-2 flex h-8 items-center justify-end rounded-md bg-muted/50 px-2 text-xs font-semibold">{formatCurrency(item.valor_total || 0)}</div>
        <div className="col-span-1 flex justify-end">
          {form.itens.length > 1 && <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeItem(idx)}><Trash2 className="w-3.5 h-3.5" /></Button>}
        </div>
      </div>
      {item.tipo !== 'peca' && (
        <ApontamentoTecnicos apontamentos={item.apontamentos || []} colaboradores={colaboradores} onChange={(a) => updateApontamentos(idx, a)} />
      )}
    </div>
  );

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between">
                <Label>Cliente *</Label>
                <div className="flex items-center gap-2">
                  {form.cliente_id && (
                    <button type="button" onClick={() => setHistoricoOpen(true)} className="text-xs text-primary hover:underline flex items-center gap-1">
                      <History className="w-3 h-3" /> OS anteriores
                    </button>
                  )}
                  <button type="button" onClick={() => setClienteDialogOpen(true)} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <UserPlus className="w-3 h-3" /> Novo cliente
                  </button>
                </div>
              </div>
              <Select value={form.cliente_id} onValueChange={handleClienteChange}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Veículo *</Label>
                {form.cliente_id && (
                  <button type="button" onClick={() => setVeiculoDialogOpen(true)} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Car className="w-3 h-3" /> Novo veículo
                  </button>
                )}
              </div>
              <Select value={form.veiculo_id} onValueChange={(v) => handleChange('veiculo_id', v)} disabled={!form.cliente_id}>
                <SelectTrigger><SelectValue placeholder={form.cliente_id ? "Selecione" : "Escolha um cliente"} /></SelectTrigger>
                <SelectContent>
                  {veiculosCliente.map(v => <SelectItem key={v.id} value={v.id}>{v.placa} - {v.marca} {v.modelo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <FaturamentoDistribuicao
            value={form.distribuicao_faturamento}
            filiais={filiais}
            onChange={(v) => handleChange('distribuicao_faturamento', v)}
            disabled={faturamentoBloqueado}
          />

          {origemMarketing && (
            <div className="flex items-center gap-2 text-xs bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
              <Megaphone className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-muted-foreground">Origem de marketing:</span>
              <span className="font-medium">{origemMarketing.plataforma || origemMarketing.origem || 'Lead'}</span>
              {origemMarketing.campanha_nome && <span className="text-muted-foreground">· {origemMarketing.campanha_nome}</span>}
            </div>
          )}

          {form.os_origem_numero && (
            <div className="flex items-center gap-2 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <RotateCcw className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span className="text-muted-foreground">Retrabalho da</span>
              <span className="font-medium text-red-700">{form.os_origem_numero}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Classificação (Retrabalho)</Label>
              <Select value={form.tipo_retrabalho} onValueChange={(v) => handleChange('tipo_retrabalho', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_RETRABALHO).map(([k, label]) => <SelectItem key={k} value={k}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.tipo_retrabalho !== 'nenhum' && (
              <div><Label>Motivo do Retrabalho</Label><Input value={form.motivo_retrabalho} onChange={(e) => handleChange('motivo_retrabalho', e.target.value)} placeholder="Por que o veículo voltou?" /></div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label>Descrição do Problema</Label>
              {SR && (
                <Button type="button" size="sm" variant={ouvindo ? 'destructive' : 'outline'} className="h-7 text-xs" onClick={toggleVoz}>
                  {ouvindo ? <><MicOff className="w-3.5 h-3.5" /> Parar</> : <><Mic className="w-3.5 h-3.5" /> Falar</>}
                </Button>
              )}
            </div>
            <Textarea rows={2} value={form.descricao_problema} onChange={(e) => handleChange('descricao_problema', e.target.value)} placeholder={ouvindo ? 'Ouvindo… fale o problema relatado' : ''} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Consultor / Atendente</Label>
              <Select value={form.consultor || ''} onValueChange={(v) => handleChange('consultor', v)} disabled={!isAdmin && !editingItem}>
                <SelectTrigger><SelectValue placeholder="Selecione o consultor" /></SelectTrigger>
                <SelectContent>
                  {form.consultor && !consultores.some((c) => c.nome === form.consultor) && (
                    <SelectItem value={form.consultor}>{form.consultor}</SelectItem>
                  )}
                  {consultores.length === 0 && <SelectItem value="__none" disabled>Nenhum consultor elegível</SelectItem>}
                  {consultores.map((c) => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
              {!isAdmin && !editingItem && <p className="text-[10px] text-muted-foreground mt-1">Definido automaticamente pelo usuário logado.</p>}
            </div>
            <div>
              <Label>Técnico Responsável</Label>
              <Select value={form.tecnico_responsavel || ''} onValueChange={(v) => handleChange('tecnico_responsavel', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o técnico" /></SelectTrigger>
                <SelectContent>
                  {form.tecnico_responsavel && !tecnicos.some((t) => t.nome === form.tecnico_responsavel) && (
                    <SelectItem value={form.tecnico_responsavel}>{form.tecnico_responsavel}</SelectItem>
                  )}
                  {tecnicos.length === 0 && <SelectItem value="__none" disabled>Nenhum técnico elegível</SelectItem>}
                  {tecnicos.map((t) => <SelectItem key={t.id} value={t.nome}>{t.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label>Data Prevista</Label><Input type="date" value={form.data_prevista} onChange={(e) => handleChange('data_prevista', e.target.value)} /></div>
            <div><Label>Quilometragem de Entrada</Label><Input type="number" value={form.quilometragem_entrada} onChange={(e) => handleChange('quilometragem_entrada', e.target.value)} /></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Itens da OS</Label>
              <div className="flex gap-2">
                {servicosCompostos?.length > 0 && (
                  <Select onValueChange={(v) => expandirServicoComposto(v)} value="">
                    <SelectTrigger className="h-8 text-xs w-auto gap-1"><Layers className="w-3.5 h-3.5" /> Serviço Composto</SelectTrigger>
                    <SelectContent>
                      {servicosCompostos.map(sc => (
                        <SelectItem key={sc.id} value={sc.id}>
                          {sc.codigo} - {sc.descricao} ({formatCurrency(calcularServicoComposto(sc, maoObra, pecas))})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button size="sm" variant="outline" onClick={() => addItem('servico')}><Plus className="w-3.5 h-3.5" /> Serviço / Mão de Obra</Button>
                <Button size="sm" variant="outline" onClick={() => addItem('peca')}><Plus className="w-3.5 h-3.5" /> Peça</Button>
              </div>
            </div>

            {itensServico.length > 0 && (
              <div className="mb-3">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Serviços & Mão de Obra</p>
                <div className="grid grid-cols-12 gap-2 px-2 mb-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  <div className="col-span-2">Tipo</div>
                  <div className="col-span-4">Descrição</div>
                  <div className="col-span-2">Qtd</div>
                  <div className="col-span-2">Valor Unit.</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                <div className="space-y-2">{itensServico.map(renderItemRow)}</div>
              </div>
            )}
            {itensPecas.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Peças</p>
                <div className="grid grid-cols-12 gap-2 px-2 mb-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  <div className="col-span-2">Tipo</div>
                  <div className="col-span-4">Descrição</div>
                  <div className="col-span-2">Qtd</div>
                  <div className="col-span-2">Valor Unit.</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                <div className="space-y-2">{itensPecas.map(renderItemRow)}</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-3 p-3 bg-muted/50 rounded-lg text-sm">
            <div><span className="text-muted-foreground">Peças:</span> <strong>{formatCurrency(totals.pecas)}</strong></div>
            <div><span className="text-muted-foreground">Serviços:</span> <strong>{formatCurrency(totals.servicos)}</strong></div>
            <div><span className="text-muted-foreground">Desconto:</span> <strong className="text-destructive">{valorDesconto > 0 ? '− ' : ''}{formatCurrency(valorDesconto)}</strong></div>
            <div><span className="text-muted-foreground">Total:</span> <strong className="text-primary text-base">{formatCurrency(valorTotal)}</strong></div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Desconto</p>
            <DescontoField value={form.desconto} onChange={(v) => handleChange('desconto', v)} bruto={valorBruto} />
          </div>

          <div><Label>Observações</Label><Textarea rows={2} value={form.observacoes} onChange={(e) => handleChange('observacoes', e.target.value)} /></div>

          <div className="pt-1 border-t border-border">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 mt-2">Condições de Pagamento</p>
            <CondicaoPagamentoFields
              value={form.condicao_pagamento}
              onChange={(v) => handleChange('condicao_pagamento', v)}
              contasBancarias={contasBancarias}
              valorTotal={valorTotal}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!form.cliente_id || !form.veiculo_id}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <VeiculoRapidoDialog open={veiculoDialogOpen} onOpenChange={setVeiculoDialogOpen} clienteId={form.cliente_id} onCreated={handleVeiculoCriado} />
    <ClienteRapidoDialog open={clienteDialogOpen} onOpenChange={setClienteDialogOpen} onCreated={handleClienteCriado} />
    <HistoricoOsPanel open={historicoOpen} onOpenChange={setHistoricoOpen} clienteId={form.cliente_id} clienteNome={clientes.find((c) => c.id === form.cliente_id)?.nome} veiculos={veiculos} />
    </>
  );
}