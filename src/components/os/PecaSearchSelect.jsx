import { useState, useRef, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

const catLabels = {
  motor: 'Motor', freio: 'Freio', suspensao: 'Suspensão', eletrica: 'Elétrica',
  transmissao: 'Transmissão', carroceria: 'Carroceria', acessorios: 'Acessórios',
  fluidos: 'Fluidos', outros: 'Outros',
};

// Busca de peça multi-campo: código (SKU), nome, marca, categoria, fabricante,
// código de barras e fornecedor. Usada nas linhas de peça da OS.
export default function PecaSearchSelect({ pecas = [], value, onSelect, fornecedores = [] }) {
  const [query, setQuery] = useState('');
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);

  const fornNome = (id) => {
    const f = fornecedores.find((f) => f.id === id);
    return f ? (f.nome_fantasia || f.razao_social) : '';
  };

  const selecionada = pecas.find((p) => p.id === value);

  useEffect(() => {
    const onClickFora = (e) => { if (ref.current && !ref.current.contains(e.target)) setAberto(false); };
    document.addEventListener('mousedown', onClickFora);
    return () => document.removeEventListener('mousedown', onClickFora);
  }, []);

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pecas.slice(0, 30);
    return pecas.filter((p) => {
      const campos = [
        p.codigo, p.descricao, p.marca, catLabels[p.categoria] || p.categoria,
        p.fabricante, p.codigo_barras, fornNome(p.fornecedor_principal_id),
      ];
      return campos.some((c) => String(c || '').toLowerCase().includes(q));
    }).slice(0, 40);
  }, [query, pecas, fornecedores]);

  if (selecionada && !aberto) {
    return (
      <div className="h-8 flex items-center gap-1 text-xs rounded-md border border-input px-2">
        <span className="truncate flex-1">{selecionada.codigo} - {selecionada.descricao}</span>
        <button type="button" className="text-muted-foreground hover:text-destructive shrink-0" onClick={() => { onSelect(''); setAberto(true); }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          className="h-8 text-xs pl-7"
          placeholder="Buscar peça (código, nome, marca, fornecedor…)"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setAberto(true); }}
          onFocus={() => setAberto(true)}
        />
      </div>
      {aberto && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-md border bg-popover shadow-md">
          {resultados.length === 0 ? (
            <div className="px-3 py-3 text-xs text-muted-foreground">Nenhuma peça encontrada.</div>
          ) : resultados.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onSelect(p.id); setAberto(false); setQuery(''); }}
              className="w-full text-left px-3 py-2 hover:bg-accent transition-colors border-b last:border-0"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium truncate">{p.codigo} - {p.descricao}</span>
                <span className="text-xs text-muted-foreground shrink-0">{formatCurrency(p.valor_venda)}</span>
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {[p.marca, catLabels[p.categoria] || p.categoria, fornNome(p.fornecedor_principal_id)].filter(Boolean).join(' · ')}
                {p.codigo_barras ? ` · ${p.codigo_barras}` : ''}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}