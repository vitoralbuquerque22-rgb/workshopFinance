import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/format';
import { disponivel, curvaColor, precisaRepor } from '@/lib/estoque';
import { Search, AlertTriangle } from 'lucide-react';

export default function EstoqueVisaoGeral({ pecas, abcMap, onRowClick }) {
  const [search, setSearch] = useState('');
  const [curva, setCurva] = useState('all');

  const filtradas = pecas.filter((p) => {
    const s = !search || p.codigo?.toLowerCase().includes(search.toLowerCase()) || p.descricao?.toLowerCase().includes(search.toLowerCase());
    const c = curva === 'all' || abcMap[p.id] === curva;
    return s && c;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar peça..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={curva} onValueChange={setCurva}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Curva ABC" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as curvas</SelectItem>
            <SelectItem value="A">Curva A</SelectItem>
            <SelectItem value="B">Curva B</SelectItem>
            <SelectItem value="C">Curva C</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-center">ABC</TableHead>
                <TableHead className="text-right">Atual</TableHead>
                <TableHead className="text-right">Reserv.</TableHead>
                <TableHead className="text-right">Consig.</TableHead>
                <TableHead className="text-right">Disponível</TableHead>
                <TableHead className="text-right">Mín/Máx</TableHead>
                <TableHead className="text-right">Custo Médio</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Nenhuma peça.</TableCell></TableRow>
              ) : filtradas.map((p) => {
                const disp = disponivel(p);
                const abc = abcMap[p.id];
                return (
                  <TableRow key={p.id} onClick={() => onRowClick?.(p)} className={onRowClick ? 'cursor-pointer hover:bg-accent/50' : ''}>
                    <TableCell className="font-mono text-xs">{p.codigo}</TableCell>
                    <TableCell className="font-medium">{p.descricao}</TableCell>
                    <TableCell className="text-center">
                      {abc && <Badge variant="outline" className={curvaColor[abc]}>{abc}</Badge>}
                    </TableCell>
                    <TableCell className="text-right">{p.estoque_atual || 0}</TableCell>
                    <TableCell className="text-right text-amber-600">{p.estoque_reservado || 0}</TableCell>
                    <TableCell className="text-right text-blue-600">{p.estoque_consignado || 0}</TableCell>
                    <TableCell className="text-right font-semibold">
                      <span className={precisaRepor(p) ? 'text-red-600' : ''}>{disp}</span>
                      {precisaRepor(p) && <AlertTriangle className="inline h-3 w-3 text-red-500 ml-1" />}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{p.estoque_minimo || 0} / {p.estoque_maximo || 0}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.valor_custo_medio)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency((p.estoque_atual || 0) * (p.valor_custo_medio || 0))}</TableCell>
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