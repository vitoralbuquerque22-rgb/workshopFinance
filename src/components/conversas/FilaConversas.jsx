import { Input } from '@/components/ui/input';
import { Search, Inbox } from 'lucide-react';
import { canalInfo, tempoRelativo, IDENTIFICACAO } from '@/lib/conversas';

const FILTROS = [
  { value: 'todas', label: 'Todas' },
  { value: 'abertas', label: 'Abertas' },
  { value: 'nao_lidas', label: 'Não lidas' },
];

export default function FilaConversas({ conversas, selecionadaId, onSelect, busca, onBusca, filtro, onFiltro }) {
  return (
    <div className="flex h-full flex-col border-r border-border bg-card">
      <div className="p-3 border-b border-border space-y-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar contato, cliente..." value={busca} onChange={(e) => onBusca(e.target.value)} className="pl-9 h-9" />
        </div>
        <div className="flex gap-1">
          {FILTROS.map((f) => (
            <button
              key={f.value}
              onClick={() => onFiltro(f.value)}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                filtro === f.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 text-muted-foreground">
            <Inbox className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm">Nenhuma conversa</p>
          </div>
        ) : (
          conversas.map((c) => {
            const ci = canalInfo(c.canal);
            const Icone = ci.icon;
            const ativa = c.id === selecionadaId;
            const ident = IDENTIFICACAO[c.identificacao_status] || IDENTIFICACAO.nao_identificado;
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className={`w-full text-left px-3 py-3 border-b border-border/60 transition-colors ${
                  ativa ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`relative flex items-center justify-center w-9 h-9 rounded-full shrink-0 ${ci.bg}`}>
                    <Icone className={`w-4 h-4 ${ci.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">{c.contato_nome || c.contato_telefone || c.contato_identificador || 'Contato'}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">{tempoRelativo(c.ultima_mensagem_em)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {c.ultima_mensagem_direcao === 'saida' ? 'Você: ' : ''}{c.ultima_mensagem_texto || 'Sem mensagens'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ident.color}`}>{ident.label}</span>
                      {c.nao_lidas > 0 && (
                        <span className="ml-auto text-[10px] min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                          {c.nao_lidas}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}