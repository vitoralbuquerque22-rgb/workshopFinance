import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { calcularRateio, rotuloBloco } from '@/lib/rateio';
import { formatCurrency } from '@/lib/format';
import { Building2, SplitSquareHorizontal, AlertTriangle, Package, Wrench } from 'lucide-react';

// Mostra "quanto vai pra cada CNPJ" a partir do motor de rateio (Fase 3).
export default function RateioCnpjPanel({ os }) {
  const [filiais, setFiliais] = useState([]);

  useEffect(() => {
    base44.entities.Filial.list().then(setFiliais).catch(() => setFiliais([]));
  }, []);

  const resultado = calcularRateio(os, filiais);
  const semRegra = !os?.distribuicao_faturamento?.modo;
  const iconeBloco = (chave) => (chave === 'pecas' ? Package : chave === 'servicos' ? Wrench : Building2);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {resultado.modo === 'dividido'
          ? <><SplitSquareHorizontal className="w-3.5 h-3.5" /> Faturamento dividido por tipo</>
          : <><Building2 className="w-3.5 h-3.5" /> Faturamento em CNPJ único</>}
      </div>

      {semRegra && (
        <div className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Regra de rateio não definida na OS — usando CNPJ único como padrão.
        </div>
      )}

      <div className={`grid gap-3 ${resultado.blocos.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
        {resultado.blocos.map((bloco) => {
          const Icone = iconeBloco(bloco.chave);
          return (
            <div key={bloco.chave} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary">
                    <Icone className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{rotuloBloco(bloco.chave)}</p>
                    <p className="text-[11px] text-muted-foreground">{bloco.quantidade_itens} {bloco.quantidade_itens === 1 ? 'item' : 'itens'}</p>
                  </div>
                </div>
                <div className="text-right">
                  {bloco.nome ? (
                    <>
                      <p className="text-xs font-medium">{bloco.nome}</p>
                      {bloco.cnpj && <p className="text-[11px] text-muted-foreground font-mono">{bloco.cnpj}</p>}
                    </>
                  ) : (
                    <span className="text-[11px] text-amber-600 font-medium">CNPJ não definido</span>
                  )}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Bruto</span><span>{formatCurrency(bloco.valor_bruto)}</span></div>
                {bloco.valor_desconto > 0 && (
                  <div className="flex justify-between text-destructive"><span>Desconto (rateado)</span><span>− {formatCurrency(bloco.valor_desconto)}</span></div>
                )}
                <div className="flex justify-between pt-1 border-t font-semibold">
                  <span>Vai para este CNPJ</span>
                  <span className="text-primary">{formatCurrency(bloco.valor_liquido)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center rounded-lg bg-muted/50 px-4 py-2.5 text-sm">
        <span className="text-muted-foreground">Total líquido da OS</span>
        <strong className="text-primary text-base">{formatCurrency(resultado.total_liquido)}</strong>
      </div>
    </div>
  );
}