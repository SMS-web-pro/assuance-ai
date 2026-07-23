import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MetaPixel } from "@/components/MetaPixel";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cookies from "./pages/Cookies";
import Legal from "./pages/Legal";
import Admin from "./pages/Admin";
import Prospect from "./pages/Prospect";
import NotFound from "./pages/NotFound";
import ConseillerLogin from "./pages/ConseillerLogin";
import ConseillerDashboard from "./pages/ConseillerDashboard";
import ConseilleurDemandes from "./pages/conseiller/ConseilleurDemandes";
import ConseilleurClients from "./pages/conseiller/ConseilleurClients";
import ConseilleurCalendrier from "./pages/conseiller/ConseilleurCalendrier";
import ConseilleurStats from "./pages/conseiller/ConseilleurStats";
import ConseilleurMessages from "./pages/conseiller/ConseilleurMessages";
import ConseilleurTaches from "./pages/conseiller/ConseilleurTaches";
import ConseilleurObjectifs from "./pages/conseiller/ConseilleurObjectifs";
import ConseilleurPerformance from "./pages/conseiller/ConseilleurPerformance";
import ConseilleurNotifications from "./pages/conseiller/ConseilleurNotifications";
import ConseilleurParametres from "./pages/conseiller/ConseilleurParametres";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <MetaPixel />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/help" element={<Help />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/prospect" element={<Prospect />} />
          <Route path="/conseiller" element={<ConseillerLogin />} />
          <Route path="/conseiller-dashboard" element={<ConseillerDashboard />} />
          <Route path="/conseiller-dashboard/demandes" element={<ConseilleurDemandes />} />
          <Route path="/conseiller-dashboard/clients" element={<ConseilleurClients />} />
          <Route path="/conseiller-dashboard/calendrier" element={<ConseilleurCalendrier />} />
          <Route path="/conseiller-dashboard/stats" element={<ConseilleurStats />} />
          <Route path="/conseiller-dashboard/messages" element={<ConseilleurMessages />} />
          <Route path="/conseiller-dashboard/taches" element={<ConseilleurTaches />} />
          <Route path="/conseiller-dashboard/objectifs" element={<ConseilleurObjectifs />} />
          <Route path="/conseiller-dashboard/performance" element={<ConseilleurPerformance />} />
          <Route path="/conseiller-dashboard/notifications" element={<ConseilleurNotifications />} />
          <Route path="/conseiller-dashboard/parametres" element={<ConseilleurParametres />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
