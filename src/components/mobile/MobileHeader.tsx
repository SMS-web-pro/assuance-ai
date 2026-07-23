
import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface MobileHeaderProps {
  showBackButton?: boolean;
  onBack?: () => void;
  title?: string;
}

const MobileHeader = ({ showBackButton = false, onBack, title = "Menu" }: MobileHeaderProps) => {
  const { setOpenMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile sidebar when route changes
  useEffect(() => {
    setOpenMobile(false);
  }, [location.pathname, location.search, setOpenMobile]);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center">
        <SidebarTrigger className="p-2 hover:bg-gray-100 rounded-md" />
        <span className="ml-3 font-semibold text-gray-900 text-base">{title}</span>
      </div>
      {showBackButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackClick}
          className="flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Accueil
        </Button>
      )}
    </div>
  );
};

export default MobileHeader;
