import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Calendar } from 'lucide-react';

const PRESETS = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: '180', label: 'Últimos 6 meses' },
  { value: '365', label: 'Último ano' },
  { value: 'custom', label: 'Personalizado' },
];

export default function BiFiltros({ preset, onPreset, dataInicio, dataFim, onDataInicio, onDataFim, onExportar }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <Select value={preset} onValueChange={onPreset}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PRESETS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {preset === 'custom' && (
        <div className="flex items-center gap-2">
          <Input type="date" value={dataInicio} onChange={(e) => onDataInicio(e.target.value)} className="w-[150px]" />
          <span className="text-muted-foreground text-sm">até</span>
          <Input type="date" value={dataFim} onChange={(e) => onDataFim(e.target.value)} className="w-[150px]" />
        </div>
      )}

      <Button variant="outline" onClick={onExportar} className="sm:ml-auto">
        <Download className="w-4 h-4 mr-2" /> Exportar CSV
      </Button>
    </div>
  );
}