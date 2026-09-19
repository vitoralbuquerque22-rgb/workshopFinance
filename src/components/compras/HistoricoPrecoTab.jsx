import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/format';
import { Search, TrendingUp, TrendingDown, Minus, LineChart } from 'lucide-react';

export default function HistoricoPrecoTab({ historico }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return historico.filter((h) => (h.peca_descricao || '').toLowerCase().includes(q) || (h.peca_codigo || '').toLowerCase().includes(q) || (h.fornecedor_nome || '').toLowerCase().includes(q));
  }, [historico, search]);

  // tendência por peça: compara com o registro anterior da mesma peça
  const ordenadoPorPeca = useMemo(() => {
    const byPeca = {};
    [...historico].sort((a, b) => new Date(a.data) - new Date(b.data)).forEach((h) => {
      byPeca[h.peca_id] = byPeca[h.peca_id] || [];
      byPeca[h.peca_id].push(h);
    });
    const trend = {};
    Object.values(byPeca).forEach((arr) => {
      arr.forEach((h, i) => { trend[h.id] = i === 0 ? 0 : h.valor_unitario - arr[i - 1].valor_unitario; });
    });
    return trend;
  }, [historico]);

  if (historico.length === 0) {
    return <div className="flex flex-col items-center py-16 text-center"><LineChart className="w-12 h-12 text-muted-foreground/40 mb-3" /><p className="text-muted-foreground">Nenhum preço registrado ainda</p><p className="text-xs text-muted-foreground mt-1">O histórico é alimentado a cada recebimento de compra.</p></div>;
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar peça ou fornecedor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead><TableHead>Peça</TableHead><TableHead>Fornecedor</TableHead>
                <TableHead className="text-right">Qtd</TableHead><TableHead className="text-right">Valor Unit.</TableHead><TableHead className="text-center">Tendência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((h) => {
                const t = ordenadoPorPeca[h.id] || 0;
                return (
                  <TableRow key={h.id}>
                    <TableCell className="text-xs">{formatDate(h.data)}</TableCell>
                    <TableCell className="text-sm">{h.peca_codigo ? `${h.peca_codigo} · ` : ''}{h.peca_descricao}</TableCell>
                    <TableCell className="text-sm">{h.fornecedor_nome || '—'}</TableCell>
                    <TableCell className="text-right text-sm">{h.quantidade}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(h.valor_unitario)}</TableCell>
                    <TableCell className="text-center">
                      {t > 0 ? <TrendingUp className="h-4 w-4 text-red-500 inline" /> : t < 0 ? <TrendingDown className="h-4 w-4 text-emerald-500 inline" /> : <Minus className="h-4 w-4 text-muted-foreground inline" />}
                    </TableCell>
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