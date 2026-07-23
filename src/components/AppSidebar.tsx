import { useState } from "react";
import { Home, Users, FileText, Settings, Car, House, Heart, Bike, CreditCard, Plane } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar } from "@/components/ui/sidebar";

const mainItems = [{
  title: "Accueil",
  url: "/",
  icon: Home
}, {
  title: "À propos",
  url: "/prospect?page=about",
  icon: FileText
}, {
  title: "Aide",
  url: "/prospect?page=help",
  icon: Settings
}];

const insuranceItems = [{
  title: "Assurance Auto",
  url: "/prospect?type=auto",
  icon: Car
}, {
  title: "Assurance Habitation",
  url: "/prospect?type=habitation",
  icon: House
}, {
  title: "Assurance Santé",
  url: "/prospect?type=sante",
  icon: Heart
}, {
  title: "Assurance Moto",
  url: "/prospect?type=moto",
  icon: Bike
}, {
  title: "Assurance Emprunteur",
  url: "/prospect?type=emprunteur",
  icon: CreditCard
}, {
  title: "Assurance Voyage",
  url: "/prospect?type=voyage",
  icon: Plane
}];

export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const currentSearch = location.search;
  const fullPath = currentPath + currentSearch;
  const collapsed = state === "collapsed";
  const isActive = (url: string) => {
    // Pour la page d'accueil
    if (url === "/" && currentPath === "/") return true;

    // Pour /prospect sans paramètres
    if (url === "/prospect" && currentPath === "/prospect" && !currentSearch) return true;

    // Pour les liens avec paramètres (types d'assurance)
    if (url.includes("?")) {
      return fullPath === url;
    }

    // Pour les autres liens
    if (!url.includes("?") && currentPath === url && url !== "/") return true;
    return false;
  };
  return <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="offcanvas">
      <SidebarHeader className="p-4">
        {!collapsed && <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">AssuranceIA</h2>
              <p className="text-xs text-muted-foreground">Votre conseiller digital</p>
            </div>
          </div>}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
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
          <SidebarGroupLabel>Types d'Assurance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {insuranceItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Copyright en bas du sidebar */}
        <div className="mt-auto p-4">
          {!collapsed && <p className="text-xs text-muted-foreground text-center">© 2025 AssuranceIA. Tous droits réservés.</p>}
        </div>
      </SidebarContent>
    </Sidebar>;
}
