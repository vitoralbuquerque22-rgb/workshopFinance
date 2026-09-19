import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import ContasPagar from '@/pages/ContasPagar';
import ContasReceber from '@/pages/ContasReceber';
import Caixa from '@/pages/Caixa';
import DRE from '@/pages/DRE';
import Orcamento from '@/pages/Orcamento';
import Filiais from '@/pages/Filiais';
import Configuracoes from '@/pages/Configuracoes';
import Fornecedores from '@/pages/Fornecedores';
import NotasFiscais from '@/pages/NotasFiscais';
import ContasBancarias from '@/pages/ContasBancarias';
import Clientes from '@/pages/Clientes';
import OrdensServico from '@/pages/OrdensServico';
import PedidosCompra from '@/pages/PedidosCompra';
import Compras from '@/pages/Compras';
import GpsVendas from '@/pages/GpsVendas';
import Pecas from '@/pages/Pecas';
import Estoque from '@/pages/Estoque';
import MaoObra from '@/pages/MaoObra';
import ServicosCompostos from '@/pages/ServicosCompostos';
import GpsConfig from '@/pages/GpsConfig';
import OrdemServicoDetalhe from '@/pages/OrdemServicoDetalhe';
import OsExcluidas from '@/pages/OsExcluidas';
import Producao from '@/pages/Producao';
import DashboardOperacional from '@/pages/DashboardOperacional';
import BusinessIntelligence from '@/pages/BusinessIntelligence';
import Painel from '@/pages/Painel';
import AssistenteIA from '@/pages/AssistenteIA';
import DashboardFiscal from '@/pages/DashboardFiscal';
import Integracoes from '@/pages/Integracoes';
import Marketing from '@/pages/Marketing';
import MarketingLeads from '@/pages/MarketingLeads';
import MarketingCampanhas from '@/pages/MarketingCampanhas';
import MarketingIntegracoes from '@/pages/MarketingIntegracoes';
import MarketingJornada from '@/pages/MarketingJornada';
import MarketingRelatorios from '@/pages/MarketingRelatorios';
import Remuneracao from '@/pages/Remuneracao';
import RemuneracaoSalarios from '@/pages/RemuneracaoSalarios';
import RemuneracaoComissoes from '@/pages/RemuneracaoComissoes';
import RemuneracaoBonificacoes from '@/pages/RemuneracaoBonificacoes';
import RemuneracaoRegras from '@/pages/RemuneracaoRegras';
import RemuneracaoCargos from '@/pages/RemuneracaoCargos';
import Conversas from '@/pages/Conversas';
import AprovarOrcamento from '@/pages/AprovarOrcamento';
import Canais from '@/pages/Canais';
import ConfigNotificacoes from '@/pages/ConfigNotificacoes';
import AutomacoesMensagem from '@/pages/AutomacoesMensagem';
import PainelAutomacoes from '@/pages/PainelAutomacoes';
import CobrancaAutomatica from '@/pages/CobrancaAutomatica';
import Pagamentos from '@/pages/Pagamentos';
import Patrimonio from '@/pages/Patrimonio';
import Ferramentas from '@/pages/Ferramentas';
import Equipamentos from '@/pages/Equipamentos';
import Frota from '@/pages/Frota';
import AtendimentoExterno from '@/pages/AtendimentoExterno';
import AtendimentoExternoDetalhe from '@/pages/AtendimentoExternoDetalhe';
import Auditorias from '@/pages/Auditorias';
import AuditoriaDetalhe from '@/pages/AuditoriaDetalhe';
import AgendaOperacional from '@/pages/AgendaOperacional';
import DashboardCustos from '@/pages/DashboardCustos';
import DashboardExecutivo from '@/pages/DashboardExecutivo';
import ConfigCustosOperacionais from '@/pages/ConfigCustosOperacionais';
import Rastreamento from '@/pages/Rastreamento';
import RelatorioEmpresas from '@/pages/RelatorioEmpresas';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/contas-pagar" element={<ContasPagar />} />
        <Route path="/contas-receber" element={<ContasReceber />} />
        <Route path="/cobranca-automatica" element={<CobrancaAutomatica />} />
        <Route path="/pagamentos" element={<Pagamentos />} />
        <Route path="/caixa" element={<Caixa />} />
        <Route path="/dre" element={<DRE />} />
        <Route path="/relatorio-empresas" element={<RelatorioEmpresas />} />
        <Route path="/orcamento" element={<Orcamento />} />
        <Route path="/filiais" element={<Filiais />} />
        <Route path="/fornecedores" element={<Fornecedores />} />
        <Route path="/notas-fiscais" element={<NotasFiscais />} />
        <Route path="/dashboard-fiscal" element={<DashboardFiscal />} />
        <Route path="/contas-bancarias" element={<ContasBancarias />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/conversas" element={<Conversas />} />
        <Route path="/ordens-servico" element={<OrdensServico />} />
        <Route path="/ordens-servico/:id" element={<OrdemServicoDetalhe />} />
        <Route path="/os-excluidas" element={<OsExcluidas />} />
        <Route path="/patio" element={<DashboardOperacional />} />
        <Route path="/producao" element={<Producao />} />
        <Route path="/patrimonio" element={<Patrimonio />} />
        <Route path="/ferramentas" element={<Ferramentas />} />
        <Route path="/equipamentos" element={<Equipamentos />} />
        <Route path="/frota" element={<Frota />} />
        <Route path="/atendimento-externo" element={<AtendimentoExterno />} />
        <Route path="/atendimento-externo/:id" element={<AtendimentoExternoDetalhe />} />
        <Route path="/auditorias" element={<Auditorias />} />
        <Route path="/auditorias/:id" element={<AuditoriaDetalhe />} />
        <Route path="/agenda" element={<AgendaOperacional />} />
        <Route path="/custos" element={<DashboardCustos />} />
        <Route path="/rastreamento" element={<Rastreamento />} />
        <Route path="/executivo" element={<DashboardExecutivo />} />
        <Route path="/custos-config" element={<ConfigCustosOperacionais />} />
        <Route path="/painel" element={<Painel />} />
        <Route path="/bi" element={<BusinessIntelligence />} />
        <Route path="/assistente-ia" element={<AssistenteIA />} />
        <Route path="/pedidos-compra" element={<PedidosCompra />} />
        <Route path="/compras" element={<Compras />} />
        <Route path="/gps-vendas" element={<GpsVendas />} />
        <Route path="/marketing" element={<Marketing />} />
        <Route path="/marketing/leads" element={<MarketingLeads />} />
        <Route path="/marketing/campanhas" element={<MarketingCampanhas />} />
        <Route path="/marketing/integracoes" element={<MarketingIntegracoes />} />
        <Route path="/marketing/jornada" element={<MarketingJornada />} />
        <Route path="/marketing/relatorios" element={<MarketingRelatorios />} />
        <Route path="/pecas" element={<Pecas />} />
        <Route path="/estoque" element={<Estoque />} />
        <Route path="/mao-obra" element={<MaoObra />} />
        <Route path="/servicos-compostos" element={<ServicosCompostos />} />
        <Route path="/gps-config" element={<GpsConfig />} />
        <Route path="/integracoes" element={<Integracoes />} />
        <Route path="/remuneracao" element={<Remuneracao />} />
        <Route path="/remuneracao/salarios" element={<RemuneracaoSalarios />} />
        <Route path="/remuneracao/comissoes" element={<RemuneracaoComissoes />} />
        <Route path="/remuneracao/bonificacoes" element={<RemuneracaoBonificacoes />} />
        <Route path="/remuneracao/regras" element={<RemuneracaoRegras />} />
        <Route path="/remuneracao/cargos" element={<RemuneracaoCargos />} />
        <Route path="/canais" element={<Canais />} />
        <Route path="/config-notificacoes" element={<ConfigNotificacoes />} />
        <Route path="/automacoes-mensagem" element={<AutomacoesMensagem />} />
        <Route path="/painel-automacoes" element={<PainelAutomacoes />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Página pública — cliente aprova/assina o orçamento sem login */}
            <Route path="/aprovar-orcamento" element={<AprovarOrcamento />} />
            <Route path="*" element={<AuthenticatedApp />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App