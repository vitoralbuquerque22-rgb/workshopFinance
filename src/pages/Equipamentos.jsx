import PatrimonioLista from '@/components/patrimonio/PatrimonioLista';

export default function Equipamentos() {
  return (
    <PatrimonioLista
      tipoFixo="equipamento"
      titulo="Equipamentos"
      descricao="Controle de equipamentos — scanners, máquinas e aparelhos de diagnóstico"
    />
  );
}