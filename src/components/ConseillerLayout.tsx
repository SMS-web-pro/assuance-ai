
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ConseillerSidebar } from "@/components/ConseillerSidebar";
import { ProfessionalHeader } from "@/components/shared/ProfessionalHeader";
import NotificationBar from "@/components/NotificationBar";

interface ConseillerSession {
  id: number;
  nom: string;
  email: string;
  specialite?: string;
  auth_user_id?: string;
}

interface ConseillerLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const ConseillerLayout = ({ children, title }: ConseillerLayoutProps) => {
  const [conseillerSession, setConseillerSession] = useState<ConseillerSession | null>(null);

  useEffect(() => {
    const sessionData = localStorage.getItem('conseiller_session');
    if (!sessionData) {
      window.location.href = "/conseiller";
      return;
    }

    try {
      const session = JSON.parse(sessionData);
      setConseillerSession(session);
    } catch (error) {
      console.error('Erreur de session:', error);
      window.location.href = "/conseiller";
    }
  }, []);

  if (!conseillerSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <ConseillerSidebar />
        
        <SidebarInset>
          <ProfessionalHeader 
            title={title}
            userInfo={{
              name: conseillerSession.nom,
              role: 'conseiller',
              specialite: conseillerSession.specialite
            }}
          />

          {/* Barre de notifications */}
          <div className="px-4 py-2 bg-gray-50 border-b">
            <NotificationBar />
          </div>

          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
