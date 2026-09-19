import { base44 } from '@/api/base44Client';

// Perfis autorizados a ver dados financeiros de remuneração.
// A base ao admin do Base44; perfis extras podem ser marcados via User.perfil_financeiro.
export async function podeVerRemuneracao() {
  try {
    const user = await base44.auth.me();
    if (!user) return false;
    if (user.role === 'admin') return true;
    return ['financeiro', 'proprietario'].includes(user.perfil_financeiro);
  } catch {
    return false;
  }
}