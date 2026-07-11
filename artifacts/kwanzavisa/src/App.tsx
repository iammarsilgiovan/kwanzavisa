import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminPedidos from "./pages/admin/Pedidos";
import AdminClientesList from "./pages/admin/ClientesList";
import AdminClienteDetail from "./pages/admin/ClienteDetail";
import AdminCambio from "./pages/admin/Cambio";
import AdminRelatorios from "./pages/admin/Relatorios";
import AdminSaldos from "./pages/admin/Saldos";
import FAQ from "./pages/FAQ";
import Termos from "./pages/Termos";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, ...rest }: any) {
  return (
    <Route 
      {...rest} 
      component={(props) => {
        if (localStorage.getItem('kv_admin_auth') !== 'true') {
          window.location.href = "/admin";
          return null;
        }
        return <Component {...props} />;
      }} 
    />
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/ajuda" component={FAQ} />
      <Route path="/termos" component={Termos} />
      <Route path="/admin" component={Admin} />
      <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} />
      <ProtectedRoute path="/admin/pedidos" component={AdminPedidos} />
      <ProtectedRoute path="/admin/clientes" component={AdminClientesList} />
      <ProtectedRoute path="/admin/clientes/:email" component={AdminClienteDetail} />
      <ProtectedRoute path="/admin/cambio" component={AdminCambio} />
      <ProtectedRoute path="/admin/relatorios" component={AdminRelatorios} />
      <ProtectedRoute path="/admin/saldos" component={AdminSaldos} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
