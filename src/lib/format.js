export const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export const formatCompact = (value) => {
  const num = value || 0;
  if (Math.abs(num) >= 1000) {
    return 'R$ ' + new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
  }
  return formatCurrency(num);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('pt-BR');
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const monthNamesFull = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];