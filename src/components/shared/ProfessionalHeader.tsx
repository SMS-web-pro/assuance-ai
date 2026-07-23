
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Users, Shield, ExternalLink } from "lucide-react";
import { AdminChatSimple } from "@/components/admin/AdminChatSimple";
import { ConseillerChatSimple } from "@/components/conseiller/ConseillerChatSimple";

interface ProfessionalHeaderProps {
  title: string;
  userInfo: {
    name: string;
    role: 'conseiller' | 'admin';
    email?: string;
    specialite?: string;
  };
}

export const ProfessionalHeader = ({
  title,
  userInfo
}: ProfessionalHeaderProps) => {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-6 w-full">
      {/* Section gauche - Informations principales */}
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="flex items-center gap-3">
          {userInfo.role === 'conseiller' ? (
            <Users className="w-6 h-6 text-blue-600" />
          ) : (
            <Shield className="w-6 h-6 text-gray-800" />
          )}
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {title}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">{userInfo.name}</span>
              {userInfo.specialite && (
                <>
                  <span>•</span>
                  <span className="text-blue-600">{userInfo.specialite}</span>
                </>
              )}
              {userInfo.email && !userInfo.specialite && (
                <>
                  <span>•</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Section droite - Chat */}
      <div className="flex items-center gap-4">
        {userInfo.role === 'admin' ? <AdminChatSimple /> : <ConseillerChatSimple />}
      </div>
    </header>
  );
};
