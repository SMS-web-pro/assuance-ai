import { useState } from "react";
import { Home, Users, FileText, Calendar, BarChart, Settings, Bell, MessageSquare, ClipboardList, Target, TrendingUp, LogOut, Shield, ExternalLink } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
const mainItems = [{
  title: "Tableau de bord",
  url: "/conseiller-dashboard",
  icon: Home
}, {
  title: "Mes Demandes",
  url: "/conseiller-dashboard/demandes",
  icon: FileText
}, {
  title: "Mes Clients",
  url: "/conseiller-dashboard/clients",
  icon: Users
}, {
  title: "Calendrier",
  url: "/conseiller-dashboard/calendrier",
  icon: Calendar
}, {
  title: "Statistiques",
  url: "/conseiller-dashboard/stats",
  icon: BarChart
}];
const settingsItems = [{
  title: "Paramètres",
  url: "/conseiller-dashboard/parametres",
  icon: Settings
}];
export function ConseillerSidebar() {
  const {
    state
  } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const isActive = (url: string) => {
    if (url === "/conseiller-dashboard") {
      return currentPath === url;
    }
    return currentPath.startsWith(url);
  };
  const handleLogout = () => {
    localStorage.removeItem('conseiller_session');
    window.location.href = "/conseiller";
  };
  const openAdminPanel = () => {
    window.open('/admin', '_blank');
  };
  return <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="offcanvas">
      <SidebarHeader className="p-4">
        {!collapsed && <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Panel Conseiller</h2>
              <p className="text-xs text-muted-foreground">Espace professionnel</p>
            </div>
          </div>}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Configuration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && <div className="space-y-2">
            
            
            <button onClick={handleLogout} className="flex items-center gap-2 w-full p-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors">
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>}
      </SidebarFooter>
    </Sidebar>;
}