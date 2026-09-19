import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EquipeSelector from './EquipeSelector';
import FerramentasSelector from './FerramentasSelector';
import PecasSelector from './PecasSelector';
import { gerarNumeroMissao, novoEvento } from '@/lib/atendimentoExterno';
import { base44 } from '@/api/base44Client';

const vazio = {
  titulo: '', cliente_id: '', veiculo_cliente_id: '', ativo_frota_id: '',
  endereco: '', descricao: '', data_agendada: '', observacoes: '',
  equipe: [], ferramentas: [], pecas: [], status: 'agendado',
};

export default function MissaoForm({ open, onOpenChange, missao, apoio, onSaved }) {
  const editando = !!missao?.id;
  const [form, setForm] = useState(missao ? { ...vazio, ...missao } : vazio);
  const [salvando, setSalvando] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const salvar = async () => {
    if (!form.titulo.trim()) return;
    setSalvando(true);
    const frota = apoio.frota.find((a) => a.id === form.ativo_frota_id);
    const cliente = apoio.clientes.find((c) => c.id === form.cliente_id);
    const dados = {
      ...form,
      ativo_frota_nome: frota?.nome || '',
      cliente_nome: cliente?.nome || '',
      data_agendada: form.data_agendada || null,
    };
    if (editando) {
      await base44.entities.MissaoOperacional.update(missao.id, dados);
    } else {
      dados.numero = await gerarNumeroMissao();
      dados.historico = [novoEvento('cadastro', 'Atendimento externo criado')];
      await base44.entities.MissaoOperacional.create(dados);
    }
    setSalvando(false);
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar Atendimento Externo' : 'Novo Atendimento Externo'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Título *</Label>
            <Input value={form.titulo} onChange={(e) => set({ titulo: e.target.value })} placeholder="Ex: Troca de bateria no cliente" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Cliente</Label>
              <Select value={form.cliente_id || undefined} onValueChange={(v) => set({ cliente_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {apoio.clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Veículo do cliente</Label>
              <Select value={form.veiculo_cliente_id || undefined} onValueChange={(v) => set({ veiculo_cliente_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {apoio.veiculos.map((v) => <SelectItem key={v.id} value={v.id}>{v.placa} — {v.modelo || v.marca}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Veículo da empresa (deslocamento)</Label>
              <Select value={form.ativo_frota_id || undefined} onValueChange={(v) => set({ ativo_frota_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {apoio.frota.map((a) => <SelectItem key={a.id} value={a.id}>{a.nome}{a.placa ? ` (${a.placa})` : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Agendado para</Label>
              <Input type="datetime-local" value={form.data_agendada ? form.data_agendada.slice(0, 16) : ''} onChange={(e) => set({ data_agendada: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
            </div>
          </div>

          <div>
            <Label>Endereço do atendimento</Label>
            <Input value={form.endereco} onChange={(e) => set({ endereco: e.target.value })} placeholder="Rua, número, bairro, cidade" />
          </div>

          <div>
            <Label>Descrição do serviço</Label>
            <Textarea value={form.descricao} onChange={(e) => set({ descricao: e.target.value })} rows={2} />
          </div>

          <div>
            <Label className="mb-2 block">Equipe</Label>
            <EquipeSelector equipe={form.equipe} colaboradores={apoio.colaboradores} onChange={(equipe) => set({ equipe })} />
          </div>

          <div>
            <Label className="mb-2 block">Ferramentas</Label>
            <FerramentasSelector ferramentas={form.ferramentas} patrimonios={apoio.ferramentas} onChange={(ferramentas) => set({ ferramentas })} />
          </div>

          <div>
            <Label className="mb-2 block">Peças</Label>
            <PecasSelector pecas={form.pecas} catalogo={apoio.pecas} onChange={(pecas) => set({ pecas })} />
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => set({ observacoes: e.target.value })} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando || !form.titulo.trim()}>{salvando ? 'Salvando...' : 'Salvar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}