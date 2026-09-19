import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, MapPin, Truck, Users } from 'lucide-react';
import MissaoForm from '@/components/atendimento/MissaoForm';
import { STATUS_MISSAO, carregarApoioMissao } from '@/lib/atendimentoExterno';
import { formatDateTime, formatDate } from '@/lib/format';
import { base44 } from '@/api/base44Client';

export default function AtendimentoExterno() {
  const navigate = useNavigate();
  const [missoes, setMissoes] = useState([]);
  const [apoio, setApoio] = useState({ colaboradores: [], frota: [], ferramentas: [], pecas: [], clientes: [], veiculos: [] });
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const carregar = async () => {
    const [lista, ap] = await Promise.all([
      base44.entities.MissaoOperacional.list('-created_date', 500),
      carregarApoioMissao(),
    ]);
    setMissoes(lista);
    setApoio(ap);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const filtradas = missoes.filter((m) => {
    const t = busca.toLowerCase();
    return !t || [m.numero, m.titulo, m.cliente_nome, m.endereco].some((v) => String(v || '').toLowerCase().includes(t));
  });

  return (
    <div>
      <PageHeader title="Atendimento Externo" description="Serviços executados fora da oficina">
        <Button onClick={() => setFormOpen(true)}><Plus className="w-4 h-4 mr-1" /> Novo Atendimento</Button>
      </PageHeader>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por número, título, cliente..." value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº</TableHead>
              <TableHead>Atendimento</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Equipe</TableHead>
              <TableHead>Agendado</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtradas.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Nenhum atendimento externo.</TableCell></TableRow>
            ) : (
              filtradas.map((m) => {
                const st = STATUS_MISSAO[m.status] || STATUS_MISSAO.agendado;
                return (
                  <TableRow key={m.id} className="cursor-pointer" onClick={() => navigate(`/atendimento-externo/${m.id}`)}>
                    <TableCell className="font-mono text-xs">{m.numero || '-'}</TableCell>
                    <TableCell>
                      <p className="font-medium">{m.titulo}</p>
                      {m.endereco && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {m.endereco}</p>}
                    </TableCell>
                    <TableCell className="text-sm">{m.cliente_nome || '-'}</TableCell>
                    <TableCell className="text-sm"><span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5 text-muted-foreground" />{(m.equipe || []).length}</span></TableCell>
                    <TableCell className="text-sm">{m.data_agendada ? formatDateTime(m.data_agendada) : '-'}</TableCell>
                    <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span></TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {formOpen && (
        <MissaoForm open={formOpen} onOpenChange={setFormOpen} apoio={apoio} onSaved={carregar} />
      )}
    </div>
  );
}