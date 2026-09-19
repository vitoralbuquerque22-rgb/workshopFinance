import { UserMinus, UserPlus, Users } from 'lucide-react';

export default function PainelTecnicos({ carga }) {
  const { ociosos, sobrecarregados } = carga;
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-heading font-semibold text-sm">Técnicos</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-2 text-amber-600">
            <UserMinus className="w-4 h-4" />
            <p className="text-xs font-medium">Ociosos ({ociosos.length})</p>
          </div>
          {ociosos.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum</p>
          ) : (
            <ul className="space-y-1">
              {ociosos.map((t) => (
                <li key={t.nome} className="text-xs flex justify-between">
                  <span className="truncate">{t.nome}</span>
                  <span className="text-muted-foreground shrink-0 ml-2">{t.horasPrevistas}h</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-2 text-red-600">
            <UserPlus className="w-4 h-4" />
            <p className="text-xs font-medium">Sobrecarregados ({sobrecarregados.length})</p>
          </div>
          {sobrecarregados.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum</p>
          ) : (
            <ul className="space-y-1">
              {sobrecarregados.map((t) => (
                <li key={t.nome} className="text-xs flex justify-between">
                  <span className="truncate">{t.nome}</span>
                  <span className="text-red-600 font-medium shrink-0 ml-2">{t.carga}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}