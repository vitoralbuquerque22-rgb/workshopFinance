import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import AuditoriaCard from '@/components/auditoria/AuditoriaCard';
import NovaAuditoriaDialog from '@/components/auditoria/NovaAuditoriaDialog';
import { TIPOS_AUDITORIA } from '@/lib/auditoria';
import { base44 } from '@/api/base44Client';

export default function Auditorias() {
  const [auditorias, setAuditorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState('todas');
  const [novaOpen, setNovaOpen] = useState(false);

  const carregar = async () => {
    setLoading(true);
    const lista = await base44.entities.Auditoria.list('-created_date', 500).catch(() => []);
    setAuditorias(lista);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const filtradas = aba === 'todas' ? auditorias : auditorias.filter((a) => a.tipo === aba);

  return (
    <div>
      <PageHeader title="Auditorias" description="Controle de materiais utilizados — conferência, pendências e aprovação">
        <Button onClick={() => setNovaOpen(true)}><Plus className="w-4 h-4 mr-1" /> Nova auditoria</Button>
      </PageHeader>

      <Tabs value={aba} onValueChange={setAba}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          {TIPOS_AUDITORIA.map((t) => {
            const Icon = t.icon;
            return <TabsTrigger key={t.value} value={t.value}><Icon className="w-4 h-4 mr-1" /> {t.label}</TabsTrigger>;
          })}
        </TabsList>

        <TabsContent value={aba} className="pt-4">
          {loading ? (
            <div className="py-20 text-center text-muted-foreground">Carregando...</div>
          ) : filtradas.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">Nenhuma auditoria nesta categoria.</div>
          ) : (
            <div className="space-y-3">
              {filtradas.map((a) => <AuditoriaCard key={a.id} auditoria={a} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <NovaAuditoriaDialog open={novaOpen} onOpenChange={setNovaOpen} tipoInicial={aba !== 'todas' ? aba : undefined} onCreated={carregar} />
    </div>
  );
}