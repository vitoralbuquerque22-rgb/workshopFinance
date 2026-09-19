import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Instagram, Facebook, Unplug, TriangleAlert } from 'lucide-react';
import { CANAIS_META, STATUS_CANAL } from '@/lib/canais';
import CanalOficialForm from './CanalOficialForm';
import CanalQrCode from './CanalQrCode';

const ICONES = {
  whatsapp: MessageCircle,
  instagram: Instagram,
  messenger: Facebook,
};

// Card de um canal: cabeçalho com status + abas Oficial / QR Code.
export default function CanalCard({ canalTipo, canal, empresaId, onChange }) {
  const meta = CANAIS_META[canalTipo];
  const Icone = ICONES[canalTipo];
  const status = STATUS_CANAL[canal?.status || 'desconectado'];
  const [aba, setAba] = useState(canal?.modo_conexao === 'qrcode' ? 'qrcode' : 'oficial');

  const desconectar = async () => {
    if (!canal?.id) return;
    const res = await base44.functions.invoke('manageCanais', { action: 'desconectar', canal_id: canal.id });
    onChange?.(res.data.canal);
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${meta.bg} flex items-center justify-center`}>
            <Icone className={`w-5 h-5 ${meta.cor}`} />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-sm">{meta.label}</h3>
            <p className="text-xs text-muted-foreground">{meta.descricao}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${status.cor}`}>{status.label}</span>
          {canal?.id && canal.status !== 'desconectado' && (
            <Button variant="ghost" size="icon" onClick={desconectar} title="Desconectar">
              <Unplug className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {canal?.status === 'erro' && canal?.erro_detalhe && (
        <div className="px-4 pt-3">
          <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
            <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{canal.erro_detalhe}</span>
          </div>
        </div>
      )}

      <div className="p-4">
        <Tabs value={aba} onValueChange={setAba}>
          <TabsList className="mb-4">
            <TabsTrigger value="oficial">API Oficial</TabsTrigger>
            <TabsTrigger value="qrcode">QR Code</TabsTrigger>
          </TabsList>
          <TabsContent value="oficial">
            <CanalOficialForm canal={canal} canalTipo={canalTipo} empresaId={empresaId} onSaved={onChange} />
          </TabsContent>
          <TabsContent value="qrcode">
            <CanalQrCode canal={canal} canalTipo={canalTipo} empresaId={empresaId} onSaved={onChange} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}