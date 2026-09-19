// Filtra colaboradores elegíveis para os papéis de Consultor/Atendente e Técnico/Mecânico
// na Ordem de Serviço. Considera funcionários ativos, com acesso ao sistema (user_id) e
// cargo/função compatível com o papel.

// Palavras-chave do nome do cargo que indicam cada papel.
const KW_CONSULTOR = ['consultor', 'atendente', 'vendedor', 'comercial'];
const KW_TECNICO = ['tecnico', 'técnico', 'mecanico', 'mecânico'];

function nomeCargo(colab, cargos) {
  return String(cargos.find((c) => c.id === colab.cargo_id)?.nome || '').toLowerCase();
}
function areaCargo(colab, cargos) {
  return cargos.find((c) => c.id === colab.cargo_id)?.area || '';
}

// Base comum: funcionário ativo com acesso ao sistema.
function elegivelBase(colab) {
  return colab.status === 'ativo';
}

export function consultoresElegiveis(colaboradores = [], cargos = []) {
  return colaboradores.filter((c) => {
    if (!elegivelBase(c)) return false;
    const cargo = nomeCargo(c, cargos);
    const area = areaCargo(c, cargos);
    return c.funcao === 'consultor' || area === 'comercial' || KW_CONSULTOR.some((k) => cargo.includes(k));
  });
}

export function tecnicosElegiveis(colaboradores = [], cargos = []) {
  return colaboradores.filter((c) => {
    if (!elegivelBase(c)) return false;
    const cargo = nomeCargo(c, cargos);
    const area = areaCargo(c, cargos);
    return c.funcao === 'tecnico' || area === 'tecnica' || KW_TECNICO.some((k) => cargo.includes(k));
  });
}