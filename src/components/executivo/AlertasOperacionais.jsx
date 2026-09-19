import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Ban, PackageX, CheckCircle2, ArrowRight } from 'lucide-react';

// Painel de pendências que exigem ação — alimentado pelas listas do agregador.
export default function AlertasOperacionais({ dados }) {
  const { listas, ferramentasPendentes } = dados;

  const blocos = [
    {
      titulo: 'Auditorias pendentes', icon: ClipboardCheck, to: '/auditorias',
      itens: listas.auditoriasPendentes.map((a) => ({ id: a.id, txt: a.numero || a.titulo || 'Auditoria', tag: a.status })),
    },
    {
      titulo: 'Equipamentos parados', icon: Ban, to: '/equipamentos',
      itens: listas.equipamentosParados.map((p) => ({ id: p.id, txt: p.nome, tag: p.status })),
    },
  ];

  const totalPend = listas.auditoriasPendentes.length + listas.equipamentosParados.length + ferramentasPendentes;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Pendências operacionais</CardTitle>
        {totalPend === 0 && <Badge className="bg-emerald-100 text-emerald-700 gap-1"><CheckCircle2 className="w-3 h-3" />Tudo em dia</Badge>}
      </CardHeader>
      <CardContent className="space-y-5">
        {ferramentasPendentes > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <PackageX className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800 flex-1">{ferramentasPendentes} ferramenta(s) não devolvida(s) em atendimentos concluídos.</p>
            <Link to="/atendimento-externo" className="text-amber-700"><ArrowRight className="w-4 h-4" /></Link>
          </div>
        )}
        {blocos.map((b) => (
          <div key={b.titulo}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <b.icon className="w-4 h-4 text-muted-foreground" />
                {b.titulo}
                <Badge variant="secondary">{b.itens.length}</Badge>
              </div>
              <Link to={b.to} className="text-xs text-primary hover:underline flex items-center gap-1">Ver todos <ArrowRight className="w-3 h-3" /></Link>
            </div>
            {b.itens.length === 0 ? (
              <p className="text-xs text-muted-foreground pl-6">Nenhuma pendência.</p>
            ) : (
              <div className="space-y-1">
                {b.itens.slice(0, 5).map((i) => (
                  <div key={i.id} className="flex items-center justify-between text-sm pl-6 py-1">
                    <span className="truncate">{i.txt}</span>
                    <Badge variant="outline" className="text-xs shrink-0 ml-2">{i.tag}</Badge>
                  </div>
                ))}
                {b.itens.length > 5 && <p className="text-xs text-muted-foreground pl-6">+{b.itens.length - 5} outros</p>}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}