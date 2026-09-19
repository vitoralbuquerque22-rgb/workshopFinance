import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoveVertical, Plus, Edit, Trash2, Wrench } from 'lucide-react';

const STATUS_INFO = {
  livre: { label: 'Livre', cls: 'border-green-500/40 bg-green-500/5', dot: 'bg-green-500' },
  ocupado: { label: 'Ocupado', cls: 'border-blue-500/40 bg-blue-500/5', dot: 'bg-blue-500' },
  manutencao: { label: 'Manutenção', cls: 'border-amber-500/40 bg-amber-500/5', dot: 'bg-amber-500' },
  inativo: { label: 'Inativo', cls: 'border-border bg-muted/30 opacity-70', dot: 'bg-muted-foreground' },
};

const TIPO_LABEL = { elevador: 'Elevador', box: 'Box', rampa: 'Rampa', fosso: 'Fosso', area_externa: 'Área Externa' };

export default function ElevadoresPainel({ elevadores, ordens, onNovo, onEditar, onExcluir, onStatus }) {
  const osInfo = (id) => {
    const o = ordens.find((x) => x.id === id);
    return o ? (o.numero || `OS-${o.id.slice(-6)}`) : null;
  };

  if (elevadores.length === 0) {
    return (
      <Card className="p-10 flex flex-col items-center justify-center text-center gap-3">
        <MoveVertical className="w-10 h-10 text-muted-foreground/50" />
        <p className="text-muted-foreground">Nenhum posto de trabalho cadastrado</p>
        <Button onClick={onNovo}><Plus className="w-4 h-4" /> Cadastrar Elevador/Box</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={onNovo}><Plus className="w-4 h-4" /> Novo Posto</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {elevadores.map((el) => {
          const info = STATUS_INFO[el.status] || STATUS_INFO.livre;
          return (
            <Card key={el.id} className={`p-4 border ${info.cls}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-background border border-border">
                    <MoveVertical className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{el.nome}</p>
                    <p className="text-[11px] text-muted-foreground">{TIPO_LABEL[el.tipo] || el.tipo} · {el.especialidade}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${info.dot}`} />
                  <span className="text-xs font-medium">{info.label}</span>
                </div>
              </div>

              {el.status === 'ocupado' && el.ordem_servico_id && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Wrench className="w-3 h-3" /> {osInfo(el.ordem_servico_id) || 'OS em execução'}
                  {el.tecnico_atual && ` · ${el.tecnico_atual}`}
                </p>
              )}

              <div className="flex items-center gap-2 mt-3">
                <Select value={el.status} onValueChange={(v) => onStatus(el, v)}>
                  <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="livre">Livre</SelectItem>
                    <SelectItem value="ocupado">Ocupado</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEditar(el)}><Edit className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onExcluir(el.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}