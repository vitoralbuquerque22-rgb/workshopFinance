// Normalização e validação de placas (Mercosul e modelo antigo)
export function normalizarPlaca(placa) {
  return (placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function placaValida(placa) {
  const p = normalizarPlaca(placa);
  // ABC1234 (antigo) ou ABC1D23 (Mercosul)
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(p);
}

export function formatarPlaca(placa) {
  const p = normalizarPlaca(placa);
  if (p.length === 7) return `${p.slice(0, 3)}-${p.slice(3)}`;
  return p;
}