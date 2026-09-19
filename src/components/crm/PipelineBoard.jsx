import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { etapas } from '@/lib/crmConfig';
import { formatCompact } from '@/lib/format';
import LeadCard from './LeadCard';

export default function PipelineBoard({ leads, onCardClick, onMove }) {
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;
    onMove(draggableId, destination.droppableId);
  };

  const leadsByEtapa = (etapa) => leads.filter((l) => (l.etapa || 'novo') === etapa);
  const totalEtapa = (etapa) => leadsByEtapa(etapa).reduce((s, l) => s + (l.valor_estimado || 0), 0);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {etapas.map((etapa) => {
          const list = leadsByEtapa(etapa.key);
          return (
            <div key={etapa.key} className="w-[260px] shrink-0 flex flex-col">
              <div className={`rounded-t-lg border px-3 py-2 ${etapa.color}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{etapa.label}</span>
                  <span className="text-xs font-semibold bg-white/60 rounded-full px-2">{list.length}</span>
                </div>
                <p className="text-[11px] opacity-80">{formatCompact(totalEtapa(etapa.key))}</p>
              </div>
              <Droppable droppableId={etapa.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 min-h-[400px] space-y-2 p-2 border border-t-0 rounded-b-lg bg-muted/20 transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}`}
                  >
                    {list.map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(prov) => (
                          <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                            <LeadCard lead={lead} onClick={() => onCardClick(lead)} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {list.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-6">Vazio</p>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}