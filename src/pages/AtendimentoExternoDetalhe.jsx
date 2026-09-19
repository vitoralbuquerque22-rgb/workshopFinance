import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Pencil, Users, Hammer, Package, MapPin, History, Truck } from 'lucide-react';
import MissaoForm from '@/components/atendimento/MissaoForm';
import PresencaPainel from '@/components/atendimento/PresencaPainel';
import MissaoHistorico from '@/components/atendimento/MissaoHistorico';
import { STATUS_MISSAO, PAPEIS_EQUIPE, carregarApoioMissao } from '@/lib/atendimentoExterno';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { base44 } from '@/api/base44Client';

export default function AtendimentoExternoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [missao, setMissao] = useState(null);
  const [apoio, setApoio] = useState({ colaboradores: [], frota: [], ferramentas: [], pecas: [], clientes: [], veiculos: [] });
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const carregar = async () => {
    const m = await base44.entities.MissaoOperacional.get(id).catch(() => null);
    setMissao(m);
    setLoading(false);
  };

  useEffect(() => {
    carregar();
    carregarApoioMissao().then(setApoio);
  }, [id]);

  if (loading) return <div className="py-20 text-center text-muted-foreground">Carregando...</div>;
  if (!missao) return <div className="py-20 text-center text-muted-foreground">Atendimento não encontrado.</div>;

  const st = STATUS_MISSAO[missao.status] || STATUS_MISSAO.agendado;
  const papelLabel = (p) => PAPEIS_EQUIPE.find((x) => x.value === p)?.label || p;
  const totalPecas = (missao.pecas || []).reduce((s, p) => s + (Number(p.quantidade) || 0) * (Number(p.valor_unitario) || 0), 0);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/atendimento-externo')}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-heading">{missao.titulo}</h1>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
          </div>
          <p className="text-sm text-muted-foreground font-mono">{missao.numero}</p>
        </div>
        <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="w-4 h-4 mr-1" /> Editar</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Informações</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Info label="Cliente" value={missao.cliente_nome} />
            <Info label="Endereço" value={missao.endereco} icon={MapPin} />
            <Info label="Veículo da empresa" value={missao.ativo_frota_nome} icon={Truck} />
            <Info label="Agendado" value={missao.data_agendada ? formatDateTime(missao.data_agendada) : '-'} />
            {missao.descricao && <Info label="Descrição" value={missao.descricao} />}
            {missao.observacoes && <Info label="Observações" value={missao.observacoes} />}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Presença & Geolocalização</CardTitle></CardHeader>
          <CardContent>
            <PresencaPainel missao={missao} onUpdated={carregar} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <Tabs defaultValue="equipe">
            <TabsList>
              <TabsTrigger value="equipe"><Users className="w-4 h-4 mr-1" /> Equipe</TabsTrigger>
              <TabsTrigger value="ferramentas"><Hammer className="w-4 h-4 mr-1" /> Ferramentas</TabsTrigger>
              <TabsTrigger value="pecas"><Package className="w-4 h-4 mr-1" /> Peças</TabsTrigger>
              <TabsTrigger value="historico"><History className="w-4 h-4 mr-1" /> Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="equipe" className="pt-4">
              {(missao.equipe || []).length === 0 ? <Vazio texto="Nenhum membro na equipe." /> : (
                <div className="space-y-2">
                  {missao.equipe.map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="font-medium text-sm">{m.colaborador_nome}</span>
                      <span className="text-xs text-muted-foreground">{papelLabel(m.papel)}</span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="ferramentas" className="pt-4">
              {(missao.ferramentas || []).length === 0 ? <Vazio texto="Nenhuma ferramenta." /> : (
                <div className="space-y-2">
                  {missao.ferramentas.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="font-medium text-sm">{f.nome}{f.codigo_patrimonial ? ` (${f.codigo_patrimonial})` : ''}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${f.devolvida ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{f.devolvida ? 'Devolvida' : 'Em campo'}</span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pecas" className="pt-4">
              {(missao.pecas || []).length === 0 ? <Vazio texto="Nenhuma peça." /> : (
                <div className="space-y-2">
                  {missao.pecas.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="font-medium text-sm">{p.descricao}</span>
                      <span className="text-sm text-muted-foreground">{p.quantidade} × {formatCurrency(p.valor_unitario)}</span>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2 font-medium">Total: {formatCurrency(totalPecas)}</div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="historico" className="pt-4">
              <MissaoHistorico historico={missao.historico} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {editOpen && (
        <MissaoForm open={editOpen} onOpenChange={setEditOpen} missao={missao} apoio={apoio} onSaved={carregar} />
      )}
    </div>
  );
}

function Info({ label, value, icon: Icon }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="flex items-start gap-1">{Icon && <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />}{value}</p>
    </div>
  );
}

function Vazio({ texto }) {
  return <p className="text-sm text-muted-foreground py-6 text-center">{texto}</p>;
}