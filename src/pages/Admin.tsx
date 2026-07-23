
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MessageSquare, ArrowUp, Settings } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ProfessionalHeader } from "@/components/shared/ProfessionalHeader";
import ConseillersManagement from "@/components/admin/ConseillersManagement";
import DemandesManagement from "@/components/admin/DemandesManagement";
import Dashboard from "@/components/admin/Dashboard";
import SettingsPage from "@/components/admin/Settings";
import RemindersCalendar from "@/components/admin/RemindersCalendar";
import ArchivesManagement from "@/components/admin/ArchivesManagement";
import AdminLogin from "@/components/admin/AdminLogin";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { NotificationPermissionButton } from "@/components/NotificationPermissionButton";
import NotificationBar from "@/components/NotificationBar";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { isAuthenticated, isLoading, adminSession } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 w-full flex overflow-hidden">
        <AdminSidebar onTabChange={setActiveTab} activeTab={activeTab} />
        <SidebarInset className="flex-1 min-w-0 overflow-hidden">
          <div className="flex flex-col h-screen">
            <div className="flex items-center justify-between border-b bg-white px-4 py-2 flex-shrink-0">
              <ProfessionalHeader 
                title="Administration"
                userInfo={{
                  name: adminSession?.email?.split('@')[0] || 'Admin',
                  role: 'admin',
                  email: adminSession?.email
                }}
              />
            </div>
            
            {/* Barre de notifications */}
            <div className="bg-gray-50 border-b px-4 py-2 flex-shrink-0">
              <NotificationBar />
            </div>
            
            {/* Contenu principal avec défilement vertical uniquement */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="w-full min-w-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsContent value="dashboard" className="mt-0 w-full">
                    <Dashboard />
                  </TabsContent>

                  <TabsContent value="conseillers" className="mt-0 w-full">
                    <div className="container mx-auto px-4 py-8 max-w-full">
                      <ConseillersManagement />
                    </div>
                  </TabsContent>

                  <TabsContent value="demandes" className="mt-0 w-full">
                    <div className="container mx-auto px-4 py-8 max-w-full">
                      <DemandesManagement />
                    </div>
                  </TabsContent>

                  <TabsContent value="rappels" className="mt-0 w-full">
                    <div className="container mx-auto px-4 py-8 max-w-full">
                      <RemindersCalendar />
                    </div>
                  </TabsContent>

                  <TabsContent value="archives" className="mt-0 w-full">
                    <div className="container mx-auto px-4 py-8 max-w-full">
                      <ArchivesManagement />
                    </div>
                  </TabsContent>

                  <TabsContent value="reglages" className="mt-0 w-full">
                    <div className="container mx-auto px-4 py-8 max-w-full">
                      <SettingsPage />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
