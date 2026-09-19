import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/format';

// Objeto vazio padrão para condição de pagamento.
export const condicaoVazia = {
  forma: 'pix',
  numero_parcelas: 1,
  data_primeiro_vencimento: '',
  conta_bancaria_id: '',
  observacoes: '',
};

const FORMAS = [
  { value: 'pix', label: 'PIX' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'promissoria', label: 'Promissória' },
  { value: 'parcelado', label: 'Parcelado (boleto)' },
];

// Formas que geram título futuro (com vencimento e cobrança automática).
const FORMAS_A_PRAZO = ['boleto', 'promissoria', 'parcelado'];

export default function CondicaoPagamentoFields({ value, onChange, contasBancarias = [], valorTotal }) {
  const cond = { ...condicaoVazia, ...(value || {}) };
  const set = (campo, v) => onChange({ ...cond, [campo]: v });
  const aPrazo = FORMAS_A_PRAZO.includes(cond.forma);
  const parcelas = cond.forma === 'parcelado' ? Math.max(1, Number(cond.numero_parcelas) || 1) : 1;
  const valorParcela = valorTotal && parcelas > 1 ? valorTotal / parcelas : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Forma de Pagamento</Label>
          <Select value={cond.forma} onValueChange={(v) => set('forma', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FORMAS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {cond.forma === 'parcelado' && (
          <div>
            <Label>Nº de Parcelas</Label>
            <Input
              type="number" min={1} max={36}
              value={cond.numero_parcelas}
              onChange={(e) => set('numero_parcelas', parseInt(e.target.value) || 1)}
            />
          </div>
        )}
      </div>

      {aPrazo && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{cond.forma === 'parcelado' ? '1º Vencimento' : 'Vencimento'}</Label>
            <Input
              type="date"
              value={cond.data_primeiro_vencimento}
              onChange={(e) => set('data_primeiro_vencimento', e.target.value)}
            />
          </div>
          {contasBancarias.length > 0 && (
            <div>
              <Label>Conta de Recebimento</Label>
              <Select value={cond.conta_bancaria_id || 'nenhuma'} onValueChange={(v) => set('conta_bancaria_id', v === 'nenhuma' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhuma">Não definir</SelectItem>
                  {contasBancarias.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome || c.banco || c.descricao || 'Conta'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {valorParcela && (
        <p className="text-xs text-muted-foreground">
          {parcelas}x de <strong className="text-foreground">{formatCurrency(valorParcela)}</strong>
        </p>
      )}

      {aPrazo && (
        <p className="text-[11px] text-muted-foreground">
          As mensagens de cobrança serão agendadas automaticamente para {cond.forma === 'parcelado' ? 'cada parcela' : 'este título'} ao emitir a nota.
        </p>
      )}

      <div>
        <Label>Observações do Pagamento</Label>
        <Input
          value={cond.observacoes || ''}
          onChange={(e) => set('observacoes', e.target.value)}
          placeholder="Ex: entrada de 50%, desconto à vista..."
        />
      </div>
    </div>
  );
}