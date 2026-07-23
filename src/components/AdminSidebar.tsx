import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from "@/components/ui/sidebar";
import { BarChart3, Users, MessageSquare, Settings, Calendar, Clock, Archive, FileText, LogOut, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { toast } from "sonner";
interface AdminSidebarProps {
  onTabChange: (tab: string) => void;
  activeTab: string;
}
const AdminSidebar = ({
  onTabChange,
  activeTab
}: AdminSidebarProps) => {
  const {
    logout,
    adminSession
  } = useAdminAuth();
  const menuItems = [{
    id: "dashboard",
    label: "Tableau de bord",
    icon: BarChart3
  }, {
    id: "demandes",
    label: "Demandes",
    icon: MessageSquare
  }, {
    id: "rappels",
    label: "Rappels",
    icon: Calendar
  }, {
    id: "conseillers",
    label: "Conseillers",
    icon: Users
  }, {
    id: "archives",
    label: "Archives",
    icon: Archive
  }, {
    id: "reglages",
    label: "Réglages",
    icon: Settings
  }];
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Déconnexion réussie");
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    }
  };
  const openConseillerPanel = () => {
    window.open('/conseiller-dashboard', '_blank');
  };
  return <Sidebar>
      <SidebarHeader>
        <div className="p-4 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Administration</h2>
            <p className="text-xs text-muted-foreground">AssuranceIA</p>
            
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map(item => <SidebarMenuItem key={item.id}>
              <SidebarMenuButton onClick={() => onTabChange(item.id)} isActive={activeTab === item.id} className="w-full justify-start">
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </SidebarMenuButton>
            </SidebarMenuItem>)}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-4 space-y-2">
          
          
          <Button onClick={handleLogout} variant="outline" className="w-full flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>;
};
export { AdminSidebar };