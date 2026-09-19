import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import OcorrenciaCard from './OcorrenciaCard';

export default function AbaOcorrencias({ ocorrencias, onNova, onResolver, onAbrir }) {
  const [filtro, setFiltro] = useState('abertas');

  const lista = ocorrencias
    .filter((o) => filtro === 'todas' ? true : filtro === 'abertas' ? (o.status === 'aberta' || o.status === 'em_tratamento') : o.status === filtro)
    .sort((a, b) => (b.data_ocorrencia || '').localeCompare(a.data_ocorrencia || ''));

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4 gap-2">
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="abertas">Abertas</SelectItem>
              <SelectItem value="resolvida">Resolvidas</SelectItem>
              <SelectItem value="todas">Todas</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={onNova}><Plus className="w-4 h-4 mr-1" />Nova ocorrência</Button>
        </div>
        {lista.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">Nenhuma ocorrência.</p>
        ) : (
          <div className="space-y-2">
            {lista.map((o) => <OcorrenciaCard key={o.id} ocorrencia={o} onResolver={onResolver} onEditar={onAbrir} />)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}