import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/format';
import { disponivel, sugestaoCompra, curvaColor } from '@/lib/estoque';
import { ShoppingCart, CheckCircle2 } from 'lucide-react';

export default function SugestaoCompra({ pecas, abcMap, fornNome }) {
  const sugestoes = pecas
    .map((p) => ({ p, qtd: sugestaoCompra(p) }))
    .filter((x) => x.qtd > 0)
    .sort((a, b) => (abcMap[a.p.id] || 'C').localeCompare(abcMap[b.p.id] || 'C'));

  const totalEstimado = sugestoes.reduce((s, x) => s + x.qtd * (x.p.valor_ultima_compra || x.p.valor_custo_medio || 0), 0);

  if (sugestoes.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Nenhuma peça precisa de reposição no momento.</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between bg-primary/5 rounded-lg p-3">
        <div className="flex items-center gap-2 text-sm">
          <ShoppingCart className="w-4 h-4 text-primary" />
          <span><strong>{sugestoes.length}</strong> itens sugeridos para compra</span>
        </div>
        <span className="text-sm font-semibold text-primary">Estimado: {formatCurrency(totalEstimado)}</span>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-center">ABC</TableHead>
                <TableHead className="text-right">Disponível</TableHead>
                <TableHead className="text-right">Mín/Máx</TableHead>
                <TableHead className="text-right">Sugestão</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-right">Custo Est.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sugestoes.map(({ p, qtd }) => {
                const abc = abcMap[p.id];
                const custoEst = qtd * (p.valor_ultima_compra || p.valor_custo_medio || 0);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.codigo}</TableCell>
                    <TableCell className="font-medium">{p.descricao}</TableCell>
                    <TableCell className="text-center">{abc && <Badge variant="outline" className={curvaColor[abc]}>{abc}</Badge>}</TableCell>
                    <TableCell className="text-right text-red-600 font-medium">{disponivel(p)}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{p.estoque_minimo || 0} / {p.estoque_maximo || 0}</TableCell>
                    <TableCell className="text-right font-bold text-primary">{qtd} {p.unidade}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fornNome(p.fornecedor_principal_id)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(custoEst)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}